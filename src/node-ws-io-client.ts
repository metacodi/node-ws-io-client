import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { DisconnectDescription } from 'socket.io-client/build/esm/socket';
import moment from 'moment';

import { ApiClient, ApiRequestOptions, HttpMethod, ApiCredentials } from "@metacodi/node-api-client";

import { WebsocketIoClientOptions, WsConnection, WsConnectionState } from './node-ws-io-client-types';


export { HttpMethod, ApiCredentials, ApiClientOptions, ApiRequestOptions } from "@metacodi/node-api-client";


export abstract class WebsocketIoClient extends ApiClient {
  protected debug = false;

  /** Referencia al socket client obert amb el servidor. */
  socket: Socket<any, any> = undefined;
  /** Estat de la connexió. */
  get status(): WsConnectionState { return this.connectionStatus; }
  set status(value: WsConnectionState) { const old = this.connectionStatus; this.connectionStatus = value; if (old !== value) { this.statusChanged.next(value); } }
  private connectionStatus: WsConnectionState = 'initial';
  get isConnected(): boolean { return this.connectionStatus === 'connected' || this.connectionStatus === 'login'; }
  /** Notifiquem l'estat actual de la connexió. */
  statusChanged = new Subject<WsConnectionState>();
  /** Indica el periode de delay inicial abans de tornar a connectar. */
  protected initialReconnectPeriod = 5 * 1000;
  /** Indica el periode de delay acumulat abans de tornar a connectar. */
  protected reconnectPeriod = 5 * 1000;
  /** Indica el periode màxim de delay abans de tornar a connectar. */
  protected maxReconnectPeriod = 5 * 60 * 1000;
  /** Indica l'hora de la darrera desconnexió. */
  disconnectedAt: string = undefined;
  /** Identificador del timeout per comprovar que la reconnexió és estable. */
  reconnectingTimeout: NodeJS.Timeout | number = undefined;

  constructor(
    public options: WebsocketIoClientOptions,
  ) {
    super(options);

    this.debug = !!options?.local;
    if (this.debug) { console.log(this.wsId, '=> Current directory', process.cwd()); }
  }

  abstract get connection(): Promise<WsConnection>;

  async connect() {
    // Destruïm el socket anterior.
    this.destroy();
    // Obtenim la info de la connexió.
    const { url, path, query } = await this.connection;
    // Nova instància.
    this.socket = io(url, { path, transports: ['polling'], ... { query } });
    if (this.debug) { console.log(this.wsId, '=> connecting', `${url}${path}`); }
    // Events de socket.io
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
    // Iniciem un periode d'espera per informar que la connexió s'ha estabilitzat.
    if (this.status ==='reconnecting') { this.setReconnectingTimeout(); }
    // Establim l'indicador d'estat.
    this.status = 'connected';
    // Called when the underlying connection is closed.
    this.socket.io.engine.on('close', (reason: string) => this.onClose(`engine close: ${reason}`));
  }

  protected onError(error: any) {
    console.error(`${this.wsId} =>`, error.message);
  }

  /** Es llança quan es perd la connexió entre servidor i client.
   *
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
    // Com que la reconnexió pot succeir diverses vegades consecutives, respectem la primera hora establerta.
    if (!this.disconnectedAt) {
      // NOTA: Com que no sabem exactament quan la connexió ha començat a fallar, restem tot el període de timeout
      // per a tenir una garantia que obtindrem els canvis pendents a través de la consulta d'auditoria.
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
