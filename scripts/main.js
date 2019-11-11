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
    } else if (type.localeCompare("forecast") === 0) {
        //if query for weather forecast
        url += API_SETTINGS.forecastLocation;
        query = this.getQuery(false);
    } else if (type.localeCompare("uvIndex") === 0) {
        url += API_SETTINGS.uvIndexLocation;
        query = this.getQuery(true);
    } else {
        //if not, the above types then throw an error
        displayError("Invalid URL location");
        console.log("Invalid url type:", type);
        return;
    }
    url += "?appid="+ API_SETTINGS.apiKey; // add api key to url
    url += query;   //add query

    return url;
    
}
/**
 * build query string for query URL
 * @param {boolean} isOnlyCoords if true, built the url with only lat & lon values. if false, we can use city name as query.
 * @return {string}
 */
function getQuery(isOnlyCoords = false) {
    if (CURRENT_CITY.latitude !== "" && CURRENT_CITY.longitude !== "") {
        return `&lat=${CURRENT_CITY.latitude}&lon=${CURRENT_CITY.longitude}`;
    } else if (!isOnlyCoords && CURRENT_CITY.name) {
        //if not only-coordinate-query and have city name
        //use cityname as query
        let query = "&q="+this.name;
        if(typeof CURRENT_CITY.country !== "undefined" && CURRENT_CITY.country.length > 0){
            //if there is country value
            query += ",".CURRENT_CITY.country;
        }
        return query;
    }
    return ""; //return empty string so that it won't break others. 
}

function loadPageData() {
    console.log(getURL())
}

// function getWeatherData(cityInfo) {
//     getWeather(cityInfo);
// }

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
// function renderWeather(weatherInfo) {
//     const weatherIcon = SETTINGS.weatherIcon;
//     const weather = weatherInfo.weather[0];
//     const main = weatherInfo.main;

//     //remove the previous alerts
//     $(".alert").remove();

//     //update current weather info
//     $("#city").text(weatherInfo.name);

//     $("#date").text(TODAY.format("D/M/YYYY"))


//     $("#icon").attr({
//         alt: weather.description,
//         src: weatherIcon.url + weather.icon + weatherIcon.suffixNormal
//     });

//     $("#temp").text(main.temp);
//     $("#temp-unit").html(SETTINGS.temperatureUnit.htmlSymbol);

//     $("#humidity").text(main.humidity);
//     $("#humidity-unit").text(SETTINGS.humidity.unit);

//     $("#wind-speed").text(weatherInfo.wind.speed);
//     $("#wind-speed-unit").text(SETTINGS.windSpeed.unit);

//     //now display the current weather info container.
//     $("#current-weather-container").show();

//     //uv index is not in the response. need to do another ajax. 

// }


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