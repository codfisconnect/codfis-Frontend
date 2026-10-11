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

  fetch("/api/auth/login", {
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
      const contentType = response.headers.get("content-type") || "";
      let data = null;

      if (contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch (e) {
          console.error("Failed to parse JSON response:", e);
        }
      }

      if (!response.ok) {
        const errorMsgText = (data && (data.error || data.message))
          ? (data.error || data.message)
          : "Unable to reach the authentication service. Please try again later.";
        throw new Error(errorMsgText);
      }

      if (!data || !data.token) {
        throw new Error("Unable to reach the authentication service. Please try again later.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId || userId);
      localStorage.setItem("role", data.role || "");

      window.location.href = "admin.html";
    })
    .catch((error) => {
      console.error("Login error:", error);
      errorMsg.innerText = error.message || "Unable to reach the authentication service. Please try again later.";
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
