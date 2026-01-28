import { useCallback } from 'react';
import { useAuth } from '@context/AuthContext';
import { useNetwork } from '@context/NetworkContext';
import Toast from 'react-native-toast-message';
import { addFunction, updateFunction, deleteFunction } from './api';
import { scheduleFunctionReminder, cancelFunctionReminder } from '@services/notifications';

/**
 * Hook that provides CRUD actions for functions
 * - Calls API directly (no offline write)
 * - Returns error if offline (read-only mode)
 */
export default function useFunctionActions() {
  const { user } = useAuth();
  const { isOnline } = useNetwork();

  // Create
  const createFunction = useCallback(
    async (payload) => {
      if (!isOnline) {
        throw new Error('Add, Edit and Delete are disabled while offline.');
      }
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      console.log('[useFunctionActions] createFunction payload:', payload);
      
      // Call API
      const createdFunction = await addFunction(payload, user.id);
      
      // Schedule reminder after successful creation
      if (createdFunction && createdFunction.id) {
        console.log('createdFunction: ', createdFunction);
        try {
          // Merge payload reminder_minutes with API response
          const reminderData = {
            ...createdFunction,
            reminder_minutes: payload.reminder_minutes || 1440 // Fallback to 1 day default
          };
          console.log('[useFunctionActions] Scheduling reminder with:', reminderData);
          await scheduleFunctionReminder(reminderData);
        } catch (error) {
          console.error('[useFunctionActions] Failed to schedule reminder:', error);
          // Don't throw - notification scheduling failure shouldn't fail the whole operation
        }
      }
      
      return createdFunction;
    },
    [user, isOnline]
  );

  // Update
  const updateFunctionAction = useCallback(
    async (id, updates) => {
      if (!isOnline) {
        throw new Error('Add, Edit and Delete are disabled while offline.');
      }
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      // Cancel existing reminder first
      try {
        await cancelFunctionReminder(id);
      } catch (error) {
        console.error('[useFunctionActions] Failed to cancel existing reminder:', error);
      }
      
      // Call API
      const updatedFunction = await updateFunction(id, updates, user.id);
      
      // Schedule new reminder after successful update
      if (updatedFunction && updatedFunction.id) {
        try {
          // Merge updates reminder_minutes with API response
          await scheduleFunctionReminder({...updatedFunction, reminder_minutes: updates.reminder_minutes});
        } catch (error) {
          console.error('[useFunctionActions] Failed to schedule reminder:', error);
          // Don't throw - notification scheduling failure shouldn't fail the whole operation
        }
      }
      
      return updatedFunction;
    },
    [user, isOnline]
  );

  // Delete
  const deleteFunctionAction = useCallback(
    async (id) => {
      if (!isOnline) {
        throw new Error('Add, Edit and Delete are disabled while offline.');
      }
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      // Cancel reminder before deleting
      try {
        await cancelFunctionReminder(id);
      } catch (error) {
        console.error('[useFunctionActions] Failed to cancel reminder:', error);
      }
      
      return deleteFunction(id, user.id);
    },
    [user, isOnline]
  );

  return {
    createFunction,
    updateFunction: updateFunctionAction,
    deleteFunction: deleteFunctionAction,
  };
}
