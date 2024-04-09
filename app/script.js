searchBtn = document.getElementById('searchBtn');
createBtn = document.getElementById('createBtn');
closeAddApptBtn = document.getElementById('closeAddApptBtn');
closeEditApptBtn = document.getElementById('closeEditApptBtn');

// Set the date input to today
document.getElementById('QueueDate').valueAsDate = new Date();

// Search for appointments
document.getElementById('searchInput').addEventListener('input', function() {
    var input = this.value;
    var regex = /^[0-9a-fA-F]{32}$/;
    if (regex.test(input) || input.length == 0 || input.length == 32) {
        document.getElementById('error-message-search').style.display = 'none';
        searchBtn.disabled = false;
    } else {
        document.getElementById('error-message-search').style.display = 'block';
        searchBtn.disabled = true;
    }
});

searchBtn.addEventListener('click', async function() {
    // Get the search input value
    searchInput = document.getElementById('searchInput').value;
    // Clear the table
    document.getElementById('resultsCount').innerHTML = '';
    clearTable();
    // Open the spinner
    document.getElementById('query-load-spinner').style.display = 'flex';

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
    document.getElementById('query-load-spinner').style.display = 'none';
    // Update number of results
    if (searchResults.length > 1) {
        document.getElementById('resultsCount').innerHTML = `${searchResults.length} records found.`;
    } else {
        document.getElementById('resultsCount').innerHTML = `${searchResults.length} record found.`;
    }
    const table = document.getElementById('resultTable');

    if (searchResults.length > 0) {
        for (i = 0; i < 10; i++) {
            // Create a new row
            const newRow = table.insertRow();
            // Insert cells
            Object.keys(searchResults[i]).forEach((key, index) => {
                if (key != 'Region') {
                    const newCell = newRow.insertCell();
                    newCell.textContent = searchResults[i][key];

                    // If QueueDate, make it a date
                    if (key == 'QueueDate') {
                        newCell.textContent = new Date(searchResults[i][key]).toLocaleDateString();
                    }

                    // If Virtual, make it show Yes or No
                    if (key == 'Virtual') {
                        if (searchResults[i][key] == 1) {
                            newCell.textContent = 'Yes';
                        } else {
                            newCell.textContent = 'No';
                        }
                    }
                }   
            });

            // Insert a delete and edit button
            const deleteCell = newRow.insertCell();
            const editCell = newRow.insertCell();
    
            const deleteBtn = document.createElement('button');
            deleteBtn.addEventListener('click', deleteEventListener);
            // Make Delete button just an icon
            deleteBtn.style.display = 'flex';
            deleteBtn.style.justifyContent = 'center';
            deleteBtn.style.alignItems = 'center';
            deleteBtn.style.height = '100%';
            deleteBtn.style.width = '100%';
            deleteBtn.className = 'btn btn-danger bi bi-trash3';

            const editBtn = document.createElement('button');
            editBtn.addEventListener('click', editEventListener);
            // Make Edit button just an icon
            editBtn.style.display = 'flex';
            editBtn.style.justifyContent = 'center';
            editBtn.style.alignItems = 'center';
            editBtn.style.height = '100%';
            editBtn.style.width = '100%';
            editBtn.className = 'btn btn-dark bi bi-pencil-square';

            deleteCell.appendChild(deleteBtn);
            editCell.appendChild(editBtn);
        }
    }

    // If no results found
    if (table.rows.length == 1) {
        const newRow = table.insertRow();
        const newCell = newRow.insertCell();
        newCell.textContent = 'No results found.';
        for (i = 0; i < 11; i++) {
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
    var regex = /^[0-9a-fA-F]{32}$/;
    if (regex.test(input) || input.length == 0 || input.length == 32) {
        document.getElementById('error-message-appt').style.display = 'none';
        document.getElementById('addApptBtn').disabled = false;
    } else {
        document.getElementById('error-message-appt').style.display = 'block';
        document.getElementById('addApptBtn').disabled = true;
    }
});

document.getElementById('patientID').addEventListener('input', function() {
    var input = this.value;
    var regex = /^[0-9a-fA-F]{32}$/;
    if (regex.test(input) || input.length == 0 || input.length == 32) {
        document.getElementById('error-message-px').style.display = 'none';
        document.getElementById('addApptBtn').disabled = false;
    } else {
        document.getElementById('error-message-px').style.display = 'block';
        document.getElementById('addApptBtn').disabled = true;
    }
});

document.getElementById('doctorID').addEventListener('input', function() {
    var input = this.value;
    var regex = /^[0-9a-fA-F]{32}$/;
    if (regex.test(input) || input.length == 0 || input.length == 32) {
        document.getElementById('error-message-doc').style.display = 'none';
        document.getElementById('addApptBtn').disabled = false;
    } else {
        document.getElementById('error-message-doc').style.display = 'block';
        document.getElementById('addApptBtn').disabled = true;
    }
});


document.getElementById('add-appointment-form').addEventListener('submit', async function(event) {
    // Prevent the form from submitting
    event.preventDefault();
    // Open the spinner
    document.getElementById('query-load-spinner-edit').style.display = 'flex';
    document.getElementById('add-appointment-form').style.display = 'none';

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
    document.getElementById('query-load-spinner-edit').style.display = 'none';
    document.getElementById('add-appointment-form').style.display = 'block';
    document.getElementById('add-appointment-modal-container').style.display = 'none';

    if (response.status == 200) {
        window.alert('Appointment added successfully!');
        document.getElementById('searchInput').value = data.apptid;
        searchBtn.click();
    } else {
        window.alert('Error: Appointment not added!');
    }

    // Clear the form
    this.reset();
});

// Delete Appointment
const deleteEventListener = async (e) => {
    // Replace the delete button with a spinner
    const searchInput = e.target.parentElement.parentElement.cells[0].textContent;
    // Clear the table
    document.getElementById('resultsCount').innerHTML = '';
    clearTable();
    // Open the spinner
    document.getElementById('query-load-spinner').style.display = 'flex';
    const response = await fetch('/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ searchInput })
    });

    // Kill the spinner
    document.getElementById('query-load-spinner').style.display = 'none';
    if (response.status == 200) {
        window.alert('Appointment deleted successfully!');
        searchBtn.click();
    } else {
        window.alert('Error: Appointment not found!');
    }
}

// Edit Appointment
const editEventListener = async (e) => {
    // Set the values of the edit form
    const cells = e.target.parentElement.parentElement.cells;
    document.getElementById('editAppointmentID').value = cells[0].textContent;
    document.getElementById('editPatientID').value = cells[1].textContent;
    document.getElementById('editDoctorID').value = cells[2].textContent;
    document.getElementById('editStatus').value = cells[3].textContent;
    // Set the date input to the date
    document.getElementById('editQueueDate').value = new Date(cells[4].textContent).toISOString().split('T')[0];
    document.getElementById('editType').value = cells[5].textContent;
    // For boolean values, 1 is true and 0 is false
    if (cells[6].textContent == 'Yes') {
        document.getElementById('editVirtual').value = true;
    } else {
        document.getElementById('editVirtual').value = false;
    }
    document.getElementById('editHospitalname').value = cells[7].textContent;
    document.getElementById('editCity').value = cells[8].textContent;
    document.getElementById('editProvince').value = cells[9].textContent;
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
        // Remove the edit prefix
        key = key.slice(4);
        data[key] = value;
    });
    // Open the spinner
    document.getElementById('query-load-spinner-edit').style.display = 'flex';
    document.getElementById('edit-appointment-form').style.display = 'none';
    // Connect to the route
    const response = await fetch('/edit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    // Close the modal
    document.getElementById('query-load-spinner-edit').style.display = 'none';
    document.getElementById('edit-appointment-form').style.display = 'block';
    document.getElementById('edit-appointment-modal-container').style.display = 'none';

    if (response.status == 200) {
        window.alert('Appointment edited successfully!');
        // Search for appointments
        document.getElementById('searchInput').value = data.apptid;
        searchBtn.click();
    } else {
        window.alert('Error: Appointment not found!');
    }

    // Clear the form
    this.reset();
});
