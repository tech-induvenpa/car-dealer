import { verifyVerdict } from './verdict-verifier';

const COROLLA = 1;
const SELTOS = 2;
const PAIR = [COROLLA, SELTOS];

describe('verifyVerdict', () => {
  it('entrega el Veredicto cuando el recomendado es Ganador del Campo decisivo', () => {
    const verdict = verifyVerdict(
      { recommendedVehicleId: SELTOS, decisiveField: 'fuelEconomyNormalizedKmPerL', reason: 'Rinde 18% más.' },
      { fuelEconomyNormalizedKmPerL: [SELTOS], horsepowerHp: [COROLLA] },
      PAIR,
      true,
    );

    expect(verdict).toEqual({
      recommendedVehicleId: SELTOS,
      comparedVehicleIds: PAIR,
      decisiveField: 'fuelEconomyNormalizedKmPerL',
      reason: 'Rinde 18% más.',
    });
  });

  it('descarta cuando el recomendado NO es Ganador de ese campo', () => {
    // El caso que la regla existe para atajar: el modelo afirma "el Seltos,
    // por potencia" y la potencia la gana el otro.
    expect(
      verifyVerdict(
        { recommendedVehicleId: SELTOS, decisiveField: 'horsepowerHp', reason: 'Tiene más motor.' },
        { horsepowerHp: [COROLLA] },
        PAIR,
      true,
      ),
    ).toBeNull();
  });

  it('descarta un Campo decisivo que no tiene dirección de "mejor" definida', () => {
    // weightKg es NOT_RANKED en la policy (ADR-0006), así que nunca aparece
    // en winners — no hay forma de sostener un título con él.
    expect(
      verifyVerdict(
        { recommendedVehicleId: SELTOS, decisiveField: 'weightKg', reason: 'Pesa menos.' },
        { horsepowerHp: [COROLLA] },
        PAIR,
      true,
      ),
    ).toBeNull();
  });

  it('descarta cuando el campo está empatado', () => {
    // La policy omite el campo de winners cuando todos empatan; y si igual
    // llegara con varios ganadores, tampoco hay un ganador que sostenga nada.
    expect(
      verifyVerdict(
        { recommendedVehicleId: SELTOS, decisiveField: 'airbagsCount', reason: 'Más seguro.' },
        { airbagsCount: PAIR },
        PAIR,
      true,
      ),
    ).toBeNull();
  });

  it('descarta cuando el campo falta en alguno de los dos vehículos', () => {
    // Sin valor en uno de los dos, la policy no puede rankear y omite el
    // campo: no hay Ganador contra el cual verificar.
    expect(
      verifyVerdict(
        { recommendedVehicleId: SELTOS, decisiveField: 'torqueNm', reason: 'Empuja más.' },
        {},
        PAIR,
      true,
      ),
    ).toBeNull();
  });

  it('descarta un recomendado que no es ninguno de los dos comparados', () => {
    expect(
      verifyVerdict(
        { recommendedVehicleId: 99, decisiveField: 'horsepowerHp', reason: 'Es mejor.' },
        { horsepowerHp: [99] },
        PAIR,
      true,
      ),
    ).toBeNull();
  });

  it('descarta el Veredicto si todavía no sabemos qué busca ni cuánto puede gastar', () => {
    // El caso que reportó el usuario: veredicto en la primera pregunta. Los
    // números pueden ser impecables, pero sin Perfil no hay a quién
    // recomendarle — el título diría "para ti" sin saber quién es.
    expect(
      verifyVerdict(
        { recommendedVehicleId: SELTOS, decisiveField: 'fuelEconomyNormalizedKmPerL', reason: 'Rinde más.' },
        { fuelEconomyNormalizedKmPerL: [SELTOS] },
        PAIR,
        false,
      ),
    ).toBeNull();
  });

  it('devuelve null cuando el modelo no propuso Veredicto', () => {
    expect(verifyVerdict(null, { horsepowerHp: [COROLLA] }, PAIR, true)).toBeNull();
    expect(verifyVerdict(undefined, { horsepowerHp: [COROLLA] }, PAIR, true)).toBeNull();
  });

  it('descarta cuando no se compararon exactamente dos vehículos', () => {
    // Un Veredicto es siempre sobre un par: sin par no hay nada que contrastar.
    expect(
      verifyVerdict(
        { recommendedVehicleId: COROLLA, decisiveField: 'horsepowerHp', reason: 'Gana.' },
        { horsepowerHp: [COROLLA] },
        [COROLLA],
        true,
      ),
    ).toBeNull();
  });

  it('descarta una razón vacía', () => {
    expect(
      verifyVerdict(
        { recommendedVehicleId: SELTOS, decisiveField: 'fuelEconomyNormalizedKmPerL', reason: '  ' },
        { fuelEconomyNormalizedKmPerL: [SELTOS] },
        PAIR,
      true,
      ),
    ).toBeNull();
  });
});
