const mysql = require("mysql2");

export const main_db = mysql.createPool({
    host: "ccscloud.dlsu.edu.ph",
    port: 20138,
    user: "raffy",
    password: "1234",
    database: "apptdb",
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
    port: 20139,
    user: "raffy",
    password: "1234",
    database: "apptdb_vismin",
    multipleStatements: true
});