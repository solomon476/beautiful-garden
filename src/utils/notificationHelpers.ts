/**
 * Helper to extract specific entity IDs (like memory IDs) from notifications
 * so tapping a notification navigates directly to the referenced moment.
 */
export function extractMemoryIdFromNotification(notif?: { type?: string; entityId?: string } | null): string | null {
  if (!notif || notif.type !== 'memory' || !notif.entityId) return null;
  
  if (notif.entityId.startsWith('like-')) {
    const parts = notif.entityId.split('-');
    // format: like-<memoryId>-<userId>-<timestamp>
    return parts[1] || notif.entityId;
  }
  
  return notif.entityId;
}
