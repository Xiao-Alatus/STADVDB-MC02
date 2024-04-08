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

router.post("/execute-query", async (req, res)=>{
    try {
        const { transaction } = req.body;
        // Get rid of the \n
        const sqlTransaction = transaction.replace(/\n/g, ' ');
        const results = await executeTransaction(sqlTransaction);
        res.status(200).json({ results });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

// Execute transaction
async function executeTransaction(sqlTransaction) {
    const sqlStatements = sqlTransaction.split(';');
    const results = [];
    // Execute each SQL statement sequentially
    for (let i = 0; i < sqlStatements.length; i++) {
        if (sqlStatements[i].trim() === '') {
            continue;
        }
        try {
            const result = await executeSQL(sqlStatements[i]);
            results.push(result);
        } catch (error) {
            throw error;
        }
    }
    return results;
}

// Execute SQL
function executeSQL(sqlStatement) {
    return new Promise((resolve, reject) => {
        connection.query(sqlStatement, (err, result) => {
            if (err) {
                reject(err); // Reject with error if query fails
            } else {
                resolve(result); // Resolve with result if query succeeds
            }
        });
    });
}

module.exports = router;