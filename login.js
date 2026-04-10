function login() {
  const userIdInput = document.getElementById("uname");
  const passwordInput = document.getElementById("pass");
  const errorMsg = document.getElementById("errorMsg");
  const loginBtn = document.getElementById("log-btn");
  const token = localStorage.getItem("token");

  

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

  fetch("http://localhost:8080/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      userId: userId,
      password: password
    })
  })
    .then(async (response) => {
      const contentType = response.headers.get("content-type") || "";

      let data;
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `Login failed. Status: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data.message || `Login failed. Status: ${response.status}`);
      }

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
  window.location.replace("index.html");
}