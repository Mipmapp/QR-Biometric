let users = [];
let selectedUser = null;

// Toggle menu
function toggleMenu() {
    const sidebar = document.getElementById("sidebar");
    sidebar.style.left = sidebar.style.left === "0px" ? "-200px" : "0px";
}

// Fetch users
async function fetchUsers() {
    const response = await fetch('registered.json');
    users = await response.json();
    showUsers('students');
}

// Show users based on type
function showUsers(type) {
    const list = document.getElementById("user-list");
    list.innerHTML = "";
    
    if (type === "students") {
        const grouped = groupByGrade(users.filter(u => u.userType === "student"));
        for (const grade in grouped) {
            const folder = document.createElement("div");
            folder.classList.add("user-card");
            folder.innerHTML = `<strong>Grade ${grade}</strong>`;
            folder.onclick = () => showSections(grouped[grade]);
            list.appendChild(folder);
        }
    } else {
        users.filter(u => u.userType === "faculty").forEach(user => list.appendChild(createUserCard(user)));
    }
}

// Group students by grade
function groupByGrade(students) {
    return students.reduce((acc, student) => {
        acc[student.grade] = acc[student.grade] || [];
        acc[student.grade].push(student);
        return acc;
    }, {});
}

// Show sections inside grade
function showSections(gradeUsers) {
    const list = document.getElementById("user-list");
    list.innerHTML = "";
    
    const groupedSections = gradeUsers.reduce((acc, user) => {
        acc[user.section] = acc[user.section] || [];
        acc[user.section].push(user);
        return acc;
    }, {});

    for (const section in groupedSections) {
        const folder = document.createElement("div");
        folder.classList.add("user-card");
        folder.innerHTML = `<strong>Section ${section}</strong>`;
        folder.onclick = () => showUserList(groupedSections[section]);
        list.appendChild(folder);
    }
}

// Show user list
function showUserList(users) {
    const list = document.getElementById("user-list");
    list.innerHTML = "";
    users.forEach(user => list.appendChild(createUserCard(user)));
}

// Create user card
function createUserCard(user) {
    const card = document.createElement("div");
    card.classList.add("user-card");
    card.innerHTML = `<img src="${user.image || 'default.jpg'}" width="50"><br>${user.name}`;
    card.onclick = () => openModal(user);
    return card;
}

// Open modal for edit
function openModal(user) {
    selectedUser = user;
    document.getElementById("user-image").src = user.image || 'default.jpg';
    document.getElementById("edit-name").value = user.name;
    document.getElementById("edit-grade").value = user.grade;
    document.getElementById("edit-section").value = user.section;
    document.getElementById("user-modal").style.display = "block";
}

// Close modal
function closeModal() {
    document.getElementById("user-modal").style.display = "none";
}

// Save edited user
function saveEdit() {
    if (selectedUser) {
        selectedUser.name = document.getElementById("edit-name").value;
        selectedUser.grade = document.getElementById("edit-grade").value;
        selectedUser.section = document.getElementById("edit-section").value;
        closeModal();
        showUsers('students');
    }
}

// Delete user
function deleteUser() {
    if (selectedUser) {
        users = users.filter(u => u.id !== selectedUser.id);
        closeModal();
        showUsers('students');
    }
}

// Search users
function searchUsers() {
    const query = document.getElementById("searchInput").value.toLowerCase();
    showUserList(users.filter(u => u.name.toLowerCase().includes(query)));
}

// Add folder (Grade)
function addFolder() {
    const grade = prompt("Enter new grade:");
    if (grade) {
        const newFolder = document.createElement("div");
        newFolder.classList.add("user-card");
        newFolder.innerHTML = `<strong>Grade ${grade}</strong>`;
        document.getElementById("user-list").appendChild(newFolder);
    }
}

// Load data
fetchUsers();
