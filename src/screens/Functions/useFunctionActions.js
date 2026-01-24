import { useCallback } from 'react';
import { useAuth } from '@context/AuthContext';
import { useNetwork } from '@context/NetworkContext';
import { addToQueue } from '@services/offlineQueue';
import { addFunction, updateFunction, deleteFunction } from './api';

// Simple temp id for optimistic items
const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function useFunctionActions() {
  const { user } = useAuth();
  const { isOnline } = useNetwork();

  // Create
  const createFunction = useCallback(
    async data => {
      if (isOnline) {
        return addFunction(data, user?.id);
      }

      const tempId = generateTempId();
      const pendingItem = { ...data, id: tempId, _pending: true };

      await addToQueue({
        id: tempId,
        action: 'create',
        table: 'functions',
        payload: { ...data, id: tempId, user_id: user?.id },
        timestamp: Date.now(),
      });

      return pendingItem;
    },
    [isOnline, user]
  );

  // Update
  const updateFunctionAction = useCallback(
    async (id, updates) => {
      if (isOnline) {
        return updateFunction(id, updates, user?.id);
      }

      const pendingUpdate = { ...updates, id, _pending: true };

      await addToQueue({
        id: generateTempId(),
        action: 'update',
        table: 'functions',
        payload: { id, updates: { ...updates, updated_by: user?.id } },
        timestamp: Date.now(),
      });

      return pendingUpdate;
    },
    [isOnline, user]
  );

  // Delete
  const deleteFunctionAction = useCallback(
    async id => {
      if (isOnline) {
        return deleteFunction(id);
      }

      await addToQueue({
        id: generateTempId(),
        action: 'delete',
        table: 'functions',
        payload: { id },
        timestamp: Date.now(),
      });

      return true;
    },
    [isOnline]
  );

  return {
    createFunction,
    updateFunction: updateFunctionAction,
    deleteFunction: deleteFunctionAction,
  };
}
