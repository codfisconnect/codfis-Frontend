// =========================
// NAVBAR
// =========================
const sideNavbar = document.querySelector(".sidenavbar");

function openNavbar() {
  if (sideNavbar) {
    sideNavbar.style.left = "0";
    sideNavbar.style.zIndex = "9999";

  }
}

function closesnavbar() {
  if (sideNavbar) {
    sideNavbar.style.left = "-60%";
    if (screen.width < 500) {
      sideNavbar.style.left = "-100%";
      sideNavbar.style.width = "100%";
      sideNavbar.style.zIndex = "9999";
    }
  }
}

// =========================
// SOCIAL LINKS
// =========================
function lanchInstagram() {
  window.open("https://www.instagram.com/codfis_tech?igsh=dnRtNGViaGUxYWRt", "_blank");
}

function lanchWhatsapp() {
  window.open("https://wa.me/918778548891", "_blank");
}

function lanchFb() {
  window.open("https://www.facebook.com/", "_blank");
}

function lanchTwitter() {
  window.open("https://x.com/", "_blank");
}

// =========================
// FORM ELEMENTS
// =========================
const trainerForm = document.getElementById("trainer-form");
const stdForm = document.getElementById("std-form");
const joinBtn = document.getElementById("joinBtn");
const trainerBtn = document.getElementById("trainerBtn");
const slideShow = document.querySelector(".slide-show");

// =========================
// FORM OPEN / CLOSE
// =========================
function openTrainerform() {
  if (!trainerForm) return;

  trainerForm.style.display = "flex";
  trainerForm.style.left = "50%";
  trainerForm.style.top = "50%";
  trainerForm.style.bottom = "auto";
  trainerForm.style.transform = "translate(-50%, -50%)";
  trainerForm.style.zIndex = "9999";
}

function closeTrainerform() {
  if (!trainerForm) return;

  trainerForm.style.top = "";
  trainerForm.style.bottom = "-120%";
  trainerForm.style.left = "50%";
  trainerForm.style.transform = "translateX(-50%)";
}

function openStudentform() {
  if (!stdForm) return;

  stdForm.style.display = "flex";
  stdForm.style.left = "50%";
  stdForm.style.top = "50%";
  stdForm.style.transform = "translate(-50%, -50%)";
  stdForm.style.zIndex = "9999";
}

function closeStudentform() {
  if (!stdForm) return;

  stdForm.style.top = "-120%";
  stdForm.style.left = "50%";
  stdForm.style.transform = "translateX(-50%)";
}

// =========================
// HERO BUTTONS FLOAT ON SCROLL
// =========================
if (joinBtn && trainerBtn && slideShow) {
  window.addEventListener("scroll", () => {
    const slideShowTop = slideShow.getBoundingClientRect().top;

    if (slideShowTop < -200) {
      joinBtn.style.position = "fixed";
      joinBtn.style.top = "15%";
      joinBtn.style.left = "30%";
      joinBtn.style.zIndex = "999";

      trainerBtn.style.position = "fixed";
      trainerBtn.style.top = "15%";
      trainerBtn.style.left = "50%";
      trainerBtn.style.zIndex = "999";

       if(screen.width < 520) {
        joinBtn.style.left = "10%";
        joinBtn.style.top = "10%";
        joinBtn.style.padding = "0.5rem 0.75rem";
        joinBtn.style.fontSize = "0.65rem";
        joinBtn.style.maxWidth = "100px";
        joinBtn.style.zIndex = "1";

        trainerBtn.style.left = "40%";
        trainerBtn.style.top = "10%";
        trainerBtn.style.padding = "0.5rem 0.75rem";
        trainerBtn.style.fontSize = "0.65rem";
        trainerBtn.style.maxWidth = "100px";
        trainerBtn.style.zIndex = "1";
      }
    } else {
      joinBtn.style.position = "absolute";
      joinBtn.style.top = "50%";
      joinBtn.style.left = "30%";
      joinBtn.style.zIndex = "10";

      trainerBtn.style.position = "absolute";
      trainerBtn.style.top = "50%";
      trainerBtn.style.left = "50%";
      trainerBtn.style.zIndex = "10";
    }
  });
}

// =========================
// HELPER FUNCTIONS
// =========================
function clearTrainerErrors() {
  const ids = [
    "fullname-error",
    "gender-error",
    "email-error",
    "number-error",
    "dis-error",
    "resume-error"
  ];

  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerText = "";
  });
}

