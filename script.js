const weather = {

  get inputEl() {
    // HTML has <div class="searchbar"> and <input class="searchbar">
    // grab the input.
    return document.querySelector(".searchbar input.searchbar");
  },
// scop
  fetchWeather: async function (city) {
    if (!city || !city.trim()) return;
    const cleanCity = city.trim();

    try {
      
    //  const url =
     //   "https://api.openweathermap.org/data/2.5/weather?q=" +
     //   encodeURIComponent(cleanCity) +
     //  "&units=imperial&appid=" + // Fahrenheit + mph
     //   this.apiKey;

        const url = `/api/weather?city=${encodeURIComponent(cleanCity)}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`City not found or API error (status ${response.status})`);
      }

      const data = await response.json();
      this.displayWeather(data);

      //  Fetch forecast after current weather card
      await this.fetchForecast(cleanCity);
    } catch (err) {
      console.error(err);
      document.querySelector(".city").innerText = "City not found";
      document.querySelector(".description").innerText = "Try another city.";
      document.querySelector(".temp").innerText = "";
      document.querySelector(".humidity").innerText = "";
      document.querySelector(".wind").innerText = "";
      document.querySelector(".icon").src = "";

      // Clear forecast UI on error
      const forecastEl = document.querySelector(".forecast-list");
      if (forecastEl) forecastEl.innerHTML = "";
    }
  },

  fetchForecast: async function (city) {
    try {
    //  const url =
     //   "https://api.openweathermap.org/data/2.5/forecast?q=" +
     //   encodeURIComponent(city) +
    //    "&units=imperial&appid=" + // Fahrenheit + mph
    //    this.apiKey;

        const url = `/api/forecast?city=${encodeURIComponent(city)}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Forecast API error (status ${response.status})`);
      }

      const data = await response.json();
      this.displayForecast(data);
    } catch (err) {
      console.error(err);
      const forecastEl = document.querySelector(".forecast-list");
      if (forecastEl) forecastEl.innerHTML = "";
    }
  },

  displayWeather: function (data) {
    const name = data.name;
    const icon = data.weather?.[0]?.icon;
    const description = data.weather?.[0]?.description ?? "";
    const tempF = data.main?.temp;
    const humidity = data.main?.humidity;
    const speedMph = data.wind?.speed; // mph when units=imperial

    document.querySelector(".city").innerText = name;
    document.querySelector(".description").innerText =
      description.charAt(0).toUpperCase() + description.slice(1);

    if (typeof tempF === "number") {
      document.querySelector(".temp").innerText = `Temperature: ${tempF.toFixed(1)} °F`;
    }

    if (typeof humidity === "number") {
      document.querySelector(".humidity").innerText = `Humidity: ${humidity}%`;
    }

    if (typeof speedMph === "number") {
      document.querySelector(".wind").innerText = `Wind Speed: ${speedMph.toFixed(1)} mph`;
    }

    if (icon) {
      document.querySelector(".icon").src = `https://openweathermap.org/img/wn/${icon}@4x.png`;
      document.querySelector(".icon").alt = description;
    }
  },

  displayForecast: function (data) {
    const forecastEl = document.querySelector(".forecast-list");
    if (!forecastEl) return;

    // data.list is 3-hour chunks for ~5 days
    const items = Array.isArray(data.list) ? data.list : [];

    // Group by date 
    const byDay = new Map();
    for (const item of items) {
      const dtTxt = item.dt_txt; // "timestamp, 2026-03-02 12:00:00"
      if (!dtTxt) continue;

      const dateKey = dtTxt.slice(0, 10);
      if (!byDay.has(dateKey)) byDay.set(dateKey, []);
      byDay.get(dateKey).push(item);
    }

    // Build daily summaries
    const days = Array.from(byDay.keys()).sort(); // chronological
    // includes "today" as first day; take next 5 days including today
    const next5 = days.slice(0, 5);

    const summaries = next5.map((dateKey) => {
      const dayItems = byDay.get(dateKey) || [];

      let min = Infinity;
      let max = -Infinity;

      for (const it of dayItems) {
        const t = it.main?.temp;
        if (typeof t === "number") {
          if (t < min) min = t;
          if (t > max) max = t;
        }
      }

      // tageting the 12:00
      const noon = dayItems.find((it) => (it.dt_txt || "").includes("12:00:00")) || dayItems[0] || {};
      const icon = noon.weather?.[0]?.icon || "";
      const desc = noon.weather?.[0]?.description || "";

      return { dateKey, min, max, icon, desc };
    });

    // Render
    forecastEl.innerHTML = summaries
      .map((d) => {
        const date = new Date(d.dateKey + "T00:00:00");
        const label = date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

        const minTxt = Number.isFinite(d.min) ? `${d.min.toFixed(0)}°F` : "--";
        const maxTxt = Number.isFinite(d.max) ? `${d.max.toFixed(0)}°F` : "--";

        const iconHtml = d.icon
          ? `<img src="https://openweathermap.org/img/wn/${d.icon}@2x.png" 
          alt="${d.desc}">`
          : "";

        const descTxt = d.desc ? d.desc.charAt(0).toUpperCase() + d.desc.slice(1) : "";

        return `
          <div class="forecast-item" title="${descTxt}">
            <div>${label}</div>
            <div style="display:flex; gap:9px; align-items:center;">
              ${iconHtml}
              <div>${maxTxt} / ${minTxt}</div>
            </div>
          </div>
        `;
      })
      .join("");
  },

  search: function () {
    const city = this.inputEl?.value || "";
    this.fetchWeather(city);
  },

  init: function () {
    const button = document.querySelector(".searcher");

    button?.addEventListener("click", () => this.search());

    this.inputEl?.addEventListener("keyup", (event) => {
      if (event.key === "Enter") this.search();
    });

    // Default city, from start
    this.fetchWeather("San Francisco");
  },
};

document.addEventListener("DOMContentLoaded", () => weather.init());