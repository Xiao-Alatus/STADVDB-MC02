searchBtn = document.getElementById('searchBtn');
createBtn = document.getElementById('createBtn');

searchBtn.addEventListener('click', async function() {
    // Get the search input value
    searchInput = document.getElementById('searchInput').value;
    // Clear the table
    clearTable();

    // Connect to the route
    const response = await fetch('/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ searchInput })
    });

    const searchResults = await response.json();
    
    // Display the search results
    const table = document.getElementById('resultTable');

    if (searchResults.length > 0) {
        for (i = 0; i < 10; i++) {
            // Create a new row
            const newRow = table.insertRow();
            // Insert cells
            Object.keys(searchResults[i]).forEach((key, index) => {
                if (key == "apptid" || key == "status" || key == "City" || 
                    key == "Province" || key == "RegionName") {
                    const newCell = newRow.insertCell();
                    newCell.textContent = searchResults[i][key];
                }
            });
            // Insert a delete and edit button
            const deleteCell = newRow.insertCell();
            const editCell = newRow.insertCell();
    
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            deleteCell.appendChild(deleteBtn);
            editCell.appendChild(editBtn);
        }
    }

    // If no results found
    if (table.rows.length == 1) {
        const newRow = table.insertRow();
        const newCell = newRow.insertCell();
        newCell.textContent = 'No results found';
        for (i = 0; i < 6; i++) {
            newRow.insertCell();
        }
    }
});

function clearTable() {
    const table = document.getElementById('resultTable');
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }
}

// Add Appointment
createBtn.addEventListener('click', async function() {
    document.getElementById('add-appointment-modal-container').style.display = 'block';
});