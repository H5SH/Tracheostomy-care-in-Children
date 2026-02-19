import { FlashList } from "@shopify/flash-list";
import { View, Text, TouchableOpacity } from "react-native";
import { names, images } from "../data/deases";
import { ImageSquareCard } from "../static/liteNative/components";

function MedList({ navigation }) {
  const renderItem = ({ item }) => (
    <View style={{ marginBottom: 16 }}>
      <ImageSquareCard
        Title={item}
        source={images[item]}
        onPress={() => navigation.navigate("Video", { name: item })}
      />
    </View>
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#f9fafb", // clean modern background
        paddingHorizontal: 14,
        paddingTop: 20,
      }}
    >
      {/* Title */}
      <Text
        style={{
          fontSize: 26,
          fontWeight: "bold",
          marginBottom: 20,
          color: "#111827",
        }}
      >
        Procedures
      </Text>

      {/* List */}
      <FlashList
        data={names}
        renderItem={renderItem}
        estimatedItemSize={120}
        keyExtractor={(item) => item}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate("Links")}
        style={{
          marginTop: 10,
          marginBottom: 20,
          backgroundColor: "#2563eb",
          paddingVertical: 16,
          borderRadius: 14,
          alignItems: "center",
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 5,
          elevation: 4,
        }}
      >
        <Text
          style={{
            color: "white",
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          Tracheostomy Care Management
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default MedList;
