# CHANGELOG

This file is mirrored by `CHANGELOG.ca.md`. Keep both files synchronized.

All notable changes to `@metacodi/node-ws-io-client` should be documented in this file.

The format is based on `Keep a Changelog`, adapted to the needs of this package.

## [1.1.0] - 2026-03-19

### Summary

This release aligns `@metacodi/node-ws-io-client` with the `@metacodi/node-api-client` `1.1.x` authentication and default-request model. The package version moves from `1.0.13` to `1.1.0`.

There are no websocket runtime behavior changes in this release. The main impact is in peer dependency compatibility and in the way HTTP integration should now be configured in projects extending `WebsocketIoClient`.

### Changed

- Updated the `@metacodi/node-api-client` peer dependency from `^1.0.41` to `^1.1.1`.
- `WebsocketIoClientOptions`, which extends `ApiClientOptions`, now inherits the broader authentication and request-default configuration introduced by `@metacodi/node-api-client` `1.1.x`.
- Simplified the README integration example by removing manual `baseUrl()`, `getAuthHeaders()`, and `request()` overrides that are no longer required for the default API-client integration shown in the documentation.

### Migration Notes

- Review any project extending `WebsocketIoClient` and passing API-related constructor options. In particular, ensure `apiAuthMethod` and its related credentials are configured explicitly when the client also performs authenticated HTTP requests.
- Review any subclass overriding `request()` only to add default headers such as:
  - `Content-Type: application/json`
  - `Metacodi-Client-Type: server`
  - `User-Agent: Node.js`
  Those overrides may no longer be necessary after upgrading `@metacodi/node-api-client`.
- Review any subclass implementing token login or `401 Unauthorized` retry behavior in its own HTTP layer. That behavior may now be handled directly by the base `ApiClient`.

### Upgrade Risk

Projects upgrading from `1.0.13` to `1.1.0` without reviewing the inherited API-client behavior may end up with duplicated headers, conflicting authentication configuration, or login/retry logic being applied in a different layer than before.
