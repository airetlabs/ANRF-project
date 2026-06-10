import json
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from database import db
from .slm import model
from .schemas.validators import SingleRubric

out = StrOutputParser()


def generate_atomic_rubric(faculty_rubric):

    system_instruction = """
Given a faculty written rubrics.
Analyse the faculy rubrics properly and write a short line in content for corresponding marks
Generate an atomic points rubric in Json file,each seperated with a comma.Enclose all rubric point in another{{}}.
Marks should be in integer and content should be in string.
Output must be in the given Json format only,Avoid extra explanation.
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
    response = json.loads(response)
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