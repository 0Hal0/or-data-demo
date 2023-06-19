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
    msg = document.getElementById("message");
    msg.innerHTML = "Sending services...";
    msg.style.color = "#ffbf00";

    type = document.getElementById("service-type-input");
    type = document.getElementById(type.value);
    try{
        result = await fetch(APP_URL + type.innerHTML, {method: "POST"})
    }
    catch(error){
        console.log("Error sending services");
        result = {status: 500};
    }

    if (result.status == 500){
        msg.style.color = "#ff0000";
        msg.innerHTML = "Failed to send services";
    }else{
        msg.innerHTML = "Done";
        msg.style.color = "#00ff00"
    }
    setTimeout(() => {document.getElementById("message").innerHTML = ""}, 1500);
}

async function clearBase(){
    msg = document.getElementById("message");
    msg.innerHTML = "Clearing services...";
    msg.style.color = "#ffbf00";
    result = await fetch(APP_URL + "all", {method: "DELETE"});
    if (result.status == 500){
        msg.style.color = "#ff0000";
        msg.innerHTML = "Failed to clear services";
    }else{
        msg.innerHTML = "Done";
        msg.style.color = "#00ff00"
    }
    setTimeout(() => {document.getElementById("message").innerHTML = ""}, 1500);
}