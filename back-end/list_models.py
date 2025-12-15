import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

print("API key loaded:", bool(api_key))
print("\nModels that support generateContent:\n")

for m in client.models.list():
    methods = getattr(m, "supported_generation_methods", []) or []
    if "generateContent" in methods:
        print(m.name, "->", methods)
