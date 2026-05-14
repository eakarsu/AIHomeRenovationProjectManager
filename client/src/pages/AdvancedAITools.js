import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AIResponse from '../components/AIResponse';
import API from '../services/api';

const TABS = [
  { id: 'predict', label: '📅 Timeline Predictor', endpoint: '/timeline/ai/predict', desc: 'Calibrated P50/P90 timeline prediction with per-phase durations and risk factors.' },
  { id: 'estimate', label: '🧱 Material Cost Estimator', endpoint: '/materials/ai/cost-estimate', desc: 'Itemized regional materials estimate with low/mid/high totals and substitutions.' },
  { id: 'insight', label: '🔍 Inspection Insight', endpoint: '/inspections/ai/insight', desc: 'Analyze a completed inspection - severity, code refs, remediation plan, cost band.' },
];

export default function AdvancedAITools({ user, onLogout }) {
  const [tab, setTab] = useState(TABS[0].id);
  const [projects, setProjects] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [aiData, setAIData] = useState(null);
  const [aiLoading, setAILoading] = useState(false);
  const [error, setError] = useState(null);

  // Forms
  const [predictForm, setPredictForm] = useState({ project_id: '', notes: '' });
  const [estimateForm, setEstimateForm] = useState({ project_id: '', region: '', items: '', tier: 'mid' });
  const [insightForm, setInsightForm] = useState({ inspection_id: '' });

  useEffect(() => { loadRefData(); }, []);

  const loadRefData = async () => {
    try {
      const [pRes, iRes] = await Promise.all([
        API.get('/projects').catch(() => ({ data: [] })),
        API.get('/inspections').catch(() => ({ data: [] })),
      ]);
      setProjects(Array.isArray(pRes.data) ? pRes.data : (pRes.data?.data || []));
      setInspections(Array.isArray(iRes.data) ? iRes.data : (iRes.data?.data || []));
    } catch {/* ignore */}
  };

  const handleSwitchTab = (id) => {
    setTab(id);
    setAIData(null);
    setError(null);
  };

  const submit = async (endpoint, body) => {
    setAILoading(true);
    setAIData(null);
    setError(null);
    try {
      const { data } = await API.post(endpoint, body);
      setAIData(data);
    } catch (err) {
      const status = err.response?.status;
      const msg = status === 429
        ? 'AI rate limit reached. Please wait a moment.'
        : (err.response?.data?.error || err.message || 'Request failed');
      setError(msg);
      setAIData({ success: false, content: msg });
    }
    setAILoading(false);
  };

  const onPredict = (e) => {
    e.preventDefault();
    const body = {};
    if (predictForm.project_id) body.project_id = Number(predictForm.project_id);
    if (predictForm.notes) body.notes = predictForm.notes;
    submit('/timeline/ai/predict', body);
  };

  const onEstimate = (e) => {
    e.preventDefault();
    const body = {};
    if (estimateForm.project_id) body.project_id = Number(estimateForm.project_id);
    if (estimateForm.region) body.region = estimateForm.region;
    if (estimateForm.tier) body.tier = estimateForm.tier;
    if (estimateForm.items) {
      body.items = estimateForm.items
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    submit('/materials/ai/cost-estimate', body);
  };

  const onInsight = (e) => {
    e.preventDefault();
    if (!insightForm.inspection_id) {
      setError('Please select an inspection.');
      return;
    }
    submit('/inspections/ai/insight', { inspection_id: Number(insightForm.inspection_id) });
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="page-header">
        <div>
          <h1>Advanced AI Tools</h1>
          <p>Timeline prediction, material cost estimation, and inspection insights</p>
        </div>
      </div>

      <div className="header-actions" style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`btn ${tab === t.id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleSwitchTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="data-table-container" style={{ padding: 24 }}>
        <p style={{ color: '#94a3b8', marginBottom: 16 }}>{TABS.find((t) => t.id === tab)?.desc}</p>

        {tab === 'predict' && (
          <form onSubmit={onPredict}>
            <div className="form-group">
              <label>Project</label>
              <select
                value={predictForm.project_id}
                onChange={(e) => setPredictForm({ ...predictForm, project_id: e.target.value })}
              >
                <option value="">-- Optional --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name || p.title || `Project #${p.id}`}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Notes / Constraints</label>
              <textarea
                value={predictForm.notes}
                onChange={(e) => setPredictForm({ ...predictForm, notes: e.target.value })}
                placeholder="Known constraints, dependencies, weather, supply chain risks..."
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={aiLoading}>
              {aiLoading ? 'Predicting...' : 'Predict Timeline'}
            </button>
          </form>
        )}

        {tab === 'estimate' && (
          <form onSubmit={onEstimate}>
            <div className="form-row">
              <div className="form-group">
                <label>Project</label>
                <select
                  value={estimateForm.project_id}
                  onChange={(e) => setEstimateForm({ ...estimateForm, project_id: e.target.value })}
                >
                  <option value="">-- Optional --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name || p.title || `Project #${p.id}`}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Region</label>
                <input
                  value={estimateForm.region}
                  onChange={(e) => setEstimateForm({ ...estimateForm, region: e.target.value })}
                  placeholder="e.g., Austin, TX"
                />
              </div>
              <div className="form-group">
                <label>Tier</label>
                <select
                  value={estimateForm.tier}
                  onChange={(e) => setEstimateForm({ ...estimateForm, tier: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="mid">Mid</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Items (one per line)</label>
              <textarea
                rows={6}
                value={estimateForm.items}
                onChange={(e) => setEstimateForm({ ...estimateForm, items: e.target.value })}
                placeholder={'2x4 lumber - 200 boards\nDrywall sheets - 80\nKitchen cabinets - 12 LF'}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={aiLoading}>
              {aiLoading ? 'Estimating...' : 'Estimate Cost'}
            </button>
          </form>
        )}

        {tab === 'insight' && (
          <form onSubmit={onInsight}>
            <div className="form-group">
              <label>Inspection *</label>
              <select
                value={insightForm.inspection_id}
                onChange={(e) => setInsightForm({ ...insightForm, inspection_id: e.target.value })}
                required
              >
                <option value="">-- Select Inspection --</option>
                {inspections.map((i) => (
                  <option key={i.id} value={i.id}>
                    #{i.id} {i.inspection_type || i.type || ''} {i.status ? `(${i.status})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" type="submit" disabled={aiLoading}>
              {aiLoading ? 'Analyzing...' : 'Analyze Inspection'}
            </button>
          </form>
        )}

        {error && (
          <div style={{ marginTop: 16, padding: 12, background: '#7f1d1d', color: '#fecaca', borderRadius: 8 }}>
            {error}
          </div>
        )}

        {(aiLoading || aiData) && (
          <div style={{ marginTop: 24 }}>
            <AIResponse data={aiData} loading={aiLoading} />
          </div>
        )}
      </div>
    </Layout>
  );
}
