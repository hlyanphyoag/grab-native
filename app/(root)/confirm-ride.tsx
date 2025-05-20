import CustomButton from '@/components/CustomButton'
import DriverCard from '@/components/DriverCard'
import RideLayout from '@/components/RideLayout'
import { router } from 'expo-router'
import React from 'react'
import { FlatList, View } from 'react-native'
import { useDriverStore } from '../stores'

export default function Confirmride() {
    const { drivers, selectedDriver, setSelectedDriver } = useDriverStore()
    // console.log('Drivers:', drivers)
  return (
    <RideLayout title='Choose a Driver' snapPoints={["65%", "85%"]}>
        <FlatList 
            data={drivers}
            renderItem={({item}) => 
            <DriverCard 
            key={item.id} 
            item={item}
            selected={selectedDriver!}
            setSelected={()=>setSelectedDriver(item.id!)}
            />}
            ListFooterComponent={() => (
                <View className='mt-5 mx-10'>
                    <CustomButton title='Select Ride' onPress={() => router.push('/(root)/book-ride') }/>
                </View>
            )}
            />
    </RideLayout>
  )
}