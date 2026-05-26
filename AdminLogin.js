function login() {
  const userIdInput = document.getElementById("uname");
  const passwordInput = document.getElementById("pass");
  const errorMsg = document.getElementById("errorMsg");
  const loginBtn = document.getElementById("log-btn");

  if (!userIdInput || !passwordInput || !errorMsg || !loginBtn) {
    console.error("Login page elements not found");
    return;
  }

  const userId = userIdInput.value.trim();
  const password = passwordInput.value.trim();

  errorMsg.innerText = "";

  if (!userId || !password) {
    errorMsg.innerText = "Please enter user ID and password";
    return;
  }

  loginBtn.disabled = true;
  loginBtn.innerText = "Logging in...";

  fetch("https://codfis-backend.onrender.com/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId: userId,
      password: password
    })
  })
    .then(async (response) => {
      const text = await response.text();

      if (!response.ok) {
        throw new Error(text || `Login failed. Status: ${response.status}`);
      }

      const data = JSON.parse(text);

      if (!data.token) {
        throw new Error("Token not received from server");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId || userId);
      localStorage.setItem("role", data.role || "");

      window.location.href = "admin.html";
    })
    .catch((error) => {
      console.error("Login error:", error);
      errorMsg.innerText = error.message || "Unable to login";
    })
    .finally(() => {
      loginBtn.disabled = false;
      loginBtn.innerText = "Login";
    });
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("role");
  window.location.replace("AdminLogin.html");
}
