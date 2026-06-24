from .rubric_service import accessing_faculty_input
from .technical_service import (
    access_similarity_for_technical_evaluation,
    cal_technical_score,
    normalise_marks,
)
from .semantic_service import similarity_marks, labelling_ans  # CHANGED
from .rag_service import process_answer_key, get_focused_context_for_slm  # NEW
from .scoring_service import final_score_combined
from database import db
import json
import time
import asyncio


def _normalize_question_id(question_id):
    if str(question_id).isdigit():
        return int(question_id)
    return question_id


async def accessing_student_input(student_id, question_id, assessment_id):
    #question_id = _normalize_question_id(question_id)

    answer_doc = db.StudentAnswer.find_one({
        "student_id": student_id,
        "assessment_id": assessment_id,
        "question_id": question_id
    })
    if not answer_doc:
        return

    rubric_doc = db.Rubric.find_one({
        "question_id": question_id,
        "assessment_id": assessment_id
    })
    if not rubric_doc or not rubric_doc.get("verified_points_json"):
        return

    answer_key_doc = db.AnswerKey.find_one({
        "question_id": question_id,
        "assessment_id": assessment_id
    })
    if not answer_key_doc or not answer_key_doc.get("key_text"):
        return

    marks_breakdown = await labelling_ans(
        answer_key_doc["key_text"],
        rubric_doc["verified_points_json"],
        answer_doc["answer_text"],
    )


    db.EvaluationResult.update_one(
        {"question_id": question_id, "student_id": student_id, "assessment_id": assessment_id},
        {
            "$set": {
                "question_id": question_id,
                "student_id": student_id,
                "assessment_id": assessment_id,
                "labels_json": marks_breakdown,
                "suggested_marks": None,
                "audit_json": None,
                "status": None,
            }
        },
        upsert=True,
    )


async def evaluate_pipeline(student_id, question_id, assessment_id):
  # await accessing_faculty_input(question_id, assessment_id)
  start=time.time()
  await accessing_student_input(student_id, question_id, assessment_id)
  end=time.time()
  print("Step 1:",end-start)
  start=time.time()
  similarity_marks(student_id, question_id, assessment_id)
  end=time.time()
  print("Step 2:",end-start)
  start=time.time()
  # await access_similarity_for_technical_evaluation(question_id, assessment_id)
  cal_technical_score(student_id, question_id, assessment_id)
  end=time.time()
  print("Step 3:",end-start)
  start=time.time()
  normalise_marks(student_id, question_id, assessment_id)
  end=time.time()
  print("Step 4:",end-start)
  start=time.time()
  final_score_combined(student_id, question_id, assessment_id)
  end=time.time()
  print("Step 5:",end-start)




async def main(question_ids,s_ids,assessment_id):
  start_overall = time.time()
  for qid in question_ids:
    start = time.time()
    tasks=[evaluate_pipeline(sid,qid,assessment_id) for sid in s_ids]
    await asyncio.gather(*tasks)

    end = time.time()
    print(f"Time taken for Question {qid}: {end-start:.2f} sec")

  end_overall = time.time()

  print(f"\nOverall time: {end_overall-start_overall:.2f} sec")