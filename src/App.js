import React, { useEffect, useState } from "react";


function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}

function convertToFlag(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}

export default function App() {
  const [location, setLocation] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [displayLocation, setDisplayLocation] = useState('')
  const [weather, setweather] = useState({})
  const [error,setError] = useState('')


  useEffect(function () {
    async function fetchWather() {

      if (location.length < 2) return setweather({});

      try {
        // 1) Getting location (geocoding)
        setIsLoading(true)
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${location}`
        );
        const geoData = await geoRes.json();


        if (!geoData.results) throw new Error("Location not found");

        const { latitude, longitude, timezone, name, country_code } = geoData.results.at(0);
        setDisplayLocation(`${name} ${convertToFlag(country_code)}`);

        // 2) Getting actual weather
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
        );
        const weatherData = await weatherRes.json();
        setweather(weatherData.daily);
          setError('')
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
        //adding Loacation to local Storage
        // localStorage.setItem('location', location)
      }

    }
    fetchWather()

  }, [location])

  // useEffect(function () {
  //   setLocation(localStorage.getItem('location') || '')
  // }, [])

  const onchangeLoacation = e => setLocation(e.target.value)

  return (
    <div className="app">
      <h1>Weather Classy</h1>
      <Input location={location} onchangeLoacation={onchangeLoacation} />

      {/* <button onClick={fetchWather}>Git Data</button> */}
      {isLoading && <p className="isLoading">isLoading...</p>}
      { error && <Error error = {error}/>}

      {weather.weathercode && <Weather weather={weather} displayLocation={displayLocation} />}
    </div>
  )
}

function Error({error}){
  return(
    <div>
      <p className="error">{error}!</p>
    </div>
  )
}

function Input({ onchangeLoacation, location }) {
  return <div>
    <input type="text" placeholder="Search For City" value={location} onChange={onchangeLoacation} />
  </div>
}


function Weather({ weather, displayLocation }) {

  const { temperature_2m_max: max, temperature_2m_min: min, time: dates, weathercode: codes } = weather

  return (
    <div>
      <h2>Weather {displayLocation}</h2>
      <ul className="weather">
        {dates.map((date, i) => {
          return <Day date={date} max={max.at(i)} min={min.at(i)} codes={codes.at(i)} isToday={i === 0} key={date} />
        })}
      </ul>
    </div>
  )
}

function Day({ date, max, min, codes, isToday }) {

  return (
    <li className="day">
      <span>{getWeatherIcon(codes)}</span>
      <p>{isToday ? 'today' : formatDay(date)}</p>
      <p>{Math.floor(min)}&deg; &mdash; <strong>{Math.ceil(max)}&deg;</strong></p>
    </li>
  )
}