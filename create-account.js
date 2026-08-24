const createForm = document.getElementById("createAccountForm");
const createMsg = document.getElementById("createMsg");

createForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userId = document.getElementById("userId").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();

  createMsg.innerText = "";

  if (password !== confirmPassword) {
    createMsg.innerText = "Passwords do not match";
    return;
  }

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userId, email, password })
    });

    const text = await response.text();

    if (!response.ok) {
      createMsg.innerText = text;
      return;
    }

    createMsg.innerText = text;
    createForm.reset();
  } catch (error) {
    createMsg.innerText = "Server error. Please try again.";
    console.error(error);
  }
});
