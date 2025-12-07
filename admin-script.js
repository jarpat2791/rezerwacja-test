// Skrypt dla panelu administracyjnego zarządzania użytkownikami

let users = [];
let editingUserId = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing admin panel');
    
    // Sprawdź czy użytkownik jest zalogowany i ma uprawnienia admina
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.login !== 'admin')) {
        alert('Brak uprawnień do panelu administracyjnego!');
        window.location.href = 'index.html';
        return;
    }
    
    console.log('Current user:', currentUser);
    
    // Ustaw nazwę administratora
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay) {
        userDisplay.textContent = `Zalogowany jako: ${currentUser.name}`;
    }
    
    // Załaduj użytkowników
    loadUsers();
    
    // Obsługa przycisków - użyj event delegation
    document.addEventListener('click', function(e) {
        // Przycisk dodaj użytkownika
        if (e.target && (e.target.id === 'addUserBtn' || e.target.closest('#addUserBtn'))) {
            console.log('Add user button clicked');
            showUserForm();
        }
        
        // Przycisk eksport
        if (e.target && (e.target.id === 'exportUsersBtn' || e.target.closest('#exportUsersBtn'))) {
            console.log('Export button clicked');
            exportUsers();
        }
        
        // Zamknięcie modala
        if (e.target && (e.target.classList.contains('close-modal') || e.target.closest('.close-modal'))) {
            console.log('Close modal button clicked');
            document.getElementById('userFormModal').classList.add('hidden');
            resetUserForm();
        }
    });
    
    // Obsługa formularza użytkownika
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Form submitted');
            saveUser();
        });
    }
    
    // Obsługa siły hasła
    const passwordInput = document.getElementById('editPassword');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            checkPasswordStrength(this.value);
        });
    }
    
    // Aktualizuj datę
    updateLastUpdate();
});

// Aktualizuj datę ostatniej aktualizacji
function updateLastUpdate() {
    const lastUpdate = document.getElementById('lastUpdate');
    if (lastUpdate) {
        const now = new Date();
        const dateStr = now.toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        lastUpdate.textContent = `Ostatnia aktualizacja: ${dateStr}`;
    }
}

// Załaduj użytkowników
function loadUsers() {
    console.log('Loading users...');
    
    // Sprawdź czy istnieją zapisani użytkownicy w localStorage
    const savedUsers = localStorage.getItem('systemUsers');
    
    if (savedUsers) {
        users = JSON.parse(savedUsers);
        console.log('Loaded users from localStorage:', users.length);
    } else {
        // Fallback jeśli nie ma zapisanych użytkowników
        console.log('No saved users, creating default ones');
        users = [
            { login: "pracownik1", password: "haslo123", name: "Jan Kowalski", role: "user" },
            { login: "pracownik2", password: "haslo456", name: "Anna Nowak", role: "user" },
            { login: "pracownik3", password: "haslo789", name: "Piotr Wiśniewski", role: "user" },
            { login: "admin", password: "admin123", name: "Administrator", role: "admin" }
        ];
        saveUsersToStorage();
    }
    
    renderUsersTable();
}

// Zapisz użytkowników do localStorage
function saveUsersToStorage() {
    localStorage.setItem('systemUsers', JSON.stringify(users));
    console.log('Users saved to localStorage');
    updateLastUpdate();
}

// Wyświetl użytkowników w tabeli
function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) {
        console.error('usersTableBody not found!');
        return;
    }
    
    tbody.innerHTML = '';
    
    console.log('Rendering users table:', users.length);
    
    users.forEach((user, index) => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${user.login}</td>
            <td>${'*'.repeat(8)}</td>
            <td>${user.name}</td>
            <td>${user.role === 'admin' ? 'Administrator' : 'Pracownik'}</td>
            <td>
                <button class="btn-edit" data-index="${index}">
                    <i class="fas fa-edit"></i> Edytuj
                </button>
                <button class="btn-change-password" data-index="${index}">
                    <i class="fas fa-key"></i> Zmień hasło
                </button>
                <button class="btn-delete" data-index="${index}">
                    <i class="fas fa-trash"></i> Usuń
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Dodaj event listenery do przycisków w tabeli
    tbody.addEventListener('click', function(e) {
        const target = e.target;
        const button = target.closest('button');
        
        if (button) {
            const index = parseInt(button.getAttribute('data-index'));
            
            if (button.classList.contains('btn-edit')) {
                console.log('Edit button clicked for index:', index);
                editUser(index);
            } else if (button.classList.contains('btn-change-password')) {
                console.log('Change password button clicked for index:', index);
                changeUserPassword(index);
            } else if (button.classList.contains('btn-delete')) {
                console.log('Delete button clicked for index:', index);
                deleteUser(index);
            }
        }
    });
}

// Pokaż formularz użytkownika
function showUserForm(user = null, index = null) {
    console.log('Showing user form', { user, index, editingUserId });
    
    const modal = document.getElementById('userFormModal');
    const title = document.getElementById('modalTitle');
    
    if (!modal || !title) {
        console.error('Modal elements not found!');
        return;
    }
    
    if (user && index !== null) {
        title.textContent = 'Edytuj użytkownika';
        document.getElementById('editLogin').value = user.login;
        document.getElementById('editPassword').value = user.password;
        document.getElementById('editName').value = user.name;
        document.getElementById('editRole').value = user.role || 'user';
        editingUserId = index;
    } else {
        title.textContent = 'Dodaj nowego użytkownika';
        document.getElementById('editLogin').value = '';
        document.getElementById('editPassword').value = '';
        document.getElementById('editName').value = '';
        document.getElementById('editRole').value = 'user';
        editingUserId = null;
    }
    
    modal.classList.remove('hidden');
    console.log('Modal shown, hidden class removed');
}

