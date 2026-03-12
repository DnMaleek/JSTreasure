const express= require ('express')
const mysql = require ('mysql2')
const path = require ('path')
const cors =require ('cors')
const bodyParser=require ('body-parser')
const dotenv= require ('dotenv')
const { error } = require('console')

//initialize express
const app = express()
app.use(express.json())

//middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors())
dotenv.config()

//serve static files
app.use(express.static(path.join(__dirname,'public')))

//mysql connection
const db = mysql.createConnection(
    {
        host: process.env.MYSQLHOST,
        user: process.env.MYSQLUSER,
        password: process.env.MYSQLPASSWORD,
        database: process.env.MYSQL_DATABASE,
    }
)

//connect to mysql
    db.connect((error)=>{
        if (error) throw error;
        console.log("Database Connected✅")
    })


//Routes
app.get('/', (req,res) =>{
    res.sendFile(path.join(__dirname,'public','index.html'))
})

app.get('/add', (req,res) =>{
    res.sendFile(path.join(__dirname,'public','add_client.html'))
})

app.get('/analytics', (req,res) =>{
    res.sendFile(path.join(__dirname,'public','analytics.html'))
})

// serve the page
app.get('/view_clients', (req,res) =>{
    res.sendFile(path.join(__dirname,'public','view_clients.html'))
})

// Fetch clients with pagination + search
app.get('/view_clients_data', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const offset = (page - 1) * limit;

    let whereClause = "";
    let params = [];

    if (search) {
        whereClause = `
            WHERE Name LIKE ?
            OR Email LIKE ?
            OR Tel LIKE ?
        `;
        const keyword = `%${search}%`;
        params.push(keyword, keyword, keyword);
    }

    const dataSql = `
        SELECT * FROM clients
        ${whereClause}
        ORDER BY Id DESC
        LIMIT ? OFFSET ?
    `;

    const countSql = `
        SELECT COUNT(*) AS total
        FROM clients
        ${whereClause}
    `;

    // First get total count
    db.query(countSql, params, (err, countResult) => {
        if (err) return res.status(500).json(err);

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        // Then get paginated data
        db.query(
            dataSql,
            [...params, limit, offset],
            (err, dataResult) => {
                if (err) return res.status(500).json(err);

                res.json({
                    data: dataResult,
                    currentPage: page,
                    totalPages,
                    total
                });
            }
        );
    });
});


//Add Client
app.post('/add', (req,res) =>{
   const {Name, Email , Tel} = req.body;

   if(!Name || !Email || !Tel ) {
    res.status(400).json({message:'All fields are required'})
    return;
   }

   if (Tel.length !== 13 ) {
        res.status(400).json({message:'The required format is +255 xxx xxx xxx'})
        return;
   }

   db.query("SELECT * FROM clients WHERE Email = ?",[Email],(err, result)=>{
                if (err) throw err;

                if (result.length > 0){
                    return res.status(404).json({message:"Email already exist"})
                }

                const sql= "INSERT INTO clients (Name, Email, Tel) VALUES (?,?,?)"

                db.query(sql,[Name, Email ,Tel], (err)=>{
                    if (err) throw err;

                    res.status(200).json({message:'Client added sucessfully'})
                })


                }

            )
})


