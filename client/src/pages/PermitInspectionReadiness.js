import React, { useEffect, useState } from 'react';

export default function PermitInspectionReadiness() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/permit-inspection-readiness').then((r) => r.json()).then(setData).catch(() => {});
  }, []);
  return (
    <div className="page">
      <h1>Permit Inspection Readiness Board</h1>
      <p>Checks permit posting, photo evidence, punch items, and contractor confirmation before inspection scheduling.</p>
      {data?.inspections?.map((i) => <section key={i.trade} className="card"><h2>{i.trade}</h2><p>{i.status} - {i.readiness_score}</p></section>)}
    </div>
  );
}
