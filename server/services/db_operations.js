import mysql from 'mysql2'

import { main_db, luzon_db, vismin_db } from './db_connections.js'

// Modified executeSQL function to handle transactions with an array of SQL statements 
export async function startTransaction(pool, isolation = 'READ COMMITTED') {
    await pool.query(`SET SESSION TRANSACTION ISOLATION LEVEL ${isolation};`)
    await pool.query(`START TRANSACTION;`)
    await pool.query(`BEGIN;`)
}

export async function endTransaction(pool, status = 'COMMIT'){
    await pool.query(`${status};`)
    await pool.query(`END;`)
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

//called whenever any query is executed; updates log file with the query executed
export async function updateLogFile(serverlog, query){
    statuses = checkConnection();
    if(serverlog === 'luzon') {
        if(statuses.main_status && statuses.luzon_status){
            syncLogFiles('luzon') //sync log files, then update main

            // get latest index on log table for luzon_db
            let logFileIndex = getLogFileIndex('luzon');
            // increment index
            logFileIndex++;
            //update main log file
            await main_db.query(`INSERT INTO luzon_log (log_file_index, log_file) VALUES (${logFileIndex}, ${query})`);
            //update luzon log file
            await luzon_db.query(`INSERT INTO luzon_log (log_file_index, log_file) VALUES (${logFileIndex}, ${query})`);
        }
        else if (statuses.main_status){
            //update main log file
            let logFileIndex = getLogFileIndex('main_luzon');
            logFileIndex++;
            await main_db.query(`INSERT INTO luzon_log (log_file_index, log_file) VALUES (${logFileIndex}, ${query})`);
        }
        else if (statuses.luzon_status){
            //update luzon log file
            let logFileIndex = getLogFileIndex('luzon');
            logFileIndex++;
            await luzon_db.query(`INSERT INTO luzon_log (log_file_index, log_file) VALUES (${logFileIndex}, ${query})`);
        }
    }
    else if (serverlog === 'vismin') {
        if(statuses.main_status && statuses.vismin_status){
            syncLogFiles('vismin') //sync log files, then update main
            
            // get latest index on log table for vismin_db
            let logFileIndex = getLogFileIndex('vismin');
            // increment index
            logFileIndex++;
            //update main log file
            await main_db.query(`INSERT INTO vismin_log (log_file_index, log_file) VALUES (${logFileIndex}, ${query})`);
            //update vismin log file
            await vismin_db.query(`INSERT INTO vismin_log (log_file_index, log_file) VALUES (${logFileIndex}, ${query})`);
        }
        else if (statuses.main_status){
            //update main log file
            let logFileIndex = getLogFileIndex('main_vismin');
            logFileIndex++;
            await main_db.query(`INSERT INTO vismin_log (log_file_index, log_file) VALUES (${logFileIndex}, ${query})`);
        }
        else if (statuses.vismin_status){
            //update vismin log file
            let logFileIndex = getLogFileIndex('vismin');
            logFileIndex++;
            await vismin_db.query(`INSERT INTO vismin_log (log_file_index, log_file) VALUES (${logFileIndex}, ${query})`);
        }
    }
}

//get latest index on log table for a specific server
export async function getLogFileIndex(serverlog){
    statuses = checkConnection();
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
            let luzon_log_index = getLogFileIndex('luzon');
            let main_luzon_log_index = getLogFileIndex('main_luzon');
            let rows = [];

            // If not sync, sync log files
            if (luzon_log_index !== main_luzon_log_index){
                //sync log files from whoever has a higher index
                if (luzon_log_index > main_luzon_log_index){
                    startTransaction(main_db)
                    // select the luzon_db log file and insert it into main_db luzon log file
                    [rows] = await luzon_db.query(`SELECT * FROM luzon_log WHERE id > ${main_luzon_log_index}`);
                    for (let i = 0; i < rows.length; i++){
                        [rows] = await main_db.query(`INSERT INTO luzon_log (id, log_entry) VALUES (${rows[i].id}, ${rows[i].log_entry})`);
                    }
                    endTransaction(main_db)
                } else {
                    //sync main_db luzon log file to luzon_db log file
                    [rows] = await main_db.query(`SELECT * FROM luzon_log WHERE id > ${luzon_log_index}`);
                    for (let i = 0; i < rows.length; i++){
                        [rows] = await luzon_db.query(`INSERT INTO luzon_log (id, log_entry) VALUES (${rows[i].id}, ${rows[i].log_entry})`);
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
            let vismin_log_index = null;
            let main_vismin_log_index = null;
            let rows = [];

            // Get latest index on log table for vismin_db and main_db
            [rows] = getLogFileIndex('vismin');
            if (rows.length === 0){
                vismin_log_index = 0;
            } else if (rows.length === 1) {
                vismin_log_index = rows[0].id;
            }
            [rows] = getLogFileIndex('main_vismin');
            if (rows.length === 0){
                main_vismin_log_index = 0;
            } else if (rows.length === 1) {
                main_vismin_log_index = rows[0].id;
            }
            
            // If not sync, sync log files
            if (vismin_log_index !== main_vismin_log_index){
                //sync log files from whoever has a higher index
                if (vismin_log_index > main_vismin_log_index){
                    // select the vismin_db log file and insert it into main_db vismin log file
                    [rows] = await vismin_db.query(`SELECT * FROM vismin_log WHERE id > ${main_vismin_log_index}`);
                    for (let i = 0; i < rows.length; i++){
                        [rows] = await main_db.query(`INSERT INTO vismin_log (id, log_entry) VALUES (${rows[i].id}, ${rows[i].log_entry})`);
                    }
                } else {
                    //sync main_db vismin log file to vismin_db log file
                    [rows] = await main_db.query(`SELECT * FROM vismin_log WHERE id > ${vismin_log_index}`);
                    for (let i = 0; i < rows.length; i++){
                        [rows] = await vismin_db.query(`INSERT INTO vismin_log (id, log_entry) VALUES (${rows[i].id}, ${rows[i].log_entry})`);
                    }
                }
            }
        }
    }
}

export async function syncDBtoLogFiles(){
    //check 
}

export default {
    checkConnection,
    syncLogFiles,
    syncDBtoLogFiles,
    getLogFileIndex
}