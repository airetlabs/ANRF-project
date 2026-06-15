import string
import json
from pprint import pprint
from .preprocessing import preprocess_student_ans
from database import db
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from .slm import model
from .schemas.validators import Technical_terms
out = StrOutputParser()


def technical_terms_extraction(faculty_rubrics, faculy_ans):
    json_format_example = [
        {
            "technical_term": "TERM1",
            "weightage": 5
        },
        {
            "technical_term": "TERM2",
            "weightage": 3
        }
    ]
    json_format_str = json.dumps(json_format_example, indent=2)
    escaped_json_format_str = json_format_str.replace("{", "{{").replace("}", "}}")

    model_technical_verification_instruction = f"""
  # Role
  You are an academic evaluator.

  # Input
  - Faculty Rubric
  - Faculty Answer

  # Task
  For each rubric point:

  1. Identify the key concepts from the faculty answer that are essential for satisfying that rubric point.

  2. Extract only:
    - Technical terms(Preferably single words)
    - Conceptual phrases
    - Domain-specific keywords

  3. Do NOT extract:
    - Generic filler words
    - Connecting words
    - Repeated terms unless necessary

  4. Assign an importance weight from 1 to 5 for each extracted concept:

  5 = Critical concept; must be present for strong match
  4 = Highly important supporting concept
  3 = Important but not mandatory
  2 = Minor supporting detail
  1 = Low importance supplementary term

  # Output Rules
  - Output ONLY valid JSON
  - No explanations
  - No markdown
  - No extra text

  The JSON must strictly follow this format:
  {escaped_json_format_str}
  """

    faculty_rubrics_json_str = json.dumps(faculty_rubrics, indent=2)
    escaped_faculty_rubrics_json_str = faculty_rubrics_json_str.replace("{", "{{").replace("}", "}}")

    prompt = ChatPromptTemplate.from_messages([
        {"role": "system", "content": model_technical_verification_instruction},
        {"role": "user", "content": f""""faculty_rubric":{escaped_faculty_rubrics_json_str},
                                    "faculty_ans":{faculy_ans}"""}
    ])
    chain = prompt | model | out
    response = chain.invoke({})
    response = json.loads(response)
    technical_terms = [Technical_terms(**term) for term in response]
    dict_data = [obj.model_dump() for obj in technical_terms]
    return dict_data


def access_similarity_for_technical_evaluation(question_id, assessment_id):
    # FIX — filter by assessment_id too
    rubric_doc = db.Rubric.find_one({
        "question_id": question_id,
        "assessment_id": assessment_id
    })
    if not rubric_doc:
        return
    question_doc=db.Question.find_one({"question_id":question_id,"assessment_id":assessment_id})
    if question_doc and question_doc.get("generated_tech_words"):
        return
    atomic_rubric = rubric_doc.get("verified_points_json")

    answer_key_doc = db.AnswerKey.find_one({
        "question_id": question_id,
        "assessment_id": assessment_id
    })
    if not answer_key_doc or not answer_key_doc.get("key_text"):
        return

    faculty_ans = answer_key_doc["key_text"]
    technical_terms_json = []
    try:
        if atomic_rubric is not None:
            
            technical_terms_json = technical_terms_extraction(atomic_rubric, faculty_ans)
            db.Rubric.update_one(
            {"question_id": question_id, "assessment_id": assessment_id},
            {"$set": {"technical_terms": technical_terms_json}},
        )
            db.Question.update_one({"question_id":question_id,"assessment_id":assessment_id},
                                {"$set":{"generated_tech_words":True}})
        else:
            print(
                f"Warning: atomic_rubric is None for question_id {question_id}. "
                "Setting technical_terms to empty list."
            )
    except Exception as e:
        print(f"Error extracting technical terms for question_id {question_id}: {e}")

    # FIX — update correct rubric document using assessment_id
    


def cal_technical_score(student_id, question_id, assessment_id):
    # FIX — filter by assessment_id too
    rubric_doc = db.Rubric.find_one({
        "question_id": question_id,
        "assessment_id": assessment_id
    })
    if not rubric_doc:
        return

    technical_terms = rubric_doc.get("technical_terms", [])

    student_ans_doc = db.StudentAnswer.find_one({
        "question_id": question_id,
        "student_id": student_id,
        "assessment_id": assessment_id
    })
    if not student_ans_doc:
        return

    technical_evaluation_breakdown = {}
    processed_student_ans = preprocess_student_ans(student_ans_doc["answer_text"])
    technical_score = 0

    for term in technical_terms:
        word = preprocess_student_ans(term["technical_term"])
        word = word.lower()
        if word in processed_student_ans:
            technical_score += term["weightage"]
            technical_evaluation_breakdown[word] = f"(matched) ---- {term['weightage']} "
        else:
            technical_evaluation_breakdown[word] = "(not matched)-- 0"

    # FIX — update correct EvaluationResult using assessment_id
    db.EvaluationResult.update_one(
        {"question_id": question_id, "student_id": student_id, "assessment_id": assessment_id},
        {
            "$set": {
                "technical_score": technical_score,
                "technical_score_breakdown": technical_evaluation_breakdown,
            }
        },
    )


def normalise_marks(student_id, question_id, assessment_id):
    # FIX — filter by assessment_id too
    result_doc = db.EvaluationResult.find_one({
        "question_id": question_id,
        "student_id": student_id,
        "assessment_id": assessment_id
    })
    if not result_doc:
        return

    rubric_doc = db.Rubric.find_one({
        "question_id": question_id,
        "assessment_id": assessment_id
    })
    technical_terms = rubric_doc.get("technical_terms", []) if rubric_doc else []

    total = sum(p.get("weightage", 0) for p in technical_terms)
    technical_score_raw = result_doc.get("technical_score", 0)

    normalised_score = 0
    if total > 0:
        normalised_score = (technical_score_raw / total) * 10

    db.EvaluationResult.update_one(
        {"question_id": question_id, "student_id": student_id, "assessment_id": assessment_id},
        {"$set": {"technical_score": normalised_score}},
    )