import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Text, Dimensions } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { English, Urdu, Punjabi } from "../data/deases";

const { height } = Dimensions.get("window");

function MedVideo({ route }) {
  const { name } = route.params;

  const [playingVideo, setPlayingVideo] = useState(English[name]);

  const player = useVideoPlayer(playingVideo, (player) => {
    player.loop = true;
    player.play();
  });

  useEffect(() => {
    if (playingVideo) {
      player.replace(playingVideo);
      player.play();
    }
  }, [playingVideo]);

  const EnglishVideoHandler = () => {
    const video = English[name];
    if (video) setPlayingVideo(video);
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#ffffff",
      }}
    >
      {/* Title */}
      <Text
        style={{
          fontSize: 20,
          fontWeight: "600",
          textAlign: "center",
          marginTop: 10,
          marginBottom: 10,
          color: "#111827",
        }}
      >
        {name}
      </Text>

      {/* Large Video Area */}
      <VideoView
        player={player}
        style={{
          width: "100%",
          height: height * 0.72, // takes most of the screen
          backgroundColor: "black",
        }}
        allowsFullscreen
        allowsPictureInPicture
      />

      {/* Controls */}
      <View
        style={{
          alignItems: "center",
          marginTop: 20,
        }}
      >
        <TouchableOpacity
          onPress={EnglishVideoHandler}
          style={{
            backgroundColor: "#2563eb",
            paddingVertical: 14,
            paddingHorizontal: 40,
            borderRadius: 12,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Text
            style={{
              color: "white",
              fontWeight: "600",
              fontSize: 16,
            }}
          >
            English
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default MedVideo;
