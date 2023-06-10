SERVICE_TYPES_URI = "https://penninelancs.openplace.directory/o/ServiceDirectoryService/v2/taxonomies/?per_page=5000&vocabulary=esdServiceTypes";
APP_URL = "http://localhost:3000/"

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
    result = await fetch(APP_URL + type.innerHTML, {method: "POST"})
}

async function clearBase(){
    await fetch(APP_URL + "all", {method: "DELETE"});
}