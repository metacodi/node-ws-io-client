"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketIoClient = void 0;
const socket_io_client_1 = require("socket.io-client");
const rxjs_1 = require("rxjs");
const moment_1 = __importDefault(require("moment"));
class WebsocketIoClient {
    /** Connection state. */
    get status() { return this.connectionStatus; }
    set status(value) { const old = this.connectionStatus; this.connectionStatus = value; if (old !== value) {
        this.statusChanged.next(value);
    } }
    get isConnected() { return this.connectionStatus === 'connected' || this.connectionStatus === 'login'; }
    constructor(clientSettings = {}) {
        // super(clientSettings.api);
        var _a, _b, _c, _d;
        this.clientSettings = clientSettings;
        this.debug = false;
        /** Reference to the client socket opened with the server. */
        this.socket = undefined;
        this.connectionStatus = 'initial';
        /** Notify the current connection state. */
        this.statusChanged = new rxjs_1.Subject();
        /** Initial delay before attempting to reconnect. */
        this.initialReconnectPeriod = 5 * 1000;
        /** Accumulated delay before attempting to reconnect. */
        this.reconnectPeriod = 5 * 1000;
        /** Maximum delay before attempting to reconnect. */
        this.maxReconnectPeriod = 5 * 60 * 1000;
        /** Timestamp of the last disconnection. */
        this.disconnectedAt = undefined;
        /** Timeout ID used to verify the reconnection is stable. */
        this.reconnectingTimeout = undefined;
        this.debug = !!(clientSettings === null || clientSettings === void 0 ? void 0 : clientSettings.debug);
        this.initialReconnectPeriod = (_b = (_a = clientSettings === null || clientSettings === void 0 ? void 0 : clientSettings.reconnect) === null || _a === void 0 ? void 0 : _a.initialDelayMs) !== null && _b !== void 0 ? _b : this.initialReconnectPeriod;
        this.reconnectPeriod = this.initialReconnectPeriod;
        this.maxReconnectPeriod = (_d = (_c = clientSettings === null || clientSettings === void 0 ? void 0 : clientSettings.reconnect) === null || _c === void 0 ? void 0 : _c.maxDelayMs) !== null && _d !== void 0 ? _d : this.maxReconnectPeriod;
        if (this.debug) {
            console.log(this.wsId, '=>', process.cwd());
        }
    }
    async connect() {
        // Destroy any previous socket instance.
        this.destroy();
        // Retrieve connection details.
        const { url, path, query } = await this.connection;
        // Create new socket instance.
        this.socket = (0, socket_io_client_1.io)(url, Object.assign({ path, transports: ['polling'] }, { query }));
        if (this.debug) {
            console.log(this.wsId, '=> connecting', `${url}${path}`);
        }
        // socket.io events
        this.socket.on('connect', () => this.onConnect());
        this.socket.on('connect_error', (error) => this.onError(error));
        this.socket.on('disconnect', (reason, _description) => this.onClose(`socket disconnect ${reason}`));
        return Promise.resolve();
    }
    reconnect() {
        if (this.status === 'reconnecting') {
            return;
        }
        if (this.debug) {
            console.log(this.wsId, '=> reconnecting');
        }
        this.status = 'reconnecting';
        this.close();
        setTimeout(() => {
            void this.connect().catch(error => this.onReconnectError(error));
        }, this.reconnectPeriod);
    }
    close() {
        if (this.debug) {
            console.log(this.wsId, '=> close');
        }
        if (this.status !== 'reconnecting') {
            this.status = 'closing';
        }
        this.setDisconnectionTime();
        this.clearReconnectingTimeout();
        this.destroy();
    }
    destroy() {
        if (this.socket) {
            try {
                this.socket.removeAllListeners();
            }
            catch (error) {
                console.error('destroy() -> socket.removeAllListeners() => ', error);
            }
            try {
                this.socket.offAny();
            }
            catch (error) {
                console.error('destroy() -> socket.offAny() => ', error);
            }
            try {
                this.socket.disconnect();
            }
            catch (error) {
                console.error('destroy() -> socket.disconnect() => ', error);
            }
            this.socket = undefined;
        }
    }
    // ---------------------------------------------------------------------------------------------------
    //  onConnect . onClose . onError
    // ---------------------------------------------------------------------------------------------------
    onConnect() {
        if (this.debug) {
            console.log(this.wsId, `=> ${this.status === 'reconnecting' ? 'reconnected!' : 'connected!'}`);
        }
        // Start a short wait period to confirm the connection is stable.
        if (this.status === 'reconnecting') {
            this.setReconnectingTimeout();
        }
        // Update connection status.
        this.status = 'connected';
        // Called when the underlying connection is closed.
        this.socket.io.engine.on('close', (reason) => this.onClose(`engine close: ${reason}`));
    }
    onError(error) {
        console.error(`${this.wsId} =>`, error.message);
    }
    onReconnectError(error) {
        this.onError(error);
    }
    /** Fired when the connection between server and client is lost.
     * {@link https://socket.io/docs/v4/client-socket-instance/#disconnect disconnect: possible reasons}
     */
    onClose(event) {
        if (this.debug) {
            console.log(this.wsId, '=> closed', event);
        }
        this.setDisconnectionTime();
        this.clearReconnectingTimeout();
        this.reconnectPeriod = Math.min(this.reconnectPeriod + (5 * 1000), this.maxReconnectPeriod);
        if (this.status === 'closing') {
            this.status = 'initial';
        }
        else if (this.status !== 'reconnecting') {
            this.reconnect();
        }
    }
    setReconnectingTimeout() {
        this.reconnectPeriod = this.initialReconnectPeriod;
        const period = 1000 / 5;
        this.reconnectingTimeout = setTimeout(() => {
            if (this.debug) {
                console.log(this.wsId, `=> disconnected at ${this.disconnectedAt}`);
            }
            if (this.status === 'connected') {
                this.clearReconnectingTimeout();
                this.disconnectedAt = undefined;
            }
        }, period);
    }
    clearReconnectingTimeout() {
        if (this.reconnectingTimeout) {
            clearTimeout(this.reconnectingTimeout);
            this.reconnectingTimeout = undefined;
        }
    }
    setDisconnectionTime() {
        // Since reconnection may happen multiple times in a row, keep the first timestamp.
        if (!this.disconnectedAt) {
            // NOTA: Since we don't know exactly when the connection started failing,
            // we subtract the full timeout period to ensure we fetch pending changes via the audit query.
            const pingTimeout = 20 * 1000;
            this.disconnectedAt = (0, moment_1.default)().subtract(pingTimeout, 'milliseconds').format('YYYY-MM-DD HH:mm:ss');
            if (this.debug) {
                console.log(this.wsId, `=> disconnecting at ${this.disconnectedAt}`);
            }
        }
    }
    // ---------------------------------------------------------------------------------------------------
    //  log
    // ---------------------------------------------------------------------------------------------------
    get wsId() { return this.constructor.name; }
}
exports.WebsocketIoClient = WebsocketIoClient;
//# sourceMappingURL=node-ws-io-client.js.map