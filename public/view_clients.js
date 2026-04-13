// Global State
let currentPage = 1;
let limit = 10;
let searchValue = "";
let searchTimeout = null;
let deleteClientId = null;

// DOM Elements
const tableData = document.getElementById('tableData');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('search');
const successPop = document.getElementById('successPop');
const msg = document.getElementById('msg');

// ── MOBILE HELPER ──
function isMobile() {
    return window.innerWidth <= 768;
}

// ── DELETE POPUP ──
function openDeletePopup(clientId) {
    deleteClientId = clientId;
    document.getElementById('deletePop').style.display = "flex";
}

document.getElementById('cancelBtn3').onclick = () => {
    document.getElementById('deletePop').style.display = 'none';
    deleteClientId = null;
};

document.getElementById('deleteConfirm').onclick = async () => {
    if (!deleteClientId) return;
    try {
        const res = await fetch(`/delete/${deleteClientId}`, { method: "DELETE" });
        if (res.ok) {
            const data = await res.json();
            msg.innerText = data.message;
            document.getElementById('deletePop').style.display = 'none';
            successPop.style.display = 'flex';
            setTimeout(() => successPop.style.display = 'none', 2000);
            window.addEventListener('click', (e) => {
                if (e.target === successPop) successPop.style.display = 'none';
            });
            fetchData(currentPage);
        } else {
            console.error("Failed to delete client");
        }
    } catch (err) {
        console.error(err);
    } finally {
        deleteClientId = null;
    }
};

function attachDeleteEvents() {
    document.querySelectorAll('.deleteBtn').forEach(btn => {
        btn.onclick = () => openDeletePopup(btn.getAttribute('data-id'));
    });
}

// ── SEARCH ──
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        searchValue = e.target.value.trim();
        currentPage = 1;
        fetchData(currentPage);
    }, 400);
});

// ── ENTRIES PER PAGE ──
document.getElementById('limit').addEventListener('change', (e) => {
    const newLimit = parseInt(e.target.value);
    if (!newLimit) return;
    const offset = (currentPage - 1) * limit;
    currentPage = Math.floor(offset / newLimit) + 1;
    limit = newLimit;
    fetchData(currentPage);
});

