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
            "documents": []
        }

    context_parts = []

    for i, doc in enumerate(docs):
        context_parts.append(f"[Context {i + 1}]\n{doc}")

    best_lexical = max(lexical_overlap_score(query, doc) for doc in docs)

    return {
        "context": "\n\n".join(context_parts),
        "matched": best_lexical >= 0.10,
        "documents": [
            {
                "document": docs[i],
                "distance": distances[i],
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
Evaluate student answer using ONLY retrieved faculty context and rubric.

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


def score_rag_labels(rubric_json, evaluation_output):
    weights = {
        "matched": 1.0,
        "partially_matched": 0.5,
        "partial": 0.5,
        "absent": 0.0,
        "contradicted": 0.0
    }

    total = 0
    breakdown = {}
    labels = {}

    eval_items = evaluation_output.get("evaluation", [])

    for item in rubric_json:
        rid = item.get("rubrics_id")
        max_marks = float(item.get("marks", 0))

        found = next(
            (e for e in eval_items if str(e.get("rubrics_id")) == str(rid)),
            None
        )

        label = found.get("label", "absent").lower() if found else "absent"
        marks = max_marks * weights.get(label, 0)

        breakdown[rid] = round(marks, 2)
        labels[rid] = label
        total += marks

    return {
        "marks_awarded": round(total, 2),
        "rubric_breakdown": breakdown,
        "label_breakdown": labels,
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