import { useLocationStore } from '@/app/stores';
import { icons } from '@/constants';
import { GoogleInputProps } from '@/types/type';
import { useEffect, useState } from 'react';
import {
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Pressable
} from 'react-native';

interface featuresProps {
  properties: {
    formatted: string | undefined;
    place_id: string;
    lat: number;
    lon: number;
  };
}

const GeoapifyAutocomplete = ({
  handlePress,
  icon,
  initialLocation,
  containerStyle,
  allocation,
  textInputBackgroundColor,
  placeholder
}: GoogleInputProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<featuresProps[]>([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setUserLocation } = useLocationStore();

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const delayDebounce = setTimeout(() => {
      fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${query}&apiKey=${process.env.EXPO_PUBLIC_GEOMAP_API_KEY}`
      )
        .then((res) => res.json())
        .then((data: { features: featuresProps[] }) => {
          const validateFeature = (data.features || []).filter(
            (item) => item?.properties?.place_id
          );
          setResults(validateFeature);
          setIsLoading(false);
        })
        .catch((err) => {
          console.log(err);
          setIsLoading(false);
        });
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [query]);

  return (
    <View className="w-full">
      <View
        className={`flex bg-white flex-row justify-center items-center py-3 border px-4 rounded-2xl ${
          isFocused ? 'border-blue-500' : 'border-gray-200'
        } ${containerStyle}`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }}
      > 
        <View className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
          <Image 
            source={icon as any} 
            resizeMode="contain" 
            className="w-5 h-5" 
            style={{ tintColor: isFocused ? '#3b82f6' : '#6b7280' }}
          />
        </View>
        <TextInput
          placeholder={placeholder || initialLocation || 'Where to?'}
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={setQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`flex-1 h-12 font-JakartaMedium text-base text-gray-900 ${textInputBackgroundColor}`}
        />
        {query.length > 0 && (
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => {
              setQuery('');
              setResults([]);
              setSelectedPlace(null);
            }}
          >
            <View className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center ml-2">
              <Image 
                source={icons.close} 
                className="w-4 h-4" 
                style={{ tintColor: '#6b7280' }}
              />
            </View>
          </TouchableOpacity>
        )}
        

      </View>

      {query && !selectedPlace && (
        <View className="mt-2">
          {/* Container with shadow and rounded corners */}
          <View 
            className="bg-white rounded-2xl overflow-hidden"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            {isLoading ? (
              <View className="py-6 flex items-center justify-center">
                <ActivityIndicator size="small" color="#0066FF" />
                <Text className="text-gray-500 font-JakartaMedium mt-2">
                  Searching locations...
                </Text>
              </View>
                         ) : results.length > 0 ? (
               <View style={{ maxHeight: 250 }}>
                 {results.map((item, index) => (
                   <View key={index}>
                     <Pressable
                       style={({ pressed }) => [
                         { 
                           paddingVertical: 4,
                           opacity: pressed ? 0.7 : 1,
                           backgroundColor: pressed ? '#f3f4f6' : 'transparent'
                         }
                       ]}
                                               onPress={() => {
                          const location = {
                            latitude: item?.properties?.lat,
                            longitude: item?.properties?.lon,
                            address: item?.properties?.formatted
                          };
                          
                          setSelectedPlace(location as any);
                          setQuery(item?.properties?.formatted || '');
                          setResults([]); // Clear results after selection
                          handlePress(location);
                        }}
                     >
                       <View className="px-4 py-4 flex flex-row items-start gap-x-3 bg-white">
                         {/* Location icon with background */}
                         <View className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mt-1">
                           <Image 
                             source={icons.point} 
                             className="w-5 h-5 tint-blue-600" 
                             style={{ tintColor: '#2563eb' }}
                           />
                         </View>
                         
                         {/* Text content */}
                         <View className="flex-1 flex-col">
                           <Text 
                             className="text-base font-JakartaSemiBold text-gray-900 leading-5"
                             numberOfLines={2}
                           >
                             {item?.properties?.formatted?.split(',')[0]}
                           </Text>
                           <Text 
                             className="text-sm font-JakartaMedium text-gray-500 mt-1 leading-4"
                             numberOfLines={1}
                           >
                             {item?.properties?.formatted?.split(',').slice(1).join(',').trim()}
                           </Text>
                         </View>
                         
                         {/* Arrow indicator */}
                         <View className="ml-2 mt-2">
                           <Image 
                             source={icons.arrowUp} 
                             className="w-4 h-4 rotate-45 tint-gray-400"
                             style={{ 
                               tintColor: '#9ca3af',
                               transform: [{ rotate: '45deg' }]
                             }}
                           />
                         </View>
                       </View>
                     </Pressable>
                     {index < results.length - 1 && (
                       <View className="h-[1px] bg-gray-100 mx-4" />
                     )}
                   </View>
                 ))}
                 
                 {/* Footer */}
                 <View className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                   <Text className="text-xs font-JakartaMedium text-gray-400 text-center">
                     Powered by Geoapify
                   </Text>
                 </View>
               </View>
            ) : query.length >= 3 ? (
              <View className="py-6 px-4 flex items-center justify-center">
                <Image 
                  source={icons.search} 
                  className="w-8 h-8 tint-gray-300 mb-2"
                  style={{ tintColor: '#d1d5db' }}
                />
                <Text className="text-gray-500 font-JakartaMedium text-center">
                  No locations found
                </Text>
                <Text className="text-gray-400 font-Jakarta text-sm text-center mt-1">
                  Try adjusting your search terms
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      )}
    </View>
  );
};

export default GeoapifyAutocomplete;
