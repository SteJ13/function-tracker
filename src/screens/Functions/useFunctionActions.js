import { useCallback } from 'react';
import { executeOfflineAction } from '@services/offlineExecutor';
import { addFunction, updateFunction, deleteFunction } from './api';

export default function useFunctionActions() {
  // Create
  const createFunction = useCallback(
    data =>
      executeOfflineAction({
        action: 'create',
        table: 'functions',
        payload: data,
        apiCall: (payload, userId) => addFunction(payload, userId),
      }),
    []
  );

  // Update
  const updateFunctionAction = useCallback(
    (id, updates) =>
      executeOfflineAction({
        action: 'update',
        table: 'functions',
        payload: { id, updates },
        apiCall: (payload, userId) => updateFunction(payload.id, payload.updates, userId),
      }),
    []
  );

  // Delete
  const deleteFunctionAction = useCallback(
    id =>
      executeOfflineAction({
        action: 'delete',
        table: 'functions',
        payload: { id },
        apiCall: payload => deleteFunction(payload.id),
      }),
    []
  );

  return {
    createFunction,
    updateFunction: updateFunctionAction,
    deleteFunction: deleteFunctionAction,
  };
}
