import logging
import json
from fastapi.responses import StreamingResponse
import csv
from io import StringIO

from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime
from database import db
from evaluation.pipeline import evaluate_pipeline

logger = logging.getLogger(__name__)

router = APIRouter()


def resolve_student_id(student_email: str, student_id_from_client: str | None = None) -> str:
    user = db.users.find_one({"email": student_email})
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    register_number = (user.get("register_number") or "").strip()
    if not register_number:
        raise HTTPException(
            status_code=400,
            detail="Registration number not found on student profile",
        )

    if student_id_from_client is not None:
        client_id = str(student_id_from_client).strip()
        if client_id and client_id != register_number:
            raise HTTPException(
                status_code=400,
                detail="Student ID does not match registration number on profile",
            )

    return register_number


def normalize_question_id(question_id):
    if str(question_id).isdigit():
        return int(question_id)
    return question_id


# SUBMIT ASSESSMENT
@router.post("/submit")
def submit_assessment(data: dict):

    existing_submission = db.StudentSubmission.find_one(
        {
            "assessment_id": data["assessment_id"],
            "student_email": data["student_email"]
        }
    )

    if existing_submission:
        return {"message": "Assessment Already Submitted"}

    student_id = resolve_student_id(
        data["student_email"],
        data.get("student_id"),
    )

    submission = {
        "assessment_id": data["assessment_id"],
        "student_email": data["student_email"],
        "student_id": student_id,
        "submitted_at": datetime.now(),
        "status": "Pending Evaluation",
        "final_marks": 0
    }

    result = db.StudentSubmission.insert_one(submission)
    submission_id = str(result.inserted_id)

    answers = data.get("answers", {})

    for question_id, answer_text in answers.items():
        stored_question_id = normalize_question_id(question_id)

        db.StudentAnswer.insert_one({
            "student_id": student_id,
            "assessment_id": data["assessment_id"],
            "question_id": stored_question_id,
            "answer_text": answer_text,
            "word_count": len(answer_text.split())
        })

    return {
        "message": "Assessment Submitted Successfully",
        "student_id": student_id
    }


# GET STUDENT SUBMISSIONS
@router.get("/student/{student_email}")
def get_student_submissions(student_email: str):

    submissions = list(
        db.StudentSubmission.find({"student_email": student_email})
    )

    for submission in submissions:
        submission["_id"] = str(submission["_id"])

    return submissions


# GET ALL SUBMISSIONS
@router.get("/all")
def get_all_submissions():

    submissions = list(db.StudentSubmission.find())
    result = []

    for submission in submissions:
        assessment = db.Assessment.find_one(
            {"_id": ObjectId(submission["assessment_id"])}
        )

        result.append({
            "submission_id": str(submission["_id"]),
            "student_id": submission["student_id"],
            "student_email": submission["student_email"],
            "assessment_id": submission["assessment_id"],
            "assessment_title": assessment["title"] if assessment else "Unknown",
            "submitted_at": submission["submitted_at"],
            "status": submission.get("status", "Pending Evaluation")
        })

    return result


# GET SUBMISSIONS BY ASSESSMENT
@router.get("/assessment/{assessment_id}")
def get_submissions_by_assessment(assessment_id: str):

    submissions = list(
        db.StudentSubmission.find({"assessment_id": assessment_id})
    )

    result = []

    for submission in submissions:
        status = submission.get("status", "Pending Evaluation")

        if status == "Finalized":
            total_marks = submission.get("final_marks", 0)
        else:
            total_marks = 0
            corrections = list(
                db.FacultyCorrection.find({"submission_id": str(submission["_id"])})
            )
            for correction in corrections:
                total_marks += float(correction.get("faculty_marks", 0))

        result.append({
            "submission_id": str(submission["_id"]),
            "student_id": submission["student_id"],
            "student_email": submission["student_email"],
            "status": submission.get("status", "Pending Evaluation"),
            "submitted_at": submission["submitted_at"],
            "final_marks": round(total_marks)
        })

    return result


# VIEW SUBMISSION — student answers only
@router.get("/view/{submission_id}")
def view_submission(submission_id: str):

    submission = db.StudentSubmission.find_one(
        {"_id": ObjectId(submission_id)}
    )

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    student_id = submission["student_id"]
    assessment_id = submission["assessment_id"]

    answers = list(
        db.StudentAnswer.find({
            "student_id": student_id,
            "assessment_id": assessment_id
        })
    )

    result = []
    for answer in answers:
        result.append({
            "question_id": answer["question_id"],
            "answer": answer["answer_text"]
        })

    return result


