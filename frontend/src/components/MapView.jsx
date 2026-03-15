import { MapContainer, TileLayer, Marker, Popup, Polygon, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState } from 'react';

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createCustomIcon = (color = '#22c55e') => {
  return L.divIcon({
    html: `<div style="
      background: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    "></div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

// Map tile layer configurations
const MAP_LAYERS = {
  dark: {
    name: '🌑 Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 20,
  },
  satellite: {
    name: '🛰️ Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar',
    maxZoom: 19,
  },
  terrain: {
    name: '⛰️ Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
  },
  street: {
    name: '🗺️ Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
    maxZoom: 19,
  },
  vegetation: {
    name: '🌿 Vegetation',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri | NDVI overlay',
    maxZoom: 19,
    overlay: 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
  },
  soil: {
    name: '🟫 Soil Map',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri | Soil overlay',
    maxZoom: 19,
  },
};

const MapView = ({ farms = [], center = [20.5937, 78.9629], zoom = 5, height = '400px', onFarmClick, showBoundary = true, showLayerSwitcher = true }) => {
  const [activeLayer, setActiveLayer] = useState('dark');

  const getHealthColor = (score) => {
    if (score >= 75) return '#22c55e';
    if (score >= 50) return '#f59e0b';
    if (score >= 25) return '#f97316';
    return '#ef4444';
  };

  const currentLayer = MAP_LAYERS[activeLayer];

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 relative" style={{ height }}>
      {/* Layer Switcher UI */}
      {showLayerSwitcher && (
        <div className="absolute top-3 right-3 z-[1000]">
          <div className="bg-[#0a0f1a]/90 backdrop-blur-xl rounded-xl border border-white/10 p-1.5 shadow-2xl">
            <div className="grid grid-cols-3 gap-1" style={{ minWidth: '200px' }}>
              {Object.entries(MAP_LAYERS).map(([key, layer]) => (
                <button
                  key={key}
                  onClick={() => setActiveLayer(key)}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-200 whitespace-nowrap
                    ${activeLayer === key 
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' 
                      : 'text-white/50 hover:text-white hover:bg-white/10 border border-transparent'
                    }`}
                >
                  {layer.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          key={activeLayer}
          attribution={currentLayer.attribution}
          url={currentLayer.url}
          maxZoom={currentLayer.maxZoom}
        />

        {/* NDVI-style vegetation overlay when in vegetation mode */}
        {activeLayer === 'vegetation' && (
          <TileLayer
            url="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/2024-01-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png"
            attribution="NASA EOSDIS GIBS"
            opacity={0.5}
            maxZoom={9}
          />
        )}

        {/* Soil/land cover overlay when in soil mode */}
        {activeLayer === 'soil' && (
          <TileLayer
            url="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Land_Cover_Type_1/default/2022-01-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png"
            attribution="NASA EOSDIS GIBS"
            opacity={0.5}
            maxZoom={9}
          />
        )}
        
        {farms.map((farm) => {
          const lat = farm.location?.coordinates?.[1] || 20.5;
          const lng = farm.location?.coordinates?.[0] || 78.9;

          return (
            <div key={farm._id}>
              <Marker
                position={[lat, lng]}
                icon={createCustomIcon(getHealthColor(farm.healthScore || 75))}
                eventHandlers={{
                  click: () => onFarmClick && onFarmClick(farm)
                }}
              >
                <Popup>
                  <div className="min-w-[180px]">
                    <h3 className="font-bold text-sm mb-1">{farm.name}</h3>
                    <p className="text-xs opacity-80">Crop: {farm.cropType}</p>
                    <p className="text-xs opacity-80">Size: {farm.size} ha</p>
                    <p className="text-xs opacity-80">Health: {farm.healthScore || 75}%</p>
                  </div>
                </Popup>
              </Marker>

              {showBoundary && farm.boundary?.coordinates && (
                <Polygon
                  positions={farm.boundary.coordinates[0]?.map(c => [c[1], c[0]]) || []}
                  pathOptions={{
                    color: getHealthColor(farm.healthScore || 75),
                    fillColor: getHealthColor(farm.healthScore || 75),
                    fillOpacity: 0.15,
                    weight: 2
                  }}
                />
              )}
            </div>
          );
        })}
      </MapContainer>

      {/* Layer Info Badge */}
      <div className="absolute bottom-3 left-3 z-[1000]">
        <div className="bg-[#0a0f1a]/80 backdrop-blur-md rounded-lg px-3 py-1.5 border border-white/10">
          <span className="text-[10px] text-white/50">
            {activeLayer === 'satellite' && '📡 Esri/Maxar Satellite Imagery'}
            {activeLayer === 'dark' && '🗺️ CartoDB Dark Basemap'}
            {activeLayer === 'terrain' && '⛰️ OpenTopoMap Terrain'}
            {activeLayer === 'street' && '🏙️ OpenStreetMap Standard'}
            {activeLayer === 'vegetation' && '🌿 MODIS NDVI Vegetation Index'}
            {activeLayer === 'soil' && '🟫 MODIS Land Cover Classification'}
          </span>
        </div>
      </div>
    </div>
  );
};

export { createCustomIcon };
export default MapView;
