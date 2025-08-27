import { useLocationStore } from "@/app/stores";
import GoogleTextInput from "@/components/GoogleTextInput";
import MapSelector from "@/components/MapSelector";
import RideCard from "@/components/RideCard";
import { icons, images } from "@/constants";
import { useFetch } from "@/libs/fetch";
import { useAuth, useUser } from "@clerk/clerk-expo";

import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
  const { signOut } = useAuth();
  const { user } = useUser();
  // console.log('user:', user)

  const handleLogout = () => {
    signOut();
    router.replace("/(auth)/SignIn");
  };

  const handleDestinationPress = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    setDestinationLocation(location);
    router.push("/(root)/find-ride");
  };

  const { setUserLocation, setDestinationLocation, userAddress } =
    useLocationStore();

  const { data: recentRides, loading } = useFetch<any>(
    `/(api)/(ride)/${user?.id}`
  );
  const [haspermission, setHasPermission] = useState<boolean>(false);
  const [data, setData] = useState<any>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Default location - WYTU EC Department, Yangon, Myanmar
  //16.869777, 96.009742
  const DEFAULT_LOCATION = {
    latitude: 16.869777,
    longitude: 96.009742,
    address: "WYTU EC Department, V295+WV5, Yangon, Myanmar (Burma)"
  };

  // Set default location fallback function
  const setDefaultLocation = () => {
    console.log('📍 Using default location: WYTU EC Department');
    setUserLocation(DEFAULT_LOCATION);
    setHasPermission(true);
  };

  useEffect(() => {
    const requestLocation = async () => {
      try {
        // Request permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.log('❌ Location permission denied, using default location');
          setDefaultLocation();
          return;
        }

        // Single GPS attempt
        try {
          console.log('🔍 Getting current location...');
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          
          console.log('✅ GPS location found:', {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy
          });
          
          // Get address from coordinates
          let address = `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`;
          try {
            const addressResult = await Location.reverseGeocodeAsync({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
            
            if (addressResult && addressResult.length > 0) {
              const addr = addressResult[0];
              let formattedAddress = '';
              
              if (addr.streetNumber && addr.street) {
                formattedAddress = `${addr.streetNumber} ${addr.street}`;
              } else if (addr.street) {
                formattedAddress = addr.street;
              } else if (addr.name) {
                formattedAddress = addr.name;
              } else if (addr.district) {
                formattedAddress = addr.district;
              } else if (addr.subregion) {
                formattedAddress = addr.subregion;
              }
              
              let cityPart = '';
              if (addr.city) {
                cityPart = addr.city;
              } else if (addr.region) {
                cityPart = addr.region;
              } else if (addr.country) {
                cityPart = addr.country;
              }
              
              if (formattedAddress && cityPart) {
                address = `${formattedAddress}, ${cityPart}`;
              } else if (formattedAddress) {
                address = formattedAddress;
              } else if (cityPart) {
                address = cityPart;
              }
            }
          } catch (addressError) {
            console.log('⚠️ Reverse geocoding failed, using coordinates');
          }
          
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            address: address,
          });
          setHasPermission(true);
          
        } catch (error) {
          console.log('❌ GPS location failed:', error);
          console.log('📍 Using default location (WYTU EC Department)');
          setDefaultLocation();
        }

      } catch (error) {
        console.log('❌ Location request failed:', error);
        console.log('📍 Using default location (WYTU EC Department)');
        setDefaultLocation();
      }
    };

    requestLocation();
  }, []);

  return (
    <SafeAreaView>
      <FlatList
        data={recentRides}
        renderItem={({ item }) => <RideCard rides={item} />}
        className="px-5"
        contentContainerStyle={{
          paddingBottom: 100,
        }}
        ListEmptyComponent={() => (
          <View className="flex justify-center items-center">
            {!loading ? (
              <View className="flex justify-center items-center">
                <Image
                  source={images.noResult}
                  className="w-40 h-40"
                  resizeMode="contain"
                />
                <Text className="text-sm">No recent rides found</Text>
              </View>
            ) : (
              <ActivityIndicator size="small" color="#000" />
            )}
          </View>
        )}
        ListHeaderComponent={() => (
          <View>
            <View className="flex flex-row justify-between items-center  my-5">
              <Text className="text-2xl capitalize font-JakartaExtraBold">
                Welcome,{" "}
                {user?.firstName ||
                  user?.emailAddresses[0].emailAddress.split("@")[0]}
              </Text>
              <TouchableOpacity
                onPress={handleLogout}
                className="flex justify-center items-center w-10 h-10 rounded-full bg-white"
              >
                <Image source={icons.out} className="w-5 h-5" />
              </TouchableOpacity>
            </View>
            <GoogleTextInput
              // data = {data || []}
              initialLocation={userAddress!}
              icon={icons.search}
              containerStyle="bg-white "
              handlePress={handleDestinationPress}
            />

            {/* Location Status & Refresh Button */}
            <View className="flex-row items-center justify-between mt-3 mb-2">
              <View className="flex-row items-center gap-2">
                <View className={`w-3 h-3 rounded-full ${haspermission ? 'bg-green-500' : 'bg-red-500'}`} />
                <Text className="text-sm font-JakartaMedium text-gray-600">
                  Location: {haspermission ? 'Active' : 'Inactive'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={async () => {
                  setIsRefreshing(true);
                  setHasPermission(false);
                  
                  try {
                    console.log('🔍 Refreshing location...');
                    const location = await Location.getCurrentPositionAsync({
                      accuracy: Location.Accuracy.Balanced,
                    });
                    
                    // Get address from coordinates
                    let address = `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`;
                    try {
                      const addressResult = await Location.reverseGeocodeAsync({
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                      });
                      
                      if (addressResult && addressResult.length > 0) {
                        const addr = addressResult[0];
                        let formattedAddress = '';
                        
                        if (addr.streetNumber && addr.street) {
                          formattedAddress = `${addr.streetNumber} ${addr.street}`;
                        } else if (addr.street) {
                          formattedAddress = addr.street;
                        } else if (addr.name) {
                          formattedAddress = addr.name;
                        } else if (addr.district) {
                          formattedAddress = addr.district;
                        } else if (addr.subregion) {
                          formattedAddress = addr.subregion;
                        }
                        
                        let cityPart = '';
                        if (addr.city) {
                          cityPart = addr.city;
                        } else if (addr.region) {
                          cityPart = addr.region;
                        } else if (addr.country) {
                          cityPart = addr.country;
                        }
                        
                        if (formattedAddress && cityPart) {
                          address = `${formattedAddress}, ${cityPart}`;
                        } else if (formattedAddress) {
                          address = formattedAddress;
                        } else if (cityPart) {
                          address = cityPart;
                        }
                      }
                    } catch (addressError) {
                      console.log('⚠️ Reverse geocoding failed during refresh');
                    }
                    
                    setUserLocation({
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                      address: address,
                    });
                    setHasPermission(true);
                    
                  } catch (refreshError) {
                    console.log('❌ Location refresh failed:', refreshError.message);
                    console.log('📍 Using default location (WYTU EC Department)');
                    setDefaultLocation();
                  } finally {
                    setIsRefreshing(false);
                  }
                }}
                className="bg-blue-500 px-3 py-1 rounded-lg"
                disabled={isRefreshing}
              >
                <Text className="text-white text-xs font-JakartaMedium">
                  {isRefreshing ? 'Finding...' : 'Refresh'}
                </Text>
              </TouchableOpacity>
            </View>
            <>
              <View className="">
                <Text className="text-xl font-JakartaBold mb-3 mt-5">
                  Your Current Location
                </Text>
                <View className="h-[300px] w-full bg-gray-100 rounded-2xl overflow-hidden">
                  <MapSelector />
                  {/* <PureOpenStreetMap /> */}
                  {/* <MapboxNativeView /> */}
                  {/* <OSMMapView /> */}
                  {/* <NativeMapbox /> */}
                </View>
              </View>
              <Text className="text-xl font-JakartaBold mb-3 mt-5">
                Recent Rides
              </Text>
            </>
          </View>
        )}
      />
    </SafeAreaView>
  );
}