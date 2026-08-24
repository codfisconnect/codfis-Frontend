document.addEventListener('DOMContentLoaded', function(){
  const token = localStorage.getItem('token');
  if (!token) return;
  const root = document.getElementById('demoList');
  
  function load(){
    root.innerText = 'Loading...';
    fetch('/api/demo', { headers: { Authorization: `Bearer ${token}` }})
      .then(r=>{ if(!r.ok) throw new Error('Unauthorized'); return r.json(); })
      .then(rows => {
        if (!rows.length) { root.innerHTML = '<div class="empty">No demo requests yet.</div>'; return; }
        const table = document.createElement('table');
        table.innerHTML = `<thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Course</th><th>Mode</th><th>Preferred Date</th><th>Level</th><th>Date Submitted</th><th>Status</th></tr></thead>`;
        const tbody = document.createElement('tbody');
        rows.forEach(r => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${r.name || ''}</td>
            <td>${r.email || ''}</td>
            <td>${r.phone || ''}</td>
            <td>${r.course || ''}</td>
            <td>${r.mode || ''}</td>
            <td>${r.preferredDate || ''}</td>
            <td>${r.experienceLevel || ''}</td>
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

        root.querySelectorAll('select[data-id]').forEach(sel=>{
          sel.addEventListener('change', function(){
            const id = this.getAttribute('data-id');
            const status = this.value;
            fetch(`/api/demo/${id}/status`, { method:'POST', headers: {'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body: JSON.stringify({status})})
              .then(r=>{ if(!r.ok) throw new Error('Failed'); return r.json(); })
              .then(()=>{ alert('Status updated'); })
              .catch(err=>{ alert('Failed'); console.error(err); });
          });
        });
      }).catch(err=>{ root.innerHTML = '<div class="empty">Failed to load demo requests</div>'; console.error(err); });
  }
  load();
});
