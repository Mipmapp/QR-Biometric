const userList = document.getElementById('userList');
const editName = document.getElementById('editName');
const editMobile = document.getElementById('editMobile');
const editGrade = document.getElementById('editGrade');
const editSection = document.getElementById('editSection');
const editImage = document.getElementById('editImage');
const saveBtn = document.getElementById('saveBtn');
const gradeFilter = document.getElementById("gradeFilter");
const studentsBtn = document.getElementById('studentsBtn');
const facultyBtn = document.getElementById('facultyBtn');
const previewImage = document.getElementById('previewImage');

const editModal = document.getElementById("editModal");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");


let currentUserId = null;
let currentUserType = 'student';
let usersData = [];

// Load users on page load
window.addEventListener("DOMContentLoaded", () => {
    gradeFilter.addEventListener("change", displayUsers);
    setActiveButton(studentsBtn);
    loadUsers();
});

function setActiveButton(activeBtn) {
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
}

studentsBtn.addEventListener('click', () => {
    currentUserType = 'student';
    gradeFilter.classList.remove('hidden');
    document.querySelector(".filter-container").style.display = "none";
    loadUsers();
    setActiveButton(studentsBtn);
});

facultyBtn.addEventListener('click', () => {
    currentUserType = 'faculty';
    gradeFilter.classList.add('hidden');
    document.querySelector(".filter-container").style.display = "block";
    loadUsers();
    setActiveButton(facultyBtn);
});

function loadUsers() {
    fetch('/registered.json')
        .then(response => response.json())
        .then(users => {
            usersData = users;
            displayUsers();
        })
        .catch(error => console.error("Error loading users:", error));
}

function displayUsers() {
    userList.innerHTML = '';
    const selectedGrade = gradeFilter.value;
    const filteredUsers = usersData.filter(user =>
        user.userType === currentUserType &&
        (currentUserType === 'faculty' || selectedGrade === "all" || String(user.grade) === selectedGrade)
    );

    if (filteredUsers.length === 0) {
        userList.innerHTML = `<p>No ${currentUserType} found.</p>`;
        return;
    }

    filteredUsers.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-card';
        userItem.dataset.id = user.id;

        userItem.innerHTML = `
            <img src="${user.image || '/assets/svg/empty.jpg'}" alt="${user.name}">
            <h3>${user.name}</h3>
            ${currentUserType === 'student' ? `<p>Grade: ${user.grade}</p><p>Section: ${user.section}</p>` : ''}
            <p>Mobile: ${user.mobile_num}</p>
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        `;

        userList.appendChild(userItem);
    });

    // Event listener for Label Edit button
    userList.addEventListener("click", (event) => {
        if (event.target.classList.contains("label-btn")) {
            const userId = event.target.closest(".user-card")?.dataset.id;
            openLabelEditModal(userId);
        }
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const userId = event.target.closest('.user-card')?.dataset.id;
            if (userId) {
                deleteUser(userId);
            } else {
                console.error("Error: User ID is null or undefined");
            }
        });
    });
}

userList.addEventListener('click', (event) => {
    const target = event.target;
    if (target.classList.contains('edit-btn')) {
        const userId = target.closest('.user-card')?.dataset.id;
        if (userId) {
            editUser(userId);
        }
    }
});

function editUser(id) {
    console.log("Editing user ID:", id);  // ✅ Debugging log

    const user = usersData.find(u => String(u.id) === String(id));

    if (!user) {
        console.error("User not found!");
        return;
    }

    console.log("User found:", user);  // ✅ Debugging log

    // Fill in user details
    currentUserId = user.id;
    editName.value = user.name;
    editMobile.value = user.mobile_num;
    previewImage.src = user.image || '/assets/svg/empty.jpg';

    // Show grade & section only for students
    if (user.userType === 'student') {
        editGrade.value = user.grade || '';
        editSection.value = user.section || '';
        editGrade.classList.remove('hidden');
        editSection.classList.remove('hidden');
    } else {
        editGrade.classList.add('hidden');
        editSection.classList.add('hidden');
    }

    // 🚀 Fix: Show the modal
    editModal.classList.remove("hidden");
    editModal.style.display = "flex";  // 🔥 Force visibility
    editModal.style.zIndex = "9999";   // 🔥 Ensure it's on top

    console.log("Modal should now be visible.");
}

function closeModalHandler() {
    editModal.classList.add('hidden');
    editModal.style.display = "none"; // Ensures it disappears fully
}

closeModal.addEventListener("click", closeModalHandler);
cancelBtn.addEventListener("click", closeModalHandler);

window.addEventListener("click", (event) => {
    if (event.target === editModal) {
        closeModalHandler();
    }
});

closeModal.addEventListener("click", () => {
    editModal.classList.add("hidden");
});

cancelBtn.addEventListener("click", () => {
    editModal.classList.add("hidden");
});


saveBtn.addEventListener('click', () => {
    const formData = new FormData();
    formData.append('id', currentUserId);
    formData.append('name', editName.value);
    formData.append('mobile_num', editMobile.value);
    formData.append('userType', currentUserType);

    if (editImage.files.length > 0) {
        formData.append('image', editImage.files[0]); // Add image only if selected
    }
    if (currentUserType === 'student') {
        formData.append('grade', editGrade.value);
        formData.append('section', editSection.value);
    }

    fetch(`/update/${currentUserId}`, {
        method: 'PUT',
        body: formData, // ✅ No need for headers, browser sets it automatically
    })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            loadUsers();
            closeModalHandler();
        })
        .catch(error => console.error("Error updating user:", error));
});

function deleteUser(id) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    fetch(`/delete/${id}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            loadUsers();
        });
}

editImage.addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const editRole = document.getElementById("editRole");
    const gradeLabel = document.getElementById("gradeLabel");
    const editGrade = document.getElementById("editGrade");
    const editSection = document.getElementById("editSection");

    // Function to toggle fields based on role
    function toggleRoleFields() {
        if (editRole.value === "faculty") {
            // Faculty should not have Grade or Section
            gradeLabel.style.display = "none";
            editGrade.style.display = "none";
            editSection.style.display = "none";
        } else {
            // Student should have Grade & Section
            gradeLabel.style.display = "block";
            editGrade.style.display = "block";
            editSection.style.display = "block";
        }
    }

    // Event Listener for Role Change
    editRole.addEventListener("change", toggleRoleFields);

    // Call on modal open (if user is already faculty, hide grade/section)
    toggleRoleFields();
});
