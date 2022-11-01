# node-ws-io-client

Abstracció d'un websocket basat en els paquets `socket.io` i `socket.io-client` per implementar en el runtime de NodeJS.

> També implementa el package `@metacodi/node-ws-io-client` que permet realitzar consultes a una api de backend.

## Install

```sh
npm i @metacodi@node-ws-io-client
```

## Use

`my-websocket-types.ts`

```typescript

export interface ClientToServerEvents {
  /** client -> informa de les seves dades després de connectar-se. */
  login: (data: any) => void;
  /** client -> sol·licita rebre actualitzacions del preu de mercat del símbol. */
  subscribePriceTicker: (exchange: ExchangeType, symbol: SymbolType) => void;
  unsubscribePriceTicker: (exchange: ExchangeType, symbol: SymbolType) => void;
}

export interface ServerToClientEvents {
  /** server -> subscriptors: preu de mercat actual. */
  priceTicker: (exchange: ExchangeType, price: MarketPrice) => void;
}

```

`my-websocket-service.ts`

```typescript
import { WebsocketIoClient, WebsocketIoClientOptions } from '@metacodi/node-ws-io-client';

import { ClientToServerEvents, ServerToClientEvents } from './my-websocket-types';


@Injectable({
  providedIn: 'root'
})
export class MyWebsocketService extends WebsocketIoClient {

  socket: Socket<ServerToClientEvents, ClientToServerEvents> = undefined;

  priceTickerSubject = new Subject<{ exchange: ExchangeType; price: MarketPrice }>();

  constructor(
    public options: WebsocketIoClientOptions,
  ) {
    super(options);
  }

  // ---------------------------------------------------------------------------------------------------
  //  Websocket subscription example
  // ---------------------------------------------------------------------------------------------------

  subscribePriceTicker(exchange: ExchangeType, symbol: SymbolType) {
    this.socket.emit('subscribePriceTicker', exchange, symbol);
  }
  unsubscribePriceTicker(exchange: ExchangeType, symbol: SymbolType) {
    this.socket.emit('unsubscribePriceTicker', exchange, symbol);
  }
  private onPriceTicker(exchange: ExchangeType, price: MarketPrice) {
    this.priceTickerSubject.next({ exchange, price });
  }


  // ---------------------------------------------------------------------------------------------------
  //  WebsocketIoClient implementation
  // ---------------------------------------------------------------------------------------------------
  
  get connection(): Promise<WsConnection> {
    const { local, idBot } = this.options;
    const url = local ? `http://localhost:3000` : this.options.url;
    const path = local ? `/socket.io` : this.options.path;
    const query = { type: 'bot', idreg: idBot };
    return Promise.resolve({ url, path, query });
  }

  connect() {
    await super.connect();

    this.socket.on('priceTicker', (exchange: ExchangeType, price: MarketPrice) => this.onPriceTicker(exchange, price));
  }

  protected onConnect() {
    super.onConnect();

    this.user.get().subscribe(user => {
      socket.emit('login', user);
    });

    this.respawnSubscriptions();
  }


  // ---------------------------------------------------------------------------------------------------
  //  ApiClient implementation
  // ---------------------------------------------------------------------------------------------------

  baseUrl(): string { return this.options.apiBaseUrl; }

  protected async getAuthHeaders(method: HttpMethod, endpoint: string, params: any) {
    return {
      'Authorization': 'SERVER',
      'Authorization-User': this.options.apiIdUser || 1,
    }; 
  }

  async request(method: HttpMethod, endpoint: string, options?: ApiRequestOptions): Promise<any> {

    if (!options) { options = {}; }
    options.headers = options.headers || {};
    options.headers['Content-Type'] = 'application/json';

    return super.request(method, endpoint, options);
  }
}
```
