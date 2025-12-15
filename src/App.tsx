import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ArcLayer } from '@deck.gl/layers';

const ESRI_DARK_GRAY_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'esri-dark-gray': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution:
        'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    },
  },
  layers: [
    {
      id: 'esri-dark-gray',
      type: 'raster',
      source: 'esri-dark-gray',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

const DRONE_SPEED_PER_MS = 0.000002;

type CityId =
  | 'boston'
  | 'atlanta'
  | 'baltimore'
  | 'chicago'
  | 'denver'
  | 'dallas'
  | 'detroit'
  | 'minneapolis'
  | 'houston'
  | 'los-angeles'
  | 'miami'
  | 'new-orleans'
  | 'new-york'
  | 'philadelphia'
  | 'pittsburgh'
  | 'phoenix'
  | 'portland'
  | 'san-diego'
  | 'san-francisco'
  | 'seattle'
  | 'birmingham-uk'
  | 'bristol-uk'
  | 'edinburgh-uk'
  | 'glasgow-uk'
  | 'leeds-uk'
  | 'liverpool-uk'
  | 'london-uk'
  | 'manchester-uk'
  | 'newcastle-uk'
  | 'sheffield-uk';

const CITY_CONFIG: Record<CityId, { label: string; center: [number, number] }> = {
  atlanta: {
    label: 'Atlanta',
    center: [-84.388, 33.749],
  },
  baltimore: {
    label: 'Baltimore',
    center: [-76.6122, 39.2904],
  },
  boston: {
    label: 'Boston',
    center: [-71.0589, 42.3601],
  },
  chicago: {
    label: 'Chicago',
    center: [-87.6298, 41.8781],
  },
  dallas: {
    label: 'Dallas',
    center: [-96.797, 32.7767],
  },
  denver: {
    label: 'Denver',
    center: [-104.9903, 39.7392],
  },
  detroit: {
    label: 'Detroit',
    center: [-83.0458, 42.3314],
  },
  houston: {
    label: 'Houston',
    center: [-95.3698, 29.7604],
  },
  'los-angeles': {
    label: 'Los Angeles',
    center: [-118.2437, 34.0522],
  },
  miami: {
    label: 'Miami',
    center: [-80.1918, 25.7617],
  },
  minneapolis: {
    label: 'Minneapolis',
    center: [-93.265, 44.9778],
  },
  'new-orleans': {
    label: 'New Orleans',
    center: [-90.0715, 29.9511],
  },
  'new-york': {
    label: 'New York',
    center: [-74.006, 40.7128],
  },
  philadelphia: {
    label: 'Philadelphia',
    center: [-75.1652, 39.9526],
  },
  pittsburgh: {
    label: 'Pittsburgh',
    center: [-79.9959, 40.4406],
  },
  phoenix: {
    label: 'Phoenix',
    center: [-112.074, 33.4484],
  },
  portland: {
    label: 'Portland',
    center: [-122.6765, 45.5231],
  },
  'san-diego': {
    label: 'San Diego',
    center: [-117.1611, 32.7157],
  },
  'san-francisco': {
    label: 'San Francisco',
    center: [-122.4194, 37.7749],
  },
  seattle: {
    label: 'Seattle',
    center: [-122.335167, 47.608013],
  },
  'birmingham-uk': {
    label: 'Birmingham (UK)',
    center: [-1.8904, 52.4862],
  },
  'bristol-uk': {
    label: 'Bristol',
    center: [-2.5879, 51.4545],
  },
  'edinburgh-uk': {
    label: 'Edinburgh',
    center: [-3.1883, 55.9533],
  },
  'glasgow-uk': {
    label: 'Glasgow',
    center: [-4.2518, 55.8642],
  },
  'leeds-uk': {
    label: 'Leeds',
    center: [-1.5491, 53.8008],
  },
  'liverpool-uk': {
    label: 'Liverpool',
    center: [-2.9779, 53.4084],
  },
  'london-uk': {
    label: 'London',
    center: [-0.1276, 51.5074],
  },
  'manchester-uk': {
    label: 'Manchester',
    center: [-2.2426, 53.4808],
  },
  'newcastle-uk': {
    label: 'Newcastle upon Tyne',
    center: [-1.6178, 54.9783],
  },
  'sheffield-uk': {
    label: 'Sheffield',
    center: [-1.4701, 53.3811],
  },
};

const US_CITY_IDS: CityId[] = (
  [
    'atlanta',
    'baltimore',
    'boston',
    'chicago',
    'dallas',
    'denver',
    'detroit',
    'houston',
    'los-angeles',
    'miami',
    'minneapolis',
    'new-orleans',
    'new-york',
    'philadelphia',
    'phoenix',
    'portland',
    'san-diego',
    'san-francisco',
    'seattle',
    'pittsburgh',
  ] as CityId[]
).sort((a: CityId, b: CityId) =>
  CITY_CONFIG[a].label.localeCompare(CITY_CONFIG[b].label)
);

const UK_CITY_IDS: CityId[] = (
  [
    'birmingham-uk',
    'bristol-uk',
    'edinburgh-uk',
    'glasgow-uk',
    'leeds-uk',
    'liverpool-uk',
    'london-uk',
    'manchester-uk',
    'newcastle-uk',
    'sheffield-uk',
  ] as CityId[]
).sort((a: CityId, b: CityId) =>
  CITY_CONFIG[a].label.localeCompare(CITY_CONFIG[b].label)
);

const DEFAULT_CITY_ID: CityId = 'seattle';

const App: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const deckOverlayRef = useRef<MapboxOverlay | null>(null);
  const vehiclesDataRef = useRef<GeoJSON.FeatureCollection<GeoJSON.Point> | null>(
    null
  );
  const cadEventsDataRef = useRef<GeoJSON.FeatureCollection<GeoJSON.Point> | null>(
    null
  );
  const dronesDataRef = useRef<GeoJSON.FeatureCollection<GeoJSON.Point> | null>(
    null
  );
  const camerasDataRef = useRef<GeoJSON.FeatureCollection<GeoJSON.Point> | null>(
    null
  );

  const droneStateRef = useRef<
    Record<
      string,
      {
        status: 'flying' | 'docked';
        dock: [number, number];
        phase: 'toArea' | 'loiter' | 'toDock';
        area: [number, number];
        cadCoord: [number, number];
        cadIndex: number;
        waitUntil?: number;
        orbitAngle?: number;
      }
    >
  >({});

  const assignmentLinesRef = useRef<
    GeoJSON.FeatureCollection<GeoJSON.LineString>
  >({ type: 'FeatureCollection', features: [] });
  const droneLinksRef = useRef<
    GeoJSON.FeatureCollection<GeoJSON.LineString>
  >({ type: 'FeatureCollection', features: [] });

  const routesRef = useRef<
    Record<
      string,
      {
        coordinates: [number, number][];
        currentIndex: number;
        waitUntil?: number;
        assignedToCad?: boolean;
      }
    >
  >({});

  const planRoutesRef = useRef<() => void>(() => {
    // no-op default; set after map and sources are ready
  });

  const lastVehicleUpdateRef = useRef<number>(0);
  const lastDroneUpdateRef = useRef<number>(0);
  const selectedCadIndexRef = useRef<number | null>(null);

  const [styleLoaded, setStyleLoaded] = useState(false);
  const [showVehicles, setShowVehicles] = useState(true);
  const [showCameras, setShowCameras] = useState(false);
  const [showDrones, setShowDrones] = useState(true);
  const [selectedCadIndex, setSelectedCadIndex] = useState<number | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<CityId>(DEFAULT_CITY_ID);
  const [cadEvents, setCadEvents] = useState<
    { title: string; address: string; coordinates: [number, number] }[]
  >(() => []);

  const vehicleIds = [
    'vehicle-1',
    'vehicle-2',
    'vehicle-3',
    'vehicle-4',
    'vehicle-5',
    'vehicle-6',
    'vehicle-7',
    'vehicle-8',
    'vehicle-9',
    'vehicle-10',
  ];

  const crimeTypes = [
    'Armed Robbery',
    'Kidnapping in Progress',
    'Shots Fired',
    'Burglary Alarm',
    'Assault with Weapon',
    'Carjacking',
    'Domestic Dispute',
    'Suspicious Vehicle',
    'Pursuit in Progress',
    'Vandalism',
  ];

  const getRandomPointInBounds = (
    bounds: maplibregl.LngLatBounds
  ): [number, number] => {
    const west = bounds.getWest();
    const east = bounds.getEast();
    const south = bounds.getSouth();
    const north = bounds.getNorth();

    const lng = west + Math.random() * (east - west);
    const lat = south + Math.random() * (north - south);
    return [lng, lat];
  };

  const generateCadEventsForCity = (cityId: CityId) => {
    const city = CITY_CONFIG[cityId];
    if (!city) return [];

    const [centerLng, centerLat] = city.center;

    const streetNames = [
      'Main St',
      'Broadway',
      '1st Ave',
      '2nd Ave',
      '3rd Ave',
      'Pine St',
      'Oak St',
      'Maple Ave',
      'Cedar St',
      'Elm St',
    ];

    const events: { title: string; address: string; coordinates: [number, number] }[] = [];
    const count = 5 + Math.floor(Math.random() * 6); // 5-10 events

    for (let i = 0; i < count; i += 1) {
      const titleIdx = Math.floor(Math.random() * crimeTypes.length);
      const title = crimeTypes[titleIdx];

      const streetIdx = Math.floor(Math.random() * streetNames.length);
      const houseNumber = 100 + Math.floor(Math.random() * 900);
      const cityLabel = city.label;
      const address = `${houseNumber} ${streetNames[streetIdx]}, ${cityLabel}`;

      // jitter around city center for a rough in-city location
      const lngOffset = (Math.random() - 0.5) * 0.08; // ~few km
      const latOffset = (Math.random() - 0.5) * 0.08;
      const coordinates: [number, number] = [
        centerLng + lngOffset,
        centerLat + latOffset,
      ];

      events.push({ title, address, coordinates });
    }

    return events;
  };

  // Keep a ref in sync with selectedCadIndex so effects/handlers can read it
  // without causing the vehicles effect to re-run on every selection.
  useEffect(() => {
    selectedCadIndexRef.current = selectedCadIndex;
  }, [selectedCadIndex]);

  const handleCityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as CityId;
    const city = CITY_CONFIG[value];
    if (!city) return;

    setSelectedCityId(value);

    const map = mapRef.current;
    if (map) {
      // Once the flyTo animation completes, reset vehicle routes so
      // they initialize within the new city's view.
      map.once('moveend', () => {
        if (planRoutesRef.current) {
          planRoutesRef.current();
        }
      });

      map.flyTo({ center: city.center, zoom: 13 });
    }

    // Regenerate CAD events for the new city
    setCadEvents(generateCadEventsForCity(value));

    // Reset any selection and refresh vehicle routes in the new view
    setSelectedCadIndex(null);
    selectedCadIndexRef.current = null;
  };

  const handleCadEventClick = (event: {
    title: string;
    address: string;
    coordinates: [number, number];
  }) => {
    const map = mapRef.current;
    if (!map) return;

    // Track which CAD event is selected for assignment
    const index = cadEvents.findIndex(
      (e) => e.title === event.title && e.address === event.address
    );
    setSelectedCadIndex(index === -1 ? null : index);

    map.flyTo({
      center: event.coordinates,
      zoom: 15,
    });

    // Open a popup above the CAD event with assignment hint
    new maplibregl.Popup({ offset: [0, -20] })
      .setLngLat(event.coordinates)
      .setHTML(
        `<div style="font-size:13px;line-height:1.4;max-width:220px;">
          <div style="font-weight:600;margin-bottom:2px;">${event.title}</div>
          <div style="font-size:12px;margin-bottom:4px;">${event.address}</div>
          <div style="font-size:11px;color:#9ca3af;">Click a vehicle on the map to assign it to this event.</div>
        </div>`
      )
      .addTo(map);
  };

  const getRoute = async (
    origin: [number, number],
    dest: [number, number]
  ): Promise<[number, number][]> => {
    const token = (import.meta as any).env
      .VITE_MAPBOX_ACCESS_TOKEN as string | undefined;
    if (!token) {
      console.warn('Missing VITE_MAPBOX_ACCESS_TOKEN; cannot fetch routes.');
      return [];
    }

    const url =
      `https://api.mapbox.com/directions/v5/mapbox/driving/` +
      `${origin[0]},${origin[1]};${dest[0]},${dest[1]}` +
      `?geometries=geojson&overview=full&access_token=${encodeURIComponent(token)}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn('Mapbox route request failed', res.status, res.statusText);
        return [];
      }

      const json = await res.json();
      const route = json?.routes?.[0];
      const coords = route?.geometry?.coordinates;
      if (!Array.isArray(coords) || !coords.length) {
        return [];
      }

      return coords as [number, number][];
    } catch (err) {
      console.warn('Error fetching Mapbox route', err);
      return [];
    }
  };

  // Initialize CAD events for the default city once on mount
  useEffect(() => {
    setCadEvents(generateCadEventsForCity(DEFAULT_CITY_ID));
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: ESRI_DARK_GRAY_STYLE,
      center: CITY_CONFIG[DEFAULT_CITY_ID].center,
      zoom: 13,
      maxZoom: 15,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    mapRef.current = map;

    // Create a deck.gl overlay for 3D visualization layers (e.g., arcs)
    const overlay = new MapboxOverlay({ layers: [] });
    map.addControl(overlay as any);
    deckOverlayRef.current = overlay;

    const onLoad = () => {
      setStyleLoaded(true);
    };

    if (map.isStyleLoaded()) {
      setStyleLoaded(true);
    } else {
      map.on('load', onLoad);
    }

    return () => {
      map.off('load', onLoad);
      if (deckOverlayRef.current) {
        map.removeControl(deckOverlayRef.current as any);
        deckOverlayRef.current = null;
      }
      map.remove();
      mapRef.current = null;
      setStyleLoaded(false);
    };
  }, []);
  // CAD events markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoaded) return;

    const sourceId = 'cad-events';
    const layerId = 'cad-events-layer';

    const data: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: 'FeatureCollection',
      features: cadEvents.map((event, index) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: event.coordinates,
        },
        properties: {
          id: `cad-event-${index + 1}`,
          title: event.title,
          address: event.address,
        },
      })),
    };

    cadEventsDataRef.current = data;

    try {
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: 'geojson',
          data,
        });
      } else {
        const src = map.getSource(sourceId) as maplibregl.GeoJSONSource;
        src.setData(data);
      }

      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: 'circle',
          source: sourceId,
          paint: {
            'circle-radius': 6,
            'circle-color': '#ef4444',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        });
      }
    } catch (err) {
      console.warn('Error setting up CAD events layer/source; style may not be loaded yet.', err);
      return;
    }

    const handleClick = (e: maplibregl.MapMouseEvent & { [key: string]: any }) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [layerId] });
      if (!features.length) return;

      const feature = features[0];
      const props = feature.properties ?? {};
      const title = String(props.title ?? 'CAD Event');
      const address = String(props.address ?? '');

      // Sync selectedCadIndex with the clicked CAD event so assignment works
      const index = cadEvents.findIndex(
        (e) => e.title === title && e.address === address
      );
      setSelectedCadIndex(index === -1 ? null : index);

      const lngLat = (feature.geometry as any).coordinates ?? e.lngLat;

      new maplibregl.Popup({ offset: [0, -20] })
        .setLngLat(lngLat)
        .setHTML(
          `<div style="font-size:13px;line-height:1.4;max-width:220px;">
            <div style="font-weight:600;margin-bottom:2px;">${title}</div>
            <div style="font-size:12px;margin-bottom:4px;">${address}</div>
            <div style="font-size:11px;color:#9ca3af;">Click a vehicle on the map to assign it to this event.</div>
          </div>`
        )
        .addTo(map);
    };

    map.on('click', layerId, handleClick);

    return () => {
      map.off('click', layerId, handleClick);
    };
  }, [cadEvents, styleLoaded]);

  // Traffic cameras (random green points per city)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoaded) return;

    const sourceId = 'traffic-cameras';
    const layerId = 'traffic-cameras-layer';
    const fovSourceId = 'traffic-cameras-fov';
    const fovLayerId = 'traffic-cameras-fov-layer';

    if (!showCameras) {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
      if (map.getLayer(fovLayerId)) {
        map.removeLayer(fovLayerId);
      }
      if (map.getSource(fovSourceId)) {
        map.removeSource(fovSourceId);
      }
      camerasDataRef.current = null;
      return;
    }

    const city = CITY_CONFIG[selectedCityId];
    const [centerLng, centerLat] = city.center;

    // Generate a number of random camera locations around the city center
    const cameraCount = 45;
    const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
    for (let i = 0; i < cameraCount; i += 1) {
      const lngOffset = (Math.random() - 0.5) * 0.12;
      const latOffset = (Math.random() - 0.5) * 0.12;
      const bearing = Math.random() * 360; // random camera direction in degrees
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [centerLng + lngOffset, centerLat + latOffset],
        },
        properties: {
          id: `camera-${i + 1}`,
          bearing,
        },
      });
    }

    const data: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: 'FeatureCollection',
      features,
    };

    camerasDataRef.current = data;

    try {
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }

      map.addSource(sourceId, {
        type: 'geojson',
        data,
      });

      map.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': 4,
          'circle-color': '#22c55e',
          'circle-stroke-width': 1,
          'circle-stroke-color': '#bbf7d0',
        },
      });

      // FOV (field-of-view) polygons for cameras, rendered as translucent cones
      if (map.getLayer(fovLayerId)) {
        map.removeLayer(fovLayerId);
      }
      if (map.getSource(fovSourceId)) {
        map.removeSource(fovSourceId);
      }

      map.addSource(fovSourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.addLayer({
        id: fovLayerId,
        type: 'fill',
        source: fovSourceId,
        paint: {
          'fill-color': '#22c55e',
          'fill-opacity': 0.15,
          'fill-outline-color': '#22c55e',
        },
      });
    } catch (err) {
      console.warn('Error setting up traffic cameras layer/source; style may not be loaded yet.', err);
      return;
    }

    const handleClick = (e: maplibregl.MapMouseEvent & { [key: string]: any }) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [layerId] });
      if (!features.length) return;

      const feature = features[0];
      const geom = feature.geometry as GeoJSON.Point | undefined;
      if (!geom) return;

      const [lng, lat] = geom.coordinates as [number, number];
      const props = feature.properties ?? {};
      const bearingDeg = Number(props.bearing ?? 0);

      // Build a wedge-shaped FOV polygon in screen space and unproject back.
      const centerPx = map.project([lng, lat] as maplibregl.LngLatLike);
      const radiusPx = 80; // length of the cone in pixels
      const halfAngleDeg = 30; // half-angle of the cone

      const bearingRad = (bearingDeg * Math.PI) / 180;
      const startRad = bearingRad - (halfAngleDeg * Math.PI) / 180;
      const endRad = bearingRad + (halfAngleDeg * Math.PI) / 180;

      const steps = 10;
      const ringPx: [number, number][] = [];
      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        const ang = startRad + (endRad - startRad) * t;
        const x = centerPx.x + radiusPx * Math.cos(ang);
        const y = centerPx.y + radiusPx * Math.sin(ang);
        ringPx.push([x, y]);
      }

      const ringLngLat = ringPx.map((pt) => map.unproject(pt));

      const coordinates: [number, number][][] = [
        [
          [lng, lat],
          ...ringLngLat.map((p) => [p.lng, p.lat] as [number, number]),
          [lng, lat],
        ],
      ];

      const fovSource = map.getSource(fovSourceId) as maplibregl.GeoJSONSource | null;
      if (fovSource) {
        const fovFeature: GeoJSON.Feature<GeoJSON.Polygon> = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates,
          },
          properties: {
            id: feature.properties?.id ?? 'camera-fov',
          },
        };

        const fc: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
          type: 'FeatureCollection',
          features: [fovFeature],
        };
        fovSource.setData(fc as any);
      }
    };

    map.on('click', layerId, handleClick);

    return () => {
      map.off('click', layerId, handleClick);
    };
  }, [showCameras, styleLoaded, selectedCityId]);

  // Drones layer (flight between dock and CAD events per city)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoaded) return;

    const sourceId = 'drones';
    const layerId = 'drones-layer';
    const baseSourceId = 'drone-base';
    const baseLayerId = 'drone-base-layer';
    const linkSourceId = 'drone-links';
    const linkLayerId = 'drone-links-layer';

    if (!showDrones) {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
      if (map.getLayer(baseLayerId)) {
        map.removeLayer(baseLayerId);
      }
      if (map.getSource(baseSourceId)) {
        map.removeSource(baseSourceId);
      }
      if (map.getLayer(linkLayerId)) {
        map.removeLayer(linkLayerId);
      }
      if (map.getSource(linkSourceId)) {
        map.removeSource(linkSourceId);
      }
      dronesDataRef.current = null;
      droneStateRef.current = {};
      droneLinksRef.current = { type: 'FeatureCollection', features: [] };
      return;
    }

    const city = CITY_CONFIG[selectedCityId];
    const [centerLng, centerLat] = city.center;

    const droneIds = ['drone-1', 'drone-2', 'drone-3'];

    // If there are no CAD events, don't spawn drones yet
    if (!cadEvents.length) {
      return;
    }

    // Single shared dock near the city center
    const dock: [number, number] = [centerLng + 0.012, centerLat + 0.012];

    const initialData: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: 'FeatureCollection',
      features: droneIds.map((id, idx) => {
        const status: 'flying' | 'docked' = 'flying';

        // Ensure at most one drone per CAD event: assign unique CAD indices
        const cadIndex = idx % cadEvents.length;
        const target = cadEvents[cadIndex];
        const cadCoord = target.coordinates;

        // Compute a hover point ~20px short of the CAD marker along the
        // line from dock to CAD, using map projection.
        const dockPoint = map.project(dock as maplibregl.LngLatLike);
        const cadPoint = map.project(cadCoord as maplibregl.LngLatLike);
        const vx = cadPoint.x - dockPoint.x;
        const vy = cadPoint.y - dockPoint.y;
        const len = Math.sqrt(vx * vx + vy * vy) || 1;
        const hx = cadPoint.x - (vx / len) * 20;
        const hy = cadPoint.y - (vy / len) * 20;
        const hoverLngLat = map.unproject([hx, hy]);
        const area: [number, number] = [hoverLngLat.lng, hoverLngLat.lat];

        // Initial orbit angle based on area position relative to CAD marker
        const areaPoint = map.project(area as maplibregl.LngLatLike);
        const orbitAngle = Math.atan2(
          areaPoint.y - cadPoint.y,
          areaPoint.x - cadPoint.x
        );

        // Start at the dock, heading toward the hover area
        const coordinates: [number, number] = dock;

        droneStateRef.current[id] = {
          status,
          dock,
          phase: 'toArea',
          area,
          cadCoord,
          cadIndex,
          orbitAngle,
        };

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates,
          },
          properties: {
            id,
            status,
          },
        };
      }),
    };

    dronesDataRef.current = initialData;

    try {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }

      map.addSource(sourceId, {
        type: 'geojson',
        data: initialData,
      });

      // Create a simple purple triangle icon for drones and add it as an image
      if (!map.hasImage('drone-triangle')) {
        const size = 32;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, size, size);

          // Triangle vertices
          const cx = size / 2;
          const cy = size / 2;
          const r = 11;

          ctx.beginPath();
          ctx.moveTo(cx, cy - r);
          ctx.lineTo(cx - r, cy + r);
          ctx.lineTo(cx + r, cy + r);
          ctx.closePath();

          ctx.fillStyle = '#a855f7';
          ctx.fill();

          ctx.lineWidth = 2;
          ctx.strokeStyle = '#f9fafb';
          ctx.stroke();

          // Use ImageData (width, height, data) so MapLibre gets a
          // correctly-sized RGBA buffer and avoids mismatched size issues.
          const imageData = ctx.getImageData(0, 0, size, size);
          map.addImage('drone-triangle', {
            width: size,
            height: size,
            data: imageData.data,
          } as any);
        }
      }

      map.addLayer({
        id: layerId,
        type: 'symbol',
        source: sourceId,
        layout: {
          'icon-image': 'drone-triangle',
          'icon-size': [
            'case',
            ['==', ['get', 'status'], 'docked'],
            0.45,
            0.675,
          ],
          'icon-allow-overlap': true,
        },
      });

      // Drone home base icon (single square at dock)
      if (map.getLayer(baseLayerId)) {
        map.removeLayer(baseLayerId);
      }
      if (map.getSource(baseSourceId)) {
        map.removeSource(baseSourceId);
      }

      // Represent the dock as a 20px x 20px square in screen space so it
      // appears as a square regardless of map units.
      const dockCenterPx = map.project(dock as maplibregl.LngLatLike);
      const halfSizePx = 10; // 20px total

      const cornersPx: [number, number][] = [
        [dockCenterPx.x - halfSizePx, dockCenterPx.y - halfSizePx],
        [dockCenterPx.x + halfSizePx, dockCenterPx.y - halfSizePx],
        [dockCenterPx.x + halfSizePx, dockCenterPx.y + halfSizePx],
        [dockCenterPx.x - halfSizePx, dockCenterPx.y + halfSizePx],
      ];

      const cornersLngLat = cornersPx.map((pt) => map.unproject(pt));

      map.addSource(baseSourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    [cornersLngLat[0].lng, cornersLngLat[0].lat],
                    [cornersLngLat[1].lng, cornersLngLat[1].lat],
                    [cornersLngLat[2].lng, cornersLngLat[2].lat],
                    [cornersLngLat[3].lng, cornersLngLat[3].lat],
                    [cornersLngLat[0].lng, cornersLngLat[0].lat],
                  ],
                ],
              },
              properties: {},
            },
          ],
        },
      });

      map.addLayer({
        id: baseLayerId,
        type: 'fill',
        source: baseSourceId,
        paint: {
          'fill-color': '#111827',
          'fill-outline-color': '#a855f7',
        },
      });

      // Drone link lines (purple dashed between drone and its current area)
      if (map.getLayer(linkLayerId)) {
        map.removeLayer(linkLayerId);
      }
      if (map.getSource(linkSourceId)) {
        map.removeSource(linkSourceId);
      }

      droneLinksRef.current = { type: 'FeatureCollection', features: [] };
      map.addSource(linkSourceId, {
        type: 'geojson',
        data: droneLinksRef.current,
      });

      // Insert the shadow line layer directly beneath the drone symbol layer
      map.addLayer(
        {
          id: linkLayerId,
          type: 'line',
          source: linkSourceId,
          paint: {
            // Semi-transparent black so it reads as a shadow under 3D arcs
            'line-color': '#000000',
            'line-width': 2,
            'line-opacity': 0.35,
          },
        },
        layerId
      );
    } catch (err) {
      console.warn('Error setting up drones layer/source; style may not be loaded yet.', err);
      return;
    }

    let animationFrameId: number;
    let isCancelled = false;

    // Reset drone timing when this effect (re)starts
    lastDroneUpdateRef.current = performance.now();

    const animateDrones = () => {
      const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | null;
      if (!source || !dronesDataRef.current) {
        animationFrameId = window.requestAnimationFrame(animateDrones);
        return;
      }

      const now = performance.now();
      const elapsed = now - lastDroneUpdateRef.current;

      if (elapsed <= 0) {
        lastDroneUpdateRef.current = now;
        animationFrameId = window.requestAnimationFrame(animateDrones);
        return;
      }

      const updated: GeoJSON.FeatureCollection<GeoJSON.Point> = {
        type: 'FeatureCollection',
        features: dronesDataRef.current.features.map((feature) => {
          const id = feature.properties?.id as string | undefined;
          const state = id ? droneStateRef.current[id] : undefined;

          // If we don't have state for this feature, leave it unchanged.
          if (!id || !state) {
            return feature;
          }

          const status = state.status;
          const phase = state.phase;
          const [lng, lat] = feature.geometry.coordinates as [number, number];

          let newStatus: 'flying' | 'docked' = status;
          let newPhase: 'toArea' | 'loiter' | 'toDock' = phase;
          let newCoord: [number, number] = [lng, lat];
          let newWaitUntil = state.waitUntil;

          const moveToward = (
            from: [number, number],
            to: [number, number]
          ): [number, number] => {
            const dx = to[0] - from[0];
            const dy = to[1] - from[1];
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxStep = DRONE_SPEED_PER_MS * elapsed;

            if (dist <= maxStep || dist === 0) {
              return to;
            }

            const ratio = maxStep / dist;
            return [from[0] + dx * ratio, from[1] + dy * ratio];
          };

          const distanceSq = (a: [number, number], b: [number, number]) => {
            const dx = a[0] - b[0];
            const dy = a[1] - b[1];
            return dx * dx + dy * dy;
          };

          const DOCK_THRESHOLD_SQ = 0.000001; // very close

          if (status === 'flying') {
            if (phase === 'toArea') {
              // Fly very slowly from dock toward the current area (near CAD event)
              newCoord = moveToward([lng, lat], state.area);
              if (distanceSq(newCoord, state.area) < DOCK_THRESHOLD_SQ) {
                // Start loitering around the CAD marker for ~8 seconds
                newPhase = 'loiter';
                newWaitUntil = now + 8000;
                newCoord = state.area;
              }
            } else if (phase === 'loiter') {
              if (state.waitUntil && now < state.waitUntil) {
                // Orbit around the CAD marker at a fixed pixel radius
                const ORBIT_RADIUS_PX = 20;
                const ORBIT_ANGULAR_SPEED = 0.0004; // radians per ms

                const currentAngle = state.orbitAngle ?? 0;
                const nextAngle = currentAngle + ORBIT_ANGULAR_SPEED * elapsed;

                const centerPoint = map.project(
                  state.cadCoord as maplibregl.LngLatLike
                );
                const ox =
                  centerPoint.x + ORBIT_RADIUS_PX * Math.cos(nextAngle);
                const oy =
                  centerPoint.y + ORBIT_RADIUS_PX * Math.sin(nextAngle);
                const orbitLngLat = map.unproject([ox, oy]);

                newCoord = [orbitLngLat.lng, orbitLngLat.lat];

                // Persist updated orbit angle
                state.orbitAngle = nextAngle;
              } else {
                // Done loitering: head back to dock
                newPhase = 'toDock';
                newWaitUntil = undefined;
              }
            } else {
              // Fly very slowly from area back to dock
              newCoord = moveToward([lng, lat], state.dock);
              if (distanceSq(newCoord, state.dock) < DOCK_THRESHOLD_SQ) {
                newStatus = 'docked';
                newPhase = 'toArea';
                newCoord = state.dock;

                // Dwell at the dock for a random 3–10 seconds before
                // becoming eligible to launch again.
                const dwellMs = 3000 + Math.random() * 7000;
                newWaitUntil = now + dwellMs;
              }
            }
          } else {
            // Docked: first honor any dwell timer at the dock.
            if (state.waitUntil && now < state.waitUntil) {
              // Stay parked at the dock during dwell.
              newCoord = state.dock;
            } else {
              // If dwell is over, clear it and allow launch attempts.
              if (state.waitUntil && now >= state.waitUntil) {
                newWaitUntil = undefined;
              }

              // Occasionally launch back into flight toward a CAD event,
              // ensuring at most one drone per CAD at a time.
              const LAUNCH_PROBABILITY = 0.01;
              if (Math.random() < LAUNCH_PROBABILITY && cadEvents.length) {
                // Collect CAD indices already targeted by other flying/loitering drones
                const usedCadIndices = new Set<number>();
                for (const otherId of Object.keys(droneStateRef.current)) {
                  const other = droneStateRef.current[otherId];
                  if (
                    other &&
                    other.status === 'flying' &&
                    (other.phase === 'toArea' || other.phase === 'loiter')
                  ) {
                    usedCadIndices.add(other.cadIndex);
                  }
                }

                const availableIndices = cadEvents
                  .map((_, idx) => idx)
                  .filter((idx) => !usedCadIndices.has(idx));

                if (availableIndices.length) {
                  newStatus = 'flying';
                  newPhase = 'toArea';

                  const cadIndex =
                    availableIndices[Math.floor(Math.random() * availableIndices.length)];
                  const target = cadEvents[cadIndex];
                  const cadCoord = target.coordinates;

                  const dockPoint = map.project(state.dock as maplibregl.LngLatLike);
                  const cadPoint = map.project(cadCoord as maplibregl.LngLatLike);
                  const vx = cadPoint.x - dockPoint.x;
                  const vy = cadPoint.y - dockPoint.y;
                  const len = Math.sqrt(vx * vx + vy * vy) || 1;
                  const hx = cadPoint.x - (vx / len) * 20;
                  const hy = cadPoint.y - (vy / len) * 20;
                  const hoverLngLat = map.unproject([hx, hy]);
                  const newArea: [number, number] = [
                    hoverLngLat.lng,
                    hoverLngLat.lat,
                  ];

                  // Recompute orbit angle for this CAD event
                  const areaPoint = map.project(newArea as maplibregl.LngLatLike);
                  const orbitAngle = Math.atan2(
                    areaPoint.y - cadPoint.y,
                    areaPoint.x - cadPoint.x
                  );

                  state.area = newArea;
                  state.cadCoord = cadCoord;
                  state.cadIndex = cadIndex;
                  state.orbitAngle = orbitAngle;

                  newCoord = state.dock;
                  newWaitUntil = undefined;
                }
              }
            }
          }

          droneStateRef.current[id] = {
            ...state,
            status: newStatus,
            phase: newPhase,
            waitUntil: newWaitUntil,
          };

          return {
            ...feature,
            geometry: {
              type: 'Point',
              coordinates: newCoord,
            },
            properties: {
              ...feature.properties,
              status: newStatus,
            },
          };
        }),
      };

      dronesDataRef.current = updated;
      source.setData(updated);

      // Update drone link lines to connect each flying/loitering drone
      // to its CAD event marker (full line), not just the hover point.
      const linkSource = map.getSource(linkSourceId) as maplibregl.GeoJSONSource | null;
      if (linkSource) {
        const linkFeatures: GeoJSON.Feature<GeoJSON.LineString>[] = [];
        for (const f of updated.features) {
          const id = f.properties?.id as string | undefined;
          if (!id) continue;
          const state = droneStateRef.current[id];
          if (!state) continue;

          if (state.status === 'flying' && (state.phase === 'toArea' || state.phase === 'loiter')) {
            const from = f.geometry.coordinates as [number, number];
            const to = state.cadCoord;
            linkFeatures.push({
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: [from, to],
              },
              properties: {
                id,
              },
            });
          }
        }

        droneLinksRef.current = {
          type: 'FeatureCollection',
          features: linkFeatures,
        };
        linkSource.setData(droneLinksRef.current);
      }

      // Keep the dock square at a constant 20x20px in screen space by
      // recomputing its polygon around the dock center each frame.
      const baseSource = map.getSource(baseSourceId) as maplibregl.GeoJSONSource | null;
      if (baseSource) {
        const dockCenterPx = map.project(dock as maplibregl.LngLatLike);
        const halfSizePx = 10; // 20px total

        const cornersPx: [number, number][] = [
          [dockCenterPx.x - halfSizePx, dockCenterPx.y - halfSizePx],
          [dockCenterPx.x + halfSizePx, dockCenterPx.y - halfSizePx],
          [dockCenterPx.x + halfSizePx, dockCenterPx.y + halfSizePx],
          [dockCenterPx.x - halfSizePx, dockCenterPx.y + halfSizePx],
        ];

        const cornersLngLat = cornersPx.map((pt) => map.unproject(pt));

        const dockFeatureCollection: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    [cornersLngLat[0].lng, cornersLngLat[0].lat],
                    [cornersLngLat[1].lng, cornersLngLat[1].lat],
                    [cornersLngLat[2].lng, cornersLngLat[2].lat],
                    [cornersLngLat[3].lng, cornersLngLat[3].lat],
                    [cornersLngLat[0].lng, cornersLngLat[0].lat],
                  ],
                ],
              },
              properties: {},
            },
          ],
        };

        baseSource.setData(dockFeatureCollection as any);
      }

      // Update dock icon fill based on whether any drones are currently docked
      const baseLayer = map.getLayer(baseLayerId);
      if (baseLayer) {
        let anyDocked = false;
        for (const state of Object.values(droneStateRef.current)) {
          if (state && state.status === 'docked') {
            anyDocked = true;
            break;
          }
        }

        const targetColor = anyDocked ? '#a855f7' : '#111827';
        map.setPaintProperty(baseLayerId, 'fill-color', targetColor);
      }

      // Update deck.gl 3D arcs for vehicles and drones, if overlay is present.
      const deckOverlay = deckOverlayRef.current;
      if (deckOverlay) {
        // Helper to compute a reasonable arc height based on distance in degrees.
        const distanceToHeight = (from: [number, number], to: [number, number]) => {
          const dx = to[0] - from[0];
          const dy = to[1] - from[1];
          const d = Math.sqrt(dx * dx + dy * dy);
          if (!Number.isFinite(d) || d === 0) {
            return 0;
          }
          // Very small scaling so arcs hug the map surface.
          const SCALE = 10_000; // meters per degree (tiny to avoid tall arcs)
          const MIN_HEIGHT = 0.05;  // meters
          const MAX_HEIGHT = 0.2;   // meters
          const h = d * SCALE;
          return Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, h));
        };

        // Vehicle arcs: from current vehicle position to its destination for
        // any vehicle assigned to a CAD event.
        const vehicleArcs: { from: [number, number]; to: [number, number]; height: number }[] = [];
        if (vehiclesDataRef.current) {
          for (const feature of vehiclesDataRef.current.features) {
            const id = feature.properties?.id as string | undefined;
            if (!id) continue;
            const route = routesRef.current[id];
            if (!route || !route.coordinates.length || !route.assignedToCad) continue;

            const from = feature.geometry.coordinates as [number, number];
            const to =
              route.coordinates[route.coordinates.length - 1] ??
              (feature.geometry.coordinates as [number, number]);

            const height = distanceToHeight(from, to);
            if (height <= 0) continue;

            vehicleArcs.push({ from, to, height });
          }
        }

        // Drone arcs: from CURRENT drone position to its target. While
        // heading to a CAD event, the arc goes to the CAD coordinate. When
        // returning home or docked, the arc goes to the dock instead so it
        // collapses back toward base.
        const droneArcs: { from: [number, number]; to: [number, number]; height: number }[] = [];
        for (const f of updated.features) {
          const id = f.properties?.id as string | undefined;
          if (!id) continue;
          const state = droneStateRef.current[id];
          if (!state || !state.dock) continue;

          const from = f.geometry.coordinates as [number, number];

          // Choose arc target based on current phase/status.
          const goingToEvent =
            state.cadCoord &&
            state.status === 'flying' &&
            (state.phase === 'toArea' || state.phase === 'loiter');

          const to = goingToEvent ? state.cadCoord : state.dock;
          const height = distanceToHeight(from, to);
          if (height <= 0) continue;

          droneArcs.push({ from, to, height });
        }

        const vehicleArcLayer = new ArcLayer({
          id: 'vehicle-assignment-arcs-3d',
          data: vehicleArcs,
          getSourcePosition: (d: any) => d.from,
          getTargetPosition: (d: any) => d.to,
          getSourceColor: [59, 130, 246, 200], // blue-ish
          getTargetColor: [56, 189, 248, 200], // lighter blue
          getWidth: 2,
          getHeight: (d: any) => d.height,
        });

        const droneArcLayer = new ArcLayer({
          id: 'drone-mission-arcs-3d',
          data: droneArcs,
          getSourcePosition: (d: any) => d.from,
          getTargetPosition: (d: any) => d.to,
          getSourceColor: [168, 85, 247, 220], // purple
          getTargetColor: [244, 114, 182, 220], // pinkish
          getWidth: 2,
          getHeight: (d: any) => d.height,
        });

        deckOverlay.setProps({
          layers: [vehicleArcLayer, droneArcLayer],
        });
      }

      lastDroneUpdateRef.current = now;

      if (!isCancelled) {
        animationFrameId = window.requestAnimationFrame(animateDrones);
      }
    };

    animationFrameId = window.requestAnimationFrame(animateDrones);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
      isCancelled = true;
    };
  }, [showDrones, styleLoaded, selectedCityId, cadEvents]);

  // Vehicles layer and routing
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoaded) return;

    const sourceId = 'vehicles';
    const layerId = 'vehicles-layer';
    const assignmentSourceId = 'vehicle-assignments';
    const assignmentLayerId = 'vehicle-assignment-lines';

    if (!showVehicles) {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
      if (map.getLayer(assignmentLayerId)) {
        map.removeLayer(assignmentLayerId);
      }
      if (map.getSource(assignmentSourceId)) {
        map.removeSource(assignmentSourceId);
      }
      return;
    }

    const bounds = map.getBounds();

    const initialData: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: 'FeatureCollection',
      features: vehicleIds.map((id) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: getRandomPointInBounds(bounds),
        },
        properties: {
          id,
        },
      })),
    };

    vehiclesDataRef.current = initialData;

    try {
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: 'geojson',
          data: initialData,
        });
      }

      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: 'circle',
          source: sourceId,
          paint: {
            'circle-radius': 5,
            'circle-color': '#3b82f6',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff',
          },
        });
      }

      // assignment lines source/layer (for 2D arcs)
      if (!map.getSource(assignmentSourceId)) {
        map.addSource(assignmentSourceId, {
          type: 'geojson',
          data: assignmentLinesRef.current,
        });
      }

      if (!map.getLayer(assignmentLayerId)) {
        // Insert the shadow line layer directly beneath the vehicle point layer
        map.addLayer(
          {
            id: assignmentLayerId,
            type: 'line',
            source: assignmentSourceId,
            paint: {
              // Semi-transparent black so it reads as a shadow under 3D arcs
              'line-color': '#000000',
              'line-width': 2,
              'line-opacity': 0.35,
            },
          },
          layerId
        );
      }
    } catch (err) {
      console.warn('Error setting up vehicles or assignment layers; style may not be loaded yet.', err);
      return;
    }

    let animationFrameId: number;
    let isCancelled = false;

    const planRoutesForVehicles = async () => {
      const boundsForPlanning = map.getBounds();

      const newRoutes: typeof routesRef.current = {};

      for (const id of vehicleIds) {
        const origin = getRandomPointInBounds(boundsForPlanning);
        const dest = getRandomPointInBounds(boundsForPlanning);

        const coords = await getRoute(origin, dest);

        if (isCancelled) {
          return;
        }

        if (coords.length) {
          newRoutes[id] = {
            coordinates: coords,
            currentIndex: 0,
            assignedToCad: false,
          };
        } else {
          // Fallback: simple straight line if routing fails
          newRoutes[id] = {
            coordinates: [origin, dest],
            currentIndex: 0,
            assignedToCad: false,
          };
        }
      }

      routesRef.current = newRoutes;

      const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | null;
      if (!source || !vehiclesDataRef.current) {
        return;
      }

      // Initialize vehicle positions at the starts of their routes
      const initialized: GeoJSON.FeatureCollection<GeoJSON.Point> = {
        type: 'FeatureCollection',
        features: vehiclesDataRef.current.features.map((feature) => {
          const id = feature.properties?.id as string | undefined;
          const route = id ? routesRef.current[id] : undefined;
          const first = route?.coordinates?.[0];
          return {
            ...feature,
            geometry: {
              type: 'Point',
              coordinates: first ?? feature.geometry.coordinates,
            },
          };
        }),
      };

      vehiclesDataRef.current = initialized;
      source.setData(initialized);
    };

    const planRouteForVehicle = async (
      id: string,
      origin: [number, number],
      destOverride?: [number, number],
      assignedToCadOverride?: boolean
    ) => {
      const boundsForPlanning = map.getBounds();
      const dest = destOverride ?? getRandomPointInBounds(boundsForPlanning);

      const coords = await getRoute(origin, dest);

      if (isCancelled) {
        return;
      }

      const routeCoords = coords.length ? coords : [origin, dest];

      routesRef.current[id] = {
        coordinates: routeCoords,
        currentIndex: 0,
        assignedToCad: !!assignedToCadOverride,
      };
    };

    const animate = () => {
      const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | null;
      if (!source || !vehiclesDataRef.current) {
        animationFrameId = window.requestAnimationFrame(animate);
        return;
      }

      const now = performance.now();
      const elapsed = now - lastVehicleUpdateRef.current;
      const STEP_INTERVAL_MS = 600; // slower movement: ~1.5-2 steps per second

      if (elapsed < STEP_INTERVAL_MS) {
        animationFrameId = window.requestAnimationFrame(animate);
        return;
      }
      lastVehicleUpdateRef.current = now;

      const updated: GeoJSON.FeatureCollection<GeoJSON.Point> = {
        type: 'FeatureCollection',
        features: vehiclesDataRef.current.features.map((feature) => {
          const id = feature.properties?.id as string | undefined;
          const route = id ? routesRef.current[id] : undefined;
          if (!route || route.coordinates.length === 0) {
            return feature;
          }

          const nowForVehicle = now;

          // If we have a wait scheduled and it's not over yet, hold position
          if (route.waitUntil && nowForVehicle < route.waitUntil) {
            const currentCoord =
              route.coordinates[route.currentIndex] ?? feature.geometry.coordinates;
            return {
              ...feature,
              geometry: {
                type: 'Point',
                coordinates: currentCoord,
              },
            };
          }

          // If wait is over, clear it and let this tick advance
          if (route.waitUntil && nowForVehicle >= route.waitUntil) {
            delete route.waitUntil;
          }

          // Randomly insert short dwell stops along the route for unassigned vehicles
          if (!route.assignedToCad && !route.waitUntil) {
            const STOP_PROBABILITY = 0.08; // ~8% chance per tick
            if (Math.random() < STOP_PROBABILITY) {
              route.waitUntil = nowForVehicle + 5000; // 5 second stop
              const currentCoord =
                route.coordinates[route.currentIndex] ?? feature.geometry.coordinates;
              return {
                ...feature,
                geometry: {
                  type: 'Point',
                  coordinates: currentCoord,
                },
              };
            }
          }

          const lastIndex = route.coordinates.length - 1;

          // If we're at the end of the route, start a new wait and plan a new route
          if (route.currentIndex >= lastIndex) {
            const endCoord =
              route.coordinates[lastIndex] ?? feature.geometry.coordinates;

            // If this vehicle was assigned to a CAD event, stop here
            if (route.assignedToCad) {
              // Remove its assignment arc line, if present
              const assignmentSource = map.getSource(
                assignmentSourceId
              ) as maplibregl.GeoJSONSource | null;
              if (assignmentSource) {
                assignmentLinesRef.current = {
                  type: 'FeatureCollection',
                  features: assignmentLinesRef.current.features.filter((f) => {
                    return f.properties?.vehicleId !== id;
                  }),
                };
                assignmentSource.setData(assignmentLinesRef.current);
              }
              return {
                ...feature,
                geometry: {
                  type: 'Point',
                  coordinates: endCoord,
                },
              };
            }

            // Otherwise, schedule a 20 second wait and then plan a new route
            route.waitUntil = nowForVehicle + 20000;

            // Plan a new route starting from this destination
            void planRouteForVehicle(id!, endCoord);

            return {
              ...feature,
              geometry: {
                type: 'Point',
                coordinates: endCoord,
              },
            };
          }

          // Advance along the route by one step per update tick, capped at the end
          const nextIndex = Math.min(route.currentIndex + 1, lastIndex);
          route.currentIndex = nextIndex;

          const coord = route.coordinates[nextIndex];

          // For vehicles assigned to a CAD event, update a straight line from
          // the current position to the destination so it "follows" the unit.
          if (route.assignedToCad) {
            const assignmentSource = map.getSource(
              assignmentSourceId
            ) as maplibregl.GeoJSONSource | null;
            if (assignmentSource) {
              const destCoord = route.coordinates[lastIndex];
              const lineFeature: GeoJSON.Feature<GeoJSON.LineString> = {
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: [coord, destCoord],
                },
                properties: {
                  vehicleId: id,
                },
              };

              assignmentLinesRef.current = {
                type: 'FeatureCollection',
                features: [
                  ...assignmentLinesRef.current.features.filter((f) => {
                    return f.properties?.vehicleId !== id;
                  }),
                  lineFeature,
                ],
              };

              assignmentSource.setData(assignmentLinesRef.current);
            }
          }

          return {
            ...feature,
            geometry: {
              type: 'Point',
              coordinates: coord,
            },
          };
        }),
      };

      vehiclesDataRef.current = updated;
      source.setData(updated);

      animationFrameId = window.requestAnimationFrame(animate);
    };

    planRoutesRef.current = () => {
      // Clear any existing assignment arcs
      const assignmentSource = map.getSource(
        assignmentSourceId
      ) as maplibregl.GeoJSONSource | null;
      assignmentLinesRef.current = {
        type: 'FeatureCollection',
        features: [],
      };
      if (assignmentSource) {
        assignmentSource.setData(assignmentLinesRef.current);
      }

      // Reset selected CAD event and all routes (no assignments)
      setSelectedCadIndex(null);
      routesRef.current = {};

      void planRoutesForVehicles();
    };

    // Handle assigning a vehicle to the currently selected CAD event
    const handleVehicleClick = async (
      e: maplibregl.MapMouseEvent & { [key: string]: any }
    ) => {
      const idx = selectedCadIndexRef.current;
      if (idx === null) return;
      const cadEvent = cadEvents[idx];
      if (!cadEvent) return;

      const features = map.queryRenderedFeatures(e.point, { layers: [layerId] });
      if (!features.length) return;

      const feature = features[0];
      const id = feature.properties?.id as string | undefined;
      if (!id) return;

      const origin = (feature.geometry as any).coordinates as [number, number];

      await planRouteForVehicle(id, origin, cadEvent.coordinates, true);

      const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | null;
      if (!source || !vehiclesDataRef.current) return;

      // Ensure the vehicle starts exactly at the first coordinate of its new route
      const route = routesRef.current[id];
      if (!route || !route.coordinates.length) return;

      const updated: GeoJSON.FeatureCollection<GeoJSON.Point> = {
        type: 'FeatureCollection',
        features: vehiclesDataRef.current.features.map((f) => {
          const fid = f.properties?.id as string | undefined;
          if (fid !== id) return f;

          return {
            ...f,
            geometry: {
              type: 'Point',
              coordinates: route.coordinates[0],
            },
          };
        }),
      };

      vehiclesDataRef.current = updated;
      source.setData(updated);

      // Create or update a dashed assignment line between vehicle and CAD event.
      // Use a straight segment so it matches what the animation loop maintains.
      const assignmentSource = map.getSource(
        assignmentSourceId
      ) as maplibregl.GeoJSONSource | null;
      if (assignmentSource) {
        const [lng1, lat1] = origin;
        const [lng2, lat2] = cadEvent.coordinates;

        const lineFeature: GeoJSON.Feature<GeoJSON.LineString> = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [lng1, lat1],
              [lng2, lat2],
            ],
          },
          properties: {
            vehicleId: id,
          },
        };

        assignmentLinesRef.current = {
          type: 'FeatureCollection',
          features: [
            // keep lines for other vehicles, replace this vehicle's line
            ...assignmentLinesRef.current.features.filter((f) => {
              return f.properties?.vehicleId !== id;
            }),
            lineFeature,
          ],
        };

        assignmentSource.setData(assignmentLinesRef.current);
      }
    };

    map.on('click', layerId, handleVehicleClick);

    void planRoutesForVehicles();
    animationFrameId = window.requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
      isCancelled = true;
      map.off('click', layerId, handleVehicleClick);
      // Do not call map.getLayer/getSource here; the map may already have been removed
      // by the map initialization effect cleanup.
    };
  }, [showVehicles, styleLoaded, cadEvents]);

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-title">Mark43 CAD Map 2.0</div>
        <div className="app-header-subtitle">MapLibre GL JS</div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <label
            htmlFor="city-select"
            style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}
          >
            City
          </label>
          <select
            id="city-select"
            value={selectedCityId}
            onChange={handleCityChange}
            style={{
              fontSize: 12,
              padding: '2px 6px',
              borderRadius: 4,
              border: '1px solid #d1d5db',
              backgroundColor: '#ffffff',
            }}
          >
            <optgroup label="United States">
              {US_CITY_IDS.map((id) => (
                <option key={id} value={id}>
                  {CITY_CONFIG[id].label}
                </option>
              ))}
            </optgroup>
            <optgroup label="United Kingdom">
              {UK_CITY_IDS.map((id) => (
                <option key={id} value={id}>
                  {CITY_CONFIG[id].label}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </header>
      <main className="app-main">
        <aside className="app-sidebar">
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 className="panel-title">Map layers</h2>
            <label className="panel-row">
              <input
                type="checkbox"
                checked={showVehicles}
                onChange={(e) => setShowVehicles(e.target.checked)}
              />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span>Vehicle locations</span>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '9999px',
                    backgroundColor: '#3b82f6',
                    border: '1px solid #ffffff',
                    boxShadow: '0 0 0 1px #1f2937',
                  }}
                />
              </span>
              <button
                type="button"
                className="panel-icon-button"
                title="Replan vehicle routes in current view"
                onClick={() => planRoutesRef.current()}
              >
                ⟳
              </button>
            </label>
            <label className="panel-row" style={{ marginTop: -4 }}>
              <input
                type="checkbox"
                checked={showCameras}
                onChange={(e) => setShowCameras(e.target.checked)}
              />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span>Traffic cameras</span>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '9999px',
                    backgroundColor: '#22c55e',
                    border: '1px solid #bbf7d0',
                    boxShadow: '0 0 0 1px #1f2937',
                  }}
                />
              </span>
            </label>
            <label className="panel-row">
              <input
                type="checkbox"
                checked={showDrones}
                onChange={(e) => setShowDrones(e.target.checked)}
              />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span>Drone locations</span>
                <span
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderBottom: '10px solid #a855f7',
                    filter: 'drop-shadow(0 0 1px #1f2937)',
                  }}
                />
              </span>
            </label>
          </div>
          <div className="panel cad-events-panel">
            <h2 className="panel-title">CAD Events</h2>
            <div className="cad-events-list">
              {cadEvents.map((event, index) => (
                <div
                  key={index}
                  className="cad-event-card"
                  onClick={() => handleCadEventClick(event)}
                >
                  <span className="cad-event-title">{event.title}</span>
                  <span className="cad-event-address">{event.address}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
        <section className="app-map-wrapper">
          <div ref={mapContainerRef} className="map-container" />
        </section>
      </main>
    </div>
  );
};

export default App;
