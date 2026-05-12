import os
import io
import base64
from flask import Flask, render_template, request, jsonify
from azure.ai.inference import ChatCompletionsClient
from azure.ai.inference.models import SystemMessage, UserMessage
from azure.core.credentials import AzureKeyCredential
from dotenv import load_dotenv
from gtts import gTTS

load_dotenv()

app = Flask(__name__)

# Configure DeepSeek via Github Models
endpoint = "https://models.github.ai/inference"
model_name = "gpt-4o-mini"

# Initialize client lazily to prevent Vercel crashes on import if token is missing
_client = None

def get_client():
    global _client
    if _client is None:
        token = os.environ.get("GITHUB_TOKEN")
        if not token:
            raise ValueError("GITHUB_TOKEN environment variable not set. Please configure it in Vercel settings.")
        _client = ChatCompletionsClient(
            endpoint=endpoint,
            credential=AzureKeyCredential(token),
        )
    return _client

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message', '')
    
    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    try:
        # Get AI Response
        client = get_client()
        response = client.complete(
            messages=[
                SystemMessage(content="You are a helpful, concise AI assistant. You keep your answers relatively short because they will be read aloud."),
                UserMessage(content=user_message),
            ],
            temperature=0.7,
            top_p=0.9,
            max_tokens=1024,
            model_extras={"model": model_name}
        )
        
        bot_response_text = response.choices[0].message.content
        
        return jsonify({
            "response": bot_response_text
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
