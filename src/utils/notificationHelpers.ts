/**
 * Helper to extract specific entity IDs (like memory or song IDs) from notifications
 * so tapping a notification navigates directly to the referenced moment or song.
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

export function extractSongIdFromNotification(notif?: { type?: string; entityId?: string } | null): string | null {
  if (!notif || notif.type !== 'song' || !notif.entityId) return null;
  
  if (notif.entityId.startsWith('song-like-') || notif.entityId.startsWith('like-')) {
    const parts = notif.entityId.split('-');
    return parts[1] || notif.entityId;
  }
  
  return notif.entityId;
}

