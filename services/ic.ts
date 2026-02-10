import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent, Actor } from "@dfinity/agent";
import { IDL } from "@dfinity/candid";
import { Principal } from "@dfinity/principal";

// Platzhalter für Canister-IDs. In einer echten Anwendung würden diese
// aus Umgebungsvariablen geladen (z.B. process.env.CANISTER_ID).
const CANISTER_ID_LOCAL = "bkyz2-fmaaa-aaaaa-qaaaq-cai"; // Beispiel für eine lokale Replica
const CANISTER_ID_IC = "ryjl3-tyaaa-aaaaa-aaaba-cai"; // Beispiel für eine IC Mainnet ID

// Bestimmt, ob die App in einer lokalen Entwicklungsumgebung läuft.
const isLocal = window.location.host.includes("localhost");
const canisterId = isLocal ? CANISTER_ID_LOCAL : CANISTER_ID_IC;
const host = isLocal ? "http://localhost:4943" : "https://icp-api.io";

let authClient: AuthClient | null = null;
let actor: any = null; // Der Typ wird durch die Candid-Definition dynamisch

/**
 * Definiert die Schnittstelle (Candid) für den Backend-Canister.
 * Dies beschreibt die Funktionen, die der Canister zur Verfügung stellt.
 * @returns {IDL.ServiceClass}
 */
const idlFactory = ({ IDL }: { IDL: any }) => {
  return IDL.Service({
    'getState': IDL.Func([], [IDL.Opt(IDL.Text)], ['query']),
    'setState': IDL.Func([IDL.Text], [], []),
  });
};

/**
 * Stellt sicher, dass eine AuthClient-Instanz initialisiert ist.
 * @returns {Promise<AuthClient>}
 */
const ensureAuthClient = async (): Promise<AuthClient> => {
    if (!authClient) {
        authClient = await AuthClient.create();
    }
    return authClient;
};

/**
 * Erstellt und konfiguriert den Actor, der zur Kommunikation mit dem Canister verwendet wird.
 * Der Actor benötigt eine Identität (vom AuthClient), um authentifizierte Aufrufe zu tätigen.
 */
const createActor = async () => {
    const client = await ensureAuthClient();
    const identity = client.getIdentity();

    const agent = new HttpAgent({ identity, host });

    // Nur im lokalen Entwicklungsmodus: Lädt den öffentlichen Schlüssel des Canisters.
    if (isLocal) {
        await agent.fetchRootKey();
    }

    actor = Actor.createActor(idlFactory, {
        agent,
        canisterId,
    });
};

/**
 * Führt den Anmeldevorgang über Internet Identity durch.
 * @returns {Promise<string | null>} Die Principal-ID des Benutzers bei Erfolg, sonst null.
 */
export const login = async (): Promise<string | null> => {
    const client = await ensureAuthClient();
    return new Promise((resolve, reject) => {
        client.login({
            identityProvider: isLocal 
                ? "http://b77ix-eeaaa-aaaaa-qaada-cai.localhost:4943/" // Lokale Internet Identity URL
                : "https://identity.ic0.app",
            onSuccess: async () => {
                await createActor();
                const principal = client.getIdentity().getPrincipal().toText();
                resolve(principal);
            },
            onError: (error) => {
                console.error("Login failed:", error);
                reject(error);
            },
        });
    });
};

/**
 * Meldet den Benutzer ab und setzt den Actor zurück.
 */
export const logout = async () => {
    const client = await ensureAuthClient();
    await client.logout();
    actor = null;
};

/**
 * Gibt den initialisierten Actor zurück. Erstellt ihn, falls er noch nicht existiert.
 * @returns {Promise<any>} Der Canister-Actor.
 */
export const getActor = async () => {
    if (!actor) {
        await createActor();
    }
    return actor;
};

/**
 * Gibt die Principal-ID des aktuell angemeldeten Benutzers zurück.
 * @returns {Promise<string | null>} Die Principal-ID oder null, wenn nicht angemeldet.
 */
export const getPrincipal = async (): Promise<string | null> => {
    const client = await ensureAuthClient();
    if (await client.isAuthenticated()) {
        return client.getIdentity().getPrincipal().toText();
    }
    return null;
};
