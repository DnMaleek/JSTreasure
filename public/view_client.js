const clientId = window.location.pathname.split('/').pop();
console.log(clientId);

// ── DOM refs ──
const msg       = document.getElementById('msg');
const statusBox = document.getElementById('statusBox');

// ══════════════════════════════════════════
//  LOAD CLIENT INFO
// ══════════════════════════════════════════
async function loadClient() {
    const nameEdt  = document.getElementById('nameEdt');
    const emailEdt = document.getElementById('emailEdt');
    const phoneEdt = document.getElementById('phoneEdt');

    const responce = await fetch(`/view_client/${clientId}`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
    });

    const client = await responce.json();

    // Desktop
    document.getElementById('clientName').innerHTML =
        client.Name + ' <span onclick="editClient()"><i class="fa-solid fa-user-pen"></i></span>';
    document.getElementById('clientName1').innerHTML = client.Name;
    document.getElementById('clientName2').innerText = client.Name;

    // Mobile topbar name
    const mobileNameEl = document.getElementById('clientNameMobile');
    if (mobileNameEl) mobileNameEl.innerText = client.Name;

    nameEdt.value  = client.Name;
    emailEdt.value = client.Email;
    phoneEdt.value = client.Tel;
}

loadClient();

// ══════════════════════════════════════════
//  EDIT CLIENT
// ══════════════════════════════════════════
document.getElementById('editUser').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameEdt  = document.getElementById('nameEdt').value.trim();
    const emailEdt = document.getElementById('emailEdt').value.trim();
    const phoneEdt = document.getElementById('phoneEdt').value.trim();

    const res = await fetch(`/view_client/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Name: nameEdt, Email: emailEdt, Tel: phoneEdt })
    });

    if (res.ok) {
        const data = await res.json();
        await loadClient();
        msg.innerText = data.message;
        statusBox.style.display = "block";
        statusBox.className = "status success";
        setTimeout(() => statusBox.style.display = "none", 3000);
        document.getElementById('editPop').style.display = 'none';
    } else {
        const data = await res.json();
        msg.innerText = data.message;
        statusBox.style.display = "block";
        statusBox.className = "status error";
    }
});

// ══════════════════════════════════════════
//  ADD TRANSACTION POPUP
// ══════════════════════════════════════════
const popBtn    = document.getElementById('openPopUp');
const popBg     = document.getElementById('popbg');
const cancelBtn = document.getElementById('cancelBtn');

popBtn.addEventListener('click', () => { popBg.style.display = 'flex'; });
cancelBtn.addEventListener('click', () => { popBg.style.display = 'none'; });

// ── SUBMIT TRANSACTION ──
const transForm = document.getElementById('addTransaction');

transForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const type   = document.getElementById('transType').value;
    const amount = Number(document.getElementById('amount').value);
    const desc   = document.getElementById('description').value;

    if (!type || amount <= 0) {
        popBg.style.display = 'none';
        msg.innerText = "Please enter a valid transaction";
        statusBox.className = "status error";
        statusBox.style.display = "block";
        setTimeout(() => statusBox.style.display = "none", 3000);
        return;
    }

    const data = { clientId, type, amount, desc };

    try {
        const response = await fetch('/add_transaction', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const res = await response.json();
            msg.innerText = res.message;
            statusBox.style.display = "block";
            statusBox.className = "status success";
            setTimeout(() => statusBox.style.display = "none", 3000);
            transForm.reset();
            popBg.style.display = 'none';
            await loadTransaction();
            await displayBalance();
        } else {
            popBg.style.display = 'none';
            console.error('Server responded with an error!');
        }
    } catch (error) {
        console.error("Error submitting transaction:", error);
        msg.innerText = "Server error. Try again.";
        statusBox.style.display = "block";
    }
});

// ══════════════════════════════════════════
//  LOAD TRANSACTIONS  (desktop + mobile)
// ══════════════════════════════════════════
let limit       = 10;
let currentPage = 1;

document.getElementById("maxEntries").addEventListener("change", (e) => {
    limit = parseInt(e.target.value);
    currentPage = 1;
    loadTransaction(currentPage);
});

const loadTransaction = async (page = 1) => {
    currentPage = page;

    try {
        const res = await fetch("/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clientId, page: currentPage, limit })
        });

        const result     = await res.json();
        const transactions = result.data;
        const tableData  = document.getElementById('data');
        tableData.innerHTML = "";

        if (transactions.length === 0) {

            // ── Desktop empty state ──
            tableData.innerHTML = `
                <tr style="height:calc(100vh - 300px)">
                    <td colspan="7" style="text-align:center;color:#888;font-size:18px;padding:20px;">
                        <i class="fa-solid fa-ban" style="font-size:100px;margin-bottom:20px;"></i><br>
                        No Transaction(s) Found
                    </td>
                </tr>`;

            // ── Mobile empty state ──
            renderMobileTxCards([]);

        } else {

            // ── Desktop rows ──
            transactions.forEach((trans, index) => {
                const trElement = document.createElement('tr');
                const dateObj   = new Date(trans.date);
                const date      = dateObj.toLocaleDateString();
                const time      = dateObj.toLocaleTimeString();

                trElement.innerHTML = `
                    <td>${(currentPage - 1) * limit + index + 1}</td>
                    <td>${date}</td>
                    <td>${time}</td>
                    <td>${trans.income}</td>
                    <td style="color:red">${trans.outtake}</td>
                    <td>${trans.description}</td>
                    <td id="tbNotPrinted">
                        <span
                            style="background:rgba(200,50,50);color:white;cursor:pointer;padding:6px;border-radius:8px;"
                            onclick="openDeletePopup(${trans.id})">
                            Delete
                        </span>
                    </td>`;
                tableData.appendChild(trElement);
            });

            // ── Mobile cards ──
            renderMobileTxCards(transactions);
        }

        updatePagination(result.totalPages);

    } catch (error) {
        console.error("Error has occurred:", error);
    }
};

loadTransaction();

// ══════════════════════════════════════════
//  RENDER MOBILE TX CARDS
// ══════════════════════════════════════════
function renderMobileTxCards(transactions) {
    const cardList = document.getElementById('txCardList');
    if (!cardList) return;
    cardList.innerHTML = '';

    if (transactions.length === 0) {
        cardList.innerHTML = `
            <div style="text-align:center;padding:60px 20px;color:#888;">
                <i class="fa-solid fa-receipt" style="font-size:60px;margin-bottom:16px;display:block;color:#cbd5e1;"></i>
                <p style="font-size:15px;font-weight:600;">No transactions yet</p>
                <p style="font-size:13px;margin-top:6px;color:#94a3b8;">Tap "Add Transaction" to get started</p>
            </div>`;
        return;
    }

    transactions.forEach((trans) => {
        const dateObj = new Date(trans.date);
        const date    = dateObj.toLocaleDateString();
        const time    = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const isIn    = trans.income && trans.income !== '0' && trans.income !== 0;
        const amount  = isIn ? trans.income : trans.outtake;

        // Format amount nicely if it's a plain number
        const formattedAmt = formatTZS(amount);

        const card = document.createElement('div');
        card.className = 'tx-card';
        card.innerHTML = `
            <div class="tx-type-badge ${isIn ? 'in' : 'out'}">
                <i class="fa-solid ${isIn ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
            </div>
            <div class="tx-body">
                <div class="tx-amount ${isIn ? 'in-color' : 'out-color'}">${formattedAmt}</div>
                <div class="tx-desc">${trans.description || 'No description'}</div>
                <div class="tx-date">${date} &bull; ${time}</div>
            </div>
            <button class="tx-del" title="Delete transaction" onclick="openDeletePopup(${trans.id})">
                <i class="fa-solid fa-trash"></i>
            </button>`;
        cardList.appendChild(card);
    });
}

// Simple TZS formatter
function formatTZS(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS' }).format(num);
}

// ══════════════════════════════════════════
//  PAGINATION
// ══════════════════════════════════════════
let totalPages = 1;

const updatePagination = (pages) => {
    totalPages = pages;
    // Desktop
    document.getElementById("pageInfo").innerText = `Page ${currentPage} of ${totalPages}`;
    // Mobile
    const mob = document.getElementById('pageInfoMobile');
    if (mob) mob.innerText = `${currentPage} / ${totalPages}`;
};

const nextPage = () => {
    if (currentPage < totalPages) loadTransaction(currentPage + 1);
};

const prevPage = () => {
    if (currentPage > 1) loadTransaction(currentPage - 1);
};

// ══════════════════════════════════════════
//  DISPLAY BALANCE
// ══════════════════════════════════════════
const displayBalance = async () => {
    const balance  = document.getElementById("balance");
    const balance1 = document.getElementById("balance1");

    try {
        const res  = await fetch(`/balance/${clientId}`);
        const data = await res.json();

        const formatted = new Intl.NumberFormat('en-TZ', {
            style: 'currency', currency: 'TZS'
        }).format(data.balance);

        balance.innerText  = formatted;
        balance1.innerText = formatted;

        const color = data.balance < 0 ? 'red' : (Number(data.balance) === 0 ? 'blue' : 'green');
        balance.style.color = color;

        // ── Sync to mobile balance badge ──
        const mobileBal = document.getElementById('balanceMobile');
        if (mobileBal) {
            mobileBal.innerText = formatted;
            mobileBal.style.color = color === 'green' ? '#4ade80'
                                  : color === 'red'   ? '#fca5a5'
                                  : '#93c5fd';
        }

    } catch (error) {
        console.log(error);
    }
};

displayBalance();

// ══════════════════════════════════════════
//  DELETE TRANSACTION
// ══════════════════════════════════════════
const deleteTransaction = async (trans_id) => {
    try {
        const res  = await fetch(`/transaction/delete/${trans_id}`, { method: 'DELETE' });
        const data = await res.json();

        msg.innerText = data.message;
        statusBox.style.display = "block";
        statusBox.className = "status success";
        setTimeout(() => statusBox.style.display = "none", 3000);

        await loadTransaction();
        await displayBalance();

        if (!res.ok) console.error(data);
    } catch (error) {
        console.error(error);
        msg.innerText = "Something went wrong";
        statusBox.style.display = "block";
    }
};

// Delete popup
let deleteId = null;

const openDeletePopup = (trans_id) => {
    deleteId = trans_id;
    document.getElementById('deletePop').style.display = 'flex';

    document.getElementById('cancelBtn3').onclick = () => {
        document.getElementById('deletePop').style.display = 'none';
        deleteId = null;
    };

    document.getElementById('deleteConfirm').onclick = async () => {
        if (deleteId !== null) {
            await deleteTransaction(deleteId);
            document.getElementById('deletePop').style.display = 'none';
            deleteId = null;
        }
    };
};

// ══════════════════════════════════════════
//  EDIT CLIENT POPUP
// ══════════════════════════════════════════
const editClient = () => {
    document.getElementById('editPop').style.display = 'flex';
    document.getElementById('cancelBtn2').addEventListener('click', () => {
        document.getElementById('editPop').style.display = 'none';
    });
};

// ══════════════════════════════════════════
//  PRINT
// ══════════════════════════════════════════
const printTrans = () => {
    const pd = document.getElementById("printDetails");
    pd.style.display      = 'flex';
    pd.style.justifyContent = 'between';
    pd.style.alignContent   = 'center';
    window.print();
    pd.style.display = 'none';
};