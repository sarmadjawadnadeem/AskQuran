const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const clearBtn = document.getElementById('clear-btn');

let sessionChat = JSON.parse(sessionStorage.getItem('chatHistory')) || [];

function saveSession() {
    sessionStorage.setItem('chatHistory', JSON.stringify(sessionChat));
}

// Custom minimal markdown parser enforcing security while parsing our backend format
function renderMarkdownToHTML(text) {
    let html = escapeHTML(text);
    html = html
        .replace(/### (.*?)\n/g, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^> (.*?)$/gm, '<blockquote>$1</blockquote>')
        .replace(/---/g, '<hr>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
    
    html = `<p>${html}</p>`.replace(/<p><\/p>/g, '');
    
    // Safely unescape the specific formatting for Arabic verses output by the backend
    html = html.replace(/<div class="arabic-verse" dir="rtl">(.*?)<\/div>/g, '<div class="arabic-verse" dir="rtl">$1</div>');
    return html;
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&',
        '<': '<',
        '>': '>',
        "'": "'",
        '"': '"'
    }[tag]));
}

function appendMessage(role, content, save = true) {
    if (save) {
        sessionChat.push({ role, content });
        saveSession();
    }

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}-message`;

    if (role === 'assistant') {
        msgDiv.innerHTML = renderMarkdownToHTML(content);
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = '📋 Copy Response';
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(content);
            copyBtn.innerHTML = '✅ Copied!';
            setTimeout(() => copyBtn.innerHTML = '📋 Copy Response', 2000);
        };
        msgDiv.appendChild(copyBtn);
    } else {
        msgDiv.textContent = content;
    }

    chatBox.appendChild(msgDiv);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

function addLoading() {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message assistant-message loading-indicator`;
    msgDiv.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';
    chatBox.appendChild(msgDiv);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    return msgDiv;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    userInput.value = '';
    userInput.style.height = 'auto';
    sendBtn.disabled = true;

    appendMessage('user', text);
    const loadingIndicator = addLoading();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });

        const data = await response.json();
        chatBox.removeChild(loadingIndicator);

        if (response.ok) {
            appendMessage('assistant', data.response);
        } else {
            appendMessage('assistant', `Error: ${data.error || 'Failed to retrieve response.'}`);
        }
    } catch (error) {
        chatBox.removeChild(loadingIndicator);
        appendMessage('assistant', 'Network error. Please try again.');
    }

    sendBtn.disabled = false;
    userInput.focus();
}

if (sessionChat.length > 0) {
    chatBox.innerHTML = '';
    sessionChat.forEach(msg => appendMessage(msg.role, msg.content, false));
}

userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight < 200 ? this.scrollHeight : 200) + 'px';
    sendBtn.disabled = this.value.trim().length === 0;
});

userInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendBtn.disabled) sendMessage();
    }
});

sendBtn.addEventListener('click', sendMessage);

clearBtn.addEventListener('click', () => {
    sessionStorage.removeItem('chatHistory');
    sessionChat = [];
    chatBox.innerHTML = `<div class="message assistant-message"><p>Welcome. I am a strict Quranic data-retrieval assistant. You can ask me questions about the Quran in any language, and I will provide answers based exclusively on verified Quranic verses found in my dataset.</p></div>`;
});