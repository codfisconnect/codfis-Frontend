let allTrainers = [];
let currentPage = 1;
const itemsPerPage = 6;



function showTrainers() {
    const container = document.getElementById("trainerContainer");

    container.innerHTML = "<p>Loading...</p>";

    fetch("http://localhost:8080/courses/trainer/applied",
        {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            allTrainers = data;
            renderTrainers();
        })
        .catch(() => {
            container.innerHTML = "<p style='color:red'>Failed to load data</p>";
        });
}
function approveTrainer(mobile) {
    fetch(`http://localhost:8080/courses/trainer/approve/${mobile}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    .then(res => res.text())
    .then(msg => {
        alert(msg);
        showTrainers(); // refresh list
    })
    .catch(err => alert(err));
}

function renderTrainers() {
    const container = document.getElementById("trainerContainer");

    const start = (currentPage - 1) * itemsPerPage;
    const paginated = allTrainers.slice(start, start + itemsPerPage);

    document.getElementById("trainerCount").innerText = `Total Trainers: ${allTrainers.length}`;
    
    if (paginated.length === 0) {
        container.innerHTML = "<h2>No trainers found</h2>";
        return;
    }

    let html = "";

    paginated.forEach(trainer => {
        html += `
        <div class="trainerCard">

            <h2>${trainer.name}</h2>

            <h4>Email: <a href="mailto:${trainer.email}">${trainer.email}</a></h4>
            <h4>Mobile: <a href="tel:${trainer.mobile}">${trainer.mobile}</a></h4>
            <h4>${trainer.description}</h4>

            <span class="status ${trainer.status || "pending"}">
                ${trainer.status || "Pending"}
            </span>

            <div class="btn-group">
                <button class="approve" onclick="approveTrainer(${trainer.mobile})">Approve</button>
                <button class="reject" onclick="rejectTrainer(${trainer.mobile})">Reject</button>
                <button class="view" onclick="window.location.href='trainerprofile.html?mobile=${trainer.mobile}'">View Profile</button>
                <button class="delete" onclick="deleteTrainer(${trainer.mobile})">Delete</button>
            </div>

        </div>
        `;
    });

    container.innerHTML = html;

    renderPagination();
   
}

function rejectTrainer(mobile) {
    fetch(`http://localhost:8080/courses/trainer/reject/${mobile}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    .then(res => res.text())
    .then(msg => {
        alert(msg);
        showTrainers(); // refresh list
    })
    .catch(err => alert(err));
}

function deleteTrainer(mobile) {
    if (!confirm("Are you sure you want to delete this trainer?")) return;

    fetch(`http://localhost:8080/courses/trainer/delete/${mobile}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    .then(res => res.text())
    .then(msg => {
        alert(msg);
        showTrainers(); // refresh list
    })
    .catch(err => alert(err));
}

function searchTrainer() {
    const value = document.getElementById("searchInput").value.toLowerCase();

    const filtered = allTrainers.filter(trainer =>
        trainer.name.toLowerCase().includes(value) ||
        trainer.email.toLowerCase().includes(value) ||
        trainer.mobile.toString().includes(value)
    );

    currentPage = 1;
    renderFiltered(filtered);
}

function renderFiltered(data) {
    const container = document.getElementById("trainerContainer");

    let html = "";

    data.forEach(trainer => {
        html += `
        <div class="trainerCard">
            <h2>${trainer.name}</h2>
            <h4>${trainer.email}</h4>
            <h4>${trainer.mobile}</h4>
        </div>
        `;
    });

    container.innerHTML = html;
}
function renderPagination() {
    let totalPages = Math.ceil(allTrainers.length / itemsPerPage);

    let paginationHTML = "<div class='pagination'>";

    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <button onclick="goToPage(${i})">${i}</button>
        `;
    }

    paginationHTML += "</div>";

    document.getElementById("trainerContainer").innerHTML += paginationHTML;
}

function goToPage(page) {
    currentPage = page;
    renderTrainers();
}