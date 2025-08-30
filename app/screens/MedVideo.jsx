import React, { useRef, useState } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Video, ResizeMode } from "expo-av";
import { stylesVideo } from "../static/liteNative/style";
import { details, English, Urdu, Punjabi } from "../data/deases";

function MedVideo({ route, navigation }) {
  const videoRef = useRef(null);
  const { name } = route.params;

  const [playingVideo, setPlayingVideo] = useState(English[name]);

  const EnglishVideoHandler = () => {
    const video = English[name];
    if (video) {
      setPlayingVideo(video);
    }
  };
  // const UrduVideoHandler = () => {
  //   const video = Urdu[name];
  //   if (video) {
  //     setPlayingVideo(video);
  //   }
  // };
  // const PunjabiVideoHandler = () => {
  //   const video = Punjabi[name];
  //   if (video) {
  //     setPlayingVideo(video);
  //   }
  // };

  return (
    <View style={stylesVideo.container}>
      <Text style={{ fontWeight: "bold", fontSize: 30, textAlign: "center", marginBottom: 20, color: "white" }}>{name}</Text>
      <Video
        source={playingVideo}
        ref={videoRef}
        style={stylesVideo.video}
        useNativeControls
        resizeMode={ResizeMode.STRETCH}
        isLooping
      />
      <View style={stylesVideo.Buttons}>
        <TouchableOpacity style={stylesVideo.button} onPress={EnglishVideoHandler}>
          <Text style={{ color: 'white' }}>English</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity style={stylesVideo.button} onPress={UrduVideoHandler}>
          <Text style={{ color: 'white' }}>اردو</Text>
        </TouchableOpacity> */}
        {/* <TouchableOpacity style={stylesVideo.button} onPress={PunjabiVideoHandler}>
          <Text style={{ color: 'white' }}>پنجابی</Text>
        </TouchableOpacity> */}
      </View>
      {/* <View style={{ padding: 20, alignItems: "center" }}>
        <Text style={{ fontSize: 15, textAlign: "center", marginBottom: 20 }}>{details[name]}</Text>
      </View> */}
    </View>
  );
}

export default MedVideo;
