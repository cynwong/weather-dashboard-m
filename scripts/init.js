
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