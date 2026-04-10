
let sideNavbar= document.querySelector(".sidenavbar")
 
function openNavbar(){
    sideNavbar.style.left = "0"

}

function closesnavbar(){
    sideNavbar.style.left = "-60%"

}

function lanchInstagram(){
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

        let trainerForm=document.getElementById("trainer-form")

        function openTrainerform(){
           if(window.innerWidth <= 600){
            trainerForm.style.bottom="30%"
           }   
              else{ trainerForm.style.bottom="10%"}
        }
        function closeTrainerform(){
            trainerForm.style.bottom="-100%"
        }
        function openStudentform(){
            if(window.innerWidth <= 600){
                stdForm.style.top="3%"
               }
              else{ stdForm.style.top="10%"}

        }
        function closeStudentform(){
            stdForm.style.top="-100%"
        }

        // join class btn position change

      const joinBtn = document.getElementById("joinBtn");
      const trainerBtn = document.getElementById("trainerBtn");
      const slideShow = document.querySelector(".slide-show");

window.addEventListener("scroll", () => {
    const slideShowTop = slideShow.getBoundingClientRect().top;

    if (slideShowTop < -200) {
        joinBtn.style.position = "fixed";
        joinBtn.style.top = "5%";
        joinBtn.style.left = "30%";
        joinBtn.style.zIndex = "999";

        trainerBtn.style.position = "fixed";
        trainerBtn.style.top = "5%";
        trainerBtn.style.left = "50%";  
        trainerBtn.style.zIndex = "999";
    } else {
        // Back to absolute on the image
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
        

        // Trainer form submintion

        
        
            trainerForm.addEventListener("submit",(event)=>{
            event.preventDefault();

            
            // Access User Input Box
            let fName= document.getElementById("full-name").value.trim()
            let gender= document.querySelector('input[name="gender"]:checked').value;
            let email= document.getElementById("email").value.trim()
            let mNumber= document.getElementById("mob-num").value.trim()
            let dis= document.getElementById("dis").value
           let uResume = document.getElementById("resume").files[0];

        

            

            //  Access Error Dialouge Box
            let genderErr=document.getElementById("gender-error")
            let emailErr=document.getElementById("email-error")
            let mnumberErr=document.getElementById("number-error")
            let disErr=document.getElementById("dis-error")
            let resErr=document.getElementById("resume-error")
           
            //  User Input Parttern Authentication
         
            let emailPartn=/^[a-z0-9]+@[a-z]{4,}\.[a-z]{2,}$/;
            let mnumberPartn=/^[0-9]{10}$/


            // Validation flag
            let isValid = true;

            // Email Authentication
             if (!gender) {
                genderErr.innerText="*Please select a gender."
                isValid = false; // Mark form as invalid
            }

            else if(email===""){
                emailErr.innerText="*Email is Required"
                isValid = false; // Mark form as invalid
            }
            else if(!emailPartn.test(email)){
                emailErr.innerText="*Enter correct Email ID"
                isValid = false; // Mark form as invalid
            }
            else if(emailPartn.test(email)){
                emailErr.innerText=""
            }

            // Mobile num Authentication
            if(mNumber===""){
                mnumberErr.innerText="*Mobile Number is Required"
                isValid = false; // Mark form as invalid
            }
            else if(!mnumberPartn.test(mNumber)){
                mnumberErr.innerText="*Only 10 Numbers Sholud Enter"
                isValid = false; // Mark form as invalid
            }
            else if(mnumberPartn.test(mNumber)){
                mnumberErr.innerText=""
            }

            // Discribition Authentication
            if(dis==""){
                disErr.innerText="*Discribition is Required"
                isValid = false; // Mark form as invalid
            }
            else if(dis!==""){
                disErr.innerText=""
            }

            // Resume Authentication
            if(!uResume){
                resErr.innerText="*Plesae Upload Your Resume"
                isValid = false; // Mark form as invalid
            }
            else {
                resErr.innerText=""
            }

            if (!isValid) return; // Stop form submission if validation fails

            const formData=new FormData();
            formData.append("name", fName);
            formData.append("gender", gender);
            formData.append("email", email);
            formData.append("mobile", mNumber);
            formData.append("description", dis);
            formData.append("file", uResume);



            //  send POST request to backend
            fetch("http://localhost:8080/courses/trainer/apply",{
                method:"POST",
                
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to submit trainer application. Status: " + response.status);
                }
                return response.text();
            
            })
            .then(message => {
                alert(message);

                trainerFormReset(); 
                closeTrainerform();
            })
            .catch(error => {
                alert(error.message);
                console.error("Error:", error);
            });
        });

        function trainerFormReset(){
            document.getElementById("full-name").value="";
            document.getElementById("email").value="";
            document.getElementById("mob-num").value="";
            document.getElementById("dis").value="";
            document.getElementById("resume").value="";
        }
        // Student form submintion


        let stdForm=document.getElementById("std-form")

       stdForm.addEventListener("submit",(event)=> {
      event.preventDefault(); // Stop page reload
    

    // Get values from form fields
    const name = document.getElementById("std-fName").value.trim();
    const gender = document.querySelector('input[name="gender"]:checked').value;
    const email = document.getElementById("std-email").value.trim();
    const mobile = parseInt(document.getElementById("std-mNumber").value.trim());
    const courseName = document.getElementById("course").value;

    // Simple form validation
    if (!name || !email || !mobile || !courseName || !gender) {
        alert("Please fill in all fields.");
        return;
    }

    // Data object matching backend field names exactly
    const studentData = {
        name: name,
        gender: gender,
        email: email,
        mobile: mobile,
        courseName: courseName
    };

    // Send POST request

    fetch("http://localhost:8080/courses/student/enroll", { 
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            
        },
        body: JSON.stringify(studentData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Failed to register student. Status: " + response.status);
        }
        return response.text();
    })
    .then(message => {
        alert(message);

        stdForm.reset(); // Clear form fields after successful submission
         
        closeStudentform();
        
    })
    .catch(error => {
        alert(error.message);
        console.error("Error:", error);
    });
});