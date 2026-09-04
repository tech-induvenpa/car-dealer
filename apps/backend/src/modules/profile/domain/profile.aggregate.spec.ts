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
      contact: null,
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

  it('una Necesidad nueva reemplaza a la anterior, no se acumula', () => {
    // Las categorías son carrocerías mutuamente excluyentes: quien dice
    // "familiar" y después "para ciudad" cambió de idea. Acumularlas mandaba al
    // Agente un profileSummary que se contradecía a sí mismo.
    const profile = Profile.reconstruct({
      id: 1,
      sessionId: 's',
      needs: [],
      motivations: [],
      objections: [],
      budgetRange: null,
      contact: null,
    });

    profile.captureNeed('SUV', 'uso familiar');
    profile.captureNeed('COMPACTO', 'para ciudad');

    expect(profile.needs).toEqual([{ category: 'COMPACTO', detail: 'para ciudad' }]);
  });

  it('olvidar lo declarado limpia los hechos pero conserva el Contacto', () => {
    // Empezar de nuevo no puede costarte un teléfono ya dado.
    const profile = Profile.reconstruct({
      id: 1,
      sessionId: 's',
      needs: [{ category: 'SUV', detail: 'familiar' }],
      motivations: [],
      objections: [],
      budgetRange: null,
      contact: { firstName: 'Ana', lastName: 'Pérez', phone: '0414-1234567' },
    });
    profile.captureBudget(0, 20000);

    profile.forgetDeclaredFacts();

    expect(profile.needs).toEqual([]);
    expect(profile.budgetRange).toBeNull();
    expect(profile.contact).toEqual({ firstName: 'Ana', lastName: 'Pérez', phone: '0414-1234567' });
    expect(profile.hasAnyData).toBe(true);
  });


  it('una Objeción de la misma categoría actualiza la anterior, pero convive con otras', () => {
    // Que le preocupe el precio Y la marca es normal. Decir dos veces algo del
    // precio es actualizar esa objeción, no tener dos.
    const profile = Profile.reconstruct({
      id: 1,
      sessionId: 's',
      needs: [],
      motivations: [],
      objections: [],
      budgetRange: null,
      contact: null,
    });

    profile.captureObjection('PRECIO', 'está caro');
    profile.captureObjection('MARCA', 'no conozco Changan');
    profile.captureObjection('PRECIO', 'la inicial es muy alta');

    expect(profile.objections).toEqual([
      { category: 'MARCA', detail: 'no conozco Changan' },
      { category: 'PRECIO', detail: 'la inicial es muy alta' },
    ]);
  });

});
