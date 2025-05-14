document.addEventListener('DOMContentLoaded', () => {
  const chatToggle   = document.getElementById('chatToggle');
  const chatWindow   = document.getElementById('chatWindow');
  const chatForm     = document.getElementById('chatForm');
  const chatInput    = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');

  chatToggle.addEventListener('click', () => {
    chatWindow.style.display =
      chatWindow.style.display === 'block' ? 'none' : 'block';
  });

  function appendMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  chatForm.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = chatInput.value.trim();
    if (!msg) return;
    appendMessage(msg, 'user');
    chatInput.value = '';

    try {
      const resp = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      if (!resp.ok) {
        throw new Error(`Server responded ${resp.status}`);
      }
      const { reply } = await resp.json();
      appendMessage(reply, 'bot');
    } catch (err) {
      appendMessage("Sorry, something went wrong.", 'bot');
      console.error('Chat error:', err);
    }
  });
});
