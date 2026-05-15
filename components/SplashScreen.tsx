import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [imageError, setImageError] = useState(false);
  const dotAnims = useRef(Array.from({ length: 3 }, () => new Animated.Value(1))).current;

  useEffect(() => {
    let isMounted = true;
    let dotsAnimation: Animated.CompositeAnimation | null = null;
    let logoAnimation: Animated.CompositeAnimation | null = null;
    let fadeAnimation: Animated.CompositeAnimation | null = null;
    let slideAnimation: Animated.CompositeAnimation | null = null;
    
    try {
      logoAnimation = Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]);

      fadeAnimation = Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true });

      slideAnimation = Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        delay: 200,
        useNativeDriver: true,
      });

      // Loading dots animation
      const dotSequence = [] as Animated.CompositeAnimation[];
      dotAnims.forEach((d) => {
        dotSequence.push(Animated.timing(d, { toValue: 1.5, duration: 400, useNativeDriver: true }));
        dotSequence.push(Animated.timing(d, { toValue: 1, duration: 400, useNativeDriver: true }));
      });
      dotsAnimation = Animated.loop(Animated.sequence(dotSequence));

      // Start animations
      Animated.parallel([logoAnimation, fadeAnimation, slideAnimation]).start();
      dotsAnimation.start();

      return () => {
        // cleanup
        logoAnimation?.stop();
        fadeAnimation?.stop();
        slideAnimation?.stop();
        dotsAnimation?.stop();
      };
    } catch (error) {
      console.error('Splash screen animation error:', error);
    }
  }, [fadeAnim, scaleAnim, slideAnim, dotAnims]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim }
            ],
          },
        ]}
      >
        <View style={styles.logoWrapper}>
          {!imageError ? (
            <Image
              source={require('../assets/images/splash-icon.png')}
              style={styles.logo}
              resizeMode="contain"
              onError={() => {
                console.error('❌ Failed to load logo image');
                setImageError(true);
              }}
            />
          ) : (
            <View style={[styles.logo, styles.placeholderLogo]}>
              <Text style={styles.placeholderText}>TP</Text>
            </View>
          )}
        </View>
        
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.brandName}>TechPhono</Text>
          <Text style={styles.tagline}>Expert Phone Repair Services</Text>
        </Animated.View>
      </Animated.View>
      
      <Animated.View
        style={[
          styles.loadingContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.loadingDots}>
          <Animated.View 
            style={[
              styles.dot, 
              { backgroundColor: '#3b82f6' },
              { transform: [{ scale: dotAnims[0] }] }
            ]} 
          />
          <Animated.View 
            style={[
              styles.dot, 
              { backgroundColor: '#10b981' },
              { transform: [{ scale: dotAnims[1] }] }
            ]} 
          />
          <Animated.View 
            style={[
              styles.dot, 
              { backgroundColor: '#f59e0b' },
              { transform: [{ scale: dotAnims[2] }] }
            ]} 
          />
        </View>
        <Text style={styles.loadingText}>Preparing your experience...</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  logoWrapper: {
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: {
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: 20,
  },
  textContainer: {
    alignItems: 'center',
  },
  brandName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: height * 0.15,
    alignItems: 'center',
    zIndex: 1,
  },
  loadingDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 15,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  loadingText: {
    fontSize: 14,
    color: '#9ca3af',
    letterSpacing: 0.5,
    fontStyle: 'italic',
  },
  placeholderLogo: {
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
