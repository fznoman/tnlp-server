import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const BATS = [
  {
    top: height * 0.16,
    size: 20,
    duration: 9000,
    delay: 0,
  },
  {
    top: height * 0.30,
    size: 16,
    duration: 11000,
    delay: 1800,
  },
  {
    top: height * 0.52,
    size: 22,
    duration: 10000,
    delay: 3500,
  },
  {
    top: height * 0.70,
    size: 17,
    duration: 12000,
    delay: 2200,
  },
];

function FlyingBat({
  top,
  size,
  duration,
  delay,
}: {
  top: number;
  size: number;
  duration: number;
  delay: number;
}) {
  const translateX = useRef(
    new Animated.Value(-60)
  ).current;

  const translateY = useRef(
    new Animated.Value(0)
  ).current;

  const opacity = useRef(
    new Animated.Value(0)
  ).current;

  useEffect(() => {
    const startAnimation = () => {
      translateX.setValue(-60);
      translateY.setValue(0);
      opacity.setValue(0);

      Animated.sequence([
        Animated.delay(delay),

        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0.75,
            duration: 700,
            useNativeDriver: true,
          }),

          Animated.timing(translateX, {
            toValue: width + 60,
            duration,
            useNativeDriver: true,
          }),

          Animated.sequence([
            Animated.timing(translateY, {
              toValue: -25,
              duration: duration / 4,
              useNativeDriver: true,
            }),

            Animated.timing(translateY, {
              toValue: 20,
              duration: duration / 4,
              useNativeDriver: true,
            }),

            Animated.timing(translateY, {
              toValue: -15,
              duration: duration / 4,
              useNativeDriver: true,
            }),

            Animated.timing(translateY, {
              toValue: 0,
              duration: duration / 4,
              useNativeDriver: true,
            }),
          ]),
        ]),

        Animated.timing(opacity, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]).start(() => {
        startAnimation();
      });
    };

    startAnimation();

    return () => {
      translateX.stopAnimation();
      translateY.stopAnimation();
      opacity.stopAnimation();
    };
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.bat,
        {
          top,
          opacity,
          transform: [
            { translateX },
            { translateY },
          ],
        },
      ]}
    >
      <Text
        style={[
          styles.batText,
          {
            fontSize: size,
          },
        ]}
      >
        🦇
      </Text>
    </Animated.View>
  );
}

export default function FlyingBats() {
  return (
    <View
      pointerEvents="none"
      style={styles.container}
    >
      {BATS.map((bat, index) => (
        <FlyingBat
          key={index}
          top={bat.top}
          size={bat.size}
          duration={bat.duration}
          delay={bat.delay}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    pointerEvents: 'none',
  },

  bat: {
    position: 'absolute',
    left: 0,
    width: 50,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  batText: {
    color: '#ffffff',
  },
});