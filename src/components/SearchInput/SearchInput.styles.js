import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 42,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
  },
  clearButton: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
  },
});