function clearStudentErrors() {
  const ids = [
    "SnameErr",
    "SgenderErr",
    "SemailErr",
    "SmobileErr",
    "ScourseErr"
  ];

  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerText = "";
  });
}

function trainerFormReset() {
    document.getElementById("full-name").value = "";
    const genderRadios = document.querySelectorAll('input[name="trainerGender"]');
    genderRadios.forEach(radio => radio.checked = false);
    document.getElementById("email").value = "";
    document.getElementById("mob-num").value = "";
    document.getElementById("dis").value = "";
    document.getElementById("resume").value = "";
  clearTrainerErrors();
}

function studentFormReset() {
  if (!stdForm) return;
  stdForm.reset();
  clearStudentErrors();
}

// =========================
// TRAINER FORM SUBMISSION
// IMPORTANT:
// Trainer radios must use name="trainerGender"
// =========================
if (trainerForm) {
  trainerForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const fName = document.getElementById("full-name")?.value.trim() || "";
    const genderInput = document.querySelector('input[name="trainerGender"]:checked');
    const email = document.getElementById("email")?.value.trim() || "";
    const mNumber = document.getElementById("mob-num")?.value.trim() || "";
    const dis = document.getElementById("dis")?.value.trim() || "";
    const uResume = document.getElementById("resume")?.files?.[0] || null;

    const fnameErr = document.getElementById("fullname-error");
    const genderErr = document.getElementById("gender-error");
    const emailErr = document.getElementById("email-error");
    const mnumberErr = document.getElementById("number-error");
    const disErr = document.getElementById("dis-error");
    const resErr = document.getElementById("resume-error");

    const loadingMsg = document.getElementById("trainerLoadingMsg");
    const submitBtn = document.getElementById("submit");

    const fnamePattern = /^[A-Za-z ]{2,}$/;
    const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
    const mobilePattern = /^[0-9]{10}$/;

    let isValid = true;
    clearTrainerErrors();

    if (!fName) {
      if (fnameErr) fnameErr.innerText = "*Enter the name";
      isValid = false;
    } else if (!fnamePattern.test(fName)) {
      if (fnameErr) fnameErr.innerText = "*Enter a valid name";
      isValid = false;
    }

    if (!genderInput) {
      if (genderErr) genderErr.innerText = "*Please select a gender";
      isValid = false;
    }

    if (!email) {
      if (emailErr) emailErr.innerText = "*Email is required";
      isValid = false;
    } else if (!emailPattern.test(email)) {
      if (emailErr) emailErr.innerText = "*Enter a valid email ID";
      isValid = false;
    }

    if (!mNumber) {
      if (mnumberErr) mnumberErr.innerText = "*Mobile number is required";
      isValid = false;
    } else if (!mobilePattern.test(mNumber)) {
      if (mnumberErr) mnumberErr.innerText = "*Enter exactly 10 digits";
      isValid = false;
    }

    if (!dis) {
      if (disErr) disErr.innerText = "*Description is required";
      isValid = false;
    }

    if (!uResume) {
      if (resErr) resErr.innerText = "*Please upload your resume";
      isValid = false;
    }

    if (!isValid) return;

    const formData = new FormData();
    formData.append("name", fName);
    formData.append("gender", genderInput.value);
    formData.append("email", email);
    formData.append("mobile", mNumber);
    formData.append("description", dis);
    formData.append("file", uResume);

    if(loadingMsg){
       loadingMsg.style.display = "block";
       loadingMsg.innerText = "Submitting...";
       loadingMsg.style.color = "#00ccff";
    }
    if(submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = "Submitting...";
      submitBtn.style.opacity = "0.6";
      submitBtn.style.cursor = "not-allowed";
      submitBtn.style.backgroundColor = "#ccc";
      submitBtn.style.color = "#666";
      submitBtn.style.borderColor = "#999";
    }

    fetch("/api/courses/trainer/apply", {
      method: "POST",
      body: formData
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to submit trainer application. Status: " + response.status);
        }
        return response.text();
      })
      .then((message) => {
          if(loadingMsg){
            loadingMsg.style.innerText = "Submitted successfully!";
            loadingMsg.style.color = "lightgreen";
          }
        alert(message);
        trainerFormReset();
        closeTrainerform();
      })
      .catch((error) => {
        console.error("Trainer form error:", error);
       if(loadingMsg){
          loadingMsg.style.innerText = "Failed to submit. Please try again.";
          loadingMsg.style.color = "red";
        }
        alert(error.message);
      }).finally(() => {
        if(submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = "Submit";
          submitBtn.style.opacity = "1";
          submitBtn.style.cursor = "pointer";
          submitBtn.style.backgroundColor = "";
          submitBtn.style.color = "";
          submitBtn.style.borderColor = "";
        }
        setTimeout(() => {
          if(loadingMsg){
            loadingMsg.style.display = "none";
            loadingMsg.innerText = "";}
          }, 3000);
  });
});
}