// Zapisz użytkownika
function saveUser() {
    console.log('Saving user, editingUserId:', editingUserId);
    
    const login = document.getElementById('editLogin').value.trim();
    const password = document.getElementById('editPassword').value;
    const name = document.getElementById('editName').value.trim();
    const role = document.getElementById('editRole').value;
    
    // Walidacja pól
    if (!login || !password || !name) {
        alert('Wszystkie pola są wymagane!');
        return;
    }
    
    if (password.length < 8) {
        alert('Hasło musi mieć minimum 8 znaków!');
        return;
    }
    
    // Sprawdź czy login już istnieje (tylko przy dodawaniu nowego)
    if (editingUserId === null) {
        if (users.some(u => u.login === login)) {
            alert('Użytkownik o tym loginie już istnieje!');
            return;
        }
    } else {
        // Przy edycji sprawdź czy nowy login nie koliduje z innymi użytkownikami
        if (login !== users[editingUserId].login && users.some(u => u.login === login)) {
            alert('Użytkownik o tym loginie już istnieje!');
            return;
        }
    }
    
    const userData = {
        login: login,
        password: password,
        name: name,
        role: role
    };
    
    if (editingUserId !== null) {
        // Edytuj istniejącego użytkownika
        users[editingUserId] = userData;
        console.log('User updated:', userData);
    } else {
        // Dodaj nowego użytkownika
        users.push(userData);
        console.log('User added:', userData);
    }
    
    saveUsersToStorage();
    renderUsersTable();
    
    // Zamknij modal i zresetuj formularz
    document.getElementById('userFormModal').classList.add('hidden');
    resetUserForm();
    
    alert('Użytkownik został zapisany pomyślnie!');
}

// Zresetuj formularz użytkownika
function resetUserForm() {
    const form = document.getElementById('userForm');
    if (form) {
        form.reset();
    }
    const strength = document.getElementById('passwordStrength');
    if (strength) {
        strength.textContent = '-';
    }
    editingUserId = null;
    console.log('Form reset');
}

// Edytuj użytkownika
function editUser(index) {
    console.log('Editing user with index:', index, users[index]);
    if (index >= 0 && index < users.length) {
        showUserForm(users[index], index);
    } else {
        console.error('Invalid user index:', index);
    }
}

// Zmień hasło użytkownika
function changeUserPassword(index) {
    if (index >= 0 && index < users.length) {
        const user = users[index];
        const newPassword = prompt('Wprowadź nowe hasło dla użytkownika ' + user.name + ':');
        
        if (newPassword) {
            if (newPassword.length >= 8) {
                users[index].password = newPassword;
                saveUsersToStorage();
                renderUsersTable();
                alert('Hasło zostało zmienione pomyślnie!');
            } else {
                alert('Hasło musi mieć minimum 8 znaków!');
            }
        }
    }
}

// Usuń użytkownika
function deleteUser(index) {
    if (index >= 0 && index < users.length) {
        const user = users[index];
        
        // Sprawdź czy nie próbujemy usunąć administratora
        if (user.login === 'admin') {
            alert('Nie można usunąć głównego administratora!');
            return;
        }
        
        if (confirm('Czy na pewno chcesz usunąć użytkownika ' + user.name + '?')) {
            users.splice(index, 1);
            saveUsersToStorage();
            renderUsersTable();
            alert('Użytkownik został usunięty!');
        }
    }
}

// Eksportuj listę użytkowników
function exportUsers() {
    // Przygotuj dane do eksportu (bez haseł)
    const exportData = users.map(user => ({
        login: user.login,
        name: user.name,
        role: user.role,
        password: '[UKRYTE]'
    }));
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'uzytkownicy_system_rezerwacji.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    console.log('Users exported');
}

// Sprawdź siłę hasła
function checkPasswordStrength(password) {
    const strengthElement = document.getElementById('passwordStrength');
    if (!strengthElement) return;
    
    let strength = 0;
    
    // Długość
    if (password.length >= 8) {
        strength += 1;
    }
    
    // Wielkie litery
    if (/[A-Z]/.test(password)) {
        strength += 1;
    }
    
    // Małe litery
    if (/[a-z]/.test(password)) {
        strength += 1;
    }
    
    // Cyfry
    if (/[0-9]/.test(password)) {
        strength += 1;
    }
    
    // Znaki specjalne
    if (/[^A-Za-z0-9]/.test(password)) {
        strength += 1;
    }
    
    // Określ siłę hasła
    let strengthText = '';
    let strengthColor = '';
    
    switch(strength) {
        case 0:
        case 1:
            strengthText = 'Bardzo słabe';
            strengthColor = '#e74c3c';
            break;
        case 2:
            strengthText = 'Słabe';
            strengthColor = '#e67e22';
            break;
        case 3:
            strengthText = 'Średnie';
            strengthColor = '#f1c40f';
            break;
        case 4:
            strengthText = 'Silne';
            strengthColor = '#2ecc71';
            break;
        case 5:
            strengthText = 'Bardzo silne';
            strengthColor = '#27ae60';
            break;
    }
    
    strengthElement.textContent = strengthText;
    strengthElement.style.color = strengthColor;
}