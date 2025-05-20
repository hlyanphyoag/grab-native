import CustomButton from '@/components/CustomButton';
import { onboarding } from '@/constants';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Image, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import Swiper from 'react-native-swiper';

 function Welcome() {
  const router = useRouter();
  const swiperRef = useRef<Swiper>(null);
  const [ activeIndex, setActiveIndex ] = useState(0);
  const isLastSlide = activeIndex === onboarding.length - 1;
  return (
    <SafeAreaView className='flex h-full bg-white  justify-between items-center'>
        <TouchableOpacity className='flex w-full p-5 justify-end items-end' onPress={() => router.replace('/(auth)/SignIn')}>
            <Text className='text-black text-md font-JakartaBold'>Skip</Text>
        </TouchableOpacity>
        <Swiper
          ref={swiperRef}
          loop={false}
          dot={
            <View className='w-[32px] h-[4px] mx-1 bg-[#E2E8F0] rounded-full' />
          }
          activeDot={
            <View className='w-[32px] h-[4px] mx-1 bg-[#0286FF] rounded-full'/>
          }
          onIndexChanged={(index) => setActiveIndex(index)}
        >
          {onboarding.map(item => (
            <View key={item.id} className='flex justify-center items-center p-5'>
              <Image source={item.image} className='w-full h-[300]' resizeMode='contain'/>
              <View className='flex justify-center items-center w-full mt-10'>
                  <Text className='text-3xl text-black font-bold mx-10 text-center'>{item.title}</Text>
              </View>
              <Text className='text-lg font-JakartaSemiBold text-center text-[#858585] mt-3 mx-10'>
                 {item.description}
              </Text>
            </View>
          ))}
        </Swiper>
        <CustomButton 
            title={isLastSlide ? 'Get Started' : 'Next'} 
            className='w-11/12 mt-10'
            onPress={() => isLastSlide ? router.replace('/(auth)/SignUp') : swiperRef.current?.scrollBy(1)}
            />
    </SafeAreaView>
  )
}

export default Welcome;