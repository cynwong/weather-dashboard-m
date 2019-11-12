// const TODAY = moment();
let CITIES = [];
let CURRENT_CITY = {
    name: "",
    country: "",
    longitude: "",
    latitude: "",
};

const QUERY_WEATHER = "weather";
const QUERY_FORECAST = "forecast";
const QUERY_UV_INDEX = "uv-index";
const DATE_FORMAT = "D/M/YYYY";

const STORAGE = new StorageHandler("cities");

$(document).ready(function () {

    loadCities();
    getCurrentLocation();
    //--------- Add event listeners -----------

    $("#btn-search").on("click", function (event) {
        event.preventDefault();
        disabledForm();

        let selectedCity = $("#txt-city").val().trim().split(",");

        CURRENT_CITY.name = selectedCity[0];
        CURRENT_CITY.country = selectedCity[1];
        CURRENT_CITY.longitude = "";
        CURRENT_CITY.latitude = "";
        // updateCityInfo(selectedCity[0],selectedCity[1]);
        loadPageData();


    });

    $(".draggable").draggable({
        revert: true
    });
    $(".droppable").droppable({
        classes: {
            "ui-droppable-hover": "ui-state-hover"
        },
        drop: function () {
            const name = CURRENT_CITY.name;
            let city = findThisCity(name);
            if ($.isEmptyObject(city)) {
                //only save if not savebefore. 
                city={
                    name : CURRENT_CITY.name,
                    country: CURRENT_CITY.country,
                    latitude: CURRENT_CITY.latitude,
                    longitude: CURRENT_CITY.longitude
                };
                CITIES.push(city);
                //update local storage
                STORAGE.data = CITIES;
                //add list item.
                addCityToListGroup(name);
            }
        }
    });
    $(".list-group").on("click",".list-group-item:not(.add-new)",function(){
        const name = $(this).data("city");
        CURRENT_CITY = findThisCity(name);
        loadPageData();
    })

});

/**
 * 
 * @param {string} name name of the city
 * @return {object} city object of CITIES
 */
function findThisCity(name){
    return CITIES.find((city)=>city.name === name);
}

function addCityToListGroup(name){
    $(".list-group").append(
        $("li.template").clone().removeClass("template").attr("data-city",name).text(name)
    );
}
//load city data
function loadCities(){
    CITIES = STORAGE.data;

    console.log(CITIES);
    for(let city of CITIES){
        addCityToListGroup(city.name);
    }

}


function getCurrentLocation() {
    if ("geolocation" in navigator) {
        //goolocation is available, get the location.
        navigator.geolocation.getCurrentPosition(function (position) {
            if (typeof position === "undefined") {
                return -1;
            }
            CURRENT_CITY.latitude = position.coords.latitude;
            CURRENT_CITY.longitude = position.coords.longitude;
            CURRENT_CITY.name = "";
            CURRENT_CITY.country="";
            loadPageData();
        }, function(error){
            console.log("Error", error.message);
            //there is an error so 
            if(CITIES.length>0){
                //if there is cities list get the most recent one. 
                CURRENT_CITY = CITIES.slice(-1)[0];
                // updateCityInfo(city.name, city.country, city.latitude, city.longitude);
                loadPageData();
            }
            
        })
    }
}
/**
 * Disable search input box and button
 */
function disabledForm() {
    $("#btn-search").attr("disabled", true);
    $("#txt-city").attr("disabled", true);
}

/**
 * Enable search inputbox and button
 */
function enabledForm() {
    $("#btn-search").removeAttr("disabled");
    $("#txt-city").removeAttr("disabled");
}

/**
 * built query URL
 * @param {string} type values: weather, forecast or uvindex. 
 * @return {string} url
 */
function getURL(type = QUERY_WEATHER) {
    let url = API_SETTINGS.baseURL;
    let query = "";

    if (type.localeCompare(QUERY_WEATHER) === 0) {
        url += API_SETTINGS.nowWeatherLocation;
        query = this.getQuery(false);
    } else if (type.localeCompare(QUERY_FORECAST) === 0) {
        //if query for weather forecast
        url += API_SETTINGS.forecastLocation;
        query = this.getQuery(false);
    } else if (type.localeCompare(QUERY_UV_INDEX) === 0) {
        url += API_SETTINGS.uvIndexLocation;
        query = this.getQuery(true);
    } else {
        //if not, the above types then throw an error
        displayError("Invalid URL location");
        console.log("Invalid url type:", type);
        return;
    }
    url += "?appid=" + API_SETTINGS.apiKey; // add api key to url
    url += query;   //add query

    return url;

}
/**
 * build query string for query URL
 * @param {boolean} isOnlyCoords if true, built the url with only lat & lon values. if false, we can use city name as query.
 * @return {string}
 */
function getQuery(isOnlyCoords = false) {
    let query = "";
    if (!isOnlyCoords && isValueExisted(CURRENT_CITY.name)) {
        //if not only-coordinate-query and have city name
        //use cityname as query
        query += "&q=" + CURRENT_CITY.name;
        if (isValueExisted(CURRENT_CITY.country)) {
            //if there is country value
            query += ","+CURRENT_CITY.country;
        }
    } else if (isValueExisted(CURRENT_CITY.latitude) && isValueExisted(CURRENT_CITY.longitude)) {
        query += `&lat=${CURRENT_CITY.latitude}&lon=${CURRENT_CITY.longitude}`;
    } 
    if(isValueExisted(query)===true){
        //add this value only if we have location data
        //set temperature format
        query += "&units="+API_SETTINGS.temperatureUnit.apiQuery;
    }
    return query; //return empty string so that it won't break others. 
}

