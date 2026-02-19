import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
} from "react-native";

const { width } = Dimensions.get("window");

function Affiliations({ navigation }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "white",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
      }}
    >
      {/* Logo */}
      <Image
        source={require("../../assets/FAHSIcon.png")}
        style={{
          width: width * 0.6,
          height: width * 0.6,
          marginBottom: 40,
        }}
        resizeMode="contain"
      />

      {/* Title */}
      <Text
        style={{
          fontSize: 30,
          fontWeight: "bold",
          textAlign: "center",
          color: "#1f2937",
          marginBottom: 10,
        }}
      >
        Tracheostomy Care
      </Text>

      <Text
        style={{
          fontSize: 17,
          textAlign: "center",
          color: "#6b7280",
          marginBottom: 50,
          lineHeight: 24,
        }}
      >
        Learn the correct procedure for tracheostomy care in children.
      </Text>

      {/* Animated Button */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={{
            backgroundColor: "#2563eb",
            paddingVertical: 16,
            paddingHorizontal: 50,
            borderRadius: 14,
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 4,
          }}
          onPress={() => navigation.navigate("List")}
        >
          <Text
            style={{
              color: "white",
              fontSize: 18,
              fontWeight: "600",
            }}
          >
            Start
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default Affiliations;
