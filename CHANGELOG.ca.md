# CHANGELOG

Aquest fitxer es reflecteix a `CHANGELOG.md`. Mantingues tots dos fitxers sincronitzats.

Tots els canvis rellevants de `@metacodi/node-ws-io-client` s'han de documentar en aquest fitxer.

El format es basa en `Keep a Changelog`, adaptat a les necessitats d'aquest paquet.

## [Unreleased]

### Resum

L'API del paquet es normalitza cap a un model explícit de settings anidats per a les integracions HTTP i websocket.

### Canvis

- `WebsocketIoClientSettings` passa a ser l'entrada canònica del constructor de `WebsocketIoClient`.
- La configuració HTTP passa a viure a `settings.api`.
- La configuració websocket passa a viure a `settings.ws`.
- El README documenta ja el model normalitzat i elimina els exemples basats en propietats flat com `apiBaseUrl` o `apiAuthMethod`.

## [1.1.0] - 2026-03-19

### Resum

Aquesta versió alinea `@metacodi/node-ws-io-client` amb el model d'autenticació i de comportaments per defecte a les peticions de `@metacodi/node-api-client` `1.1.x`. La versió del paquet passa de `1.0.13` a `1.1.0`.

En aquesta versió no hi ha canvis de comportament al runtime websocket. L'impacte principal és en la compatibilitat de la peer dependency i en la manera com ara s'ha de configurar la integració HTTP als projectes que estenen `WebsocketIoClient`.

### Canvis

- S'actualitza la peer dependency `@metacodi/node-api-client` de `^1.0.41` a `^1.1.1`.
- `WebsocketIoClientOptions`, que estén `ApiClientOptions`, hereta ara la configuració ampliada d'autenticació i de valors per defecte de les peticions introduïda a `@metacodi/node-api-client` `1.1.x`.
- Se simplifica l'exemple d'integració del README eliminant les sobreescriptures manuals de `baseUrl()`, `getAuthHeaders()` i `request()`, que ja no són necessàries per a la integració per defecte del client API mostrada a la documentació.

### Notes de migració

- Revisa qualsevol projecte que estengui `WebsocketIoClient` i passi opcions del constructor relacionades amb l'API. En particular, assegura't que `apiAuthMethod` i les seves credencials associades estiguin configurades explícitament quan el client també faci peticions HTTP autenticades.
- Revisa qualsevol subclasse que sobreescrigui `request()` només per afegir headers per defecte com ara:
  - `Content-Type: application/json`
  - `Metacodi-Client-Type: server`
  - `User-Agent: Node.js`
  Aquestes sobreescriptures potser ja no són necessàries després d'actualitzar `@metacodi/node-api-client`.
- Revisa qualsevol subclasse que implementi el login basat en token o el retry de respostes `401 Unauthorized` dins de la seva pròpia capa HTTP. Aquest comportament ara pot quedar resolt directament al `ApiClient` base.

### Risc d'actualització

Els projectes que actualitzin de `1.0.13` a `1.1.0` sense revisar el comportament heretat del client API poden acabar amb headers duplicats, una configuració d'autenticació en conflicte o la lògica de login i retry aplicada en una capa diferent de la prevista.
