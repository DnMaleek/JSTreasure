async function fetchData() {

        const tableData = document.getElementById('tableData')

        const responce=await fetch('/view_clients_data');
        const data = await responce.json();
        console.log(data)

        tableData.innerHTML = ""; // Clear table first

        data.forEach((d, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${d.Name}</td>
                <td>${d.Email}</td>
                <td>${d.Tel}</td>
                <td style="display: flex; justify-content: center; gap: 5px; ">
                    <a href='/view_client/${d.Id}'>
                        <button style="background-color: rgb(114, 173, 198);">View</button>
                    </a>
                        <button class="deleteBtn" onclick="deleteClient(${d.Id})" style="background: #ff3232;">Delete</button>
                </td>
            `;
            tableData.appendChild(tr);
        });
    }

    fetchData();

    async function deleteClient(clientId) {
        const res = await fetch(`/delete/${clientId}`, {
            method: "DELETE"
        });

        if (res.ok) {
            const data = await res.json();
            console.log(data.message);
            fetchData()
        } else {
            console.error("Failed to delete client");
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        fetchData();
    });
