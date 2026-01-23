const API_BASE_URL = 'http://localhost:4000/admin';
const TOKEN = localStorage.getItem('token');

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`
};

// --- Generic Fetch ---
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erreur API');
        }
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        alert('Erreur: ' + error.message);
        throw error;
    }
}

// --- Render Functions ---

// 1. Teachers
async function loadTeachers() {
    const container = document.getElementById('teachers-container');
    if (!container) return;

    try {
        const teachers = await apiCall('/enseignants');
        container.innerHTML = '';

        teachers.forEach(teacher => {
            const card = document.createElement('div');
            card.className = "group bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 md:grid md:grid-cols-12 md:gap-4 md:items-center";
            card.innerHTML = `
                <div class="col-span-4 flex items-center gap-4 mb-4 md:mb-0">
                    <div class="relative">
                        <div class="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20">
                            ${teacher.nom.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
                        </div>
                    </div>
                    <div>
                        <h3 class="text-base font-bold text-text-main dark:text-white group-hover:text-primary transition-colors">${teacher.nom}</h3>
                        <p class="text-xs text-text-secondary dark:text-gray-500">${teacher.email || 'Pas d\'email'}</p>
                    </div>
                </div>
                <div class="col-span-3 mb-2 md:mb-0">
                    <span class="text-sm font-medium text-text-main dark:text-gray-300">Enseignant</span>
                </div>
                <div class="col-span-2 mb-4 md:mb-0">
                   <!-- Status placeholder -->
                   <span class="text-xs">Actif</span>
                </div>
                <div class="col-span-3 flex items-center justify-end gap-2">
                    <button onclick="editTeacher(${teacher.id}, '${teacher.nom}', '${teacher.email}')" class="p-1.5 text-gray-400 hover:text-primary transition-colors">
                        <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button onclick="deleteTeacher(${teacher.id})" class="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (e) { console.error(e); }
}

async function createTeacher() {
    const nom = prompt("Nom de l'enseignant:");
    const email = prompt("Email de l'enseignant:");
    if (nom && email) {
        await apiCall('/enseignants', 'POST', { nom, email });
        loadTeachers();
    }
}

async function deleteTeacher(id) {
    if (confirm("Supprimer cet enseignant ?")) {
        await apiCall(`/enseignants/${id}`, 'DELETE');
        loadTeachers();
    }
}

async function editTeacher(id, oldNom, oldEmail) {
    const nom = prompt("Nouveau nom:", oldNom);
    const email = prompt("Nouvel email:", oldEmail);
    if (nom && email) {
        await apiCall(`/enseignants/${id}`, 'PUT', { nom, email });
        loadTeachers();
    }
}


