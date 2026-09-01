import { Profile } from '../../../profile/domain/profile.aggregate';
import { ContactNotYetSignaledException } from '../exceptions/contact-not-yet-signaled.exception';
import { assertCanRequestContact } from './contact-gate';

function unqualifiedProfile(): Profile {
  return Profile.reconstruct({
    id: 1,
    sessionId: 'session-1',
    needs: [],
    motivations: [],
    objections: [],
    budgetRange: null,
  });
}

function qualifiedProfile(): Profile {
  const profile = unqualifiedProfile();
  profile.captureNeed('SUV', 'familia numerosa');
  profile.captureBudget(0, 20000);
  return profile;
}

describe('assertCanRequestContact (INV-4 gate)', () => {
  it('rejects requesting contact when the Profile has no budget and no need captured yet', () => {
    expect(() => assertCanRequestContact(unqualifiedProfile())).toThrow(ContactNotYetSignaledException);
  });

  it('rejects when only budget is captured but no need', () => {
    const profile = unqualifiedProfile();
    profile.captureBudget(0, 20000);
    expect(() => assertCanRequestContact(profile)).toThrow(ContactNotYetSignaledException);
  });

  it('rejects when only need is captured but no budget', () => {
    const profile = unqualifiedProfile();
    profile.captureNeed('SUV', 'familia numerosa');
    expect(() => assertCanRequestContact(profile)).toThrow(ContactNotYetSignaledException);
  });

  it('allows requesting contact once both budget and need are captured', () => {
    expect(() => assertCanRequestContact(qualifiedProfile())).not.toThrow();
  });
});
