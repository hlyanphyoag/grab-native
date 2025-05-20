import { icons } from '@/constants';
import { formatDate, formatTime } from '@/libs/utils';
import { Ride } from '@/types/type';
import React from 'react';
import { Image, Text, View } from 'react-native';

export default function RideCard({rides: {origin_address, origin_latitude, origin_longitude, destination_address, destination_latitude, destination_longitude, driver, driver_id, created_at, ride_time, payment_status}} : {rides: Ride}) {
    console.log('lat:', `https://maps.geoapify.com/v1/staticmap?style=osm-bright-smooth&width=600&height=400&center=lonlat:${destination_latitude},${destination_longitude}&zoom=14&apiKey=${process.env.EXPO_PUBLIC_GEOMAP_API_KEY}`)
  return (
    <View className='flex flex-col justify-center items-center bg-white shadow-sm shadow-neutral-300 mb-3 rounded-lg'>
       
        <View className='flex flex-row justify-between  items-center p-3'>
         <View className=''>
                {/* <MapView 
                    style={styles.map}
                    region={{
                        latitude: destination_latitude || 16.8409, // Use ride's origin or fallback
                        longitude: destination_longitude || 96.1735,
                        latitudeDelta: 0.0922, // Adjust for zoom level (smaller = zoomed in)
                        longitudeDelta: 0.0421, 
                    }}
                /> */}
                <Image 
                  source={{
                    uri: `https://maps.geoapify.com/v1/staticmap?style=osm-bright-smooth&width=600&height=400&center=lonlat:${destination_longitude},${destination_latitude}&zoom=14&apiKey=${process.env.EXPO_PUBLIC_GEOMAP_API_KEY}`
                  }}
                  className='w-[90px] h-[90px] rounded-lg' 
                />
         </View>
         <View className='flex-1 mx-5 gap-y-5 flex-col'>
             <View className='flex gap-x-2 items-center flex-row'>
                 <Image  source={icons.to} className='w-5 h-5'/>
                 <Text>{origin_address}</Text>
             </View>

             <View className='flex gap-x-2 items-center flex-row'>
                 <Image  source={icons.point} className='w-5 h-5'/>
                 <Text>{destination_address}</Text>
             </View>
         </View>
        </View>
         <View className='p-3 mt-5'>
              <View className='flex justify-between rounded-lg p-3 bg-general-500 w-full items-start'>
                        <View className='flex flex-row items-center w-full justify-between mb-5'>
                            <Text className='text-medium font-JakartaMedium text-gray-500'>Date & Time</Text>
                            <Text className='text-medium font-JakartaMedium text-gray-500'>
                              {formatDate(created_at)}, {formatTime(ride_time)}
                            </Text>
                        </View>
                        <View className='flex flex-row items-center w-full justify-between mb-5'>
                            <Text className='text-medium font-JakartaMedium text-gray-500'>Driver</Text>
                            <Text className='text-medium font-JakartaMedium text-gray-500'>
                              {driver.first_name} {driver.last_name}
                            </Text>
                        </View>
                        <View className='flex flex-row items-center w-full justify-between mb-5'>
                            <Text className='text-medium font-JakartaMedium text-gray-500'>Car Seats</Text>
                            <Text className='text-medium font-JakartaMedium text-gray-500'>
                              {driver.car_seats}
                            </Text>
                        </View>
                        <View className='flex flex-row items-center w-full justify-between mb-5'>
                            <Text className='text-medium font-JakartaMedium text-gray-500'>Payment Status</Text>
                            <Text className={`text-medium font-JakartaMedium ${payment_status === 'paid' ? 'text-green-500' : 'text-red-500'}`}>
                                {payment_status}
                            </Text>
                        </View>
              </View>
         </View>
      
    </View>
  )
}

