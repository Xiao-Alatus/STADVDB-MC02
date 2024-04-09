const express = require("express"); 
const route = require('../routes/route');

const app = express();

// Middleware
app.use(express.json());

// Route
app.use('/', route);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});