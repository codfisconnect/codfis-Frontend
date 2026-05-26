let allCourses = [];



const courseBody = document.getElementById("cors-bdy");
const courseForm = document.getElementById("courseForm");
const updateBtn = document.getElementById("updateBtn");
const submitBtn = courseForm.querySelector('button[type="submit"]');

function showcourses() {
  courseBody.innerHTML = `
    <tr>
      <td colspan="5">Loading courses...</td>
    </tr>
  `;

  fetch("https://codfis-backend.onrender.com/courses", {
    method: "GET",
    headers: { "Authorization": `Bearer ${token}` }
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }
      return response.json();
    })
    .then((data) => {
      allCourses = data;
      renderCourses(allCourses);
      document.getElementById("coursesCountDis").innerText = `Total Courses: ${allCourses.length}`;
    })
    .catch((error) => {
      console.error("Error fetching courses:", error);
      courseBody.innerHTML = `
        <tr>
          <td colspan="5">Failed to load courses.</td>
        </tr>
      `;
    });
}

function renderCoursesMobile(courses) {
  let container = document.getElementById("courseContainer"); 
  if (!courses.length) {
    container.innerHTML = "<h2>No courses found.</h2>";
    return;
  }
  else{
    
  let html = "";
  courses.forEach(course => {
    html += `
      <div class="courseCard">
        <h4>Course ID: ${course.courseId ?? ""}</h4>
        <h4>Course Name: ${course.courseName ?? ""}</h4>
        <h4>Duration: ${course.courseDuration ?? ""}</h4>
        <p>Trainer: ${course.trainerName ?? ""}</p>
      </div>
    `;
  });
  container.innerHTML = html;
  }
  
}


function renderCourses(courses) {
if (screen.width < 600) {
    renderCoursesMobile(courses);
  } 
 else if (!courses.length) {
    courseBody.innerHTML = `
      <tr>
        <td colspan="5">No courses found.</td>
      </tr>
    `;
    return;
  }

  let rows = "";

  courses.forEach((course) => {
    rows += `
      <tr>
        <td>${course.courseId ?? ""}</td>
        <td>${course.courseName ?? ""}</td>
        <td>${course.courseDuration ?? ""}</td>
        <td>${course.trainerName ?? ""}</td>
      </tr>
    `;
  });

  courseBody.innerHTML = rows;
}

courseForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const payload = {
    courseId: document.getElementById("courseId").value.trim(),
    courseName: document.getElementById("courseName").value.trim(),
    courseDuration: document.getElementById("courseDuration").value.trim(),
    trainerName: document.getElementById("trainerName").value.trim(),
  };
  existingCourse = allCourses.find(c => c.courseId === payload.courseId);
  if (existingCourse) {
    if (!confirm("Course with this ID already exists. please delete the existing course or choose a different ID.")) {  
      return;
    }
  }


  fetch("https://codfis-backend.onrender.com/courses/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(payload),
  })
    .then(async (response) => {
      const text = await response.text();
      if (!response.ok) {
        throw new Error("Failed to save course");
      }
      else if (text.toLowerCase().includes("exists")) {
        throw new Error("Course with this ID already exists");
      }
      return text;
    })
    .then((message) => {
      alert(message);
      courseForm.reset();
      showcourses();
    })
    .catch((error) => {
      console.error("Error saving course:", error);
      alert("Failed to save course: " + error.message);
    });
});





