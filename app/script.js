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
    document.getElementById('statusContainer').style.display = 'none';
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
    var transactionCase = document.getElementById('transactionCase').value;
    var sqlQuery = "START TRANSACTION;\n";

    if (apptid.length != 32) {
        apptid = '36C06783A17B16926851B65EC9B151DA';
        if (transactionCase == '3' || transactionCase == '4') {
            apptid = 'AAAABBBBCCCCDDDDAAAABBBBCCCCDDDD';
        }
    }

    // Read
    if (transactionCase == '1') {
        sqlQuery += "SELECT apptid, status\nFROM apptdb.appointments\nWHERE apptid = '" + apptid + "';\n";
    }
    // Update
    else if (transactionCase == '2') {
        sqlQuery += "UPDATE apptdb.appointments\nSET status = '" + status + "'\nWHERE apptid = '" + apptid + "';\n";
    }
    // Phantom Read
    else if (transactionCase == '3') {
        sqlQuery += "INSERT INTO apptdb.appointments (apptid) VALUES ('" + apptid + "');\n";
    }
    else if (transactionCase == '4') {
        sqlQuery += "DELETE FROM apptdb.appoitnments\nWHERE apptid = '" + apptid + "';\n";
    }

    sqlQuery += "COMMIT;";
    document.getElementById('transaction1').value = sqlQuery;
};

// Show default transaction depending on transaction type
document.getElementById('transactionCase').onchange = function() {
    var transactionCase = document.getElementById('transactionCase').value;
    var apptid = document.getElementById('transactionId');
    var status = document.getElementById('transactionStatus').value;
    apptid.placeholder = '36C06783A17B16926851B65EC9B151DA';

    if (transactionCase == '1') {
        document.getElementById('statusContainer').style.display = 'none';
    }
    else if (transactionCase == '2') {
        document.getElementById('statusContainer').style.display = 'block';
        status = 'NoShow';
    }
    else if (transactionCase == '3') {
        document.getElementById('statusContainer').style.display = 'none';
        apptid.placeholder = 'AAAABBBBCCCCDDDDAAAABBBBCCCCDDDD';
    }
    else if (transactionCase == '4') {
        document.getElementById('statusContainer').style.display = 'none';
        apptid.placeholder = 'AAAABBBBCCCCDDDDAAAABBBBCCCCDDDD';
    }

    document.getElementById('transactionStatus').value = status;
    customizeTransactionBtn.click();
};

// Submit form
concurrencyForm.onsubmit = async function(event) {
    event.preventDefault();
    resetTable();
    document.getElementById('submitConcurrency').disabled = true;
    document.getElementById('customizeTransaction').disabled = true;
    document.getElementById('no-query-desc').style.display = 'none';
    document.getElementById('query-load-spinner').style.display = 'flex';

    const transaction = { transaction: document.getElementById('transaction1').value };

    const response = await fetch('/execute-query', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(transaction)
    });

    const data = await response.json();
    console.log(data)
    
    // Build table
    const results = data.results;
    const table = document.getElementById('resultTable');
    const header = table.createTHead();


    document.getElementById('submitConcurrency').disabled = false;
    document.getElementById('customizeTransaction').disabled = false;
    document.getElementById('query-load-spinner').style.display = 'none';
    document.getElementById('sql-table-container').style.display = 'flex';
};

// Helper function to clear table
function resetTable() {
    // Remove all rows and columns
    var table = document.getElementById('resultTable');
    table.innerHTML = '';
}