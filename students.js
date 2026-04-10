let allStudents = [];
let currentPage = 1;
const itemsPerPage = 6;



function showStudents() {
    const container = document.getElementById("stdContainer");
    const token = localStorage.getItem("token");

    container.innerHTML = "<p>Loading students...</p>";

    fetch("http://localhost:8080/courses/student/all", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(data => {
            allStudents = data;

            document.getElementById("studentCount").innerText =
                `Total Students: ${data.length}`;

            renderStudents();
        })
        .catch(() => {
            container.innerHTML = "<p style='color:red'>Failed to load students</p>";
        });
}
function renderStudents() {
    const container = document.getElementById("stdContainer");

    const start = (currentPage - 1) * itemsPerPage;
    const paginated = allStudents.slice(start, start + itemsPerPage);

    let html = "";

    paginated.forEach(student => {
        html += `
        <div class="stdCard">

            <h2>${student.name}</h2>

            <h4>Email: <a href="mailto:${student.email}">${student.email}</a></h4>

            <h4>Mobile: <a href="tel:${student.mobile}">${student.mobile}</a></h4>

            <h4>Course: ${student.courseName}</h4>

            <div class="btn-group">
                <button class="edit" onclick="editStudent(${student.mobile})">Edit</button>
                <button class="delete" onclick="deleteStudent(${student.mobile})">Delete</button>
            </div>

        </div>
        `;
    });

    container.innerHTML = html;

    renderPagination();
}
function searchStudent() {
    const value = document.getElementById("searchInput").value.toLowerCase();

    const filtered = allStudents.filter(student =>
        student.name.toLowerCase().includes(value) ||
        student.email.toLowerCase().includes(value) ||
        student.mobile.toString().includes(value) ||
        student.courseName.toLowerCase().includes(value)
    );

    renderFilteredStudents(filtered);
}
function renderFilteredStudents(data) {
    const container = document.getElementById("stdContainer");

    let html = "";

    data.forEach(student => {
        html += `
        <div class="stdCard">
            <h2>${student.name}</h2>
            <h4>${student.email}</h4>
            <h4>${student.mobile}</h4>
            <h4>${student.courseName}</h4>            
            <div class="btn-group">
                <button class="edit" onclick="editStudent(${student.mobile})">Edit</button>
                <button class="delete" onclick="deleteStudent(${student.mobile})">Delete</button>
            </div>
        </div>
        `;
    });

    container.innerHTML = html;
}
function renderPagination() {
    let totalPages = Math.ceil(allStudents.length / itemsPerPage);

    let html = "<div class='pagination'>";

    for (let i = 1; i <= totalPages; i++) {
        html += `<button onclick="goToPage(${i})">${i}</button>`;
    }

    html += "</div>";

    document.getElementById("stdContainer").innerHTML += html;
}

function goToPage(page) {
    currentPage = page;
    renderStudents();
}
function deleteStudent(mobile) {
  const token = localStorage.getItem("token");

  if (!mobile) {
    alert("Student mobile not found");
    return;
  }

  if (!confirm("Are you sure you want to delete this student?")) {
    return;
  }

  fetch(`http://localhost:8080/courses/student/delete/${mobile}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
    .then(async (response) => {
      const text = await response.text();

      if (!response.ok) {
        throw new Error(text || `Failed to delete student. Status: ${response.status}`);
      }

      return text;
    })
    .then((message) => {
      alert(message);
      showStudents();
    })
    .catch((error) => {
      console.error("Delete error:", error);
      alert(error.message);
    });
}
function editStudent(mobile) {
   document.getElementById("editForm").style.display = "block";

   const student = allStudents.find(s => s.mobile === mobile);  
    if (!student) {
        alert("Student not found");
        return;
    }   
} 
