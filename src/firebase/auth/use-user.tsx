'use client';
import { useUser as useProviderUser, type UserHookResult } from '../provider';

/**
 * Hook to access the authenticated user's state.
 * Synchronized with the central FirebaseProvider for absolute session consistency.
 */
export function useUser(): UserHookResult {
  // Leverage the central provider result to ensure all components see the same auth shard.
  return useProviderUser();
}