// ── MAIN FETCH & RENDER ──
async function fetchData(page = 1) {
    try {
        const res = await fetch(`/view_clients_data?page=${page}&limit=${limit}&search=${encodeURIComponent(searchValue)}`);
        const result = await res.json();
        const data = result.data;

        // ── DESKTOP TABLE ──
        tableData.innerHTML = "";

        if (data.length === 0) {
            tableData.innerHTML = `
                <tr style="height:calc(100vh - 300px)">
                    <td colspan="5" style="text-align:center;color:#888;font-size:18px;padding:20px;">
                        <i class="fa-solid fa-ban" style="font-size:100px;margin-bottom:20px;"></i><br>
                        No Client(s) Entries Found
                    </td>
                </tr>`;
        } else {
            data.forEach((d, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${(page - 1) * limit + index + 1}</td>
                    <td>${d.Name}</td>
                    <td>${d.Email}</td>
                    <td>${d.Tel}</td>
                    <td style="display:flex;justify-content:center;gap:5px;">
                        <a href='/view_client/${d.Id}'>
                            <button style="background-color:rgb(114,173,198);">View</button>
                        </a>
                        <button class="deleteBtn" data-id="${d.Id}" style="background:#ff3232;">Delete</button>
                    </td>`;
                tableData.appendChild(tr);
            });
            attachDeleteEvents();
        }

        // ── MOBILE CARDS ──
        renderMobileCards(data, page, result.totalPages);

        // ── PAGINATION ──
        renderPagination(result.totalPages, page);

    } catch (err) {
        console.error("Failed to fetch data:", err);
    }
}

// ── RENDER MOBILE CARDS ──
function renderMobileCards(data, page, totalPages) {
    const cardList = document.getElementById('mobileCardList');
    const mobilePag = document.getElementById('mobilePagination');
    if (!cardList) return;

    cardList.innerHTML = "";

    if (data.length === 0) {
        cardList.innerHTML = `
            <div style="text-align:center;padding:60px 20px;color:#888;">
                <i class="fa-solid fa-ban" style="font-size:60px;margin-bottom:16px;display:block;color:#cbd5e1;"></i>
                <p style="font-size:15px;font-weight:600;">No clients found</p>
                <p style="font-size:13px;margin-top:6px;color:#94a3b8;">Try a different search term</p>
            </div>`;
        if (mobilePag) mobilePag.innerHTML = "";
        return;
    }

    data.forEach((d) => {
        // Get initials from name
        const initials = d.Name
            .split(' ')
            .map(w => w[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

        const card = document.createElement('div');
        card.className = 'client-card';
        card.innerHTML = `
            <div class="client-avatar">${initials}</div>
            <div class="client-info">
                <div class="cname">${d.Name}</div>
                <div class="cphone"><i class="fa-solid fa-phone" style="font-size:10px;margin-right:4px;"></i>${d.Tel}</div>
                <div class="cemail"><i class="fa-solid fa-envelope" style="font-size:10px;margin-right:4px;"></i>${d.Email}</div>
            </div>
            <div class="client-actions">
                <a href="/view_client/${d.Id}" style="text-decoration:none;">
                    <button style="background:linear-gradient(135deg,#1b6ca8,#0f4c75);color:#fff;padding:7px 14px;border-radius:10px;border:none;font-size:11px;font-weight:600;cursor:pointer;width:100%;">
                        <i class="fa-solid fa-eye" style="margin-right:4px;"></i>View
                    </button>
                </a>
                <button 
                    onclick="openDeletePopup('${d.Id}')"
                    style="background:#fff1f1;color:#e74c3c;border:1.5px solid #fca5a5;padding:7px 14px;border-radius:10px;font-size:11px;font-weight:600;cursor:pointer;">
                    <i class="fa-solid fa-trash" style="margin-right:4px;"></i>Delete
                </button>
            </div>`;
        cardList.appendChild(card);
    });

    // Mobile pagination prev/next
    if (mobilePag) {
        mobilePag.innerHTML = "";

        if (page > 1) {
            const prev = document.createElement('button');
            prev.innerHTML = `<i class="fa-solid fa-angle-left"></i> Prev`;
            prev.onclick = () => goToPage(page - 1);
            mobilePag.appendChild(prev);
        }

        const info = document.createElement('span');
        info.innerText = `${page} / ${totalPages || 1}`;
        mobilePag.appendChild(info);

        if (page < totalPages) {
            const next = document.createElement('button');
            next.innerHTML = `Next <i class="fa-solid fa-angle-right"></i>`;
            next.onclick = () => goToPage(page + 1);
            mobilePag.appendChild(next);
        }
    }
}

// ── DESKTOP PAGINATION ──
function renderPagination(totalPages, page) {
    pagination.innerHTML = "";

    const visiblePages = 13;
    const half = Math.floor(visiblePages / 2);
    let start = Math.max(1, page - half);
    let end = start + visiblePages - 1;
    if (end > totalPages) { end = totalPages; start = Math.max(1, end - visiblePages + 1); }

    if (page > 1) pagination.innerHTML += `<button onclick="goToPage(${page - 1})">Prev</button>`;

    if (start > 1) {
        pagination.innerHTML += `<button onclick="goToPage(1)">1</button>`;
        if (start > 2) pagination.innerHTML += `<span class="dots">...</span>`;
    }

    for (let i = start; i <= end; i++) {
        pagination.innerHTML += `<button class="${i === page ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }

    if (end < totalPages) {
        if (end < totalPages - 1) pagination.innerHTML += `<span class="dots">...</span>`;
        pagination.innerHTML += `<button onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }

    if (page < totalPages) pagination.innerHTML += `<button onclick="goToPage(${page + 1})">Next</button>`;
}

function goToPage(page) {
    currentPage = page;
    fetchData(page);
    // scroll to top of list on mobile
    if (isMobile()) window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
    fetchData(currentPage);
});

// ── ADD CLIENT POPUP (desktop heading click) ──
const addClientEl = document.getElementById('addClient');
const addClientForm = document.getElementById('addClientForm');

addClientEl.addEventListener('click', () => {
    document.getElementById('popbg').style.display = 'flex';
    document.getElementById('cancelBtn').addEventListener('click', () => {
        document.getElementById('popbg').style.display = 'none';
    });
});

addClientForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const Name = document.getElementById('Name').value.trim();
    const Email = document.getElementById('Email').value.trim();
    const Tel = document.getElementById('Tel').value.trim();

    const res = await fetch('/add', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Name, Email, Tel })
    });
    const data = await res.json();

    if (res.ok) {
        msg.innerText = data.message;
        fetchData();
        document.getElementById('popbg').style.display = 'none';
        successPop.style.display = 'flex';
        addClientForm.reset();
        setTimeout(() => successPop.style.display = 'none', 2000);
    } else {
        const info = document.getElementById('info');
        info.innerText = data.message;
        info.style.cssText = "font-style:normal;color:red;";
    }
});