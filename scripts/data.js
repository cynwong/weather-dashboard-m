const API_SETTINGS = {
    apiKey: "ad6d47fddad6f9f566e190d9bbd550b9",
    // currentWeatherBaseURL: "https://api.openweathermap.org/data/2.5/weather?",
    // forecastBaseURL: "https://api.openweathermap.org/data/2.5/forecast?",
    baseURL: "https://api.openweathermap.org/data/2.5/",
    nowWeatherLocation: "weather",
    forecastLocation: "forecast",
    uvIndexLocation: "uvi",

    temperatureUnit: {
            fullName: "Fahrenheit",
            htmlSymbol: "&#x2109;",
            apiQuery: "imperial"
    },
    humidity:{
        unit: "%"
    },
    windSpeed:{
        unit:"MPH"
    },
    uvIndex:{
        unit: "", 
        range: {
            low: {min:0,max:2},
            moderate: {min:3, max:5},
            high: {min:6, max:7},
            veryHigh:{min:8, max:10},
            extreme: {min:11}
        }
    },
    weatherIcon: {
        url: "http://openweathermap.org/img/wn/",
        suffixNormal : ".png",
        suffixLarger: "@2x.png"
    }
};


// https://api.openweathermap.org/data/2.5/find?appid=ad6d47fddad6f9f566e190d9bbd550b9&q=singapore