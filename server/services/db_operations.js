import mysql from 'mysql2'

import { main_db, luzon_db, vismin_db } from './db_connections.js'

// Search for an appointment in the database
export async function searchAppointment(apptid) {

    // Store the rows from the database
    let rows = []
    // Try main
    try {
        // Begin the search
        await syncDatabase();
        [rows] = await main_db.query(`SELECT * FROM appointments WHERE apptid = ?;`, [apptid]);
        // Return the rows if there are any
        if (rows.length > 0) {
            return rows;
        } else {
            return { error: 'No appointment found' };
        }

    // If main fails, try luzon and vismin
    } catch (error) {
        console.log("Error in main: " + error);

        let luzonRows = [];
        let visminRows = [];

        // Luzon
        try {
            await syncDatabase('luzon');
            // Begin the search
            [luzonRows] = luzon_db.query(`SELECT * FROM appointments WHERE apptid = '?';`, [apptid]);
        } catch (error) {
            console.log("Error in luzon: " + error);
            return { error: 'No appointment found' };
        }

        // Vismin
        try {
            await syncDatabase('vismin');
            // Begin the search
            [visminRows] = vismin_db.query(`SELECT * FROM appointments WHERE appt'?'d = '?';`, [apptid]);
        } catch (error) {
            console.log("Error in vismin: " + error);
            return { error: 'No appointment found' };
        }

        // Combine the rows
        rows = rows.concat(luzonRows, visminRows);

        // Return the rows if there are any
        return rows;
    }
}

// Add an appointment to the database
export async function addAppointment(form) {
    // For boolean values, 1 is true and 0 is false
    const newVirtual = form.Virtual ? 1 : 0;
    // Extract the date from the QueueDate string
    const { apptid, pxid, doctorid, status, QueueDate, Type, Virtual, hospitalname, City, Province, Region } = form;

    // Try main
    try {
        // Check if the region is Luzon or Visayas/Mindanao
        if (form.Region === 'Luzon') {
            // Check if it already exists
            const [rows] = await main_db.query(`SELECT * FROM appointments WHERE apptid = ?;`, [apptid]);
            if (rows.length > 0) {
                return { error: 'Appointment already exists' };
            }
            // Add the appointment
            return await editDatabase('luzon', `INSERT INTO appointments (apptid, pxid, doctorid, status, QueueDate, \`type\`, \`Virtual\`, hospitalname, City, Province, Region) VALUES ('${apptid}', '${pxid}', '${doctorid}', '${status}', '${QueueDate}', '${Type}', '${newVirtual}', '${hospitalname}', '${City}', '${Province}', '${Region}')`);
        } else if (form.Region === 'Visayas/Mindanao') {
            // Check if it already exists
            const [rows] = await main_db.query(`SELECT * FROM appointments WHERE apptid = ?;`, [apptid]);
            if (rows.length > 0) {
                return { error: 'Appointment already exists' };
            }
            // Add the appointment
            return await editDatabase('vismin', `INSERT INTO appointments (apptid, pxid, doctorid, status, QueueDate, \`type\`, \`Virtual\`, hospitalname, City, Province, Region) VALUES ('${apptid}', '${pxid}', '${doctorid}', '${status}', '${QueueDate}', '${Type}', '${newVirtual}', '${hospitalname}', '${City}', '${Province}', '${Region}')`);
        }
    // If main fails, try luzon and vismin
    } catch {
        try {
            if (form.Region === 'Luzon') {
                // Check if it already exists
                const [luzonRows] = await luzon_db.query(`SELECT * FROM appointments WHERE apptid = ?;`, [apptid]);
                const [visminRows] = await vismin_db.query(`SELECT * FROM appointments WHERE apptid = ?;`, [apptid]);
                if (luzonRows.length > 0 || visminRows.length > 0) {
                    return { error: 'Appointment already exists' };
                }
                // Add the appointment
                return await editDatabase('luzon', `INSERT INTO appointments (apptid, pxid, doctorid, status, QueueDate, \`type\`, \`Virtual\`, hospitalname, City, Province, Region) VALUES ('${apptid}', '${pxid}', '${doctorid}', '${status}', '${QueueDate}', '${Type}', '${newVirtual}', '${hospitalname}', '${City}', '${Province}', '${Region}')`);
            } else if (form.Region === 'Visayas/Mindanao') {
                // Check if it already exists
                const [luzonRows] = await luzon_db.query(`SELECT * FROM appointments WHERE apptid = ?;`, [apptid]);
                const [visminRows] = await vismin_db.query(`SELECT * FROM appointments WHERE apptid = ?;`, [apptid]);
                if (luzonRows.length > 0 || visminRows.length > 0) {
                    return { error: 'Appointment already exists' };
                }
                // Add the appointment
                return await editDatabase('vismin', `INSERT INTO appointments (apptid, pxid, doctorid, status, QueueDate, \`type\`, \`Virtual\`, hospitalname, City, Province, Region) VALUES ('${apptid}', '${pxid}', '${doctorid}', '${status}', '${QueueDate}', '${Type}', '${newVirtual}', '${hospitalname}', '${City}', '${Province}', '${Region}')`);
            }
        } catch (error) {
            console.log("Error in main: " + error);
            return { error: 'Error adding appointment' };
        }
    }
}

