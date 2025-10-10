import { Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { ApiClient } from "@metacodi/node-api-client";
import { WebsocketIoClientOptions, WsConnection, WsConnectionState } from './node-ws-io-client.types';
export declare abstract class WebsocketIoClient extends ApiClient {
    options: WebsocketIoClientOptions;
    protected debug: boolean;
    /** Reference to the client socket opened with the server. */
    socket: Socket<any, any>;
    /** Connection state. */
    get status(): WsConnectionState;
    set status(value: WsConnectionState);
    private connectionStatus;
    get isConnected(): boolean;
    /** Notify the current connection state. */
    statusChanged: Subject<WsConnectionState>;
    /** Initial delay before attempting to reconnect. */
    protected initialReconnectPeriod: number;
    /** Accumulated delay before attempting to reconnect. */
    protected reconnectPeriod: number;
    /** Maximum delay before attempting to reconnect. */
    protected maxReconnectPeriod: number;
    /** Timestamp of the last disconnection. */
    disconnectedAt: string;
    /** Timeout ID used to verify the reconnection is stable. */
    reconnectingTimeout: NodeJS.Timeout | number;
    constructor(options: WebsocketIoClientOptions);
    abstract get connection(): Promise<WsConnection>;
    connect(): Promise<void>;
    reconnect(): void;
    close(): void;
    protected destroy(): void;
    protected onConnect(): void;
    protected onError(error: any): void;
    /** Fired when the connection between server and client is lost.
     * {@link https://socket.io/docs/v4/client-socket-instance/#disconnect disconnect: possible reasons}
     */
    protected onClose(event: string): void;
    protected setReconnectingTimeout(): void;
    protected clearReconnectingTimeout(): void;
    protected setDisconnectionTime(): void;
    protected get wsId(): string;
}
//# sourceMappingURL=node-ws-io-client.d.ts.map