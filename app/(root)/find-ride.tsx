import CustomButton from '@/components/CustomButton';
import GeoapifyAutocomplete from '@/components/GoogleTextInput';
import RideLayout from '@/components/RideLayout';
import { icons } from '@/constants';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocationStore } from '../stores';

export default function FindRide() {
  const {
    userAddress,
    destinationAddress,
    setDestinationLocation,
    setUserLocation
  } = useLocationStore();

  const [fromPlaceholder, setFromPlaceholder] = useState('Where to?');
  const [toPlaceholder, setToPlaceholder] = useState('Where to?');

  useEffect(() => {
    setFromPlaceholder(userAddress || 'Where to?');
    setToPlaceholder(destinationAddress || 'Where to?');
  }, [userAddress, destinationAddress]);

  return (
    <RideLayout title='Ride' snapPoints={["55%", "85%"]}>
      <View className='my-3'>
        <Text className='text-lg font-JakartaSemiBold mb-3'>From</Text>
        <GeoapifyAutocomplete 
          icon={icons.target} 
          initialLocation={userAddress!} 
          textInputBackgroundColor='#f5f5f5'
          containerStyle='bg-neutral-100'
          allocation={true}
          handlePress={(location: any) => setUserLocation(location)}
          placeholder={fromPlaceholder}
        />
      </View>
      <View className='my-3'>
        <Text className='text-lg font-JakartaSemiBold mb-3'>To</Text>
        <GeoapifyAutocomplete 
          icon={icons.map} 
          initialLocation={destinationAddress!} 
          textInputBackgroundColor='#f5f5f5'
          containerStyle='bg-neutral-100'
          allocation={false}
          handlePress={(location: any) => setDestinationLocation(location)}
          placeholder={toPlaceholder}
        />
      </View>
      <CustomButton title='Find Now' className='mt-5' onPress={() => router.push('/(root)/confirm-ride')} />
    </RideLayout>
  );
}