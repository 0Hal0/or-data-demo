const { debug } = require("console");
const dotenv = require("dotenv");
const { response } = require("express");
dotenv.config();
const express = require("express");
const app = express();
const path = require("path");

const port = process.env.PORT;
const SERVICE_TYPES_URI = process.env.SERVICE_TYPES_URI;
const SERVICES_URI = process.env.SERVICES_URI;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const SINGLE_SERVICE_URI = process.env.SINGLE_SERVICE_URI;
 
const baseId = process.env.AIRTABLE_BASE_ID;
const servicesTableId = process.env.SERVICES_TABLE_ID;
const orgTableId = process.env.ORGANIZATION_TABLE_ID;

app.use(express.urlencoded({ extended: true}));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const orController = require(__dirname + "/controllers/or-data.controller.js");

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/html/index.html");
    res.status(200);
});

app.post("/:type", async (req, res) =>{
    let type = req.params.type;
    try{
        await orController.updateTables(type);
        res.status(201);
        res.send("Success");
    }catch(error){
        res.status(500);
        res.send(error);
        console.log(error);
    }

})

app.delete("/all", async (req, res) =>{
    try{
        await orController.clearBase();
        res.status(200);
        res.send("Success");
    }catch(error){
        console.log(error);
        res.status(500);
        res.send(error);
    }
})



app.listen(port, () => console.log(`Listending on port ${port}`));