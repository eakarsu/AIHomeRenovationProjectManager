import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import API from '../services/api';

const empty = { log_date:'', weather:'sunny', temperature:'', crew_size:'', hours_worked:'', work_performed:'', issues:'', materials_used:'', visitor_log:'', safety_incidents:'', notes:'' };

const weatherEmoji = { sunny:'☀️', cloudy:'☁️', rainy:'🌧️', snowy:'❄️', windy:'💨' };
const weatherColor = { sunny:'#f59e0b', cloudy:'#94a3b8', rainy:'#3b82f6', snowy:'#e2e8f0', windy:'#8b5cf6' };

export default function DailyLog({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState({});

  useEffect(() => { load(); }, []);
  const load = async () => { const { data } = await API.get('/dailylog'); setItems(Array.isArray(data) ? data : (data.data || [])); };
  const handleSave = async () => { if (editing) await API.put(`/dailylog/${form.id}`, form); else await API.post('/dailylog', form); setShowForm(false); setForm(empty); setEditing(false); load(); };
  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; await API.delete(`/dailylog/${id}`); setSelected(null); load(); };
  const handleEdit = (item) => { setForm({...item, log_date:item.log_date?.split('T')[0]||''}); setEditing(true); setShowForm(true); setSelected(null); };

  const today = new Date().toISOString().split('T')[0];
  const toggleExpand = (id, section) => { const key = `${id}-${section}`; setExpanded(prev => ({...prev, [key]: !prev[key]})); };

  const formatDate = (d) => { if (!d) return ''; const date = new Date(d); return date.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' }); };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="page-header">
        <div><h1>Daily Log</h1><p>Project journal for daily activity notes</p></div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => { setForm({...empty, log_date: today}); setEditing(false); setShowForm(true); }}>+ New Entry</button>
        </div>
      </div>
      <div className="summary-grid">
        <div className="summary-card"><div className="label">Total Entries</div><div className="value">{items.length}</div></div>
        <div className="summary-card"><div className="label">Total Hours</div><div className="value">{items.reduce((s,i) => s + (parseFloat(i.hours_worked)||0), 0).toFixed(1)}</div></div>
        <div className="summary-card"><div className="label">Avg Crew Size</div><div className="value">{items.length ? (items.reduce((s,i) => s + (parseInt(i.crew_size)||0), 0) / items.length).toFixed(1) : '0'}</div></div>
        <div className="summary-card"><div className="label">Days with Issues</div><div className="value" style={{color:'#f87171'}}>{items.filter(i => i.issues && i.issues.trim()).length}</div></div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:'16px', marginTop:'20px' }}>
        {items.map(item => (
          <div key={item.id} style={{ background:'#1e293b', borderRadius:'12px', padding:'20px', borderLeft:`4px solid ${weatherColor[item.weather]||'#94a3b8'}`, cursor:'pointer' }} onClick={() => setSelected(item)}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
              <h3 style={{ margin:0, color:'#f1f5f9', fontSize:'16px' }}>{formatDate(item.log_date)}</h3>
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <span style={{ fontSize:'20px' }}>{weatherEmoji[item.weather]||'🌤️'}</span>
                {item.temperature && <span style={{ color:'#94a3b8', fontSize:'14px' }}>{item.temperature}</span>}
              </div>
            </div>
            <div style={{ display:'flex', gap:'16px', marginBottom:'12px', flexWrap:'wrap' }}>
              {item.crew_size && <span style={{ color:'#94a3b8', fontSize:'13px' }}>👷 Crew: {item.crew_size}</span>}
              {item.hours_worked && <span style={{ color:'#94a3b8', fontSize:'13px' }}>⏱️ Hours: {item.hours_worked}</span>}
            </div>
            {item.work_performed && <p style={{ color:'#cbd5e1', margin:'0 0 8px 0', fontSize:'14px', lineHeight:'1.5' }}>{item.work_performed}</p>}
            {item.issues && item.issues.trim() && <p style={{ color:'#fb923c', margin:'0 0 8px 0', fontSize:'13px', lineHeight:'1.4' }}>⚠️ {item.issues}</p>}
            <div style={{ display:'flex', gap:'8px', marginTop:'8px', flexWrap:'wrap' }}>
              {item.materials_used && item.materials_used.trim() && (
                <button style={{ background:'#334155', border:'none', color:'#94a3b8', padding:'4px 10px', borderRadius:'6px', fontSize:'12px', cursor:'pointer' }} onClick={(e) => { e.stopPropagation(); toggleExpand(item.id, 'materials'); }}>
                  {expanded[`${item.id}-materials`] ? '▾' : '▸'} Materials
                </button>
              )}
              {item.visitor_log && item.visitor_log.trim() && (
                <button style={{ background:'#334155', border:'none', color:'#94a3b8', padding:'4px 10px', borderRadius:'6px', fontSize:'12px', cursor:'pointer' }} onClick={(e) => { e.stopPropagation(); toggleExpand(item.id, 'visitors'); }}>
                  {expanded[`${item.id}-visitors`] ? '▾' : '▸'} Visitors
                </button>
              )}
              {item.safety_incidents && item.safety_incidents.trim() && (
                <button style={{ background:'#334155', border:'none', color:'#f87171', padding:'4px 10px', borderRadius:'6px', fontSize:'12px', cursor:'pointer' }} onClick={(e) => { e.stopPropagation(); toggleExpand(item.id, 'safety'); }}>
                  {expanded[`${item.id}-safety`] ? '▾' : '▸'} Safety Incidents
                </button>
              )}
            </div>
            {expanded[`${item.id}-materials`] && <div style={{ marginTop:'8px', padding:'8px 12px', background:'#0f172a', borderRadius:'6px', color:'#94a3b8', fontSize:'13px', whiteSpace:'pre-wrap' }}>{item.materials_used}</div>}
            {expanded[`${item.id}-visitors`] && <div style={{ marginTop:'8px', padding:'8px 12px', background:'#0f172a', borderRadius:'6px', color:'#94a3b8', fontSize:'13px', whiteSpace:'pre-wrap' }}>{item.visitor_log}</div>}
            {expanded[`${item.id}-safety`] && <div style={{ marginTop:'8px', padding:'8px 12px', background:'#0f172a', borderRadius:'6px', color:'#f87171', fontSize:'13px', whiteSpace:'pre-wrap' }}>{item.safety_incidents}</div>}
          </div>
        ))}
      </div>

      {selected && <div className="modal-overlay" onClick={()=>setSelected(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>{formatDate(selected.log_date)}</h2><button className="modal-close" onClick={()=>setSelected(null)}>&times;</button></div>
        <div className="modal-body">
          <div className="detail-grid">
            <div className="detail-item"><div className="label">Weather</div><div className="value">{weatherEmoji[selected.weather]} {selected.weather}</div></div>
            <div className="detail-item"><div className="label">Temperature</div><div className="value">{selected.temperature||'N/A'}</div></div>
            <div className="detail-item"><div className="label">Crew Size</div><div className="value">{selected.crew_size||'N/A'}</div></div>
            <div className="detail-item"><div className="label">Hours Worked</div><div className="value">{selected.hours_worked||'N/A'}</div></div>
            <div className="detail-item detail-full"><div className="label">Work Performed</div><div className="value">{selected.work_performed||'N/A'}</div></div>
            {selected.issues && selected.issues.trim() && <div className="detail-item detail-full"><div className="label" style={{color:'#fb923c'}}>Issues</div><div className="value" style={{color:'#fb923c'}}>{selected.issues}</div></div>}
            {selected.materials_used && selected.materials_used.trim() && <div className="detail-item detail-full"><div className="label">Materials Used</div><div className="value">{selected.materials_used}</div></div>}
            {selected.visitor_log && selected.visitor_log.trim() && <div className="detail-item detail-full"><div className="label">Visitor Log</div><div className="value">{selected.visitor_log}</div></div>}
            {selected.safety_incidents && selected.safety_incidents.trim() && <div className="detail-item detail-full"><div className="label" style={{color:'#f87171'}}>Safety Incidents</div><div className="value" style={{color:'#f87171'}}>{selected.safety_incidents}</div></div>}
            {selected.notes && selected.notes.trim() && <div className="detail-item detail-full"><div className="label">Notes</div><div className="value">{selected.notes}</div></div>}
          </div>
          <div className="detail-actions"><button className="btn btn-primary btn-sm" onClick={()=>handleEdit(selected)}>Edit</button><button className="btn btn-danger btn-sm" onClick={()=>handleDelete(selected.id)}>Delete</button></div>
        </div>
      </div></div>}

      {showForm && <div className="modal-overlay" onClick={()=>setShowForm(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>{editing?'Edit Log Entry':'New Daily Log Entry'}</h2><button className="modal-close" onClick={()=>setShowForm(false)}>&times;</button></div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group"><label>Date</label><input type="date" value={form.log_date} onChange={e=>setForm({...form,log_date:e.target.value})} /></div>
            <div className="form-group"><label>Weather</label><select value={form.weather} onChange={e=>setForm({...form,weather:e.target.value})}><option value="sunny">☀️ Sunny</option><option value="cloudy">☁️ Cloudy</option><option value="rainy">🌧️ Rainy</option><option value="snowy">❄️ Snowy</option><option value="windy">💨 Windy</option></select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Temperature</label><input value={form.temperature} onChange={e=>setForm({...form,temperature:e.target.value})} placeholder="e.g. 72°F" /></div>
            <div className="form-group"><label>Crew Size</label><input type="number" value={form.crew_size} onChange={e=>setForm({...form,crew_size:e.target.value})} /></div>
            <div className="form-group"><label>Hours Worked</label><input type="number" step="0.5" value={form.hours_worked} onChange={e=>setForm({...form,hours_worked:e.target.value})} /></div>
          </div>
          <div className="form-group"><label>Work Performed</label><textarea rows="4" value={form.work_performed} onChange={e=>setForm({...form,work_performed:e.target.value})} placeholder="Describe work completed today..." /></div>
          <div className="form-group"><label>Issues</label><textarea rows="2" value={form.issues} onChange={e=>setForm({...form,issues:e.target.value})} placeholder="Any issues encountered..." /></div>
          <div className="form-group"><label>Materials Used</label><textarea rows="2" value={form.materials_used} onChange={e=>setForm({...form,materials_used:e.target.value})} placeholder="List materials used today..." /></div>
          <div className="form-group"><label>Visitor Log</label><textarea rows="2" value={form.visitor_log} onChange={e=>setForm({...form,visitor_log:e.target.value})} placeholder="Record any site visitors..." /></div>
          <div className="form-group"><label>Safety Incidents</label><textarea rows="2" value={form.safety_incidents} onChange={e=>setForm({...form,safety_incidents:e.target.value})} placeholder="Report any safety incidents..." /></div>
          <div className="form-group"><label>Notes</label><textarea rows="2" value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
        </div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={()=>setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{editing?'Update':'Create'}</button></div>
      </div></div>}
    </Layout>
  );
}
