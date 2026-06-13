from pprint import pprint
from evaluation.rag_pipeline import evaluate_rag_pipeline

print("Starting RAG test...")

result = evaluate_rag_pipeline(
    student_id="24BDS1172",
    question_ids=[1],
    assessment_id="RAG_TEST_ASSESSMENT"
)

print("RAG result:")
pprint(result)
print("Finished")