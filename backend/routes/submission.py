import logging
import json
from fastapi.responses import StreamingResponse
import csv
from io import StringIO
import asyncio
from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime
from database import db
from evaluation.pipeline import evaluate_pipeline, main

logger = logging.getLogger(__name__)
router = APIRouter()


def resolve_student_id(student_email: str, student_id_from_client: str | None = None) -> str:
    user = db.users.find_one({"email": student_email})
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")
    register_number = (user.get("register_number") or "").strip()
    if not register_number:
        raise HTTPException(status_code=400, detail="Registration number not found on student profile")
    if student_id_from_client is not None:
        client_id = str(student_id_from_client).strip()
        if client_id and client_id != register_number:
            raise HTTPException(status_code=400, detail="Student ID does not match registration number on profile")
    return register_number


def normalize_question_id(question_id):
    if str(question_id).isdigit():
        return int(question_id)
    return question_id


# ─────────────────────────────────────────────
# RECORD STARTED_AT — called when student opens the assessment
# Frontend calls POST /submission/start as soon as the assessment page loads
# ─────────────────────────────────────────────
@router.post("/start")
def start_assessment(data: dict):
    student_email = data.get("student_email")
    assessment_id = data.get("assessment_id")

    if not student_email or not assessment_id:
        raise HTTPException(status_code=400, detail="student_email and assessment_id are required")

    existing = db.StudentSubmission.find_one({
        "assessment_id": assessment_id,
        "student_email": student_email
    })

    # If already submitted, don't overwrite started_at
    if existing:
        return {"message": "Already submitted", "started_at": existing.get("started_at")}

    # Upsert a draft record with started_at only
    db.AssessmentStart.update_one(
        {"assessment_id": assessment_id, "student_email": student_email},
        {"$setOnInsert": {
            "assessment_id": assessment_id,
            "student_email": student_email,
            "started_at": datetime.now()
        }},
        upsert=True
    )

    start_doc = db.AssessmentStart.find_one({
        "assessment_id": assessment_id,
        "student_email": student_email
    })

    return {"message": "Start time recorded", "started_at": start_doc["started_at"]}


