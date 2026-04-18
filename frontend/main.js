let reagentIdInEdit = null;
const api = "http://127.0.0.1:8000/reagents";
let authMode = "login";
let authModalInstance = null;

// ---------- AUTH UI ----------
function syncAuthUI() {
    const token = localStorage.getItem("token");

    const logoutBtn = document.getElementById("logoutBtnModal");

    if (logoutBtn) {
        logoutBtn.style.display = token ? "block" : "none";
    }
}

function requireAuth() {
    const token = localStorage.getItem("token");

    const modalEl = document.getElementById("authModal");
    authModalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);

    if (!token) {
        authModalInstance.show();
    } else {
        authModalInstance.hide();
    }
}

// ---------- TOGGLE ----------
function toggleAuthMode(e) {
    e.preventDefault();

    authMode = authMode === "login" ? "signup" : "login";

    document.getElementById("authTitle").innerText =
        authMode === "login" ? "Login" : "Sign Up";

    document.getElementById("authSubmitBtn").innerText =
        authMode === "login" ? "Login" : "Create Account";

    document.getElementById("authToggleText").innerHTML =
        authMode === "login"
            ? `Need an account? <a href="#" id="authToggleLink">Sign up</a>`
            : `Already have an account? <a href="#" id="authToggleLink">Login</a>`;

    attachToggleListener();
}

function attachToggleListener() {
    document
        .getElementById("authToggleLink")
        .addEventListener("click", toggleAuthMode);
}

// ---------- LOGIN ----------
async function login(email, password) {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const res = await fetch("http://127.0.0.1:8000/users/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData
    });
    if (!res.ok) {
        const text = await res.text();

        let message = "Login failed";

        try {
            const json = JSON.parse(text);
            message = json.detail || message;
        } catch {
            message = text;
        }

        alert(message);
        return;
    }

    const data = await res.json();

    localStorage.setItem("token", data.access_token);
    localStorage.setItem("email", data.email);

    syncAuthUI();
    requireAuth();
    authModalInstance.hide();

    getAllReagents();
}

// ---------- SIGNUP ----------
async function signup(email, password) {
    const res = await fetch("http://127.0.0.1:8000/users/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
        if (res.status === 409) {
            alert("User already exists. Try logging in.");
        } else {
            alert("Signup failed");
        }
        return;
    }

    alert("Account created!");
    syncAuthUI();
    authMode = "login";
    toggleAuthMode(new Event("click"));
}

// ---------- LOGOUT ----------
function logout() {
    localStorage.clear();
    document.getElementById("reagents").innerHTML = "";

    const email = document.getElementById("authEmail");
    const password = document.getElementById("authPassword");

    if (email) email.value = "";
    if (password) password.value = "";

    syncAuthUI();
    requireAuth();
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {

    attachToggleListener();

    if (localStorage.getItem("token")) {
        getAllReagents();
    }

    document.getElementById("authSubmitBtn").addEventListener("click", () => {
        const email = document.getElementById("authEmail").value;
        const password = document.getElementById("authPassword").value;

        if (authMode === "login") {
            login(email, password);
        } else {
            signup(email, password);
        }
    });

    document.getElementById("logoutBtnModal").addEventListener("click", logout);
});
// ---------- GET ALL ----------
async function getAllReagents() {
    const token = localStorage.getItem("token");

    const res = await fetch(api + "/", {
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    if (!res.ok) {
        document.getElementById("reagents").innerHTML = "";
        return;
    }

    const data = await res.json();
    renderReagents(data);
}

// ---------- ADD ----------
async function addReagent() {
    const payload = {
        title: document.getElementById("title").value,
        desc: document.getElementById("desc").value,
        open_date: document.getElementById("open_date").value,
        freezer: document.getElementById("freezer").value,
        protocol: document.getElementById("protocol").value
    };

    const res = await fetch(api + "/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        getAllReagents();
        document.getElementById("close-add-modal").click();
    }
}

// ---------- EDIT LOAD ----------
async function setReagentInEdit(id) {
    reagentIdInEdit = id;

    const res = await fetch(`${api}/${id}`, {
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    });

    if (!res.ok) return;

    const reagent = await res.json();

    document.getElementById('titleEdit').value = reagent.title;
    document.getElementById('descEdit').value = reagent.desc;
    document.getElementById('open_dateEdit').value = reagent.open_date;
    document.getElementById('freezerEdit').value = reagent.freezer;
    document.getElementById('protocolEdit').value = reagent.protocol;
}

// ---------- UPDATE ----------
async function updateReagent() {
    const payload = {
        title: document.getElementById("titleEdit").value,
        desc: document.getElementById("descEdit").value,
        open_date: document.getElementById("open_dateEdit").value,
        freezer: document.getElementById("freezerEdit").value,
        protocol: document.getElementById("protocolEdit").value
    };

    const res = await fetch(`${api}/${reagentIdInEdit}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        getAllReagents();
        document.getElementById("close-edit-modal").click();
    }
}

// ---------- DELETE ----------
async function deleteReagent(id) {
    const res = await fetch(`${api}/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    });

    if (res.ok) {
        getAllReagents();
    }
}

// ---------- RENDER ----------
function renderReagents(data) {
    const div = document.getElementById("reagents");
    div.innerHTML = "";

    data.sort((a, b) => new Date(b.open_date) - new Date(a.open_date))
        .forEach(x => {
            div.innerHTML += `
                <div class="reagent-box" id="reagent-${x._id}">
                    <div class="fw-bold fs-4">${x.title}</div>
                    <div class="text-secondary ps-3"><strong>Date:</strong> ${x.open_date}</div>
                    <div class="text-secondary ps-3"><strong>Freezer:</strong> ${x.freezer}°C</div>
                    <div class="text-secondary ps-3"><strong>Protocol:</strong> ${x.protocol}</div>
                    <div class="text-secondary ps-3"><strong>Notes:</strong> ${x.desc}</div>

                    <button class="btn btn-success btn-sm" onclick="setReagentInEdit('${x._id}')" data-bs-toggle="modal" data-bs-target="#modal-edit">
                        Edit
                    </button>

                    <button class="btn btn-danger btn-sm" onclick="deleteReagent('${x._id}')">
                        Delete
                    </button>
                </div>
            `;
        });
}

// ---------- EVENTS ----------

(() => {

    const token = localStorage.getItem("token");

    if (token) {
        getAllReagents();
    }
})();

document.addEventListener("DOMContentLoaded", () => {

    syncAuthUI();
    attachToggleListener();

    requireAuth();

    if (localStorage.getItem("token")) {
        getAllReagents();
    }


    document.getElementById("authSubmitBtn").addEventListener("click", () => {
        login(
            document.getElementById("authEmail").value,
            document.getElementById("authPassword").value
        );
    });

    document.getElementById("authToggleLink").addEventListener("click", () => {
        signup(
            document.getElementById("authEmail").value,
            document.getElementById("authPassword").value
        );
    });

    document.getElementById("logoutBtnModal").addEventListener("click", () => {
        localStorage.clear();
        document.getElementById("reagents").innerHTML = "";

    });

    document.getElementById("add-btn").addEventListener("click", (e) => {
        e.preventDefault();
        addReagent();
    });

    document.getElementById("edit-btn").addEventListener("click", (e) => {
        e.preventDefault();
        updateReagent();
    });
});

