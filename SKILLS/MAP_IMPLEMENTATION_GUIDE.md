# Map Implementation Guide

This guide is based on the working Leaflet map implementation in the MLHCP platform project. Two approaches are covered: **Leaflet** (free, no API key) and **Google Maps** (requires paid API key).

## Approach 1: Leaflet (Recommended — Free, No API Key)

### 1. Install Dependencies

```bash
npm install leaflet react-leaflet @react-leaflet/core
npm install --save-dev @types/leaflet
```

Optional — for marker clustering:
```bash
npm install leaflet.markercluster
```

### 2. Create Coordinate Data File

Create `src/lib/coordinates.ts`:

```typescript
export const locationCoordinates: Record<string, { lat: number; lng: number }> = {
  "Location Name": { lat: -12.3333, lng: 39.3333 },
  // ... add your locations
}

export const defaultCenter = {
  lat: -18.665695,
  lng: 35.529562
}
```

### 3. Basic Map Component (with Markers & Popups)

```tsx
import React from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Custom marker icon (divIcon — no broken image icons)
const createCustomIcon = (label: string) => {
  return L.divIcon({
    html: `
      <div style="
        background: #1e3a5f;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
        border: 3px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.25);
      ">
        ${label.charAt(0).toUpperCase()}
      </div>
    `,
    className: "custom-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

interface SimpleMapProps {
  locations: string[]
  className?: string
  height?: string
}

const SimpleMap: React.FC<SimpleMapProps> = ({
  locations,
  className,
  height = "400px",
}) => {
  // Show empty state when no data
  if (locations.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-xl"
        style={{ height }}
      >
        <p className="text-gray-500">No locations to display</p>
      </div>
    )
  }

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ height }}>
      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={5}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ background: "#f8fafc" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {locations.map((location) => {
          const coords = locationCoordinates[location]
          if (!coords) return null

          return (
            <Marker
              key={location}
              position={[coords.lat, coords.lng]}
              icon={createCustomIcon(location)}
            >
              <Popup>
                <div style={{ padding: "4px 8px" }}>
                  <strong style={{ color: "#1e3a5f" }}>{location}</strong>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}

export default SimpleMap
```

### 4. Map with Marker Clustering (Many Markers)

```tsx
import React from "react"
import { MapContainer, TileLayer, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import "leaflet.markercluster"

const MarkerClusterMap: React.FC<{ markers: { name: string; lat: number; lng: number }[]; height?: string }> = ({
  markers,
  height = "400px",
}) => {
  // Sub-component that manages the cluster group
  const ClusterGroup = () => {
    const map = useMap()

    React.useEffect(() => {
      const markerClusterGroup = L.markerClusterGroup({
        chunkedLoading: true,
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        maxClusterRadius: 60,
        zoomToBoundsOnClick: true,
      })

      markers.forEach((item) => {
        const marker = L.marker([item.lat, item.lng], {
          icon: L.divIcon({
            html: `<div style="background:#1e3a5f;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);">${item.name.charAt(0)}</div>`,
            className: "cluster-marker",
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          }),
        })
        marker.bindPopup(`<strong>${item.name}</strong>`)
        markerClusterGroup.addLayer(marker)
      })

      map.addLayer(markerClusterGroup)
      if (markerClusterGroup.getLayers().length > 0) {
        map.fitBounds(markerClusterGroup.getBounds(), { padding: [30, 30] })
      }

      return () => {
        map.removeLayer(markerClusterGroup)
      }
    }, [map])

    return null
  }

  return (
    <div style={{ height, borderRadius: 12, overflow: "hidden" }}>
      <MapContainer center={[-18.66, 35.52]} zoom={5} scrollWheelZoom={true} className="h-full w-full">
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <ClusterGroup />
      </MapContainer>
    </div>
  )
}
```

### 5. Auto-Fit Map Bounds to Markers

To automatically zoom/pan so all markers are visible:

```tsx
import { useMap } from "react-leaflet"
import L from "leaflet"

const FitBounds = ({ coords }: { coords: { lat: number; lng: number }[] }) => {
  const map = useMap()

  React.useEffect(() => {
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords.map(c => [c.lat, c.lng] as L.LatLngTuple))
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 })
    }
  }, [map, coords])

  return null
}
```

### 6. Available Tile Layers (Free)

| Provider | URL | Notes |
|----------|-----|-------|
| CARTO Light | `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png` | Clean light theme (used in this project) |
| CARTO Dark | `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png` | Dark theme |
| OpenStreetMap | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | Standard OSM tiles |
| OpenTopoMap | `https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png` | Topographic |

---

## Approach 2: Google Maps (You have an API key)

### 1. Install

```bash
npm install @react-google-maps/api
```

### 2. Store Your API Key

In your `.env` file (already done if `VITE_GOOGLE_MAPS_API_KEY` exists):

```
VITE_GOOGLE_MAPS_API_KEY=your_actual_key_here
```

Access it in code as `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`.

### 3. Full Working Component (with Hover/Click InfoWindow)

