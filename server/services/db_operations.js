import mysql from 'mysql2'

import { main_db, luzon_db, vismin_db } from './db_connections.js'

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
export async function updateLogFile(serverlog){
    //sync log files
    syncLogFiles(serverlog)
    if(serverlog === 'luzon') {
        
    }
    else if (serverlog === 'vismin') {

    }
}

//get latest index on log table for a specific server
export async function getLogFileIndex(serverlog){
    let logFileIndex = null;
    if (serverlog === 'main_luzon') {
        logFileIndex = await main_db.query('SELECT id FROM luzon_log ORDER BY id DESC LIMIT 1');
    } else if (serverlog === 'main_vismin') {
        logFileIndex = await main_db.query('SELECT id FROM vismin_log ORDER BY id DESC LIMIT 1');
    } else if (serverlog === 'luzon') {
        logFileIndex = await main_db.query('SELECT id FROM luzon_log ORDER BY id DESC LIMIT 1');
    } else if (serverlog === 'vismin') {
        logFileIndex = await main_db.query('SELECT id FROM vismin_log ORDER BY id DESC LIMIT 1');
    }
    return logFileIndex[0].log_file_index;
}

export async function syncLogFiles(choice = "all"){
    //ping servers
    const statuses = await checkConnection();

    //if main_db is up
    if (statuses.main_status){
        //if luzon_db is up, sync luzon_db log file and main_db luzon log file
        if (statuses.luzon_status && (choice === "all" || choice === "luzon")){
            //sync luzon_db log file and main_db luzon log file
            console.log("deez")
        }
        //if vismin_db is up, sync vismin_db log file and main_db vismin log file
        if (statuses.vismin_status && (choice === "all" || choice === "vismin")){
            //sync vismin_db log file and main_db vismin log file
            console.log("nuts")
        }
    }
}

export async function syncDBtoLogFiles(){
    //check 
}

export default {
    checkConnection,
    syncLogFiles,
    syncDBtoLogFiles
}