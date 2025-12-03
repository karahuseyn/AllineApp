import { Stack } from "expo-router";
import Head from "expo-router/head";

export default function RootLayout() {
  return (
    <>
      <Head>
        <title>Alline</title>
        <link rel="icon" type="image/svg+xml" href="./favicon.svg" />
        <link rel="shortcut icon" href="./favicon.svg" />
      </Head>
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
