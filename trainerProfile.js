const today = new Date().toISOString().split("T")[0];
document.getElementById("interviewDate").setAttribute("min", today);
const interviewBtn = document.getElementById("interviewButton");
interviewBtn.addEventListener("click", callForInterview);

function callForInterview() {
  const interviewForm = document.querySelector(".mail-section");
  interviewForm.style.display = "block";

  interviewForm.addEventListener("submit", function (e) {
    e.preventDefault();
    
    const interviewDate = document.getElementById("interviewDate").value;
    const interviewTime = document.getElementById("interviewTime").value;
    const mobile = getTrainerMobileFromUrl();
    const token = localStorage.getItem("token");
  });
}

function getTrainerMobileFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("mobile");
}
let currentTrainer = null;

function loadTrainerProfile() {
  const mobile = getTrainerMobileFromUrl();
  const token = localStorage.getItem("token");

  if (!mobile) {
    alert("Trainer mobile not found");
    return;
  }

  let trainerFileName = "resume";

  fetch(`http://localhost:8080/courses/trainer/${mobile}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Failed to load trainer profile");
      }
      return response.json();
    })
    .then((trainer) => {
      currentTrainer = trainer; 
      document.getElementById("trainerName").innerText = trainer.name || "";
      document.getElementById("trainerGender").innerText = trainer.gender || "";
      document.getElementById("trainerEmail").innerText = trainer.email || "";
      document.getElementById("trainerMobile").innerText = trainer.mobile || "";
      document.getElementById("trainerDescription").innerText = trainer.description || "";

      trainerFileName = trainer.fileName || "resume";

      return fetch(`http://localhost:8080/courses/trainer/resume/${mobile}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
    })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Failed to load resume");
      }
      return response.blob();
    })
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob);

      // preview full resume
      document.getElementById("resumeFrame").src = blobUrl;

      // download full resume
      const downloadBtn = document.getElementById("downloadResume");
      downloadBtn.href = blobUrl;
      downloadBtn.download = trainerFileName;
    })
    .catch((error) => {
      console.error(error);
      alert(error.message);
    });
}

const interviewModeSelect = document.getElementById("interviewMode");
const meetingLinkInput = document.getElementById("meetingLink");

const defaultOfflineVenue =
  "Codfis Technologies Pvt Ltd,\n" +
  "1st Floor, 62, 2/2, Peter's Rd,\n" +
  "Royapettah, Chennai - 600014\n\n" +
  "Google Maps Location:\n" +
  "https://www.google.com/maps/dir//Codfis+Technologies,+1st+Floor+62,+2%2F2,+Peter's+Rd,+Ganapathy+Colony,+Royapettah,+Chennai,+Tamil+Nadu+600014/@10.9600786,78.076603,15z/data=!3m2!4b1!5s0x3a52663c843dd7af:0xa40429b826d6910!4m8!4m7!1m0!1m5!1m1!1s0x3a526703984c0539:0xbf76f45d3396ec5!2m2!1d80.2631937!2d13.0538713?entry=ttu&g_ep=EgoyMDI2MDQxNS4wIKXMDSoASAFQAw%3D%3D";
  
if (interviewModeSelect && meetingLinkInput) {
  interviewModeSelect.addEventListener("change", function () {
    const selectedMode = this.value;

    if (selectedMode === "Offline") {
      meetingLinkInput.value = defaultOfflineVenue;
      meetingLinkInput.readOnly = true;
    } else if (selectedMode === "Online") {
      meetingLinkInput.value = "https://teams.live.com/meet/9381499395570?p=NrMtmIjD3Qcjfc7iRg";
      meetingLinkInput.placeholder = "Enter Google Meet / Teams link";
      meetingLinkInput.readOnly = false;
    } else if (selectedMode === "Phone Call") {
      meetingLinkInput.value = "Phone call will be arranged by our team";
      meetingLinkInput.readOnly = false;
    } else {
      meetingLinkInput.value = "";
      meetingLinkInput.readOnly = false;
    }
  });
}

const interviewMailForm = document.getElementById("interviewMailForm");

if (interviewMailForm) {
    interviewMailForm.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!currentTrainer) {
            alert("Trainer details not loaded");
            return;
        }

        const token = localStorage.getItem("token");
        const mailStatus = document.getElementById("mailStatus");

        const subject = document.getElementById("mailSubject").value.trim();
        const interviewDate = document.getElementById("interviewDate").value;
        const interviewTime = document.getElementById("interviewTime").value;
        const interviewMode = document.getElementById("interviewMode").value;
        const meetingLink = document.getElementById("meetingLink").value.trim();
        const message = document.getElementById("mailMessage").value.trim();

        if (!subject || !interviewDate || !interviewTime || !interviewMode ||  !message) {
            mailStatus.style.color = "red";
            mailStatus.innerText = "Please fill all interview details before sending.";
            return;
        }
        
        const payload = {
            toEmail: currentTrainer.email,
            candidateName: currentTrainer.name,
            subject: subject,
            interviewDate: interviewDate,
            interviewTime: interviewTime,
            interviewMode: interviewMode,
            meetingLink: meetingLink,
            message: message
        };

        console.log("Interview mail payload:", payload);

        mailStatus.style.color = "white";
        mailStatus.innerText = "Sending...";

        fetch("http://localhost:8080/courses/trainer/sendInterviewMail", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        })
        .then(async (response) => {
            const text = await response.text();

            if (!response.ok) {
                throw new Error(text || "Failed to send interview mail");
            }

            return text;
        })
        .then((message) => {
            mailStatus.style.color = "lightgreen";
            mailStatus.innerText = message;
            alert(message);
            interviewMailForm.reset();
            closeInterviewForm();
             mailStatus.innerText = "";
        })
        .catch((error) => {
            console.error(error);
            mailStatus.style.color = "red";
            mailStatus.innerText = error.message;
            alert(error.message);
           
        });
    });
}

function closeInterviewForm() {
  const interviewForm = document.querySelector(".mail-section");
  interviewForm.style.display = "none";
}


window.onload = loadTrainerProfile;