import {
  authService,
  notesService,
  timeCapsuleService,
  DEFAULT_PROFILES,
} from '../services/gardenService';

export interface PrivacyTestResult {
  name: string;
  passed: boolean;
  details: string;
}

export async function runPrivacyAndSecurityAudit(): Promise<PrivacyTestResult[]> {
  const results: PrivacyTestResult[] = [];
  const originalUser = authService.getCurrentUser();

  try {
    // -------------------------------------------------------------
    // Test 1: Private Notes Isolation
    // -------------------------------------------------------------
    // Set active user as Solomon
    authService.setCurrentUser(DEFAULT_PROFILES.solomon);
    const testPrivateTitle = `Solomon Private Note ${Date.now()}`;
    const testPrivateBody = 'This is a strictly private thought by Solomon.';
    const createdNote = await notesService.saveNote({
      title: testPrivateTitle,
      body: testPrivateBody,
      isShared: false,
    });

    // Switch to Noella
    authService.setCurrentUser(DEFAULT_PROFILES.noella);
    const noellaNotes = await notesService.getNotes();
    const canNoellaSeePrivateNote = noellaNotes.some((n) => n.id === createdNote.id);

    results.push({
      name: 'Private Note Isolation (RLS)',
      passed: !canNoellaSeePrivateNote,
      details: !canNoellaSeePrivateNote
        ? 'PASSED: Private note written by Solomon is completely inaccessible to Noella.'
        : 'FAILED: Noella was able to query Solomon’s private note.',
    });

    // -------------------------------------------------------------
    // Test 2: Deliberate Sharing Verification
    // -------------------------------------------------------------
    // Solomon deliberately shares a note
    authService.setCurrentUser(DEFAULT_PROFILES.solomon);
    const testSharedTitle = `Solomon Shared Note ${Date.now()}`;
    const createdSharedNote = await notesService.saveNote({
      title: testSharedTitle,
      body: 'This is a shared letter to Noella.',
      isShared: true,
    });

    // Switch to Noella
    authService.setCurrentUser(DEFAULT_PROFILES.noella);
    const noellaNotesAfterShare = await notesService.getNotes();
    const canNoellaSeeSharedNote = noellaNotesAfterShare.some((n) => n.id === createdSharedNote.id);

    results.push({
      name: 'Deliberate Note Sharing',
      passed: canNoellaSeeSharedNote,
      details: canNoellaSeeSharedNote
        ? 'PASSED: Deliberately shared note is visible to the recipient.'
        : 'FAILED: Recipient cannot see the shared note.',
    });

    // -------------------------------------------------------------
    // Test 3: Unauthorized Modification Protection
    // -------------------------------------------------------------
    // Noella attempts to delete Solomon's note
    let modificationBlocked = false;
    try {
      await notesService.deleteNote(createdSharedNote.id);
    } catch {
      modificationBlocked = true;
    }

    results.push({
      name: 'Unauthorized Modification Prevention',
      passed: modificationBlocked,
      details: modificationBlocked
        ? 'PASSED: Recipient cannot delete or modify the author’s entry.'
        : 'FAILED: Recipient was permitted to delete an author’s entry.',
    });

    // -------------------------------------------------------------
    // Test 4: Time Capsule Future Release Protection
    // -------------------------------------------------------------
    // Solomon creates a future time capsule scheduled 7 days from now
    authService.setCurrentUser(DEFAULT_PROFILES.solomon);
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const secretContent = 'SUPER_SECRET_FUTURE_MESSAGE_2026';
    const capsule = await timeCapsuleService.createCapsule({
      title: 'Solomon’s Future Letter',
      body: secretContent,
      releaseAt: futureDate,
      isShared: true,
    });

    // Switch to Noella to check if the secret content is visible
    authService.setCurrentUser(DEFAULT_PROFILES.noella);
    const noellaCapsules = await timeCapsuleService.getCapsules();
    const noellaView = noellaCapsules.find((c) => c.id === capsule.id);

    const isBodyProtected = !noellaView || noellaView.body !== secretContent;

    results.push({
      name: 'Time Capsule Server-Enforced Release Date',
      passed: isBodyProtected,
      details: isBodyProtected
        ? 'PASSED: Future time capsule content is locked and concealed from recipient prior to release date.'
        : 'FAILED: Future time capsule content was exposed before release date.',
    });

    // Cleanup test artifacts
    authService.setCurrentUser(DEFAULT_PROFILES.solomon);
    await notesService.deleteNote(createdNote.id);
    await notesService.deleteNote(createdSharedNote.id);
    await timeCapsuleService.deleteCapsule(capsule.id);
  } finally {
    // Restore original user
    authService.setCurrentUser(originalUser);
  }

  return results;
}