# ─────────────────────────────────────────────
# SUBMIT ASSESSMENT
# ─────────────────────────────────────────────
@router.post("/submit")
def submit_assessment(data: dict):
    existing_submission = db.StudentSubmission.find_one({
        "assessment_id": data["assessment_id"],
        "student_email": data["student_email"]
    })
    if existing_submission:
        return {"message": "Assessment Already Submitted"}

    student_id = resolve_student_id(data["student_email"], data.get("student_id"))

    # Pull started_at from AssessmentStart if available
    start_doc = db.AssessmentStart.find_one({
        "assessment_id": data["assessment_id"],
        "student_email": data["student_email"]
    })
    started_at = start_doc["started_at"] if start_doc else datetime.now()
    submitted_at = datetime.now()

    submission = {
        "assessment_id": data["assessment_id"],
        "student_email": data["student_email"],
        "student_id": student_id,
        "started_at": started_at,
        "submitted_at": submitted_at,
        "status": "Pending Evaluation",
        "final_marks": 0,
        "revaluation_requested": False,
        "revaluation_reason": None,
        "revaluation_requested_at": None,
        # Permanent, never reset — once a student has gone through one full
        # revaluation cycle (requested -> faculty re-finalized), this stays
        # True forever so they cannot request a second revaluation on the
        # same submission, even though revaluation_requested itself gets
        # cleared on every finalize.
        "revaluation_used": False,
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

    return {"message": "Assessment Submitted Successfully", "student_id": student_id}


# ─────────────────────────────────────────────
# GET STUDENT SUBMISSIONS (student dashboard)
# Returns started_at + submitted_at + revaluation info
# ─────────────────────────────────────────────
@router.get("/student/{student_email}")
def get_student_submissions(student_email: str):
    submissions = list(db.StudentSubmission.find({"student_email": student_email}))
    for s in submissions:
        s["_id"] = str(s["_id"])
        # Ensure started_at is included (may be missing on old records)
        if "started_at" not in s:
            s["started_at"] = None
    return submissions


# ─────────────────────────────────────────────
# GET ALL SUBMISSIONS (admin view)
# ─────────────────────────────────────────────
@router.get("/all")
def get_all_submissions():
    submissions = list(db.StudentSubmission.find())
    result = []
    for s in submissions:
        assessment = db.Assessment.find_one({"_id": ObjectId(s["assessment_id"])})
        result.append({
            "submission_id": str(s["_id"]),
            "student_id": s.get("student_id"),
            "student_email": s.get("student_email"),
            "assessment_id": s.get("assessment_id"),
            "assessment_title": assessment["title"] if assessment else "Unknown",
            "started_at": s.get("started_at"),
            "submitted_at": s.get("submitted_at"),
            "status": s.get("status", "Pending Evaluation"),
            "revaluation_requested": s.get("revaluation_requested", False),
        })
    return result


# ─────────────────────────────────────────────
# GET SUBMISSIONS BY ASSESSMENT (faculty view)
# ─────────────────────────────────────────────
@router.get("/assessment/{assessment_id}")
def get_submissions_by_assessment(assessment_id: str):
    submissions = list(db.StudentSubmission.find({"assessment_id": assessment_id}))
    result = []
    for s in submissions:
        status = s.get("status", "Pending Evaluation")
        if status == "Finalized":
            total_marks = s.get("final_marks", 0)
        else:
            total_marks = 0
            corrections = list(db.FacultyCorrection.find({"submission_id": str(s["_id"])}))
            for c in corrections:
                total_marks += float(c.get("faculty_marks", 0))

        result.append({
            "submission_id": str(s["_id"]),
            "student_id": s.get("student_id"),
            "student_email": s.get("student_email"),
            "status": status,
            "started_at": s.get("started_at"),
            "submitted_at": s.get("submitted_at"),
            "final_marks": round(total_marks),
            "revaluation_requested": s.get("revaluation_requested", False),
            "revaluation_reason": s.get("revaluation_reason"),
        })
    return result


# ─────────────────────────────────────────────
# VIEW SUBMISSION — student answers only
# ─────────────────────────────────────────────
@router.get("/view/{submission_id}")
def view_submission(submission_id: str):
    submission = db.StudentSubmission.find_one({"_id": ObjectId(submission_id)})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    student_id = submission["student_id"]
    assessment_id = submission["assessment_id"]

    answers = list(db.StudentAnswer.find({
        "student_id": student_id,
        "assessment_id": assessment_id
    }))

    return [{"question_id": a["question_id"], "answer": a["answer_text"]} for a in answers]


# ─────────────────────────────────────────────
# REVIEW SUBMISSION — faculty review page with AI marks
# ─────────────────────────────────────────────
@router.get("/review/{submission_id}")
def review_submission(submission_id: str):
    submission = db.StudentSubmission.find_one({"_id": ObjectId(submission_id)})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    assessment_id = submission["assessment_id"]
    student_id = submission["student_id"]
    questions = list(db.Question.find({"assessment_id": assessment_id}))
    result = []

    for question in questions:
        answer = db.StudentAnswer.find_one({
            "student_id": student_id,
            "assessment_id": assessment_id,
            "question_id": question["question_id"]
        })
        evaluation = db.EvaluationResult.find_one({
            "student_id": student_id,
            "question_id": question["question_id"],
            "assessment_id": assessment_id
        })

        labels_json = []
        if evaluation:
            raw = evaluation.get("labels_json", "[]")
            if isinstance(raw, str):
                try:
                    labels_json = json.loads(raw)
                except Exception:
                    labels_json = []
            else:
                labels_json = raw

        correction = db.FacultyCorrection.find_one({
            "submission_id": submission_id,
            "question_id": question["question_id"]
        })

        ai_marks = evaluation.get("suggested_marks", 0) if evaluation else None
        final_marks = correction.get("faculty_marks", ai_marks) if correction else ai_marks

        feedback = []
        if evaluation:
            breakdown = evaluation.get("technical_score_breakdown", {})
            for point, value in breakdown.items():
                v = str(value).lower()
                if "matched" in v and "not matched" not in v:
                    feedback.append(f"✓ {point} present")
                elif "not matched" in v:
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


# ─────────────────────────────────────────────
# EVALUATE SUBMISSION — runs ML pipeline
# ─────────────────────────────────────────────
@router.post("/evaluate/{submission_id}")
async def evaluate_submission(submission_id: str):
    try:
        submission = db.StudentSubmission.find_one({"_id": ObjectId(submission_id)})
        if not submission:
            raise HTTPException(status_code=404, detail="Submission not found")

        assessment_id = submission["assessment_id"]
        student_id = submission["student_id"]
        student_ids = list(db.StudentAnswer.find({"assessment_id": assessment_id}))
        s_ids = [s["student_id"] for s in student_ids]

        questions = list(db.Question.find({"assessment_id": assessment_id}))
        question_ids = [q["question_id"] for q in questions]

        logger.info(f"Evaluating submission {submission_id}, student {student_id}, assessment {assessment_id}")

        # Pre-set score=0 for unanswered questions
        for q in questions:
            answer = db.StudentAnswer.find_one({
                "student_id": student_id,
                "assessment_id": assessment_id,
                "question_id": q["question_id"]
            })
            answer_text = (answer.get("answer_text", "") if answer else "").strip()
            if not answer_text:
                db.EvaluationResult.update_one(
                    {"student_id": student_id, "question_id": q["question_id"], "assessment_id": assessment_id},
                    {"$set": {"suggested_marks": 0, "technical_score_breakdown": {}, "skipped": True}},
                    upsert=True
                )

        await main(question_ids, s_ids, assessment_id)

        # Preserve revaluation status if this re-evaluation was triggered
        # from a revaluation request — only finalize() (save-correction)
        # should ever clear the revaluation_requested flag. Without this,
        # re-running AI evaluation on a flagged submission would silently
        # stamp status back to "Evaluated" while revaluation_requested stays
        # True, leaving the submission in an inconsistent half-state.
        current = db.StudentSubmission.find_one({"_id": ObjectId(submission_id)})
        new_status = "Revaluation Requested" if current.get("revaluation_requested") else "Evaluated"

        db.StudentSubmission.update_one(
            {"_id": ObjectId(submission_id)},
            {"$set": {"status": new_status}}
        )

        return {"message": "Evaluation Completed"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Evaluation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# SAVE FACULTY CORRECTION
# ─────────────────────────────────────────────
@router.post("/save-correction")
def save_correction(data: dict):
    db.FacultyCorrection.update_one(
        {"submission_id": data["submission_id"], "question_id": data["question_id"]},
        {"$set": {
            "ai_marks": data["ai_marks"],
            "faculty_marks": data["faculty_marks"],
            "approved": True
        }},
        upsert=True
    )

    corrections = list(db.FacultyCorrection.find({"submission_id": data["submission_id"]}))
    total = sum(float(c.get("faculty_marks", 0)) for c in corrections)

    submission = db.StudentSubmission.find_one({"_id": ObjectId(data["submission_id"])})
    was_in_revaluation = bool(submission and submission.get("revaluation_requested"))

    update_fields = {
        "status": "Finalized",
        "final_marks": round(total),
        "revaluation_requested": False,
        "revaluation_reason": None,
        "revaluation_requested_at": None,
    }
    # Permanently lock out further revaluation requests once a revaluation
    # cycle has been finalized. revaluation_used is never reset back to
    # False anywhere, so this is a one-time-only guarantee for the lifetime
    # of the submission.
    if was_in_revaluation:
        update_fields["revaluation_used"] = True

    db.StudentSubmission.update_one(
         {"_id": ObjectId(data["submission_id"])},
         {"$set": update_fields}
    )

    return {"message": "Marks Saved Successfully"}


# ─────────────────────────────────────────────
# GET RESULT LIST FOR STUDENT DASHBOARD
# ─────────────────────────────────────────────
@router.get("/result/{student_email}")
def get_student_results(student_email: str):
    submissions = list(db.StudentSubmission.find({"student_email": student_email}))
    result = []
    for s in submissions:
        assessment = db.Assessment.find_one({"_id": ObjectId(s["assessment_id"])})
        results_published = assessment.get("results_published", False) if assessment else False
        result.append({
            "submission_id": str(s["_id"]),
            "assessment_id": s["assessment_id"],
            "assessment_title": assessment["title"] if assessment else "Unknown",
            "status": s.get("status", "Pending Evaluation"),
            "final_marks": s.get("final_marks", 0),
            "started_at": s.get("started_at"),
            "submitted_at": s.get("submitted_at"),
            "results_published": results_published
        })
    return result


# ─────────────────────────────────────────────
# STUDENT RESULT — detailed per-question result
# ─────────────────────────────────────────────
@router.get("/student-result/{submission_id}")
def student_result(submission_id: str):
    submission = db.StudentSubmission.find_one({"_id": ObjectId(submission_id)})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    assessment = db.Assessment.find_one({"_id": ObjectId(submission["assessment_id"])})
    results_published = assessment.get("results_published", False) if assessment else False

    if not results_published:
        return {"results_published": False}

    questions = list(db.Question.find({"assessment_id": submission["assessment_id"]}))
    result = []
    total_marks = 0

    for question in questions:
        answer = db.StudentAnswer.find_one({
            "student_id": submission["student_id"],
            "assessment_id": submission["assessment_id"],
            "question_id": question["question_id"]
        })
        correction = db.FacultyCorrection.find_one({
            "submission_id": submission_id,
            "question_id": question["question_id"]
        })
        evaluation = db.EvaluationResult.find_one({
            "student_id": submission["student_id"],
            "assessment_id": submission["assessment_id"],
            "question_id": question["question_id"]
        })

        ai_marks = float(evaluation.get("suggested_marks", 0)) if evaluation else 0
        faculty_adjusted = (
            correction is not None and
            float(correction.get("faculty_marks", ai_marks)) != float(ai_marks)
        )
        marks = correction.get("faculty_marks", 0) if correction else (ai_marks if evaluation else 0)
        total_marks += float(marks)

        labels_json = []
        if evaluation:
            raw = evaluation.get("labels_json", "[]")
            if isinstance(raw, str):
                try:
                    labels_json = json.loads(raw)
                except Exception:
                    labels_json = []
            else:
                labels_json = raw

        feedback = []
        if evaluation:
            breakdown = evaluation.get("technical_score_breakdown", {})
            for point, value in breakdown.items():
                v = str(value).lower()
                if "matched" in v and "not matched" not in v:
                    feedback.append(f"✓ {point} present")
                elif "not matched" in v:
                    feedback.append(f"✗ {point} missing")

        result.append({
            "question_id": question["question_id"],
            "question": question.get("question_text", ""),
            "student_answer": answer["answer_text"] if answer else "",
            "marks": marks,
            "ai_marks": ai_marks,
            "faculty_adjusted": faculty_adjusted,
            "max_marks": question.get("max_marks", 0),
            "feedback": feedback,
            "labels_json": labels_json,
            "technical_score_breakdown": evaluation.get("technical_score_breakdown", {}) if evaluation else {}
        })

    return {
        "results_published": True,
        "submission_id": submission_id,
        "assessment_title": assessment["title"] if assessment else "Assessment",
        "status": submission.get("status"),
        "total_marks": round(total_marks),
        "started_at": submission.get("started_at"),
        "submitted_at": submission.get("submitted_at"),
        "revaluation_requested": submission.get("revaluation_requested", False),
        "revaluation_used": submission.get("revaluation_used", False),
        "revaluation_reason": submission.get("revaluation_reason"),
        "questions": result
    }


# ─────────────────────────────────────────────
# EXPORT CSV
# ─────────────────────────────────────────────
@router.get("/export-csv/{assessment_id}")
def export_csv(assessment_id: str):
    assessment = db.Assessment.find_one({"_id": ObjectId(assessment_id)})
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    submissions = list(db.StudentSubmission.find({"assessment_id": assessment_id}))

    not_evaluated = [s for s in submissions if s.get("status") not in ("Evaluated", "Finalized", "Revaluation Requested")]
    if not_evaluated:
        raise HTTPException(status_code=400, detail="All submissions must be evaluated before exporting CSV")

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["S.No", "Student Reg No", "Student Email", "Assessment Name", "Started At", "Submitted At", "Final Marks"])

    for idx, s in enumerate(submissions, start=1):
        writer.writerow([
            idx,
            s.get("student_id", ""),
            s.get("student_email", ""),
            assessment.get("title", ""),
            s.get("started_at", ""),
            s.get("submitted_at", ""),
            s.get("final_marks", 0)
        ])

    output.seek(0)
    safe_title = "".join(
        c if c.isalnum() or c in ("-", "_") else "_"
        for c in assessment.get("title", "assessment")
    )
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{safe_title}_marks.csv"'}
    )


