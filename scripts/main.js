
$(document).ready(function () {
    $("#btn-search").on("click", function (event) {
        event.preventDefault();
        console.log("btn-search is clicked!");

        let cityInfo = $("#txt-city").val();
        cityInfo = cityInfo.trim();

        getWeatherData(cityInfo);

        disabledForm();

    })
});

function disabledForm(){
    $("#btn-search").attr("disabled",true);
    $("#txt-city").attr("disabled",true);
}

function enabledForm(){
    $("#btn-search").removeAttr("disabled");
    $("#txt-city").removeAttr("disabled");
}

function getWeatherData(cityInfo){
    getWeather(cityInfo);
}

function displayError(message){
    $("main").prepend(
        $("<div>").addClass("alert").text(message)
    );
}
function getWeather(cityInfo){
    let queryURL = SETTINGS.currentWeatherBaseURL+`appid=${SETTINGS.apiKey}`+`&q=${cityInfo}`;
    console.log(queryURL);
    $.ajax({
        url: queryURL,
        method: "GET"
    }).done(function(response){
        console.log(response);
        
    })
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
4. if failed. show error message. 
*/