let allStudents = [];
let currentPage = 1;
const itemsPerPage = 6;

const token = localStorage.getItem("token");
let selectedMobile = null;

function showStudents() {
  const container = document.getElementById("stdContainer");

  if (!token) {
    alert("Please login as admin");
    window.location.href = "AdminLogin.html";
    return;
  }

  container.innerHTML = "<p>Loading students...</p>";

  fetch("http://localhost:8080/courses/student/all", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
    .then(async response => {
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to load students");
      }
      return response.json();
    })
    .then(data => {
      allStudents = data;

      document.getElementById("studentCount").innerText =
        `Total Students: ${data.length}`;

      renderStudents();
    })
    .catch(error => {
      console.error("Load students error:", error);
      container.innerHTML = "<p style='color:red'>Failed to load students</p>";
    });
}

function getApprovalButtons(student) {
  const status = student.approvalStatus;

  if (!status) {
    return `
      <button class="approve" disabled display ="none">Approve</button>
      <button class="reject" disabled display ="none">Reject</button>
    `;
  }

  if (status.toUpperCase() === "PENDING") {
    return `
      <button class="approve" onclick="approveStudent(${student.mobile})">Approve</button>
      <button class="reject" onclick="rejectStudent(${student.mobile})">Reject</button>
    `;
  }

  if (status.toUpperCase() === "APPROVED") {
    return `<span class="status approved">Approved</span>
    <button class="reject" onclick="rejectStudent(${student.mobile})">Reject</button>`;
  }

  if (status.toUpperCase() === "REJECTED") {
    return `<span class="status rejected">Rejected</span>
    <button class="approve" onclick="approveStudent(${student.mobile})">Approve</button>`;
  }

  return `
    <button class="approve" disabled>Approve</button>
    <button class="reject" disabled>Reject</button>
  `;
}

function renderStudents() {
  const container = document.getElementById("stdContainer");

  const start = (currentPage - 1) * itemsPerPage;
  const paginated = allStudents.slice(start, start + itemsPerPage);

  let html = "";

  paginated.forEach(student => {
    const status = student.approvalStatus || "Not Created";

    html += `
      <div class="stdCard">
        <h2>${student.name}</h2>

        <h4>Gender: ${student.gender || "Not specified"}</h4>
        <h4>Email: <a href="mailto:${student.email}">${student.email}</a></h4>
        <h4>Mobile: <a href="tel:${student.mobile}">${student.mobile}</a></h4>
        <h4>Course: ${student.courseName}</h4>

        <span class="status ${(student.approvalStatus || "not-created").toLowerCase()}">
          ${status}
        </span>

        <div class="btn-group">
          <button class="edit" onclick="editStudent(${student.mobile})">Edit</button>
          <button class="delete" onclick="deleteStudent(${student.mobile})">Delete</button>
          ${getApprovalButtons(student)}
        </div>
      </div>
    `;
  });

  container.innerHTML = html || "<p>No students found</p>";

  renderPagination();
}

function approveStudent(mobile) {
  updateStudentApproval(mobile, "approve");
}

function rejectStudent(mobile) {
  updateStudentApproval(mobile, "reject");
}

