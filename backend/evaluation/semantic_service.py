import json
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from database import db
from .slm import model
from .limiter import limiter
import asyncio
from groq import RateLimitError
out = StrOutputParser()


async def labelling_ans(faculty_ans, faculty_rubrics, student_ans):
    json_format_example = [
        {
            "rubrics_id": "",
            "total_marks": "",
            "label": "matched/partial/contradicting/matching",
            "semantic_similarity": "",
            "faculty_rubric_statement": "",
            "evidence": ""
        }
    ]

    json_format_str = json.dumps(json_format_example, indent=2)
    escaped_json_format_str = json_format_str.replace("{", "{{").replace("}", "}}")

    model_instruction_verification = f"""
  #Role:
  You are a strict academic evaluator.

  #Task:
  Evaluate the student's answer ONLY by comparing it against the FACULTY ANSWER using the provided rubric.

  #Input:
  1. Rubric (contains multiple rubric points)
  2. Faculty Answer
  3. Student Answer

  #Evaluation Rules:

  1. For each rubric "content":
    - Identify the corresponding supporting text in the FACULTY ANSWER.
    - Identify the corresponding supporting text in the STUDENT ANSWER.

  2. Compare the STUDENT ANSWER against the FACULTY ANSWER semantically and conceptually.

  3. Judge based only on conceptual meaning and correctness,not just similarity.

  4. Ignore:
    - Exact wording differences
    - Different sentence structure

  5. Do NOT use external knowledge.
    Evaluate strictly with reference to the FACULTY ANSWER only.
    ONLY For the Rubric points asking examples,you may use External Knowledge.

  6. Assign exactly one label for each rubric point:

  Matched:
  - Student meaning strongly matches faculty answer meaning.
  -For that corresponding rubric point,student mentions all IMPORTANT concepts given in the faculty answer.
  -Dont just check word similarity, check the concept.

  Partial:
  - Student captures only part of the required meaning
  - Concept is partially correct but incomplete.

  Contradicting:
  -The student discusses the required concept but the meaning is incorrect.
  -The student gives wrong information.

  Missing:
  -The required concept is not present in the student answer.
  -Evidence=""
  -Leave the evidence as empty string only.Do no generate anything.

  7.Evidence string must be from the STUDENT ANSWER ONLY.



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
  faculty_rubric_point:The "content" string taken from the rubrics given.
  semantic_similarity:Value between 0 to 1,showing similarity between evidence and faculty_rubric_statement.


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

    # RateLimitError retry for initial LLM call
    response_str = ""
    while True:
        try:
            await limiter.acquire()
            response_str = await chain.ainvoke({})
            break
        except RateLimitError:
          await asyncio.sleep(7)
            # time.sleep(7)

    # JSONDecodeError retry for LLM output validation
    retries = 3
    for i in range(retries):
        try:
            # Attempt to parse the response to ensure it's valid JSON
            _ = json.loads(response_str) # Just validate, no need to store parsed object here
            return response_str # If valid, return the original string
        except json.JSONDecodeError as e:
            print(f"JSON Decode Error in labelling_ans: {e}. Retrying LLM call... ({i+1}/{retries})")
            # time.sleep(2)
            # Re-invoke the chain to get a new response
            while True:
                try:
                    await limiter.acquire()
                    response_str = await chain.ainvoke({})
                    break
                except RateLimitError:
                  await asyncio.sleep(7)
                  # time.sleep(7)
    raise ValueError("Failed JSON parsing in labelling_ans after multiple retries from LLM.")


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
            marks += float(point["total_marks"])
        elif point["label"].lower() == "partial":
            marks += float(point["total_marks"]) * 0.65
        else:
            marks=0
        total_marks += marks

    db.EvaluationResult.update_one(
        {"question_id": question_id, "student_id": student_id, "assessment_id": assessment_id},
        {"$set": {"semantic_marks": total_marks}},
    )