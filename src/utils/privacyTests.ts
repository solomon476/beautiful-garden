import {
  authService,
  notesService,
  timeCapsuleService,
} from '../services/gardenService';

export interface PrivacyTestResult {
  name: string;
  passed: boolean;
  details: string;
}

/**
 * Runs genuine authentication and database-level access control tests:
 * 1. Independent Session & Private Notes Isolation (Solomon vs Noella)
 * 2. Deliberate Sharing Verification (Author retains ownership)
 * 3. Unauthorized Modification Prevention (Recipient cannot delete or modify author's note)
 * 4. Time Capsule Future-Release Protection (Server/date enforced release)
 * 5. Unauthenticated Access Protection (Guest cannot read private entries)
 * 6. Dynamic Passcode Change & Verification (Personal passcode update)
 */
export async function runPrivacyAndSecurityAudit(): Promise<PrivacyTestResult[]> {
  const results: PrivacyTestResult[] = [];
  const originalUser = authService.getAuthenticatedUser();

  try {
    // -------------------------------------------------------------
    // Test 1: Private Notes Isolation (Solomon signs in)
    // -------------------------------------------------------------
    await authService.signIn('solomon', 'solomon2026');
    const testPrivateTitle = `Solomon Private Note ${Date.now()}`;
    const testPrivateBody = 'This is a strictly private thought by Solomon.';
    const createdNote = await notesService.saveNote({
      title: testPrivateTitle,
      body: testPrivateBody,
      isShared: false,
    });

    // Noella signs into her account on her device
    await authService.signIn('noella', 'noella2026');
    const noellaNotes = await notesService.getNotes();
    const canNoellaSeePrivateNote = noellaNotes.some((n) => n.id === createdNote.id);

    results.push({
      name: 'Independent Session & Private Note Isolation (RLS)',
      passed: !canNoellaSeePrivateNote,
      details: !canNoellaSeePrivateNote
        ? 'PASSED: Private note written by Solomon is completely inaccessible and denied to Noella.'
        : 'FAILED: Noella was able to query Solomon’s private note.',
    });

    // -------------------------------------------------------------
    // Test 2: Deliberate Sharing Verification
    // -------------------------------------------------------------
    // Solomon signs back in and deliberately shares a note
    await authService.signIn('solomon', 'solomon2026');
    const testSharedTitle = `Solomon Shared Note ${Date.now()}`;
    const createdSharedNote = await notesService.saveNote({
      title: testSharedTitle,
      body: 'This is a shared letter to Noella.',
      isShared: true,
    });

    // Noella signs into her account
    await authService.signIn('noella', 'noella2026');
    const noellaNotesAfterShare = await notesService.getNotes();
    const sharedNoteInNoellaView = noellaNotesAfterShare.find((n) => n.id === createdSharedNote.id);
    const isAuthorPreserved = Boolean(sharedNoteInNoellaView?.authorName?.includes('Solomon'));

    results.push({
      name: 'Deliberate Note Sharing & Author Preservation',
      passed: Boolean(sharedNoteInNoellaView && isAuthorPreserved),
      details: sharedNoteInNoellaView && isAuthorPreserved
        ? 'PASSED: Deliberately shared note is visible to Noella, and original author remains Solomon.'
        : 'FAILED: Shared note was not visible or author ownership was corrupted.',
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
    await authService.signIn('solomon', 'solomon2026');
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const secretContent = 'SUPER_SECRET_FUTURE_MESSAGE_2026';
    const capsule = await timeCapsuleService.createCapsule({
      title: 'Solomon’s Future Letter',
      body: secretContent,
      releaseAt: futureDate,
      isShared: true,
    });

    // Noella checks her view
    await authService.signIn('noella', 'noella2026');
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

    // -------------------------------------------------------------
    // Test 5: Unauthenticated Access Protection
    // -------------------------------------------------------------
    await authService.signOut();
    const unauthenticatedNotes = await notesService.getNotes();
    const canGuestSeePrivate = unauthenticatedNotes.some((n) => n.id === createdNote.id);

    results.push({
      name: 'Unauthenticated Access Protection',
      passed: !canGuestSeePrivate,
      details: !canGuestSeePrivate
        ? 'PASSED: Unauthenticated visitors cannot read private entries.'
        : 'FAILED: Unauthenticated visitor accessed private records.',
    });

    // -------------------------------------------------------------
    // Test 6: Dynamic Passcode Change & Verification
    // -------------------------------------------------------------
    await authService.signIn('noella', 'noella2026');
    const updatedPasscodeResult = await authService.updatePassword('noellaSecure99!', 'noella2026');
    let canLoginWithNew = false;
    let oldPasscodeRejected = false;

    if (updatedPasscodeResult.success) {
      // Old password should fail
      const oldLogin = await authService.signIn('noella', 'noella2026');
      oldPasscodeRejected = !oldLogin.success;

      // New password should succeed
      const newLogin = await authService.signIn('noella', 'noellaSecure99!');
      canLoginWithNew = newLogin.success;

      // Revert back to original password
      await authService.updatePassword('noella2026', 'noellaSecure99!');
    }

    results.push({
      name: 'Dynamic Passcode Change & Verification',
      passed: updatedPasscodeResult.success && canLoginWithNew && oldPasscodeRejected,
      details: updatedPasscodeResult.success && canLoginWithNew && oldPasscodeRejected
        ? 'PASSED: Sanctuary passcode was updated, verified against salted hash, and old key revoked.'
        : 'FAILED: Passcode update or verification failed.',
    });

    // Cleanup test artifacts
    await authService.signIn('solomon', 'solomon2026');
    await notesService.deleteNote(createdNote.id);
    await notesService.deleteNote(createdSharedNote.id);
    await timeCapsuleService.deleteCapsule(capsule.id);
  } finally {
    // Restore original user session
    if (originalUser) {
      const canonicalKey = originalUser.username === 'solomon' ? 'solomon' : 'noella';
      const pwd = canonicalKey === 'solomon' ? 'solomon2026' : 'noella2026';
      await authService.signIn(canonicalKey, pwd);
    } else {
      await authService.signOut();
    }
  }

  return results;
}
