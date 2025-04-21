import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Dimensions, 
  FlatList, 
  TouchableOpacity, 
  useColorScheme 
} from 'react-native';
import { AlertCircle, ArrowRight, Info } from '@expo/vector-icons/Feather';
import Colors from '@/constants/Colors';

const { width } = Dimensions.get('window');

interface SafetyTip {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'fire' | 'emergency';
}

interface SafetyTipsCarouselProps {
  tips: SafetyTip[];
  onViewMorePress?: () => void;
}

// Default safety tips
const DEFAULT_TIPS: SafetyTip[] = [
  {
    id: '1',
    title: 'Know Your Exits',
    content: 'Always be aware of the nearest emergency exits in any building you enter.',
    type: 'general',
  },
  {
    id: '2',
    title: 'Fire Extinguisher Use',
    content: 'Remember PASS: Pull, Aim, Squeeze, Sweep when using a fire extinguisher.',
    type: 'fire',
  },
  {
    id: '3',
    title: 'Stay Low During Fire',
    content: 'If caught in smoke, get low and crawl to the nearest exit to avoid smoke inhalation.',
    type: 'fire',
  },
  {
    id: '4',
    title: 'Emergency Contacts',
    content: 'Save emergency contacts in your phone and memorize important numbers.',
    type: 'emergency',
  },
];

export const SafetyTipsCarousel: React.FC<SafetyTipsCarouselProps> = ({ 
  tips = DEFAULT_TIPS, 
  onViewMorePress 
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const renderTip = ({ item, index }: { item: SafetyTip; index: number }) => {
    const getIconForType = () => {
      switch(item.type) {
        case 'fire':
          return <AlertCircle size={24} color="#EF4444" />;
        case 'emergency':
          return <AlertCircle size={24} color="#F97316" />;
        default:
          return <Info size={24} color="#3B82F6" />;
      }
    };

    return (
      <View 
        style={[
          styles.tipCard, 
          { 
            backgroundColor: colors.card, 
            borderColor: colors.border,
            width: width - 48,
          }
        ]}
      >
        <View style={styles.tipHeader}>
          {getIconForType()}
          <Text 
            style={[
              styles.tipTitle, 
              { color: colors.text }
            ]}
          >
            {item.title}
          </Text>
        </View>
        <Text style={[styles.tipContent, { color: colors.textSecondary }]}>
          {item.content}
        </Text>
      </View>
    );
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Safety Tips</Text>
        <TouchableOpacity 
          style={styles.viewMoreButton} 
          onPress={onViewMorePress}
        >
          <Text style={[styles.viewMoreText, { color: colors.primary }]}>
            View More
          </Text>
          <ArrowRight size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={tips}
        renderItem={renderTip}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        decelerationRate="fast"
        snapToInterval={width - 32}
        snapToAlignment="center"
        contentContainerStyle={styles.listContent}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      <View style={styles.paginationContainer}>
        {tips.map((_, index) => (
          <View 
            key={index} 
            style={[
              styles.paginationDot, 
              index === currentIndex && styles.paginationDotActive,
              { 
                backgroundColor: index === currentIndex 
                  ? colors.primary 
                  : colors.border 
              }
            ]} 
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewMoreText: {
    fontSize: 14,
    marginRight: 4,
  },
  listContent: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  tipCard: {
    borderRadius: 12,
    padding: 16,
    marginRight: 8,
    borderWidth: 1,
    elevation: 1,
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tipContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 12,
    height: 8,
  },
});