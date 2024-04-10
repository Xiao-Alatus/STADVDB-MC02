import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import database from './services/db_connections.js';
import helper from './services/router_helper.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Serve the static files from the React app
router.use(express.static(path.join(__dirname, '../app')));

// An api endpoint that returns a short list of items
router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '../app/index.html'));
});

// Search
router.post("/search", async (req, res) => {
    const appointment = await helper.searchAppointment(req.body.searchInput);
    console.log(appointment);
    res.json(appointment);
});

// Add
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

// Delete
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

// Edit
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

// Test: Ping
router.get("/ping", async (req, res) => {
    const status = await database.checkConnection();
    res.status(200).send(status);
});

// Test: Sync
router.get("/sync/:server", async(req, res) => {
    const server = req.params.server;
    await database.syncLogFiles(server);
    res.status(200).send(`Synced ${server} log files.`);
})

// Test: Index
router.get("/index", async (req, res) => {
    const status = await database.getLogFileIndex('luzon');
    res.status(200).send("index: " + status);
})

// Test: Update
router.get("/update", async (req, res) => {
    await database.editDatabase('luzon', "INSERT INTO appointments (apptid) VALUES (1006);");
    res.status(200).send("finish");
})

export default router;