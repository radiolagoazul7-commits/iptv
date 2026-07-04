class WeatherApp {
  constructor() {
    this.apiKey = '39a870a87fad431fa2f105949b9e7c8b'; // OpenWeatherMap API key
    this.savedCities = this.loadSavedCities();
    this.currentWeatherData = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.displaySavedCities();
  }

  setupEventListeners() {
    const searchBtn = document.getElementById('searchBtn');
    const cityInput = document.getElementById('cityInput');
    const locationBtn = document.getElementById('locationBtn');

    searchBtn.addEventListener('click', () => this.handleSearch());
    cityInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleSearch();
    });
    cityInput.addEventListener('input', (e) => this.handleSearchInput(e.target.value));
    locationBtn.addEventListener('click', () => this.getLocationWeather());
  }

  handleSearch() {
    const city = document.getElementById('cityInput').value.trim();
    if (city) {
      this.fetchWeatherByCity(city);
      document.getElementById('cityInput').value = '';
    }
  }

  async handleSearchInput(value) {
    if (value.length < 2) {
      document.getElementById('suggestions').classList.remove('active');
      return;
    }

    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${value}&limit=5&appid=${this.apiKey}`
      );
      const cities = await response.json();
      this.displaySuggestions(cities);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  }

  displaySuggestions(cities) {
    const suggestionsList = document.getElementById('suggestions');
    if (cities.length === 0) {
      suggestionsList.classList.remove('active');
      return;
    }

    suggestionsList.innerHTML = cities
      .map(
        (city) => `
        <div class="suggestion-item" onclick="weatherApp.selectCity('${city.name}', ${city.lat}, ${city.lon})">
          📍 ${city.name}${city.state ? ', ' + city.state : ''}, ${city.country}
        </div>
      `
      )
      .join('');
    suggestionsList.classList.add('active');
  }

  selectCity(name, lat, lon) {
    document.getElementById('suggestions').classList.remove('active');
    this.fetchWeatherByCoords(lat, lon);
  }

  async fetchWeatherByCity(city) {
    this.showLoading(true);
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error('City not found');
      }

      const data = await response.json();
      this.currentWeatherData = data;
      this.displayCurrentWeather(data);
      this.fetchForecast(data.coord.lat, data.coord.lon);
    } catch (error) {
      this.showError('City not found. Please try another search.');
    } finally {
      this.showLoading(false);
    }
  }

  async fetchWeatherByCoords(lat, lon) {
    this.showLoading(true);
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${this.apiKey}`
      );
      const data = await response.json();
      this.currentWeatherData = data;
      this.displayCurrentWeather(data);
      this.fetchForecast(lat, lon);
    } catch (error) {
      this.showError('Failed to fetch weather data');
    } finally {
      this.showLoading(false);
    }
  }

  getLocationWeather() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.fetchWeatherByCoords(latitude, longitude);
        },
        () => this.showError('Unable to access your location')
      );
    } else {
      this.showError('Geolocation is not supported by your browser');
    }
  }

  displayCurrentWeather(data) {
    const { name, main, weather, wind, clouds, sys } = data;
    const temp = Math.round(main.temp);
    const feelsLike = Math.round(main.feels_like);
    const icon = this.getWeatherIcon(weather[0].main);

    const html = `
      <div class="weather-header-info">
        <div>
          <div class="weather-location">
            📍 ${name}${sys.country ? ', ' + sys.country : ''}
          </div>
          <div class="weather-main">
            <div class="weather-icon">${icon}</div>
            <div>
              <div class="weather-temp">${temp}°C</div>
              <div class="weather-description">${weather[0].description}</div>
            </div>
          </div>
        </div>
        <div>
          <button class="btn btn-add" onclick="weatherApp.saveCityWeather('${name}')">
            ⭐ Save City
          </button>
        </div>
      </div>
      <div class="weather-details">
        <div class="detail-item">
          <div class="detail-label">Feels Like</div>
          <div class="detail-value">${feelsLike}°C</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Humidity</div>
          <div class="detail-value">${main.humidity}%</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Pressure</div>
          <div class="detail-value">${main.pressure} mb</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Wind Speed</div>
          <div class="detail-value">${(wind.speed * 3.6).toFixed(1)} km/h</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Cloud Cover</div>
          <div class="detail-value">${clouds.all}%</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">UV Index</div>
          <div class="detail-value">📊</div>
        </div>
      </div>
    `;

    document.getElementById('currentWeatherContent').innerHTML = html;
  }

  async fetchForecast(lat, lon) {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${this.apiKey}`
      );
      const data = await response.json();
      this.displayForecast(data.list);
    } catch (error) {
      console.error('Error fetching forecast:', error);
    }
  }

  displayForecast(forecastList) {
    // Get one forecast per day (every 8th item represents next day at same time)
    const dailyForecasts = forecastList.filter((_, index) => index % 8 === 0).slice(0, 5);

    const html = dailyForecasts
      .map((forecast) => {
        const date = new Date(forecast.dt * 1000);
        const dateStr = date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
        const icon = this.getWeatherIcon(forecast.weather[0].main);
        const high = Math.round(forecast.main.temp_max);
        const low = Math.round(forecast.main.temp_min);

        return `
          <div class="forecast-card">
            <div class="forecast-date">${dateStr}</div>
            <div class="forecast-icon">${icon}</div>
            <div class="forecast-temp">
              <span class="forecast-high">↑ ${high}°</span>
              <span class="forecast-low">↓ ${low}°</span>
            </div>
            <div class="forecast-desc">${forecast.weather[0].main}</div>
          </div>
        `;
      })
      .join('');

    document.getElementById('forecastGrid').innerHTML = html;
  }

  getWeatherIcon(condition) {
    const icons = {
      'Thunderstorm': '⛈️',
      'Drizzle': '🌧️',
      'Rain': '🌧️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Smoke': '💨',
      'Haze': '🌫️',
      'Dust': '🌪️',
      'Fog': '🌫️',
      'Sand': '🌪️',
      'Ash': '🌋',
      'Squall': '💨',
      'Tornado': '🌪️',
      'Clear': '☀️',
      'Clouds': '☁️',
    };

    return icons[condition] || '🌤️';
  }

  saveCityWeather(cityName) {
    if (!this.currentWeatherData) return;

    const cityData = {
      name: cityName,
      temp: Math.round(this.currentWeatherData.main.temp),
      condition: this.currentWeatherData.weather[0].main,
      lat: this.currentWeatherData.coord.lat,
      lon: this.currentWeatherData.coord.lon,
      addedAt: new Date().toISOString(),
    };

    // Check if city already exists
    const exists = this.savedCities.some(
      (c) => c.name.toLowerCase() === cityName.toLowerCase()
    );

    if (!exists) {
      this.savedCities.push(cityData);
      this.saveCitiesToStorage();
      this.displaySavedCities();
      this.showSuccess(`✅ ${cityName} added to saved cities`);
    } else {
      this.showError(`⚠️ ${cityName} is already saved`);
    }
  }

  displaySavedCities() {
    const container = document.getElementById('savedCitiesList');

    if (this.savedCities.length === 0) {
      container.innerHTML = '<div class="empty-state">No saved cities yet. Search and add cities to save.</div>';
      return;
    }

    const html = this.savedCities
      .map(
        (city, index) => `
        <div class="city-card" onclick="weatherApp.fetchWeatherByCoords(${city.lat}, ${city.lon})">
          <div class="city-name">${city.name}</div>
          <div class="city-temp">${city.temp}°C</div>
          <div class="city-condition">${city.condition}</div>
          <div class="city-actions">
            <button class="btn btn-add" onclick="event.stopPropagation(); weatherApp.fetchWeatherByCoords(${city.lat}, ${city.lon})">
              🔄 Refresh
            </button>
            <button class="btn btn-remove" onclick="event.stopPropagation(); weatherApp.removeCity(${index})">
              🗑️ Remove
            </button>
          </div>
        </div>
      `
      )
      .join('');

    container.innerHTML = html;
  }

  removeCity(index) {
    if (confirm('Remove this city from saved list?')) {
      this.savedCities.splice(index, 1);
      this.saveCitiesToStorage();
      this.displaySavedCities();
      this.showSuccess('✅ City removed');
    }
  }

  loadSavedCities() {
    const stored = localStorage.getItem('savedWeatherCities');
    return stored ? JSON.parse(stored) : [];
  }

  saveCitiesToStorage() {
    localStorage.setItem('savedWeatherCities', JSON.stringify(this.savedCities));
  }

  showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (show) {
      spinner.classList.add('active');
    } else {
      spinner.classList.remove('active');
    }
  }

  showError(message) {
    const toast = document.getElementById('errorToast');
    toast.textContent = message;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 3000);
  }

  showSuccess(message) {
    const toast = document.getElementById('errorToast');
    toast.textContent = message;
    toast.className = 'toast toast-success active';
    setTimeout(() => toast.classList.remove('active'), 3000);
  }
}

// Initialize the app
const weatherApp = new WeatherApp();
