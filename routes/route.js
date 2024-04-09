const express = require("express");
const router = express.Router();
const mysql = require("mysql");
const path = require("path");

// MySQL connection
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "apptdb",
    port: 3306
});

connection.connect((err) => {
    if (err) throw err;
    console.log("Connected to MySQL Database");
});

router.use(express.static(path.join(__dirname, '../app')));

router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '../app/index.html'));
});

// Modified executeSQL function to handle transactions with an array of SQL statements 
function executeSQL(sqlStatements) {
    return new Promise((resolve, reject) => {
        connection.beginTransaction(err => {
            if (err) { reject(err); }
            connection.query('SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;', err => {
                if (err) {
                    return connection.rollback(() => {
                        reject(err);
                    });
                }
                const promises = sqlStatements.map(statement => new Promise((resolve, reject) => {
                    connection.query(statement, (err, result) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(result);
                    });
                }));
                Promise.all(promises)
                    .then(results => {
                        connection.commit(err => {
                            if (err) {
                                return connection.rollback(() => {
                                    reject(err);
                                });
                            }
                            resolve(results.length === 1 ? results[0] : results);
                        });
                    })
                    .catch(err => {
                        connection.rollback(() => {
                            reject(err);
                        });
                    });
            });
        });
    });
}

// Search
router.post("/search", (req, res) => {
    const appointmentID = req.body.searchInput;
    let sql = "SELECT * FROM apptdb.appointments";
    if (appointmentID) {
        // Ensure the appointmentID is properly sanitized to prevent SQL injection
        sql += ` WHERE apptid = ${connection.escape(appointmentID)}`;
    }

    connection.query(sql, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error executing SQL query" });
        }
        res.json(result);
    });
});


// ADD
router.post("/add", async (req, res) => {
    try {
        const { apptid, status, city, province, regionName } = req.body;
        const sqlStatements = [
            `INSERT INTO apptdb.appointments (apptid, status, City, Province, RegionName) VALUES ('${apptid}', '${status}', '${city}', '${province}', '${regionName}')`
        ];
        const result = await executeSQL(sqlStatements);
        res.json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE
router.post("/delete", async (req, res) => {
    try {
        const appointmentID = req.body.searchInput; 
        const sqlStatements = [
            `DELETE FROM apptdb.appointments WHERE apptid = '${appointmentID}'`
        ];
        await executeSQL(sqlStatements);
        res.status(200).send('Appointment deleted successfully');
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});


// EDIT
router.post("/edit", async (req, res) => {
    try {
        const { apptid, status, city, province, regionName } = req.body;
        const sqlStatements = [
            `UPDATE apptdb.appointments SET status = '${status}', City = '${city}', Province = '${province}', RegionName = '${regionName}' WHERE apptid = '${apptid}'`
        ];
        const result = await executeSQL(sqlStatements);
        res.json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;