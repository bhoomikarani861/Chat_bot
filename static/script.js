const chatHistory = document.getElementById('chat-history');
const textInput = document.getElementById('text-input');
const sendBtn = document.getElementById('send-btn');
const micBtn = document.getElementById('mic-btn');
const statusText = document.getElementById('status-text');
const audioPlayer = document.getElementById('audio-player');

// ---------------------------------------------------------
// UI & Chat Logic
// ---------------------------------------------------------

function appendMessage(text, isUser) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', isUser ? 'user-message' : 'bot-message');
    
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    contentDiv.innerText = text;
    
    msgDiv.appendChild(contentDiv);
    chatHistory.appendChild(msgDiv);
    
    // Scroll to bottom
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function showTypingIndicator() {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', 'bot-message');
    msgDiv.id = 'typing-indicator';
    
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content', 'typing-indicator');
    
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.classList.add('typing-dot');
        contentDiv.appendChild(dot);
    }
    
    msgDiv.appendChild(contentDiv);
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

async function sendMessage(messageText) {
    if (!messageText.trim()) return;
    
    // Add user message to UI
    appendMessage(messageText, true);
    textInput.value = '';
    
    // Show typing
    showTypingIndicator();
    statusText.innerText = "Thinking...";

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: messageText })
        });
        
        const data = await response.json();
        removeTypingIndicator();
        
        if (response.ok) {
            statusText.innerText = "Ready";
            appendMessage(data.response, false);
            
            // Play audio using browser's built-in Text-to-Speech (much faster)
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel(); // stop any ongoing speech
                const utterance = new SpeechSynthesisUtterance(data.response);
                window.speechSynthesis.speak(utterance);
            }
        } else {
            statusText.innerText = "Error occurred";
            appendMessage("Sorry, I encountered an error: " + (data.error || "Unknown error"), false);
        }
    } catch (error) {
        console.error("Error sending message:", error);
        removeTypingIndicator();
        statusText.innerText = "Network Error";
        appendMessage("Sorry, could not connect to the server.", false);
    }
}

// ---------------------------------------------------------
// Event Listeners for Text Input
// ---------------------------------------------------------

sendBtn.addEventListener('click', () => {
    sendMessage(textInput.value);
});

textInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage(textInput.value);
    }
});

// ---------------------------------------------------------
// Speech Recognition Logic (Web Speech API)
// ---------------------------------------------------------

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isRecording = false;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop automatically when user stops speaking
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = function() {
        isRecording = true;
        micBtn.classList.add('listening');
        statusText.innerText = "Listening... speak now";
        if ('speechSynthesis' in window) window.speechSynthesis.cancel(); // Pause bot's speech if it's talking
    };

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        textInput.value = transcript;
        sendMessage(transcript);
    };

    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        statusText.innerText = "Mic error: " + event.error;
        stopRecording();
    };

    recognition.onend = function() {
        stopRecording();
        if (statusText.innerText.includes("Listening")) {
            statusText.innerText = "Ready";
        }
    };
} else {
    console.warn("Speech Recognition API not supported in this browser.");
    micBtn.style.display = "none";
    statusText.innerText = "Voice input not supported on this browser";
}

function stopRecording() {
    isRecording = false;
    micBtn.classList.remove('listening');
    if (recognition) {
        recognition.stop();
    }
}

micBtn.addEventListener('click', () => {
    if (!recognition) return;
    
    if (isRecording) {
        stopRecording();
    } else {
        try {
            recognition.start();
        } catch (e) {
            console.error("Could not start recognition", e);
        }
    }
});
