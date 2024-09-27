import { TextInput, TextStyle } from 'react-native';
import Animated, { SharedValue, useAnimatedProps } from 'react-native-reanimated';

const AnimatedText = ({ sv, style }: { sv: SharedValue<number>, style?: TextStyle }) => {
  const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
  Animated.addWhitelistedNativeProps({text: true});

  const animatedProps = useAnimatedProps(() => {
    const txt = sv.value.toString()
    return {
      text: txt,
      defaultValue: txt,
    };
  });

  return (
    <AnimatedTextInput
      underlineColorAndroid='transparent'
      editable={false}
      style={style}
      animatedProps={animatedProps}
    />
  );
}

export default AnimatedText;