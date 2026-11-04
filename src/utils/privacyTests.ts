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
 * 1. Independent Session & Private Notes Isolation (Solomon vs Ella)
 * 2. Deliberate Sharing Verification (Author retains ownership)
 * 3. Unauthorized Modification Prevention (Recipient cannot delete or modify author's note)
 * 4. Time Capsule Future-Release Protection (Server/date enforced release)
 * 5. Unauthenticated Access Protection (Guest cannot read private entries)
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

    // Ella signs into her account on her device
    await authService.signIn('noella', 'ella2026');
    const ellaNotes = await notesService.getNotes();
    const canEllaSeePrivateNote = ellaNotes.some((n) => n.id === createdNote.id);

    results.push({
      name: 'Independent Session & Private Note Isolation (RLS)',
      passed: !canEllaSeePrivateNote,
      details: !canEllaSeePrivateNote
        ? 'PASSED: Private note written by Solomon is completely inaccessible and denied to Ella.'
        : 'FAILED: Ella was able to query Solomon’s private note.',
    });

    // -------------------------------------------------------------
    // Test 2: Deliberate Sharing Verification
    // -------------------------------------------------------------
    // Solomon signs back in and deliberately shares a note
    await authService.signIn('solomon', 'solomon2026');
    const testSharedTitle = `Solomon Shared Note ${Date.now()}`;
    const createdSharedNote = await notesService.saveNote({
      title: testSharedTitle,
      body: 'This is a shared letter to Ella.',
      isShared: true,
    });

    // Ella signs into her account
    await authService.signIn('noella', 'ella2026');
    const ellaNotesAfterShare = await notesService.getNotes();
    const sharedNoteInEllaView = ellaNotesAfterShare.find((n) => n.id === createdSharedNote.id);
    const isAuthorPreserved = Boolean(sharedNoteInEllaView?.authorName?.includes('Solomon'));

    results.push({
      name: 'Deliberate Note Sharing & Author Preservation',
      passed: Boolean(sharedNoteInEllaView && isAuthorPreserved),
      details: sharedNoteInEllaView && isAuthorPreserved
        ? 'PASSED: Deliberately shared note is visible to Ella, and original author remains Solomon.'
        : 'FAILED: Shared note was not visible or author ownership was corrupted.',
    });

    // -------------------------------------------------------------
    // Test 3: Unauthorized Modification Protection
    // -------------------------------------------------------------
    // Ella attempts to delete Solomon's note
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

    // Ella checks her view
    await authService.signIn('noella', 'ella2026');
    const ellaCapsules = await timeCapsuleService.getCapsules();
    const ellaView = ellaCapsules.find((c) => c.id === capsule.id);
    const isBodyProtected = !ellaView || ellaView.body !== secretContent;

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

    // Cleanup test artifacts
    await authService.signIn('solomon', 'solomon2026');
    await notesService.deleteNote(createdNote.id);
    await notesService.deleteNote(createdSharedNote.id);
    await timeCapsuleService.deleteCapsule(capsule.id);
  } finally {
    // Restore original user session
    if (originalUser) {
      const canonicalKey = originalUser.username === 'solomon' ? 'solomon' : 'noella';
      const pwd = canonicalKey === 'solomon' ? 'solomon2026' : 'ella2026';
      await authService.signIn(canonicalKey, pwd);
    } else {
      await authService.signOut();
    }
  }

  return results;
}
