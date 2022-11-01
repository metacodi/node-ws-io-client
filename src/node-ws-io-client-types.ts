import { ApiClientOptions } from "@metacodi/node-api-client";


export declare type WsConnectionState = 'initial' | 'connecting' | 'login' | 'connected' | 'reconnecting' | 'closing';

export interface WsConnection {
  url: string;
  path: string;
  query?: { [key: string]: any };
}

export interface WebsocketIoClientOptions extends ApiClientOptions {
  url?: string;
  path?: string;
  query?: { [key: string]: any };
  local?: boolean;
  reconnectPeriod?: number;
  pingInterval?: number;
  pongTimeout?: number;
  apiBaseUrl?: string;
  apiIdUser?: number;
}

