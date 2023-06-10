SERVICE_TYPES_URI = "https://penninelancs.openplace.directory/o/ServiceDirectoryService/v2/taxonomies/?per_page=5000&vocabulary=esdServiceTypes";
SERVICES_URI = "https://penninelancs.openplace.directory/o/ServiceDirectoryService/v2/services/local/?per_page=5000&service_type="

async function getServiceTypes(){
    serviceTypes = await fetch(SERVICE_TYPES_URI)
    serviceTypes = await serviceTypes.json();
    serviceTypes = serviceTypes["content"];

    var typeSuggestions = document.getElementById("service-type-suggestions");
    for (let i=0; i < serviceTypes.length; i++){
        var option = new Option(serviceTypes[i]["id"], serviceTypes[i]["name"]);
        option.id = serviceTypes[i]["name"];
        typeSuggestions.appendChild(option);
    }
}

async function update(){
    type = document.getElementById("service-type-input");
    type = document.getElementById(type.value);
    result = await fetch("http://localhost:3000/" + type.innerHTML, {method: "POST"})
}

async function update_old(){
    type = document.getElementById("service-type-input");
    type = document.getElementById(type.value);
    services = await getServicesOfType(type.innerHTML);

    postServicesToEndpoint(services);
}

async function getServicesOfType(type){
    console.log(type);
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
    await postToAirtable(baseID, servicesTableID, JSON.stringify(body));
}

async function postToAirtable(baseID, tableID, body){
    airTableUrl = "https://api.airtable.com/v0";
    try{
        await fetch(airTableUrl + "/" + baseID + "/" + tableID,
        {
            method: "POST",
            headers: new Headers({
                "Authorization": "Bearer " + ACCESS_TOKEN,
                "Content-Type": "application/json"
            }),
            body: body
        })
    }catch(error){
        console.log(error)
    }
}