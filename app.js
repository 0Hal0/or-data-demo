const dotenv = require("dotenv");
const { response } = require("express");
dotenv.config();
const express = require("express");
const app = express();
const path = require("path");

const port = process.env.PORT;
SERVICE_TYPES_URI = process.env.SERVICE_TYPES_URI
SERVICES_URI = process.env.SERVICES_URI
ACCESS_TOKEN = process.env.ACCESS_TOKEN

app.use(express.urlencoded({ extended: true}));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/html/index.html");
    res.status(200);
});

app.post("/:type", (req, res) =>{
    let type = req.params.type;
    try{
        update(type);
    }catch(error){
        res.status(500);
        res.send(error);
    }
    res.status(201);
    res.send("Success");
})

async function update(type){
    services = await getServicesOfType(type);

    postServicesToEndpoint(services);
}

async function getServicesOfType(type){
    services = await fetch(SERVICES_URI + String(type));
    services = await services.json();
    services = services["content"]
    return services;
}

function convertStatus(status){
    statusDict = {
        active: "Active",
        inactive: "Inactive",
    }
    return statusDict[status];
}

function removeHTMLTags(text){
    //To Implement
    return text;
}

async function postServicesToEndpoint(services){
    baseID = "app2aHT8MrG4nYq4H";
    servicesTableID = "tblHXa2jQ3OHjfczf";
    var orFormatServices = services.map(x => (
        {
            fields: 
            {
                name: x.name,
                description: x.description,
                url: x.url,
                email: x.email,
                status: convertStatus(x.status),
                //programs?
                //organizations: x.organization.id
            }}))
    if(orFormatServices.length > 10){
        orFormatServices = orFormatServices.slice(0, 10);
    }
    console.log(orFormatServices);
    body = {records: orFormatServices};
    console.log(body);
    response = await postToAirtable(baseID, servicesTableID, JSON.stringify(body));
    //loop through services and post all other data.
}



async function postToAirtable(baseID, tableID, body){
    airTableUrl = "https://api.airtable.com/v0";
    response = await fetch(airTableUrl + "/" + baseID + "/" + tableID,
    {
        method: "POST",
        headers: new Headers({
            "Authorization": "Bearer " + ACCESS_TOKEN,
            "Content-Type": "application/json"
        }),
        body: body
    })
    .then((response) => response.json())
    .then((data) => {
        return data;
    })
    .catch((error) => {
        console.log(error);
        throw error;
    })
    return response
}

app.listen(port, () => console.log(`Listending on port ${port}`));