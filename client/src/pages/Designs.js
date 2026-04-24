import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AIResponse from '../components/AIResponse';
import API from '../services/api';

const emptyDesign = {
  room_type: '', style: '', description: '', color_palette: '', materials: '',
  dimensions: '', estimated_cost: '', status: 'concept', designer_name: '',
  inspiration_url: '', notes: '',
};

export default function Designs({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyDesign);
  const [editing, setEditing] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiData, setAIData] = useState(null);
  const [aiLoading, setAILoading] = useState(false);
  const [aiForm, setAIForm] = useState({ room_type: '', style: '', dimensions: '', budget: '', preferences: '' });
  const [aiMode, setAIMode] = useState('visualize');

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await API.get('/designs');
    setItems(data);
  };

  const handleSave = async () => {
    if (editing) {
      await API.put(`/designs/${form.id}`, form);
    } else {
      await API.post('/designs', form);
    }
    setShowForm(false);
    setForm(emptyDesign);
    setEditing(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this design?')) return;
    await API.delete(`/designs/${id}`);
    setSelected(null);
    load();
  };

  const handleEdit = (item) => {
    setForm(item);
    setEditing(true);
    setShowForm(true);
    setSelected(null);
  };

  const handleAI = async () => {
    setAILoading(true);
    setAIData(null);
    try {
      const endpoint = aiMode === 'visualize' ? '/designs/ai/visualize' : '/designs/ai/recommend';
      const { data } = await API.post(endpoint, aiMode === 'visualize' ? aiForm : { preferences: aiForm.preferences, budget: aiForm.budget });
      setAIData(data);
    } catch (err) {
      setAIData({ success: false, content: err.message });
    }
    setAILoading(false);
  };

  const getBadge = (status) => {
    const map = { concept: 'badge-gray', approved: 'badge-green', in_progress: 'badge-blue', completed: 'badge-green' };
    return map[status] || 'badge-gray';
  };

  const parseColors = (palette) => {
    if (!palette) return [];
    const matches = palette.match(/#[0-9A-Fa-f]{6}/g);
    return matches || [];
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="page-header">
        <div>
          <h1>Design Visualization</h1>
          <p>Explore and manage room designs and materials</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-ai" onClick={() => { setShowAI(true); setAIData(null); setAIMode('visualize'); }}>🤖 AI Visualize</button>
          <button className="btn btn-ai" onClick={() => { setShowAI(true); setAIData(null); setAIMode('recommend'); }} style={{ background: 'linear-gradient(135deg, #ec4899, #be185d)' }}>🎨 AI Style Guide</button>
          <button className="btn btn-primary" onClick={() => { setForm(emptyDesign); setEditing(false); setShowForm(true); }}>+ New Design</button>
        </div>
      </div>

      <div className="dashboard-grid">
        {items.map((item) => (
          <div key={item.id} className="dashboard-card" style={{ '--card-accent': parseColors(item.color_palette)[0] || '#a855f7' }} onClick={() => setSelected(item)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div className="card-title">{item.room_type}</div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>{item.style}</div>
              </div>
              <span className={`badge ${getBadge(item.status)}`}>{item.status}</span>
            </div>
            <div className="card-description">{item.description?.substring(0, 120)}...</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {parseColors(item.color_palette).map((color, i) => (
                <div key={i} style={{ width: 24, height: 24, borderRadius: 6, background: color, border: '2px solid rgba(255,255,255,0.1)' }} title={color} />
              ))}
            </div>
            <div className="card-stats">
              <div className="card-stat"><span className="stat-value">{item.dimensions}</span></div>
              <div className="card-stat"><span className="stat-value money">${parseFloat(item.estimated_cost).toLocaleString()}</span></div>
              {item.designer_name && <div className="card-stat">by <span className="stat-value">{item.designer_name}</span></div>}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <h2>{selected.room_type} - {selected.style}</h2>
              <button className="modal-close" onClick={() => setSelected(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {parseColors(selected.color_palette).map((color, i) => (
                  <div key={i} style={{ flex: 1, height: 40, borderRadius: 8, background: color }} title={color} />
                ))}
              </div>
              <div className="detail-grid">
                <div className="detail-item detail-full"><div className="label">Description</div><div className="value">{selected.description}</div></div>
                <div className="detail-item"><div className="label">Style</div><div className="value">{selected.style}</div></div>
                <div className="detail-item"><div className="label">Dimensions</div><div className="value">{selected.dimensions}</div></div>
                <div className="detail-item detail-full"><div className="label">Color Palette</div><div className="value">{selected.color_palette}</div></div>
                <div className="detail-item detail-full"><div className="label">Materials</div><div className="value">{selected.materials}</div></div>
                <div className="detail-item"><div className="label">Estimated Cost</div><div className="value money">${parseFloat(selected.estimated_cost).toLocaleString()}</div></div>
                <div className="detail-item"><div className="label">Status</div><div className="value"><span className={`badge ${getBadge(selected.status)}`}>{selected.status}</span></div></div>
                <div className="detail-item"><div className="label">Designer</div><div className="value">{selected.designer_name}</div></div>
                {selected.notes && <div className="detail-item detail-full"><div className="label">Notes</div><div className="value">{selected.notes}</div></div>}
              </div>
              <div className="detail-actions">
                <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Design' : 'New Design'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group"><label>Room Type</label><input value={form.room_type} onChange={(e) => setForm({ ...form, room_type: e.target.value })} placeholder="e.g., Kitchen, Bathroom" /></div>
                <div className="form-group"><label>Style</label><input value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })} placeholder="e.g., Modern Farmhouse" /></div>
              </div>
              <div className="form-group"><label>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="form-group"><label>Color Palette</label><input value={form.color_palette} onChange={(e) => setForm({ ...form, color_palette: e.target.value })} placeholder="Color names with hex codes" /></div>
              <div className="form-group"><label>Materials</label><textarea value={form.materials} onChange={(e) => setForm({ ...form, materials: e.target.value })} /></div>
              <div className="form-row">
                <div className="form-group"><label>Dimensions</label><input value={form.dimensions} onChange={(e) => setForm({ ...form, dimensions: e.target.value })} placeholder="e.g., 20x15 ft" /></div>
                <div className="form-group"><label>Estimated Cost ($)</label><input type="number" value={form.estimated_cost} onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="concept">Concept</option><option value="approved">Approved</option><option value="in_progress">In Progress</option><option value="completed">Completed</option>
                  </select>
                </div>
                <div className="form-group"><label>Designer</label><input value={form.designer_name} onChange={(e) => setForm({ ...form, designer_name: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>Notes</label><textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>{editing ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {showAI && (
        <div className="modal-overlay" onClick={() => setShowAI(false)}>
          <div className="modal modal-ai" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🤖 {aiMode === 'visualize' ? 'AI Design Visualization' : 'AI Style Recommendation'}</h2>
              <button className="modal-close" onClick={() => setShowAI(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {!aiData && !aiLoading && (
                <div className="ai-form">
                  {aiMode === 'visualize' ? (<>
                    <div className="form-row">
                      <div className="form-group"><label>Room Type</label><input value={aiForm.room_type} onChange={(e) => setAIForm({ ...aiForm, room_type: e.target.value })} placeholder="e.g., Kitchen" /></div>
                      <div className="form-group"><label>Style</label><input value={aiForm.style} onChange={(e) => setAIForm({ ...aiForm, style: e.target.value })} placeholder="e.g., Modern Farmhouse" /></div>
                    </div>
                    <div className="form-row">
                      <div className="form-group"><label>Dimensions</label><input value={aiForm.dimensions} onChange={(e) => setAIForm({ ...aiForm, dimensions: e.target.value })} placeholder="e.g., 20x15 ft" /></div>
                      <div className="form-group"><label>Budget ($)</label><input type="number" value={aiForm.budget} onChange={(e) => setAIForm({ ...aiForm, budget: e.target.value })} /></div>
                    </div>
                    <div className="form-group"><label>Preferences</label><textarea value={aiForm.preferences} onChange={(e) => setAIForm({ ...aiForm, preferences: e.target.value })} placeholder="Describe your style preferences..." /></div>
                  </>) : (<>
                    <div className="form-group"><label>Your Preferences</label><textarea value={aiForm.preferences} onChange={(e) => setAIForm({ ...aiForm, preferences: e.target.value })} placeholder="Describe your overall style preferences..." /></div>
                    <div className="form-group"><label>Total Budget ($)</label><input type="number" value={aiForm.budget} onChange={(e) => setAIForm({ ...aiForm, budget: e.target.value })} /></div>
                  </>)}
                  <button className="btn btn-ai" onClick={handleAI}>{aiMode === 'visualize' ? 'Generate Visualization' : 'Get Style Recommendations'}</button>
                </div>
              )}
              <AIResponse data={aiData} loading={aiLoading} />
              {aiData && <div style={{ marginTop: 16 }}><button className="btn btn-secondary btn-sm" onClick={() => setAIData(null)}>New Analysis</button></div>}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
