import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import API from '../services/api';

export default function Reports({ user, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [projects, setProjects] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [punchlist, setPunchlist] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [inspections, setInspections] = useState([]);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [b, t, p, r, m, pl, c, ins] = await Promise.all([
        API.get('/budget').catch(() => ({ data: [] })),
        API.get('/timeline').catch(() => ({ data: [] })),
        API.get('/projects').catch(() => ({ data: [] })),
        API.get('/rooms').catch(() => ({ data: [] })),
        API.get('/materials').catch(() => ({ data: [] })),
        API.get('/punchlist').catch(() => ({ data: [] })),
        API.get('/contractors').catch(() => ({ data: [] })),
        API.get('/inspections').catch(() => ({ data: [] })),
      ]);
      setBudget(b.data || []);
      setTimeline(t.data || []);
      setProjects(p.data || []);
      setRooms(r.data || []);
      setMaterials(m.data || []);
      setPunchlist(pl.data || []);
      setContractors(c.data || []);
      setInspections(ins.data || []);
    } catch (err) {
      console.error('Failed to load reports data:', err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout}>
        <div style={{ color: '#94a3b8', textAlign: 'center', padding: '60px 0', fontSize: '18px' }}>
          Loading reports...
        </div>
      </Layout>
    );
  }

  // Budget computations
  const totalEstimated = budget.reduce((s, i) => s + parseFloat(i.estimated_cost || 0), 0);
  const totalActual = budget.reduce((s, i) => s + parseFloat(i.actual_cost || 0), 0);
  const budgetVariance = totalActual - totalEstimated;

  const budgetByStatus = budget.reduce((acc, i) => {
    const st = i.status || 'unknown';
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {});

  // Budget by category
  const budgetByCategory = budget.reduce((acc, i) => {
    const cat = i.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = { estimated: 0, actual: 0 };
    acc[cat].estimated += parseFloat(i.estimated_cost || 0);
    acc[cat].actual += parseFloat(i.actual_cost || 0);
    return acc;
  }, {});
  const categoryEntries = Object.entries(budgetByCategory);
  const maxCategoryValue = Math.max(...categoryEntries.flatMap(([, v]) => [v.estimated, v.actual]), 1);

  // Timeline computations
  const timelineByStatus = timeline.reduce((acc, i) => {
    const st = i.status || 'not_started';
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {});
  const totalTasks = timeline.length || 1;
  const now = new Date();
  const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcomingTasks = timeline.filter(t => {
    const d = new Date(t.start_date || t.due_date);
    return d >= now && d <= thirtyDaysOut;
  });

  // Project status breakdown
  const projectByStatus = projects.reduce((acc, p) => {
    const st = p.status || 'planning';
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {});

  // Punch list computations
  const plByStatus = punchlist.reduce((acc, i) => {
    const st = i.status || 'open';
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {});
  const plByPriority = punchlist.reduce((acc, i) => {
    const p = i.priority || 'medium';
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});
  const plByCategory = punchlist.reduce((acc, i) => {
    const c = i.category || 'Uncategorized';
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});

  // Inspection computations
  const inspByStatus = inspections.reduce((acc, i) => {
    const st = (i.status || 'pending').toLowerCase();
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {});

  // Material computations
  const matByStatus = materials.reduce((acc, i) => {
    const st = (i.status || 'needed').toLowerCase();
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {});
  const totalMaterialsCost = materials.reduce((s, i) => s + parseFloat(i.cost || i.total_cost || 0), 0);

  const fmt = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const cardStyle = { background: '#1e293b', borderRadius: '12px', padding: '20px' };
  const sectionGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' };
  const overviewGrid = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' };
  const barTrack = { background: '#334155', borderRadius: '8px', overflow: 'hidden', height: '24px', marginBottom: '4px' };

  const StatCard = ({ label, value, color }) => (
    <div style={cardStyle}>
      <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>{label}</div>
      <div style={{ color: color || '#f1f5f9', fontSize: '24px', fontWeight: 700 }}>{value}</div>
    </div>
  );

  const CountBadge = ({ label, count, color }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #334155' }}>
      <span style={{ color: '#cbd5e1', fontSize: '14px' }}>{label}</span>
      <span style={{ color: color || '#f1f5f9', fontWeight: 600, fontSize: '16px' }}>{count}</span>
    </div>
  );

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="page-header">
        <div><h1>Reports</h1><p>Aggregated analytics across your renovation project</p></div>
      </div>

      {/* Budget Overview Cards */}
      <div style={overviewGrid}>
        <StatCard label="Total Estimated" value={fmt(totalEstimated)} color="#3b82f6" />
        <StatCard label="Total Actual" value={fmt(totalActual)} color="#10b981" />
        <StatCard
          label="Budget Variance"
          value={(budgetVariance >= 0 ? '+' : '') + fmt(budgetVariance)}
          color={budgetVariance > 0 ? '#ef4444' : '#10b981'}
        />
        <StatCard label="Budget Items" value={budget.length} color="#8b5cf6" />
      </div>

      {/* Two Column Sections */}
      <div style={sectionGrid}>

        {/* Budget by Category */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '16px', color: '#f1f5f9' }}>Budget by Category</h3>
          {categoryEntries.length === 0 && <div style={{ color: '#64748b' }}>No budget data</div>}
          {categoryEntries.map(([cat, vals]) => {
            const estPct = (vals.estimated / maxCategoryValue) * 100;
            const actPct = (vals.actual / maxCategoryValue) * 100;
            const isOver = vals.actual > vals.estimated;
            return (
              <div key={cat} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#cbd5e1', fontSize: '13px' }}>{cat}</span>
                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>Est: {fmt(vals.estimated)} | Act: {fmt(vals.actual)}</span>
                </div>
                <div style={barTrack}>
                  <div style={{ height: '24px', borderRadius: '4px', background: '#3b82f6', width: estPct + '%', transition: 'width 0.3s' }} />
                </div>
                <div style={barTrack}>
                  <div style={{ height: '24px', borderRadius: '4px', background: isOver ? '#ef4444' : '#10b981', width: actPct + '%', transition: 'width 0.3s' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Budget Items by Status */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '16px', color: '#f1f5f9' }}>Budget Items by Status</h3>
          {Object.entries(budgetByStatus).map(([st, count]) => {
            const colorMap = { completed: '#10b981', in_progress: '#3b82f6', ordered: '#8b5cf6', planned: '#64748b' };
            return <CountBadge key={st} label={st.replace(/_/g, ' ')} count={count} color={colorMap[st] || '#f59e0b'} />;
          })}
        </div>

        {/* Project Progress */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '16px', color: '#f1f5f9' }}>Project Progress</h3>
          {projects.length === 0 && <div style={{ color: '#64748b' }}>No projects</div>}
          {projects.map(p => {
            const progress = parseFloat(p.progress || 0);
            const statusColor = { planning: '#f59e0b', in_progress: '#3b82f6', completed: '#10b981' }[p.status] || '#64748b';
            return (
              <div key={p.id} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 600 }}>{p.name || p.title}</span>
                  <span style={{ color: statusColor, fontSize: '12px', fontWeight: 600 }}>{(p.status || '').replace(/_/g, ' ')}</span>
                </div>
                <div style={barTrack}>
                  <div style={{ height: '24px', borderRadius: '8px', background: statusColor, width: progress + '%', transition: 'width 0.3s' }} />
                </div>
                <div style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'right' }}>{progress}%</div>
              </div>
            );
          })}
          <div style={{ marginTop: '16px', borderTop: '1px solid #334155', paddingTop: '12px' }}>
            <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Status Breakdown</div>
            {Object.entries(projectByStatus).map(([st, count]) => {
              const colorMap = { planning: '#f59e0b', in_progress: '#3b82f6', completed: '#10b981' };
              return <CountBadge key={st} label={st.replace(/_/g, ' ')} count={count} color={colorMap[st] || '#64748b'} />;
            })}
          </div>
        </div>

        {/* Timeline Status */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '16px', color: '#f1f5f9' }}>Timeline Status</h3>
          {timeline.length === 0 && <div style={{ color: '#64748b' }}>No timeline data</div>}
          {timeline.length > 0 && (
            <>
              <div style={{ ...barTrack, display: 'flex', height: '32px', marginBottom: '12px' }}>
                {(timelineByStatus.completed || 0) > 0 && (
                  <div style={{ height: '32px', background: '#10b981', width: ((timelineByStatus.completed || 0) / totalTasks * 100) + '%' }} />
                )}
                {(timelineByStatus.in_progress || 0) > 0 && (
                  <div style={{ height: '32px', background: '#3b82f6', width: ((timelineByStatus.in_progress || 0) / totalTasks * 100) + '%' }} />
                )}
                {(timelineByStatus.not_started || 0) > 0 && (
                  <div style={{ height: '32px', background: '#64748b', width: ((timelineByStatus.not_started || 0) / totalTasks * 100) + '%' }} />
                )}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <span style={{ color: '#10b981', fontSize: '13px' }}>Completed: {timelineByStatus.completed || 0}</span>
                <span style={{ color: '#3b82f6', fontSize: '13px' }}>In Progress: {timelineByStatus.in_progress || 0}</span>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Not Started: {timelineByStatus.not_started || 0}</span>
              </div>
              <div style={{ borderTop: '1px solid #334155', paddingTop: '12px' }}>
                <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Upcoming Tasks (Next 30 Days)</div>
                {upcomingTasks.length === 0 && <div style={{ color: '#64748b', fontSize: '13px' }}>No upcoming tasks</div>}
                {upcomingTasks.slice(0, 8).map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e293b' }}>
                    <span style={{ color: '#cbd5e1', fontSize: '13px' }}>{t.title || t.task}</span>
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>{(t.start_date || t.due_date || '').split('T')[0]}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Room Progress */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '16px', color: '#f1f5f9' }}>Room Progress</h3>
          {rooms.length === 0 && <div style={{ color: '#64748b' }}>No rooms</div>}
          {rooms.map(r => {
            const progress = parseFloat(r.progress || 0);
            const statusColor = { planning: '#f59e0b', in_progress: '#3b82f6', completed: '#10b981', not_started: '#64748b' }[r.status] || '#64748b';
            return (
              <div key={r.id} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 600 }}>{r.name}</span>
                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                    {r.budget ? fmt(r.budget) : ''} {r.actual_cost ? '/ ' + fmt(r.actual_cost) : ''}
                  </span>
                </div>
                <div style={barTrack}>
                  <div style={{ height: '24px', borderRadius: '8px', background: statusColor, width: progress + '%', transition: 'width 0.3s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: statusColor, fontSize: '12px' }}>{(r.status || '').replace(/_/g, ' ')}</span>
                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>{progress}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Punch List Summary */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '16px', color: '#f1f5f9' }}>Punch List Summary</h3>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>By Status</div>
            <CountBadge label="Open" count={plByStatus.open || 0} color="#f59e0b" />
            <CountBadge label="In Progress" count={plByStatus.in_progress || 0} color="#3b82f6" />
            <CountBadge label="Completed" count={plByStatus.completed || 0} color="#10b981" />
            {plByStatus.deferred ? <CountBadge label="Deferred" count={plByStatus.deferred} color="#64748b" /> : null}
          </div>
          <div style={{ marginBottom: '16px', borderTop: '1px solid #334155', paddingTop: '12px' }}>
            <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>By Priority</div>
            {Object.entries(plByPriority).map(([p, count]) => {
              const colorMap = { high: '#ef4444', critical: '#ef4444', medium: '#f59e0b', low: '#64748b' };
              return <CountBadge key={p} label={p} count={count} color={colorMap[p] || '#94a3b8'} />;
            })}
          </div>
          <div style={{ borderTop: '1px solid #334155', paddingTop: '12px' }}>
            <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>By Category</div>
            {Object.entries(plByCategory).map(([cat, count]) => (
              <CountBadge key={cat} label={cat} count={count} color="#8b5cf6" />
            ))}
          </div>
        </div>

        {/* Inspection Status */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '16px', color: '#f1f5f9' }}>Inspection Status</h3>
          {inspections.length === 0 && <div style={{ color: '#64748b' }}>No inspections</div>}
          <CountBadge label="Passed" count={inspByStatus.passed || 0} color="#10b981" />
          <CountBadge label="Scheduled" count={inspByStatus.scheduled || 0} color="#3b82f6" />
          <CountBadge label="Pending" count={inspByStatus.pending || 0} color="#f59e0b" />
          {inspByStatus.failed ? <CountBadge label="Failed" count={inspByStatus.failed} color="#ef4444" /> : null}
          {inspections.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={barTrack}>
                <div style={{ display: 'flex', height: '24px' }}>
                  {(inspByStatus.passed || 0) > 0 && (
                    <div style={{ height: '24px', background: '#10b981', width: ((inspByStatus.passed || 0) / inspections.length * 100) + '%' }} />
                  )}
                  {(inspByStatus.scheduled || 0) > 0 && (
                    <div style={{ height: '24px', background: '#3b82f6', width: ((inspByStatus.scheduled || 0) / inspections.length * 100) + '%' }} />
                  )}
                  {(inspByStatus.pending || 0) > 0 && (
                    <div style={{ height: '24px', background: '#f59e0b', width: ((inspByStatus.pending || 0) / inspections.length * 100) + '%' }} />
                  )}
                  {(inspByStatus.failed || 0) > 0 && (
                    <div style={{ height: '24px', background: '#ef4444', width: ((inspByStatus.failed || 0) / inspections.length * 100) + '%' }} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Material Status */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '16px', color: '#f1f5f9' }}>Material Status</h3>
          {materials.length === 0 && <div style={{ color: '#64748b' }}>No materials</div>}
          <CountBadge label="Delivered" count={matByStatus.delivered || 0} color="#10b981" />
          <CountBadge label="Ordered" count={matByStatus.ordered || 0} color="#3b82f6" />
          <CountBadge label="Needed" count={matByStatus.needed || 0} color="#f59e0b" />
          {matByStatus.installed ? <CountBadge label="Installed" count={matByStatus.installed} color="#8b5cf6" /> : null}
          <div style={{ marginTop: '16px', borderTop: '1px solid #334155', paddingTop: '12px' }}>
            <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>Total Materials Cost</div>
            <div style={{ color: '#3b82f6', fontSize: '22px', fontWeight: 700 }}>{fmt(totalMaterialsCost)}</div>
          </div>
          {materials.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <div style={barTrack}>
                <div style={{ display: 'flex', height: '24px' }}>
                  {(matByStatus.delivered || 0) > 0 && (
                    <div style={{ height: '24px', background: '#10b981', width: ((matByStatus.delivered || 0) / materials.length * 100) + '%' }} />
                  )}
                  {(matByStatus.ordered || 0) > 0 && (
                    <div style={{ height: '24px', background: '#3b82f6', width: ((matByStatus.ordered || 0) / materials.length * 100) + '%' }} />
                  )}
                  {(matByStatus.needed || 0) > 0 && (
                    <div style={{ height: '24px', background: '#f59e0b', width: ((matByStatus.needed || 0) / materials.length * 100) + '%' }} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
