const express = require("express"); 
const app = express(); // Initializing Express App

app.get("/", (req, res)=>{
    res.send('Hello World'); 
});

app.listen(3000, ()=> console.log("App Listening on port 3000"));