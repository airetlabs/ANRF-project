from database import db
from bson import ObjectId
from pprint import pprint
for doc in db.Question.find():
    pprint(doc)
# for doc in db.list_collection_names():
#     db[doc].delete_many({})