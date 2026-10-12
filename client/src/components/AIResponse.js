import React from 'react';
import AIReport from './AIReport';

export default function AIResponse({ data, loading }) {
  if (loading) {
    return (
      <div className="ai-response">
        <div className="ai-loading">
          <div className="spinner"></div>
          <span>AI is analyzing... This may take a moment.</span>
        </div>
      </div>
    );
  }

  if (!data) return null;
  if (data.success !== false) return <AIReport response={data} title="AI Analysis" />;

  return (
    <div className="ai-response">
      <div className="ai-response-header">
        <span className="ai-icon">🤖</span>
        <h3>AI Analysis</h3>
        {data.model && <span className="model-tag">{data.model}</span>}
      </div>
      <div className="ai-content">
        <p style={{ color: '#f87171' }}>{data.content}</p>
      </div>
      {data.usage && (
        <div style={{ marginTop: 12, fontSize: 11, color: '#64748b' }}>
          Tokens: {data.usage.prompt_tokens} prompt / {data.usage.completion_tokens} completion
        </div>
      )}
    </div>
  );
}