// Delete an appointment from the database
export async function deleteAppointment(apptid) {
    // Try main
    try {
        // Check if it exists
        const [rows] = await main_db.query(`SELECT * FROM appointments WHERE apptid = ?;`, [apptid]);
        if (rows.length === 0) {
            return { error: 'Appointment does not exist' };
        }
        // Check if the region is Luzon or Visayas/Mindanao
        if (rows[0].Region === 'Luzon') {
            // Delete the appointment
            return await editDatabase('luzon', `DELETE FROM appointments WHERE apptid = '${apptid}'`);
        } else if (rows[0].Region === 'Visayas/Mindanao') {
            // Delete the appointment
            return await editDatabase('vismin', `DELETE FROM appointments WHERE apptid = '${apptid}'`);
        }
    // If main fails, try luzon and vismin
    } catch {
        try {
            // Check if it exists
            const [luzonRows] = await luzon_db.query(`SELECT * FROM appointments WHERE apptid = ?;`, [apptid]);
            const [visminRows] = await vismin_db.query(`SELECT * FROM appointments WHERE apptid = ?;`, [apptid]);
            if (luzonRows.length === 0 && visminRows.length === 0) {
                return { error: 'Appointment does not exist' };
            }
            // Check if the region is Luzon or Visayas/Mindanao
            if (luzonRows.length > 0) {
                // Delete the appointment
                return await editDatabase('luzon', `DELETE FROM appointments WHERE apptid = '${apptid}'`);
            } else if (visminRows.length > 0) {
                // Delete the appointment
                return await editDatabase('vismin', `DELETE FROM appointments WHERE apptid = '${apptid}'`);
            }
        } catch (error) {
            console.log("Error in main: " + error);
            return { error: 'Error deleting appointment' };
        }
    }
}


// Modified executeSQL function to handle transactions with an array of SQL statements 
export async function startTransaction(pool, isolation = 'READ COMMITTED') {
    await pool.query(`SET SESSION TRANSACTION ISOLATION LEVEL ${isolation};`)
    await pool.query(`START TRANSACTION;`)
    await pool.query(`BEGIN;`)
}

export async function endTransaction(pool, status = 'COMMIT'){
    await pool.query(`${status};`)
}

export async function checkConnection(){
    let main_status = false;
    let luzon_status = false;
    let vismin_status = false;
    
    try{
        await main_db.query('SELECT 1')
                main_status = true;
                console.log(`Successfully pinged main server.`);
    } catch(error){
        console.error(`Error executing query on server: ${error.message}`);
    }
    
    try{
        await luzon_db.query('SELECT 1')
                luzon_status = true;
                console.log(`Successfully pinged luzon server.`);
    } catch(error){
        console.error(`Error executing query on server: ${error.message}`);
    }

    try{
        await vismin_db.query('SELECT 1')
                vismin_status = true;
                console.log(`Successfully pinged vismin server.`);
    } catch(error){
        console.error(`Error executing query on server: ${error.message}`);
    }

    return {main_status, luzon_status, vismin_status}
}

