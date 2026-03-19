// Weather Intelligence Service
// Integrates OpenWeatherMap API with simulated fallback

const generateSimulatedWeather = (lat, lng) => {
  // Generate seasonal, location-aware weather
  const now = new Date();
  const month = now.getMonth();
  
  // Tropical/subtropical base for Indian agriculture
  const seasonalTemp = {
    0: 18, 1: 21, 2: 27, 3: 33, 4: 37, 5: 35,
    6: 30, 7: 29, 8: 29, 9: 28, 10: 24, 11: 19
  };

  const seasonalRain = {
    0: 5, 1: 8, 2: 10, 3: 12, 4: 20, 5: 80,
    6: 180, 7: 200, 8: 170, 9: 90, 10: 25, 11: 8
  };

  const conditions = ['clear', 'partly_cloudy', 'cloudy', 'light_rain', 'rain', 'thunderstorm', 'haze'];
  const rainProbability = seasonalRain[month] / 200;
  const conditionIndex = Math.min(conditions.length - 1, Math.floor(Math.random() * (1 + rainProbability * 3)));

  const baseTemp = seasonalTemp[month] + (Math.random() - 0.5) * 6;
  const rainfall = Math.random() < rainProbability ? seasonalRain[month] * (0.5 + Math.random()) / 30 : 0;

  return {
    temperature: parseFloat(baseTemp.toFixed(1)),
    feelsLike: parseFloat((baseTemp + (Math.random() - 0.5) * 4).toFixed(1)),
    humidity: parseFloat((40 + Math.random() * 50).toFixed(1)),
    rainfall: parseFloat(rainfall.toFixed(1)),
    windSpeed: parseFloat((5 + Math.random() * 25).toFixed(1)),
    windDirection: Math.floor(Math.random() * 360),
    solarRadiation: parseFloat((200 + Math.random() * 800).toFixed(0)),
    pressure: parseFloat((1005 + Math.random() * 20).toFixed(0)),
    visibility: parseFloat((5 + Math.random() * 10).toFixed(1)),
    uvIndex: parseFloat((2 + Math.random() * 9).toFixed(1)),
    condition: conditions[conditionIndex],
    icon: getWeatherIcon(conditions[conditionIndex]),
    source: 'simulated',
    location: {
      type: 'Point',
      coordinates: [lng, lat]
    },
    recordedAt: now
  };
};

const getWeatherIcon = (condition) => {
  const icons = {
    clear: '☀️',
    partly_cloudy: '⛅',
    cloudy: '☁️',
    light_rain: '🌦️',
    rain: '🌧️',
    thunderstorm: '⛈️',
    haze: '🌫️'
  };
  return icons[condition] || '🌤️';
};

const fetchFromOpenWeatherMap = async (lat, lng, apiKey) => {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`
    );
    
    if (!response.ok) throw new Error('OpenWeatherMap API error');
    
    const data = await response.json();
    
    return {
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      rainfall: data.rain?.['1h'] || 0,
      windSpeed: data.wind.speed * 3.6, // m/s to km/h
      windDirection: data.wind.deg,
      solarRadiation: null,
      pressure: data.main.pressure,
      visibility: (data.visibility || 10000) / 1000,
      uvIndex: null,
      condition: data.weather[0]?.main?.toLowerCase() || 'clear',
      icon: data.weather[0]?.icon || '',
      source: 'openweathermap',
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      recordedAt: new Date()
    };
  } catch (err) {
    console.log('OpenWeatherMap fetch failed, using simulated data:', err.message);
    return null;
  }
};

// Fetch 5-day / 3-hour forecast from OpenWeatherMap
const fetchForecastFromOpenWeatherMap = async (lat, lng, apiKey) => {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`
    );

    if (!response.ok) throw new Error('OpenWeatherMap forecast API error');

    const data = await response.json();

    // Group by day and pick midday reading for each day
    const dailyMap = {};
    for (const item of data.list) {
      const date = item.dt_txt.split(' ')[0]; // "2026-03-20"
      const hour = parseInt(item.dt_txt.split(' ')[1].split(':')[0]);
      // Prefer the 12:00 reading for each day, otherwise keep the first one
      if (!dailyMap[date] || Math.abs(hour - 12) < Math.abs(parseInt(dailyMap[date].dt_txt.split(' ')[1].split(':')[0]) - 12)) {
        dailyMap[date] = item;
      }
    }

    const forecast = Object.values(dailyMap).slice(0, 5).map(item => {
      const conditionMain = item.weather[0]?.main?.toLowerCase() || 'clear';
      return {
        date: item.dt_txt.split(' ')[0],
        dayName: new Date(item.dt_txt).toLocaleDateString('en', { weekday: 'short' }),
        tempMin: item.main.temp_min,
        tempMax: item.main.temp_max,
        temperature: item.main.temp,
        feelsLike: item.main.feels_like,
        humidity: item.main.humidity,
        rainfall: item.rain?.['3h'] || 0,
        windSpeed: item.wind.speed * 3.6,
        condition: conditionMain,
        description: item.weather[0]?.description || conditionMain,
        icon: getWeatherIcon(mapOwmCondition(conditionMain)),
        pop: Math.round((item.pop || 0) * 100), // precipitation probability %
        pressure: item.main.pressure,
        source: 'openweathermap'
      };
    });

    return forecast;
  } catch (err) {
    console.log('OpenWeatherMap forecast fetch failed:', err.message);
    return null;
  }
};

