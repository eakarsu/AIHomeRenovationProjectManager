const fetch = require('node-fetch');
require('dotenv').config({ path: '../.env' });

async function queryAI(prompt, systemPrompt = '') {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  try {
    const baseUrl = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/chat/completions`, {
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
    if (!response.ok || data.error) throw new Error(data.error?.message || `OpenRouter request failed with HTTP ${response.status}`);
    const content = data.choices?.[0]?.message?.content;
    if (!content || !String(content).trim()) throw new Error('OpenRouter returned empty content');
    return {
      success: true,
      content,
      model: data.model,
      usage: data.usage,
    };
  } catch (err) { throw err; }
}

async function queryAIVision(imageBase64, mimeType, systemPrompt = '') {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  try {
    const baseUrl = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/chat/completions`, {
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
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${imageBase64}` },
              },
              {
                type: 'text',
                text: 'Analyze this home renovation photo and return a JSON object with these exact fields: { "progress_assessment": string, "safety_issues": string[], "quality_observations": string[], "completion_estimate": number (0-100), "recommended_next_steps": string[] }',
              },
            ],
          },
        ],
        temperature: 0.4,
        max_tokens: 1500,
      }),
    });

    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error?.message || `OpenRouter request failed with HTTP ${response.status}`);
    const content = data.choices?.[0]?.message?.content;
    if (!content || !String(content).trim()) throw new Error('OpenRouter returned empty content');
    return {
      success: true,
      content,
      model: data.model,
      usage: data.usage,
    };
  } catch (err) { throw err; }
}

module.exports = { queryAI, queryAIVision };
