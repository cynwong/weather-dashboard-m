const TODAY = moment();
const CITIES = [];
const CURRENT_CITY = {
    name: "",
    country: "",
    longitude: "",
    latitude: "",
};

const QUERY_WEATHER = "weather";
const QUERY_FORECAST = "forecast";
const QUERY_UV_INDEX = "uv-index";


$(document).ready(function () {

    getCurrentLocation();

    //--------- Add event listeners -----------
    $(".draggable").draggable({
        revert: true
    });
    $(".droppable").droppable({
        classes: {
            "ui-droppable-hover": "ui-state-hover"
        },
        drop: function (event, ui) {
            if(CITIES.indexOf(CURRENT_CITY) !== -1){
                //if we have the name already then, don't add
                return;
            }
            $(this).append(
                $("#li-template").clone().removeAttr("id").text(CURRENT_CITY.name)
            );
            CITIES.push(CURRENT_CITY)
        }
    });
    $("#btn-search").on("click", function (event) {
        event.preventDefault();
        disabledForm();

        let selectedCity = $("#txt-city").val().trim();
        // cityInfo = cityInfo.trim();

        // getWeatherData(selectedCity);


    })
});

function getCurrentLocation() {
    if ("geolocation" in navigator) {
        //goolocation is available, get the location.
        navigator.geolocation.getCurrentPosition(function (position) {
            if (typeof position === "undefined") {
                return -1;
            }
            CURRENT_CITY.latitude = position.coords.latitude;
            CURRENT_CITY.longitude = position.coords.longitude;
            loadPageData();
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

    console.log(url)
    return url;

}
/**
 * build query string for query URL
 * @param {boolean} isOnlyCoords if true, built the url with only lat & lon values. if false, we can use city name as query.
 * @return {string}
 */
function getQuery(isOnlyCoords = false) {
    let query;
    if (CURRENT_CITY.latitude !== "" && CURRENT_CITY.longitude !== "") {
        return `&lat=${CURRENT_CITY.latitude}&lon=${CURRENT_CITY.longitude}`;
    } else if (!isOnlyCoords && CURRENT_CITY.name) {
        //if not only-coordinate-query and have city name
        //use cityname as query
        query = "&q=" + this.name;
        if (typeof CURRENT_CITY.country !== "undefined" && CURRENT_CITY.country.length > 0) {
            //if there is country value
            query += ",".CURRENT_CITY.country;
        }
        return query;
    }
    return ""; //return empty string so that it won't break others. 
}

function loadPageData() {
    //get Weather data
    $.ajax({
        url: getURL(QUERY_WEATHER),
        method: "GET"
    }).done(
        renderWeather
    ).fail(error => {
        displayError(error.responseJSON);
    });

    //get UV Indes data
    $.ajax({
        url: getURL(QUERY_UV_INDEX),
        method: "GET"
    }).done(
        renderUVIndex
    ).fail(error => {
        displayError(error.responseJSON);
    });

    //get Forecast data
    $.ajax({
        url: getURL(QUERY_FORECAST),
        method: "GET"
    }).done(response => {

    }).fail(error => {
        displayError(error.responseJSON);
    });
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
function renderWeather(info) {
    const weatherIcon = API_SETTINGS.weatherIcon;
    const weather = info.weather[0];
    const main = info.main;

    //remove the previous alerts
    $(".alert").remove();

    //update current weather info
    $("#city").text(info.name);

    $("#date").text(TODAY.format("D/M/YYYY"))


    $("#icon").attr({
        alt: weather.description,
        src: weatherIcon.url + weather.icon + weatherIcon.suffixNormal
    });

    $("#temp").text(main.temp);
    $("#temp-unit").html(API_SETTINGS.temperatureUnit.htmlSymbol);

    $("#humidity").text(main.humidity);
    $("#humidity-unit").text(API_SETTINGS.humidity.unit);

    $("#wind-speed").text(info.wind.speed);
    $("#wind-speed-unit").text(API_SETTINGS.windSpeed.unit);

    //now display the current weather info container.
    $("#current-weather-container").show();
    updateCityInfo(info.name, info.sys.country, info.coord.lat, info.coord.lon);
    //Note: UV index is in another API call. so it is in another function. 
}

/**
 * Update the current city info
 * @param {string} name 
 * @param {string} country 
 * @param {number} lat 
 * @param {number} lon 
 */
function updateCityInfo(name, country, lat, lon){
    CURRENT_CITY.name = name;
    CURRENT_CITY.country= country;
    CURRENT_CITY.latitude = lat;
    CURRENT_CITY.longitude = lon;
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
        // console.log(prop);
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
    console.log(classname);

    $("#uv-index").text(value).addClass(classname);



    if (unit) {
        $("uv-index-unit").text(unit);
    }

    if ($("#current-weather-container").is(":hidden")) {
        //if current weather container is not shown. 
        $("#current-weather-container").show();
    }

}


// function getWeather(cityInfo) {
//     let queryURL = SETTINGS.currentWeatherBaseURL + `appid=${SETTINGS.apiKey}` + `&q=${cityInfo}` + `&units=${SETTINGS.temperatureUnit.api}`;
//     console.log(queryURL);
//     $.ajax({
//         url: queryURL,
//         method: "GET"
//     }).done((weatherResponse) => {

//         // $.ajax()
//         renderWeather(response);
//     }).fail(error => {
//         console.log(error);

//         displayError(error.responseJSON);
//     });
//     enabledForm();
// }
/**
 * call when user search for a city or when the page is loaded.
 * reset the page depending on the user choice.
 */
// function resetCity() {

// }

/*
when user click search button
1. disbled the form
2. get current weather info from weather.com api
3. if success
    a. add cityname to city list & update localstorage.
    2. display current weather in current weather info
    3. get the forecast info
        1. if success, diplay the forecast for each day in forecast
        2. if fail, show error message
    4. get uv index with response coordinates.
4. if failed. show error message.
*/