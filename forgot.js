const form = document.getElementById("forgotForm");
const msg = document.getElementById("msg");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userId = document.getElementById("userId").value.trim();
    const newPass = document.getElementById("newPass").value.trim();
    const confirmPass = document.getElementById("confirmPass").value.trim();

    msg.innerText = "";

    if (newPass !== confirmPass) {
        msg.innerText = "Passwords do not match!";
        msg.style.color = "red";
        return;
    }

    try {
        const response = await fetch("/api/auth/reset-password", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: userId,
                password: newPass
            })
        });

        const text = await response.text();

        if (!response.ok) {
            throw new Error(text);
        }

        msg.innerText = text;
        msg.style.color = "lightgreen";

    } catch (error) {
        msg.innerText = error.message;
        msg.style.color = "red";
    }
});
