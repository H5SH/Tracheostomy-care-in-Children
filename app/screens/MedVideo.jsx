import React, { useState, useEffect, useMemo } from "react";
import { View, TouchableOpacity, Text, Dimensions } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { languages, defaultLanguage } from "../data/deases";
import { resolveVideoSource } from "../media/assetPackVideos";

const { height } = Dimensions.get("window");

function MedVideo({ route }) {
  const { name } = route.params;

  const [language, setLanguage] = useState(defaultLanguage);

  // Videos live in a Play Asset Delivery install-time pack, so this resolves to a
  // `file:///android_asset/...` URI that plays with no network access.
  const playingVideo = useMemo(
    () => resolveVideoSource(language.videos[name]),
    [language, name]
  );

  const player = useVideoPlayer(playingVideo, (player) => {
    player.loop = true;
    player.play();
  });

  useEffect(() => {
    if (playingVideo) {
      player.replace(playingVideo);
      player.play();
    } else {
      // Switching to a language that has no recording for this procedure — drop the
      // previous one so it does not keep playing behind the unavailable panel.
      player.pause();
      player.replace(null);
    }
  }, [playingVideo]);

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
      {playingVideo ? (
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
      ) : (
        <View
          style={{
            width: "100%",
            height: height * 0.72,
            backgroundColor: "black",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 30,
          }}
        >
          <Text
            style={{
              color: "#e5e7eb",
              fontSize: 16,
              textAlign: "center",
              lineHeight: 24,
            }}
          >
            {`This video is not available in ${language.label} yet.`}
          </Text>
        </View>
      )}

      {/* Controls */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          marginTop: 20,
        }}
      >
        {languages.map((item) => {
          const selected = item.key === language.key;
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => setLanguage(item)}
              style={{
                backgroundColor: selected ? "#2563eb" : "#e5e7eb",
                paddingVertical: 14,
                paddingHorizontal: 40,
                borderRadius: 12,
                marginHorizontal: 6,
                marginBottom: 8,
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Text
                style={{
                  color: selected ? "white" : "#111827",
                  fontWeight: "600",
                  fontSize: 16,
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default MedVideo;
