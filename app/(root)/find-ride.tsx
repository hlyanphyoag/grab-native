import CustomButton from '@/components/CustomButton';
import GeoapifyAutocomplete from '@/components/GoogleTextInput';
import RideLayout from '@/components/RideLayout';
import { icons } from '@/constants';
import { router } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import { useLocationStore } from '../stores';

export default function FindRide() {
    const {
        userAddress,
        destinationAddress,
        setDestinationLocation,
        setUserLocation
    } = useLocationStore();

    console.log('User Location:', userAddress);
    console.log('Destination Location:', destinationAddress)
    return (
      
            <RideLayout title='Ride' snapPoints={["85%"]}>
                <View className='my-3'>
                    <Text className='text-lg font-JakartaSemiBold mb-3'>From</Text>
                    <GeoapifyAutocomplete 
                        icon={icons.target} 
                        initialLocation={userAddress!} 
                        textInputBackgroundColor='#f5f5f5'
                        containerStyle='bg-neutral-100'
                        handlePress={(location) => setUserLocation(location)}
                        />
                </View>
                <View className='my-3'>
                    <Text className='text-lg font-JakartaSemiBold mb-3'>To</Text>
                    <GeoapifyAutocomplete 
                        icon={icons.map} 
                        initialLocation={destinationAddress!} 
                        textInputBackgroundColor='#f5f5f5'
                        containerStyle='bg-neutral-100'
                        handlePress = {(location) => setDestinationLocation(location)}
                        />
                </View>
                <CustomButton title='Find Now' className='mt-5' onPress={() => router.push('/(root)/confirm-ride')}/>
            </RideLayout>
   
    )
}