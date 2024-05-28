"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketIoClient = void 0;
const rxjs_1 = require("rxjs");
const socket_io_client_1 = require("socket.io-client");
const moment_1 = __importDefault(require("moment"));
const node_api_client_1 = require("@metacodi/node-api-client");
class WebsocketIoClient extends node_api_client_1.ApiClient {
    get status() { return this.connectionStatus; }
    set status(value) { const old = this.connectionStatus; this.connectionStatus = value; if (old !== value) {
        this.statusChanged.next(value);
    } }
    get isConnected() { return this.connectionStatus === 'connected' || this.connectionStatus === 'login'; }
    constructor(options) {
        super(options);
        this.options = options;
        this.debug = false;
        this.socket = undefined;
        this.connectionStatus = 'initial';
        this.statusChanged = new rxjs_1.Subject();
        this.initialReconnectPeriod = 5 * 1000;
        this.reconnectPeriod = 5 * 1000;
        this.maxReconnectPeriod = 5 * 60 * 1000;
        this.disconnectedAt = undefined;
        this.reconnectingTimeout = undefined;
        this.debug = !!(options === null || options === void 0 ? void 0 : options.local);
        if (this.debug) {
            console.log(this.wsId, '=>', process.cwd());
        }
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.destroy();
            const { url, path, query } = yield this.connection;
            this.socket = (0, socket_io_client_1.io)(url, Object.assign({ path, transports: ['polling'] }, { query }));
            if (this.debug) {
                console.log(this.wsId, '=> connecting', `${url}${path}`);
            }
            this.socket.on('connect', () => this.onConnect());
            this.socket.on('connect_error', (error) => this.onError(error));
            this.socket.on('disconnect', (reason, description) => this.onClose(`socket disconnect ${reason}`));
            return Promise.resolve();
        });
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
        setTimeout(() => this.connect(), this.reconnectPeriod);
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
    onConnect() {
        if (this.debug) {
            console.log(this.wsId, `=> ${this.status === 'reconnecting' ? 'reconnected!' : 'connected!'}`);
        }
        if (this.status === 'reconnecting') {
            this.setReconnectingTimeout();
        }
        this.status = 'connected';
        this.socket.io.engine.on('close', (reason) => this.onClose(`engine close: ${reason}`));
    }
    onError(error) {
        console.error(`${this.wsId} =>`, error.message);
    }
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
        if (!this.disconnectedAt) {
            const pingTimeout = 20 * 1000;
            this.disconnectedAt = (0, moment_1.default)().subtract(pingTimeout, 'milliseconds').format('YYYY-MM-DD HH:mm:ss');
            if (this.debug) {
                console.log(this.wsId, `=> disconnecting at ${this.disconnectedAt}`);
            }
        }
    }
    get wsId() { return this.constructor.name; }
}
exports.WebsocketIoClient = WebsocketIoClient;
//# sourceMappingURL=node-ws-io-client.js.map