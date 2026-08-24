document.addEventListener('DOMContentLoaded', function(){
  const token = localStorage.getItem('token');
  if (!token) return;
  const root = document.getElementById('contactList');
  
  function load(){
    root.innerText = 'Loading...';
    fetch('/api/contact', { headers: { Authorization: `Bearer ${token}` }})
      .then(r=>{ if(!r.ok) throw new Error('Unauthorized'); return r.json(); })
      .then(rows => {
        if (!rows.length) { root.innerHTML = '<div class="empty">No contact messages yet.</div>'; return; }
        const table = document.createElement('table');
        table.innerHTML = `<thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Message</th><th>Date Received</th></tr></thead>`;
        const tbody = document.createElement('tbody');
        rows.forEach(r => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${r.name || ''}</td>
            <td>${r.email || ''}</td>
            <td>${r.phone || ''}</td>
            <td>${(r.message || '').substring(0, 50)}...</td>
            <td>${new Date(r.createdAt).toLocaleString()}</td>
          `;
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        root.innerHTML = '';
        root.appendChild(table);
      }).catch(err=>{ root.innerHTML = '<div class="empty">Failed to load contacts</div>'; console.error(err); });
  }
  load();
});
