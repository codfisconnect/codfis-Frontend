function sendOtp() {
  const email = document.getElementById("email").value.trim();
  const msg = document.getElementById("msg");

  msg.innerText = "";

  if (!email) {
    msg.innerText = "Please enter email";
    return;
  }

  fetch("https://codfis-backend.onrender.com/auth/send-otp", {
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
      msg.innerText = message;
    })
    .catch((error) => {
      console.error(error);
      msg.innerText = error.message;
    });
}

function resetForm() {
  document.getElementById("email").value = "";
  document.getElementById("otp").value = "";
  document.getElementById("newPassword").value = "";
}

function resetPassword() {
  const email = document.getElementById("email").value.trim();
  const otp = document.getElementById("otp").value.trim();
  const newPassword = document.getElementById("newPassword").value.trim();
  const msg = document.getElementById("msg");

  msg.innerText = "";

  if (!email || !otp || !newPassword) {
    msg.innerText = "Fill all fields";
    return;
  }

  fetch("https://codfis-backend.onrender.com/auth/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: email,
      otp: otp,
      newPassword: newPassword
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
      msg.innerText = message;
      resetForm();
    })
    .catch((error) => {
      console.error(error);
      msg.innerText = error.message;
    });
}
