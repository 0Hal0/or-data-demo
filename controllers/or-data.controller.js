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
const serviceAtLocationsTableId = process.env.SERVICE_AT_LOCATIONS_TABLE_ID;
const schedulesTableId = process.env.SCHEDULES_TABLE_ID;
const locationsTableId = process.env.LOCATIONS_TABLE_ID;

exports.updateTables = async (type) => {
    services = await getServicesOfType(type);

    postServicesToEndpoint(services);
}

exports.clearBase = async () => {
    tables = [
        servicesTableId,
        orgTableId, 
        contactsTableId, 
        phonesTableId, 
        serviceAtLocationsTableId,
        schedulesTableId,
        locationsTableId,
    ]
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
        airTableService = airTableService["records"][0];
        //Post organization
        airTableOrg = await postOrg(orService, airTableService);
        airTableOrg = airTableOrg["records"][0];
        airTableService["organization"] = airTableOrg;
        //Post contact
        airTableContacts = await postContactsAndPhones(orService, airTableService);
        if (airTableContacts != null){
            airTableService["contacts"] = airTableContacts;
        }else{ airTableService["contacts"] = []; }
        
        //Post service_at_location info
        await postServiceAtLoction(orService, airTableService);
    }
}

async function postServiceAtLoction(orService, airTableService){
    serviceAtLocations = orService["service_at_locations"]
    for(let i = 0; i < serviceAtLocations.length; i++){
        contacts = []
        phones = []
        for(let x = 0; x < airTableService["contacts"].length; x++){
            contacts.push(airTableService["contacts"][x]["id"])
            for(let y = 0; y < airTableService["contacts"][x]["phones"].length; y++){
                phones.push(airTableService["contacts"][x]["phones"][y]["id"])
            }
        }
        serviceAtLocation = {
            fields: {
                description: serviceAtLocations[i].description,
                services: [airTableService["id"]],
                phones: phones,
                contacts : contacts,
            }
        }
        body = {records : [serviceAtLocation]};
        airTableServiceAtLocation = await postToAirtable(baseId, serviceAtLocationsTableId, JSON.stringify(body));
        airTableServiceAtLocation = airTableServiceAtLocation["records"][0];

            
        //schedules
        schedule = serviceAtLocations[i]["regular_schedule"][0];
        schedule["services"] = [airTableService["id"]]
        schedule["service_at_location"] = [airTableServiceAtLocation["id"]];
        schedule["closes_at"] = convertTime(schedule["closes_at"]);
        schedule["opens_at"] = convertTime(schedule["opens_at"]);
        delete schedule["id"]
        schedule = removeNullFields(schedule);
        body = {records : [{fields : schedule}]};
        airTableSchedule = await postToAirtable(baseId, schedulesTableId, JSON.stringify(body));
        airTableSchedule = airTableSchedule["records"][0];
        //locations
        location = {
            fields: {
                name: serviceAtLocations[i]["location"]["name"],
                services: [airTableService["id"]],
                organization: [airTableService["organization"]["id"]],
                contacts: [airTableService["contacts"][0]["id"]],
                phones: [airTableService["contacts"][0]["phones"][0]["id"]],
                schedules: [airTableSchedule["id"]],
                service_at_location: [airTableServiceAtLocation["id"]],
            }
        }
        body = {records : [location]};
        airTableLocation = await postToAirtable(baseId, locationsTableId, JSON.stringify(body));
        console.log(airTableLocation);
        airTableLocation = airTableLocation["records"][0];
        console.log(airTableLocation);

    }

}

function removeNullFields(object){
    for (var key in object){
        if(object[key] == ""){
            delete object[key];
        }
    }
    return object;
}

function convertTime(time){
    return "2020-09-05T" + time + ":00";
}


async function postContactsAndPhones(orService, airTableService){
    var airTableContacts = [];
    contacts = orService["contacts"];
    for(let i = 0; i < contacts.length; i++){
        contact = {
            fields: {
                name: contacts[i].name,
                title: contacts[i].title,
                email: contacts[i].email,
                services: [airTableService["id"]],
            }
        }
        body = {records : [contact]};
        airTableContact = await postToAirtable(baseId, contactsTableId, JSON.stringify(body));
        airTableContact = airTableContact["records"][0];
        phones = contacts[i].phones;
        airTableContact["phones"] = [];
        for(let j=0; j<phones.length; j++){
            phone = {
                fields: {
                    number: phones[j].number,
                    contacts: [airTableContact["id"]],
                    services: [airTableService["id"]],
                }
            }
            body = {records : [phone]};
            airTablePhone = await postToAirtable(baseId, phonesTableId, JSON.stringify(body));
            airTablePhone = airTablePhone["records"][0];
            airTableContact["phones"].push(airTablePhone);
        }
        airTableContacts.push(airTableContact);

    }
    return airTableContacts;
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
            services: [airTableService["id"]]
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