// 2. Rooms (Salles)
async function loadRooms() {
    const container = document.getElementById('rooms-container');
    if (!container) return;

    try {
        const rooms = await apiCall('/salles');
        container.innerHTML = '';

        rooms.forEach(room => {
            const card = document.createElement('div');
            card.className = "group bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between";
            card.innerHTML = `
                <div>
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h3 class="text-text-main dark:text-white text-xl font-bold">${room.nom}</h3>
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="editRoom(${room.id}, '${room.nom}', ${room.capacite})" class="text-gray-400 hover:text-primary"><span class="material-symbols-outlined">edit</span></button>
                            <button onclick="deleteRoom(${room.id})" class="text-gray-400 hover:text-red-500"><span class="material-symbols-outlined">delete</span></button>
                        </div>
                    </div>
                    <div class="my-4 p-3 bg-background-light dark:bg-gray-800 rounded-lg flex items-center justify-between border border-transparent">
                        <div class="flex flex-col">
                            <span class="text-text-muted dark:text-gray-400 text-xs">Capacité</span>
                            <span class="text-text-main dark:text-white text-2xl font-black">${room.capacite}</span>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (e) { console.error(e); }
}

async function createRoom() {
    const nom = prompt("Nom de la salle:");
    const capacite = prompt("Capacité:");
    if (nom && capacite) {
        await apiCall('/salles', 'POST', { nom, capacite: parseInt(capacite) });
        loadRooms();
    }
}

async function deleteRoom(id) {
    if (confirm("Supprimer cette salle ?")) {
        await apiCall(`/salles/${id}`, 'DELETE');
        loadRooms();
    }
}

async function editRoom(id, oldNom, oldCap) {
    const nom = prompt("Nouveau nom:", oldNom);
    const capacite = prompt("Nouvelle capacité:", oldCap);
    if (nom && capacite) {
        await apiCall(`/salles/${id}`, 'PUT', { nom, capacite: parseInt(capacite) });
        loadRooms();
    }
}


// 3. UEs
async function loadUEs() {
    const container = document.querySelector('tbody'); // Assuming single table body
    if (!container || !document.title.includes('Teaching Units')) return;

    try {
        const ues = await apiCall('/ues');
        container.innerHTML = '';

        ues.forEach(ue => {
            const row = document.createElement('tr');
            row.className = "group hover:bg-[#F0F4F4] dark:hover:bg-gray-800/50 transition-colors";
            row.innerHTML = `
                <td class="py-4 px-6 align-top">
                    <span class="font-mono text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded">${ue.code}</span>
                </td>
                <td class="py-4 px-6 align-top">
                    <div class="flex flex-col gap-1">
                        <span class="text-sm font-bold text-text-main dark:text-white font-heading">${ue.intitule}</span>
                    </div>
                </td>
                <td class="py-4 px-6 align-top">
                    <!-- Placeholder for teacher name if not joined -->
                    <span class="text-sm font-medium text-text-main dark:text-gray-200">ID: ${ue.enseignant_id}</span>
                </td>
                <td class="py-4 px-6 align-top">
                     <!-- Placeholder for Class/Filiere if not joined -->
                    <span class="text-sm font-medium text-text-main dark:text-gray-200">Class ID: ${ue.classe_id}</span>
                </td>
                 <td class="py-4 px-6 align-top text-right">
                    <div class="flex items-center justify-end gap-1">
                        <button onclick="editUE(${ue.id}, '${ue.code}', '${ue.intitule}', ${ue.classe_id}, ${ue.enseignant_id})" class="p-1.5 text-text-muted hover:text-primary transition-colors" title="Edit">
                            <span class="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onclick="deleteUE(${ue.id})" class="p-1.5 text-text-muted hover:text-red-500 transition-colors" title="Delete">
                            <span class="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                    </div>
                </td>
            `;
            container.appendChild(row);
        });
    } catch (e) { console.error(e); }
}

async function createUE() {
    const code = prompt("Code UE:");
    const intitule = prompt("Intitulé:");
    const classe_id = prompt("ID Classe:");
    const enseignant_id = prompt("ID Enseignant:");
    
    if (code && intitule && classe_id && enseignant_id) {
        await apiCall('/ues', 'POST', { code, intitule, classe_id, enseignant_id });
        loadUEs();
    }
}

async function deleteUE(id) {
    if (confirm("Supprimer cette UE ?")) {
        await apiCall(`/ues/${id}`, 'DELETE');
        loadUEs();
    }
}

async function editUE(id, oldCode, oldIntitule, oldClasse, oldEns) {
    const code = prompt("Code UE:", oldCode);
    const intitule = prompt("Intitulé:", oldIntitule);
    const classe_id = prompt("ID Classe:", oldClasse);
    const enseignant_id = prompt("ID Enseignant:", oldEns);

    if (code && intitule) {
        await apiCall(`/ues/${id}`, 'PUT', { code, intitule, classe_id, enseignant_id });
        loadUEs();
    }
}


// 4. Tracks/Filieres
async function loadFilieres() {
    const container = document.getElementById('tracks-container');
    if (!container) return;

    try {
        const filieres = await apiCall('/filieres');
        container.innerHTML = '';

        filieres.forEach(filiere => {
            const card = document.createElement('div');
            card.className = "bg-white dark:bg-card-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col gap-2";
            card.innerHTML = `
                <h3 class="font-bold text-lg dark:text-white">${filiere.filiere_nom}</h3>
                <p class="text-sm text-gray-500">${filiere.departement_nom || 'Département inconnu'}</p>
                 <div class="flex items-center gap-2 mt-2">
                    <button onclick="editFiliere(${filiere.id}, '${filiere.filiere_nom}', ${filiere.departement_id})" class="text-sm text-primary hover:underline">Modifier</button>
                    <button onclick="deleteFiliere(${filiere.id})" class="text-sm text-red-500 hover:underline">Supprimer</button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (e) { console.error(e); }
}

async function createFiliere() {
    const nom = prompt("Nom de la filière:");
    const departement_id = prompt("ID Département:");
    if (nom && departement_id) {
        await apiCall('/filieres', 'POST', { nom, departement_id });
        loadFilieres();
    }
}

async function deleteFiliere(id) {
    if (confirm("Supprimer cette filière ?")) {
        await apiCall(`/filieres/${id}`, 'DELETE');
        loadFilieres();
    }
}

async function editFiliere(id, oldNom, oldDep) {
    const nom = prompt("Nom:", oldNom);
    const departement_id = prompt("ID Département:", oldDep);
    if (nom && departement_id) {
        await apiCall(`/filieres/${id}`, 'PUT', { nom, departement_id });
        loadFilieres();
    }
}


// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    // Check which page we are on
    if (document.title.includes('Teacher Directory')) {
        loadTeachers();
        const addBtn = document.getElementById('btn-add-teacher');
        if (addBtn) addBtn.onclick = createTeacher;
    } else if (document.title.includes('Room Management')) {
        loadRooms();
        const addBtn = document.getElementById('btn-add-room');
        if (addBtn) addBtn.onclick = createRoom;
    } else if (document.title.includes('Teaching Units')) {
        loadUEs();
         const addBtn = document.getElementById('btn-add-ue');
        if (addBtn) addBtn.onclick = createUE;
    } else if (document.title.includes('Academic Tracks')) {
        loadFilieres();
         const addBtn = document.getElementById('btn-add-track');
        if (addBtn) addBtn.onclick = createFiliere;
    }
});

// Expose functions to window
window.editTeacher = editTeacher;
window.deleteTeacher = deleteTeacher;
window.editRoom = editRoom;
window.deleteRoom = deleteRoom;
window.editUE = editUE;
window.deleteUE = deleteUE;
window.editFiliere = editFiliere;
window.deleteFiliere = deleteFiliere;
