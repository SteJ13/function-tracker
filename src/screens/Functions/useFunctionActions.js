import { useCallback } from 'react';
import useOfflineExecutor from '@hooks/useOfflineExecutor';
import { addFunction, updateFunction, deleteFunction } from './api';

export default function useFunctionActions() {
  const { executeOfflineAction } = useOfflineExecutor();

  // Create
  const createFunction = useCallback(
    data =>
      executeOfflineAction({
        action: 'create',
        table: 'functions',
        payload: data,
        apiCall: (payload, userId) => addFunction(payload, userId),
      }),
    [executeOfflineAction]
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
    [executeOfflineAction]
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
    [executeOfflineAction]
  );

  return {
    createFunction,
    updateFunction: updateFunctionAction,
    deleteFunction: deleteFunctionAction,
  };
}
