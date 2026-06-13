from database import db
from .rag_router_engine import (
    store_question_knowledge,
    retrieve_rag_context,
    route_student_answer,
    rag_text_agent,
    rag_math_agent,
    rag_code_agent,
    score_rag_labels,
)

def evaluate_rag_pipeline(student_id, question_ids, assessment_id):
    results = {}

    for question_id in question_ids:

        answer_key = db.AnswerKey.find_one({
            "question_id": question_id,
            "assessment_id": assessment_id
        })

        rubric = db.Rubric.find_one({
            "question_id": question_id,
            "assessment_id": assessment_id
        })

        student_answer = db.StudentAnswer.find_one({
            "question_id": question_id,
            "assessment_id": assessment_id,
            "student_id": student_id
        })

        question = db.Question.find_one({
            "question_id": question_id,
            "assessment_id": assessment_id
        })

        if not answer_key or not rubric or not student_answer:
            continue

        faculty_answer = answer_key["key_text"]
        rubric_json = rubric.get("verified_points_json", [])
        answer_text = student_answer["answer_text"]

        total_marks = float(question.get("max_marks", 0)) if question else 0

        store_question_knowledge(
            question_id,
            assessment_id,
            faculty_answer,
            rubric_json
        )

        query = answer_text + " " + " ".join(
            item.get("content", "") for item in rubric_json
        )

        retrieval = retrieve_rag_context(
            question_id,
            assessment_id,
            query
        )

        route = route_student_answer(answer_text)

        if route == "math_equation":
            evaluation_output = rag_math_agent(
            rubric_json,
            answer_text,
            retrieval["context"]
            )
        elif route == "code":
            evaluation_output = rag_code_agent(
                rubric_json,
                answer_text,
                retrieval["context"]
            )
        else:
            evaluation_output = rag_text_agent(
                rubric_json,
                answer_text,
                retrieval["context"]
            )

        score = score_rag_labels(
            rubric_json,
            evaluation_output
        )

        db.EvaluationResult.update_one(
            {
                "student_id": student_id,
                "question_id": question_id,
                "assessment_id": assessment_id
            },
            {
                "$set": {
                    "student_id": student_id,
                    "question_id": question_id,
                    "assessment_id": assessment_id,
                    "labels_json": evaluation_output,
                    "semantic_marks": score["marks_awarded"],
                    "technical_score": None,
                    "suggested_marks": score["marks_awarded"],
                    "rubric_breakdown": score["rubric_breakdown"],
                    "label_breakdown": score["label_breakdown"],
                    "retrieved_context": retrieval["context"],
                    "rag_matched": retrieval["matched"],
                    "route": route,
                    "engine_type": "router_based_rag_engine",
                    "status": "pending_faculty_review"
                }
            },
            upsert=True
        )

        results[str(question_id)] = {
            "Final Marks": score["marks_awarded"],
            "Total Marks": total_marks,
            "route": route,
            "rag_matched": retrieval["matched"],
            "rubric_breakdown": score["rubric_breakdown"],
            "label_breakdown": score["label_breakdown"]
        }

    return results if results else None