SERVICE_TYPES_URI = "https://penninelancs.openplace.directory/o/ServiceDirectoryService/v2/taxonomies/?per_page=5000&vocabulary=esdServiceTypes";
APP_URL = "http://localhost:3000/"

const SERVICE_TYPES = [
    "728",
    "727",
    "1792",
    "1806",
    "190",
    "328",
    "298",
    "19",
    "643",
    "272",
    "343",
    "831",
    "1815",
    "1805",
    "1803",
    "199",
    "1804",
    "1810",
    "1814",
    "112",
    "189",
    "242",
    "1789",
    "437",
    "927",
    "1284",
    "1793",
    "164",
    "292",
    "1114",
    "1466",
]
async function getServiceTypes(){
    serviceTypes = await fetch(SERVICE_TYPES_URI)
    serviceTypes = await serviceTypes.json();
    serviceTypes = serviceTypes["content"];

    var typeSuggestions = document.getElementById("service-type-suggestions");
    for (let i=0; i < serviceTypes.length; i++){
        if (SERVICE_TYPES.includes(serviceTypes[i]["id"])){
            var option = new Option(serviceTypes[i]["id"], serviceTypes[i]["name"]);
            option.id = serviceTypes[i]["name"];
            typeSuggestions.appendChild(option);
        }
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