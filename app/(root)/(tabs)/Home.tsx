import { useLocationStore } from "@/app/stores";
import GoogleTextInput from "@/components/GoogleTextInput";
import Map from "@/components/Map";
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
  View,
  Platform,
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

  

  useEffect(() => {
    const requestLocation = async () => {
      try {
        // Request permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setHasPermission(false);
          return;
        }

        // Simple GPS approach for all devices
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          
          // Get detailed address from coordinates - enhanced for Android
          let address = `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`;
          try {
            const addressResult = await Location.reverseGeocodeAsync({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
            
            console.log('Android reverse geocode result:', JSON.stringify(addressResult[0], null, 2));
            
            if (addressResult && addressResult.length > 0) {
              const addr = addressResult[0];
              let formattedAddress = '';
              
              // Enhanced address formatting for Android compatibility
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
              } else if (addr.thoroughfare) {
                formattedAddress = addr.thoroughfare;
              } else if (addr.subThoroughfare) {
                formattedAddress = addr.subThoroughfare;
              }
              
              // Add city/locality info
              let cityPart = '';
              if (addr.city) {
                cityPart = addr.city;
              } else if (addr.locality) {
                cityPart = addr.locality;
              } else if (addr.region) {
                cityPart = addr.region;
              } else if (addr.administrativeArea) {
                cityPart = addr.administrativeArea;
              } else if (addr.country) {
                cityPart = addr.country;
              }
              
              // Combine parts
              if (formattedAddress && cityPart) {
                address = `${formattedAddress}, ${cityPart}`;
              } else if (formattedAddress) {
                address = formattedAddress;
              } else if (cityPart) {
                address = cityPart;
              }
              // If all fails, keep coordinates as fallback
            }
          } catch (addressError) {
            console.log('Android reverse geocode error:', addressError);
            // Keep coordinates as fallback
          }
          
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            address: address,
          });
          setHasPermission(true);
        } catch (error) {
          setHasPermission(false);
        }
        

      } catch (error) {
        // Silent fail
      }
    };

    // Start immediately
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
                  setHasPermission(false);
                  
                  // Enhanced GPS refresh for all devices  
                  try {
                    const location = await Location.getCurrentPositionAsync({
                      accuracy: Location.Accuracy.Balanced,
                    });
                    
                    // Get detailed address from coordinates - same as initial load
                    let address = `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`;
                    try {
                      const addressResult = await Location.reverseGeocodeAsync({
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                      });
                      
                      if (addressResult && addressResult.length > 0) {
                        const addr = addressResult[0];
                        let formattedAddress = '';
                        
                        // Enhanced address formatting for Android compatibility
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
                        } else if (addr.thoroughfare) {
                          formattedAddress = addr.thoroughfare;
                        } else if (addr.subThoroughfare) {
                          formattedAddress = addr.subThoroughfare;
                        }
                        
                        // Add city/locality info
                        let cityPart = '';
                        if (addr.city) {
                          cityPart = addr.city;
                        } else if (addr.locality) {
                          cityPart = addr.locality;
                        } else if (addr.region) {
                          cityPart = addr.region;
                        } else if (addr.administrativeArea) {
                          cityPart = addr.administrativeArea;
                        } else if (addr.country) {
                          cityPart = addr.country;
                        }
                        
                        // Combine parts
                        if (formattedAddress && cityPart) {
                          address = `${formattedAddress}, ${cityPart}`;
                        } else if (formattedAddress) {
                          address = formattedAddress;
                        } else if (cityPart) {
                          address = cityPart;
                        }
                      }
                    } catch (addressError) {
                      // Keep coordinates as fallback
                    }
                    
                    setUserLocation({
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                      address: address,
                    });
                    setHasPermission(true);
                  } catch (error) {
                    setHasPermission(false);
                  }
                }}
                className="bg-blue-500 px-3 py-1 rounded-lg"
              >
                <Text className="text-white text-xs font-JakartaMedium">Refresh</Text>
              </TouchableOpacity>
            </View>
            <>
              <View className="">
                <Text className="text-xl font-JakartaBold mb-3 mt-5">
                  Your Current Location
                </Text>
                <View className="h-[300px] w-full bg-gray-100 rounded-2xl overflow-hidden">
                  <Map />
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
