import React from "react";
import { Linking, Text, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";

const Links = () => {
    const openLink = async (url) => {
        const supported = await Linking.canOpenURL(url);

        if (supported) {
            await Linking.openURL(url);
        } else {
            Alert.alert(`Can't open this URL: ${url}`);
        }
    };
    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
            <Text style={{ fontWeight: "bold", fontSize: 30, textAlign: "center", marginBottom: 20 }} >Tracheostomy Care Management</Text>
            <TouchableOpacity onPress={() => openLink("https://www.rch.org.au/rchcpg/hospital_clinical_guideline_index/Tracheostomy_Management_Guidelines/")}>
                <Text style={{ color: "#3498DB", fontSize: 18, marginBottom: 10 }}>The Royal Children's Hospital Melbourne</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openLink("https://www.ncbi.nlm.nih.gov/books/NBK593189/")}>
                <Text style={{ color: "#3498DB", fontSize: 18, marginBottom: 10 }}>National Library of Medicine</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openLink("https://www.youtube.com/watch?v=bivibBhUdcc")}>
                <Text style={{ color: "#3498DB", fontSize: 18, marginBottom: 10 }}>What is Tracheostomy (Youtube)</Text>
            </TouchableOpacity>
        </View>
    );
};

export default Links