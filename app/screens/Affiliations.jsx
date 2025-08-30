import React from "react";
import { View, Text, TouchableOpacity, Image  } from "react-native";
import { stylesAffiliations } from "../static/liteNative/style";

function Affiliations({ navigation }) {
    return (
        <View style={stylesAffiliations.container}>
            <View style={stylesAffiliations.imageContainer}>
                <Image
                    source={require("../../assets/UOL.jpg")}
                    style={stylesAffiliations.image}
                />
                <Image
                    source={require("../../assets/FAHSIcon.png")}
                    style={stylesAffiliations.image}
                />
                <Image
                    source={require("../../assets/LSON.jpg")}
                    style={stylesAffiliations.image}
                />
            </View>
            <Text style={stylesAffiliations.title}>Supervised By:</Text>
            <Text style={stylesAffiliations.text}>Sarfaraz Masih Associate professor</Text>
            <Text>&</Text>
            <Text style={stylesAffiliations.text}>Shazia Shaheen (MSN)</Text>
            <TouchableOpacity
                style={stylesAffiliations.button}
                onPress={() => navigation.navigate("List")}
            >
                <Text style={stylesAffiliations.buttonText}>Tracheostomy care in Children</Text>
            </TouchableOpacity>
        </View>
    );
}


export default Affiliations;