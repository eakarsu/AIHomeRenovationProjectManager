const fetch = require('node-fetch');
require('dotenv').config({ path: '../.env' });

async function queryAI(prompt, systemPrompt = '') {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    return {
      success: false,
      content: 'OpenRouter API key not configured. Please add your key to the .env file.',
    };
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Home Renovation Manager',
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    if (data.error) {
      return { success: false, content: data.error.message || 'AI service error' };
    }
    return {
      success: true,
      content: data.choices?.[0]?.message?.content || 'No response from AI',
      model: data.model,
      usage: data.usage,
    };
  } catch (err) {
    return { success: false, content: `AI service error: ${err.message}` };
  }
}

module.exports = { queryAI };
