import { Subject } from 'rxjs';
import { WebsocketIoClientSettings, WsConnection, WsConnectionState } from './node-ws-io-client.types';
interface SocketEngineLike {
    on(event: string, listener: (reason: string) => void): void;
}
interface SocketManagerLike {
    engine: SocketEngineLike;
}
interface WebsocketClientSocketLike {
    io: SocketManagerLike;
    on(event: string, listener: (...args: any[]) => void): unknown;
    removeAllListeners(): unknown;
    offAny(): unknown;
    disconnect(): unknown;
}
export declare abstract class WebsocketIoClient {
    protected readonly clientSettings: WebsocketIoClientSettings;
    protected debug: boolean;
    /** Reference to the client socket opened with the server. */
    socket: WebsocketClientSocketLike;
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
    constructor(clientSettings?: WebsocketIoClientSettings);
    abstract get connection(): Promise<WsConnection>;
    connect(): Promise<void>;
    reconnect(): void;
    close(): void;
    protected destroy(): void;
    protected onConnect(): void;
    protected onError(error: any): void;
    protected onReconnectError(error: any): void;
    /** Fired when the connection between server and client is lost.
     * {@link https://socket.io/docs/v4/client-socket-instance/#disconnect disconnect: possible reasons}
     */
    protected onClose(event: string): void;
    protected setReconnectingTimeout(): void;
    protected clearReconnectingTimeout(): void;
    protected setDisconnectionTime(): void;
    protected get wsId(): string;
}
export {};
//# sourceMappingURL=node-ws-io-client.d.ts.map