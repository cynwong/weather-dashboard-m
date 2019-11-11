const TODAY =  moment();

$(document).ready(function () {
    $("#btn-search").on("click", function (event) {
        event.preventDefault();
        disabledForm();

        console.log("btn-search is clicked!");

        let selectedCity = $("#txt-city").val().trim();
        // cityInfo = cityInfo.trim();

        getWeatherData(selectedCity);


    })
});

function disabledForm() {
    $("#btn-search").attr("disabled", true);
    $("#txt-city").attr("disabled", true);
}

function enabledForm() {
    $("#btn-search").removeAttr("disabled");
    $("#txt-city").removeAttr("disabled");
}

function getWeatherData(cityInfo) {
    getWeather(cityInfo);
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
function renderWeather(weatherInfo) {
    const weatherIcon = SETTINGS.weatherIcon;
    const weather = weatherInfo.weather[0];
    const main = weatherInfo.main;

    //remove the previous alerts
    $(".alert").remove();

    //update current weather info
    $("#city").text(weatherInfo.name);

    $("#date").text(TODAY.format("D/M/YYYY"))

    
    $("#icon").attr({
        alt: weather.description,
        src: weatherIcon.url + weather.icon + weatherIcon.suffixNormal
    });

    $("#temp").text(main.temp);
    $("#temp-unit").html(SETTINGS.temperatureUnit.htmlSymbol);

    $("#humidity").text(main.humidity);
    $("#humidity-unit").text(SETTINGS.humidity.unit);

    $("#wind-speed").text(weatherInfo.wind.speed);
    $("#wind-speed-unit").text(SETTINGS.windSpeed.unit);

    //now display the current weather info container.
    $("#current-weather-container").show();
    
    //uv index is not in the response. need to do another ajax. 

}

/**
 * 
 * @param {string} type weather,forecast or uvIndex
 * @param {string} city name of the city
 * @param {string} country optional name of the country. 
 */
function getURL(type, city, country = ""){
    let url = SETTINGS.baseURL;
    if(type.localeCompare("weather")===0){
        //if query for current weather
        url+= SETTINGS.nowWeatherLocation;
    } else if (type.localeCompare("forecast")===0){
        //if query for weather forecast
        url+= SETTINGS.forecastLocation;
    }else if(type.localeCompare("uvIndex")===0){
        url += SETTINGS.uvIndexLocation;
    }else{
        //if not, the above types then throw an error
        displayError("Invalid URL location");
        console.log("Invalid url type:", type);
        return;
    }
    url+="?appid="+SETTINGS.apiKey;  // add api key to url


}
function getWeather(cityInfo) {
    let queryURL = SETTINGS.currentWeatherBaseURL + `appid=${SETTINGS.apiKey}` + `&q=${cityInfo}` + `&units=${SETTINGS.temperatureUnit.api}`;
    console.log(queryURL);
    $.ajax({
        url: queryURL,
        method: "GET"
    }).done((weatherResponse) => {

        $.ajax()
        renderWeather(response);
    }).fail(error => {
        console.log(error);

        displayError(error.responseJSON);
    });
    enabledForm();
}
/**
 * call when user search for a city or when the page is loaded.
 * reset the page depending on the user choice. 
 */
function resetCity() {

}

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