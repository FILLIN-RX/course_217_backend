const API_URL = "http://localhost:3000";
const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const hours = [];
for (let i = 8; i <= 19; i++) {
  hours.push(`${i.toString().padStart(2, "0")}:00`);
}

let currentMode = "manuel";
let currentPlageId = null;
let availabilityData = {};
let globalSalles = [];
let currentClasseId = null;
let currentSemestreId = null;
let currentAnneeId = null;

async function init() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    window.location.href = "../login.html";
    return;
  }

  if (role !== "ADMIN") {
    alert("Accès refusé : Vous devez être Administrateur.");
    window.location.href = "../login.html";
    return;
  }

  // Mode Toggle
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentMode = btn.dataset.mode;
      document.querySelectorAll(".mode-btn").forEach((b) => {
        b.classList.remove("bg-primary", "text-white");
        b.classList.add("text-gray-600");
      });
      btn.classList.add("bg-primary", "text-white");
      btn.classList.remove("text-gray-600");

      if (currentMode === "manuel") {
        document
          .getElementById("mode-manuel-content")
          .classList.remove("hidden");
        document.getElementById("mode-auto-content").classList.add("hidden");
        loadManuelData();
      } else {
        document.getElementById("mode-manuel-content").classList.add("hidden");
        document.getElementById("mode-auto-content").classList.remove("hidden");
        loadAutoClasses();
      }
    });
  });

  // Semestre change
  document.querySelectorAll('input[name="semestre"]').forEach((radio) => {
    radio.addEventListener("click", () => {
      if (currentMode === "manuel") {
        loadManuelData();
      } else if (currentClasseId) {
        loadSchedule();
      }
    });
  });

  // Auto mode buttons
  document
    .getElementById("btn-load-schedule")
    .addEventListener("click", loadSchedule);
  document
    .getElementById("btn-auto-generate")
    .addEventListener("click", autoGenerate);
  document
    .getElementById("btn-publish")
    .addEventListener("click", publishSchedule);

  document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "../login.html";
  });

  // Load initial data
  await loadManuelData();
}

