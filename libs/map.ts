import { Driver, MarkerData } from "@/types/type";

const directionsAPI = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

export const generateMarkersFromData = ({
                                            data,
                                            userLatitude,
                                            userLongitude,
                                        }: {
    data: Driver[];
    userLatitude: number;
    userLongitude: number;
}): MarkerData[] => {
    return data.map((driver) => {
        const latOffset = (Math.random() - 0.5) * 0.01; // Random offset between -0.005 and 0.005
        const lngOffset = (Math.random() - 0.5) * 0.01; // Random offset between -0.005 and 0.005

        return {
            latitude: userLatitude + latOffset,
            longitude: userLongitude + lngOffset,
            title: `${driver.first_name} ${driver.last_name}`,
            ...driver,
        };
    });
};

export const calculateRegion = ({
                                    userLatitude,
                                    userLongitude,
                                    destinationLatitude,
                                    destinationLongitude,
                                }: {
    userLatitude: number | null;
    userLongitude: number | null;
    destinationLatitude?: number | null;
    destinationLongitude?: number | null;
}) => {
    if (!userLatitude || !userLongitude) {
        return {
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
        };
    }

    if (!destinationLatitude || !destinationLongitude) {
        return {
            latitude: userLatitude,
            longitude: userLongitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
        };
    }

    const minLat = Math.min(userLatitude, destinationLatitude);
    const maxLat = Math.max(userLatitude, destinationLatitude);
    const minLng = Math.min(userLongitude, destinationLongitude);
    const maxLng = Math.max(userLongitude, destinationLongitude);

    const latitudeDelta = (maxLat - minLat) * 1.3; // Adding some padding
    const longitudeDelta = (maxLng - minLng) * 1.3; // Adding some padding

    const latitude = (userLatitude + destinationLatitude) / 2;
    const longitude = (userLongitude + destinationLongitude) / 2;

    return {
        latitude,
        longitude,
        latitudeDelta,
        longitudeDelta,
    };
};

export const calculateDriverTimes = async ({
  markers,
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  markers: MarkerData[];
  userLatitude: number | null | undefined;
  userLongitude: number | null | undefined;
  destinationLatitude: number | null | undefined;
  destinationLongitude: number | null | undefined;
}) => {
  if (
    !userLatitude ||
    !userLongitude ||
    !destinationLatitude ||
    !destinationLongitude
  )
    return [];

  const apiKey = process.env.EXPO_PUBLIC_GEOMAP_API_KEY;
  const base = 'https://api.geoapify.com/v1/routing';

  const buildUrl = (fromLat: number, fromLng: number, toLat: number, toLng: number) =>
    `${base}?waypoints=${fromLat},${fromLng}|${toLat},${toLng}&mode=drive&apiKey=${apiKey}`;

  try {
    const promises = markers.map(async (marker) => {
      // --- fetch #1 ---
      const res1 = await fetch(
        buildUrl(marker.latitude, marker.longitude, userLatitude, userLongitude)
      );
      const data1 = await res1.json();
      const time1 = data1?.features?.[0]?.properties?.time;
      if (time1 == null) return null;

      // --- fetch #2 ---
      const res2 = await fetch(
        buildUrl(userLatitude, userLongitude, destinationLatitude, destinationLongitude)
      );
      const data2 = await res2.json();
      const time2 = data2?.features?.[0]?.properties?.time;

      if (time2 == null) return null;

      const coords = data2?.features?.[0]?.geometry?.coordinates?.[0] ?? [];
      const routePath = coords.map(([lng, lat]: [number, number]) => ({ lat, lng }));

      const totalTime = Math.floor((time1 + time2) / 60);
      const price = (totalTime * 0.5).toFixed(2);

      return { ...marker, time: totalTime, price, routePath };
    });

    const results = await Promise.all(promises);
    return results.filter(Boolean); // drop any nulls
  } catch (err) {
    console.error('calculateDriverTimes error:', err);
    return [];
  }
};