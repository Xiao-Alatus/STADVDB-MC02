import mysql from 'mysql2/promise'

export const main_db = mysql.createPool({
    host: "ccscloud.dlsu.edu.ph",
    port: 20138,
    user: "raffy",
    password: "1234",
    database: "apptdb_main",
    multipleStatements: true
});

export const luzon_db = mysql.createPool({
    host: "ccscloud.dlsu.edu.ph",
    port: 20139,
    user: "raffy",
    password: "1234",
    database: "apptdb_luzon",
    multipleStatements: true
});

export const vismin_db = mysql.createPool({
    host: "ccscloud.dlsu.edu.ph",
    port: 20140,
    user: "raffy",
    password: "1234",
    database: "apptdb_vismin",
    multipleStatements: true
});

export default {
    main_db,
    luzon_db,
    vismin_db
}