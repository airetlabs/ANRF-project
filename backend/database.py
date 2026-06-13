import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URL = os.getenv(
    "MONGO_URL",
    "mongodb://localhost:27017"
)

client = MongoClient(
    MONGO_URL,
    serverSelectionTimeoutMS=5000
)

db = client["Exam"]

collections = [
    "Assessment",
    "Question",
    "AnswerKey",
    "Rubric",
    "StudentSubmission",
    "StudentAnswer",
    "EvaluationResult",
    "FacultyCorrection"
]

for col in collections:
    if col not in db.list_collection_names():
        db.create_collection(col)

users_collection = db["users"]

# INDEXES

users_collection.create_index(
    "email",
    unique=True
)

db.StudentSubmission.create_index(
    [
        ("assessment_id", 1),
        ("student_email", 1)
    ],
    unique=True
)