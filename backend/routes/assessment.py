from fastapi import APIRouter
from bson import ObjectId
from datetime import datetime, timezone, timedelta

from database import db

router = APIRouter()

IST = timezone(timedelta(hours=5, minutes=30))


# CREATE / UPDATE ASSESSMENT
@router.post("/create")
def create_assessment(data: dict):

    assessment_id = data.get("id")

    if "id" in data:
        del data["id"]

    if assessment_id:
        db.Assessment.update_one(
            {"_id": ObjectId(assessment_id)},
            {"$set": data}
        )
        return {"message": "Assessment Updated Successfully"}

    result = db.Assessment.insert_one(data)
    assessment_id = result.inserted_id
    assessment_id_str = str(assessment_id)

    for idx, q in enumerate(data["questions"]):
        qid = idx + 1
        qid=str(assessment_id)+'_'+str(qid)
        # qid = q.get("question_id")
        # if qid == "" or qid is None:
        #     qid = idx + 1
        #     qid=str(assessment_id)+'_'+str(qid)

        db.Question.insert_one({
            "assessment_id": assessment_id_str,
            "question_id": qid,
            "question_text": q["question"],
            "max_marks": int(q["marks"]),
            "ans_length": q["expected_length"],
            "generated_rubrics":False,
            "generated_tech_words":False
        })
        db.AnswerKey.insert_one({
            "question_id": qid,
            "assessment_id": assessment_id_str,
            "key_text": q["answer_key"],
        })

        db.Rubric.insert_one({
            "question_id": qid,
            "assessment_id": assessment_id_str,
            "rubric_text": q["rubric"],
        })

    return {
        "message": "Assessment Created Successfully",
        "id": str(result.inserted_id)
    }


# GET ASSESSMENTS OF LOGGED-IN FACULTY ONLY
@router.get("/all/{faculty_email}")
def get_all_assessments(faculty_email: str):

    assessments = list(
        db.Assessment.find({"faculty_email": faculty_email})
    )

    for assessment in assessments:
        assessment["_id"] = str(assessment["_id"])

    return assessments


# GET ASSESSMENTS FOR STUDENTS (IST-aware)
@router.get("/student/{department}/{year}")
def get_student_assessments(department: str, year: str):

    current_time_ist = datetime.now(IST).replace(tzinfo=None)  # naive IST datetime

    assessments = list(db.Assessment.find({"status": "Published"}))

    filtered_assessments = []

    for assessment in assessments:

        departments = assessment.get("departments", [])
        years = assessment.get("years", [])
        available_from = assessment.get("availableFrom")
        available_to = assessment.get("availableTo")

        if not available_from or not available_to:
            continue

        try:
            start_time = datetime.fromisoformat(available_from)
            end_time = datetime.fromisoformat(available_to)
        except:
            continue

        # Normalize years to strings so "2" matches both 2 and "2" in DB
        years_str = [str(y) for y in years]

        if (
            department in departments
            and year in years_str
            and start_time <= current_time_ist
        ):
            assessment["_id"] = str(assessment["_id"])
            filtered_assessments.append(assessment)

    return filtered_assessments


# GET SINGLE ASSESSMENT
@router.get("/view/{assessment_id}")
def get_assessment(assessment_id: str):

    assessment = db.Assessment.find_one({"_id": ObjectId(assessment_id)})

    if not assessment:
        return {"message": "Assessment not found"}

    assessment["_id"] = str(assessment["_id"])
    return assessment


# GET QUESTIONS FOR AN ASSESSMENT (from db.Question)
@router.get("/questions/{assessment_id}")
def get_assessment_questions(assessment_id: str):

    questions = list(db.Question.find({"assessment_id": assessment_id}))

    if not questions:
        assessment = db.Assessment.find_one({"_id": ObjectId(assessment_id)})
        if not assessment:
            return []

        questions = []
        for idx, q in enumerate(assessment.get("questions", [])):
            qid = q.get("question_id")
            if qid == "" or qid is None:
                qid = idx + 1
            questions.append({
                "assessment_id": assessment_id,
                "question_id": qid,
                "question_text": q.get("question", ""),
                "max_marks": q.get("marks", ""),
                "ans_length": q.get("expected_length", ""),
            })

    for question in questions:
        if "_id" in question:
            question["_id"] = str(question["_id"])

    return questions


# DELETE ASSESSMENT
@router.delete("/delete/{assessment_id}")
def delete_assessment(assessment_id: str):

    db.Assessment.delete_one({"_id": ObjectId(assessment_id)})
    return {"message": "Assessment Deleted Successfully"}


# GET ALL ASSESSMENTS FOR ADMIN
@router.get("/admin/all")
def get_all_assessments_admin():
    assessments = list(db.Assessment.find())
    for a in assessments:
        a["_id"] = str(a["_id"])
    return assessments