export async function syncDatabase(serverlog = 'all'){
    let statuses = await checkConnection();
    if(serverlog === 'luzon' || serverlog === 'all') {
        if(statuses.main_status && statuses.luzon_status){
            let oldMainIndex = await getLogFileIndex('main_luzon');
            let oldRepIndex = await getLogFileIndex('luzon');
            await syncLogFiles('luzon') //sync log files, then update main

            //update main log file and appts
            await startTransaction(main_db);
            await syncApptstoLogFiles(main_db, oldMainIndex, "luzon");
            await endTransaction(main_db);
            //update luzon log file and appts
            await startTransaction(luzon_db);
            await syncApptstoLogFiles(luzon_db, oldRepIndex, "luzon");
            await endTransaction(luzon_db);
        }
    }
    if (serverlog === 'vismin' || serverlog === 'all') {
        if(statuses.main_status && statuses.vismin_status){
            let oldMainIndex = await getLogFileIndex('main_vismin');
            let oldRepIndex = await getLogFileIndex('vismin');
            await syncLogFiles('vismin') //sync log files, then update main

            //update main log file and appts
            await startTransaction(main_db);
            await syncApptstoLogFiles(main_db, oldMainIndex, "vismin");
            await endTransaction(main_db);
            //update vismin log file and appts
            await startTransaction(vismin_db);
            await syncApptstoLogFiles(vismin_db, oldRepIndex, "vismin");
            await endTransaction(vismin_db);
        }
    }
}

//called whenever any query is executed; updates log file with the query executed
export async function editDatabase(serverlog, query){
    let statuses = await checkConnection();
    if(serverlog === 'luzon') {
        if(statuses.main_status && statuses.luzon_status){
            let oldMainIndex = await getLogFileIndex('main_luzon');
            let oldRepIndex = await getLogFileIndex('luzon');
            await syncLogFiles('luzon') //sync log files, then update main

            // get latest index on log table for luzon_db
            let logFileIndex = await getLogFileIndex('main_luzon');
            // increment index
            logFileIndex++;
            //update main log file and appts
            await startTransaction(main_db);
            await main_db.query(`INSERT INTO luzon_log (id, log_entry) VALUES (${logFileIndex}, "${query}")`);
            await syncApptstoLogFiles(main_db, oldMainIndex, "luzon");
            await endTransaction(main_db);
            //update luzon log file and appts
            await startTransaction(luzon_db);
            await luzon_db.query(`INSERT INTO luzon_log (id, log_entry) VALUES (${logFileIndex}, "${query}")`);
            await syncApptstoLogFiles(luzon_db, oldRepIndex, "luzon");
            await endTransaction(luzon_db);
        }
        else if (statuses.main_status){
            //update main log file
            let oldMainIndex = await getLogFileIndex('main_luzon');
            console.log(`oldMainIndex: ${oldMainIndex}`)
            let logFileIndex = oldMainIndex + 1;
            await startTransaction(main_db);
            await main_db.query(`INSERT INTO luzon_log (id, log_entry) VALUES (${logFileIndex}, "${query}")`);
            await syncApptstoLogFiles(main_db, oldMainIndex, "luzon");
            await endTransaction(main_db);
        }
        else if (statuses.luzon_status){
            //update luzon log file
            let oldRepIndex = await getLogFileIndex('luzon');
            let logFileIndex = oldRepIndex + 1;
            await startTransaction(luzon_db);
            await luzon_db.query(`INSERT INTO luzon_log (id, log_entry) VALUES (${logFileIndex}, "${query}")`);
            await syncApptstoLogFiles(luzon_db, oldRepIndex, "luzon");
            await endTransaction(luzon_db);
        }
    }
    else if (serverlog === 'vismin') {
        if(statuses.main_status && statuses.vismin_status){
            let oldMainIndex = await getLogFileIndex('main_vismin');
            let oldRepIndex = await getLogFileIndex('vismin');
            await syncLogFiles('vismin') //sync log files, then update main

            // get latest index on log table for vismin_db
            let logFileIndex = await getLogFileIndex('main_vismin');
            // increment index
            logFileIndex++;
            //update main log file and appts
            await startTransaction(main_db);
            await main_db.query(`INSERT INTO vismin_log (id, log_entry) VALUES (${logFileIndex}, "${query}")`);
            await syncApptstoLogFiles(main_db, oldMainIndex, "vismin");
            await endTransaction(main_db);
            //update vismin log file and appts
            await startTransaction(vismin_db);
            await vismin_db.query(`INSERT INTO vismin_log (id, log_entry) VALUES (${logFileIndex}, "${query}")`);
            await syncApptstoLogFiles(vismin_db, oldRepIndex, "vismin");
            await endTransaction(vismin_db);
        }
        else if (statuses.main_status){
            //update main log file
            let oldMainIndex = await getLogFileIndex('main_vismin');
            let logFileIndex = oldMainIndex + 1;
            await startTransaction(main_db);
            await main_db.query(`INSERT INTO vismin_log (id, log_entry) VALUES (${logFileIndex}, "${query}")`);
            await syncApptstoLogFiles(main_db, oldMainIndex, "vismin");
            await endTransaction(main_db);
        }
        else if (statuses.vismin_status){
            //update vismin log file
            let oldRepIndex = await getLogFileIndex('vismin');
            let logFileIndex = oldRepIndex + 1;
            await startTransaction(vismin_db);
            await vismin_db.query(`INSERT INTO vismin_log (id, log_entry) VALUES (${logFileIndex}, "${query}")`);
            await syncApptstoLogFiles(vismin_db, oldRepIndex, "vismin");
            await endTransaction(vismin_db);
        }
    }
}

