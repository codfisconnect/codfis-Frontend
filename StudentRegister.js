const registerForm = document.getElementById("stdRegisterForm");

registerForm.addEventListener("submit", studentRegister);

function studentRegister(event) {
  event.preventDefault();

  const name = document.getElementById("studentName").value.trim();
  const genderInput = document.querySelector('input[name="gender"]:checked');
  const gender = genderInput ? genderInput.value : "";
  const email = document.getElementById("studentEmail").value.trim();
  const mobile = document.getElementById("studentMobile").value.trim();
  const courseName = document.getElementById("studentCourse").value;
  const password = document.getElementById("studentPassword").value.trim();
  const confirmPassword = document.getElementById("confirmStudentPassword").value.trim();

  const msg = document.getElementById("studentRegisterMsg");
  const btn = document.getElementById("studentRegisterBtn");

  msg.innerText = "";
  msg.style.color = "red";

  if (!name || !gender || !email || !mobile || !courseName || !password || !confirmPassword) {
    msg.innerText = "Please fill all fields";
    return;
  }

  if (password !== confirmPassword) {
    msg.innerText = "Passwords do not match";
    return;
  }

  btn.disabled = true;
  btn.innerText = "Registering...";

  const payload = {
    name,
    gender,
    email,
    mobile: Number(mobile),
    courseName,
    password
  };

  console.log("Student register payload:", payload);

  fetch("http://localhost:8080/student-auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })
    .then(async (response) => {
      const text = await response.text();
      console.log("Register status:", response.status);
      console.log("Register response:", text);

      if (!response.ok) {
        throw new Error(text || `Registration failed. Status: ${response.status}`);
      }

      return text;
    })
    .then((message) => {
      msg.style.color = "lightgreen";
      msg.innerText = message;
      registerForm.reset();
    })
    .catch((error) => {
      console.error("Student register error:", error);
      msg.style.color = "red";
      msg.innerText = error.message;
    })
    .finally(() => {
      btn.disabled = false;
      btn.innerText = "Register";
    });
}