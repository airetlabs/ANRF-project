import json
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from database import db
from .slm import model

out = StrOutputParser()


def labelling_ans(faculty_ans, faculty_rubrics, student_ans):
    json_format_example = [
        {
            "rubrics_id": "",
            "total_marks": "",
            "label": "matched/partial/contradicting",
            "semantic_similarity": "",
            "faculty_rubric_statement": "",
            "evidence": ""
        }
    ]

    json_format_str = json.dumps(json_format_example, indent=2)
    escaped_json_format_str = json_format_str.replace("{", "{{").replace("}", "}}")

    model_instruction_verification = f"""
  #Role:
  You are an academic evaluator.

  #Task:
  Evaluate the student's answer ONLY by comparing it against the FACULTY ANSWER using the provided rubric.

  #Input:
  1. Rubric (contains multiple rubric points)
  2. Faculty Answer
  3. Student Answer

  #Evaluation Rules:

  1. For each rubric "content":
    - Identify the corresponding supporting text in the FACULTY ANSWER
    - Identify the corresponding supporting text in the STUDENT ANSWER

  2. Compare the STUDENT ANSWER against the FACULTY ANSWER semantically.

  3. Judge based only on conceptual meaning and correctness.

  4. Ignore:
    - Exact wording differences
    - Different sentence structure
    - Missing exact keywords if meaning is preserved

  5. Do NOT use external knowledge.
    Evaluate strictly with reference to the FACULTY ANSWER only.

  6. Assign exactly one label for each rubric point:

  Matched:
  - Student meaning strongly matches faculty meaning
  - Concept is correct and sufficiently complete

  Partial:
  - Student captures only part of the required meaning
  - Concept is partially correct but incomplete / less precise

  Contradicting:
  - Meaning is incorrect
  - Meaning contradicts faculty answer
  - Required concept is absent

  #Be Objective:
  -neither too strict nor too lenient.

  #Scoring Rules:
  - Semantic score must reflect similarity with faculty answer

  #Output Rules:
  - Output ONLY valid JSON
  - No markdown
  - No explanations
  - No extra text before or after JSON

  The JSON must follow exactly this format:
  {escaped_json_format_str}

  #Important:
  For each rubric point, include the exact line(s) from the student's answer used as evidence.
  """

    faculty_rubrics_json_str = json.dumps(faculty_rubrics, indent=2)
    escaped_faculty_rubrics_str = faculty_rubrics_json_str.replace("{", "{{").replace("}", "}}")

    prompt = ChatPromptTemplate.from_messages([
        {"role": "system", "content": model_instruction_verification},
        {"role": "user", "content": f"""faculty_ans:{faculty_ans}
                                student_ans:{student_ans}
                                faculty_rubrics:{escaped_faculty_rubrics_str}
                            """}
    ])
    chain = prompt | model | out
    response = chain.invoke({})
    return response


def similarity_marks(student_id, question_id, assessment_id):
    result_doc = db.EvaluationResult.find_one({
        "question_id": question_id,
        "student_id": student_id,
        "assessment_id": assessment_id
    })
    if not result_doc or not result_doc.get("labels_json"):
        return

    total_marks = 0
    marks_breakdown_list = json.loads(result_doc["labels_json"])

    for point in marks_breakdown_list:
        marks = 0
        if point["label"].lower() == "matched":
            marks += int(point["total_marks"])
        elif point["label"].lower() == "partial":
            marks += int(point["total_marks"]) * 0.75
        total_marks += marks

    db.EvaluationResult.update_one(
        {"question_id": question_id, "student_id": student_id, "assessment_id": assessment_id},
        {"$set": {"semantic_marks": total_marks}},
    )