function sendStudentOtp() {
  const email = document.getElementById("studentForgotEmail").value.trim();
  const msg = document.getElementById("studentForgotMsg");

  msg.innerText = "";
  msg.style.color = "red";

  if (!email) {
    msg.innerText = "Please enter email";
    return;
  }

  fetch("/api/student-auth/send-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email: email })
  })
    .then(async (response) => {
      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || "Failed to send OTP");
      }
      return text;
    })
    .then((message) => {
      msg.style.color = "lightgreen";
      msg.innerText = message;
    })
    .catch((error) => {
      console.error(error);
      msg.innerText = error.message;
    });
}

function resetStudentPassword() {
  const email = document.getElementById("studentForgotEmail").value.trim();
  const otp = document.getElementById("studentOtp").value.trim();
  const newPassword = document.getElementById("studentNewPassword").value.trim();
  const msg = document.getElementById("studentForgotMsg");

  msg.innerText = "";
  msg.style.color = "red";

  if (!email || !otp || !newPassword) {
    msg.innerText = "Please fill all fields";
    return;
  }

  fetch("http://localhost:8080/student-auth/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      otp,
      newPassword
    })
  })
    .then(async (response) => {
      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || "Failed to reset password");
      }
      return text;
    })
    .then((message) => {
      msg.style.color = "lightgreen";
      msg.innerText = message;
    })
    .catch((error) => {
      console.error(error);
      msg.innerText = error.message;
    });
}