# REVIEW SUBMISSION — for faculty review page with AI marks
@router.get("/review/{submission_id}")
def review_submission(submission_id: str):

    submission = db.StudentSubmission.find_one(
        
        {"_id": ObjectId(submission_id)}
    )

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    assessment_id = submission["assessment_id"]
    student_id = submission["student_id"]

    questions = list(
        db.Question.find({"assessment_id": assessment_id})
    )

    result = []

    for question in questions:

        answer = db.StudentAnswer.find_one(
            {
                "student_id": student_id,
                "assessment_id": assessment_id,
                "question_id": question["question_id"]
            }
        )

        evaluation = db.EvaluationResult.find_one(
            {
                "student_id": student_id,
                "question_id": question["question_id"],
                "assessment_id": assessment_id
            }
        )
        
        labels_json = []

        if evaluation:
            labels_json = evaluation.get("labels_json", "[]")

            if isinstance(labels_json, str):
                try:
                    labels_json = json.loads(labels_json)
                except:
                    labels_json = []

        correction = db.FacultyCorrection.find_one(
            {
                "submission_id": submission_id,
                "question_id": question["question_id"]
            }
        )

        ai_marks = evaluation.get("suggested_marks", 0) if evaluation else None
        final_marks = correction.get("faculty_marks", ai_marks) if correction else ai_marks

        feedback = []

        if evaluation:
            breakdown = evaluation.get("technical_score_breakdown", {})

            for point, value in breakdown.items():
                value = str(value).lower()

                if "matched" in value and "not matched" not in value:
                    feedback.append(f"✓ {point} present")
                elif "not matched" in value:
                    feedback.append(f"✗ {point} missing")

        result.append({
            "question_id": question["question_id"],
            "question": question.get("question_text", ""),
            "max_marks": question.get("max_marks", 0),
            "ans_length": question.get("ans_length", 0),
            "student_answer": answer["answer_text"] if answer else "",
            "ai_marks": ai_marks,
            "faculty_marks": final_marks,
            "feedback": feedback,
            "labels_json": labels_json
        })

    return result


