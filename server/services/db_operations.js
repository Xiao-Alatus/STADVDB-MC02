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
    statuses = await checkConnection();
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

export async function syncDBtoLogFiles(){
    //check 
}

export default {
    checkConnection,
    syncLogFiles,
    syncDBtoLogFiles,
    getLogFileIndex
}