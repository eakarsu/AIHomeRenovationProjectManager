import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import API from '../services/api';

const empty = { payee_name:'', payment_type:'', amount:'', payment_method:'', payment_date:'', invoice_number:'', category:'', description:'', status:'pending', due_date:'', notes:'' };

export default function Payments({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(false);
  const [summary, setSummary] = useState({ total_paid: 0, total_pending: 0, total_overdue: 0, total_payments: 0 });

  useEffect(() => { load(); loadSummary(); }, []);
  const load = async () => { const { data } = await API.get('/payments'); setItems(data); };
  const loadSummary = async () => { const { data } = await API.get('/payments/summary'); setSummary(data); };
  const handleSave = async () => { if (editing) await API.put(`/payments/${form.id}`, form); else await API.post('/payments', form); setShowForm(false); setForm(empty); setEditing(false); load(); loadSummary(); };
  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; await API.delete(`/payments/${id}`); setSelected(null); load(); loadSummary(); };
  const handleEdit = (item) => { setForm({...item, payment_date: item.payment_date ? item.payment_date.split('T')[0] : '', due_date: item.due_date ? item.due_date.split('T')[0] : ''}); setEditing(true); setShowForm(true); setSelected(null); };

  const statusBadge = (status) => {
    const map = { paid:'badge-green', pending:'badge-yellow', overdue:'badge-red', cancelled:'badge-gray' };
    return <span className={`badge ${map[status]||'badge-gray'}`}>{status}</span>;
  };
  const typeBadge = (type) => {
    const map = { deposit:'badge-blue', progress:'badge-purple', final:'badge-green', retainer:'badge-yellow' };
    return <span className={`badge ${map[type]||'badge-gray'}`}>{type}</span>;
  };
  const formatAmount = (amt) => parseFloat(amt || 0).toLocaleString('en-US', { style:'currency', currency:'USD' });

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="page-header">
        <div><h1>Payments</h1><p>Track payments to contractors and vendors</p></div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => { setForm(empty); setEditing(false); setShowForm(true); }}>+ New Payment</button>
        </div>
      </div>
      <div className="summary-grid">
        <div className="summary-card" style={{borderLeft:'4px solid #22c55e'}}><div className="label">Total Paid</div><div className="value" style={{color:'#22c55e'}}>{formatAmount(summary.total_paid)}</div></div>
        <div className="summary-card" style={{borderLeft:'4px solid #eab308'}}><div className="label">Pending</div><div className="value" style={{color:'#eab308'}}>{formatAmount(summary.total_pending)}</div></div>
        <div className="summary-card" style={{borderLeft:'4px solid #ef4444'}}><div className="label">Overdue</div><div className="value" style={{color:'#ef4444'}}>{formatAmount(summary.total_overdue)}</div></div>
        <div className="summary-card" style={{borderLeft:'4px solid #3b82f6'}}><div className="label">Total Payments</div><div className="value" style={{color:'#3b82f6'}}>{summary.total_payments}</div></div>
      </div>
      <div className="data-table-container"><table className="data-table"><thead><tr>
        <th>Payee</th><th>Type</th><th>Amount</th><th>Method</th><th>Date</th><th>Invoice #</th><th>Status</th>
      </tr></thead><tbody>
        {items.map(item => (
          <tr key={item.id} onClick={()=>setSelected(item)}>
            <td style={{fontWeight:600,color:'#f1f5f9'}}>{item.payee_name}</td>
            <td>{typeBadge(item.payment_type)}</td>
            <td style={{fontWeight:600}}>{formatAmount(item.amount)}</td>
            <td>{item.payment_method}</td>
            <td>{item.payment_date ? new Date(item.payment_date).toLocaleDateString() : '-'}</td>
            <td>{item.invoice_number || '-'}</td>
            <td>{statusBadge(item.status)}</td>
          </tr>
        ))}
      </tbody></table></div>

      {selected && <div className="modal-overlay" onClick={()=>setSelected(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>{selected.payee_name}</h2><button className="modal-close" onClick={()=>setSelected(null)}>&times;</button></div>
        <div className="modal-body">
          <div className="detail-grid">
            <div className="detail-item"><div className="label">Payment Type</div><div className="value">{typeBadge(selected.payment_type)}</div></div>
            <div className="detail-item"><div className="label">Amount</div><div className="value">{formatAmount(selected.amount)}</div></div>
            <div className="detail-item"><div className="label">Payment Method</div><div className="value">{selected.payment_method}</div></div>
            <div className="detail-item"><div className="label">Payment Date</div><div className="value">{selected.payment_date ? new Date(selected.payment_date).toLocaleDateString() : '-'}</div></div>
            <div className="detail-item"><div className="label">Invoice Number</div><div className="value">{selected.invoice_number || '-'}</div></div>
            <div className="detail-item"><div className="label">Category</div><div className="value">{selected.category || '-'}</div></div>
            <div className="detail-item"><div className="label">Status</div><div className="value">{statusBadge(selected.status)}</div></div>
            <div className="detail-item"><div className="label">Due Date</div><div className="value">{selected.due_date ? new Date(selected.due_date).toLocaleDateString() : '-'}</div></div>
            {selected.description && <div className="detail-item detail-full"><div className="label">Description</div><div className="value">{selected.description}</div></div>}
            {selected.notes && <div className="detail-item detail-full"><div className="label">Notes</div><div className="value">{selected.notes}</div></div>}
          </div>
          <div className="detail-actions"><button className="btn btn-primary btn-sm" onClick={()=>handleEdit(selected)}>Edit</button><button className="btn btn-danger btn-sm" onClick={()=>handleDelete(selected.id)}>Delete</button></div>
        </div>
      </div></div>}

      {showForm && <div className="modal-overlay" onClick={()=>setShowForm(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>{editing?'Edit Payment':'New Payment'}</h2><button className="modal-close" onClick={()=>setShowForm(false)}>&times;</button></div>
        <div className="modal-body">
          <div className="form-row"><div className="form-group"><label>Payee Name</label><input value={form.payee_name} onChange={e=>setForm({...form,payee_name:e.target.value})} /></div><div className="form-group"><label>Category</label><input value={form.category} onChange={e=>setForm({...form,category:e.target.value})} placeholder="e.g., Plumbing, Electrical" /></div></div>
          <div className="form-row"><div className="form-group"><label>Amount ($)</label><input type="number" step="0.01" min="0" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} /></div><div className="form-group"><label>Invoice Number</label><input value={form.invoice_number} onChange={e=>setForm({...form,invoice_number:e.target.value})} /></div></div>
          <div className="form-row"><div className="form-group"><label>Payment Type</label><select value={form.payment_type} onChange={e=>setForm({...form,payment_type:e.target.value})}><option value="">Select Type</option><option value="deposit">Deposit</option><option value="progress">Progress</option><option value="final">Final</option><option value="retainer">Retainer</option></select></div><div className="form-group"><label>Payment Method</label><select value={form.payment_method} onChange={e=>setForm({...form,payment_method:e.target.value})}><option value="">Select Method</option><option value="check">Check</option><option value="bank_transfer">Bank Transfer</option><option value="credit_card">Credit Card</option><option value="cash">Cash</option></select></div></div>
          <div className="form-row"><div className="form-group"><label>Payment Date</label><input type="date" value={form.payment_date} onChange={e=>setForm({...form,payment_date:e.target.value})} /></div><div className="form-group"><label>Due Date</label><input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})} /></div></div>
          <div className="form-group"><label>Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="pending">Pending</option><option value="paid">Paid</option><option value="overdue">Overdue</option><option value="cancelled">Cancelled</option></select></div>
          <div className="form-group"><label>Description</label><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
          <div className="form-group"><label>Notes</label><textarea value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
        </div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={()=>setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{editing?'Update':'Create'}</button></div>
      </div></div>}
    </Layout>
  );
}
