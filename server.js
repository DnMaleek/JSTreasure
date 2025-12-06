const express= require ('express')
const mysql = require ('mysql2')
const path = require ('path')
const cors =require ('cors')
const bodyParser=require ('body-parser')
const dotenv= require ('dotenv')

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

   const sql= "INSERT INTO clients (Name, Email, Tel) VALUES (?,?,?)"

   db.query(sql,[Name, Email ,Tel], (err)=>{
    if (err) throw err;

    res.status(200).json({message:'Client added sucessfully'})
   })

})

app.listen(5000,()=>{
    console.log("http://localhost:5000")
})