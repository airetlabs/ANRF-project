from evaluation.pipeline import evaluate_pipeline
from evaluation.schemas.validators import SingleRubric, Technical_terms
from database import db
from pprint import pprint
import numpy as np
import pandas as pd

df=pd.read_csv("data\question_1_to_20.csv")
df.head()