# ─────────────────────────────────────────────
# REQUEST REVALUATION — student raises flag
# ─────────────────────────────────────────────
@router.post("/revaluation")
def request_revaluation(data: dict):
    submission_id = data.get("submission_id")
    student_email = data.get("student_email")
    reason = (data.get("reason") or "").strip()

    if not submission_id or not student_email or not reason:
        raise HTTPException(status_code=400, detail="submission_id, student_email, and reason are required")

    submission = db.StudentSubmission.find_one({"_id": ObjectId(submission_id)})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    if submission.get("student_email") != student_email:
        raise HTTPException(status_code=403, detail="Not your submission")

    if submission.get("revaluation_used"):
        raise HTTPException(status_code=400, detail="Revaluation has already been used for this submission")

    if submission.get("revaluation_requested"):
        raise HTTPException(status_code=400, detail="Revaluation already requested for this submission")

    if submission.get("status") != "Finalized":
        raise HTTPException(status_code=400, detail="Can only request revaluation after marks are finalized")

    db.StudentSubmission.update_one(
        {"_id": ObjectId(submission_id)},
        {"$set": {
            "revaluation_requested": True,
            "revaluation_reason": reason,
            "revaluation_requested_at": datetime.now(),
            "status": "Revaluation Requested"
        }}
    )

    return {"message": "Revaluation request submitted successfully"}


# ─────────────────────────────────────────────
# GET REVALUATION REQUESTS — faculty view per assessment
# ─────────────────────────────────────────────
@router.get("/revaluations/{assessment_id}")
def get_revaluations(assessment_id: str):
    submissions = list(db.StudentSubmission.find({
        "assessment_id": assessment_id,
        "revaluation_requested": True
    }))
    result = []
    for s in submissions:
        result.append({
            "submission_id": str(s["_id"]),
            "student_id": s.get("student_id"),
            "student_email": s.get("student_email"),
            "revaluation_reason": s.get("revaluation_reason", ""),
            "revaluation_requested_at": s.get("revaluation_requested_at"),
            "started_at": s.get("started_at"),
            "submitted_at": s.get("submitted_at"),
            "status": s.get("status"),
            "final_marks": s.get("final_marks"),
        })
    return result