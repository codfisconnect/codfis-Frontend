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

  fetch("http://localhost:8080/courses", {
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
      
      <div class="btn-group">
        <button class="edit-btn" onclick="editCourse('${course.courseId}')">Edit</button>
        <button class="delete-btn" onclick="deleteCourse('${course.courseId}')">Delete</button>
      </div>
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
        <td>
          <div class="action-group">
            <button class="edit-btn" onclick="editCourse('${course.courseId}')">Edit</button>
            <button class="delete-btn" onclick="deleteCourse('${course.courseId}')">Delete</button>
          </div>
        </td>
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


  fetch("http://localhost:8080/courses/add", {
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

function deleteCourse(courseId) {
  const confirmed = confirm("Are you sure you want to delete this course?");
  if (!confirmed) return;

  fetch(`http://localhost:8080/courses/delete/${courseId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to delete course");
      }
      return response.text();
    })
    .then((message) => {
      alert(message);
      showcourses();
    })
    .catch((error) => {
      console.error("Error deleting course:", error);
      alert("Failed to delete course");
    });
}

function editCourse(courseId) {
  updateBtn.style.display = "block";
  submitBtn.style.display = "none";

  const course = allCourses.find(c => c.courseId === courseId);
  if (!course) {
    alert("Course not found");
    return;
  }

  selectedCourseId = courseId;

  document.getElementById("courseId").value = course.courseId || "";
  document.getElementById("courseName").value = course.courseName || "";
  document.getElementById("courseDuration").value = course.courseDuration || "";
  document.getElementById("trainerName").value = course.trainerName || "";
}

let selectedCourseId = null;

updateBtn.addEventListener("click", updateCourse);

function updateCourse() {
  if (!selectedCourseId) {
    alert("No course selected for update");
    return;
  }

  const updatedData = {
    courseId: document.getElementById("courseId").value.trim(),
    courseName: document.getElementById("courseName").value.trim(),
    courseDuration: document.getElementById("courseDuration").value.trim(),
    trainerName: document.getElementById("trainerName").value.trim()
  };

  fetch(`http://localhost:8080/courses/update/${selectedCourseId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(updatedData)
  })
    .then(async response => {
      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || `Failed to update course. Status: ${response.status}`);
      }
      return text;
    })
    .then(message => {
      alert(message);
      resetCourseForm();
      showcourses();
    })
    .catch(error => {
      console.error("Update error:", error);
      alert(error.message);
    });
}

function resetCourseForm() {
  document.getElementById("courseId").value = "";
  document.getElementById("courseName").value = "";
  document.getElementById("courseDuration").value = "";
  document.getElementById("trainerName").value = "";

  selectedCourseId = null;
  updateBtn.style.display = "none";
  submitBtn.style.display = "block";
}