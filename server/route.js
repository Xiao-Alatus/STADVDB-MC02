import express from "express";
import mysql from "mysql2";
import path from "path";
import { fileURLToPath } from 'url';
import database from "./services/db_operations.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = express.Router();

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
                // DO SLEEP(5) to simulate a long running transaction
                connection.query('DO SLEEP(5);', err => {
                    if (err) {
                        return connection.rollback(() => {
                            reject(err);
                        });
                    }
                });
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
router.post("/search", async (req, res) => {
    const appointmentID = req.body.searchInput;
    let sql = "SELECT * FROM appointments";
    if (appointmentID) {
        // Ensure the appointmentID is properly sanitized to prevent SQL injection
        sql += ` WHERE apptid = ${connection.escape(appointmentID)}`;
    }
    const result = await executeSQL([sql]);
    res.json(result);
});


// ADD
router.post("/add", async (req, res) => {
    try {
        // For boolean values, 1 is true and 0 is false
        const newVirtual = req.body.Virtual ? 1 : 0;
        // Extract the date from the QueueDate string
        const { apptid, pxid, doctorid, status, QueueDate, Type, Virtual, hospitalname, City, Province, Region } = req.body;
        const sqlStatements = [
            `INSERT INTO appointments (apptid, pxid, doctorid, status, QueueDate, \`type\`, \`Virtual\`, hospitalname, City, Province, Region) VALUES ('${apptid}', '${pxid}', '${doctorid}', '${status}', '${QueueDate}', '${Type}', '${newVirtual}', '${hospitalname}', '${City}', '${Province}', '${Region}')`
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
            `DELETE FROM appointments WHERE apptid = '${appointmentID}'`
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
        // For boolean values, 1 is true and 0 is false
        const newVirtual = req.body.Virtual ? 1 : 0;
        // Extract the date from the QueueDate string
        const { apptid, pxid, doctorid, status, QueueDate, Type, Virtual, hospitalname, City, Province } = req.body;
        const sqlStatements = [
            `UPDATE appointments SET status = '${status}', QueueDate = '${QueueDate}', \`type\` = '${Type}', \`Virtual\` = '${newVirtual}', hospitalname = '${hospitalname}', City = '${City}', Province = '${Province}' WHERE apptid = '${apptid}'`
        ];
        const result = await executeSQL(sqlStatements);
        res.json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});


router.get("/ping", async (req, res) => {
    const status = await database.checkConnection();
    res.status(200).send(status);
});


export default router;