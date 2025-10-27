import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { colors } from '../theme/colors';

interface AIIcebreaker {
  id: string;
  text: string;
  category: string;
}

interface AIIcebreakersProps {
  icebreakers: AIIcebreaker[];
  onSelect: (icebreaker: AIIcebreaker) => void;
  onGenerateNew: () => void;
  loading?: boolean;
}

export function AIIcebreakers({
  icebreakers,
  onSelect,
  onGenerateNew,
  loading = false,
}: AIIcebreakersProps) {
  const renderIcebreaker = ({ item }: { item: AIIcebreaker }) => (
    <TouchableOpacity
      style={styles.icebreakerItem}
      onPress={() => onSelect(item)}
    >
      <Text style={styles.icebreakerText}>{item.text}</Text>
      <Text style={styles.categoryText}>{item.category}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Icebreakers</Text>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={onGenerateNew}
          disabled={loading}
        >
          <Text style={styles.generateButtonText}>
            {loading ? 'Generating...' : 'Generate New'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={icebreakers}
        renderItem={renderIcebreaker}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  generateButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  icebreakerItem: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
    maxWidth: 200,
  },
  icebreakerText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});