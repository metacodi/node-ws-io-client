# node-ws-io-client

A lightweight Node.js client abstraction for Socket.IO, built on top of `socket.io-client`. It also integrates with `@metacodi/node-api-client` to make authenticated HTTP requests to your backend alongside your realtime connection.

## Features
- Typed Socket.IO client with a simple lifecycle (connect, reconnect, close)
- Reconnect strategy with backoff and stable-connection guard
- Status notifications via RxJS `Subject`
- Optional HTTP client via `@metacodi/node-api-client`

## Installation
```sh
npm install @metacodi/node-ws-io-client
```

## Quick Start
1) Define your socket event types

`my-websocket-types.ts`
```ts
export interface ClientToServerEvents {
  // client -> identifies itself after connecting
  login: (data: any) => void;
  // client -> (un)subscribe to market price updates for a symbol
  subscribePriceTicker: (exchange: ExchangeType, symbol: SymbolType) => void;
  unsubscribePriceTicker: (exchange: ExchangeType, symbol: SymbolType) => void;
}

export interface ServerToClientEvents {
  // server -> subscribers: current market price
  priceTicker: (exchange: ExchangeType, price: MarketPrice) => void;
}
```

2) Extend `WebsocketIoClient`

`my-websocket-service.ts`
```ts
import { Subject } from 'rxjs';
import { Socket } from 'socket.io-client';
import { WebsocketIoClient, WebsocketIoClientOptions, WsConnection, HttpMethod, ApiRequestOptions } from '@metacodi/node-ws-io-client';
import { ClientToServerEvents, ServerToClientEvents } from './my-websocket-types';

export class MyWebsocketService extends WebsocketIoClient {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | undefined;

  priceTickerSubject = new Subject<{ exchange: ExchangeType; price: MarketPrice }>();

  constructor(public options: WebsocketIoClientOptions) {
    super(options);
  }

  // Example subscriptions
  subscribePriceTicker(exchange: ExchangeType, symbol: SymbolType) {
    this.socket?.emit('subscribePriceTicker', exchange, symbol);
  }
  unsubscribePriceTicker(exchange: ExchangeType, symbol: SymbolType) {
    this.socket?.emit('unsubscribePriceTicker', exchange, symbol);
  }
  private onPriceTicker(exchange: ExchangeType, price: MarketPrice) {
    this.priceTickerSubject.next({ exchange, price });
  }

  // WebsocketIoClient implementation
  get connection(): Promise<WsConnection> {
    const { local, idBot } = this.options;
    const url = local ? `http://localhost:3000` : this.options.url;
    const path = local ? `/socket.io` : this.options.path;
    const query = { type: 'bot', idreg: idBot };
    return Promise.resolve({ url, path, query });
  }

  async connect() {
    await super.connect();
    this.socket?.on('priceTicker', (exchange: ExchangeType, price: MarketPrice) => this.onPriceTicker(exchange, price));
  }

  protected onConnect() {
    super.onConnect();
    // Example: identify the user once connected
    this.user.get().subscribe(user => {
      this.socket?.emit('login', user);
    });
    this.respawnSubscriptions?.();
  }

  // ApiClient integration (optional)
  baseUrl(): string { return this.options.apiBaseUrl; }

  protected async getAuthHeaders(method: HttpMethod, endpoint: string, params: any) {
    return {
      'Authorization': 'SERVER',
      'Authorization-User': this.options.apiIdUser || 1,
    };
  }

  async request(method: HttpMethod, endpoint: string, options?: ApiRequestOptions): Promise<any> {
    options = options ?? {};
    options.headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    return super.request(method, endpoint, options);
  }
}
```

## API Overview
- Class `WebsocketIoClient`:
  - `connection: Promise<WsConnection>`: provide `{ url, path, query }` for Socket.IO
  - `connect()`: establishes the socket and binds core events
  - `reconnect()`: triggers reconnect with backoff
  - `close()`: cleans up listeners and disconnects
  - `statusChanged: Subject<WsConnectionState>`: emits connection state changes
  - `isConnected: boolean`: convenience flag for connected/login states

## Configuration
`WebsocketIoClientOptions` (selected fields used by examples):
- `local: boolean` — toggles localhost defaults
- `url: string` — remote Socket.IO server URL
- `path: string` — Socket.IO path (default `/socket.io`)
- `apiBaseUrl?: string` — base URL for HTTP requests
- `apiIdUser?: number` — example auth header value

## Contributing
- Issues and PRs are welcome. Please include reproduction steps, expected behavior, and environment details.

## License
MIT
