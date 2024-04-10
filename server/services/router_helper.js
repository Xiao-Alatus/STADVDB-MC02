import operation from '../services/db_operations.js';
import { main_db, luzon_db, vismin_db } from '../services/db_connections.js';

export async function searchAppointment(apptid) {
    
    // Store the rows from the database
    let rows = []

    // Try main
    try {
        // Begin the search
        await operation.startTransaction('main_db');
        await main_db.query(`DO SLEEP (5);`);
        [rows] = await main_db.execute(`SELECT * FROM appointments WHERE apptid = '?'`, [apptid]);
        await operation.endTransaction('main_db');

        console.log(rows);
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
            // Replicate (Sync the log files)
            const luzon_repl = await operation.syncLogFiles("luzon");
            // Return if the replication fails
            if (luzon_repl.error) {
                return luzon_repl;
            }

            // Begin the search
            await operation.startTransaction('luzon_db');
            await luzon_db.query(`DO SLEEP (5);`);
            [luzonRows] = luzon_db.execute(`SELECT * FROM appointments WHERE apptid = ?`, [apptid]);
            await operation.endTransaction('luzon_db');
            
        } catch (error) {
            console.log("Error in luzon: " + error);
            return { error: 'No appointment found' };
        }

        // Vismin
        try {
            // Replicate (Sync the log files)
            const vismin_repl = await operation.syncLogFiles("vismin");
            // Return if the replication fails
            if (vismin_repl.error) {
                return vismin_repl;
            }

            // Begin the search
            await operation.startTransaction('vismin_db');
            await vismin_db.query(`DO SLEEP (5);`);
            [visminRows] = vismin_db.execute(`SELECT * FROM appointments WHERE apptid = ?`, [apptid]);
            await operation.endTransaction('vismin_db');
            
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

export default { searchAppointment };