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
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
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

// serve the page
app.get('/view_clients', (req,res) =>{
    res.sendFile(path.join(__dirname,'public','view_clients.html'))
})

// get the page data
app.get('/view_clients_data', (req, res) => {
    
    const sql = "SELECT * FROM clients"

    db.query(sql,(err,result)=>{
        if (err) throw err;

        if (result.length >= 0) {
            return res.json(result);
        }  

    })
}) 

//Add user 
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

app.get('/view_client/:client_id', (req, res) => {

    res.sendFile(path.join(__dirname , 'public' , 'view_client.html'))
    
})

//fetch user by id

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
        INSERT INTO transactions (client_id, \`in\`, \`out\`, description)
        VALUES (?, ?, ?, ?)
    `;

    let inAmount = 0;
    let outAmount = 0;

    if (type === "in") {
        inAmount = amount;
    } else if (type === "out") {
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
            SUM(\`in\`) AS totalIn,
            SUM(\`out\`) AS totalOut,
            SUM(\`in\`) + SUM(\`out\`) AS balance
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
    const { clientId } = req.body;

    const sql = "SELECT * FROM transactions WHERE client_id = ?";

    db.query(sql, [clientId], (error, results) => {
        if(error) {
        return res.status(400).json({message: Error.err})
        }
        res.status(200).json(results)
    });
})

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

app.listen(5000,()=>{
    console.log("http://localhost:5000")
})