import mysql from 'mysql2'

import { main_db, luzon_db, vismin_db } from './db_connections.js'

export async function checkConnection(){
    const servers = [main_db, luzon_db, vismin_db];

    for (const server of servers) {
        server.query('SELECT 1', (error, results) => {
            if (error) {
                console.error(`Error executing query on server: ${error.message}`);
            } else {
                console.log(`Successfully pinged server ${server.config.database}.`);
            }
        });
    }
}

export async function syncLogFiles(){
    //ping servers

    //if main_db is up

        //if luzon_db is up, sync luzon_db log file and main_db luzon log file

        //if vismin_db is up, sync vismin_db log file and main_db vismin log file
}

export async function syncDBtoLogFiles(){
    
}

export default {
    checkConnection,
    syncLogFiles,
    syncDBtoLogFiles
}