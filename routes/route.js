const express = require("express");
const router = express.Router();
const mysql = require("mysql");
const path = require("path");

// MySQL connection
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "12345",
    database: "apptdb",
    port: 3306
});

connection.connect((err)=>{
    if(err) throw err;
    console.log("Connected to MySQL Database");
});

router.use(express.static(path.join(__dirname, '../app')));

router.get("/", (req, res)=>{
    res.sendFile(path.join(__dirname + '../app/index.html'));
});

// For concurrency control
router.post("/execute-query", async (req, res)=>{
    try {
        const transaction1 = req.body.transaction1.replace(/\n/g, ' ');
        const transaction2 = req.body.transaction2.replace(/\n/g, ' ');
        const transactionCase = req.body.transactionCase;

        const result1 = await executeTransaction(transaction1);
        const result2 = await executeTransaction(transaction2);

        res.json({
            result1,
            result2
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

// Transaction execution
function executeTransaction(sqlQuery) {
    const statements = sqlQuery.split(';').filter(statement => statement.trim() !== '');
    const results = [];
    return new Promise((resolve, reject) => {
        const executeNext = async(index) => {
            if (index >= statements.length) {
                resolve(results);
                return;
            }
            const currentQuery = statements[index] + ';';
            try {
                const result = await executeQuery(currentQuery);
                results.push(result);
                executeNext(index + 1);
            } catch (error) {
                reject(error);
            }
        }

        executeNext(0);
    });
}

function executeQuery(sqlQuery) {
    return new Promise((resolve, reject) => {
        connection.query(sqlQuery, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

module.exports = router;