// Map OWM condition names to our icon keys
const mapOwmCondition = (owmCondition) => {
  const map = {
    clear: 'clear',
    clouds: 'cloudy',
    rain: 'rain',
    drizzle: 'light_rain',
    thunderstorm: 'thunderstorm',
    snow: 'cloudy',
    mist: 'haze',
    smoke: 'haze',
    haze: 'haze',
    dust: 'haze',
    fog: 'haze',
    sand: 'haze',
    ash: 'haze',
    squall: 'thunderstorm',
    tornado: 'thunderstorm'
  };
  return map[owmCondition] || 'partly_cloudy';
};

// Generate simulated 5-day forecast
const generateSimulatedForecast = (lat, lng) => {
  const now = new Date();
  const month = now.getMonth();

  const seasonalTemp = {
    0: 18, 1: 21, 2: 27, 3: 33, 4: 37, 5: 35,
    6: 30, 7: 29, 8: 29, 9: 28, 10: 24, 11: 19
  };
  const seasonalRain = {
    0: 5, 1: 8, 2: 10, 3: 12, 4: 20, 5: 80,
    6: 180, 7: 200, 8: 170, 9: 90, 10: 25, 11: 8
  };

  const conditions = ['clear', 'partly_cloudy', 'cloudy', 'light_rain', 'rain', 'thunderstorm', 'haze'];
  const forecast = [];

  for (let i = 1; i <= 5; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    const futureMonth = date.getMonth();

    const baseTemp = seasonalTemp[futureMonth] + (Math.random() - 0.5) * 6;
    const rainProbability = seasonalRain[futureMonth] / 200;
    const conditionIndex = Math.min(conditions.length - 1, Math.floor(Math.random() * (1 + rainProbability * 3)));
    const rainfall = Math.random() < rainProbability ? seasonalRain[futureMonth] * (0.5 + Math.random()) / 30 : 0;
    const condition = conditions[conditionIndex];

    forecast.push({
      date: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en', { weekday: 'short' }),
      tempMin: parseFloat((baseTemp - 2 - Math.random() * 3).toFixed(1)),
      tempMax: parseFloat((baseTemp + 2 + Math.random() * 3).toFixed(1)),
      temperature: parseFloat(baseTemp.toFixed(1)),
      feelsLike: parseFloat((baseTemp + (Math.random() - 0.5) * 4).toFixed(1)),
      humidity: parseFloat((40 + Math.random() * 50).toFixed(1)),
      rainfall: parseFloat(rainfall.toFixed(1)),
      windSpeed: parseFloat((5 + Math.random() * 25).toFixed(1)),
      condition,
      description: condition.replace('_', ' '),
      icon: getWeatherIcon(condition),
      pop: Math.round(rainProbability * 100 + (Math.random() - 0.5) * 20),
      pressure: parseFloat((1005 + Math.random() * 20).toFixed(0)),
      source: 'simulated'
    });
  }

  return forecast;
};

const getWeatherData = async (lat, lng) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  
  if (apiKey && apiKey !== 'your_openweather_api_key_here') {
    const realData = await fetchFromOpenWeatherMap(lat, lng, apiKey);
    if (realData) return realData;
  }
  
  return generateSimulatedWeather(lat, lng);
};

// Get 5-day weather forecast (real or simulated)
const getWeatherForecast = async (lat, lng) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (apiKey && apiKey !== 'your_openweather_api_key_here') {
    const realForecast = await fetchForecastFromOpenWeatherMap(lat, lng, apiKey);
    if (realForecast) return realForecast;
  }

  return generateSimulatedForecast(lat, lng);
};

const generateHistoricalWeather = (lat, lng, days = 30) => {
  const readings = [];
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const weather = generateSimulatedWeather(lat, lng);
    weather.recordedAt = date;
    readings.push(weather);
  }

  return readings;
};

module.exports = { getWeatherData, getWeatherForecast, generateHistoricalWeather, generateSimulatedWeather };