//get latest index on log table for a specific server
export async function getLogFileIndex(serverlog){
    let statuses = await checkConnection();
    try{
        if (serverlog === 'main_luzon' && statuses.main_status) {
            const [[result]] = await main_db.query('SELECT id FROM luzon_log ORDER BY id DESC LIMIT 1');
            return result.id;
        } else if (serverlog === 'main_vismin' && statuses.main_status) {
            const [[result]] = await main_db.query('SELECT id FROM vismin_log ORDER BY id DESC LIMIT 1');
            return result.id;
        } else if (serverlog === 'luzon' && statuses.luzon_status) {
            const [[result]] = await luzon_db.query('SELECT id FROM luzon_log ORDER BY id DESC LIMIT 1');
            return result.id;
        } else if (serverlog === 'vismin' && statuses.vismin_status) {
            const [[result]] = await vismin_db.query('SELECT id FROM vismin_log ORDER BY id DESC LIMIT 1');
            return result.id;
        }
    } catch(err){
        console.error(`Error getting log file index: ${err.message}`);
        return -1;
    }
}

export async function syncLogFiles(choice = "all"){
    //ping servers
    const statuses = await checkConnection();

    //if main_db is up
    if (statuses.main_status){
        //if luzon_db is up, sync luzon_db log file and main_db luzon log file
        if (statuses.luzon_status && (choice === "all" || choice === "luzon")){
            //sync luzon_db log file and main_db luzon log file            
            // Get latest index on log table for luzon_db and main_db
            let luzon_log_index = await getLogFileIndex('luzon');
            let main_luzon_log_index = await getLogFileIndex('main_luzon');
            console.log(`luzon_log_index: ${luzon_log_index}`);
            console.log(`main_luzon_log_index: ${main_luzon_log_index}`)
            let rows = [];

            // If not sync, sync log files
            if (luzon_log_index !== main_luzon_log_index){
                console.log("Log files are not in sync.")
                //sync log files from whoever has a higher index
                if (luzon_log_index < main_luzon_log_index){
                    try{
                        await startTransaction(luzon_db);
                        //sync main_db luzon log file to luzon_db log file
                        [rows] = await main_db.execute(`SELECT * FROM luzon_log WHERE id > ?`, [luzon_log_index]);
                        console.log(rows)
                        const temp = rows
                        for(let row of temp){
                            console.log("adding row" + row.id)
                            await luzon_db.execute(`INSERT INTO luzon_log (id, log_entry) VALUES (?,?)`, [row.id, row.log_entry]);
                        }
                        await endTransaction(luzon_db);
                        console.log("Synced main_db to luzon_db complete")
                        } catch(err){
                            console.error(`Error syncing main_db to luzon_db: ${err.message}`);
                            await endTransaction(luzon_db, 'ROLLBACK');
                        }
                } 
                else {
                    try{
                        await startTransaction(main_db);
                        //sync main_db luzon log file to luzon_db log file
                        [rows] = await luzon_db.execute(`SELECT * FROM luzon_log WHERE id > ?`, [main_luzon_log_index]);
                        console.log(rows)
                        const temp = rows
                        for(let row of temp){
                            console.log("adding row" + row.id)
                            await main_db.execute(`INSERT INTO luzon_log (id, log_entry) VALUES (?,?)`, [row.id, row.log_entry]);
                        }
                        await endTransaction(main_db);
                        console.log("Synced main_db to luzon_db complete")
                        } catch(err){
                            console.error(`Error syncing main_db to luzon_db: ${err.message}`);
                            await endTransaction(main_db, 'ROLLBACK');
                        }
                }
            }
            else {
                console.log("Log files are already in sync.");
            }
        }
        //if vismin_db is up, sync vismin_db log file and main_db vismin log file
        if (statuses.vismin_status && (choice === "all" || choice === "vismin")){
            //sync vismin_db log file and main_db vismin log file            
            // Get latest index on log table for vismin_db and main_db
            let vismin_log_index = await getLogFileIndex('vismin');
            let main_vismin_log_index = await getLogFileIndex('main_vismin');
            console.log(`vismin_log_index: ${vismin_log_index}`);
            console.log(`main_vismin_log_index: ${main_vismin_log_index}`)
            let rows = [];

            // If not sync, sync log files
            if (vismin_log_index !== main_vismin_log_index){
                console.log("Log files are not in sync.")
                //sync log files from whoever has a higher index
                if (vismin_log_index < main_vismin_log_index){
                    try{
                        await startTransaction(vismin_db);
                        //sync main_db vismin log file to vismin_db log file
                        [rows] = await main_db.execute(`SELECT * FROM vismin_log WHERE id > ?`, [vismin_log_index]);
                        console.log(rows)
                        const temp = rows
                        for(let row of temp){
                            console.log("adding row" + row.id)
                            await vismin_db.execute(`INSERT INTO vismin_log (id, log_entry) VALUES (?,?)`, [row.id, row.log_entry]);
                        }
                        await endTransaction(vismin_db);
                        console.log("Synced main_db to vismin_db complete")
                        } catch(err){
                            console.error(`Error syncing main_db to vismin_db: ${err.message}`);
                            await endTransaction(vismin_db, 'ROLLBACK');
                        }
                } 
                else {
                    try{
                        await startTransaction(main_db);
                        //sync main_db vismin log file to vismin_db log file
                        [rows] = await vismin_db.execute(`SELECT * FROM vismin_log WHERE id > ?`, [main_vismin_log_index]);
                        const temp = rows
                        for(let row of temp){
                            console.log("adding row" + row.id)
                            await main_db.execute(`INSERT INTO vismin_log (id, log_entry) VALUES (?,?)`, [row.id, row.log_entry]);
                        }
                        await endTransaction(main_db);
                        console.log("Synced main_db to vismin_db complete")
                        } catch(err){
                            console.error(`Error syncing main_db to vismin_db: ${err.message}`);
                            await endTransaction(main_db, 'ROLLBACK');
                        }
                }
            }
            else {
                console.log("Log files are already in sync.");
            }
        }
    }
}

//executes all queries in log files that havent been done yet
export async function syncApptstoLogFiles(pool, prev_index, table_name){
    let rows = [];
    try{
        //get all log entries that have not been executed yet
        [rows] = await pool.execute(`SELECT * FROM ${table_name}_log WHERE id > ?`, [prev_index]);
        console.log(rows)
    } catch(err){
        console.error(`Error syncing log files to appointments: ${err.message}`);
    }
        //execute all log entries
    const temp = rows
    for(let row of temp){
            console.log("executing row " + row.id + " " + row.log_entry)
        try{
        await pool.execute(row.log_entry);
        } catch(err){
            console.error(`Error executing log entry: ${err.message}`);
        }
    }
}

export default {
    editDatabase,
    checkConnection,
    syncLogFiles,
    syncApptstoLogFiles,
    getLogFileIndex,
    searchAppointment,
    addAppointment,
    deleteAppointment
}