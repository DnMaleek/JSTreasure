## Built With
![HTML](https://img.shields.io/badge/HTML-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)

## Repository Info
![GitHub repo size](https://img.shields.io/github/repo-size/DnMaleek/JSTreasure)
![GitHub license](https://img.shields.io/github/license/DnMaleek/JSTreasure)
![GitHub last commit](https://img.shields.io/github/last-commit/DnMaleek/JSTreasure)

# 📦 JSTreasure
A JavaScript-based treasure project for managing clients and their transactions thats auto calculate the net worth of the amount left.

# 🧠 About
JSTreasure is a JavaScript project designed to help manage client data with a simple server setup.
 ### Features available:
   - Add client by filling the required credentials<br>
   - Manage clients:Here you are able to manage each client with their transacions also able to print them when needed ,edit ,delete ,etc..<br>
   - Analysis:Get full analysis of the whole app top creditors, debitors , recent transactions etc...

# How to Run the WebApp
Clone the repository
```bash
git clone https://github.com/DnMaleek/JSTreasure.git
```
Install dependencies
```bash
npm install
```
Start the server by running this on the terminal
```bash
node server.js
or
npm run dev
```
import the database from the
```bash
/dbase
```
add .env file in root dir (/)
```bash
DB_HOST=localhost
DB_USER=root
DB_PASS=Enter your database password here if none leave empty ""
DB_NAME=jstreasure
```

# Instruction for DEVELOPERS Only
 ### buld_mini_server.js 
  This is a small self funning server that enable you to add users in a batch form, i mean many at once.
 ### clients.json
  This is the json file with over 100 dammy clients details that makes creation of cliets easy and less frustrating while testing , as you get many data to do so.<br>
 ### HOW TO USE IT
  1. Run the buld_mini_server.js (node bulk_mini_server.js)<br>
  2. Go to Postman and the visit the link "http://localhost:5050/import-clients"<br>
  3. On Postman visit the body and select json input type. Then   back to your clients.json file and copy the list and paste it there. Make sure method selected is POST.<br>
  4. Done!<br>
        
Now you will have over 100 clients imported to you system.<br>

###### 📍 DISCLAIMER‼️‼️
This app was made for desktop experience so the design might not appear well on small devices like smartphones the pages will overwerflow    
