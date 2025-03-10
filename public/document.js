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
    loadUsers();
    setActiveButton(studentsBtn);
});

facultyBtn.addEventListener('click', () => {
    currentUserType = 'faculty';
    gradeFilter.classList.add('hidden');
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
}

userList.addEventListener('click', (event) => {
    const target = event.target;
    const userId = target.closest('.user-card')?.dataset.id;
    if (target.classList.contains('edit-btn')) {
        editUser(userId);
    } else if (target.classList.contains('delete-btn')) {
        deleteUser(userId);
    }
});

function editUser(id) {
    console.log("Editing user ID:", id);  // Debugging
    const user = usersData.find(u => u.id === id);

    if (!user) {
        console.error("User not found!");
        return;
    }

    currentUserId = user.id;
    document.getElementById("editName").value = user.name;
    document.getElementById("editMobile").value = user.mobile_num;
    document.getElementById("previewImage").src = user.image || '/assets/svg/empty.jpg';

    if (user.userType === 'student') {
        document.getElementById("editGrade").value = user.grade || '';
        document.getElementById("editSection").value = user.section || '';
        document.getElementById("editGrade").classList.remove('hidden');
        document.getElementById("editSection").classList.remove('hidden');
    } else {
        document.getElementById("editGrade").classList.add('hidden');
        document.getElementById("editSection").classList.add('hidden');
    }

    // 🟢 Show the modal
    editModal.classList.remove("hidden");
}

function closeModalHandler() {
    editModal.classList.add('hidden');
}

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
        formData.append('image', editImage.files[0]);
    }
    if (currentUserType === 'student') {
        formData.append('grade', editGrade.value);
        formData.append('section', editSection.value);
    }

    fetch(`/update/${currentUserId}`, { method: 'PUT', body: formData })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            loadUsers();
            closeModalHandler();
        });
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