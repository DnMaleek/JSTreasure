document.addEventListener("DOMContentLoaded", () => {
        const clientId = window.location.pathname.split('/').pop();
            
            async function loadClient() {

                const nameEdt=document.getElementById('nameEdt')
                const emailEdt=document.getElementById('emailEdt')
                const phoneEdt=document.getElementById('phoneEdt')

                const responce = await fetch(`/view_client/${clientId}` , {
                    method:"POST" ,
                    headers: {'Content-Type': 'application/json'} ,
                });
                
                const client = await responce.json();

                document.getElementById('clientName').innerHTML=client.Name + ' <span onclick="editClient()"><i class="fa-solid fa-user-pen"></i></span>';
                document.getElementById('clientName1').innerHTML = client.Name;
                document.getElementById('clientName2').innerText = client.Name;

                nameEdt.value=client.Name;
                emailEdt.value=client.Email;
                phoneEdt.value=client.Tel;
            }
    
            loadClient();
         
            document.getElementById('editUser').addEventListener('submit', async(e)=>{
                    e.preventDefault();

                const nameEdt=document.getElementById('nameEdt').value.trim();
                const emailEdt=document.getElementById('emailEdt').value.trim();
                const phoneEdt=document.getElementById('phoneEdt').value.trim();

                const res= await fetch(`/view_client/${clientId}`,{
                    method:"PUT" ,
                    headers:{
                    "Content-Type":"application/json"
                } ,

                    body:JSON.stringify({
                    Name:nameEdt,
                    Email:emailEdt,
                    Tel:phoneEdt,
                    })
                })

                if(res.ok) {
                    const data = await res.json();
                    await loadClient();
                    msg.innerText = data.message;

                    statusBox.style.display = "block";
                    statusBox.className = "status success"
                    setTimeout(() => {
                        statusBox.style.display = "none";
                    }, 3000);
                    document.getElementById('editPop').style.display='none';
                }else {
                    msg.innerText = data.message;
                    statusBox.style.display = "block";
                    statusBox.className = "status error"
                }
                }) 
            
            const popBtn =document.getElementById('openPopUp');
            const popBg =document.getElementById('popbg');
            const cancelBtn =document.getElementById('cancelBtn');


            popBtn.addEventListener('click', ()=>{
                popBg.style.display='flex'
            })
            
            cancelBtn.addEventListener('click',()=>{
                popBg.style.display='none'
            })

            // Submitting Transactions
        const transForm = document.getElementById('addTransaction');

        transForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Collect values
            const type = document.getElementById('transType').value;
            const amount = Number(document.getElementById('amount').value);
            const desc = document.getElementById('description').value;
            const msg = document.getElementById('msg');
            const statusBox = document.getElementById('statusBox');

             // 🛑 Validation
            if (!type || amount <= 0) {
                popBg.style.display = 'none';
                msg.innerText = "Please enter a valid transaction";
                statusBox.className = "status error";
                statusBox.style.display = "block";

                setTimeout(() => {
                    statusBox.style.display = "none";
                }, 3000);
                return;
            }
            // Creating data object
            const data = {
                clientId, // This already exists (---Global Variable---)
                type,
                amount,
                desc
            };

            try {
                // Sending Data
                const response = await fetch('/add_transaction', {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    const res = await response.json();

                    msg.innerText = res.message;

                    statusBox.style.display = "block";
                    statusBox.className = "status success"

                    setTimeout(() => {
                        statusBox.style.display = "none";
                    }, 3000);

                    transForm.reset();
                    popBg.style.display = 'none';

                    await loadTransaction();
                    await displayBalance();
                } else {
                    popBg.style.display = 'none';
                    statusBox.className = "status success"
                    console.error('Server responded with an error!');
                }
            } catch (error) {
                console.error("Error submitting transaction:", error);
                msg.innerText = "Server error. Try again.";
                msg.style.display = "block";
            }
        });
  
        //LOAD TRANSACTIONS

      let limit = 10;
      let currentPage = 1;
      
           document.getElementById("maxEntries").addEventListener("change", (e) => {
                limit = parseInt(e.target.value);
                currentPage = 1; // reset to first page
                loadTransaction(currentPage);
           });


            const loadTransaction = async (page = 1) => {
                currentPage = page;

                try {
                    const res = await fetch("/transactions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            clientId,
                            page: currentPage,
                            limit
                        })
                    });

                    const result = await res.json();

                    const transactions = result.data; // 👈 IMPORTANT
                    const tableData = document.getElementById('data');
                    tableData.innerHTML = "";

                    transactions.forEach((trans, index) => {
                        const trElement = document.createElement('tr');

                        const dateObj = new Date(trans.date);
                        const date = dateObj.toLocaleDateString();
                        const time = dateObj.toLocaleTimeString();

                        trElement.innerHTML = `
                            <td>${(currentPage - 1) * limit + index + 1}</td>
                            <td>${date}</td>
                            <td>${time}</td>
                            <td>${trans.in}</td>
                            <td style="color: red">${trans.out}</td>
                            <td>${trans.description}</td>
                            <td id="tbNotPrinted">
                                <span style="background: rgba(200,50,50); color:white; cursor:pointer; padding:6px; border-radius:8px;"
                                    onclick="deleteTransaction(${trans.id})">
                                    Delete
                                </span>
                            </td>
                        `;
                        tableData.appendChild(trElement);
                    });

                    updatePagination(result.totalPages);

                } catch (error) {
                    console.error("Error has occurred:", error);
                }
            };


        loadTransaction();

        //javascript logic for pagination
        let totalPages = 1;

        const updatePagination = (pages) => {
            totalPages = pages;
            document.getElementById("pageInfo").innerText =
                `Page ${currentPage} of ${totalPages}`;
        };

        const nextPage = () => {
            if (currentPage < totalPages) {
                loadTransaction(currentPage + 1);
            }
        };

        const prevPage = () => {
            if (currentPage > 1) {
                loadTransaction(currentPage - 1);
            }
        };


        const displayBalance = async () => {
            const balance = document.getElementById("balance");
            const balance1 = document.getElementById("balance1");
            const res = await fetch(`/balance/${clientId}`);

            try {
                const data = await res.json()
                balance.innerText = new Intl.NumberFormat('en-TZ', {
                    style: 'currency',
                    currency: 'TZS'
                }).format(data.balance);
                
                balance1.innerText = new Intl.NumberFormat('en-TZ', {
                    style: 'currency',
                    currency: 'TZS'
                }).format(data.balance);

               if (data.balance < 0) {
                    balance.style.color = 'red';
                } else if (Number(data.balance) === 0) {
                    balance.style.color = 'blue';
                } else {
                    balance.style.color = 'green';
                }
            }catch(error) {
                console.log(error)
            }
        }

        const deleteTransaction = async (trans_id) => {
                try {
                    const res = await fetch(`/transaction/delete/${trans_id}`, {
                        method: 'DELETE'
                    });

                    const data = await res.json();

                    msg.innerText = data.message;

                    statusBox.style.display = "block";
                    setTimeout(() => {
                        statusBox.style.display = "none";
                    }, 3000);

                    await loadTransaction();
                    await displayBalance();

                    if (!res.ok) {
                        console.error(data);
                    }

                } catch (error) {
                    console.error(error);
                    msg.innerText = "Something went wrong";
                    statusBox.style.display = "block";
                }
            };

        displayBalance();


//Edit client
const editClient = () =>{
    document.getElementById('editPop').style.display='flex';

    document.getElementById('cancelBtn2').addEventListener('click',()=>{
             document.getElementById('editPop').style.display='none'
            })
}

//Print Transactions 
const printTrans = () => {
    // Make the hidden print details visible
    document.getElementById("printDetails").style.display = 'flex';
    document.getElementById("printDetails").style.justifyContent = 'between';
    document.getElementById("printDetails").style.alignContent = 'center';

    // Trigger print
    window.print();

    // Optional: hide it again after printing
    document.getElementById("printDetails").style.display = 'none';
};

});
