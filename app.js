const express = require("express");
const app = express();
const path = require("path");

app.use(express.urlencoded({ extended: true}));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/html/index.html");
    res.status(200);
});

app.listen(3000, () => console.log("Listending on port 3000"));