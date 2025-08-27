// components/OpenMapsView.tsx
import { useDriverStore, useLocationStore } from '@/app/stores';
import { useFetch } from '@/libs/fetch';
import { calculateDriverTimes, generateMarkersFromData } from '@/libs/map';
import { Driver, MarkerData } from '@/types/type';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, {
    LatLng,
    Marker,
    Polyline,
    Region,
    UrlTile
} from 'react-native-maps';

interface Props {
  mapRef?: React.RefObject<MapView>;
}

export default function OpenMapsView({ mapRef: externalMapRef }: Props) {
  const { data: drivers, loading, error } = useFetch<Driver[]>('/(api)/driver');
  const internalMapRef = useRef<MapView>(null);
  const mapRef = externalMapRef || internalMapRef;

  const {
    userLongitude,
    userLatitude,
    destinationLongitude,
    destinationLatitude
  } = useLocationStore();

  const { selectedDriver, setDrivers } = useDriverStore();
  
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [route, setRoute] = useState<LatLng[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);

  // Convert driver data to markers
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
  }, [drivers, userLatitude, userLongitude, setDrivers]);

  // Calculate route using OpenRouteService
  const calculateRoute = async () => {
    if (!userLatitude || !userLongitude || !destinationLatitude || !destinationLongitude) {
      return;
    }

    setRouteLoading(true);
    try {
      const response = await fetch(
        `https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf6248fe04b5b2e4e84ee1a95e7e5eb5b4e3e8&start=${userLongitude},${userLatitude}&end=${destinationLongitude},${destinationLatitude}`
      );
      
      const data = await response.json();
      
      if (data.features && data.features[0] && data.features[0].geometry) {
        const coordinates = data.features[0].geometry.coordinates.map((coord: number[]) => ({
          latitude: coord[1],
          longitude: coord[0],
        }));
        
        setRoute(coordinates);
      }
    } catch (error) {
      console.error('Route calculation failed:', error);
      // Fallback: simple straight line
      setRoute([
        { latitude: userLatitude, longitude: userLongitude },
        { latitude: destinationLatitude, longitude: destinationLongitude }
      ]);
    } finally {
      setRouteLoading(false);
    }
  };

  useEffect(() => {
    if (mapReady) {
      calculateRoute();
    }
  }, [userLatitude, userLongitude, destinationLatitude, destinationLongitude, mapReady]);

  // Calculate driver times
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
  }, [markers, destinationLatitude, destinationLongitude, setDrivers]);

  // Fit map to show all markers
  const fitMapToMarkers = () => {
    if (!mapRef.current || !mapReady) return;

    const coordinates: LatLng[] = [];
    
    if (userLatitude && userLongitude) {
      coordinates.push({ latitude: userLatitude, longitude: userLongitude });
    }
    
    if (destinationLatitude && destinationLongitude) {
      coordinates.push({ latitude: destinationLatitude, longitude: destinationLongitude });
    }
    
    markers.forEach(marker => {
      coordinates.push({ latitude: marker.latitude, longitude: marker.longitude });
    });

    if (coordinates.length > 0) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  useEffect(() => {
    if (mapReady && markers.length > 0) {
      fitMapToMarkers();
    }
  }, [markers, mapReady, destinationLatitude, destinationLongitude]);

  // Loading state
  if (loading || !userLatitude || !userLongitude) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Map Error: {error}</Text>
        <Text style={styles.errorSubText}>
          Please check your internet connection and try again
        </Text>
      </View>
    );
  }

  const initialRegion: Region = {
    latitude: userLatitude,
    longitude: userLongitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        onMapReady={() => {
          console.log('OpenMaps ready!');
          setMapReady(true);
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
      >
        {/* OpenStreetMap tiles - completely free and no Google services! */}
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />
        {/* User Location Marker */}
        {userLatitude && userLongitude && (
          <Marker
            coordinate={{ latitude: userLatitude, longitude: userLongitude }}
            title="Your Location"
            description="You are here"
            pinColor="#007AFF"
          />
        )}

        {/* Driver Markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            title={marker.title || 'Driver'}
            description="Available Driver"
            pinColor={selectedDriver === marker.id ? "#FF6B6B" : "#4CAF50"}
            onPress={() => {
              console.log('Driver marker pressed:', marker.id);
              // Handle driver selection
            }}
          />
        ))}

        {/* Destination Marker */}
        {destinationLatitude && destinationLongitude && (
          <Marker
            coordinate={{ latitude: destinationLatitude, longitude: destinationLongitude }}
            title="Destination"
            description="Your drop-off point"
            pinColor="#FF4757"
          />
        )}

        {/* Route Polyline */}
        {route.length > 1 && (
          <Polyline
            coordinates={route}
            strokeColor="#6366F1"
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>
      
      {/* Cover any Google branding area */}
      <View style={styles.googleBrandingCover} />
      
      {/* Route Loading Indicator */}
      {routeLoading && (
        <View style={styles.routeLoadingContainer}>
          <ActivityIndicator size="small" color="#6366F1" />
          <Text style={styles.routeLoadingText}>Calculating route...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: 20,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
  routeLoadingContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  routeLoadingText: {
    marginLeft: 8,
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '500',
  },
  googleBrandingCover: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 80,
    height: 20,
    backgroundColor: 'white',
    zIndex: 1000,
  },
});