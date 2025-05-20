import { useUser } from "@clerk/clerk-react";
import { Redirect } from "expo-router";

export default function Home() {

  const user = useUser();
  if (user) {
    return (
      <Redirect href={'/(root)/(tabs)/Home'}/>
    );
  }
  return (
    <Redirect href={'/(auth)/Welcome'}/>
  );
}
