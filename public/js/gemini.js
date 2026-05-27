import { GEMINI_API_KEY } from './gemini-config.js';

// DOM Elements
const chatWidget = document.getElementById('chat-widget');
const chatPanel = document.getElementById('chat-panel');
const chatToggleBtn = document.getElementById('chat-toggle');
const chatCloseBtn = document.getElementById('chat-close');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send');

let isChatOpen = false;
let chatHistory = [];

// Toggle Chat Window
function toggleChat() {
  isChatOpen = !isChatOpen;
  if (isChatOpen) {
    chatPanel.classList.remove('hidden');
    chatToggleBtn.style.transform = 'scale(0)';
    setTimeout(() => chatInput.focus(), 300);
  } else {
    chatPanel.classList.add('hidden');
    chatToggleBtn.style.transform = 'scale(1)';
  }
}

chatToggleBtn.addEventListener('click', toggleChat);
chatCloseBtn.addEventListener('click', toggleChat);

// Handle Enter Key
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

chatSendBtn.addEventListener('click', sendMessage);

// Scrape context from the portfolio page
function getPortfolioContext() {
  const name = document.getElementById('aboutName')?.textContent || 'Suraj Kumar Mahto';
  const bio = document.getElementById('aboutBio')?.textContent || '';
  
  const skills = Array.from(document.querySelectorAll('.skill-card h3')).map(el => el.textContent).join(', ');
  
  const projects = Array.from(document.querySelectorAll('.project-card')).map(card => {
    const title = card.querySelector('.project-title')?.textContent;
    const desc = card.querySelector('.project-desc')?.textContent;
    const tech = Array.from(card.querySelectorAll('.tag')).map(t => t.textContent).join(', ');
    return `${title}: ${desc} (Tech: ${tech})`;
  }).join('\n');

  const experience = Array.from(document.querySelectorAll('.tl-item')).map(item => {
    const role = item.querySelector('.tl-role')?.textContent;
    const desc = item.querySelector('.tl-desc')?.textContent;
    return `${role} - ${desc}`;
  }).join('\n');

  return `
You are Suraj's AI Assistant, embedded on his personal portfolio website. 
Your job is to answer questions about Suraj, his skills, projects, and experience in a friendly, professional, and concise manner.
Use markdown to format your responses (bullet points, bold text). 
If you don't know the answer based on the context below, politely say you don't know and suggest they contact Suraj directly via the contact form.

--- SURAJ'S INFO ---
Name: ${name}
Bio: ${bio.trim().replace(/\s+/g, ' ')}

--- SKILLS ---
${skills}

--- PROJECTS ---
${projects}

--- EXPERIENCE ---
${experience}
  `;
}

function appendMessage(role, text) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${role}`;
  
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  
  if (role === 'bot') {
    // Parse markdown if marked is available, else fallback to plain text
    if (window.marked) {
      bubble.innerHTML = marked.parse(text);
    } else {
      bubble.textContent = text;
    }
  } else {
    bubble.textContent = text;
  }

  msgDiv.appendChild(bubble);
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'message bot typing';
  msgDiv.id = 'typing-indicator';
  
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble typing-indicator';
  bubble.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
  
  msgDiv.appendChild(bubble);
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) indicator.remove();
}

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  if (GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE" || !GEMINI_API_KEY) {
    alert("Please add your Gemini API key in js/gemini-config.js first.");
    return;
  }

  // Add user message to UI and history
  appendMessage('user', text);
  chatInput.value = '';
  chatHistory.push({ role: 'user', parts: [{ text }] });

  showTypingIndicator();

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: getPortfolioContext() }]
        },
        contents: chatHistory,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 400
        }
      })
    });

    if (!response.ok) throw new Error('API Error');

    removeTypingIndicator();

    // Create the bot message bubble for streaming
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot';
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    msgDiv.appendChild(bubble);
    chatMessages.appendChild(msgDiv);

    // Read the stream
    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    let fullResponse = '';
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      buffer += value;
      const lines = buffer.split('\n');
      // Keep the last incomplete line in the buffer
      buffer = lines.pop();

      for (let line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
              fullResponse += parsed.candidates[0].content.parts[0].text;
              
              // Render markdown progressively
              if (window.marked) {
                bubble.innerHTML = marked.parse(fullResponse);
              } else {
                bubble.textContent = fullResponse;
              }
              chatMessages.scrollTop = chatMessages.scrollHeight;
            }
          } catch (e) {
            console.error('Error parsing SSE chunk:', e);
          }
        }
      }
    }

    chatHistory.push({ role: 'model', parts: [{ text: fullResponse }] });

  } catch (error) {
    console.error(error);
    removeTypingIndicator();
    appendMessage('bot', 'Sorry, I am having trouble connecting to the server right now. Please try again later.');
    chatHistory.pop();
  }
}