function loadPageData() {

    function getDataFromServer(type, success_callback){
        $.ajax({
            url:getURL(type),
            method: "GET"
        }).then(
            success_callback,
            error=>{
                displayError(error.responseJSON);
            }
        )
    }
    //get Weather data
    getDataFromServer(
        QUERY_WEATHER,
        response => {
            //re-render the page
            renderWeather(response);
            //update the current city info
            CURRENT_CITY.name = response.name;
            CURRENT_CITY.country = response.sys.country;
            CURRENT_CITY.latitude = response.coord.lat;
            CURRENT_CITY.longitude = response.coord.lon;
            // updateCityInfo(response.name, response.sys.country, response.coord.lat, response.coord.lon);
            //get UV Index data
            getDataFromServer(QUERY_UV_INDEX,renderUVIndex);
        }
    );
    
    

    //get Forecast data
    getDataFromServer(
        QUERY_FORECAST,
        renderForecast
    );
    enabledForm();
}

function displayError(error) {
    let message = "";
    if (error instanceof Object) {
        //if error is object, then get message from the object
        if (Object.keys(error).indexOf("cod") !== -1) {
            message += `Error ${error.cod}: `;
        }
        if (Object.keys(error).indexOf("message") !== -1) {
            message += error.message;
        }
    }
    if (typeof error === "string") {
        message = error;
    }

    $("main").prepend(
        $("<div>").addClass("alert").text(message)
    );
}

/**
 * construct image url
 * @param {string} imgName name of the image
 * @return {string} image url
 */
function getImageURL(imgName){
    const weatherIcon = API_SETTINGS.weatherIcon;

    return weatherIcon.url + imgName + weatherIcon.suffixNormal
}
function renderWeather(info) {
    const weather = info.weather[0];
    const main = info.main;

    //remove the previous alerts
    $(".alert").remove();

    //update current weather info
    $("#city").text(info.name);

    $("#date").text(moment(info.dt*1000).format(DATE_FORMAT));


    $("#icon").attr({
        alt: weather.description,
        src: getImageURL(weather.icon)
    });

    $("#temp").text(main.temp);
    $("#temp-unit").html(API_SETTINGS.temperatureUnit.htmlSymbol);

    $("#humidity").text(main.humidity);
    $("#humidity-unit").text(API_SETTINGS.humidity.unit);

    $("#wind-speed").text(info.wind.speed);
    $("#wind-speed-unit").text(API_SETTINGS.windSpeed.unit);

    //now display the current weather info container.
    $("#current-weather-container").show();
    
    //Note: UV index is in another API call. so it is in another function. 
}
/**
 * check if the value is exist and not undefined or empty string
 * @param {string|number} value 
 */
function isValueExisted(value) {
    if (typeof value === "undefined") {
        return false;
    } else if (typeof value === "string" && value.length === 0) {
        //empty string
        return false;
    }
    return true;
}

/**
 * find the css style class name for the uv-index value. 
 * @param {number} value UV Index value
 * @return {string} style class name according to UV index value. 
 */
function getUVclass(value) {
    function between(value, min, max) {
        return value >= min && value <= max;
    }
    const range = API_SETTINGS.uvIndex.range;
    let prop;
    for (prop in range) {
        if ((prop === "extreme" && value >= range[prop].min) || between(value, range[prop].min, range[prop].max)) {
            break;

        }
    }
    switch (prop) {
        case "low":
            return "uv-low";
        case "moderate":
            return "uv-moderate";
        case "high":
            return "uv-high";
        case "veryHigh":
            return "uv-very-high";
        default:
            return "uv-extreme";
    }
}

/**
 * Prepare the display from the value the server return.
 * @param {object} info reponse JSON object return from the server
 */
function renderUVIndex(info) {
    let unit = API_SETTINGS.uvIndex.unit;
    let value = info.value;
    let classname = getUVclass(value);

    //remove old classes
    $("#uv-index").removeAttr("class");
    //add new data and class
    $("#uv-index").text(value).addClass(classname);



    if (isValueExisted(unit)) {
        $("uv-index-unit").text(unit);
    }

    if ($("#current-weather-container").is(":hidden")) {
        //if current weather container is not shown. 
        $("#current-weather-container").show();
    }

}

function renderForecast(response){
    const forecasts = response.list;
    // const TOMORROW = TODAY.clone().add(1,"day");
    let desireDate = moment().add(24,"hour").hour(11).startOf("hour");
    const row = $(".forecast-container .row");
    row.find(".col-auto:not(.template)").remove();
    for(let forecast of forecasts){
        const day = moment(forecast.dt*1000);
        if(day.isSame(desireDate)){
            //if same day, render the data for display
            let container = $(".forecast-container .template").clone();
            container.removeClass('template');
            container.find(".forecast-date").text(day.format(DATE_FORMAT));
            let url = getImageURL(forecast.weather[0].icon);

            container.find('.forecast-icon').attr({
                src: url,
                alt: forecast.weather[0].description
            });
            
            container.find(".forecast-temp").text(forecast.main.temp);
            container.find(".forecast-temp-unit").html(API_SETTINGS.temperatureUnit.htmlSymbol);

            container.find(".forecast-humidity").text(forecast.main.humidity);
            container.find(".forecast-humidity-unit").text(API_SETTINGS.humidity.unit);


            row.append(container);

            desireDate = desireDate.add(24,"hour").hour(11).startOf("hour");
        }
    }
    //display forecast div
    $(".forecast").show();

}

/*
when user click search button
1. disbled the form
2. get current weather info from weather.com api
3. if success
    a. add cityname to city list & update localstorage. => drag and drop??
    2. display current weather in current weather info
    3. get the forecast info
        1. if success, diplay the forecast for each day in forecast
        2. if fail, show error message
    4. get uv index with response coordinates.
4. if failed. show error message.
*/