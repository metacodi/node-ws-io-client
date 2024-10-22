import { Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { ApiClient } from "@metacodi/node-api-client";
import { WebsocketIoClientOptions, WsConnection, WsConnectionState } from './node-ws-io-client-types';
export declare abstract class WebsocketIoClient extends ApiClient {
    options: WebsocketIoClientOptions;
    protected debug: boolean;
    socket: Socket<any, any>;
    get status(): WsConnectionState;
    set status(value: WsConnectionState);
    private connectionStatus;
    get isConnected(): boolean;
    statusChanged: Subject<WsConnectionState>;
    protected initialReconnectPeriod: number;
    protected reconnectPeriod: number;
    protected maxReconnectPeriod: number;
    disconnectedAt: string;
    reconnectingTimeout: NodeJS.Timeout | number;
    constructor(options: WebsocketIoClientOptions);
    abstract get connection(): Promise<WsConnection>;
    connect(): Promise<void>;
    reconnect(): void;
    close(): void;
    protected destroy(): void;
    protected onConnect(): void;
    protected onError(error: any): void;
    protected onClose(event: string): void;
    protected setReconnectingTimeout(): void;
    protected clearReconnectingTimeout(): void;
    protected setDisconnectionTime(): void;
    protected get wsId(): string;
}
//# sourceMappingURL=node-ws-io-client.d.ts.map