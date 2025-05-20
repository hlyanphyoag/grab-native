import { icons } from '@/constants'
import { googleOAuth } from '@/libs/auth'
import { useOAuth } from '@clerk/clerk-expo'
import { router } from 'expo-router'
import React, { useCallback } from 'react'
import { Image, Text, View } from 'react-native'
import CustomButton from './CustomButton'

export default function OAuth() {
    const { startOAuthFlow } = useOAuth({ strategy: "oauth_google"})

    const handleGoogleSignIn = useCallback(async() => {
      try{
        const result = await googleOAuth(startOAuthFlow)
        if(result.code === 'session_exists' || result.code === 'success'){
          router.push('/(root)/(tabs)/Home')
        }
      }catch(error){
        console.log('Error:', error)
      }
    },[])
  return (
    <View className=''>
        <View className='flex flex-row justify-center items-center gap-x-3  mt-4'>
            <View className='flex-1 h-[1px] w-full  bg-general-100'></View>
            <Text className='text-lg'>Or</Text>
            <View className='flex-1 h-[1px] w-full bg-general-100'></View>
        </View>

        <CustomButton 
            title='Login with Google' 
            className='w-full shadow-none mt-5'
            IconLeft={() => <Image source={icons.google} resizeMode='contain' className='w-5 h-5 mx-2'/>}
            bgVariant='outline'
            textVariant='primary'
            onPress={handleGoogleSignIn}
            />
    </View>
  )
}