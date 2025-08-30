import { TouchableOpacity, Image, Text, View, Animated } from 'react-native';
import { stylesCard } from './style';
import { useEffect, useRef, useState } from 'react';
import loading from '../../../assets/loading2.png'

const ImageSquareCard = ({ onPress, source, loadingImg = loading, alt = "Image", Title, animationDuration = 1500, stylesText, stylesImg }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current

  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    Animated.timing(
      fadeAnim,
      {
        toValue: 1,
        duration: animationDuration,
        useNativeDriver: true
      }
    ).start()
  }, [fadeAnim])

  return (
    <TouchableOpacity
      style={stylesCard.touchContainer}
      onPress={onPress}
    >
      <Animated.View style={{ opacity: fadeAnim }}>
        <Image
          source={loaded ? source: loadingImg}
          style={{ ...stylesCard.image, ...stylesImg }}
          alt={alt}
          onLoad={()=> setLoaded(true)}
        />
        <Text numberOfLines={1} style={{ ...stylesCard.text, ...stylesText }}  >{Title}</Text>
      </Animated.View>

    </TouchableOpacity>
  )
}

export { ImageSquareCard }