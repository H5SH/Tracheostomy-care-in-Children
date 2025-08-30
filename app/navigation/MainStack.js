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
        <Stack.Navigator initialRouteName="Search"
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#000', // Background color of the header
                },
                headerTintColor: '#fff', // Text color of the header
                headerTitleStyle: {
                    alignSelf: 'center', // Align title to center
                },
            }}
        >
            <Stack.Screen name="Affiliated" component={Affiliations} options={{ title: "Affiliation with" }}/>
            <Stack.Screen name="List" component={MedList} />
            {/* <Stack.Screen name='Detail' component={MedDetail} /> */}
            <Stack.Screen name="Video" component={MedVideo} />
            <Stack.Screen name="Links" component={Links} />
        </Stack.Navigator>
    </NavigationContainer>
)


export default MainStack
