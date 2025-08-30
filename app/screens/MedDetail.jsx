import React from "react";
import { View, Text } from "react-native";
import { details } from "../data/deases";


function MedDetail({ route, navigation }) {
  const { name } = route.params;

  return (
    <View style={{ flex: 1, flexDirection: "row" }}>
      <View style={{ padding: 20, alignItems: "center" }}>
        <Text style={{ fontWeight: "bold", fontSize: 30, textAlign: "center", marginBottom: 20 }}>{name}</Text>
        <Text style={{ fontSize: 15, textAlign: "center", marginBottom: 20 }}>{details[name]}</Text>
      </View>
    </View>
  );
}

export default MedDetail;