import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import Toast from 'react-native-toast-message';

export default function FunctionCategoriesScreen({ navigation,route  }) {
  const [categories, setCategories] = useState([
    {
      id: '1',
      name: 'Marriage',
      tamilName: 'திருமணம்',
      description: 'Marriage related functions',
    },
    {
      id: '2',
      name: 'Birthday',
      tamilName: 'பிறந்த நாள்',
      description: 'Birthday celebrations',
    },
  ]);

  useEffect(() => {
  if (route?.params?.category) {
    const { category, isEdit } = route.params;

    setCategories(prev => {
      if (isEdit) {
        return prev.map(item =>
          item.id === category.id ? category : item
        );
      }
      return [...prev, category];
    });

    navigation.setParams({ category: null, isEdit: null });
  }
}, [route?.params]);

 const handleDelete = item => {
  Alert.alert(
    'Delete Category',
    `Are you sure you want to delete "${item.name}"?`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setCategories(prev =>
            prev.filter(cat => cat.id !== item.id)
          );

          Toast.show({
            type: 'success',
            text1: 'Category deleted',
          });
        },
      },
    ]
  );
};


  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.textContainer}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.tamil}>{item.tamilName}</Text>
        <Text style={styles.desc}>{item.description}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.edit]}
          onPress={() => 
            navigation.navigate('FunctionCategoryForm', {
    category: item,
  })
          }
        >
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.delete]}
          onPress={() => handleDelete(item)}
        >
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('FunctionCategoryForm')}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
  },
  textContainer: {
    marginBottom: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tamil: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
  desc: {
    fontSize: 13,
    color: '#777',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  edit: {
    backgroundColor: '#1976D2',
  },
  delete: {
    backgroundColor: '#E53935',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 28,
  },
});
