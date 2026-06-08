from database import db


def final_score_combined(student_id, question_id, assessment_id):
    # FIX — filter by assessment_id too
    result_doc = db.EvaluationResult.find_one({
        "question_id": question_id,
        "student_id": student_id,
        "assessment_id": assessment_id
    })
    if not result_doc:
        return

    semantic_marks = float(result_doc.get("semantic_marks") or 0)
    technical_marks = float(result_doc.get("technical_score") or 0)

    # FIX — filter Question by assessment_id too
    question_doc = db.Question.find_one({
        "question_id": question_id,
        "assessment_id": assessment_id
    })
    total_marks = (
        float(question_doc["max_marks"])
        if question_doc and question_doc.get("max_marks") is not None
        else 0.0
    )

    final_marks = (
        semantic_marks * 0.85 + (technical_marks / 10) * 0.15 * total_marks
    )
    final_marks = round(final_marks, 2)

    # FIX — cap marks at max marks
    final_marks = min(final_marks, total_marks)

    db.EvaluationResult.update_one(
        {"question_id": question_id, "student_id": student_id, "assessment_id": assessment_id},
        {"$set": {"suggested_marks": final_marks}},
    )