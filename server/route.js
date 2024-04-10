import express from "express";
import mysql from "mysql2";
import path from "path";
import { fileURLToPath } from 'url';
import database from "./services/db_operations.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = express.Router();

router.use(express.static(path.join(__dirname, '../app')));

router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '../app/index.html'));
});

// Search
router.post("/search", async (req, res) => {
    const appointment = await database.searchAppointment(req.body.searchInput);
    console.log(appointment);
    res.json(appointment);
});

// Add
router.post("/add", async (req, res) => {
    const result = await database.addAppointment(req.body);
    console.log(result);
    res.json(result);
});

// Delete
router.post("/delete", async (req, res) => {
    const result = await database.deleteAppointment(req.body.searchInput);
    console.log(result);
    res.json(result);
});

// // EDIT
// router.post("/edit", async (req, res) => {
//     try {
//         // For boolean values, 1 is true and 0 is false
//         const newVirtual = req.body.Virtual ? 1 : 0;
//         // Extract the date from the QueueDate string
//         const { apptid, pxid, doctorid, status, QueueDate, Type, Virtual, hospitalname, City, Province } = req.body;
//         const sqlStatements = [
//             `UPDATE appointments SET status = '${status}', QueueDate = '${QueueDate}', \`type\` = '${Type}', \`Virtual\` = '${newVirtual}', hospitalname = '${hospitalname}', City = '${City}', Province = '${Province}' WHERE apptid = '${apptid}'`
//         ];
//         const result = await executeSQL(sqlStatements);
//         res.json(result);
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ error: error.message });
//     }
// });


router.get("/ping", async (req, res) => {
    const status = await database.checkConnection();
    res.status(200).send(status);
});

router.get("/sync/:server", async(req, res) => {
    const server = req.params.server;
    await database.syncLogFiles(server);
    res.status(200).send(`Synced ${server} log files.`);
})

router.get("/index", async (req, res) => {
    const status = await database.getLogFileIndex('luzon');
    res.status(200).send("index: " + status);
})

router.get("/update", async (req, res) => {
    await database.editDatabase('luzon', "INSERT INTO appointments (apptid) VALUES (1006);");
    res.status(200).send("finish");
})

export default router;