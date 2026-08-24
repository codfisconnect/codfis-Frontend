function studentLogout() {
  localStorage.removeItem("studentToken");
  localStorage.removeItem("studentEmail");
  localStorage.removeItem("studentRole");
  localStorage.removeItem("studentName");
  window.location.replace("index.html");
}

function loadStudentDashboard() {
  const token = localStorage.getItem("studentToken");
  const email = localStorage.getItem("studentEmail");

  if (!token || !email) {
    window.location.replace("student-login.html");
    return;
  }

  fetch(`/api/student-auth/profile/${encodeURIComponent(email)}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
    .then(async (response) => {
      const text = await response.text();

      if (!response.ok) {
        throw new Error(text || "Failed to load student profile");
      }

      return JSON.parse(text);
    })
    .then((student) => {
      document.getElementById("welcomeText").innerText = `Welcome, ${student.name || ""}`;
      document.getElementById("studentName").innerText = student.name || "";
      document.getElementById("studentEmail").innerText = student.email || "";
      document.getElementById("studentMobile").innerText = student.mobile || "";
      document.getElementById("studentGender").innerText = student.gender || "";
      document.getElementById("studentCourse").innerText = student.courseName || "";
    })
    .catch((error) => {
      console.error(error);
      alert(error.message);
      studentLogout();
    });
}

window.onload = loadStudentDashboard;
