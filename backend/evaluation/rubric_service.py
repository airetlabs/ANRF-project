import json
import re
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from database import db
from .slm import model
from .schemas.validators import SingleRubric

out = StrOutputParser()


def extract_json_array(text):
    """Extract the first JSON array from text, ignoring surrounding content."""
    text = text.strip()
    # Try direct parse first
    try:
        return json.loads(text)
    except Exception:
        pass
    # Find first [ ... ] block
    match = re.search(r'\[.*\]', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except Exception:
            pass
    # Try to fix common issues - remove markdown code blocks
    cleaned = re.sub(r'```(?:json)?', '', text).strip()
    match = re.search(r'\[.*\]', cleaned, re.DOTALL)
    if match:
        return json.loads(match.group())
    raise ValueError(f"Could not extract valid JSON array from response: {text[:200]}")


def generate_atomic_rubric(faculty_rubric):

    system_instruction = """
Given a faculty-written rubric.

Analyse the faculy rubrics properly and write a short line in content for corresponding marks

Return ONLY a valid JSON array.

Rules:
1. Output must start with '[' and end with ']'.
2. Do not include explanations, notes, or extra text.
3. Each rubric point must be a JSON object.
4. rubrics_id must be a integer.
5. marks must be an integer/float.
6. content must be a string.

[
{{
"rubrics_id":1,
"marks":1,
"content":"example"
}}
]
"""

    prompt_rubric = ChatPromptTemplate.from_messages([
        {"role": "system", "content": system_instruction},
        {"role": "user", "content": faculty_rubric}
    ])
    chain = prompt_rubric | model | out
    response = chain.invoke({})
    print("--------------------------------------------------------------------------")
    print(response)
    print("--------------------------------------------------------------------------")
    response = extract_json_array(response)
    verified_rubric = [SingleRubric(**rubric) for rubric in response]
    dict_data = [obj.model_dump() for obj in verified_rubric]
    return dict_data


def accessing_faculty_input(question_id, assessment_id):
    rubric_doc = db.Rubric.find_one({
        "question_id": question_id,
        "assessment_id": assessment_id
    })
    if not rubric_doc:
        return

    answer_key_doc = db.AnswerKey.find_one({
        "question_id": question_id,
        "assessment_id": assessment_id
    })
    if not answer_key_doc or not answer_key_doc.get("key_text"):
        return
    
    question_doc = db.Question.find_one({"question_id": question_id, "assessment_id": assessment_id})
    if question_doc and question_doc.get("generated_rubrics"):
        return

    atomic_rubric_json = generate_atomic_rubric(rubric_doc["rubric_text"])

    db.Rubric.update_one(
        {"question_id": question_id, "assessment_id": assessment_id},
        {"$set": {"verified_points_json": atomic_rubric_json}},
    )
    db.Question.update_one(
        {"question_id": question_id, "assessment_id": assessment_id},
        {"$set": {"generated_rubrics": True}}
    )