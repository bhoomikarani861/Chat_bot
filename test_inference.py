import os
from azure.ai.inference import ChatCompletionsClient
from azure.ai.inference.models import SystemMessage, UserMessage
from azure.core.credentials import AzureKeyCredential
from dotenv import load_dotenv

load_dotenv()

endpoint = "https://models.github.ai/inference"
model_name = "deepseek/DeepSeek-V3-0324"
token = os.environ.get("GITHUB_TOKEN")

client = ChatCompletionsClient(
    endpoint=endpoint,
    credential=AzureKeyCredential(token),
)

try:
    response = client.complete(
        messages=[
            SystemMessage(content="You are a helpful assistant."),
            UserMessage(content="Hello"),
        ],
        temperature=0.7,
        top_p=0.9,
        max_tokens=1024,
        model=model_name
    )
    print(response)
except Exception as e:
    import traceback
    traceback.print_exc()
