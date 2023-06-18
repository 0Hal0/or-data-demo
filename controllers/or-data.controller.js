const dotenv = require("dotenv");
const axios = require("axios");

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
    const tables = [
      servicesTableId,
      orgTableId,
      contactsTableId,
      phonesTableId,
      serviceAtLocationsTableId,
      schedulesTableId,
      locationsTableId,
    ];
  
    for (let i = 0; i < tables.length; i++) {
      let records = [1];
      console.log(i);
      while (records.length != 0) {
        try {
          const response = await axios.get(
            `https://api.airtable.com/v0/${baseId}/${tables[i]}`,
            {
              headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                "Content-Type": "application/json",
              },
            }
          );
          records = response.data.records;
  
          for (let j = 0; j < records.length; j++) {
            await axios.delete(
              `https://api.airtable.com/v0/${baseId}/${tables[i]}/${records[j].id}`,
              {
                headers: {
                  Authorization: `Bearer ${ACCESS_TOKEN}`,
                  "Content-Type": "application/json",
                },
              }
            );
          }
        } catch (error) {
          console.log("Error deleting record" + error.message);
          throw error;
        }
      }
    }
  
    console.log("done");
};

async function getServicesOfType(type) {
    try {
        let response = await axios.get(SERVICES_URI + String(type));
        let services = response.data.content;
        return services;
    } catch (error) {
        console.log("Error getting services of type " + String(type) + error.message);
        throw error;
    }
}

function convertStatus(status){
    statusDict = {
        active: "Active",
        inactive: "Inactive",
    }
    return statusDict[status];
}

function convertByDayField(byday){
    if (!byday){return;}
    value = [];
    if(byday.includes("MO")){
        value.push("Monday");
    }if(byday.includes("TU")){
        value.push("Tuesday");
    }if(byday.includes("WE")){
        value.push("Wednesday");
    }if(byday.includes("TH")){
        value.push("Thursday");
    }if(byday.includes("FR")){
        value.push("Friday");
    }if(byday.includes("SA")){
        value.push("Saturday");
    }if(byday.includes("SU")){
        value.push("Sunday");
    }
    return value;
}

function removeHTMLTags(text){
    //To Implement
    return text;
}

async function postServicesToEndpoint(orServices){
    orServices = orServices.slice(0, 10);
    for(let i=0; i < orServices.length; i++ ){
        //Get service details
        try{
            orService = await getService(orServices[i]["id"]);
        }catch(error){
            console.log("Error posting service " + error.message);
        }
        //Post Service
        airTableService = await postService(orService);
        airTableService = airTableService["records"][0];
        //Post organization
        try{
            airTableOrg = await postOrg(orService, airTableService);
        }catch{
            console.log("Error posting organization " + error.message);
        }
        airTableOrg = airTableOrg["records"][0];
        airTableService["organization"] = airTableOrg;
        //Post contact
        try{
            airTableContacts = await postContactsAndPhones(orService, airTableService);
        }
        catch(error){
            console.log("Error posting contacts " + error.message);
        }
        if (airTableContacts != null){
            airTableService["contacts"] = airTableContacts;
        }else{ airTableService["contacts"] = []; }
        //Post service_at_location info
        try{
            await postServiceAtLoction(orService, airTableService);
        }
        catch(error){
            console.log("Error posting service at locations " + error.message);
        }
    }
}

async function postServiceAtLoction(orService, airTableService){
    serviceAtLocations = orService["service_at_locations"]
    let postedLocationIdDict = {};
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
        airTableSchedules = await postSchedules(serviceAtLocations[i], airTableServiceAtLocation, airTableService);
        //locations
        if(!postedLocationIdDict[serviceAtLocations[i]["location"]["id"]]){
            airTableLocation = await postLocation(serviceAtLocations[i], airTableSchedules, airTableService, airTableServiceAtLocation)
            postedLocationIdDict[serviceAtLocations[i]["location"]["id"]] = {
                airTableId: airTableLocation["id"],
                airTableServiceAtLocations: [airTableServiceAtLocation["id"]],
            }
        }else{
            postedLocationIdDict[serviceAtLocations[i]["location"]["id"]]["airTableServiceAtLocations"].push(airTableServiceAtLocation["id"])
            updateLocation(serviceAtLocations[i], airTableServiceAtLocation, postedLocationIdDict);
        }
        

    }

}

