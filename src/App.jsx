import { useEffect, useState } from 'react';

const WEATHER_CODES = {
  0: { label: 'Clear sky', icon: '☀️' },
  1: { label: 'Mainly clear', icon: '🌤️' },
  2: { label: 'Partly cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Fog', icon: '🌫️' },
  48: { label: 'Depositing rime fog', icon: '🌫️' },
  51: { label: 'Light drizzle', icon: '🌦️' },
  53: { label: 'Moderate drizzle', icon: '🌦️' },
  55: { label: 'Dense drizzle', icon: '🌧️' },
  56: { label: 'Freezing drizzle', icon: '🌧️' },
  57: { label: 'Heavy freezing drizzle', icon: '🌧️' },
  61: { label: 'Slight rain', icon: '🌦️' },
  63: { label: 'Moderate rain', icon: '🌧️' },
  65: { label: 'Heavy rain', icon: '🌧️' },
  66: { label: 'Freezing rain', icon: '🌧️' },
  67: { label: 'Heavy freezing rain', icon: '🌧️' },
  71: { label: 'Slight snow', icon: '🌨️' },
  73: { label: 'Moderate snow', icon: '❄️' },
  75: { label: 'Heavy snow', icon: '❄️' },
  77: { label: 'Snow grains', icon: '❄️' },
  80: { label: 'Rain showers', icon: '🌦️' },
  81: { label: 'Heavy rain showers', icon: '🌧️' },
  82: { label: 'Violent rain showers', icon: '⛈️' },
  85: { label: 'Snow showers', icon: '🌨️' },
  86: { label: 'Heavy snow showers', icon: '❄️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
  96: { label: 'Thunderstorm with hail', icon: '⛈️' },
  99: { label: 'Heavy thunderstorm with hail', icon: '⛈️' },
};

const formatTemperature = (value) => `${Math.round(value)}°C`;

const formatDate = (value) => {
  const date = new Date(value);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

function App() {
  const [searchQuery, setSearchQuery] = useState('London');
  const [city, setCity] = useState('London');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWeather = async (targetCity) => {
    if (!targetCity.trim()) {
      setError('Please enter a city name.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(targetCity)}&count=1&language=en&format=json`
      );

      if (!geoResponse.ok) {
        throw new Error('Unable to find that city.');
      }

      const geoData = await geoResponse.json();
      const location = geoData.results?.[0];

      if (!location) {
        throw new Error('No matching city was found. Try another search.');
      }

      const forecastResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,pressure_msl&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`
      );

      if (!forecastResponse.ok) {
        throw new Error('Weather data could not be loaded.');
      }

      const forecastData = await forecastResponse.json();

      const current = forecastData.current;
      const daily = forecastData.daily;

      setWeather({
        city: `${location.name}, ${location.country ?? ''}`.trim(),
        current: {
          temp: current.temperature_2m,
          feelsLike: current.apparent_temperature,
          humidity: current.relative_humidity_2m,
          wind: current.wind_speed_10m,
          pressure: current.pressure_msl,
          weatherCode: current.weather_code,
          time: current.time,
        },
        daily: daily.time.map((time, index) => ({
          day: formatDate(time),
          date: time,
          min: daily.temperature_2m_min[index],
          max: daily.temperature_2m_max[index],
          code: daily.weather_code[index],
        })),
      });

      setCity(location.name);
      setSearchQuery(location.name);
    } catch (loadError) {
      setError(loadError.message || 'Something went wrong while fetching weather data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather('London');
  }, []);

  const currentWeather = weather?.current
    ? WEATHER_CODES[weather.current.weatherCode] ?? { label: 'Unknown', icon: '🌡️' }
    : null;

  return (
    <div className="app-shell">
      <div className="weather-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Weather Dashboard</p>
            <h1>{weather ? weather.city : 'Loading...'}</h1>
          </div>
          <form className="search-form" onSubmit={(event) => {
            event.preventDefault();
            fetchWeather(searchQuery);
          }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search city"
              aria-label="Search city"
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Loading...' : 'Search'}
            </button>
          </form>
        </header>

        {error && <div className="status error">{error}</div>}

        {loading && !weather && (
          <div className="status loading">Fetching local weather data...</div>
        )}

        {weather && currentWeather && (
          <>
            <section className="hero-card">
              <div className="hero-main">
                <div className="weather-icon" aria-hidden="true">{currentWeather.icon}</div>
                <div>
                  <p className="temperature">{formatTemperature(weather.current.temp)}</p>
                  <p className="condition">{currentWeather.label}</p>
                </div>
              </div>

              <div className="meta-grid">
                <div>
                  <span>Feels like</span>
                  <strong>{formatTemperature(weather.current.feelsLike)}</strong>
                </div>
                <div>
                  <span>Humidity</span>
                  <strong>{weather.current.humidity}%</strong>
                </div>
                <div>
                  <span>Wind</span>
                  <strong>{Math.round(weather.current.wind)} km/h</strong>
                </div>
                <div>
                  <span>Pressure</span>
                  <strong>{Math.round(weather.current.pressure)} hPa</strong>
                </div>
              </div>
            </section>

            <section className="forecast-section">
              <h2>7-Day Forecast</h2>
              <div className="forecast-grid">
                {weather.daily.map((day) => {
                  const info = WEATHER_CODES[day.code] ?? { label: 'Unknown', icon: '🌡️' };

                  return (
                    <article key={day.date} className="forecast-card">
                      <p className="day-name">{day.day}</p>
                      <div className="forecast-icon" aria-hidden="true">{info.icon}</div>
                      <p className="forecast-condition">{info.label}</p>
                      <div className="forecast-temp">
                        <span>{formatTemperature(day.max)}</span>
                        <span className="low">{formatTemperature(day.min)}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