// Add users by Batch
app.post('/addClients', async (req, res) => {
    const clients = req.body; // now expects an array of clients
    try {
        for (let client of clients) {
            await db.query(
                'INSERT INTO clients (Name, Email, Tel) VALUES (?, ?, ?)',
                [client.Name, client.Email, client.Tel]
            );
        }
        res.status(200).json({ message: 'All clients added successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get('/view_client/:client_id', (req, res) => {

    res.sendFile(path.join(__dirname , 'public' , 'view_client.html'))
    
})

//fetch Client by id

app.post('/view_client/:client_id', (req,res) => {
    const Id = req.params.client_id;

    const sql = "SELECT * FROM clients WHERE Id=?"

    db.query(sql, [Id], (error, result) => {
        if (error) throw error;

        if (result.length===0) {
            res.status(500).json({message:"Client doesn't exist"})
            return;
        }

        const client = result[0]
        res.json(client)

    })

})

//Edit client data

app.put('/view_client/:client_id' , (req ,res) => {
    const Id = req.params.client_id;

    const {Name ,Email ,Tel} =req.body;

      if (!Name || !Email || !Tel) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    const sql ="UPDATE clients SET Name=? , Email=? , Tel=? WHERE Id =?"

    db.query(sql,[Name ,Email ,Tel ,Id],(error) => {
        if (error) {
            return res.status(500).json({ message: "Database Error", error });
        }
        res.json({ message: "Client edited Successfully!" });
    })

})

//add transaction per client

app.post('/add_transaction', (req, res) => {
    const { clientId, type, amount, desc } = req.body;

    if (!clientId || !type || !amount) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    const sql = `
        INSERT INTO transactions (client_id, \`income\`, \`outtake\`, description)
        VALUES (?, ?, ?, ?)
    `;

    let inAmount = 0;
    let outAmount = 0;

    if (type === "income") {
        inAmount = amount;
    } else if (type === "outtake") {
        outAmount = -amount;
    } else {
        return res.status(400).json({ message: "Invalid transaction type" });
    }

    db.query(sql, [clientId, inAmount, outAmount, desc], (error) => {
        if (error) {
            return res.status(500).json({ message: "Database Error", error });
        }
        res.json({ message: "Transaction Added Successfully!" });
    });
});

// Get balance for a specific client
app.get('/balance/:clientId', (req, res) => {
    const clientId = req.params.clientId;

    if (!clientId) {
        return res.status(400).json({ message: "Missing clientId" });
    }

    const sql = `
        SELECT
            SUM(\`income\`) AS totalIn,
            SUM(\`outtake\`) AS totalOut,
            SUM(\`income\`) + SUM(\`out\`) AS balance
        FROM transactions
        WHERE client_id = ?
    `;

    db.query(sql, [clientId], (error, results) => {
        if (error) {
            return res.status(500).json({ message: "Database Error", error });
        }

        // results[0] will have totalIn, totalOut, balance
        res.json({
            totalIn: results[0].totalIn || 0,
            totalOut: results[0].totalOut || 0,
            balance: results[0].balance || 0
        });
    });
});


app.post('/transactions', (req, res) => {
    const { clientId, page = 1, limit = 10 } = req.body;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const dataSql = `
        SELECT * 
        FROM transactions 
        WHERE client_id = ? 
        ORDER BY id DESC 
        LIMIT ? OFFSET ?
    `;

    const countSql = `
        SELECT COUNT(*) AS total 
        FROM transactions 
        WHERE client_id = ?
    `;

    db.query(countSql, [clientId], (err, countResult) => {
        if (err) return res.status(500).json({ message: err.message });

        const totalRecords = countResult[0].total;
        const totalPages = Math.ceil(totalRecords / limitNum);

        db.query(dataSql, [clientId, limitNum, offset], (error, results) => {
            if (error) {
                return res.status(500).json({ message: error.message });
            }

            res.status(200).json({
                page: pageNum,
                limit: limitNum,
                totalRecords,
                totalPages,
                data: results
            });
        });
    });
});


app.delete("/delete/:clientId", (req, res) => {
    const clientId = req.params.clientId;

    const sql = "DELETE FROM clients WHERE id = ?";

    db.query(sql, [clientId], (error, result) => {
        if (error) {
            return res.status(500).json({ message: "Error while deleting client", error });
        }

        // Optionally, check if a row was actually deleted
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Client not found" });
        }

        res.json({ message: "Client Deleted Successfully!" });
    });
});

app.delete('/transaction/delete/:trans_id', (req, res) => {
    const transId = req.params.trans_id;

    const sql = 'DELETE FROM transactions WHERE id = ?';

    db.query(sql, [transId], (error, results) => {
        if(error) {
            return res.status(500).json({message: "Error while deleting transaction: ", error})
        }

        if(results.affectedRows === 0) {
            res.status(404).json({message: "Transaction not found!"})
        }

        res.status(200).json({message: "Transaction Deleted successfylly!"})
    })
})

// Analytics data from all tables
app.get('/analytics_data', (req, res) => {

    const sql = `
        SELECT 
            (SELECT COUNT(*) FROM clients) AS totalClients,

            (SELECT IFNULL(SUM(\`income\`), 0) FROM transactions) AS totalIn,

            (SELECT IFNULL(SUM(\`outtake\`), 0) FROM transactions) AS totalOut,

            (SELECT IFNULL(SUM(\`income\`) + SUM(\`out\`), 0) FROM transactions) AS totalBalance,

            (SELECT COUNT(*) FROM transactions) AS totalTransactions
    `;

    db.query(sql, (error, results) => {
        if (error) {
            return res.status(500).json({ message: "Database Error", error });
        }

        res.json(results[0]);
    });
});

// Top clients by balance
app.get('/analytics_top_clients', (req, res) => {

    const sql = `
        SELECT 
            c.Id,
            c.Name,
            c.Email,
            IFNULL(SUM(t.\`income\`) + SUM(t.\`outtake\`), 0) AS balance
        FROM clients c
        LEFT JOIN transactions t ON c.Id = t.client_id
        GROUP BY c.Id
        ORDER BY balance DESC
        LIMIT 10    
    `;

    db.query(sql, (error, results) => {
        if (error) {
            return res.status(500).json({ message: "Database Error", error });
        }

        res.json(results);
    });
});

// Getting recent transactions
app.get('/analytics_recent_transactions', (req, res) => {

    const limit = parseInt(req.query.limit) || 5;

    const sql = `
        SELECT 
            t.id,
            t.client_id,
            t.\`income\`,
            t.\`outtake\`,
            t.description,
            t.date,
            c.Name AS clientName
        FROM transactions t
        JOIN clients c ON t.client_id = c.Id
        ORDER BY t.id DESC
        LIMIT ?
    `;

    db.query(sql, [limit], (error, results) => {
        if (error) {
            return res.status(500).json({ message: "Database Error", error });
        }

        res.json(results);
    });
});


app.listen(5000,()=>{
    console.log("http://localhost:5000")
})