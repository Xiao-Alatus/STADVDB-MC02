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

// Search
router.post("/search", async (req, res)=>{
    try {
        const appointmentID = req.body.searchInput
        var sql = `SELECT * FROM apptdb.appointments`;
        if (appointmentID) {
            sql = `SELECT * FROM apptdb.appointments WHERE apptid = '${appointmentID}'`;
        }
        const result = await executeSQL(sql);
        res.json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

// Add
router.post("/add", async (req, res)=>{
    try {
        const { apptid, status, city, province, regionName } = req.body;
        const sql = `INSERT INTO apptdb.appointments (apptid, status, City, Province, RegionName) VALUES ('${apptid}', '${status}', '${city}', '${province}', '${regionName}')`;
        const result = await executeSQL(sql);
        res.json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }

});

// Delete
router.post("/delete", async (req, res)=>{
    try {
        const appointmentID = req.body.searchInput
        const sql = `DELETE FROM apptdb.appointments WHERE apptid = '${appointmentID}'`;
        const result = await executeSQL(sql);
        res.status(200);
        res.end();
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

// Edit
router.post("/edit", async (req, res)=>{
    try {
        const { apptid, status, city, province, regionName } = req.body;
        const sql = `UPDATE apptdb.appointments SET status = '${status}', City = '${city}', Province = '${province}', RegionName = '${regionName}' WHERE apptid = '${apptid}'`;
        const result = await executeSQL(sql);
        res.json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

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