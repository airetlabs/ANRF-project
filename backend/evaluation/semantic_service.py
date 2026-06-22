from database import db


def final_score_combined(student_id, question_id, assessment_id):
    result_doc = db.EvaluationResult.find_one({
        "question_id": question_id,
        "student_id": student_id,
        "assessment_id": assessment_id
    })
    if not result_doc:
        return

    # FIX (Module 6 compliance):
    # The deterministic, rubric-label-driven score IS the final score.
    # Do not blend in a separate "technical_marks" similarity metric —
    # that allowed contradicted/absent answers to still earn marks,
    # because technical_marks is computed independently of the labels
    # and has no concept of "this point was marked contradicting".
    #
    # semantic_marks already correctly implements the rubric rule
    # (matched = full marks, partial = 75%, contradicting/absent = 0)
    # inside similarity_marks(). We just need to respect that number,
    # not water it down with an unrelated score.

    semantic_marks = float(result_doc.get("semantic_marks") or 0)

    question_doc = db.Question.find_one({
        "question_id": question_id,
        "assessment_id": assessment_id
    })
    total_marks = (
        float(question_doc["max_marks"])
        if question_doc and question_doc.get("max_marks") is not None
        else 0.0
    )

    # Safety clamp — never exceed faculty-assigned max marks, never go negative.
    final_marks = max(0.0, min(semantic_marks, total_marks))
    final_marks = round(final_marks, 2)

    db.EvaluationResult.update_one(
        {"question_id": question_id, "student_id": student_id, "assessment_id": assessment_id},
        {"$set": {"suggested_marks": final_marks}},
    )