import os
from dotenv import load_dotenv
load_dotenv()

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from sentence_transformers import SentenceTransformer, util
import chromadb

from database import db
from .slm import model

embedder = SentenceTransformer("BAAI/bge-small-en-v1.5")
chroma_client = chromadb.Client()
out = StrOutputParser()

# ============================================================
# BLOCK 1 — ANSWER KEY PROCESSING
# ============================================================

def chunk_text(text, chunk_size=150, chunk_overlap=20):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ".", " "]
    )
    chunks = splitter.split_text(text)
    return chunks


def summarise_chunk(chunk):
    system_instruction = """
You are an academic summariser.
Given a passage from a faculty answer, write a single concise sentence
that captures the key academic concept in the passage.
Output only the summary sentence. No explanation. No markdown.
"""
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_instruction),
        ("human", "{chunk}")
    ])
    chain = prompt | model | out
    summary = chain.invoke({"chunk": chunk})
    return summary.strip()


def generate_embeddings(texts):
    embeddings = embedder.encode(
        texts,
        normalize_embeddings=True,
        show_progress_bar=False
    )
    return embeddings.tolist()


def process_answer_key(question_id, assessment_id):
    answer_key_doc = db.AnswerKey.find_one({
        "question_id": question_id,
        "assessment_id": assessment_id
    })
    if not answer_key_doc or not answer_key_doc.get("key_text"):
        return None

    if answer_key_doc.get("rag_processed"):
        return f"q_{question_id}_{assessment_id}"

    faculty_answer = answer_key_doc["key_text"]

    if len(faculty_answer.split()) < 100:
        chunks    = [faculty_answer]
        summaries = [faculty_answer]
    else:
        chunks = chunk_text(faculty_answer)
        summaries = []
        for chunk in chunks:
            summary = summarise_chunk(chunk)
            summaries.append(summary)

    embeddings = generate_embeddings(summaries)

    collection_name = f"q_{question_id}_{assessment_id}"
    try:
        chroma_client.delete_collection(name=collection_name)
    except Exception:
        pass

    collection = chroma_client.create_collection(name=collection_name)
    collection.add(
        documents=summaries,
        embeddings=embeddings,
        metadatas=[{"original_chunk": chunks[i]} for i in range(len(chunks))],
        ids=[f"chunk_{i}" for i in range(len(chunks))]
    )

    db.AnswerKey.update_one(
        {"question_id": question_id, "assessment_id": assessment_id},
        {"$set": {
            "chunk_summaries": summaries,
            "original_chunks": chunks,
            "rag_processed": True
        }}
    )

    return collection_name


# ============================================================
# BLOCK 2 — RETRIEVAL HELPERS
# ============================================================

def get_relevant_faculty_chunk(question_id, assessment_id, rubric_point_text, top_k=1):
    collection_name = f"q_{question_id}_{assessment_id}"

    try:
        collection = chroma_client.get_collection(name=collection_name)
    except Exception:
        process_answer_key(question_id, assessment_id)
        collection = chroma_client.get_collection(name=collection_name)

    query_embedding = embedder.encode(
        [rubric_point_text],
        normalize_embeddings=True
    ).tolist()[0]

    actual_top_k = min(top_k, collection.count())
    result = collection.query(
        query_embeddings=[query_embedding],
        n_results=actual_top_k,
        include=["documents", "metadatas", "distances"]
    )

    best_chunk = result["documents"][0][0]
    return best_chunk


def get_relevant_student_sentence(student_answer, rubric_point_text):
    sentences = [
        s.strip()
        for s in student_answer.replace("\n", " ").split(".")
        if s.strip()
    ]

    if not sentences:
        return student_answer

    if len(sentences) == 1:
        return sentences[0]

    all_texts  = sentences + [rubric_point_text]
    embeddings = embedder.encode(all_texts, normalize_embeddings=True)

    sentence_embeddings = embeddings[:-1]
    rubric_embedding    = embeddings[-1]

    scores   = util.cos_sim(rubric_embedding, sentence_embeddings)[0]
    best_idx = int(scores.argmax())

    return sentences[best_idx]


# ============================================================
# BLOCK 2 — MAIN RETRIEVAL
# ============================================================

def build_focused_context(question_id, assessment_id, student_answer, rubric_points):
    focused_contexts = []

    for point in rubric_points:
        rubric_id   = point.get("rubrics_id", "")
        rubric_text = point.get("content", "")

        faculty_chunk = get_relevant_faculty_chunk(
            question_id,
            assessment_id,
            rubric_text,
            top_k=1
        )

        student_sentence = get_relevant_student_sentence(
            student_answer,
            rubric_text
        )

        focused_contexts.append({
            "rubric_id":        rubric_id,
            "rubric_text":      rubric_text,
            "faculty_chunk":    faculty_chunk,
            "student_evidence": student_sentence
        })

    return focused_contexts


# ============================================================
# MAIN ENTRY POINT — called from pipeline.py
# ============================================================

def get_focused_context_for_slm(question_id, student_id, assessment_id, student_answer):
    rubric_doc = db.Rubric.find_one({
        "question_id": question_id,
        "assessment_id": assessment_id
    })
    rubric_points = rubric_doc.get("verified_points_json", []) if rubric_doc else []

    if not rubric_points:
        return []

    focused_contexts = build_focused_context(
        question_id,
        assessment_id,
        student_answer,
        rubric_points
    )

    db.EvaluationResult.update_one(
        {"question_id": question_id, "student_id": student_id, "assessment_id": assessment_id},
        {"$set": {"rag_focused_contexts": focused_contexts}},
        upsert=True
    )

    return focused_contexts