
window.onload = function() {
    showStudentsdisplay();
    showCoursedisplay();
    showTrainerRequestdisplay();
}

function showStudentsdisplay() {
    fetch("https://codfis-backend.onrender.com/courses/student/all",
        {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        })
    .then(res => res.json())
    .then(students => {
      
        document.getElementById("studentCountDisplay").innerText = `${students.length}`;

    })

    .catch(err => alert(err));
}
function showCoursedisplay() {
    fetch("https://codfis-backend.onrender.com/courses", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(courses => { 
        document.getElementById("courseCountDisplay").innerText = `${courses.length}`;
    })
    .catch(err => alert(err));
}   


function showTrainerRequestdisplay() {
    fetch("https://codfis-backend.onrender.com/courses/trainer/applied", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(count => {
        document.getElementById("trainerRequestCountDisplay").innerText = `${count.length}`;
    })
    .catch(err => alert(err));
}
