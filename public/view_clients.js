/* const { json } = require("body-parser");
const { application } = require("express"); */

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

// Delete Popup Functions
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

            // Hide if user clicks anywhere outside the popup
            window.addEventListener('click', (e) => {
                if (e.target === successPop) {
                    successPop.style.display = 'none';
                }
            });

            fetchData(currentPage); // refresh table
        } else {
            console.error("Failed to delete client");
        }
    } catch (err) {
        console.error(err);
    } finally {
        deleteClientId = null;
    }
};

// Attach delete events to dynamically added buttons
function attachDeleteEvents() {
    const buttons = document.querySelectorAll('.deleteBtn');
    buttons.forEach(btn => {
        btn.onclick = () => openDeletePopup(btn.getAttribute('data-id'));
    });
}

// Search Input (Debounce)
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        searchValue = e.target.value.trim();
        currentPage = 1; // reset to first page on search
        fetchData(currentPage);
    }, 400);
});

// Limit / Entries per page
document.getElementById('limit').addEventListener('change', (e) => {
    const newLimit = parseInt(e.target.value);
    if (!newLimit) return;

    const offset = (currentPage - 1) * limit;
    currentPage = Math.floor(offset / newLimit) + 1; // preserve current record position
    limit = newLimit;

    fetchData(currentPage);
});

// Fetch & Render Table
async function fetchData(page = 1) {
    try {
        const res = await fetch(`/view_clients_data?page=${page}&limit=${limit}&search=${encodeURIComponent(searchValue)}`);
        const result = await res.json();
        const data = result.data;
        console.log(data)

        tableData.innerHTML = "";

        if (data.length === 0) {
            tableData.innerHTML = `
                <tr style="height: calc(100vh - 300px)">
                    <td colspan="5" style="
                        text-align: center;
                        color: #888;
                        font-size: 18px;
                        padding:20px;">
                    <i class="fa-solid fa-ban" style="font-size: 100px; margin-bottom: 20px;"></i><br>
                         No Client(s) Entries Found
                    </td>
                </tr>
            `;
        } else {
            data.forEach((d, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${(page - 1) * limit + index + 1}</td>
                    <td>${d.Name}</td>
                    <td>${d.Email}</td>
                    <td>${d.Tel}</td>
                    <td style="display: flex; justify-content: center; gap: 5px;">
                        <a href='/view_client/${d.Id}'>
                            <button style="background-color: rgb(114, 173, 198);">View</button>
                        </a>
                        <button class="deleteBtn" data-id="${d.Id}" style="background: #ff3232;">Delete</button>
                    </td>
                `;
                tableData.appendChild(tr);
            });

            attachDeleteEvents();
        }

        renderPagination(result.totalPages, page);

    } catch (err) {
        console.error("Failed to fetch data:", err);
    }
}


function renderPagination(totalPages, page) {
    pagination.innerHTML = "";

    const visiblePages = 13; // 👈 how many page numbers to show
    const half = Math.floor(visiblePages / 2);

    let start = Math.max(1, page - half);
    let end = start + visiblePages - 1;

    if (end > totalPages) {
        end = totalPages;
        start = Math.max(1, end - visiblePages + 1);
    }

    // Prev button
    if (page > 1) {
        pagination.innerHTML += `<button onclick="goToPage(${page - 1})">Prev</button>`;
    }

    // First page + dots
    if (start > 1) {
        pagination.innerHTML += `<button onclick="goToPage(1)">1</button>`;
        if (start > 2) {
            pagination.innerHTML += `<span class="dots">...</span>`;
        }
    }

    // Main page numbers (1–10, 11–20, etc.)
    for (let i = start; i <= end; i++) {
        pagination.innerHTML += `
            <button
                class="${i === page ? 'active' : ''}"
                onclick="goToPage(${i})"
            >${i}</button>
        `;
    }

    // Last page + dots
    if (end < totalPages) {
        if (end < totalPages - 1) {
            pagination.innerHTML += `<span class="dots">...</span>`;
        }
        pagination.innerHTML += `<button onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }

    // Next button
    if (page < totalPages) {
        pagination.innerHTML += `<button onclick="goToPage(${page + 1})">Next</button>`;
    }
}



// Change page
function goToPage(page) {
    currentPage = page;
    fetchData(page);
}

// Initialize table
document.addEventListener('DOMContentLoaded', () => {
    fetchData(currentPage);
});


//Add client pop page
const addClient =document.getElementById('addClient')
const addClientForm =document.getElementById('addClientForm')
   
    addClient.addEventListener('click',() =>{
        document.getElementById('popbg').style.display='flex';

        document.getElementById('cancelBtn').addEventListener('click',() =>{
            document.getElementById('popbg').style.display='none';
        })
    })

    addClientForm.addEventListener('submit',async (e) => {
        e.preventDefault();

        const Name=document.getElementById('Name').value.trim();
        const Email=document.getElementById('Email').value.trim();
        const Tel=document.getElementById('Tel').value.trim();

        const userData = {Name, Email, Tel };

        const res = await fetch('/add',{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(userData)
        })
        const data = await res.json();

        if(res.ok) {
            msg.innerText = data.message;

            fetchData()

            document.getElementById('popbg').style.display='none';
            successPop.style.display = 'flex';

            addClientForm.reset()

            setTimeout(() => successPop.style.display = 'none', 2000);

        }else {
            document.getElementById('info').innerText=data.message;
            document.getElementById('info').style = `
                font-style: normal;
                color: red;
            `
        }        
    })