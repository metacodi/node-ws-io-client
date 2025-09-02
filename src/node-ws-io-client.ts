import { io, Socket } from 'socket.io-client';
import { DisconnectDescription } from 'socket.io-client/build/esm/socket';
import { Subject } from 'rxjs';
import moment from 'moment';

import { ApiClient, HttpMethod, ApiCredentials, ApiClientOptions, ApiRequestOptions } from "@metacodi/node-api-client";

import { WebsocketIoClientOptions, WsConnection, WsConnectionState } from './node-ws-io-client-types';



export abstract class WebsocketIoClient extends ApiClient {
  protected debug = false;

  /** Reference to the client socket opened with the server. */
  socket: Socket<any, any> = undefined;
  /** Connection state. */
  get status(): WsConnectionState { return this.connectionStatus; }
  set status(value: WsConnectionState) { const old = this.connectionStatus; this.connectionStatus = value; if (old !== value) { this.statusChanged.next(value); } }
  private connectionStatus: WsConnectionState = 'initial';
  get isConnected(): boolean { return this.connectionStatus === 'connected' || this.connectionStatus === 'login'; }
  /** Notify the current connection state. */
  statusChanged = new Subject<WsConnectionState>();
  /** Initial delay before attempting to reconnect. */
  protected initialReconnectPeriod = 5 * 1000;
  /** Accumulated delay before attempting to reconnect. */
  protected reconnectPeriod = 5 * 1000;
  /** Maximum delay before attempting to reconnect. */
  protected maxReconnectPeriod = 5 * 60 * 1000;
  /** Timestamp of the last disconnection. */
  disconnectedAt: string = undefined;
  /** Timeout ID used to verify the reconnection is stable. */
  reconnectingTimeout: NodeJS.Timeout | number = undefined;

  constructor(
    public options: WebsocketIoClientOptions,
  ) {
    super(options);

    this.debug = !!options?.local;
    if (this.debug) { console.log(this.wsId, '=>', process.cwd()); }
  }

  abstract get connection(): Promise<WsConnection>;

  async connect() {
    // Destroy any previous socket instance.
    this.destroy();
    // Retrieve connection details.
    const { url, path, query } = await this.connection;
    // Create new socket instance.
    this.socket = io(url, { path, transports: ['polling'], ... { query } });
    if (this.debug) { console.log(this.wsId, '=> connecting', `${url}${path}`); }
    // socket.io events
    this.socket.on('connect', () => this.onConnect());
    this.socket.on('connect_error', (error: any) => this.onError(error));
    this.socket.on('disconnect', (reason: Socket.DisconnectReason, description?: DisconnectDescription) => this.onClose(`socket disconnect ${reason}`));
    return Promise.resolve();
  }

  reconnect() {
    if (this.status === 'reconnecting') { return; }
    if (this.debug) { console.log(this.wsId, '=> reconnecting'); }
    this.status = 'reconnecting';
    this.close();
    setTimeout(() => this.connect(), this.reconnectPeriod);
  }

  close() {
    if (this.debug) { console.log(this.wsId, '=> close'); }
    if (this.status !== 'reconnecting') { this.status = 'closing'; }
    this.setDisconnectionTime();
    this.clearReconnectingTimeout();
    this.destroy();
  }

  protected destroy() {
    if (this.socket) {
      try { this.socket.removeAllListeners(); } catch (error) { console.error('destroy() -> socket.removeAllListeners() => ', error); }
      try { this.socket.offAny(); } catch (error) { console.error('destroy() -> socket.offAny() => ', error); }
      try { this.socket.disconnect(); } catch (error) { console.error('destroy() -> socket.disconnect() => ', error); }
      this.socket = undefined;
    }
  }


  // ---------------------------------------------------------------------------------------------------
  //  onConnect . onClose . onError
  // ---------------------------------------------------------------------------------------------------

  protected onConnect() {
    if (this.debug) { console.log(this.wsId, `=> ${this.status === 'reconnecting' ? 'reconnected!' : 'connected!'}`); }
    // Start a short wait period to confirm the connection is stable.
    if (this.status ==='reconnecting') { this.setReconnectingTimeout(); }
    // Update connection status.
    this.status = 'connected';
    // Called when the underlying connection is closed.
    this.socket.io.engine.on('close', (reason: string) => this.onClose(`engine close: ${reason}`));
  }

  protected onError(error: any) {
    console.error(`${this.wsId} =>`, error.message);
  }

  /** Fired when the connection between server and client is lost.
   * {@link https://socket.io/docs/v4/client-socket-instance/#disconnect disconnect: possible reasons}
   */
  protected onClose(event: string) {
    if (this.debug) { console.log(this.wsId, '=> closed', event); }
    this.setDisconnectionTime();
    this.clearReconnectingTimeout();
    this.reconnectPeriod = Math.min(this.reconnectPeriod + (5 * 1000), this.maxReconnectPeriod);
    if (this.status === 'closing') {
      this.status = 'initial';
    } else if (this.status !== 'reconnecting') {
      this.reconnect();
    }
  }

  protected setReconnectingTimeout() {
    this.reconnectPeriod = this.initialReconnectPeriod;
    const period = 1000 / 5;
    this.reconnectingTimeout = setTimeout(() => {
      if (this.debug) { console.log(this.wsId, `=> disconnected at ${this.disconnectedAt}`); }
      if (this.status === 'connected') {
        this.clearReconnectingTimeout();
        this.disconnectedAt = undefined;
      }
    }, period);
  }

  protected clearReconnectingTimeout() {
    if (this.reconnectingTimeout) {
      clearTimeout(this.reconnectingTimeout);
      this.reconnectingTimeout = undefined;
    }
  }

  protected setDisconnectionTime() {
    // Since reconnection may happen multiple times in a row, keep the first timestamp.
    if (!this.disconnectedAt) {
      // NOTA: Since we don't know exactly when the connection started failing,
      // we subtract the full timeout period to ensure we fetch pending changes via the audit query.
      const pingTimeout = 20 * 1000;
      this.disconnectedAt = moment().subtract(pingTimeout, 'milliseconds').format('YYYY-MM-DD HH:mm:ss');
      if (this.debug) { console.log(this.wsId, `=> disconnecting at ${this.disconnectedAt}`); }
    }
  }


  // ---------------------------------------------------------------------------------------------------
  //  log
  // ---------------------------------------------------------------------------------------------------

  protected get wsId(): string { return this.constructor.name; }

}

