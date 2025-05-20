import { useLocationStore } from '@/app/stores'
import GoogleTextInput from '@/components/GoogleTextInput'
import Map from '@/components/Map'
import RideCard from '@/components/RideCard'
import { icons, images } from '@/constants'
import { useFetch } from '@/libs/fetch'
import { useAuth, useUser } from '@clerk/clerk-expo'

import * as Location from 'expo-location'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'




export default function Home() {
  const {signOut} = useAuth()
  const { user } = useUser();
  // console.log('user:', user)
  

  const handleLogout = () => {
    signOut();
    router.replace('/(auth)/SignIn')
  }

  const handleDestinationPress = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    console.log('location: ', location)
    setDestinationLocation(location);
    router.push('/(root)/find-ride')
  };

  const { setUserLocation, setDestinationLocation, userAddress} = useLocationStore();
  console.log('User:', user)
const {data: recentRides , loading } = useFetch<any>(`/(api)/(ride)/${user?.id}`)
  const [ haspermission, setHasPermission ] = useState<boolean>(false);
  const [data, setData] = useState<any>([])
  useEffect(() => {
    const requestLocation = async() => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if(status !== 'granted'){
        setHasPermission(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      })
      
      setUserLocation({
       latitude: location.coords?.latitude,
       longitude: location.coords?.longitude,
       address: `${address[0].name}, ${address[0].region}`
      })

      console.log('initail location:', userAddress)
    }
    requestLocation();
  },[])

  return (
    <SafeAreaView>
      <FlatList 
        data={recentRides}
        renderItem={({item})=> <RideCard rides={item}/>}
        className='px-5'
        contentContainerStyle={{
          paddingBottom: 100
        }}
        ListEmptyComponent={() => (
          <View className='flex justify-center items-center'>
              {!loading ? (
                <View className='flex justify-center items-center'>
                  <Image source={images.noResult} className='w-40 h-40' resizeMode='contain'/>
                  <Text className='text-sm'>No recent rides found</Text>
                </View>
              ) : (
                <ActivityIndicator size='small' color='#000'/>
              )}
          </View>
        )}
        ListHeaderComponent={() => (
          <View >
             <View className='flex flex-row justify-between items-center  my-5'>
                 <Text className='text-2xl capitalize font-JakartaExtraBold'>Welcome, {user?.firstName || user?.emailAddresses[0].emailAddress.split('@')[0]}</Text>
                 <TouchableOpacity onPress={handleLogout} className='flex justify-center items-center w-10 h-10 rounded-full bg-white'>
                    <Image source={icons.out} className='w-5 h-5'/>
                 </TouchableOpacity>
             </View>
             <GoogleTextInput 
                // data = {data || []} 
                initialLocation={userAddress!}
                icon = {icons.search}
                containerStyle = 'bg-white shadow-md shadow-neutral-300 '
                handlePress={handleDestinationPress}
             />
             <>
                <View className=''>
                  <Text className='text-xl font-JakartaBold mb-3 mt-5'>Your Current Location</Text>

                <View className='h-[300px] bg-transparent w-full'>
                      <Map />
                </View>
                </View>

                <Text className='text-xl font-JakartaBold mb-3 mt-5'>Recent Rides</Text>
             </>
          </View>
        )}
      />
    </SafeAreaView>
  )
}