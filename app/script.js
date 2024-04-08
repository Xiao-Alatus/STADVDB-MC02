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
    document.getElementById('query-load-spinner').style.display = 'none';
    document.getElementById('transactionId').placeholder = '36C06783A17B16926851B65EC9B151DA';
    document.getElementById('sql-table-container').style.display = 'none';
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
        sqlQuery += "UPDATE apptdb.appointments\nSET status = '" + status + "'\nWHERE apptid = '" + apptid + "';\n";
        sqlQuery += "DO SLEEP (5);\n";
    }
    // Non-Repeatable Read
    else if (sideEffect == '2') {
        sqlQuery += "SELECT *\nFROM apptdb.appointments\nWHERE apptid = '" + apptid + "';\n";
        sqlQuery += "DO SLEEP (7);\n";
        sqlQuery += "SELECT *\nFROM apptdb.appointments\nWHERE apptid = '" + apptid + "';\n";
    }
    // Phantom Read
    else if (sideEffect == '3') {
        sqlQuery += "INSERT INTO apptdb.appointments (apptid) VALUES ('" + apptid + "');\n";
    }

    sqlQuery += "COMMIT;";
    document.getElementById('transaction1').value = sqlQuery;

    // Construct the SQL query T2
    var sqlQuery2 = "START TRANSACTION;\n";

    if (sideEffect == '1') {
        sqlQuery2 += "SELECT apptid, status\nFROM apptdb.appointments\nWHERE apptid = '" + apptid + "';\n";
    }
    else if (sideEffect == '2') {
        sqlQuery2 += "UPDATE apptdb.appointments\nSET status = 'NoShow'\nWHERE apptid = '" + apptid + "';\n";
    }
    else if (sideEffect == '3') {
        sqlQuery2 += "SELECT COUNT(apptid)\nFROM apptdb.appointments;\n";
        sqlQuery2 += "DO SLEEP (7);\n";
        sqlQuery2 += "SELECT COUNT(apptid)\nFROM apptdb.appointments;\n";
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

// Submit form
concurrencyForm.onsubmit = async function(event) {
    event.preventDefault();
    document.getElementById('submitConcurrency').disabled = true;
    document.getElementById('customizeTransaction').disabled = true;
    document.getElementById('no-query-desc').style.display = 'none';
    document.getElementById('query-load-spinner').style.display = 'flex';
    const formData = extractFormData();
    const response = await fetch('/execute-query', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    });

    const data = await response.json();
    console.log(data);
    
    document.getElementById('submitConcurrency').disabled = false;
    document.getElementById('customizeTransaction').disabled = false;
    document.getElementById('query-load-spinner').style.display = 'none';
    document.getElementById('sql-table-container').style.display = 'block';
    resetTable();

    // Data for transaction 1
    var transaction1res = data.result1;
    var transaction2res = data.result2;

    var table = document.getElementById('resultTable');
    var head = table.createTHead();
    var row = head.insertRow();
    for (var key in transaction1res) {
        if(transaction1res[key][0]) {
            for (var i = 0; i < transaction1res[key].length; i++) {
                console.log(transaction1res[key][i]);
                var cell = row.insertCell();
                cell.innerHTML = key;
            }
        }
    }

    for (var key in transaction2res) {
        if (transaction2res[key][0]) {
            for (var i = 0; i < transaction2res[key].length; i++) {
                console.log(transaction2res[key][0]);
                var cell = row.insertCell();
                cell.innerHTML = key;
            }
        }
    }
};

// Helper function to take form data
function extractFormData() {
    const transaction1 = document.getElementById('transaction1').value;
    const transaction2 = document.getElementById('transaction2').value;
    const sideEffect = document.getElementById('transactionCase').value;

    return { transaction1, transaction2, sideEffect };
}

// Helper function to clear table
function resetTable() {
    var table = document.getElementById('resultTable');
    var tbody = table.querySelector('tbody');
    if (tbody) {
        tbody.innerHTML = ''; // Remove all child elements
    }
}