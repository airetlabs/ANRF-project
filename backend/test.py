from database import db
from evaluation.slm import model
from bson import ObjectId
from pprint import pprint
# db.Rubric.delete_many({})
print(db.list_collection_names())
# print(model)