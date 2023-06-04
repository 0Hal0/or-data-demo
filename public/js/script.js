SERVICE_TYPES_URI = "https://penninelancs.openplace.directory/o/ServiceDirectoryService/v2/taxonomies/?per_page=5000&vocabulary=esdServiceTypes";
SERVICES_URI = "https://penninelancs.openplace.directory/o/ServiceDirectoryService/v2/services/local/?service_type="

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
    getServicesOfType(type.innerHTML);
}

async function getServicesOfType(type){
    console.log(type);
    services = await fetch(SERVICES_URI + String(type));
    services = await services.json();
    console.log(services);
}

async function postServicesToEndpoint(URI){

}