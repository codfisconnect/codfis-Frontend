function studentLogin() {
  const email = document.getElementById("studentEmail").value.trim();
  const password = document.getElementById("studentPassword").value.trim();
  const msg = document.getElementById("studentLoginMsg");
  const btn = document.getElementById("studentLoginBtn");

  msg.innerText = "";
  msg.style.color = "red";

  if (!email || !password) {
    msg.innerText = "Please enter email and password";
    return;
  }

  btn.disabled = true;
  btn.innerText = "Logging in...";

  fetch("http://localhost:8080/student-auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: email,
      password: password
    })
  })
    .then(async (response) => {
      const text = await response.text();
      console.log("Student login status:", response.status);
      console.log("Student login response:", text);

      if (!response.ok) {
        throw new Error(text || `Student login failed. Status: ${response.status}`);
      }

      return JSON.parse(text);
    })
    .then((data) => {
      localStorage.setItem("studentToken", data.token);
      localStorage.setItem("studentEmail", data.email);
      localStorage.setItem("studentRole", data.role);
      localStorage.setItem("studentName", data.name);

      window.location.href = "studentDash.html";
    })
    .catch((error) => {
      console.error("Student login error:", error);
      msg.innerText = error.message;
    })
    .finally(() => {
      btn.disabled = false;
      btn.innerText = "Login";
    });
}