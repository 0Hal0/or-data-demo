const dotenv = require("dotenv");
const { response } = require("express");
dotenv.config();
const express = require("express");
const app = express();
const path = require("path");

const port = process.env.PORT;
const SERVICE_TYPES_URI = process.env.SERVICE_TYPES_URI
const SERVICES_URI = process.env.SERVICES_URI
const ACCESS_TOKEN = process.env.ACCESS_TOKEN
 
const baseID = process.env.AIRTABLE_BASE_ID
const servicesTableID = process.env.SERVICES_TABLE_ID
const orgTableID = process.env.ORGANIZATION_TABLE_ID

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

async function postServicesToEndpoint(orServices){
    orServices = orServices.slice(0, 3);
    for(let i=0; i < orServices.length; i++ ){
        //Post Service
        airTableService = await postService(orServices[i]);
        //Post organization
        airTableOrg = await postOrg(orServices[i], airTableService);
        //Post contacts
        
    }
}

async function postOrg(orService, airTableService){
    org = {
        fields: {
            name: orService["organization"]["name"],
            description: orService["organization"]["description"],
            website: orService["organization"]["url"],
            services: [airTableService["records"][0]["id"]]
        }
    }
    body = {records : [org]};
    airTableOrg = await postToAirtable(baseID, orgTableID, JSON.stringify(body));
}

async function postService(orService){
    service = {
        fields: {
            name: orService["name"],
            description: orService["description"],
            url: orService["url"],
            email: orService["email"],
            status: orService["status"],
            interpretation_services: orService["interpretation_services"],
            application_process : orService["application_process"],
            fees_description : orService["fees_description"],
            accreditations : orService["accreditations"],
            eligibility_description : orService["eligibility_description"],
            minimum_age : orService["minimum_age"],
            maximum_age : orService["maximum_age"],
            assured_date : orService["assured_date"],
            assurer_email : orService["assurer_email"],
        }
    }
    body = {records : [service]};
    return await postToAirtable(baseID, servicesTableID, JSON.stringify(body));
}


async function postServicesToEndpoint_old(orServices){
    var orFormatServices = orServices.map(x => (
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
    airTableServices = await postToAirtable(baseID, servicesTableID, JSON.stringify(body));
    //loop through services and post all other data.
    for(let i=0; i < orFormatServices.length; i++){
        console.log(orFormatServices[i]["id"]);
    }
}



async function postToAirtable(baseID, tableID, body){
    airTableUrl = "https://api.airtable.com/v0";
    result = await fetch(airTableUrl + "/" + baseID + "/" + tableID,
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
    return result
}

app.listen(port, () => console.log(`Listending on port ${port}`));