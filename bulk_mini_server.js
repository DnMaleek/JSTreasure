require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json());

(async () => {
    const db = await mysql.createConnection({
        host: process.env.MYSQLHOST,
        user: process.env.MYSQLUSER,
        password: process.env.MYSQLPASSWORD,
        database: process.env.MYSQL_DATABASE,
        port: process.env.MYSQLPORT
    });

    console.log("Bulk import DB connected");

    app.post('/import-clients', async (req, res) => {
        try {
            const clients = req.body;

            if (!Array.isArray(clients)) {
                return res.status(400).json({
                    error: "Expected an array of clients"
                });
            }

            const values = clients.map(c => [
                c.Name,
                c.Email,
                c.Tel
            ]);

            await db.query(
                'INSERT INTO clients (Name, Email, Tel) VALUES ?',
                [values]
            );

            res.json({
                message: `${clients.length} clients imported successfully`
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    });

    app.listen(5000, () => {
        console.log("Bulk import server running on http://localhost:5050");
    });
})();
