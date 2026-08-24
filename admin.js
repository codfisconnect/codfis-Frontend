
window.onload = function() {
    loadStats();
}

function loadStats(){
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("/api/stats", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(stats => { 
        document.getElementById("studentCountDisplay").innerText = `${stats.students || 0}`;
        document.getElementById("courseCountDisplay").innerText = `${stats.demo_requests || 0}`;
        document.getElementById("trainerRequestCountDisplay").innerText = `${stats.trainers || 0}`;
    })
    .catch(err => console.error(err));
}


