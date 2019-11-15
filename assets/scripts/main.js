// ================ Document onload actions ======================
let CITIES = [];
const CURRENT_CITY = {
    name: "",
    country: "",
    longitude: "",
    latitude: "",
};

let SPINNER_TIMER;

const DATE_FORMAT = "D/M/YYYY";

const STORAGE = new StorageHandler("cities");

$(document).ready(function () {

    //load data on document onload
    loadCities();
    getCurrentLocation();
    showSpinner();
    toggleListGroupByScreenSize();

    //--------- Add event listeners -----------

    $(window).resize(()=>{
        toggleListGroupByScreenSize();
    })
    $("#btn-search").on("click", function (event) {
        event.preventDefault();
        disabledForm();
        hideWeather();

        let selectedCity = $("#txt-city").val().trim().split(",");

        updateCityInfo(selectedCity[0], selectedCity[1], "", "");
        loadPageData();

        $("#txt-city").val("");
    });

    $(".btn-collapse").on("click", function(event){
        event.preventDefault();
        $(".list-group").toggle();
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
                city = {
                    name: CURRENT_CITY.name,
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
    
    $(".list-container").on("mouseover", ".list-group-item", function () {
        if ($(this).find("button.close").is(":hidden")) {
            $(this).find("button.close").show();
        }
    });
    $(".list-container").on("mouseout", ".list-group-item", function () {
        if ($(this).find("button.close").is(":visible")) {
            $(this).find("button.close").hide();
        }
    });
    $(".list-container").on("click", ".list-group-item",function(event){
            event.preventDefault();
            const target = $(event.target);

            if(target.hasClass("list-group-item")){
                //if target is a list item
                const name = target.data("city");
                const city = findThisCity(name);
                updateCityInfo(city.name, city.country, city.latitude, city.longitude);
                loadPageData();
                return;
            }

            if(target.parent().hasClass("close")){
                //if target is close button
                const item = $(this);
                const cityIndex = CITIES.findIndex(city => city.name === item.data("city"));
                //delete city by index
                CITIES.splice(cityIndex, 1);
                //update local storage
                STORAGE.data = CITIES;
                //update display
                item.remove();
            }
    });
});




// ================ DOM Handler Functions ======================
/**
 * show and hide .list-group by the screensize
 */
function toggleListGroupByScreenSize(){
    if($(window).width() >=575){
        //if small and larger screen size(Bootstrap)
        //display saved city list
        $(".list-group").show();
    }else{
        $(".list-group").hide();
    }
}

/**
 * Disable search input box and button
 */
function disabledForm() {
    $("#btn-search").attr("disabled", true);
    $("#txt-city").attr("disabled", true);
    $("body").css("cursor", "wait");
}

/**
 * Enable search inputbox and button
 */
function enabledForm() {
    $("#btn-search").removeAttr("disabled");
    $("#txt-city").removeAttr("disabled");
    $("body").css("cursor", "default");
}
/**
 * display Weather and Forecast sections
 */
function showWeather() {
    $("#current-weather-container").show();
    $(".forecast").show();
    //hide spinner now
    hideSpinner();
}

/**
 * hide Weather and Forecast sections
 */
function hideWeather() {
    $("#current-weather-container").hide();
    $(".forecast").hide();
    //show spinner
    $(".spinner-container").show();
}

/**
 * hide spinners
 */
function hideSpinner() {
    clearInterval(SPINNER_TIMER);
    $(".spinner-container").hide();
}

/**
 * show spinners
 */
function showSpinner() {
    SPINNER_TIMER = setInterval(() => {
        const newSpinner = $(".spinner-grow").clone();
        $(".spinner-container").append(newSpinner);
    }, 2500);
    $(".spinner-container").show();


}


/**
 * Append a city to city list
 * @param {string} name 
 */
function addCityToListGroup(name) {
    const item = $(".list-group-item.template").clone().removeClass("template");
    item.attr("data-city", name);
    item.find(".list-group-item-content").text(name);
    $(".list-container").append(item);
}
/**
 * load city data
 */
function loadCities() {
    CITIES = STORAGE.data;
    for (let city of CITIES) {
        addCityToListGroup(city.name);
    }
}

/**
 * load Data from server to the page
 */
function loadPageData() {
    let param, url;
    /**
     * 
     * @param {string} url 
     * @param {object} param 
     * @param {function} success_callback function for ajax resolve
     */
    const getDataFromServer = function (url, param, resolveHandler) {
        return $.ajax({
            url,
            method: "GET",
            data: param
        }).then(resolveHandler, rejectHandler);
    };
    const rejectHandler = function (error) {
        displayError(error.responseJSON);
    };

    if (!hasValue(CURRENT_CITY.longitude && !hasValue(CURRENT_CITY.latitude))) {
        if (!hasValue(CURRENT_CITY.name)) {
            //no name, no way to get geocode. so throw an error
            displayError("ERROR in loading data: No city data available");
            enabledForm();
            return;
        }
        param = getQuery(true);
    } else {
        param = getQuery(false);
    }


    getDataFromServer(
        API_SETTINGS.baseURL + API_SETTINGS.nowWeatherLocation,
        param,
        (response) => {

            //update current city info
            const cityname = hasValue(CURRENT_CITY.name) ? CURRENT_CITY.name : response.name;
            updateCityInfo(cityname, response.sys.country, response.coord.lat, response.coord.lon);

            //update weather info display
            renderWeather(response);

            //do the promise here.
            $.when(
                getDataFromServer(
                    API_SETTINGS.baseURL + API_SETTINGS.uvIndexLocation,
                    getQuery(false)
                ),
                getDataFromServer(
                    API_SETTINGS.baseURL + API_SETTINGS.forecastLocation,
                    getQuery(false)
                )
            ).done((uvResponse, forecaseResponse) => {
                renderUVIndex(uvResponse[0]);
                renderForecast(forecaseResponse[0]);

                //now everything is rendered so display the results to users
                showWeather();

            }).fail(rejectHandler);
        });
    enabledForm();
}


/**
 * render error message for display.
 * @param {string|object} displayMessage error message for user display.
 * @param {string} consoleMessage error message to be written out to console
 * 
 */
function displayError(displayMessage, consoleMessage = "") {
    if (hasValue(displayMessage)) {
        let message = "";
        if (displayMessage instanceof Object) {
            //if error is object, then get message from the object
            if (Object.keys(displayMessage).indexOf("cod") !== -1) {
                message += `Error ${displayMessage.cod}: `;
            }
            if (Object.keys(displayMessage).indexOf("message") !== -1) {
                message += displayMessage.message;
            }
        }
        if (typeof displayMessage === "string") {
            message = displayMessage;
        }

        $("main").prepend(
            $("<div>").addClass("alert alert-danger").text(message)
        );
    }
    if (hasValue(consoleMessage)) { console.log(consoleMessage); }
}

/**
 * construct image url
 * @param {string} imgName name of the image
 * @return {string} image url
 */
function getImageURL(imgName) {
    const weatherIcon = API_SETTINGS.weatherIcon;
    return weatherIcon.url + imgName + weatherIcon.suffixNormal
}

/**
 * Render weather response object for the display. 
 * @param {object} info 
 */
function renderWeather(info) {
    const weather = info.weather[0];
    const main = info.main;

    //remove the previous alerts
    $(".alert").remove();

    //update current weather info
    $("#city").text(CURRENT_CITY.name);

    $("#date").text(moment(info.dt * 1000).format(DATE_FORMAT));


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

    if (hasValue(unit)) {
        $("uv-index-unit").text(unit);
    }
}

/**
 * Render forecast data back from the server
 * @param {object} response 
 * 
 */
function renderForecast(response) {
    const forecasts = response.list;
    // const TOMORROW = TODAY.clone().add(1,"day");
    let desireDate = moment().add(24, "hour").hour(11).startOf("hour");
    const row = $(".forecast-container .row");

    row.find(".col-auto:not(.template)").remove();
    for (let forecast of forecasts) {
        const day = moment(forecast.dt * 1000);
        if (day.isSame(desireDate)) {
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

            desireDate = desireDate.add(24, "hour").hour(11).startOf("hour");
        }
    }
}

// ================ Other Functions ======================

/**
 * 
 * @param {string} name name of the city
 * @return {object} city object of CITIES
 */
function findThisCity(name) {
    return CITIES.find((city) => city.name === name);
}



/**
 * get user's current location from geolocation
 */
function getCurrentLocation() {
    if ("geolocation" in navigator) {
        //goolocation is available, get the location.
        navigator.geolocation.getCurrentPosition(function (position) {
            if (typeof position === "undefined") {
                return -1;
            }
            updateCityInfo("", "", position.coords.latitude, position.coords.longitude)
            loadPageData();
        }, function (error) {
            let city;
            displayError("", "Warning: "+ error.message);
            //there is an error so 
            if (CITIES.length > 0) {
                //if there is cities list get the most recent one. 
                city = CITIES.slice(-1)[0];
                updateCityInfo(city.name, city.country, city.latitude, city.longitude);
                loadPageData();
            }
        })
    }
}
/**
 * check if the value is exist and not undefined or empty string
 * @param {string|number} value 
 */
function hasValue(value) {
    if (typeof value === "undefined") {
        return false;
    } else if (typeof value === "string" && value.length === 0) {
        //empty string
        return false;
    }
    return true;
}
/**
 * update Current City data
 * @param {string} name 
 * @param {string} country 
 * @param {string} latitude 
 * @param {string} longitude 
 */
function updateCityInfo(name, country, latitude, longitude) {
    CURRENT_CITY.name = name;
    CURRENT_CITY.country = country;
    CURRENT_CITY.latitude = latitude;
    CURRENT_CITY.longitude = longitude;
}

/**
 * prepare query data for ajax call
 * @param {boolean} useName if true, use city name as query. Default: false. 
 * @return {object} query parameters for ajax call.
 */
function getQuery(useName = false) {
    let query = {};

    if (useName) {
        let city = CURRENT_CITY.name;
        if (hasValue(CURRENT_CITY.country)) {
            city += "," + CURRENT_CITY.country;
        }
        query.q = city;
    } else {
        query.lat = CURRENT_CITY.latitude;
        query.lon = CURRENT_CITY.longitude;
    }

    query.appid = API_SETTINGS.apiKey;
    query.unit = API_SETTINGS.temperatureUnit.apiQuery;
    return query;
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