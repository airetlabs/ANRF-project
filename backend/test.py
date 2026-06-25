from database import db
from evaluation.slm import model
from bson import ObjectId
from pprint import pprint
# db.Rubric.delete_many({})
for doc in db.Rubric.find():
    pprint(doc)
# print(model)