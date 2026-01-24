const API_URL = 'http://localhost:4000/auth';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const roleSelect = document.getElementById('role-select');
    const teacherField = document.getElementById('teacher-link-field');

    // --- LOGIQUE D'AFFICHAGE DYNAMIQUE (REGISTER) ---
    if (roleSelect && teacherField) {
        // Initial state
        if (roleSelect.value === 'enseignant') {
            teacherField.style.display = 'flex';
        } else {
            teacherField.style.display = 'none';
        }

        roleSelect.addEventListener('change', (e) => {
            if (e.target.value === 'enseignant') {
                teacherField.style.display = 'flex';
            } else {
                teacherField.style.display = 'none';
            }
        });
    }

    // --- TOGGLE VISIBILITÉ MOT DE PASSE ---
    document.querySelectorAll('button[type="button"]').forEach(btn => {
        if (btn.querySelector('.material-symbols-outlined')) {
            btn.addEventListener('click', () => {
                const input = btn.parentElement.querySelector('input');
                if (input.type === 'password') {
                    input.type = 'text';
                    btn.querySelector('.material-symbols-outlined').innerText = 'visibility_off';
                } else {
                    input.type = 'password';
                    btn.querySelector('.material-symbols-outlined').innerText = 'visibility';
                }
            });
        }
    });

    // --- LOGIQUE DE LOGIN ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            await handleAuth('/login', { email, password }, e.target);
        });
    }

    // --- LOGIQUE DE REGISTER ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const payload = {
                nom: document.getElementById('reg-nom').value,
                email: document.getElementById('reg-email').value,
                password: document.getElementById('reg-password').value,
                role: roleSelect.value.toUpperCase()
            };

            await handleAuth('/register', payload, e.target);
        });
    }
});

async function handleAuth(endpoint, payload, formElement) {
    const btn = formElement.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerText = "Chargement...";

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            if (endpoint === '/login') {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Redirection basée sur le rôle
                if (data.user.role === 'ADMIN') {
                    window.location.href = './admindashboard.html';
                } else {
                    window.location.href = './teacher schedule.html';
                }
            } else {
                alert("Compte créé avec succès ! Veuillez vous connecter.");
                // Redirection vers la page de login appropriée ou par défaut
                if (payload.role === 'ADMIN') {
                    window.location.href = './admin login.html';
                } else {
                    window.location.href = './teacher login.html';
                }
            }
        } else {
            alert(data.message || "Une erreur est survenue");
        }
    } catch (error) {
        console.error("Erreur API:", error);
        alert("Impossible de contacter le serveur (Vérifiez qu'il est lancé sur le port 4000)");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function getProfile() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const response = await fetch(`${API_URL}/profile`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            return await response.json();
        } else {
            // Si le token est invalide, on déconnecte
            if (response.status === 401 || response.status === 403) {
                logout();
            }
            return null;
        }
    } catch (error) {
        console.error("Erreur Profil:", error);
        return null;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = './teacher login.html';
}

// Expose functions globally for other scripts
window.getProfile = getProfile;
window.logout = logout;
