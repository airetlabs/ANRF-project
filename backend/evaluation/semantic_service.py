import json
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from database import db
from .slm import model

out = StrOutputParser()


def labelling_ans_with_rag(focused_contexts):
    """
    Labelling using RAG focused context — one rubric point at a time
    """
    json_format_example = {
        "rubrics_id": "",
        "total_marks": "",
        "label": "matched/partial/contradicting",
        "semantic_similarity": "",
        "faculty_rubric_statement": "",
        "evidence": ""
    }
    json_format_str = json.dumps(json_format_example, indent=2)
    escaped_json_format_str = json_format_str.replace("{", "{{").replace("}", "}}")

    model_instruction = f"""
  #Role:
  You are an academic evaluator.

  #Task:
  Evaluate the student evidence ONLY by comparing it against the
  faculty chunk using the provided rubric point.

  #Evaluation Rules:
  1. Compare student evidence against faculty chunk semantically
  2. Judge based only on conceptual meaning
  3. Ignore exact wording differences
  4. Do NOT use external knowledge

  #Labels:
  Matched: student meaning matches faculty meaning
  Partial: student captures only part of the meaning
  Contradicting: meaning is incorrect or contradicts faculty, or concept absent

  #Output Rules:
  - Output ONLY valid JSON object (not array)
  - No markdown, no explanations

  The JSON must follow exactly this format:
  {escaped_json_format_str}
  """

    results = []

    for context in focused_contexts:
        escaped_faculty = context["faculty_chunk"].replace("{", "{{").replace("}", "}}")
        escaped_student = context["student_evidence"].replace("{", "{{").replace("}", "}}")
        escaped_rubric  = context["rubric_text"].replace("{", "{{").replace("}", "}}")

        prompt = ChatPromptTemplate.from_messages([
            {"role": "system", "content": model_instruction},
            {"role": "user", "content": f"""
rubrics_id: {context["rubric_id"]}
rubric_point: {escaped_rubric}
faculty_chunk: {escaped_faculty}
student_evidence: {escaped_student}
"""}
        ])

        chain    = prompt | model | out
        response = chain.invoke({})

        try:
            parsed = json.loads(response)
            parsed["rubrics_id"] = context["rubric_id"]
            results.append(parsed)
        except Exception as e:
            print(f"  [labelling_ans_with_rag] JSON parse failed for {context['rubric_id']}: {e}")
            results.append({
                "rubrics_id": context["rubric_id"],
                "total_marks": 0,
                "label": "contradicting",
                "semantic_similarity": 0,
                "faculty_rubric_statement": context["rubric_text"],
                "evidence": context["student_evidence"]
            })

    return json.dumps(results)


def similarity_marks(student_id, question_id, assessment_id):
    # FIX — filter by assessment_id too
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