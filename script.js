const outputs = {};
let currentTab = 'dockerfile';

function getApiKey() {
  let key = sessionStorage.getItem('openai_key');
  if (!key) {
    key = prompt('🔑 Enter your OpenAI API key\n(stored in browser session only, never saved to code)');
    if (key) sessionStorage.setItem('openai_key', key);
  }
  return key;
}

async function generateKit() {
  const appDesc = document.getElementById('appDesc').value.trim();
  const language = document.getElementById('language').value;
  const apiKey = getApiKey();

  if (!appDesc) {
    alert('Please describe your app first!');
    return;
  }

  if (!apiKey) {
    alert('API key is required!');
    return;
  }

  const btn = document.getElementById('generateBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Generating...';

  document.getElementById('output').classList.remove('hidden');
  document.getElementById('codeDisplay').textContent = '🤖 AI is generating your DevOps kit...';

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1000,
        messages: [
          {
            role: 'system',
            content: 'You are a senior DevOps engineer.'
          },
          {
            role: 'user',
            content: `Generate a complete DevOps starter kit for:

App Description: ${appDesc}
Language/Framework: ${language}

Respond ONLY in this exact JSON format with no extra text:
{
  "dockerfile": "complete Dockerfile content here",
  "compose": "complete docker-compose.yml content here",
  "cicd": "complete GitHub Actions workflow YAML here",
  "kubernetes": "complete Kubernetes deployment YAML here",
  "readme": "complete README.md content here"
}`
          }
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const text = data.choices[0].message.content;
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    outputs.dockerfile = parsed.dockerfile;
    outputs.compose = parsed.compose;
    outputs.cicd = parsed.cicd;
    outputs.kubernetes = parsed.kubernetes;
    outputs.readme = parsed.readme;

    showTab('dockerfile');

  } catch (error) {
    document.getElementById('codeDisplay').textContent =
      '❌ Error: ' + error.message;
    sessionStorage.removeItem('openai_key');
    console.error(error);
  }

  btn.disabled = false;
  btn.textContent = '⚡ Generate DevOps Kit';
}

function showTab(tab) {
  currentTab = tab;

  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');

  document.getElementById('codeDisplay').textContent =
    outputs[tab] || '⏳ Generate a kit first!';
}

function copyCode() {
  const text = document.getElementById('codeDisplay').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('.copy-btn');
    btn.textContent = '✅ Copied!';
    setTimeout(() => btn.textContent = '📋 Copy', 2000);
  });
}
