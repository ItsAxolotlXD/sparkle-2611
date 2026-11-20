import useSWR from 'swr';

export interface HanoiWeatherSnapshot {
  temp: number;
  condition: 'cloudy' | 'sunny' | 'rain';
  conditionLabel: string;
  summary: string;
  humidity: number;
  wind: string;
  hourly: Array<{ time: string; temp: number; rain: number }>;
  daily: Array<{ day: string; icon: 'rain' | 'partly' | 'sunny'; high: number; low: number; rain: number }>;
}

interface OpenMeteoForecast {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    time: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
}

const FORECAST_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=21.0285&longitude=105.8542&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FBangkok&forecast_days=5';
const WEATHER_REFRESH_MS = 10 * 60 * 1000;
const WEATHER_TIME_ZONE = 'Asia/Bangkok';

function conditionFromCode(code: number): HanoiWeatherSnapshot['condition'] {
  if (code >= 51) return 'rain';
  if (code <= 1) return 'sunny';
  return 'cloudy';
}

function conditionLabelFromCode(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mostly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 51 && code < 70) return 'Drizzle';
  if (code >= 70 && code < 80) return 'Snow';
  if (code >= 80 && code < 90) return 'Rain showers';
  if (code >= 90) return 'Thunderstorms';
  return 'Cloudy';
}

function dailyIconFromCode(code: number): HanoiWeatherSnapshot['daily'][number]['icon'] {
  if (code >= 51) return 'rain';
  if (code <= 1) return 'sunny';
  return 'partly';
}

async function fetchHanoiWeather(): Promise<HanoiWeatherSnapshot> {
  const response = await fetch(FORECAST_URL);
  if (!response.ok) throw new Error('Weather forecast is temporarily unavailable');
  const forecast = (await response.json()) as OpenMeteoForecast;
  const currentIndex = Math.max(
    0,
    forecast.hourly.time.findIndex((time) => time >= forecast.current.time)
  );
  const hourly = forecast.hourly.time
    .slice(currentIndex, currentIndex + 5)
    .map((time, index) => ({
      time: new Date(`${time}:00+07:00`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        timeZone: WEATHER_TIME_ZONE,
      }),
      temp: Math.round(forecast.hourly.temperature_2m[currentIndex + index]),
      rain: Math.round(forecast.hourly.precipitation_probability[currentIndex + index] || 0),
    }));
  const daily = forecast.daily.time.slice(0, 5).map((date, index) => ({
    day: new Date(`${date}T12:00:00+07:00`).toLocaleDateString('en-US', {
      weekday: 'short',
      timeZone: WEATHER_TIME_ZONE,
    }),
    icon: dailyIconFromCode(forecast.daily.weather_code[index]),
    high: Math.round(forecast.daily.temperature_2m_max[index]),
    low: Math.round(forecast.daily.temperature_2m_min[index]),
    rain: Math.round(forecast.daily.precipitation_probability_max[index] || 0),
  }));
  const conditionLabel = conditionLabelFromCode(forecast.current.weather_code);

  return {
    temp: Math.round(forecast.current.temperature_2m),
    condition: conditionFromCode(forecast.current.weather_code),
    conditionLabel,
    summary: `Feels like ${Math.round(forecast.current.apparent_temperature)}°C · Live forecast`,
    humidity: forecast.current.relative_humidity_2m,
    wind: `${Math.round(forecast.current.wind_speed_10m)} km/h`,
    hourly,
    daily,
  };
}

export function useHanoiWeather() {
  return useSWR<HanoiWeatherSnapshot>('hanoi-live-weather', fetchHanoiWeather, {
    refreshInterval: WEATHER_REFRESH_MS,
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
}
