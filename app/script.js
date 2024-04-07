// Change color of buttons
concurrencyBtn = document.getElementById('simTypeBtn1');
recoveryBtn = document.getElementById('simTypeBtn2');

// Forms
concurrencyForm = document.getElementById('concurrencyForm');

// Customize transaction buttons
customizeTransactionBtn = document.getElementById('customizeTransaction');

concurrencyBtn.onclick = function() {
    concurrencyBtn.style.backgroundColor = '#0D6EFD';
    recoveryBtn.style.backgroundColor = '#6C757D';
    concurrencyBtn.disabled = true;
    recoveryBtn.disabled = false;
    document.getElementById('concurrencyFormContainer').style.display = 'block';
};

recoveryBtn.onclick = function() {
    recoveryBtn.style.backgroundColor = '#0D6EFD';
    concurrencyBtn.style.backgroundColor = '#6C757D';
    recoveryBtn.disabled = true;
    concurrencyBtn.disabled = false;
    document.getElementById('concurrencyFormContainer').style.display = 'none';
};

// On-load
window.onload = function() {
    document.getElementById('transactionId').placeholder = '36C06783A17B16926851B65EC9B151DA';
    customizeTransactionBtn.click();
};

// For Appt ID
document.getElementById('transactionId').addEventListener('input', function() {
    var input = this.value;
    var regex = /^[0-9a-fA-F]{32}$/;
    if (regex.test(input) || input.length == 0) {
        document.getElementById('error-message').style.display = 'none';
        document.getElementById('submitConcurrency').disabled = false;
        customizeTransactionBtn.disabled = false;
    } else {
        document.getElementById('error-message').style.display = 'block';
        document.getElementById('submitConcurrency').disabled = true;
        customizeTransactionBtn.disabled = true;
    }
});

// For Transaction display
customizeTransactionBtn.onclick = function() {
    var status = document.getElementById('transactionStatus').value;
    var apptid = document.getElementById('transactionId').value;
    var sideEffect = document.getElementById('sideEffect').value;
    var sqlQuery = '';

    if (apptid.length != 32) {
        apptid = '36C06783A17B16926851B65EC9B151DA';
        if (sideEffect == '3') {
            apptid = 'AAAABBBBCCCCDDDDAAAABBBBCCCCDDDD';
        }
        sqlQuery += "/* Default apptid */\n";
    }

    // Construct the SQL query T1
    sqlQuery += "START TRANSACTION;\n";

    // Dirty Read
    if (sideEffect == '1') {
        sqlQuery += "UPDATE appointments\nSET status = '" + status + "'\nWHERE apptid = '" + apptid + "';\n";
        sqlQuery += "DO SLEEP (5);\n";
    }
    // Non-Repeatable Read
    else if (sideEffect == '2') {
        sqlQuery += "SELECT *\nFROM appointments\nWHERE apptid = '" + apptid + "';\n";
        sqlQuery += "DO SLEEP (7);\n";
        sqlQuery += "SELECT *\nFROM appointments\nWHERE apptid = '" + apptid + "';\n";
    }
    // Phantom Read
    else if (sideEffect == '3') {
        sqlQuery += "INSERT INTO appointments (apptid) VALUES ('" + apptid + "');\n";
    }

    sqlQuery += "COMMIT;";
    document.getElementById('transaction1').value = sqlQuery;

    // Construct the SQL query T2
    var sqlQuery2 = "START TRANSACTION;\n";

    if (sideEffect == '1') {
        sqlQuery2 += "SELECT status\nFROM appointments\nWHERE apptid = '" + apptid + "';\n";
    }
    else if (sideEffect == '2') {
        sqlQuery2 += "UPDATE appointments\nSET status = 'NoShow'\nWHERE apptid = '" + apptid + "';\n";
    }
    else if (sideEffect == '3') {
        sqlQuery2 += "SELECT COUNT(apptid)\nFROM appointments;\n";
        sqlQuery2 += "DO SLEEP (7);\n";
        sqlQuery2 += "SELECT COUNT(apptid)\nFROM appointments;\n";
    }

    sqlQuery2 += "COMMIT;";
    document.getElementById('transaction2').value = sqlQuery2;
};

// Show default transaction depending on side effect
document.getElementById('sideEffect').onchange = function() {
    var sideEffect = document.getElementById('sideEffect').value;
    var apptid = document.getElementById('transactionId');
    var status = document.getElementById('transactionStatus').value;
    apptid.placeholder = '36C06783A17B16926851B65EC9B151DA';

    if (sideEffect == '1') {
        document.getElementById('statusContainer').style.display = 'block';
        status = 'Complete';
    }
    else if (sideEffect == '2') {
        document.getElementById('statusContainer').style.display = 'block';
        status = 'NoShow';
    }
    else if (sideEffect == '3') {
        document.getElementById('statusContainer').style.display = 'none';
        apptid.placeholder = 'AAAABBBBCCCCDDDDAAAABBBBCCCCDDDD';
    }

    document.getElementById('transactionStatus').value = status;
    customizeTransactionBtn.click();
};