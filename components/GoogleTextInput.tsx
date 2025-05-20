import { icons } from '@/constants';
import { useEffect, useState } from 'react';
import { FlatList, Image, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';

interface featuresProps {
  properties: {
    formatted: string | undefined;
    place_id: string;
    lat: number;
    lon: number;
  }
}



const GeoapifyAutocomplete = ({ handlePress, icon, initialLocation, containerStyle, textInputBackgroundColor }: GoogleInputPPPPProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<featuresProps[]>([]);
  const [selectedPlace, setSelectedPlace] = useState(null);

  // const handlePressItem = () => {
  //   Keyboard.dismiss();
  //   handlePress();
  // }

  useEffect(() => {
    if (query.length < 3) return;
    const delayDebounce = setTimeout(() => {
      fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${query}&apiKey=${process.env.EXPO_PUBLIC_GEOMAP_API_KEY}`
      )
        .then((res) => res.json())
        .then((data: { features: featuresProps[] }) => {
          const validateFeature = (data.features || []).filter((item) => item?.properties?.place_id)
          setResults(validateFeature)
        })
        .catch((err) => console.log(err));
    }, 300); // Debounce to avoid too many API calls
    return () => clearTimeout(delayDebounce);
  }, [query]);

  return (
    <View className='w-full '>
      <View className={`flex bg-white flex-row justify-center items-center py-2 border-[1px] px-6 border-neutral-200 rounded-xl ${containerStyle}`}>

        <TextInput
          placeholder={initialLocation}
          placeholderTextColor='gray'
          value={query}
          onChangeText={setQuery}
          className={`bg-white  w-11/12 rounded-xl  pb-1 mx-2 h-12  font-JakartaMedium text-lg ${textInputBackgroundColor}`}
        />

        <View className='w-1/12 flex items-center  justify-center'>
          <Image source={icon} resizeMode='contain' className='w-6 h-6 ' />
        </View>

      </View>

      {/* Display autocomplete results */}

      {query &&
        <FlatList
          keyboardShouldPersistTaps='handled'
          data={results}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableWithoutFeedback onPress={()=> {
              const location = {
                latitude: item?.properties?.lat,
                longitude: item?.properties?.lon,
                address: item?.properties?.formatted
              }
              console.log('Heyy final:', location);
              handlePress(location)
            }}>
              <View className='py-4 flex flex-row justify-start items-center gap-x-4 bg-white rounded-xl mt-1 px-5'>
                <Image source={icons.point} className='w-6 h-6' />
                <Text className='text-lg font-JakartaMedium'>{item?.properties?.formatted}</Text>
              </View>
            </TouchableWithoutFeedback>
          )}
        />
      }
    </View>
  );
};

export default GeoapifyAutocomplete;