from pydantic import BaseModel

class SingleRubric(BaseModel):
  rubrics_id:int
  marks:float
  content:str

class Marks_rubrics(BaseModel):
  rubrics_id:int
  total_marks:float
  label:str
  semantic_similarity:float
  faculty_rubric_statement:str
  evidence:str

class Technical_terms(BaseModel):
  technical_term:str
  weightage:float
  
def pydantic_validation_similarity_score(marks_breakdown):
  verified_marks_rubric=[Marks_rubrics(**rubric) for rubric in marks_breakdown]
  marks_breakdown=[obj.model_dump() for obj in verified_marks_rubric]
  return marks_breakdown