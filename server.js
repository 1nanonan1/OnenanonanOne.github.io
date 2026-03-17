require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const OPENWEATHER_API_Key = process.env.OPENWEATHER_API_Key;

// Log every request from THIS server.js as the one responding
app.use((req, res, next) => {
  console.log(`[server.js] ${req.method} ${req.url}`);
  next();
});

// Serve files from the same folder as server.js
app.use(express.static(__dirname));

// Home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true, from: "server.js", time: new Date().toISOString() });
});

app.get("/api/weather", async (req, res) => {
  const city = req.query.city;

  if (!city || !city.trim()) {
    return res.status(400).json({ error: "City is required" });
  }

  if (!OPENWEATHER_API_Key) {
    return res.status(500).json({ error: "Missing OPENWEATHER_API_KEY in .env" });
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city.trim())}&units=imperial&appid=${OPENWEATHER_API_Key}`
    );

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Weather API error:", error);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

app.get("/api/forecast", async (req, res) => {
  const city = req.query.city;

  if (!city || !city.trim()) {
    return res.status(400).json({ error: "City is required" });
  }

  if (!OPENWEATHER_API_Key) {
    return res.status(500).json({ error: "Missing OPENWEATHER_API_KEY in .env" });
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city.trim())}&units=imperial&appid=${OPENWEATHER_API_Key}`
    );

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Forecast API error:", error);
    res.status(500).json({ error: "Failed to fetch forecast data" });
  }
});

app.listen(PORT, () => {
  console.log(`server.js running at http://localhost:${PORT}`);
  console.log(`health check: http://localhost:${PORT}/health`);
});