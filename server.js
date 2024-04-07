const express = require("express"); 
const app = express(); // Initializing Express App

app.use(express.static(__dirname + '/app'));

app.get("/", (req, res)=>{
    // open index.html
    res.sendFile(__dirname + '/app/index.html');
});

app.get("/read/:id", (req, res)=>{
    res.send('read path'); 
});

app.post("/insert/:id", (req, res)=>{
    res.send('insert path'); 
});

app.patch("/update/:id", (req, res)=>{
    res.send('update path'); 
});

app.delete("/delete/:id", (req, res)=>{
    res.send('delete path'); 
});

app.listen(3000, ()=> console.log("App Listening on port 3000"));