// =========================
// STUDENT FORM SUBMISSION
// IMPORTANT:
// Student radios must use name="studentGender"
// =========================
if (stdForm) {
  stdForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("std-fName")?.value.trim() || "";
    const genderInput = document.querySelector('input[name="studentGender"]:checked');
    const email = document.getElementById("std-email")?.value.trim() || "";
    const mobileValue = document.getElementById("std-mNumber")?.value.trim() || "";
    const courseName = document.getElementById("course")?.value || "";

    const nameErr = document.getElementById("SnameErr");
    const genderErr = document.getElementById("SgenderErr");
    const emailErr = document.getElementById("SemailErr");
    const mobileErr = document.getElementById("SmobileErr");
    const courseErr = document.getElementById("ScourseErr");

    const loadingMsg = document.getElementById("studentLoadingMsg");
    const submitBtn = document.getElementById("std-sbt");

    const namePattern = /^[A-Za-z ]{2,}$/;
    const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
    const mobilePattern = /^[0-9]{10}$/;

    let isValid = true;
    clearStudentErrors();

    if (!name) {
      if (nameErr) nameErr.innerText = "*Enter name";
      isValid = false;
    } else if (!namePattern.test(name)) {
      if (nameErr) nameErr.innerText = "*Enter a valid name";
      isValid = false;
    }

    if (!genderInput) {
      if (genderErr) genderErr.innerText = "*Select a gender";
      isValid = false;
    }

    if (!email) {
      if (emailErr) emailErr.innerText = "*Enter email";
      isValid = false;
    } else if (!emailPattern.test(email)) {
      if (emailErr) emailErr.innerText = "*Enter a valid email";
      isValid = false;
    }

    if (!mobileValue) {
      if (mobileErr) mobileErr.innerText = "*Enter mobile number";
      isValid = false;
    } else if (!mobilePattern.test(mobileValue)) {
      if (mobileErr) mobileErr.innerText = "*Enter exactly 10 digits";
      isValid = false;
    }

    if (!courseName) {
      if (courseErr) courseErr.innerText = "*Select a course";
      isValid = false;
    }

    if (!isValid) return;

    const studentData = {
      name: name,
      gender: genderInput.value,
      email: email,
      mobile: Number(mobileValue),
      courseName: courseName
    };

    if(loadingMsg)
    {
      loadingMsg.style.display = "block";
      loadingMsg.innerText = "Submitting...";
      loadingMsg.style.color = "#00ccff";
    }
      if(submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = "Submitting...";
      submitBtn.style.opacity = "0.6";
      submitBtn.style.cursor = "not-allowed";
      submitBtn.style.backgroundColor = "#ccc";
      submitBtn.style.color = "#666";
      submitBtn.style.borderColor = "#999";
    }

    fetch("/api/courses/student/enroll", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(studentData)
    })
      .then((response) => {
          document.body.style.cursor = "progress";
        if (!response.ok) {
          throw new Error("Failed to register student. Status: " + response.status);
        }
        return response.text();
        document.body.style.cursor = "default";
      })
      .then((message) => {
        if(loadingMsg){
          loadingMsg.style.innerText = "Registration successfully!";
          loadingMsg.style.color = "lightgreen";
        }
        alert(message);
        studentFormReset();
        closeStudentform();
      })
      .catch((error) => {
        console.error("Student form error:", error);
        if(loadingMsg){
          loadingMsg.style.innerText = "Failed to submit. Please try again.";
          loadingMsg.style.color = "red";
        }
        alert(error.message);
      }).finally(() => {
        if(submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = "Submit";
          submitBtn.style.opacity = "1";
          submitBtn.style.cursor = "pointer";
          submitBtn.style.backgroundColor = "";
          submitBtn.style.color = "";
          submitBtn.style.borderColor = "";
        }
        setTimeout(() => {
          if(loadingMsg){
            loadingMsg.style.display = "none";
            loadingMsg.innerText = "";
          }
          }, 3000);
        });
  });
}
document.getElementById("year").textContent = new Date().getFullYear();
