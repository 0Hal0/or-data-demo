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
    services = await getServicesOfType(type.innerHTML);

    postServicesToEndpoint(services);
}

async function getServicesOfType(type){
    console.log(type);
    services = await fetch(SERVICES_URI + String(type));
    services = await services.json();
    console.log(services);
    return services;
}

async function postServicesToEndpoint(services){
    try{
        await fetch("https://api.airtable.com/v0/app2aHT8MrG4nYq4H/tbl2giYwRZtciotzn",
        {
            method: "POST",
            headers: new Headers({
                "Authorization": "Bearer patBW3t4n3ebFIUBn.08d2769abf211012356fece8f65f8198ba07d74d4a459460ac8e017776564498",
                "Content-Type": "application/json"
            }),
            body:JSON.stringify({
                records: [
                    {
                      fields: {
                        name: "test org name",
                        description: "test org desc",
                      }
                    },
                    {
                      fields: {
                        name: "test name 2",
                        description: "test desc 2"
                      }
                    }
                  ]
            })
        })
    }catch{
        console.log("Error")
    }
}