function updateStudentApproval(mobile, action) {
  fetch(`http://localhost:8080/courses/student/${action}/${mobile}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
    .then(async response => {
      const text = await response.text();

      if (!response.ok) {
        throw new Error(text || `Failed to ${action} student`);
      }

      return text;
    })
    .then(message => {
      alert(message);
      showStudents();
    })
    .catch(error => {
      console.error(`${action} student error:`, error);
      alert(error.message);
    });
}

function searchStudent() {
  const value = document.getElementById("searchInput").value.toLowerCase();

  const filtered = allStudents.filter(student =>
    (student.name || "").toLowerCase().includes(value) ||
    (student.gender || "").toLowerCase().includes(value) ||
    (student.email || "").toLowerCase().includes(value) ||
    String(student.mobile || "").includes(value) ||
    (student.courseName || "").toLowerCase().includes(value) ||
    (student.approvalStatus || "").toLowerCase().includes(value)
  );

  renderFilteredStudents(filtered);
}

function renderFilteredStudents(data) {
  const container = document.getElementById("stdContainer");

  let html = "";

  data.forEach(student => {
    const status = student.approvalStatus || "Not Created";

    html += `
      <div class="stdCard">
        <h2>${student.name}</h2>

        <h4>Gender: ${student.gender || "Not specified"}</h4>
        <h4>Email: <a href="mailto:${student.email}">${student.email}</a></h4>
        <h4>Mobile: <a href="tel:${student.mobile}">${student.mobile}</a></h4>
        <h4>Course: ${student.courseName}</h4>

        <span class="status ${(student.approvalStatus || "not-created").toLowerCase()}">
          ${status}
        </span>

        <div class="btn-group">
          <button class="edit" onclick="editStudent(${student.mobile})">Edit</button>
          <button class="delete" onclick="deleteStudent(${student.mobile})">Delete</button>
          ${getApprovalButtons(student)}
        </div>
      </div>
    `;
  });

  container.innerHTML = html || "<p>No students found</p>";
}

function renderPagination() {
  const totalPages = Math.ceil(allStudents.length / itemsPerPage);

  if (totalPages <= 1) return;

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
    .then(async response => {
      const text = await response.text();

      if (!response.ok) {
        throw new Error(text || `Failed to delete student. Status: ${response.status}`);
      }

      return text;
    })
    .then(message => {
      alert(message);
      showStudents();
    })
    .catch(error => {
      console.error("Delete error:", error);
      alert(error.message);
    });
}

function editStudent(mobile) {
  document.getElementById("editForm").style.display = "block";

  const student = allStudents.find(s => Number(s.mobile) === Number(mobile));

  if (!student) {
    alert("Student not found");
    return;
  }

  selectedMobile = mobile;

  document.getElementById("editName").value = student.name || "";
  document.getElementById("editEmail").value = student.email || "";
  document.getElementById("editMobile").value = student.mobile || "";
  document.getElementById("editCourse").value = student.courseName || "";

  const genderRadio = document.querySelector(`input[name="editGender"][value="${student.gender}"]`);
  if (genderRadio) {
    genderRadio.checked = true;
  }
}

const editForm = document.getElementById("editForm");

if (editForm) {
  editForm.addEventListener("submit", updateStudent);
}

function updateStudent(event) {
  event.preventDefault();

  if (!selectedMobile) {
    alert("No student selected for update");
    return;
  }

  const selectedGender = document.querySelector('input[name="editGender"]:checked');

  const updateData = {
    name: document.getElementById("editName").value.trim(),
    gender: selectedGender ? selectedGender.value : "",
    email: document.getElementById("editEmail").value.trim(),
    mobile: document.getElementById("editMobile").value.trim(),
    courseName: document.getElementById("editCourse").value.trim()
  };

  fetch(`http://localhost:8080/courses/student/update/${selectedMobile}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(updateData)
  })
    .then(async response => {
      const text = await response.text();

      if (!response.ok) {
        throw new Error(text || `Failed to update student. Status ${response.status}`);
      }

      return text;
    })
    .then(message => {
      alert(message);
      resetEditStudent();
      showStudents();
    })
    .catch(error => {
      console.error("Update error:", error);
      alert(error.message);
    });
}

function resetEditStudent() {
  document.getElementById("editName").value = "";
  document.getElementById("editEmail").value = "";
  document.getElementById("editMobile").value = "";
  document.getElementById("editCourse").value = "";

  const checkedGender = document.querySelector('input[name="editGender"]:checked');
  if (checkedGender) {
    checkedGender.checked = false;
  }

  selectedMobile = null;
  document.getElementById("editForm").style.display = "none";
}

window.onload = showStudents;