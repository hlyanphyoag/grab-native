import { useDriverStore, useLocationStore } from '@/app/stores';
import { useFetch } from '@/libs/fetch';
import {
    calculateDriverTimes,
    generateMarkersFromData
} from '@/libs/map';
import { Driver, MarkerData } from '@/types/type';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function PureOpenStreetMap() {
  const { data: drivers, loading, error } = useFetch<Driver[]>('/(api)/driver');
  const webViewRef = useRef<WebView>(null);

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

  // Convert driver data to marker data and store it
  useEffect(() => {
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

  // Calculate route path
  const routePath = async () => {
    try {
      const res = await fetch(
        `https://api.geoapify.com/v1/routing?waypoints=${userLatitude},${userLongitude}|${destinationLatitude},${destinationLongitude}&mode=drive&apiKey=${process.env.EXPO_PUBLIC_GEOMAP_API_KEY}`
      );

      const json = await res.json();

      const coords = json?.features?.[0]?.geometry?.coordinates?.[0]?.map((item: any) => ({
        latitude: item[1],
        longitude: item[0]
      })) || [];

      setRoute(coords);
    } catch (err) {
      console.log('Route calculation error:', err);
      // Silent fail
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

  // Update markers and route when data changes
  useEffect(() => {
    if (mapLoaded && webViewRef.current) {
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

      webViewRef.current.postMessage(JSON.stringify({
        type: 'updateMap',
        data: updateMapData
      }));
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

  console.log('PureOpenStreetMap render - User location:', { userLatitude, userLongitude });
  console.log('PureOpenStreetMap render - Markers count:', markers?.length);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OpenStreetMap</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body, html { margin: 0; padding: 0; height: 100%; }
        #map { height: 100vh; width: 100vw; }
        .custom-marker {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 3px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .driver-marker { background-color: #4ECDC4; }
        .driver-marker.selected { background-color: #FF6B6B; }
        .user-marker { 
            background-color: #007AFF; 
            width: 20px; 
            height: 20px;
            border-width: 2px;
        }
        .destination-marker { background-color: #FF4444; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        let map;
        let userMarker, destinationMarker;
        let driverMarkers = [];
        let routeLine;

        function initMap() {
            map = L.map('map').setView([${userLatitude}, ${userLongitude}], 14);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(map);

            // Add user location marker
            const userIcon = L.divIcon({
                className: 'custom-marker user-marker',
                html: '',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });
            
            userMarker = L.marker([${userLatitude}, ${userLongitude}], { icon: userIcon })
                .addTo(map)
                .bindPopup('Your Location');

            window.postMessage(JSON.stringify({ type: 'mapReady' }));
        }

        function updateMap(data) {
            // Clear existing markers
            driverMarkers.forEach(marker => map.removeLayer(marker));
            driverMarkers = [];
            
            if (destinationMarker) {
                map.removeLayer(destinationMarker);
                destinationMarker = null;
            }
            
            if (routeLine) {
                map.removeLayer(routeLine);
                routeLine = null;
            }

            // Update user location
            if (userMarker && data.userLocation) {
                userMarker.setLatLng([data.userLocation.lat, data.userLocation.lng]);
            }

            // Add driver markers
            data.markers.forEach(marker => {
                const driverIcon = L.divIcon({
                    className: \`custom-marker driver-marker \${marker.selected ? 'selected' : ''}\`,
                    html: '🚗',
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                });
                
                const driverMarker = L.marker([marker.lat, marker.lng], { icon: driverIcon })
                    .addTo(map)
                    .bindPopup(marker.title);
                    
                driverMarkers.push(driverMarker);
            });

            // Add destination marker
            if (data.destination) {
                const destIcon = L.divIcon({
                    className: 'custom-marker destination-marker',
                    html: '📍',
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                });
                
                destinationMarker = L.marker([data.destination.lat, data.destination.lng], { icon: destIcon })
                    .addTo(map)
                    .bindPopup('Destination');
            }

            // Add route line
            if (data.route && data.route.length > 0) {
                const routeCoords = data.route.map(point => [point.lat, point.lng]);
                routeLine = L.polyline(routeCoords, {
                    color: '#0286ff',
                    weight: 4,
                    opacity: 0.8
                }).addTo(map);
            }

            // Fit map to show all markers
            const allPoints = [];
            if (data.userLocation) allPoints.push([data.userLocation.lat, data.userLocation.lng]);
            if (data.destination) allPoints.push([data.destination.lat, data.destination.lng]);
            data.markers.forEach(marker => allPoints.push([marker.lat, marker.lng]));
            
            if (allPoints.length > 1) {
                map.fitBounds(allPoints, { padding: [20, 20] });
            }
        }

        // Listen for messages from React Native
        window.addEventListener('message', function(event) {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'updateMap') {
                    updateMap(message.data);
                }
            } catch (e) {
                console.error('Error parsing message:', e);
            }
        });

        // Initialize map when page loads
        initMap();
    </script>
</body>
</html>`;

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
            if (message.type === 'mapReady') {
              setMapLoaded(true);
              console.log('Pure OpenStreetMap is ready');
            }
          } catch (e) {
            console.error('Error parsing WebView message:', e);
          }
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error: ', nativeEvent);
          setMapError('Map failed to load');
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View className="flex justify-center items-center w-full h-full bg-gray-100">
            <ActivityIndicator size="large" color="#0066FF" />
            <Text className="mt-3 text-gray-600 font-JakartaMedium">Loading map...</Text>
          </View>
        )}
      />
    </View>
  );
}
