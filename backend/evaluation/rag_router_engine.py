import os
os.environ["ANONYMIZED_TELEMETRY"] = "False"

import re
import chromadb
from database import db

from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

embedding_function = SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

chroma_client = chromadb.PersistentClient(
    path="./chroma_academic_db"
)

rag_collection = chroma_client.get_or_create_collection(
    name="academic_rag_knowledge",
    embedding_function=embedding_function
)

def chunk_text(text, chunk_size=120, overlap=30):
    words = text.split()
    chunks = []
    start = 0

    while start < len(words):
        end = start + chunk_size
        chunks.append(" ".join(words[start:end]))
        start += chunk_size - overlap

    return chunks


def lexical_overlap_score(query, document):
    q_words = set(re.findall(r"\w+", query.lower()))
    d_words = set(re.findall(r"\w+", document.lower()))

    if not q_words:
        return 0.0

    return len(q_words.intersection(d_words)) / len(q_words)


def route_student_answer(student_answer):
    code_patterns = [
        r"\bfor\b", r"\bwhile\b", r"\bif\b", r"\belse\b",
        r"\bdef\b", r"\bclass\b", r"#include",
        r"public\s+static\s+void", r"\{", r"\}", r";"
    ]

    math_patterns = [
        r"=", r"\bO\s*\(", r"\blog\s*n\b",
        r"\bsin\b|\bcos\b|\btan\b",
        r"\bcomplexity\b", r"\balgorithm\b"
    ]

    total_words = max(len(student_answer.split()), 1)

    code_matches = sum(
        len(re.findall(p, student_answer, re.IGNORECASE))
        for p in code_patterns
    )

    math_matches = sum(
        len(re.findall(p, student_answer, re.IGNORECASE))
        for p in math_patterns
    )

    if code_matches / total_words >= 0.20:
        return "code"

    if math_matches / total_words >= 0.20:
        return "math_equation"

    return "text_theory"


def store_question_knowledge(question_id, assessment_id, faculty_answer, rubric_json):
    existing = rag_collection.get(
        where={
            "$and": [
                {"question_id": str(question_id)},
                {"assessment_id": str(assessment_id)}
            ]
        }
    )

    if existing and existing.get("ids"):
        rag_collection.delete(
            where={
                "$and": [
                    {"question_id": str(question_id)},
                    {"assessment_id": str(assessment_id)}
                ]
            }
        )

    documents = []
    metadatas = []
    ids = []

    for i, chunk in enumerate(chunk_text(faculty_answer)):
        documents.append(chunk)
        metadatas.append({
            "question_id": str(question_id),
            "assessment_id": str(assessment_id),
            "source": "faculty_answer",
            "chunk_index": i
        })
        ids.append(f"{assessment_id}_{question_id}_answer_{i}")

    for i, item in enumerate(rubric_json):
        rubric_text = (
            f"Rubric ID: {item.get('rubrics_id', '')}. "
            f"Marks: {item.get('marks', item.get('total_marks', ''))}. "
            f"Content: {item.get('content', '')}."
        )

        documents.append(rubric_text)
        metadatas.append({
            "question_id": str(question_id),
            "assessment_id": str(assessment_id),
            "source": "rubric",
            "chunk_index": i
        })
        ids.append(f"{assessment_id}_{question_id}_rubric_{i}")

    if documents:
        rag_collection.add(
            ids=ids,
            documents=documents,
            metadatas=metadatas
        )

    return len(documents)


def retrieve_rag_context(question_id, assessment_id, query, top_k=7):
    results = rag_collection.query(
        query_texts=[query],
        n_results=top_k,
        where={
            "$and": [
                {"question_id": str(question_id)},
                {"assessment_id": str(assessment_id)}
            ]
        },
        include=["documents", "metadatas", "distances"]
    )

    docs = results.get("documents", [[]])[0]
    distances = results.get("distances", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]

    if not docs:
        return {
            "context": "",
            "matched": False,
            "avg_distance": None,
            "lexical_score": 0.0,
            "documents": []
        }

    lexical_scores = [lexical_overlap_score(query, doc) for doc in docs]
    best_lexical = max(lexical_scores) if lexical_scores else 0.0
    avg_distance = sum(distances) / len(distances) if distances else None

    context = "\n\n".join(
        f"[Context {i + 1}]\n{doc}"
        for i, doc in enumerate(docs)
    )

    matched = best_lexical >= 0.10

    return {
        "context": context,
        "matched": matched,
        "avg_distance": avg_distance,
        "lexical_score": best_lexical,
        "documents": [
            {
                "document": docs[i],
                "distance": distances[i],
                "lexical_score": lexical_scores[i],
                "metadata": metadatas[i]
            }
            for i in range(len(docs))
        ]
    }

