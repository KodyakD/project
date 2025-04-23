import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions, 
  Animated, 
  Platform,
} from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '../../constants/Colors';
import { useTheme } from '../../context/ThemeContext';
import { SafetyTip, getRandomSafetyTips } from '../../data/safetyTips';
import { 
  AlertTriangle, 
  Flame, 
  Heart, 
  LogOut, 
  Shield, 
  ChevronLeft, 
  ChevronRight 
} from '@expo/vector-icons/Feather';

interface SafetyTipsCarouselProps {
  numTipsToShow?: number;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showControls?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.8;
const CARD_MARGIN = 8;

export default function SafetyTipsCarousel({
  numTipsToShow = 5,
  autoPlay = true,
  autoPlayInterval = 5000,
  showControls = true,
}: SafetyTipsCarouselProps) {
  const { colors } = useTheme();
  const [tips, setTips] = useState<SafetyTip[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Fetch tips on mount
  useEffect(() => {
    setTips(getRandomSafetyTips(numTipsToShow));
  }, [numTipsToShow]);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || tips.length <= 1) return;
    
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % tips.length;
      scrollToIndex(nextIndex);
    }, autoPlayInterval);
    
    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, currentIndex, tips.length]);

  // Scroll to selected index
  const scrollToIndex = (index: number) => {
    if (!scrollViewRef.current) return;
    
    // Fade out
    Animated.timing(opacityAnim, {
      toValue: 0.7,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Scroll
      scrollViewRef.current?.scrollTo({
        x: index * (CARD_WIDTH + CARD_MARGIN * 2),
        animated: true,
      });
      
      setCurrentIndex(index);
      
      // Fade in
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  // Handle scroll event
  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + CARD_MARGIN * 2));
    
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  // Get category icon
  const getCategoryIcon = (category: SafetyTip['category'], size: number = 24) => {
    switch (category) {
      case 'fire':
        return <Flame size={size} color={colors.error} />;
      case 'emergency':
        return <AlertTriangle size={size} color={colors.warning} />;
      case 'first_aid':
        return <Heart size={size} color={colors.error} />;
      case 'evacuation':
        return <LogOut size={size} color={colors.info} />;
      case 'prevention':
        return <Shield size={size} color={colors.success} />;
      default:
        return <AlertTriangle size={size} color={colors.warning} />;
    }
  };

  // Navigate to previous tip
  const goToPrevious = () => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    } else {
      scrollToIndex(tips.length - 1); // Loop to the end
    }
  };

  // Navigate to next tip
  const goToNext = () => {
    if (currentIndex < tips.length - 1) {
      scrollToIndex(currentIndex + 1);
    } else {
      scrollToIndex(0); // Loop to the start
    }
  };

  // Render pagination dots
  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {tips.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index === currentIndex ? colors.primary : colors.border,
                width: index === currentIndex ? 24 : 8,
              },
            ]}
            onPress={() => scrollToIndex(index)}
          />
        ))}
      </View>
    );
  };

  if (tips.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Safety Tips
      </Text>

      <View style={styles.carouselContainer}>
        {showControls && tips.length > 1 && (
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: colors.card, left: 0 }]}
            onPress={goToPrevious}
          >
            <ChevronLeft size={20} color={colors.text} />
          </TouchableOpacity>
        )}

        <Animated.View style={{ opacity: opacityAnim, flex: 1 }}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            contentContainerStyle={styles.scrollViewContent}
            snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
            decelerationRate="fast"
          >
            {tips.map((tip, index) => (
              <View
                key={tip.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    width: CARD_WIDTH,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  {getCategoryIcon(tip.category, 20)}
                  <Text
                    style={[styles.cardCategory, { color: colors.textSecondary }]}
                  >
                    {tip.category.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>

                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {tip.title}
                </Text>

                <Text style={[styles.cardContent, { color: colors.textSecondary }]}>
                  {tip.content}
                </Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {showControls && tips.length > 1 && (
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: colors.card, right: 0 }]}
            onPress={goToNext}
          >
            <ChevronRight size={20} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      {tips.length > 1 && renderDots()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  carouselContainer: {
    position: 'relative',
    height: 180,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollViewContent: {
    paddingHorizontal: 8,
  },
  card: {
    marginHorizontal: CARD_MARGIN,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    height: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardCategory: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    height: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
}); 