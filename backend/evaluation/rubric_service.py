import json
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from database import db
from .slm import model
from .schemas.validators import SingleRubric

out = StrOutputParser()


def generate_atomic_rubric(faculty_rubric):

    system_instruction = """
You are a rubric parser.

Given a faculty-written rubric, split it into atomic rubric points.

Return ONLY a valid JSON array.

Rules:
1. Output must start with '[' and end with ']'.
2. Do not include explanations, notes, or extra text.
3. Each rubric point must be a JSON object.
4. rubrics_id must be a string.
5. marks must be an integer.
6. content must be a string.

[
{{
"rubrics_id"
"marks":
"content":
}},
{{
"rubrics_id"
"marks":
"content":
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
    response = json.loads(response)
    print("--------------------------------------------------------------------------")
    print(response)
    print("--------------------------------------------------------------------------")
    verified_rubric = [SingleRubric(**rubric) for rubric in response]
    dict_data = [obj.model_dump() for obj in verified_rubric]
    return dict_data


def accessing_faculty_input(question_id, assessment_id):
    # FIX — filter by both question_id and assessment_id
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

    atomic_rubric_json = generate_atomic_rubric(rubric_doc["rubric_text"])

    db.Rubric.update_one(
        {"question_id": question_id, "assessment_id": assessment_id},
        {"$set": {"verified_points_json": atomic_rubric_json}},
    )