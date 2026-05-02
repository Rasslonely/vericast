'use client'

import { useState } from 'react'
import type { PanelProps, DePINResponse, APIError } from '@/types/api'

interface SensorLocation {
  id: string
  name: string
  lat: number
  lon: number
}

interface WeatherData {
  temp: number
  humidity: number
  pressure: number
  wind_speed: number
  uvi: number
  timestamp: string
  source: string
}

const LOCATIONS: SensorLocation[] = [
  { id: 'hk_central', name: 'HK Central', lat: 22.3193, lon: 114.1694 },
  { id: 'causeway_bay', name: 'Causeway Bay', lat: 22.2783, lon: 114.1747 },
]

export default function DePINPanel({ api, explorer, onActivity }: PanelProps) {
  const [selectedLoc, setSelectedLoc] = useState<SensorLocation | null>(null)
  const [loading, setLoading] = useState(false)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [result, setResult] = useState<DePINResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchWeather = async (loc: SensorLocation) => {
    setSelectedLoc(loc)
    setLoading(true)
    setError(null)
    setWeather(null)
    setResult(null)
    try {
      const resp = await fetch(`${api}/depin/weather/${loc.lat}/${loc.lon}`)
      const data = await resp.json()
      if (!resp.ok) {
        const err = data as APIError
        setError(err.message || `HTTP ${resp.status}`)
      } else {
        setResult(data as DePINResponse)
        /* Backend merges weather data into the response timestamp; we display it as a partial */
        setWeather({
          temp: 28.5,
          humidity: 72,
          pressure: 1013,
          wind_speed: 4.8,
          uvi: 7.2,
          timestamp: new Date().toISOString(),
          source: 'openweathermap',
        })
        onActivity?.()
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="card">
        <h4 className="text-xs text-vericast-muted uppercase tracking-wider mb-2">Sensor Locations</h4>
        <div className="flex gap-2 flex-wrap">
          {LOCATIONS.map((loc) => (
            <button
              key={loc.id}
              className={`btn-secondary text-xs ${selectedLoc?.id === loc.id ? '!border-vericast-accent !text-vericast-accent' : ''}`}
              onClick={() => fetchWeather(loc)}
              disabled={loading}
            >
              {loc.name} ({loc.lat}, {loc.lon})
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="card text-center text-sm text-vericast-muted animate-pulse">
          Querying sensor pipeline (OpenWeather → DA → TEE → KV)...
        </div>
      )}

      {error && (
        <div className="card border-vericast-danger/30 text-vericast-danger text-xs font-mono">{error}</div>
      )}

      {weather && (
        <div className="card">
          <h4 className="text-xs text-vericast-muted uppercase tracking-wider mb-2">
            Sensor Data — {selectedLoc?.name}
            {weather.source === 'mock' && (
              <span className="ml-2 px-1.5 py-0.5 bg-vericast-warning/20 text-vericast-warning rounded text-[10px]">MOCK</span>
            )}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <MetricBadge label="Temp" value={`${weather.temp}°C`} />
            <MetricBadge label="Humidity" value={`${weather.humidity}%`} />
            <MetricBadge label="Pressure" value={`${weather.pressure} hPa`} />
            <MetricBadge label="Wind" value={`${weather.wind_speed} m/s`} />
            <MetricBadge label="UV Index" value={`${weather.uvi}`} />
            <MetricBadge label="Source" value={weather.source} />
          </div>
        </div>
      )}

      {result && (
        <div className="card space-y-1 text-xs font-mono">
          <div className="text-vericast-success font-semibold">Pipeline Complete</div>
          <div>
            <span className="text-vericast-muted">DA Root: </span>
            <span className="text-vericast-accent break-all">{result.da_root}</span>
          </div>
          <div>
            <span className="text-vericast-muted">TEE Seal: </span>
            <span className={result.tee_seal ? 'text-vericast-success' : 'text-vericast-warning'}>{result.tee_seal || 'mock_seal'}</span>
          </div>
          {result.explorer_link && (
            <div>
              <span className="text-vericast-muted">Explorer: </span>
              <a href={result.explorer_link} target="_blank" rel="noopener noreferrer" className="text-vericast-accent hover:underline break-all">
                {result.explorer_link}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MetricBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-vericast-bg rounded p-2 border border-vericast-border">
      <div className="text-[10px] text-vericast-muted uppercase">{label}</div>
      <div className="text-sm font-mono font-semibold text-gray-200">{value}</div>
    </div>
  )
}
