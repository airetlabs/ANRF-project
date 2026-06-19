# AcadAIsist: – A Small Language Model Based Lightweight and Accessible Evaluation Tool for Reducing Faculty Workload Without Compromising Academic Rigour

A full stack academic evaluation platform for faculty members to create, manage, publish, and analyze assessments.

---

# Features

* Faculty Authentication
* Create Assessments
* Draft Management
* Publish Assessments
* Edit & Delete Assessments
* Live Assessment Preview
* Search Assessments
* Analytics Dashboard
* Recent Activity Tracking

---

# Tech Stack

## Frontend

* Next.js
* React.js
* Tailwind CSS
* Recharts

## Backend

* FastAPI
* MongoDB
* JWT Authentication

---

# Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend runs on:

```bash
http://localhost:3000
```

---

# Backend Setup

## Navigate to Backend

```bash
cd backend
```

---

## Create Virtual Environment

```bash
python -m venv venv
```

---

## Activate Virtual Environment

### Windows

```bash
venv\Scripts\activate
```

### Mac/Linux

```bash
source venv/bin/activate
```

---

# Install Backend Packages

```bash
pip install fastapi uvicorn pymongo python-dotenv python-jose passlib bcrypt python-multipart google-generativeai
```

---

# Run Backend Server

```bash
uvicorn main:app --reload
```

Backend runs on:

```bash
anrf-project-production-a47a.up.railway.app
Deploying....
```

---

# Admin Login Credentials

```text
Email: admin@gmail.com
Password: admin123
```

---

# API Documentation

```bash
anrf-project-production-a47a.up.railway.app/docs
```
