import { icons } from '@/constants';
import { Tabs } from 'expo-router';
import React from 'react';
import { Image, ImageSourcePropType, View } from 'react-native';

const TabarIcon = ({source , focused} : {source: ImageSourcePropType, focused: boolean}) => (
  <View className={`flex justify-center items-center rounded-full ${focused ? 'bg-general-300' : ''}`}>
      <View className={`flex justify-center rounded-full items-center w-14 h-14 ${focused ? 'bg-general-400': ''}`}>
          <Image source={source} tintColor='white' resizeMode='contain' className='w-8 h-8'/>
      </View>
  </View>
)

 function _layout() {
  return (
    <Tabs 
      initialRouteName='Home' 
      screenOptions={{
        tabBarActiveTintColor: 'white',
        tabBarInactiveTintColor: 'white',
        tabBarStyle:{
          backgroundColor: '#333333',
          borderRadius: 50,
          position: 'absolute',
          overflow: 'hidden',
          marginHorizontal: 20,
          marginBottom: 20,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: 78
        },
        tabBarShowLabel: false,
        }}>
      <Tabs.Screen 
          name ='Home'
          options={{
            title: 'Home',
            headerShown: false,
            tabBarIcon: ({focused}) => (<TabarIcon focused={focused} source={icons.home}/>)
          }}
          />
      <Tabs.Screen 
          name ='History'
          options={{
            title: 'History',
            headerShown: false,
            tabBarIcon: ({focused}) => (<TabarIcon focused={focused} source={icons.list}/>)
          }}
          />
      <Tabs.Screen 
          name ='Chat'
          options={{
            title: 'Chat',
            headerShown: false,
            tabBarIcon: ({focused}) => (<TabarIcon focused={focused} source={icons.chat}/>)
          }}
          />
      <Tabs.Screen 
          name ='Profile'
          options={{
            title: 'Profile',
            headerShown: false,
            tabBarIcon: ({focused}) => (<TabarIcon focused={focused} source={icons.profile}/>)
          }}
          />
    </Tabs>
  )
}

export default _layout;