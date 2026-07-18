from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.assessment import router as assessment_router
from routes.auth import router as auth_router
from routes.submission import router as submission_router

app = FastAPI()


# ENABLE CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://frontend.airetlabs.workers.dev",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# HOME API
@app.get("/")
def home():

    return {
        "message": "Backend Running Successfully"
    }


# TEST APIs
@app.get("/assessment/drafts")
def drafts():

    return {
        "message": "Draft Assessments API Working"
    }


@app.get("/assessment/published")
def published():

    return {
        "message": "Published Assessments API Working"
    }


# ASSESSMENT ROUTES
app.include_router(
    assessment_router,
    prefix="/assessment",
    tags=["Assessment APIs"]
)


# AUTH ROUTES
app.include_router(
    auth_router,
    prefix="/auth",
    tags=["Authentication APIs"]
)


# SUBMISSION ROUTES
app.include_router(
    submission_router,
    prefix="/submission",
    tags=["Submission APIs"]
)