import { useDriverStore, useLocationStore } from '@/app/stores';
import { icons } from '@/constants';
import { useFetch } from '@/libs/fetch';
import { calculateDriverTimes, calculateRegion, generateMarkersFromData } from '@/libs/map';
import { Driver, MarkerData } from '@/types/type';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';



export default function Map() {
  const { data: drivers, loading, error } = useFetch<Driver[]>('/(api)/driver')
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
  })

  const [route, setRoute] = useState([])


  const { selectedDriver, setDrivers } = useDriverStore();
  const [markers, setMarker] = useState<MarkerData[]>([]);

  useEffect(() => {
    console.log('drivers:', typeof drivers)
    if (drivers) {
      setDrivers(drivers);
    }
    if (Array.isArray(drivers)) {
      if (!drivers || !userLatitude || !userLongitude) return console.log('Heyy Error:');
      const newMarker = generateMarkersFromData({
        data: drivers,
        userLatitude, 
        userLongitude
      });
      // console.log('newMarker:', newMarker.length)
      if(newMarker.length > 0 ) {
        setMarker(newMarker)
      }
    }
  },[drivers, userLatitude, userLongitude])


const routePath = async() => {
  const responseToDestination = await fetch(
                `https://api.geoapify.com/v1/routing?waypoints=${userLatitude},${userLongitude}|${destinationLatitude},${destinationLongitude}&mode=drive&apiKey=${process.env.EXPO_PUBLIC_GEOMAP_API_KEY}`
            );
            const dataToDestination = await responseToDestination.json();

            const routePath = dataToDestination.features[0].geometry.coordinates[0].map((item : any)=> ({
                latitude: item[1],
                longitude: item[0]
            }))
            // console.log('routePath:', routePath)
            setRoute(routePath)        
  }

    useEffect(() => {
      routePath()
    },[])

  useEffect(() => {
    console.log('markersData:', markers.length)
    console.log('Destination:', destinationLatitude, destinationLongitude)
    if (markers.length > 0 && destinationLatitude && destinationLongitude) {
      console.log('Comeon Data:', markers.length)
      calculateDriverTimes({
        markers,
        userLatitude,
        userLongitude,
        destinationLatitude,
        destinationLongitude
      }).then((drivers) => setDrivers(drivers as MarkerData[]))
    }
  }, [markers, destinationLatitude, destinationLongitude])

  
  if (loading || !userLatitude || !userLongitude) {
    return (
      <View className='flex justify-between items-center w-full'>
        <ActivityIndicator size='small' color='#000' />
      </View>
    )
  }

  if (error) {
    return (
      <View className='flex justify-between items-center w-full'>
        <Text>Error: {error}</Text>
      </View>
    )
  }

  return (
    <MapView
      provider={PROVIDER_DEFAULT}
      style={{ height: '100%', width: '100%', borderRadius: 16 }}
      tintColor='blue'
      initialRegion={region}
      showsUserLocation={true}
      userInterfaceStyle='light'
      showsCompass={true}
    >
      {markers.map((marker) => (

        <Marker
          key={marker.id}
          coordinate={{
            latitude: marker.latitude,
            longitude: marker.longitude
          }}
          title={marker.title}
          image={selectedDriver === marker.id ? icons.selectedMarker : icons.marker}
        />
      ))}

      {destinationLatitude && destinationLongitude && (
        console.log('Pin:', destinationLatitude, destinationLongitude),
        <>
          <Marker
            key='destination'
            coordinate={{
              latitude: destinationLatitude,
              longitude: destinationLongitude
            }}
            title='Destination'
            image={icons.pin}
          />

       <Polyline
          coordinates={route}
          strokeColor="#0286ff"
          strokeWidth={3}
        />
        </>
      )}
    </MapView>
  )
}