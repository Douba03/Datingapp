import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle, Easing } from 'react-native';

type AnimationType = 'bounce' | 'pulse' | 'float' | 'spin' | 'shake' | 'heartbeat' | 'sparkle' | 'wave';

interface AnimatedEmojiProps {
  emoji: string;
  size?: number;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  loop?: boolean;
  style?: ViewStyle;
}

export function AnimatedEmoji({
  emoji,
  size = 40,
  animation = 'bounce',
  delay = 0,
  duration = 1000,
  loop = true,
  style,
}: AnimatedEmojiProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const startAnimation = () => {
      switch (animation) {
        case 'bounce':
          Animated.loop(
            Animated.sequence([
              Animated.timing(animatedValue, {
                toValue: -15,
                duration: duration / 2,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
                delay,
              }),
              Animated.timing(animatedValue, {
                toValue: 0,
                duration: duration / 2,
                easing: Easing.bounce,
                useNativeDriver: true,
              }),
            ]),
            { iterations: loop ? -1 : 1 }
          ).start();
          break;

        case 'pulse':
          Animated.loop(
            Animated.sequence([
              Animated.timing(scaleValue, {
                toValue: 1.3,
                duration: duration / 2,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
                delay,
              }),
              Animated.timing(scaleValue, {
                toValue: 1,
                duration: duration / 2,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
            ]),
            { iterations: loop ? -1 : 1 }
          ).start();
          break;

        case 'float':
          Animated.loop(
            Animated.parallel([
              Animated.sequence([
                Animated.timing(animatedValue, {
                  toValue: -10,
                  duration: duration,
                  easing: Easing.inOut(Easing.sin),
                  useNativeDriver: true,
                  delay,
                }),
                Animated.timing(animatedValue, {
                  toValue: 10,
                  duration: duration,
                  easing: Easing.inOut(Easing.sin),
                  useNativeDriver: true,
                }),
              ]),
              Animated.sequence([
                Animated.timing(scaleValue, {
                  toValue: 1.1,
                  duration: duration,
                  easing: Easing.inOut(Easing.sin),
                  useNativeDriver: true,
                }),
                Animated.timing(scaleValue, {
                  toValue: 1,
                  duration: duration,
                  easing: Easing.inOut(Easing.sin),
                  useNativeDriver: true,
                }),
              ]),
            ]),
            { iterations: loop ? -1 : 1 }
          ).start();
          break;

        case 'spin':
          Animated.loop(
            Animated.timing(rotateValue, {
              toValue: 1,
              duration: duration,
              easing: Easing.linear,
              useNativeDriver: true,
              delay,
            }),
            { iterations: loop ? -1 : 1 }
          ).start();
          break;

        case 'shake':
          Animated.loop(
            Animated.sequence([
              Animated.timing(rotateValue, {
                toValue: 0.05,
                duration: duration / 8,
                easing: Easing.linear,
                useNativeDriver: true,
                delay,
              }),
              Animated.timing(rotateValue, {
                toValue: -0.05,
                duration: duration / 4,
                easing: Easing.linear,
                useNativeDriver: true,
              }),
              Animated.timing(rotateValue, {
                toValue: 0.05,
                duration: duration / 4,
                easing: Easing.linear,
                useNativeDriver: true,
              }),
              Animated.timing(rotateValue, {
                toValue: 0,
                duration: duration / 8,
                easing: Easing.linear,
                useNativeDriver: true,
              }),
              Animated.delay(duration / 2),
            ]),
            { iterations: loop ? -1 : 1 }
          ).start();
          break;

        case 'heartbeat':
          Animated.loop(
            Animated.sequence([
              Animated.timing(scaleValue, {
                toValue: 1.2,
                duration: duration * 0.1,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
                delay,
              }),
              Animated.timing(scaleValue, {
                toValue: 1,
                duration: duration * 0.1,
                easing: Easing.in(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(scaleValue, {
                toValue: 1.3,
                duration: duration * 0.15,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(scaleValue, {
                toValue: 1,
                duration: duration * 0.2,
                easing: Easing.in(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.delay(duration * 0.45),
            ]),
            { iterations: loop ? -1 : 1 }
          ).start();
          break;

        case 'sparkle':
          Animated.loop(
            Animated.parallel([
              Animated.sequence([
                Animated.timing(scaleValue, {
                  toValue: 1.4,
                  duration: duration / 3,
                  easing: Easing.out(Easing.elastic(1)),
                  useNativeDriver: true,
                  delay,
                }),
                Animated.timing(scaleValue, {
                  toValue: 1,
                  duration: duration / 3,
                  easing: Easing.in(Easing.elastic(1)),
                  useNativeDriver: true,
                }),
                Animated.delay(duration / 3),
              ]),
              Animated.sequence([
                Animated.timing(opacityValue, {
                  toValue: 0.6,
                  duration: duration / 3,
                  useNativeDriver: true,
                }),
                Animated.timing(opacityValue, {
                  toValue: 1,
                  duration: duration / 3,
                  useNativeDriver: true,
                }),
                Animated.delay(duration / 3),
              ]),
              Animated.timing(rotateValue, {
                toValue: 0.1,
                duration: duration,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
            ]),
            { iterations: loop ? -1 : 1 }
          ).start();
          break;

        case 'wave':
          Animated.loop(
            Animated.sequence([
              Animated.timing(rotateValue, {
                toValue: 0.2,
                duration: duration / 4,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
                delay,
              }),
              Animated.timing(rotateValue, {
                toValue: -0.15,
                duration: duration / 4,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(rotateValue, {
                toValue: 0.1,
                duration: duration / 4,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(rotateValue, {
                toValue: 0,
                duration: duration / 4,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
            ]),
            { iterations: loop ? -1 : 1 }
          ).start();
          break;
      }
    };

    startAnimation();

    return () => {
      animatedValue.stopAnimation();
      scaleValue.stopAnimation();
      rotateValue.stopAnimation();
      opacityValue.stopAnimation();
    };
  }, [animation, delay, duration, loop]);

  const rotateInterpolate = rotateValue.interpolate({
    inputRange: animation === 'spin' ? [0, 1] : [-1, 1],
    outputRange: animation === 'spin' ? ['0deg', '360deg'] : ['-360deg', '360deg'],
  });

  return (
    <Animated.Text
      style={[
        styles.emoji,
        {
          fontSize: size,
          transform: [
            { translateY: animatedValue },
            { scale: scaleValue },
            { rotate: rotateInterpolate },
          ],
          opacity: opacityValue,
        },
        style,
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

// Floating hearts component for backgrounds
interface FloatingHeartsProps {
  count?: number;
  colors?: string[];
}

export function FloatingHearts({ count = 8 }: FloatingHeartsProps) {
  const hearts = ['💕', '❤️', '💖', '💗', '💝', '✨', '💜', '🌸'];
  const animations: AnimationType[] = ['float', 'pulse', 'heartbeat', 'sparkle'];
  
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <AnimatedEmoji
          key={index}
          emoji={hearts[index % hearts.length]}
          animation={animations[index % animations.length]}
          size={20 + Math.random() * 25}
          delay={index * 200}
          duration={2000 + Math.random() * 1000}
          style={{
            position: 'absolute',
            top: `${10 + (index * 12) % 80}%`,
            left: `${5 + (index * 15) % 85}%`,
            opacity: 0.15 + Math.random() * 0.15,
          }}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  emoji: {
    textAlign: 'center',
  },
});

export default AnimatedEmoji;




