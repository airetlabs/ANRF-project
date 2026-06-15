from bson import ObjectId
from database import db
from evaluation.rag_pipeline import evaluate_rag_pipeline


def run_evaluation_job(submission_id: str):

    submission = db.StudentSubmission.find_one(
        {"_id": ObjectId(submission_id)}
    )

    if not submission:
        return {"error": "Submission not found"}

    assessment_id = submission["assessment_id"]

    questions = list(
        db.Question.find({"assessment_id": assessment_id})
    )

    question_ids = [q["question_id"] for q in questions]

    db.StudentSubmission.update_one(
        {"_id": ObjectId(submission_id)},
        {"$set": {"status": "Evaluation Running"}}
    )

    scores = evaluate_rag_pipeline(
        submission["student_id"],
        question_ids,
        assessment_id
    )

    db.StudentSubmission.update_one(
        {"_id": ObjectId(submission_id)},
        {
            "$set": {
                "status": "Evaluated",
                "evaluation_scores": scores
            }
        }
    )

    return scores