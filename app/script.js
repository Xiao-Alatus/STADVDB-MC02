searchBtn = document.getElementById('searchBtn');
createBtn = document.getElementById('createBtn');
closeAddApptBtn = document.getElementById('closeAddApptBtn');
closeEditApptBtn = document.getElementById('closeEditApptBtn');

// Search for appointments
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
            deleteBtn.addEventListener('click', deleteEventListener);

            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', editEventListener);

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

closeAddApptBtn.addEventListener('click', function() {
    document.getElementById('add-appointment-modal-container').style.display = 'none';
});

document.getElementById('appointmentID').addEventListener('input', function() {
    var input = this.value;
    console.log(input)
    var regex = /^[0-9a-fA-F]{32}$/;
    if (regex.test(input) || input.length == 0 || input.length == 32) {
        document.getElementById('error-message').style.display = 'none';
        document.getElementById('addApptBtn').disabled = false;
    } else {
        document.getElementById('error-message').style.display = 'block';
        document.getElementById('addApptBtn').disabled = true;
    }
});

document.getElementById('add-appointment-form').addEventListener('submit', async function(event) {
    // Prevent the form from submitting
    event.preventDefault();
    // Get the form data
    const formData = new FormData(this);
    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });
    // Connect to the route
    const response = await fetch('/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    // Close the modal
    document.getElementById('add-appointment-modal-container').style.display = 'none';

    window.alert('Appointment added successfully!');

    // Clear the form
    this.reset();
});

// Delete Appointment
const deleteEventListener = async (e) => {
    const searchInput = e.target.parentElement.parentElement.cells[0].textContent;
    const response = await fetch('/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ searchInput })
    });

    if (response.status == 200) {
        window.alert('Appointment deleted successfully!');
        e.target.parentElement.parentElement.remove();
    } else {
        window.alert('Error: Appointment not found!');
    }
}

// Edit Appointment
const editEventListener = async (e) => {
    // Set the values of the edit form
    const cells = e.target.parentElement.parentElement.cells;
    document.getElementById('editAppointmentID').value = cells[0].textContent;
    document.getElementById('editStatus').value = cells[1].textContent;
    document.getElementById('editCity').value = cells[2].textContent;
    document.getElementById('editProvince').value = cells[3].textContent;
    document.getElementById('editRegionName').value = cells[4].textContent;
    document.getElementById('edit-appointment-modal-container').style.display = 'block';
}

closeEditApptBtn.addEventListener('click', function() {
    document.getElementById('edit-appointment-modal-container').style.display = 'none';
});

document.getElementById('edit-appointment-form').addEventListener('submit', async function(event) {
    // Prevent the form from submitting
    event.preventDefault();
    // Get the form data
    const formData = new FormData(this);
    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });
    // Connect to the route
    const response = await fetch('/edit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (response.status == 200) {
        window.alert('Appointment edited successfully!');
    } else {
        window.alert('Error: Appointment not found!');
    }

    // Close the modal
    document.getElementById('edit-appointment-modal-container').style.display = 'none';

    // Search for appointments
    document.getElementById('searchInput').value = data.apptid;
    searchBtn.click();

    // Clear the form
    this.reset();
});
