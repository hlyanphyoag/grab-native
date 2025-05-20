import RideCard from '@/components/RideCard';
import { images } from '@/constants';
import { useFetch } from '@/libs/fetch';
import { useUser } from '@clerk/clerk-react';
import React from 'react';
import { ActivityIndicator, FlatList, Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const History = () => {
  const { user } = useUser();
  const {data: recentRides , loading } = useFetch<any>(`/(api)/(ride)/${user?.id}`)
  return (
    <SafeAreaView>
      <FlatList
        data={recentRides}
        renderItem={({ item }) => <RideCard rides={item} />}
        className='px-5'
        contentContainerStyle={{
          paddingBottom: 100
        }}
        ListEmptyComponent={() => (
          <View className='flex justify-center items-center'>
            {!loading ? (
              <View className='flex justify-center items-center'>
                <Image source={images.noResult} className='w-40 h-40' resizeMode='contain' />
                <Text className='text-sm'>No recent rides found</Text>
              </View>
            ) : (
              <ActivityIndicator size='small' color='#000' />
            )}
          </View>
        )}
        ListHeaderComponent = {() => (
          <View className='my-5'>
            <Text className='text-2xl font-JakartaBold'>History</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};


export default History;
