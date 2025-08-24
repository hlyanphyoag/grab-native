import { useUser } from "@clerk/clerk-react";
import { Redirect } from "expo-router";

export default function Home() {
  const { user, isLoaded } = useUser();
  // console.log(user?.isSignedIn);

  // Wait for Clerk to load before redirecting
  if (!isLoaded) return null;
  if (!user) {
    return (
      <Redirect href={'/(auth)/Welcome'}/>
    );
  }
  return (
    <Redirect href={'/(root)/(tabs)/Home'}/>
  );
}