async function postSchedules(serviceAtLocation, airTableServiceAtLocation){
    airTableSchedules = [];
    for (let i=0; i<serviceAtLocation["regular_schedule"].length; i++){
        schedule = serviceAtLocation["regular_schedule"][i];
        schedule["services"] = [airTableService["id"]];
        schedule["service_at_location"] = [airTableServiceAtLocation["id"]];
        schedule["closes_at"] = convertTime(schedule["closes_at"]);
        schedule["opens_at"] = convertTime(schedule["opens_at"]);
        schedule["byday"] = convertByDayField(schedule["byday"]);
        delete schedule["id"];
        schedule = removeNullFields(schedule);
        body = {records : [{fields : schedule}]};
        airTableSchedule = await postToAirtable(baseId, schedulesTableId, JSON.stringify(body));
        airTableSchedules.push(airTableSchedule["records"][0]);
    }
    return airTableSchedules;
}

async function postLocation(serviceAtLocation, airTableSchedules, airTableService, airTableServiceAtLocation){
    location = {
        fields: {
            name: serviceAtLocation["location"]["name"],
            services: [airTableService["id"]],
            organization: [airTableService["organization"]?.id],
            contacts: [airTableService["contacts"][0]?.id],
            phones: [airTableService["contacts"][0]["phones"][0]?.id],
            schedules: airTableSchedules.map(x => x?.id),
            service_at_location: [airTableServiceAtLocation?.id],
            description: serviceAtLocation["location"]?.description,
        }
    }
    if(serviceAtLocation["location"].latitude){
        location["fields"]["latitude"] = String(serviceAtLocation["location"]["latitude"]);
    }
    if(serviceAtLocation["location"].longitude){
        location["fields"]["longitude"] = String(serviceAtLocation["location"]["longitude"])
    }
    location.fields = removeNullFields(location.fields);
    body = {records : [location]};
    airTableLocation = await postToAirtable(baseId, locationsTableId, JSON.stringify(body));
    airTableLocation = airTableLocation?.records[0];
    return airTableLocation;
}

async function updateLocation(serviceAtLocation, airTableServiceAtLocation, postedLocationIdDict){
    location = {
        fields: {
            service_at_location: postedLocationIdDict[serviceAtLocation["location"]["id"]]["airTableServiceAtLocations"]
        }
    }
    airTableLocation = await updateAirtableRecord(baseId, locationsTableId, postedLocationIdDict[serviceAtLocation["location"]["id"]]["airTableId"] , JSON.stringify(location))
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
    try{
        let response = await axios.get(SINGLE_SERVICE_URI + String(serviceId));
        let service = response.data;
        return service;
    }catch (error){
        console.log("Error getting the service with ID" + String(serviceId) + " : " + error.message);
        throw error
    }
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


async function postToAirtable(baseID, tableID, body) {
    const airTableUrl = `https://api.airtable.com/v0/${baseID}/${tableID}`;
  
    try {
      const response = await axios.post(airTableUrl, body, {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      });
  
      return response.data;
    } catch (error) {
        if (error.response) {
            console.log("Error occurred while posting to Airtable:", error.response.data);
        } else {
            console.log("Error occurred while posting to Airtable:", error.message);
        }
        throw error;
    }
  }

async function updateAirtableRecord(baseID, tableID, recordID, body){
    const airTableUrl = `https://api.airtable.com/v0/${baseID}/${tableID}/${recordID}`;
    try {
      const response = await axios.patch(airTableUrl, body, {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      });
  
      return response.data;
    } catch (error) {
        if (error.response) {
            console.log("Error occurred while patching", error.response.data);
        } else {
            console.log("Error occurred while patching", error.message);
        }
    }
}