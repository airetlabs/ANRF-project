import os
from dotenv import load_dotenv
load_dotenv()
from langchain_groq import ChatGroq

# _api_key = os.environ.get("GROQ_API_KEY")
# if not _api_key:
#     raise EnvironmentError(
#         "GROQ_API_KEY is not set. Copy backend/.env.example to backend/.env "
#         "and add your Groq API key."
#     )

# model = ChatGroq(model="llama-3.1-8b-instant", temperature=0, max_tokens=4096)

from langchain_nvidia_ai_endpoints import ChatNVIDIA

model = ChatNVIDIA(
  model="meta/llama-3.1-8b-instruct",
  api_key="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",
  temperature=0
)