import json
from .slm import model
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

out = StrOutputParser()


def call_json_llm(prompt):
    chain_prompt = ChatPromptTemplate.from_messages([
        ("system", "Output only valid JSON. No markdown. No explanation."),
        ("user", "{input}")
    ])

    chain = chain_prompt | model | out
    response = chain.invoke({"input": prompt})

    try:
        return json.loads(response)
    except Exception:
        return {"evaluation": []}


def rag_text_agent(rubric_json, student_answer, retrieved_context):
    prompt = f"""
You are a strict university evaluator.

Evaluate ONLY the STUDENT ANSWER against the rubric.

CRITICAL RULES:
1. Retrieved context is only reference material.
2. Award marks ONLY if the point is present in STUDENT ANSWER.
3. Do NOT copy evidence from retrieved context.
4. student_quote MUST be an exact substring copied from STUDENT ANSWER only.
5. If no exact quote exists in STUDENT ANSWER, label must be absent.
6. Do NOT infer correctness from related topic words.
7. Do NOT give marks for general operating system concepts unless the rubric point is clearly answered.
8. If student answer is off-topic, mark all rubric points absent.

Labels:
matched
partially_matched
absent
contradicted

Return JSON only:
{{
  "evaluation": [
    {{
      "rubrics_id": "R1",
      "content": "rubric content",
      "marks": 2,
      "label": "absent",
      "student_quote": "",
      "justification": "short reason"
    }}
  ]
}}

STUDENT ANSWER:
<<<STUDENT_ANSWER_START
{student_answer}
STUDENT_ANSWER_END>>>

RETRIEVED CONTEXT:
<<<CONTEXT_START
{retrieved_context}
CONTEXT_END>>>

RUBRIC:
{json.dumps(rubric_json, indent=2)}
"""
    return call_json_llm(prompt)


def rag_math_agent(rubric_json, student_answer, retrieved_context):
    prompt = f"""
Evaluate this math/equation/algorithm answer using ONLY retrieved faculty context and rubric.

Focus on:
- formula correctness
- steps
- complexity
- final conclusion
- equivalent mathematical meaning

Labels:
matched
partially_matched
absent
contradicted

Return JSON only:
{{
  "evaluation": [
    {{
      "rubrics_id": "R1",
      "content": "rubric content",
      "marks": 2,
      "label": "matched",
      "student_quote": "evidence from answer",
      "justification": "short reason"
    }}
  ]
}}

STUDENT ANSWER:
{student_answer}

RETRIEVED CONTEXT:
{retrieved_context}

RUBRIC:
{json.dumps(rubric_json, indent=2)}
"""
    return call_json_llm(prompt)


def rag_code_agent(rubric_json, student_answer, retrieved_context):
    prompt = f"""
Evaluate this programming/code answer using ONLY retrieved faculty context and rubric.

Focus on:
- algorithm logic
- syntax idea
- correctness
- edge cases
- output behaviour
- time complexity if relevant

Labels:
matched
partially_matched
absent
contradicted

Return JSON only:
{{
  "evaluation": [
    {{
      "rubrics_id": "R1",
      "content": "rubric content",
      "marks": 2,
      "label": "matched",
      "student_quote": "evidence from answer",
      "justification": "short reason"
    }}
  ]
}}

STUDENT ANSWER:
{student_answer}

RETRIEVED CONTEXT:
{retrieved_context}

RUBRIC:
{json.dumps(rubric_json, indent=2)}
"""
    return call_json_llm(prompt)

