import { BudgetCapturedEvent } from './events/budget-captured.event';
import { MotivationCapturedEvent } from './events/motivation-captured.event';
import { NeedCapturedEvent } from './events/need-captured.event';
import { ObjectionCapturedEvent } from './events/objection-captured.event';
import { InvalidBudgetRangeException } from './exceptions/invalid-budget-range.exception';
import { ProfileNotPersistedException } from './exceptions/profile-not-persisted.exception';
import { CreateProfileProps, Profile } from './profile.aggregate';

function validProps(overrides: Partial<CreateProfileProps> = {}): CreateProfileProps {
  return { sessionId: 'session-123', ...overrides };
}

describe('Profile aggregate', () => {
  it('creates a profile with valid props, no data captured yet', () => {
    const profile = Profile.create(validProps());
    expect(profile.id).toBeNull();
    expect(profile.sessionId).toBe('session-123');
    expect(profile.needs).toEqual([]);
    expect(profile.motivations).toEqual([]);
    expect(profile.objections).toEqual([]);
    expect(profile.budgetRange).toBeNull();
    expect(profile.hasAnyData).toBe(false);
  });

  describe('capture before persistence', () => {
    it('rejects capturing a Need on a Profile that was never persisted', () => {
      const profile = Profile.create(validProps());
      expect(() => profile.captureNeed('SUV', 'busca espacio para la familia')).toThrow(
        ProfileNotPersistedException,
      );
    });
  });

  describe('captures once persisted', () => {
    function persisted(): Profile {
      return Profile.reconstruct({
        id: 1,
        sessionId: 'session-123',
        needs: [],
        motivations: [],
        objections: [],
        budgetRange: null,
      });
    }

    it('captures a Need and applies NeedCapturedEvent with the real id', () => {
      const profile = persisted();
      profile.captureNeed('SUV', 'busca espacio para la familia');

      expect(profile.needs).toEqual([{ category: 'SUV', detail: 'busca espacio para la familia' }]);
      const events = profile.getUncommittedEvents() as NeedCapturedEvent[];
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(NeedCapturedEvent);
      expect(events[0].profileId).toBe(1);
      expect(events[0].category).toBe('SUV');
    });

    it('captures a Motivation and applies MotivationCapturedEvent', () => {
      const profile = persisted();
      profile.captureMotivation('PRIMERA_COMPRA', 'nunca ha tenido carro propio');

      expect(profile.motivations).toEqual([
        { category: 'PRIMERA_COMPRA', detail: 'nunca ha tenido carro propio' },
      ]);
      const events = profile.getUncommittedEvents() as MotivationCapturedEvent[];
      expect(events[0]).toBeInstanceOf(MotivationCapturedEvent);
    });

    it('captures an Objection and applies ObjectionCapturedEvent', () => {
      const profile = persisted();
      profile.captureObjection('PRECIO', 'le parece caro comparado con la competencia');

      expect(profile.objections).toEqual([
        { category: 'PRECIO', detail: 'le parece caro comparado con la competencia' },
      ]);
      const events = profile.getUncommittedEvents() as ObjectionCapturedEvent[];
      expect(events[0]).toBeInstanceOf(ObjectionCapturedEvent);
    });

    it('captures a budget range and applies BudgetCapturedEvent', () => {
      const profile = persisted();
      profile.captureBudget(0, 20000);

      expect(profile.budgetRange?.min).toBe(0);
      expect(profile.budgetRange?.max).toBe(20000);
      const events = profile.getUncommittedEvents() as BudgetCapturedEvent[];
      expect(events[0]).toBeInstanceOf(BudgetCapturedEvent);
      expect(events[0].profileId).toBe(1);
    });

    it('rejects a budget range with max below min', () => {
      const profile = persisted();
      expect(() => profile.captureBudget(20000, 10000)).toThrow(InvalidBudgetRangeException);
    });

    it('accumulates multiple captures of the same type without overwriting', () => {
      const profile = persisted();
      profile.captureObjection('PRECIO', 'le parece caro');
      profile.captureObjection('FINANCIAMIENTO', 'no sabe si califica');

      expect(profile.objections).toHaveLength(2);
    });

    it('hasAnyData is true once at least one fact is captured, even without a Lead', () => {
      const profile = persisted();
      expect(profile.hasAnyData).toBe(false);
      profile.captureBudget(0, 35000);
      expect(profile.hasAnyData).toBe(true);
    });
  });
});
