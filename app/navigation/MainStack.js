import React from "react";
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from "@react-navigation/native";
import MedList from "../screens/MedList";
import MedDetail from "../screens/MedDetail";
import MedVideo from "../screens/MedVideo";
import Affiliations from "../screens/Affiliations";
import Links from "../screens/Links";

const Stack = createStackNavigator()

const MainStack = () => (
  <NavigationContainer>
    <Stack.Navigator
      initialRouteName="Affiliated"
      screenOptions={{
        headerStyle: {
          backgroundColor: "#ffffff",
        },
        headerTintColor: "#111827", // dark readable text
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 18,
        },
        headerTitleAlign: "center",
        headerShadowVisible: true, // subtle modern shadow
      }}
    >
      <Stack.Screen
        name="Affiliated"
        component={Affiliations}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="List"
        component={MedList}
        options={{ title: "Tracheostomy Procedures" }}
      />

      <Stack.Screen
        name="Video"
        component={MedVideo}
        options={{ title: "Training Video" }}
      />

      <Stack.Screen
        name="Links"
        component={Links}
        options={{ title: "Resources" }}
      />
    </Stack.Navigator>
  </NavigationContainer>
);



export default MainStack