# EVALUATE SUBMISSION — runs ML pipeline
@router.post("/evaluate/{submission_id}")
def evaluate_submission(submission_id: str):
    try:
        submission = db.StudentSubmission.find_one(
            {"_id": ObjectId(submission_id)}
        )

        if not submission:
            raise HTTPException(status_code=404, detail="Submission not found")

        assessment_id = submission["assessment_id"]
        student_id = submission["student_id"]

        questions = list(
            db.Question.find({"assessment_id": assessment_id})
        )

        question_ids = [q["question_id"] for q in questions]

        logger.info(f"Evaluating submission {submission_id}")
        logger.info(f"Student ID: {student_id}")
        logger.info(f"Assessment ID: {assessment_id}")
        logger.info(f"Question IDs: {question_ids}")

        # Pre-set score=0 for unanswered questions before calling pipeline
        for q in questions:
            answer = db.StudentAnswer.find_one({
                "student_id": student_id,
                "assessment_id": assessment_id,
                "question_id": q["question_id"]
            })
            answer_text = (answer.get("answer_text", "") if answer else "").strip()

            if not answer_text:
                db.EvaluationResult.update_one(
                    {
                        "student_id": student_id,
                        "question_id": q["question_id"],
                        "assessment_id": assessment_id
                    },
                    {
                        "$set": {
                            "suggested_marks": 0,
                            "technical_score_breakdown": {},
                            "skipped": True
                        }
                    },
                    upsert=True
                )
                logger.info(f"Question {q['question_id']} has no answer — set ai_marks=0")

        scores = evaluate_pipeline(
            student_id,
            question_ids,
            assessment_id
        )

        db.StudentSubmission.update_one(
            {"_id": ObjectId(submission_id)},
            {"$set": {"status": "Evaluated"}}
        )

        return {
            "message": "Evaluation Completed",
            "scores": scores
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Evaluation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# SAVE FACULTY CORRECTION
@router.post("/save-correction")
def save_correction(data: dict):

    db.FacultyCorrection.update_one(
        {
            "submission_id": data["submission_id"],
            "question_id": data["question_id"]
        },
        {
            "$set": {
                "ai_marks": data["ai_marks"],
                "faculty_marks": data["faculty_marks"],
                "approved": True
            }
        },
        upsert=True
    )

    corrections = list(
        db.FacultyCorrection.find({"submission_id": data["submission_id"]})
    )
    total = sum(float(c.get("faculty_marks", 0)) for c in corrections)

    db.StudentSubmission.update_one(
        {"_id": ObjectId(data["submission_id"])},
        {"$set": {
            "status": "Finalized",
            "final_marks": round(total)
        }}
    )

    return {"message": "Marks Saved Successfully"}


# GET RESULT LIST FOR STUDENT DASHBOARD
@router.get("/result/{student_email}")
def get_student_results(student_email: str):

    submissions = list(
        db.StudentSubmission.find({"student_email": student_email})
    )

    result = []

    for submission in submissions:

        assessment = db.Assessment.find_one(
            {"_id": ObjectId(submission["assessment_id"])}
        )

        # Only include results where faculty has published
        results_published = assessment.get("results_published", False) if assessment else False

        result.append({
            "submission_id": str(submission["_id"]),
            "assessment_id": submission["assessment_id"],
            "assessment_title": assessment["title"] if assessment else "Unknown",
            "status": submission.get("status", "Pending Evaluation"),
            "final_marks": submission.get("final_marks", 0),
            "submitted_at": submission.get("submitted_at"),
            "results_published": results_published
        })

    return result


# GET DETAILED RESULT FOR A SINGLE SUBMISSION (student view)
@router.get("/student-result/{submission_id}")
def student_result(submission_id: str):

    submission = db.StudentSubmission.find_one(
        {"_id": ObjectId(submission_id)}
    )

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    assessment = db.Assessment.find_one(
        {"_id": ObjectId(submission["assessment_id"])}
    )

    # GATE: block access if faculty hasn't published results yet
    results_published = assessment.get("results_published", False) if assessment else False

    if not results_published:
        return {"results_published": False}

    questions = list(
        db.Question.find({"assessment_id": submission["assessment_id"]})
    )

    result = []
    total_marks = 0

    for question in questions:

        answer = db.StudentAnswer.find_one(
            {
                "student_id": submission["student_id"],
                "assessment_id": submission["assessment_id"],
                "question_id": question["question_id"]
            }
        )

        correction = db.FacultyCorrection.find_one(
            {
                "submission_id": submission_id,
                "question_id": question["question_id"]
            }
        )

        evaluation = db.EvaluationResult.find_one(
            {
                "student_id": submission["student_id"],
                "assessment_id": submission["assessment_id"],
                "question_id": question["question_id"]
            }
        )

        marks = (
            correction.get("faculty_marks", 0)
            if correction
            else evaluation.get("suggested_marks", 0)
            if evaluation
            else 0
        )

        total_marks += float(marks)

        labels_json = []

        if evaluation:
            labels_json = evaluation.get("labels_json", "[]")

            if isinstance(labels_json, str):
                try:
                    labels_json = json.loads(labels_json)
                except:
                    labels_json = []

        
        feedback = []

        if evaluation:
            breakdown = evaluation.get("technical_score_breakdown", {})

            for point, value in breakdown.items():
                value = str(value).lower()

                if "matched" in value and "not matched" not in value:
                    feedback.append(f"✓ {point} present")
                elif "not matched" in value:
                    feedback.append(f"✗ {point} missing")

        result.append({
            "question_id": question["question_id"],
            "question": question.get("question_text", ""),
            "student_answer": answer["answer_text"] if answer else "",
            "marks": marks,
            "max_marks": question.get("max_marks", 0),
            "feedback": feedback,
            "labels_json": labels_json,
            "technical_score_breakdown": (
                evaluation.get("technical_score_breakdown", {})
                if evaluation else {}
            )
    })

    return {
        "results_published": True,
        "assessment_title": assessment["title"] if assessment else "Assessment",
        "status": submission.get("status"),
        "total_marks": round(total_marks),
        "questions": result
    }
    
@router.get("/export-csv/{assessment_id}")
def export_csv(assessment_id: str):

    assessment = db.Assessment.find_one(
        {"_id": ObjectId(assessment_id)}
    )

    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    submissions = list(
        db.StudentSubmission.find(
            {"assessment_id": assessment_id}
        )
    )

    output = StringIO()

    writer = csv.writer(output)

    writer.writerow([
        "S.No",
        "Student Reg No",
        "Assessment Name",
        "Final Marks"
    ])

    for idx, submission in enumerate(submissions, start=1):

        writer.writerow([
            idx,
            submission.get("student_id", ""),
            assessment.get("title", ""),
            submission.get("final_marks", 0)
        ])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition":
            f"attachment; filename={assessment.get('title','assessment')}_marks.csv"
        }
    )