document.addEventListener('DOMContentLoaded', function(){
  const token = localStorage.getItem('token');
  if (!token) return;
  const root = document.getElementById('enquiriesList');
  function load(){
    root.innerText = 'Loading...';
    fetch('/api/enquiries', { headers: { Authorization: `Bearer ${token}` }})
      .then(r=>{ if(!r.ok) throw new Error('Unauthorized'); return r.json(); })
      .then(rows => {
        if (!rows.length) { root.innerText = 'No enquiries yet.'; return; }
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.innerHTML = `<thead><tr><th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>Type</th><th>Requirement</th><th>Date</th><th>Status</th></tr></thead>`;
        const tbody = document.createElement('tbody');
        rows.forEach(r => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${r.name || ''}</td>
            <td>${r.company || ''}</td>
            <td>${r.email || ''}</td>
            <td>${r.phone || ''}</td>
            <td>${r.type || ''}</td>
            <td>${r.requirement || r.additional || ''}</td>
            <td>${new Date(r.createdAt).toLocaleString()}</td>
            <td>
              <select data-id="${r.id}">
                <option ${r.status==='New'?'selected':''}>New</option>
                <option ${r.status==='Contacted'?'selected':''}>Contacted</option>
                <option ${r.status==='In Progress'?'selected':''}>In Progress</option>
                <option ${r.status==='Converted'?'selected':''}>Converted</option>
                <option ${r.status==='Closed'?'selected':''}>Closed</option>
              </select>
            </td>
          `;
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        root.innerHTML = '';
        root.appendChild(table);

        // attach change handlers
        root.querySelectorAll('select[data-id]').forEach(sel=>{
          sel.addEventListener('change', function(){
            const id = this.getAttribute('data-id');
            const status = this.value;
            fetch(`/api/enquiries/${id}/status`, { method:'POST', headers: {'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body: JSON.stringify({status})})
              .then(r=>{ if(!r.ok) throw new Error('Failed to update'); return r.json(); })
              .then(()=>{
                alert('Status updated');
              }).catch(err=>{ alert('Failed to update status'); console.error(err); });
          });
        });
      }).catch(err=>{ root.innerText = 'Failed to load enquiries'; console.error(err); });
  }
  load();
});