def external_knowledge_agent(rubric_json, student_answer, faculty_answer):
    prompt = f"""
You are an external academic fallback evaluator.

Use general academic knowledge only when RAG retrieval is weak.
Still prioritize faculty answer and rubric.

Labels:
matched
partially_matched
absent
contradicted

Return JSON only:
{{
  "evaluation": [
    {{
      "rubrics_id": "R1",
      "content": "rubric content",
      "marks": 2,
      "label": "matched",
      "student_quote": "evidence from answer",
      "justification": "short reason"
    }}
  ]
}}

STUDENT ANSWER:
{student_answer}

FACULTY ANSWER:
{faculty_answer}

RUBRIC:
{json.dumps(rubric_json, indent=2)}
"""
    return call_json_llm(prompt)


def parse_rubric_to_json(rubric_text, total_marks):
    prompt = f"""
Convert this faculty rubric into atomic JSON rubric points.

Return JSON only.

Schema:
{{
  "rubric": [
    {{
      "rubrics_id": "R1",
      "marks": 2,
      "content": "one independently scorable criterion"
    }}
  ]
}}

Rules:
Rules:
1. Convert the faculty rubric into clear scoring criteria.
2. Do NOT split one criterion into multiple criteria if they belong to the same mark allocation.
3. Each rubrics_id must be unique. Never repeat R1, R2, R3, etc.
4. The sum of all "marks" must be exactly {total_marks}.
5. If a criterion contains subpoints, combine them into one content field under the same rubrics_id.
6. Do not create extra criteria beyond the faculty rubric.
7. Do not assign full marks separately to subpoints unless the faculty explicitly gave separate marks.
8. Use sequential rubrics_id values: R1, R2, R3, R4...
9. Each criterion should be independently scorable but must preserve the original mark distribution.
10. Return only valid JSON.


RUBRIC TEXT:
{rubric_text}
"""
    result = call_json_llm(prompt)
    return result.get("rubric", [])


def score_rag_labels(rubric_json, evaluation_output, student_answer=None, expected_length=0, total_marks=None):
    weights = {
        "matched": 1.0,
        "partially_matched": 0.5,
        "partially matched": 0.5,
        "partial": 0.5,
        "absent": 0.0,
        "contradicted": 0.0,
        "irrelevant": 0.0
    }

    total = 0.0
    breakdown = {}
    labels = {}

    if evaluation_output is None:
        evaluation_output = {"evaluation": []}

    eval_items = evaluation_output.get("evaluation", [])

    rubric_total = sum(float(item.get("marks", 0)) for item in rubric_json)

    if total_marks is not None and float(total_marks) > 0:
        question_total = float(total_marks)
    else:
        question_total = rubric_total

    for item in rubric_json:
        rid = item.get("rubrics_id")
        max_marks = float(item.get("marks", 0))

        found = next(
            (e for e in eval_items if str(e.get("rubrics_id")) == str(rid)),
            None
        )

        label = found.get("label", "absent").strip().lower() if found else "absent"
        marks = max_marks * weights.get(label, 0.0)

        breakdown[rid] = round(marks, 2)
        labels[rid] = label
        total += marks

    word_count = len(student_answer.split()) if student_answer else 0

    length_penalty = 0.0

    if expected_length > 0 and word_count > 0:
        length_ratio = word_count / expected_length

    if length_ratio <= 0.10:
        length_penalty = question_total * 0.20   # extremely short
    elif length_ratio <= 0.25:
        length_penalty = question_total * 0.10   # very short
    elif length_ratio <= 0.40:
        length_penalty = question_total * 0.05   # short

    raw_final = max(0.0, total - length_penalty)

    final_marks = min(raw_final, question_total)

    return {
        "marks_awarded": round(final_marks, 2),
        "total_marks": round(question_total, 2),
        "rubric_total": round(rubric_total, 2),
        "rubric_breakdown": breakdown,
        "label_breakdown": labels,
        "length_penalty": round(length_penalty, 2),
        "word_count": word_count,
        "raw_ai_evaluation": evaluation_output
    }


if __name__ == "__main__":
    print("[OK] RAG Router Engine loaded")
    print("[OK] MongoDB database:", db.name)
    print("[OK] ChromaDB collection ready:", rag_collection.name)

    sample_route = route_student_answer(
        "Binary search compares the target with the middle element and has O(log n) complexity."
    )

    print("[OK] Sample route:", sample_route)