// ============ MODE MANUEL ============
async function loadManuelData() {
  const token = localStorage.getItem("token");
  const currentSemestre = document.querySelector(
    'input[name="semestre"]:checked',
  ).value;

  try {
    const [plagesResp, disposResp, sallesResp] = await Promise.all([
      fetch(`${API_URL}/admin/plages`),
      fetch(
        `${API_URL}/admin/disponibilites-grille?semestre_id=${currentSemestre}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      ),
      fetch(`${API_URL}/admin/salles`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const plages = await plagesResp.json();
    availabilityData = await disposResp.json();
    globalSalles = await sallesResp.json();

    renderManuelGrid(plages);
  } catch (err) {
    console.error("Erreur chargement données:", err);
  }
}

function renderManuelGrid(plages) {
  const grid = document.getElementById("grid-body-manuel");
  grid.innerHTML = "";

  hours.forEach((time) => {
    const nextHour = (parseInt(time) + 1).toString().padStart(2, "0") + ":00";

    const labelDiv = document.createElement("div");
    labelDiv.className =
      "h-20 border-b flex flex-col items-center justify-center bg-gray-50/30 border-r";
    labelDiv.innerHTML = `
            <span class="text-[11px] font-bold text-gray-900">${time}</span>
            <span class="text-[9px] text-gray-400">${nextHour}</span>
        `;
    grid.appendChild(labelDiv);

    days.forEach((day) => {
      const plage = plages.find(
        (p) => p.jour === day && p.heure_debut.startsWith(time),
      );
      const cell = document.createElement("div");

      if (
        plage &&
        availabilityData[plage.id] &&
        availabilityData[plage.id].length > 0
      ) {
        cell.className =
          "h-20 border-b border-l border-border-light p-2 overflow-y-auto custom-scrollbar cell-with-teachers";
        availabilityData[plage.id].forEach((prof) => {
          const badge = document.createElement("div");
          badge.className = "teacher-badge flex flex-col mb-1";
          badge.innerHTML = `
                        <span>${prof.nom}</span>
                        <span class="text-[8px] opacity-80 font-normal">${prof.ues || "Aucune UE"}</span>
                    `;
          cell.appendChild(badge);
        });
        cell.onclick = () => openModal(plage, availabilityData[plage.id]);
      } else {
        cell.className =
          "h-20 border-b border-l border-border-light bg-gray-50/30";
      }

      grid.appendChild(cell);
    });
  });
}

function openModal(plage, profs) {
  currentPlageId = plage.id;
  document.getElementById("modal-assign").classList.remove("hidden");
  document.getElementById("info-plage").innerText =
    `${plage.jour} de ${plage.heure_debut.slice(0, 5)} à ${plage.heure_fin.slice(0, 5)}`;

  const profSelect = document.getElementById("modal-profs");
  const teacherList = document.getElementById("available-teachers");
  const salleSelect = document.getElementById("modal-salles");

  profSelect.innerHTML = '<option value="">Choisir...</option>';
  teacherList.innerHTML = "";

  profs.forEach((p) => {
    profSelect.innerHTML += `<option value="${p.id}">${p.nom}</option>`;
    teacherList.innerHTML += `<span class="teacher-badge">${p.nom}</span>`;
  });

  salleSelect.innerHTML = '<option value="">Choisir une salle...</option>';
  globalSalles.forEach((s) => {
    salleSelect.innerHTML += `<option value="${s.id}">${s.nom} (Cap: ${s.capacite})</option>`;
  });
}

window.closeModal = () =>
  document.getElementById("modal-assign").classList.add("hidden");

document.getElementById("modal-profs").onchange = async (e) => {
  const ueSelect = document.getElementById("modal-ues");
  const classeInput = document.getElementById("modal-classe");

  ueSelect.innerHTML = '<option value="">Choisir l\'UE...</option>';
  ueSelect.disabled = true;
  classeInput.value = "";

  if (!e.target.value) return;

  const token = localStorage.getItem("token");
  const resp = await fetch(
    `${API_URL}/admin/ues-enseignant/${e.target.value}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  const ues = await resp.json();

  if (ues.length === 0) {
    ueSelect.innerHTML += "<option disabled>Aucune UE assignée</option>";
  } else {
    ues.forEach((u) => {
      ueSelect.innerHTML += `<option value="${u.id}" data-classe-id="${u.classe_id}" data-classe-nom="${u.classe_nom}">${u.code} - ${u.intitule} (${u.classe_nom})</option>`;
    });
    ueSelect.disabled = false;
    if (ues.length > 0) {
      ueSelect.selectedIndex = 1;
      ueSelect.dispatchEvent(new Event("change"));
    }
  }
};

document.getElementById("modal-ues").onchange = (e) => {
  const ueSelect = e.target;
  const classeInput = document.getElementById("modal-classe");
  const option = ueSelect.selectedOptions[0];

  if (!option || !option.value) {
    classeInput.value = "";
    return;
  }

  const classeNom = option.dataset.classeNom;
  classeInput.value = classeNom || "Non définie";
};

document.getElementById("form-assign").onsubmit = async (e) => {
  e.preventDefault();
  const ueId = document.getElementById("modal-ues").value;
  const salleId = document.getElementById("modal-salles").value;
  const semestreId = document.querySelector(
    'input[name="semestre"]:checked',
  ).value;

  if (!currentPlageId || !ueId || !salleId) {
    alert(
      "Veuillez remplir tous les champs obligatoires (Enseignant, UE, Salle).",
    );
    return;
  }

  const token = localStorage.getItem("token");
  try {
    const resp = await fetch(`${API_URL}/admin/assigner-cours`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ue_id: ueId,
        salle_id: salleId,
        plage_id: currentPlageId,
        semestre_id: semestreId,
        annee_id: 1,
      }),
    });

    const result = await resp.json();
    if (resp.ok) {
      alert(result.message);
      closeModal();
      loadManuelData();
    } else {
      alert("Erreur: " + result.message);
    }
  } catch (err) {
    console.error("Erreur soumission:", err);
    alert("Erreur serveur lors de l'assignation.");
  }
};

// ============ MODE AUTOMATIQUE ============
async function loadAutoClasses() {
  try {
    const resp = await fetch(`${API_URL}/public/classes`);
    const classes = await resp.json();

    const select = document.getElementById("select-classe");
    select.innerHTML = '<option value="">Choisir une classe...</option>';
    classes.forEach((c) => {
      select.innerHTML += `<option value="${c.id}">${c.nom} (${c.filiere_nom})</option>`;
    });
  } catch (err) {
    console.error("Erreur chargement classes:", err);
  }
}

async function loadSchedule() {
  currentClasseId = document.getElementById("select-classe").value;
  currentSemestreId = document.querySelector(
    'input[name="semestre"]:checked',
  ).value;
  currentAnneeId = document.getElementById("select-annee").value;

  if (!currentClasseId) {
    alert("Veuillez sélectionner une classe");
    return;
  }

  // Clear grid
  days.forEach((day) => {
    const col = document.querySelector(`#schedule-grid [data-day="${day}"]`);
    if (col) col.innerHTML = "";
  });

  try {
    const token = localStorage.getItem("token");
    const resp = await fetch(
      `${API_URL}/public/schedule/${currentClasseId}/${currentSemestreId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const courses = await resp.json();
    console.log("Courses loaded:", courses);

    courses.forEach((course) => {
      renderCourse(course);
    });
  } catch (err) {
    console.error("Erreur chargement emploi du temps:", err);
    alert("Erreur lors du chargement");
  }
}

function renderCourse(course) {
  const col = document.querySelector(
    `#schedule-grid [data-day="${course.jour}"]`,
  );
  if (!col) return;

  const startH = parseInt(course.heure_debut.split(":")[0]);
  const startM = parseInt(course.heure_debut.split(":")[1]);
  const endH = parseInt(course.heure_fin.split(":")[0]);
  const endM = parseInt(course.heure_fin.split(":")[1]);

  const top = (startH - 8) * 60 + (startM / 60) * 60;
  const durationMin = endH * 60 + endM - (startH * 60 + startM);
  const height = (durationMin / 60) * 60;

  const el = document.createElement("div");
  el.className = `absolute left-1 right-1 course-block border-l-4 rounded-lg p-2 overflow-hidden shadow-sm ${course.statut === "BROUILLON" ? "course-brouillon" : "course-valide"}`;
  el.style.top = `${top}px`;
  el.style.height = `${height}px`;
  el.dataset.courseId = course.id;
  el.innerHTML = `
        <p class="text-[10px] font-bold leading-tight ${course.statut === "BROUILLON" ? "text-amber-700" : "text-blue-700"}">${course.ue_code}</p>
        <p class="text-[11px] font-black text-gray-900 truncate" title="${course.ue_intitule}">${course.ue_intitule}</p>
        <div class="mt-1 flex flex-col gap-0.5">
            <span class="flex items-center gap-1 text-[9px] text-gray-600 font-medium">
                <span class="material-symbols-outlined text-[10px]">person</span> ${course.enseignant_nom || "N/A"}
            </span>
            <span class="flex items-center gap-1 text-[9px] text-gray-600 font-medium">
                <span class="material-symbols-outlined text-[10px]">location_on</span> ${course.salle_nom || "N/A"}
            </span>
            <span class="text-[8px] font-bold ${course.statut === "BROUILLON" ? "text-amber-600" : "text-blue-600"}">${course.statut}</span>
        </div>
    `;

  el.addEventListener("click", () => {
    if (
      confirm(`Supprimer ce cours ?\n${course.ue_code} - ${course.ue_intitule}`)
    ) {
      deleteCourse(course.id);
    }
  });

  col.appendChild(el);
}

async function autoGenerate() {
  if (!currentClasseId || !currentSemestreId || !currentAnneeId) {
    alert("Veuillez d'abord charger une classe");
    return;
  }

  if (
    !confirm(
      "Générer automatiquement l'emploi du temps pour cette classe ?\nCela créera des cours en BROUILLON.",
    )
  ) {
    return;
  }

  try {
    const token = localStorage.getItem("token");
    const resp = await fetch(`${API_URL}/admin/generate-schedule`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        classe_id: currentClasseId,
        semestre_id: currentSemestreId,
        annee_id: currentAnneeId,
      }),
    });

    const result = await resp.json();
    alert(
      `Génération terminée!\n${result.message}\n${result.nonAffectees?.length ? "UEs non affectées: " + result.nonAffectees.join(", ") : ""}`,
    );
    loadSchedule();
  } catch (err) {
    console.error("Erreur génération auto:", err);
    alert("Erreur lors de la génération automatique");
  }
}

async function publishSchedule() {
  if (!currentSemestreId || !currentAnneeId) {
    alert("Veuillez d'abord charger une classe");
    return;
  }

  if (
    !confirm(
      "Publier tous les cours en BROUILLON ?\nIls deviendront VALIDÉS et visibles publiquement.",
    )
  ) {
    return;
  }

  try {
    const token = localStorage.getItem("token");
    const resp = await fetch(`${API_URL}/admin/publish-schedule`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        semestre_id: currentSemestreId,
        annee_id: currentAnneeId,
      }),
    });

    const result = await resp.json();
    alert(result.message);
    loadSchedule();
  } catch (err) {
    console.error("Erreur publication:", err);
    alert("Erreur lors de la publication");
  }
}

async function deleteCourse(courseId) {
  try {
    const token = localStorage.getItem("token");
    const resp = await fetch(`${API_URL}/admin/delete-course/${courseId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (resp.ok) {
      loadSchedule();
    } else {
      alert("Erreur lors de la suppression");
    }
  } catch (err) {
    console.error("Erreur suppression:", err);
  }
}

init();
