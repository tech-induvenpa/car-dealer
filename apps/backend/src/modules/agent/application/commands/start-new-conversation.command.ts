// "Nueva conversación" pasa a ser un acto explícito del comprador, con efecto
// en el servidor. Antes solo limpiaba estado de React: la Conversación previa
// se abandonaba de forma perezosa al mandar el mensaje siguiente, y el Perfil
// quedaba intacto — así que el Agente arrancaba el hilo nuevo sabiendo lo que
// el comprador había dicho en el viejo y lo trataba como dicho acá.
export class StartNewConversationCommand {
  constructor(public readonly sessionId: string) {}
}
