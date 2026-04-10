const forgotForm = document.getElementById("forgotPasswordForm");
const forgotMsg = document.getElementById("forgotMsg");
const sendOtpBtn = document.getElementById("sendOtpBtn");

sendOtpBtn.addEventListener("click", async () => {
  const userId = document.getElementById("userId").value.trim();
  forgotMsg.innerText = "";

  if (!userId) {
    forgotMsg.innerText = "Enter User ID first";
    return;
  }

  try {
    const response = await fetch("http://localhost:8080/auth/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userId })
    });

    const text = await response.text();
    forgotMsg.innerText = text;
  } catch (error) {
    forgotMsg.innerText = "Failed to send OTP";
    console.error(error);
  }
});

forgotForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userId = document.getElementById("userId").value.trim();
  const otp = document.getElementById("otp").value.trim();
  const newPassword = document.getElementById("newPassword").value.trim();
  const confirmNewPassword = document.getElementById("confirmNewPassword").value.trim();

  forgotMsg.innerText = "";

  if (newPassword !== confirmNewPassword) {
    forgotMsg.innerText = "Passwords do not match";
    return;
  }

  try {
    const response = await fetch("http://localhost:8080/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userId, otp, newPassword })
    });

    const text = await response.text();
    forgotMsg.innerText = text;

    if (response.ok) {
      forgotForm.reset();
    }
  } catch (error) {
    forgotMsg.innerText = "Failed to reset password";
    console.error(error);
  }
});