import mysql from 'mysql2'

import { main_db, luzon_db, vismin_db } from './db_connections.js'

export async function syncLogFiles(){
    //ping servers

    //if main_db is up

        //if luzon_db is up, sync luzon_db log file and main_db luzon log file

        //if vismin_db is up, sync vismin_db log file and main_db vismin log file
}

export async function syncDB(){
    
}