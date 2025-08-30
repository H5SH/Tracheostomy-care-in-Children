import { FlashList } from "@shopify/flash-list";
import { ScrollView, Text } from "react-native";
import { names } from "../data/deases";
import { ImageSquareCard } from '../static/liteNative/components';
import { images } from "../data/deases";
import { TouchableOpacity } from "react-native-gesture-handler";
import { stylesCard } from "../static/liteNative/style";

function MedList({navigation}){
    const renderItem = ({ item }) => (
       <ImageSquareCard Title={item} source={images[item]} onPress={ ()=> navigation.navigate('Video', {name: item})}/>
      );

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 5, paddingTop: 10, backgroundColor: "#2C3E50"}}>
            <FlashList
                renderItem={renderItem}
                estimatedItemSize={50}
                data={names}
                keyExtractor={(item) => item}
            />
            <TouchableOpacity
                style={stylesCard.touchContainer}
                onPress={() => navigation.navigate('Links')}
            >
                <Text 
                style={{ 
                    color: "white", 
                    textAlign: "center", 
                    fontWeight: "bold", 
                    backgroundColor: "black", 
                    padding: 10 
                }}>
                    Trachestromy Care Management
                </Text>
            </TouchableOpacity>
        </ScrollView>
    )
}

export default MedList