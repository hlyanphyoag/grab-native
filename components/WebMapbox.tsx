import { useDriverStore, useLocationStore } from '@/app/stores';
import { useFetch } from '@/libs/fetch';
import {
    calculateDriverTimes,
    generateMarkersFromData
} from '@/libs/map';
import { Driver, MarkerData } from '@/types/type';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface Props {
  webViewRef?: React.RefObject<WebView>;
}

export default function WebMapbox({ webViewRef: externalWebViewRef }: Props) {
  const { data: drivers, loading, error } = useFetch<Driver[]>('/(api)/driver');
  const internalWebViewRef = useRef<WebView>(null);
  const webViewRef = externalWebViewRef || internalWebViewRef;

  const {
    userLongitude,
    userLatitude,
    destinationLongitude,
    destinationLatitude
  } = useLocationStore();

  const [route, setRoute] = useState<{ latitude: number; longitude: number }[]>([]);
  const { selectedDriver, setDrivers } = useDriverStore();
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isReloading, setIsReloading] = useState(false);
  const lastUpdateRef = useRef<string>('');
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Convert driver data to marker data and store it
  useEffect(() => {
    if (!mountedRef.current) return;
    if (!drivers || !Array.isArray(drivers)) return;
    if (!userLatitude || !userLongitude) return;

    setDrivers(drivers as any);

    const newMarkers = generateMarkersFromData({
      data: drivers,
      userLatitude,
      userLongitude
    });

    if (Array.isArray(newMarkers) && newMarkers.length > 0) {
      setMarkers(newMarkers);
    }
  }, [drivers, userLatitude, userLongitude]);

  // Enhanced route calculation with better error handling
  const routePath = async () => {
    try {
      console.log('🚗 Calculating route...');
      console.log('From:', { userLatitude, userLongitude });
      console.log('To:', { destinationLatitude, destinationLongitude });
      
      const apiKey = process.env.EXPO_PUBLIC_GEOMAP_API_KEY;
      if (!apiKey) {
        console.error('❌ Geoapify API key is missing!');
        return;
      }

      const url = `https://api.geoapify.com/v1/routing?waypoints=${userLatitude},${userLongitude}|${destinationLatitude},${destinationLongitude}&mode=drive&apiKey=${apiKey}`;
      console.log('📡 Request URL:', url);

      const res = await fetch(url);
      console.log('📊 Response status:', res.status);
      
      if (!res.ok) {
        console.error('❌ API request failed:', res.status, res.statusText);
        return;
      }

      const json = await res.json();
      console.log('📋 API Response:', json);

      if (json.error) {
        console.error('❌ API returned error:', json.error);
        return;
      }

      if (!json.features || json.features.length === 0) {
        console.warn('⚠️ No route found in response');
        return;
      }

      const feature = json.features[0];
      if (!feature.geometry || !feature.geometry.coordinates || !feature.geometry.coordinates[0]) {
        console.warn('⚠️ Invalid route geometry');
        return;
      }

      const coords = feature.geometry.coordinates[0].map((item: any) => ({
        latitude: item[1],
        longitude: item[0]
      }));

      console.log('✅ Route calculated successfully:', coords.length, 'points');
      setRoute(coords);
      
    } catch (err) {
      console.error('❌ Route calculation error:', err);
      
      // Try alternative routing service as fallback
      try {
        console.log('🔄 Trying alternative routing...');
        await tryAlternativeRouting();
      } catch (altError) {
        console.error('❌ Alternative routing also failed:', altError);
      }
    }
  };

  // Alternative routing using OpenRouteService
  const tryAlternativeRouting = async () => {
    const orsUrl = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf6248fe04b5b2e4e84ee1a95e7e5eb5b4e3e8&start=${userLongitude},${userLatitude}&end=${destinationLongitude},${destinationLatitude}`;
    
    const response = await fetch(orsUrl);
    const data = await response.json();
    
    if (data.features && data.features[0] && data.features[0].geometry) {
      const coords = data.features[0].geometry.coordinates.map((item: any) => ({
        latitude: item[1],
        longitude: item[0]
      }));
      
      console.log('✅ Alternative route found:', coords.length, 'points');
      setRoute(coords);
    }
  };

  useEffect(() => {
    if (userLatitude && userLongitude && destinationLatitude && destinationLongitude) {
      routePath();
    }
  }, [userLatitude, userLongitude, destinationLatitude, destinationLongitude]);

  // Calculate driver times once markers and destination are available
  useEffect(() => {
    if (
      Array.isArray(markers) &&
      markers.length > 0 &&
      userLatitude &&
      userLongitude &&
      destinationLatitude &&
      destinationLongitude
    ) {
      calculateDriverTimes({
        markers,
        userLatitude,
        userLongitude,
        destinationLatitude,
        destinationLongitude
      }).then((result) => {
        setDrivers(result as MarkerData[]);
      });
    }
  }, [markers, destinationLatitude, destinationLongitude]);

  // Retry mechanism for failed map loads
  const retryMapLoad = () => {
    if (retryCount < 3) {
      console.log(`🔄 Retrying map load (attempt ${retryCount + 1}/3)`);
      setIsReloading(true);
      setMapLoaded(false);
      setMapError(null);
      setRetryCount(prev => prev + 1);
      
      setTimeout(() => {
        setIsReloading(false);
        if (webViewRef.current) {
          webViewRef.current.reload();
        }
      }, 1000);
    }
  };

  // Update markers and route when data changes (with stability improvements)
  useEffect(() => {
    if (!mountedRef.current || !mapLoaded || !webViewRef.current) return;
    if (!userLatitude || !userLongitude) return;
    
    const updateMapData = {
      userLocation: { lat: userLatitude, lng: userLongitude },
      markers: markers.map(marker => ({
        id: marker.id,
        lat: marker.latitude,
        lng: marker.longitude,
        title: marker.title || 'Driver',
        selected: selectedDriver === marker.id
      })),
      destination: destinationLatitude && destinationLongitude ? {
        lat: destinationLatitude,
        lng: destinationLongitude
      } : null,
      route: route.map(point => ({ lat: point.latitude, lng: point.longitude }))
    };

    // Prevent unnecessary updates with the same data
    const updateKey = JSON.stringify({
      userLat: userLatitude?.toFixed(6),
      userLng: userLongitude?.toFixed(6),
      markerCount: markers.length,
      selectedDriver,
      destLat: destinationLatitude?.toFixed(6),
      destLng: destinationLongitude?.toFixed(6),
      routeLength: route.length
    });

    if (lastUpdateRef.current === updateKey) {
      return; // Skip duplicate update
    }
    lastUpdateRef.current = updateKey;

    console.log('📤 Sending data to WebView:', {
      userLocation: updateMapData.userLocation,
      markersCount: updateMapData.markers.length,
      destination: updateMapData.destination,
      routePointsCount: updateMapData.route.length
    });
    
    try {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'updateMap',
        data: updateMapData
      }));
    } catch (error) {
      console.error('❌ Failed to send message to WebView:', error);
      setMapError('Communication error with map');
      retryMapLoad();
    }
  }, [mapLoaded, userLatitude, userLongitude, markers, selectedDriver, destinationLatitude, destinationLongitude, route]);

  // Loading state
  if (loading || !userLatitude || !userLongitude) {
    return (
      <View className="flex justify-center items-center w-full h-full bg-gray-100 rounded-2xl">
        <ActivityIndicator size="large" color="#0066FF" />
        <Text className="mt-3 text-gray-600 font-JakartaMedium">Loading map...</Text>
      </View>
    );
  }

  // Error state
  if (error || mapError) {
    return (
      <View className="flex justify-center items-center w-full h-full bg-red-50 rounded-2xl">
        <Text className="text-red-600 font-JakartaMedium text-center px-4">
          {mapError || `Map Error: ${error}`}
        </Text>
        <Text className="text-red-500 font-JakartaMedium text-center px-4 mt-2 text-sm">
          Try refreshing the app or check your internet connection
        </Text>
      </View>
    );
  }

  console.log('WebMapbox render - User location:', { userLatitude, userLongitude });
  console.log('WebMapbox render - Markers count:', markers?.length);

  // Replace this with your Mapbox access token
  const MAPBOX_TOKEN ="pk.eyJ1IjoiaGx5YW5waHlvIiwiYSI6ImNtZXJiaTRzbjAwZG0yaXNhYTFiMnAwZXAifQ.BRH57AFtxX2UWr18ZMMPwg"

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mapbox</title>
    <script src='https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js'></script>
    <link href='https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css' rel='stylesheet' />
    <style>
        body, html { 
            margin: 0; 
            padding: 0; 
            height: 100%; 
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }
        #map { height: 100vh; width: 100vw; }
        
        /* Simple, centered markers */
        .marker {
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        
        .marker:hover {
            transform: scale(1.1);
        }
        
        /* User location marker - Blue dot */
        .user-marker {
            width: 16px;
            height: 16px;
            background: #007AFF;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0, 122, 255, 0.4);
        }
        
        /* Driver markers - Simple car icons */
        .driver-marker {
            width: 30px;
            height: 30px;
            background: #A8D8FF;
            border: 1px solid #4A90E2;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            font-size: 16px;
            color: #4A90E2;
            font-weight: bold;
        }
        
        .driver-marker.selected {
            background: #FF6B6B;
            border-color: #FF6B6B;
            color: white;
            transform: scale(1.2);
            box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
        }
        
        /* Destination marker - Simple pin */
        .destination-marker {
            width: 24px;
            height: 32px;
            background: #FF4757;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(255, 71, 87, 0.4);
            position: relative;
        }
        
        .destination-marker::after {
            content: '';
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(45deg);
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        let map;
        let userMarker, destinationMarker;
        let driverMarkers = [];

        function initMap() {
            try {
                mapboxgl.accessToken = '${MAPBOX_TOKEN}';
                
                if (!mapboxgl.accessToken) {
                    throw new Error('Mapbox token is required');
                }

                map = new mapboxgl.Map({
                    container: 'map',
                    style: 'mapbox://styles/mapbox/streets-v12',
                    center: [${userLongitude}, ${userLatitude}],
                    zoom: 14,
                    attributionControl: true
                });
            } catch (error) {
                console.error('Failed to initialize map:', error);
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ 
                        type: 'mapError', 
                        error: error.message 
                    }));
                }
                return;
            }

            map.on('load', () => {
                console.log('🗺️ Map loaded successfully');
                
                // Add user location marker
                const userEl = document.createElement('div');
                userEl.className = 'user-marker';
                
                userMarker = new mapboxgl.Marker({
                    element: userEl,
                    anchor: 'center'
                })
                    .setLngLat([${userLongitude}, ${userLatitude}])
                    .addTo(map);

                // Add route source
                map.addSource('route', {
                    'type': 'geojson',
                    'data': {
                        'type': 'Feature',
                        'properties': {},
                        'geometry': {
                            'type': 'LineString',
                            'coordinates': []
                        }
                    }
                });

                                 // Add route outline layer (white border for better visibility)
                 map.addLayer({
                     'id': 'route-outline',
                     'type': 'line',
                     'source': 'route',
                     'layout': {
                         'line-join': 'round',
                         'line-cap': 'round'
                     },
                     'paint': {
                         'line-color': '#FFFFFF',
                         'line-width': ['interpolate', ['linear'], ['zoom'], 10, 7, 18, 14],
                         'line-opacity': 0.8
                     }
                 });

                 // Add main route layer (vibrant purple-blue with enhanced styling)
                 map.addLayer({
                     'id': 'route',
                     'type': 'line',
                     'source': 'route',
                     'layout': {
                         'line-join': 'round',
                         'line-cap': 'round'
                     },
                     'paint': {
                         'line-color': '#6366F1', // Modern indigo color
                         'line-width': ['interpolate', ['linear'], ['zoom'], 10, 4, 18, 10],
                         'line-opacity': 0.95,
                         'line-blur': 0.5 // Subtle blur for modern look
                     }
                 });

                 // Add route highlight layer (inner glow effect)
                 map.addLayer({
                     'id': 'route-highlight',
                     'type': 'line',
                     'source': 'route',
                     'layout': {
                         'line-join': 'round',
                         'line-cap': 'round'
                     },
                     'paint': {
                         'line-color': '#8B5CF6', // Lighter purple for highlight
                         'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2, 18, 6],
                         'line-opacity': 0.7
                     }
                 });

                // Notify React Native that map is ready
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
                }
            });

            map.on('error', (e) => {
                console.error('Map error:', e);
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ 
                        type: 'mapError', 
                        error: 'Map rendering error: ' + (e.error ? e.error.message : 'Unknown error')
                    }));
                }
            });

            // Add network connectivity check
            map.on('data', (e) => {
                if (e.dataType === 'source' && e.isSourceLoaded) {
                    console.log('🌐 Map data loaded successfully');
                }
            });

            // Add style load error handling
            map.on('style.load', () => {
                console.log('🎨 Map style loaded successfully');
            });
        }

        function updateMap(data) {
            console.log('📍 Updating map with data:', data);
            
            // Clear existing markers
            driverMarkers.forEach(marker => marker.remove());
            driverMarkers = [];
            
            if (destinationMarker) {
                destinationMarker.remove();
                destinationMarker = null;
            }

            // Update user location
            if (userMarker && data.userLocation) {
                userMarker.setLngLat([data.userLocation.lng, data.userLocation.lat]);
            }

            // Add driver markers
            if (data.markers && Array.isArray(data.markers)) {
                data.markers.forEach((marker, index) => {
                    const el = document.createElement('div');
                    el.className = \`marker driver-marker \${marker.selected ? 'selected' : ''}\`;
                    el.textContent = '🚗';
                    
                    const driverMarker = new mapboxgl.Marker({
                        element: el,
                        anchor: 'center'
                    })
                        .setLngLat([marker.lng, marker.lat])
                        .setPopup(new mapboxgl.Popup({ offset: 15 }).setHTML(
                            \`<div style="text-align: center; padding: 8px;">
                                <strong>\${marker.title}</strong><br>
                                <small>Available Driver</small>
                            </div>\`
                        ))
                        .addTo(map);
                        
                    driverMarkers.push(driverMarker);
                });
            }

            // Add destination marker
            if (data.destination) {
                const destEl = document.createElement('div');
                destEl.className = 'destination-marker';
                
                destinationMarker = new mapboxgl.Marker({
                    element: destEl,
                    anchor: 'bottom'
                })
                    .setLngLat([data.destination.lng, data.destination.lat])
                    .setPopup(new mapboxgl.Popup({ offset: 15 }).setHTML(
                        \`<div style="text-align: center; padding: 8px;">
                            <strong>Destination</strong><br>
                            <small>Your drop-off point</small>
                        </div>\`
                    ))
                    .addTo(map);
            }

            // Update route
            if (data.route && data.route.length > 0) {
                const routeCoords = data.route.map(point => [point.lng, point.lat]);
                
                map.getSource('route').setData({
                    'type': 'Feature',
                    'properties': {},
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': routeCoords
                    }
                });
            } else {
                // Clear route
                map.getSource('route').setData({
                    'type': 'Feature',
                    'properties': {},
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': []
                    }
                });
            }

            // Fit map to show all markers with padding
            const bounds = new mapboxgl.LngLatBounds();
            
            if (data.userLocation) {
                bounds.extend([data.userLocation.lng, data.userLocation.lat]);
            }
            
            if (data.destination) {
                bounds.extend([data.destination.lng, data.destination.lat]);
            }
            
            if (data.markers && data.markers.length > 0) {
                data.markers.forEach(marker => {
                    bounds.extend([marker.lng, marker.lat]);
                });
            }
            
            if (!bounds.isEmpty()) {
                map.fitBounds(bounds, { 
                    padding: { top: 50, bottom: 50, left: 50, right: 50 },
                    maxZoom: 16
                });
            }
        }

        // Message handler
        const handleMessage = function(event) {
            try {
                const messageData = event.data || event.detail;
                const message = JSON.parse(messageData);
                
                if (message.type === 'updateMap' && message.data) {
                    updateMap(message.data);
                }
            } catch (e) {
                console.error('Error parsing message:', e);
            }
        };
        
        // Add event listeners
        window.addEventListener('message', handleMessage);
        document.addEventListener('message', handleMessage);

        // Initialize map
        initMap();
    </script>
</body>
</html>`;

  // Error fallback UI
  if (mapError && retryCount >= 3) {
    return (
      <View style={{ 
        height: '100%', 
        width: '100%', 
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
      }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#EF4444', marginBottom: 10 }}>
          Map Error
        </Text>
        <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 20 }}>
          {mapError}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setRetryCount(0);
            setMapError(null);
            retryMapLoad();
          }}
          style={{
            backgroundColor: '#6366F1',
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 8
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ 
      height: '100%', 
      width: '100%', 
      borderRadius: 16,
      overflow: 'hidden'
    }}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={{ flex: 1 }}
        onMessage={(event) => {
          try {
            const message = JSON.parse(event.nativeEvent.data);
            console.log('📱 Message from WebView:', message);
            if (message.type === 'mapReady') {
              setMapLoaded(true);
              setMapError(null);
              setRetryCount(0); // Reset retry count on success
              console.log('✅ Mapbox WebView is ready');
            } else if (message.type === 'mapError') {
              console.error('Map internal error:', message.error);
              setMapError(message.error);
              retryMapLoad();
            }
          } catch (e) {
            console.error('❌ Error parsing WebView message:', e);
          }
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error: ', nativeEvent);
          setMapError('Map failed to load');
          retryMapLoad();
        }}
        onLoadStart={() => {
          console.log('🔄 WebView started loading...');
        }}
        onLoadEnd={() => {
          console.log('✅ WebView finished loading');
        }}
        onShouldStartLoadWithRequest={(request) => {
          // Allow all Mapbox and data URLs
          return request.url.startsWith('data:') || 
                 request.url.includes('mapbox.com') || 
                 request.url === 'about:blank';
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View className="flex justify-center items-center w-full h-full bg-gray-100">
            <ActivityIndicator size="large" color="#6366F1" />
            <Text className="mt-3 text-gray-600 font-JakartaMedium">
              {isReloading ? `Retrying... (${retryCount}/3)` : 'Loading Mapbox...'}
            </Text>
          </View>
        )}
      />
    </View>
  );
}