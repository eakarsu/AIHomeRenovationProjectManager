
import FullAIExamples, { useFullAIExamples } from "../components/FullAIExamples.jsx";
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AIResponse from '../components/AIResponse';
import AIPromptPresets from '../components/AIPromptPresets';
import API from '../services/api';

const TABS = [
  { id: 'predict', label: '📅 Timeline Predictor', endpoint: '/timeline/ai/predict', desc: 'Calibrated P50/P90 timeline prediction with per-phase durations and risk factors.' },
  { id: 'estimate', label: '🧱 Material Cost Estimator', endpoint: '/materials/ai/cost-estimate', desc: 'Itemized regional materials estimate with low/mid/high totals and substitutions.' },
  { id: 'insight', label: '🔍 Inspection Insight', endpoint: '/inspections/ai/insight', desc: 'Analyze a completed inspection - severity, code refs, remediation plan, cost band.' },
];

export default function AdvancedAITools({ user, onLogout }) {
  const fullAIExamples = useFullAIExamples();

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
          <form onSubmit={onPredict} data-full-ai-workspace="AdvancedAITools"><FullAIExamples controller={fullAIExamples} disabled={Boolean(aiLoading)} />
            <AIPromptPresets value={predictForm} onChange={setPredictForm} presets={[
              { label: 'Kitchen schedule', values: { notes: 'Cabinet delivery may slip two weeks. Review rough electrical, drywall, and countertop dependencies before changing the completion date.' } },
              { label: 'Bathroom sequence', values: { notes: 'Waterproofing inspection must be complete before tiling. Assess plumbing and tile crew handoffs.' } },
              { label: 'Weather delay', values: { notes: 'Exterior work may lose five days to rain. Identify indoor tasks that can proceed while the deck work is paused.' } },
            ]} />
            <div className="form-group">
              <label>Project</label>
              <select
                value={predictForm.project_id}
                onChange={(e) => setPredictForm({ ...predictForm, project_id: e.target.value })} data-full-ai-field={fullAIExamples.bind({ current: predictForm.project_id, change: (e) => setPredictForm({ ...predictForm, project_id: e.target.value }), label: "predictForm.project_id", manual: false, json: false, sample: '' }, "p1-4470", undefined)}
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
                placeholder="Known constraints, dependencies, weather, supply chain risks..." data-full-ai-field={fullAIExamples.bind({ current: predictForm.notes, change: (e) => setPredictForm({ ...predictForm, notes: e.target.value }), label: "predictForm.notes", manual: false, json: false, sample: '' }, "p1-5002", undefined)}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={aiLoading}>
              {aiLoading ? 'Predicting...' : 'Predict Timeline'}
            </button>
          </form>
        )}

        {tab === 'estimate' && (
          <form onSubmit={onEstimate} data-full-ai-workspace="AdvancedAITools"><FullAIExamples controller={fullAIExamples} disabled={Boolean(aiLoading)} />
            <AIPromptPresets value={estimateForm} onChange={setEstimateForm} presets={[
              { label: 'Kitchen materials', values: { region: 'Austin, TX', tier: 'mid', items: 'Shaker cabinets - 18 linear feet\nQuartz countertop - 35 square feet\nPorcelain backsplash tile - 45 square feet' } },
              { label: 'Bathroom materials', values: { region: 'Portland, OR', tier: 'mid', items: 'Porcelain floor tile - 90 square feet\nWaterproofing membrane - 120 square feet\nVanity - 60 inches' } },
              { label: 'Basement materials', values: { region: 'Denver, CO', tier: 'low', items: 'Drywall sheets - 80\n2x4 lumber - 200 boards\nLuxury vinyl plank - 700 square feet' } },
            ]} />
            <div className="form-row">
              <div className="form-group">
                <label>Project</label>
                <select
                  value={estimateForm.project_id}
                  onChange={(e) => setEstimateForm({ ...estimateForm, project_id: e.target.value })} data-full-ai-field={fullAIExamples.bind({ current: estimateForm.project_id, change: (e) => setEstimateForm({ ...estimateForm, project_id: e.target.value }), label: "estimateForm.project_id", manual: false, json: false, sample: '' }, "p1-5686", undefined)}
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
                  placeholder="e.g., Austin, TX" data-full-ai-field={fullAIExamples.bind({ current: estimateForm.region, change: (e) => setEstimateForm({ ...estimateForm, region: e.target.value }), label: "estimateForm.region", manual: false, json: false, sample: '' }, "p1-6232", undefined)}
                />
              </div>
              <div className="form-group">
                <label>Tier</label>
                <select
                  value={estimateForm.tier}
                  onChange={(e) => setEstimateForm({ ...estimateForm, tier: e.target.value })} data-full-ai-field={fullAIExamples.bind({ current: estimateForm.tier, change: (e) => setEstimateForm({ ...estimateForm, tier: e.target.value }), label: "estimateForm.tier", manual: false, json: false, sample: 'mid' }, "p1-6566", undefined)}
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
                placeholder={'2x4 lumber - 200 boards\nDrywall sheets - 80\nKitchen cabinets - 12 LF'} data-full-ai-field={fullAIExamples.bind({ current: estimateForm.items, change: (e) => setEstimateForm({ ...estimateForm, items: e.target.value }), label: "estimateForm.items", manual: false, json: false, sample: '' }, "p1-7057", undefined)}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={aiLoading}>
              {aiLoading ? 'Estimating...' : 'Estimate Cost'}
            </button>
          </form>
        )}

        {tab === 'insight' && (
          <form onSubmit={onInsight} data-full-ai-workspace="AdvancedAITools"><FullAIExamples controller={fullAIExamples} disabled={Boolean(aiLoading)} />
            <AIPromptPresets value={insightForm} onChange={setInsightForm} presets={[
              { label: 'First available', values: { inspection_id: insightForm.inspection_id || inspections[0]?.id || '' } },
              { label: 'Next available', values: { inspection_id: insightForm.inspection_id || inspections[1]?.id || inspections[0]?.id || '' } },
              { label: 'Latest available', values: { inspection_id: insightForm.inspection_id || inspections[inspections.length - 1]?.id || '' } },
            ]} />
            {!inspections.length && <p role="status">A saved inspection is required before an insight can be generated.</p>}
            <div className="form-group">
              <label>Inspection *</label>
              <select
                value={insightForm.inspection_id}
                onChange={(e) => setInsightForm({ ...insightForm, inspection_id: e.target.value })}
                required data-full-ai-field={fullAIExamples.bind({ current: insightForm.inspection_id, change: (e) => setInsightForm({ ...insightForm, inspection_id: e.target.value }), label: "insightForm.inspection_id", manual: false, json: false, sample: '' }, "p1-7733", undefined)}
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