This is the exact pattern used in this project's `MapComponent.tsx`:

```tsx
import React, { useState, useRef, useCallback, useEffect } from "react"
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api"

const containerStyle = { width: "100%", height: "400px", borderRadius: "0.75rem" }

// Your coordinate data
const locationCoords: Record<string, { lat: number; lng: number }> = {
  "Location A": { lat: -12.3333, lng: 39.3333 },
  "Location B": { lat: -23.3333, lng: 32.3333 },
}
const defaultCenter = { lat: -18.665695, lng: 35.529562 }

interface MapProps {
  apiKey: string
  locations: string[]
}

const GoogleMapComponent: React.FC<MapProps> = ({ apiKey, locations }) => {
  const [markers, setMarkers] = useState<{ lat: number; lng: number; title: string }[]>([])
  const [activeLocation, setActiveLocation] = useState<string | null>(null)
  const [isPinned, setIsPinned] = useState(false)
  const mapRef = useRef<google.maps.Map | null>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const newMarkers = locations
      .filter(loc => locationCoords[loc])
      .map(loc => ({ ...locationCoords[loc], title: loc }))
    setMarkers(newMarkers)
  }, [locations])

  const handleMarkerHover = useCallback((name: string) => {
    if (isPinned) return
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    setActiveLocation(name)
  }, [isPinned])

  const handleMarkerLeave = useCallback(() => {
    if (isPinned) return
    hoverTimeoutRef.current = setTimeout(() => setActiveLocation(null), 300)
  }, [isPinned])

  const handleMarkerClick = useCallback((name: string) => {
    if (activeLocation === name && isPinned) {
      setIsPinned(false)
      setActiveLocation(null)
    } else {
      setActiveLocation(name)
      setIsPinned(true)
    }
  }, [activeLocation, isPinned])

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
    if (markers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      markers.forEach(m => bounds.extend(m))
      map.fitBounds(bounds)
    }
  }, [markers])

  const onUnmount = useCallback(() => { mapRef.current = null }, [])

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={5}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {markers.map((m, i) => (
          <Marker
            key={i}
            position={{ lat: m.lat, lng: m.lng }}
            title={m.title}
            onMouseOver={() => handleMarkerHover(m.title)}
            onMouseOut={handleMarkerLeave}
            onClick={() => handleMarkerClick(m.title)}
          />
        ))}

        {activeLocation && locationCoords[activeLocation] && (
          <InfoWindow
            position={locationCoords[activeLocation]}
            onCloseClick={() => { setActiveLocation(null); setIsPinned(false) }}
          >
            <div style={{ padding: "8px" }}>
              <h3 style={{ fontWeight: "bold", color: "#1e3a5f", margin: 0 }}>{activeLocation}</h3>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  )
}
```

### 4. Usage

```tsx
import GoogleMapComponent from "./GoogleMapComponent"
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

;<GoogleMapComponent apiKey={apiKey} locations={["Location A", "Location B"]} />
```

---

### 5. Google Maps with Organization Data (InfoWindow with lists)

If you want the `InfoWindow` to show a list of items (like organizations per province), pass the data as a `Record<string, YourType[]>` and render a scrollable list inside the `InfoWindow` — exactly as done in `MapComponent.tsx:148-241`.

---



## Common Issues & Solutions

### Issue 1: Map container has 0 height
**Solution:** The map's parent must have a defined height. Always wrap `MapContainer` in a div with explicit height, or use `h-full` on the container and ensure the parent has height.

### Issue 2: Leaflet default marker icons are broken (showing missing image)
**Solution:** Don't use default `L.marker()`. Use `L.divIcon()` with inline HTML (as shown above) instead of image-based icons.

### Issue 3: "MapContainer is already initialized"
**Solution:** Ensure your `MapContainer` component mounts only once. Don't conditionally render it; show a fallback/empty state instead when there's no data.

### Issue 4: Map tiles not loading / blank map
**Solution:** Check the browser console for mixed content errors (HTTP vs HTTPS). Ensure all tile URLs use `https://`. If behind a corporate firewall, try a different tile provider.

### Issue 5: Google Maps billing errors
**Solution:** Google Maps requires a billing account even for the free tier. Enable billing, then set daily usage limits in the GCP console to avoid unexpected charges. Use Leaflet instead to avoid this entirely.

---

## Comparison

| Feature | Leaflet | Google Maps |
|---------|---------|-------------|
| Cost | Free | Free tier (then pay) |
| API Key needed | No | Yes |
| Map styling | CSS + custom icons | Built-in themes + cloud styling |
| Performance on many markers | With clustering, excellent | Good with MarkerClusterer |
| Offline capable | Yes (with cached tiles) | No |
| 3D / Street View | No | Yes |
| Setup time | 5 minutes | 30+ minutes (API key + billing) |

**Recommendation:** Use Leaflet unless you specifically need Google Street View, 3D terrain, or Google Places integration.

---

*Derived from the working implementation in `src/components/common/ProvinceMap.tsx` and `src/components/common/OrganizationMap.tsx`.*
