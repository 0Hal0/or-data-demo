const dotenv = require("dotenv");

const SERVICE_TYPES_URI = process.env.SERVICE_TYPES_URI;
const SERVICES_URI = process.env.SERVICES_URI;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const SINGLE_SERVICE_URI = process.env.SINGLE_SERVICE_URI;
 
const baseId = process.env.AIRTABLE_BASE_ID;
const servicesTableId = process.env.SERVICES_TABLE_ID;
const orgTableId = process.env.ORGANIZATION_TABLE_ID;
const contactsTableId = process.env.CONTACTS_TABLE_ID;
const phonesTableId = process.env.PHONES_TABLE_ID;

exports.updateTables = async (type) => {
    services = await getServicesOfType(type);

    postServicesToEndpoint(services);
}

exports.clearBase = async () => {
    tables = [servicesTableId, orgTableId, contactsTableId, phonesTableId]
    for(let i=0;i<tables.length;i++){
        //get records
        records = await fetch("https://api.airtable.com/v0/" + baseId + "/" + tables[i],
        {
            headers: new Headers({
                "Authorization": "Bearer " + ACCESS_TOKEN,
                "Content-Type": "application/json"
            })
        });
        records = await records.json();
        //delete records
        records = records["records"];
        if (records == null){continue;}
        for(let j=0;j<records.length;j++){
            await fetch("https://api.airtable.com/v0/" + baseId + "/" + tables[i] + "/" + records[j]["id"],
            {
                method: "DELETE",
                headers: new Headers({
                    "Authorization": "Bearer " + ACCESS_TOKEN,
                    "Content-Type": "application/json"
                })
            })
            .then((response) => response.json())
            .then((data) => console.log(data))
            .catch((error) => console.log(error));
        }

    }
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
        //Get service details
        orService = await getService(orServices[i]["id"]);
        //Post Service
        airTableService = await postService(orService);
        //Post organization
        airTableOrg = await postOrg(orService, airTableService);
        //Post contact
        await postContactsAndPhones(orService, airTableService);
    }
}

async function postContactsAndPhones(orService, airTableService){
    contacts = orService["contacts"];
    for(let i = 0; i < contacts.length; i++){
        contact = {
            fields: {
                name: contacts[i].name,
                title: contacts[i].title,
                email: contacts[i].email,
                services: [airTableService["records"][0]["id"]],
            }
        }
        body = {records : [contact]};
        airTableContact = await postToAirtable(baseId, contactsTableId, JSON.stringify(body));

        phones = contacts[i].phones;
        console.log(phones);
        for(let j=0; j<phones.length; j++){
            phone = {
                fields: {
                    number: phones[j].number,
                    contacts: [airTableContact["records"][0]["id"]],
                }
            }
            body = {records : [phone]};
            phone = await postToAirtable(baseId, phonesTableId, JSON.stringify(body));
            console.log(phone);
        }

    }
}

async function getService(serviceId){
    service = await fetch(SINGLE_SERVICE_URI + serviceId)
    .then((response) => response.json())
    .then((data) => {return data;})
    .catch((error) => console.log(error))
    return service
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
    return await postToAirtable(baseId, orgTableId, JSON.stringify(body));
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
    return await postToAirtable(baseId, servicesTableId, JSON.stringify(body));
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