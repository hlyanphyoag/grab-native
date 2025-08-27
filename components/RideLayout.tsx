import { icons } from '@/constants'
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet'
import { router } from 'expo-router'
import React, { useRef } from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import MapSelector from './MapSelector'


export default function RideLayout({ children, title, snapPoints }: { children: React.ReactNode, title: string, snapPoints: string[] }) {
    const bottomSheetRef = useRef<BottomSheet>(null)
    return (
        <GestureHandlerRootView>
            <View className='flex-1 bg-white'>
                <View className='flex flex-col h-screen bg-blue-500'>
                    <View className='top-16 px-5 flex flex-row justify-start items-center z-10 gap-x-3'>
                        <TouchableOpacity onPress={() => router.back()}>
                            <View className='bg-white rounded-full w-10 h-10 flex justify-center items-center'>
                                <Image source={icons.backArrow} className='h-6 w-6' resizeMode='contain'/>
                            </View>
                        </TouchableOpacity>
                        <Text className='text-xl font-JakartaBold'>{title || 'Go Back'}</Text>
                    </View>
                </View>
            </View>
            <MapSelector />
            <BottomSheet keyboardBehavior='extend' ref={bottomSheetRef} snapPoints={snapPoints || ['45%', '85%']} index={0}>
                <BottomSheetView style={{padding: 20, flex: 1}}>
                    {children}
                </BottomSheetView>
            </BottomSheet>
        </GestureHandlerRootView>
    )
}