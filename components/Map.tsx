import { useDriverStore, useLocationStore } from '@/app/stores';
import { icons } from '@/constants';
import { useFetch } from '@/libs/fetch';
import {
  calculateDriverTimes,
  calculateRegion,
  generateMarkersFromData
} from '@/libs/map';
import { Driver, MarkerData } from '@/types/type';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';

export default function Map() {
  const { data: drivers, loading, error } = useFetch<Driver[]>('/(api)/driver');

  const {
    userLongitude,
    userLatitude,
    destinationLongitude,
    destinationLatitude
  } = useLocationStore();

  const region = calculateRegion({
    userLatitude,
    userLongitude,
    destinationLatitude,
    destinationLongitude
  });

  const [route, setRoute] = useState<{ latitude: number; longitude: number }[]>([]);
  const { selectedDriver, setDrivers } = useDriverStore();
  const [markers, setMarkers] = useState<MarkerData[]>([]);


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
  if (error) {
    return (
      <View className="flex justify-center items-center w-full h-full bg-red-50 rounded-2xl">
        <Text className="text-red-600 font-JakartaMedium">Map Error: {error}</Text>
      </View>
    );
  }

  // Render map
  return (
    <MapView
      provider={PROVIDER_DEFAULT}
      style={{ 
        height: '100%', 
        width: '100%', 
        borderRadius: 16,
        overflow: 'hidden'
      }}
      tintColor="blue"
      region={region}
      showsUserLocation={true}
      userInterfaceStyle="light"
      showsCompass={true}
      showsMyLocationButton={false}
      showsBuildings={true}
      showsTraffic={false}
      mapType="standard"
      onMapReady={() => {}}
      onRegionChange={() => {}}
    >
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
            <Marker
              key={marker.id}
              coordinate={{
                latitude: marker.latitude,
                longitude: marker.longitude
              }}
              title={marker.title ?? 'Driver'}
              image={
                selectedDriver === marker.id
                  ? icons?.selectedMarker
                  : icons?.marker
              }
            />
          );
        })}

      {destinationLatitude && destinationLongitude && (
        <>
          <Marker
            key="destination"
            coordinate={{
              latitude: destinationLatitude,
              longitude: destinationLongitude
            }}
            title="Destination"
            image={icons?.pin}
          />
          <Polyline coordinates={route} strokeColor="#0286ff" strokeWidth={3} />
        </>
      )}
    </MapView>
  );
}
