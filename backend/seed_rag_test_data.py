from database import db

assessment_id = "RAG_TEST_ASSESSMENT"
student_id = "24BDS1172"
question_id = 1

db.Question.delete_many({"assessment_id": assessment_id})
db.AnswerKey.delete_many({"assessment_id": assessment_id})
db.Rubric.delete_many({"assessment_id": assessment_id})
db.StudentAnswer.delete_many({"assessment_id": assessment_id})
db.EvaluationResult.delete_many({"assessment_id": assessment_id})

db.Question.insert_one({
    "assessment_id": assessment_id,
    "question_id": question_id,
    "question_text": "What is Binary Search? Explain its working and time complexity.",
    "max_marks": 10
})

db.AnswerKey.insert_one({
    "assessment_id": assessment_id,
    "question_id": question_id,
    "key_text": (
        "Binary Search is an efficient searching algorithm used to find a target element "
        "in a sorted array. It follows the divide and conquer approach. It compares the "
        "target with the middle element. If the target is smaller, the search continues "
        "in the left half. If the target is greater, it continues in the right half. "
        "The search space is reduced by half each time. The time complexity is O(log n)."
    )
})

db.Rubric.insert_one({
    "assessment_id": assessment_id,
    "question_id": question_id,
    "rubric_text": (
        "Definition of Binary Search - 2 marks; "
        "Sorted array requirement - 2 marks; "
        "Middle element comparison - 2 marks; "
        "Halving of search space - 2 marks; "
        "O(log n) time complexity - 2 marks."
    ),
    "verified_points_json": [
        {
            "rubrics_id": "R1",
            "marks": 2,
            "content": "Defines Binary Search as an efficient searching algorithm"
        },
        {
            "rubrics_id": "R2",
            "marks": 2,
            "content": "Mentions that Binary Search requires sorted data"
        },
        {
            "rubrics_id": "R3",
            "marks": 2,
            "content": "Explains comparison with the middle element"
        },
        {
            "rubrics_id": "R4",
            "marks": 2,
            "content": "Explains reducing the search space into halves"
        },
        {
            "rubrics_id": "R5",
            "marks": 2,
            "content": "Mentions O(log n) time complexity"
        }
    ]
})

db.StudentAnswer.insert_one({
    "assessment_id": assessment_id,
    "student_id": student_id,
    "question_id": question_id,
    "answer_text": (
        "Binary search is used to find an element in a sorted array. "
        "It checks the middle element and then searches either the left side "
        "or the right side. It is faster than linear search and its complexity is O(log n)."
    ),
    "word_count": 39
})

print("Seed data inserted successfully")
print("assessment_id:", assessment_id)
print("student_id:", student_id)
print("question_id:", question_id)