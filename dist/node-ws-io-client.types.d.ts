import type { HttpApiSettings } from "@metacodi/node-api-client";
export type WsConnectionState = 'initial' | 'connecting' | 'login' | 'connected' | 'reconnecting' | 'closing';
export interface WsConnection {
    url: string;
    path: string;
    query?: Record<string, string | number | boolean>;
}
export interface WebsocketIoSettings {
    url: string;
    urlLocal?: string;
    path?: string;
    query?: Record<string, string | number | boolean>;
}
export interface WebsocketReconnectSettings {
    initialDelayMs?: number;
    maxDelayMs?: number;
}
export interface WebsocketHeartbeatSettings {
    pingIntervalMs?: number;
    pongTimeoutMs?: number;
}
export interface WebsocketIoClientSettings {
    api?: HttpApiSettings;
    ws?: WebsocketIoSettings;
    reconnect?: WebsocketReconnectSettings;
    heartbeat?: WebsocketHeartbeatSettings;
    debug?: boolean;
}
//# sourceMappingURL=node-ws-io-client.types.d.ts.map