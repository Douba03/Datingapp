import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GIF_SIZE = (SCREEN_WIDTH - 24) / 3;
// Match iOS keyboard height (~300px on most devices)
export const PICKER_HEIGHT = 300;

// GIPHY API Key
const GIPHY_API_KEY = 'GlVGYHkr3WSBnllca54iNt0yFbjz7L65';

// GIF Categories
const GIF_CATEGORIES = [
  { key: 'trending', label: 'Trending' },
  { key: 'reactions', label: 'Reactions' },
  { key: 'love', label: 'Love' },
  { key: 'happy', label: 'Happy' },
  { key: 'sad', label: 'Sad' },
  { key: 'yes', label: 'Yes' },
  { key: 'no', label: 'No' },
  { key: 'dance', label: 'Dance' },
];

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
  onClose: () => void;
}

interface GiphyGif {
  id: string;
  images: {
    fixed_width_small: {
      url: string;
    };
    original: {
      url: string;
    };
  };
}

export function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const { colors, isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('trending');

  useEffect(() => {
    fetchGifs(activeCategory);
  }, [activeCategory]);

  const fetchGifs = async (query: string) => {
    try {
      setLoading(true);
      const endpoint = query === 'trending' 
        ? `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=30&rating=pg-13`
        : `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=30&rating=pg-13`;
      
      const response = await fetch(endpoint);
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      console.error('[GifPicker] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      fetchGifs(activeCategory);
      return;
    }
    
    const timer = setTimeout(() => {
      fetchGifs(searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCategoryPress = (category: string) => {
    setSearchQuery('');
    setActiveCategory(category);
  };

  const handleSelectGif = (gif: GiphyGif) => {
    onSelect(gif.images.original.url);
  };

  const renderGif = ({ item }: { item: GiphyGif }) => (
    <TouchableOpacity
      style={styles.gifItem}
      onPress={() => handleSelectGif(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.images.fixed_width_small.url }}
        style={styles.gifImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Handle bar */}
      <View style={styles.handleContainer}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
      </View>

      {/* Search Bar as Header */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: isDarkMode ? colors.background : '#F3F4F6' }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search GIFs & Stickers"
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {GIF_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.categoryTab,
              activeCategory === cat.key && { backgroundColor: colors.primary },
              activeCategory !== cat.key && { backgroundColor: isDarkMode ? colors.background : '#F3F4F6' }
            ]}
            onPress={() => handleCategoryPress(cat.key)}
          >
            <Text style={[
              styles.categoryText,
              { color: activeCategory === cat.key ? '#fff' : colors.textSecondary }
            ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* GIF Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={gifs}
          keyExtractor={(item) => item.id}
          renderItem={renderGif}
          numColumns={3}
          contentContainerStyle={styles.gifGrid}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No GIFs found
              </Text>
            </View>
          )}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: PICKER_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 38,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  closeButton: {
    padding: 4,
  },
  categoriesContainer: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 8,
  },
  categoriesContent: {
    paddingHorizontal: 12,
  },
  categoryTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gifGrid: {
    padding: 8,
    paddingBottom: 20,
  },
  gifItem: {
    width: GIF_SIZE,
    height: GIF_SIZE,
    margin: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gifImage: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 14,
  },
});
