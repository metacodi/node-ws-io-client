# node-ws-io-client

Base compartida per clients Socket.IO en serveis Node.js que, a més, necessiten fer peticions HTTP autenticades al backend. La classe `WebsocketIoClient` estén `ApiClient`, de manera que el mateix client pot gestionar:

- la connexió websocket;
- la reconnexió amb backoff;
- i les peticions HTTP cap a una API relacionada.

## Instal·lació

```sh
npm install @metacodi/node-ws-io-client
```

## Model de `Settings`

`WebsocketIoClient` ja no rep un objecte flat amb propietats com `apiBaseUrl` o `apiAuthMethod`. El model actual separa cada capa pel seu context:

```ts
import type { HttpApiSettings } from '@metacodi/node-api-client';
import type { WebsocketIoClientSettings } from '@metacodi/node-ws-io-client';

const settings: WebsocketIoClientSettings = {
  api: {
    url: 'https://taxi.metacodi.com/dev/api',
    auth: {
      method: 'headerToken',
      email: 'gateway@metacodi.com',
      password: '***',
    },
  } satisfies HttpApiSettings,
  ws: {
    url: 'https://taxi.metacodi.com',
    urlLocal: 'http://localhost:3000',
    path: '/dev/ws/socket.io',
  },
  reconnect: {
    initialDelayMs: 5000,
    maxDelayMs: 300000,
  },
  debug: false,
};
```

## Exemple complet

```ts
import { Socket } from 'socket.io-client';

import type { HttpApiRequestOptions } from '@metacodi/node-api-client';
import {
  WebsocketIoClient,
  WebsocketIoClientSettings,
  WsConnection,
} from '@metacodi/node-ws-io-client';

interface WebsocToGatewayEvents {
  gatewayConnected: (provider: string) => void;
}

interface GatewayToWebsocEvents {
  login: (payload: { type: string }) => void;
}

export class ExampleGatewayClient extends WebsocketIoClient {
  declare socket: Socket<WebsocToGatewayEvents, GatewayToWebsocEvents> | undefined;

  public constructor(
    public readonly settings: WebsocketIoClientSettings,
  ) {
    super(settings);
  }

  public get connection(): Promise<WsConnection> {
    const ws = this.settings.ws;

    if (!ws) {
      throw new Error('Falten els settings websocket.');
    }

    return Promise.resolve({
      url: ws.urlLocal ?? ws.url,
      path: ws.path ?? '/socket.io',
      query: { type: 'example-gateway' },
    });
  }

  public override async connect() {
    await super.connect();
    this.socket?.on('gatewayConnected', provider => {
      if (this.debug) {
        console.log(this.wsId, '=> gatewayConnected', provider);
      }
    });
  }

  protected override onConnect() {
    super.onConnect();
    this.socket?.emit('login', { type: 'example-gateway' });
  }

  public fetchPendingMessages(
    params: HttpApiRequestOptions['params'],
  ) {
    return this.get('pendingMessages', { params });
  }
}
```

## Què resol la classe base

`WebsocketIoClient` resol directament:

- el cicle `connect -> reconnect -> close`;
- l’acumulació progressiva del backoff de reconnexió;
- la notificació d’estat via `statusChanged`;
- la integració HTTP heretada d’`ApiClient`.

La subclasse continua sent responsable de:

- construir `connection`;
- subscriure’s als events propis del seu protocol;
- decidir com fa login o identificació per websocket;
- decidir quines crides HTTP necessita fer cap al backend.

## API principal

- `connection: Promise<WsConnection>`: la subclasse ha de retornar `{ url, path, query }`.
- `connect()`: obre el socket i registra els listeners bàsics.
- `reconnect()`: programa una reconnexió amb backoff.
- `close()`: desconnecta i neteja listeners.
- `statusChanged`: `Subject<WsConnectionState>` amb els canvis d’estat.
- `isConnected`: retorna `true` quan el client està en estat `connected` o `login`.

## Notes d’integració

- Els tipus HTTP canònics (`HttpApiSettings`, `HttpApiRequestOptions`) pertanyen a `@metacodi/node-api-client`.
- `WebsocketIoClientSettings` només referencia aquests tipus; no els duplica.
- Si una app ja treballa amb `@metacodi/node-runtime`, el normal és construir `settings.api` des de `integrations.backend.api` i `settings.ws` des de `integrations.<servei>.ws`.

## Llicència

MIT
