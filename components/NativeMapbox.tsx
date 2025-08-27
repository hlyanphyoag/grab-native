import { useDriverStore, useLocationStore } from '@/app/stores';
import { useFetch } from '@/libs/fetch';
import {
    calculateDriverTimes,
    generateMarkersFromData
} from '@/libs/map';
import { Driver, MarkerData } from '@/types/type';
import Mapbox, {
    Camera,
    LineLayer,
    MapView,
    PointAnnotation,
    ShapeSource
} from '@rnmapbox/maps';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

// Set Mapbox access token using your actual token
Mapbox.setAccessToken('pk.eyJ1IjoiaGx5YW5waHlvIiwiYSI6ImNtZXJiaTRzbjAwZG0yaXNhYTFiMnAwZXAifQ.BRH57AFtxX2UWr18ZMMPwg');

export default function NativeMapbox() {
  const { data: drivers, loading, error } = useFetch<Driver[]>('/(api)/driver');

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

  // Create route line for Mapbox
  const routeGeoJSON = route.length > 0 ? {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: route.map(coord => [coord.longitude, coord.latitude])
    }
  } : null;

  console.log('Native Mapbox render - User location:', { userLatitude, userLongitude });
  console.log('Native Mapbox render - Markers count:', markers?.length);

  return (
    <View style={{ height: '100%', width: '100%', borderRadius: 16, overflow: 'hidden' }}>
      <MapView
        style={{ flex: 1 }}
        styleURL="mapbox://styles/mapbox/streets-v12" // Beautiful Mapbox style
        zoomEnabled={true}
        scrollEnabled={true}
        onDidFinishLoadingMap={() => {
          console.log('Native Mapbox map loaded successfully');
          setMapError(null);
        }}
      >
        <Camera
          centerCoordinate={[userLongitude, userLatitude]}
          zoomLevel={14}
          animationMode="flyTo"
          animationDuration={2000}
        />

        {/* User location marker */}
        <PointAnnotation
          id="user-location"
          coordinate={[userLongitude, userLatitude]}
        >
          <View
            style={{
              width: 20,
              height: 20,
              backgroundColor: '#007AFF',
              borderRadius: 10,
              borderWidth: 3,
              borderColor: 'white',
            }}
          />
        </PointAnnotation>

        {/* Driver markers */}
        {Array.isArray(markers) &&
          markers.map((marker) => {
            if (
              !marker ||
              marker.latitude == null ||
              marker.longitude == null ||
              !marker.id
            ) {
              return null;
            }

            return (
              <PointAnnotation
                key={`driver-${marker.id}`}
                id={`driver-${marker.id}`}
                coordinate={[marker.longitude, marker.latitude]}
                title={marker.title ?? 'Driver'}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: selectedDriver === marker.id ? '#FF6B6B' : '#4ECDC4',
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 3,
                    borderColor: 'white',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 5,
                  }}
                >
                  <Text style={{ fontSize: 18 }}>🚗</Text>
                </View>
              </PointAnnotation>
            );
          })}

        {/* Destination marker */}
        {destinationLatitude && destinationLongitude && (
          <PointAnnotation
            id="destination"
            coordinate={[destinationLongitude, destinationLatitude]}
            title="Destination"
          >
            <View
              style={{
                width: 40,
                height: 40,
                backgroundColor: '#FF4444',
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 3,
                borderColor: 'white',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              <Text style={{ fontSize: 18 }}>📍</Text>
            </View>
          </PointAnnotation>
        )}

        {/* Route line */}
        {routeGeoJSON && (
          <ShapeSource id="route-source" shape={routeGeoJSON}>
            <LineLayer
              id="route-layer"
              style={{
                lineColor: '#0286ff',
                lineWidth: 4,
                lineCap: 'round',
                lineJoin: 'round',
                lineOpacity: 0.8,
              }}
            />
          </ShapeSource>
        )}
      </MapView>
    </View>
  );
}
