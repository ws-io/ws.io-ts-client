# Changelog

## v0.3.4

[compare changes](https://github.com/ws-io/ws.io-ts-client/compare/v0.3.3...v0.3.4)

### 🩹 Fixes

- Correct misplaced `cancelled` getter ([95a5123](https://github.com/ws-io/ws.io-ts-client/commit/95a5123))

### ❤️ Contributors

- Kiki-kanri

## v0.3.3

[compare changes](https://github.com/ws-io/ws.io-ts-client/compare/v0.3.2...v0.3.3)

### 🚀 Enhancements

- Add `cancelled` support to runtime; create token on `connect`, trigger on `disconnect`, and await `cancelled` in `runConnection` to prevent deadlocks from unexpected errors ([d4bb9ad](https://github.com/ws-io/ws.io-ts-client/commit/d4bb9ad))

### 🏡 Chore

- Upgrade deps ([b739e96](https://github.com/ws-io/ws.io-ts-client/commit/b739e96))

### ❤️ Contributors

- Kiki-kanri

## v0.3.2

[compare changes](https://github.com/ws-io/ws.io-ts-client/compare/v0.3.1...v0.3.2)

### 💅 Refactors

- Move ping-interval timer initialization into `ws.onopen` ([2d9935d](https://github.com/ws-io/ws.io-ts-client/commit/2d9935d))

### 🏡 Chore

- Update deps ([1143ad4](https://github.com/ws-io/ws.io-ts-client/commit/1143ad4))

### ❤️ Contributors

- Kiki-kanri

## v0.3.1

[compare changes](https://github.com/ws-io/ws.io-ts-client/compare/v0.3.0...v0.3.1)

### 📖 Documentation

- Update README ([830b32d](https://github.com/ws-io/ws.io-ts-client/commit/830b32d))

### 🏡 Chore

- Mark immutable class properties as readonly ([321f9cc](https://github.com/ws-io/ws.io-ts-client/commit/321f9cc))
- Unify and organize all default timeout durations ([81ad8aa](https://github.com/ws-io/ws.io-ts-client/commit/81ad8aa))

### ❤️ Contributors

- Kiki-kanri

## v0.3.0

[compare changes](https://github.com/ws-io/ws.io-ts-client/compare/v0.2.9...v0.3.0)

### 💅 Refactors

- ⚠️  Restructure packet codec definitions ([9226377](https://github.com/ws-io/ws.io-ts-client/commit/9226377))

#### ⚠️ Breaking Changes

- ⚠️  Restructure packet codec definitions ([9226377](https://github.com/ws-io/ws.io-ts-client/commit/9226377))

### ❤️ Contributors

- Kiki-kanri

## v0.2.9

[compare changes](https://github.com/ws-io/ws.io-ts-client/compare/v0.2.8...v0.2.9)

### 🚀 Enhancements

- Send periodic 1-byte ping after ready to keep connection alive and close on send failure ([1e23c80](https://github.com/ws-io/ws.io-ts-client/commit/1e23c80))

### 🩹 Fixes

- Correct `isNativeAccelerationEnabled` check and warn output logic in `cbor` and `msgpack` packet codecs ([4856f31](https://github.com/ws-io/ws.io-ts-client/commit/4856f31))

### 💅 Refactors

- Replace `Uint8Array.from` with `new Uint8Array` ([2e74d86](https://github.com/ws-io/ws.io-ts-client/commit/2e74d86))

### ❤️ Contributors

- Kiki-kanri

## v0.2.8

[compare changes](https://github.com/ws-io/ws.io-ts-client/compare/v0.2.7...v0.2.8)

### 🩹 Fixes

- Correct callback type parameter when registering events ([f2d20da](https://github.com/ws-io/ws.io-ts-client/commit/f2d20da))

### ❤️ Contributors

- Kiki-kanri

## v0.2.7

[compare changes](https://github.com/ws-io/ws.io-ts-client/compare/v0.2.6...v0.2.7)

### 🩹 Fixes

- Correct default config merging logic ([f9492d0](https://github.com/ws-io/ws.io-ts-client/commit/f9492d0))

### ❤️ Contributors

- Kiki-kanri

## v0.2.6

[compare changes](https://github.com/ws-io/ws.io-ts-client/compare/v0.2.5...v0.2.6)

### 🩹 Fixes

- Correct default config merging logic ([38ec165](https://github.com/ws-io/ws.io-ts-client/commit/38ec165))

### ❤️ Contributors

- Kiki-kanri

## v0.2.5

[compare changes](https://github.com/ws-io/ws.io-ts-client/compare/v0.2.4...v0.2.5)

### 🩹 Fixes

- Ensure events map type is correctly passed into `WsIoClient` ([b1259cb](https://github.com/ws-io/ws.io-ts-client/commit/b1259cb))

### 🏡 Chore

- Rename `msgPack` to `msgpack` ([91ee6a2](https://github.com/ws-io/ws.io-ts-client/commit/91ee6a2))

### ❤️ Contributors

- Kiki-kanri

## v0.2.4

[compare changes](https://github.com/ws-io/ws.io-ts-client/compare/v0.2.3...v0.2.4)

### 🩹 Fixes

- Ensure events map type is correctly passed into WsIoClient ([18db27c](https://github.com/ws-io/ws.io-ts-client/commit/18db27c))

### 🏡 Chore

- Update CHANGELOG ([810980b](https://github.com/ws-io/ws.io-ts-client/commit/810980b))

### ❤️ Contributors

- Kiki-kanri

## v0.2.3

[compare changes](https://github.com/ws-io/ws.io-ts-client/compare/v0.2.2...v0.2.3)

### 💅 Refactors

- Adjust timing of status check in handle event packet ([d427b8e](https://github.com/ws-io/ws.io-ts-client/commit/d427b8e))

### 🏡 Chore

- Change `??=` to `||=` ([34afd8e](https://github.com/ws-io/ws.io-ts-client/commit/34afd8e))

### ❤️ Contributors

- Kiki-kanri

## v0.2.2

[compare changes](https://github.com/ws-io/ws.io-ts-client/compare/v0.2.1...v0.2.2)

### 💅 Refactors

- Replace `WsIoPacket.#new` to `private static new` ([8444a48](https://github.com/ws-io/ws.io-ts-client/commit/8444a48))

### ❤️ Contributors

- Kiki-kanri

## v0.2.1

[compare changes](https://github.com/ws-io/ws.io-ts-client/compare/v0.2.0...v0.2.1)

### 🏡 Chore

- Update tsdown entry config ([bccadd4](https://github.com/ws-io/ws.io-ts-client/commit/bccadd4))

### ❤️ Contributors

- Kiki-kanri

## v0.2.0

[compare changes](https://github.com/ws-io/ws.io-ts-client/compare/v0.1.0...v0.2.0)

### 🚀 Enhancements

- Add `update-peer-dependencies-meta.ts` ([643c006](https://github.com/ws-io/ws.io-ts-client/commit/643c006))
- Add enum utils ([007a332](https://github.com/ws-io/ws.io-ts-client/commit/007a332))
- Add `WsIoClientConfig` interface ([3528759](https://github.com/ws-io/ws.io-ts-client/commit/3528759))
- Add files and other change ([2012e01](https://github.com/ws-io/ws.io-ts-client/commit/2012e01))
- Add json packet codec ([fc0efb2](https://github.com/ws-io/ws.io-ts-client/commit/fc0efb2))
- Add `sleep` utils ([b8a514f](https://github.com/ws-io/ws.io-ts-client/commit/b8a514f))
- Add `AtomicStatus` class ([f68933e](https://github.com/ws-io/ws.io-ts-client/commit/f68933e))
- Update and unify packet definitions, implement and complete JSON, MessagePack, and CBOR codecs ([b4d9a56](https://github.com/ws-io/ws.io-ts-client/commit/b4d9a56))
- Implement initial runtime, session, and connection establishment with handshake completion ([7fc7693](https://github.com/ws-io/ws.io-ts-client/commit/7fc7693))
- Interrupt reconnection wait sleep immediately when `disconnect` is called ([7760631](https://github.com/ws-io/ws.io-ts-client/commit/7760631))
- Handle disconnect packet ([cb9d45b](https://github.com/ws-io/ws.io-ts-client/commit/cb9d45b))
- Add `AsyncQueue` class ([999f184](https://github.com/ws-io/ws.io-ts-client/commit/999f184))
- Update `WsIoClientRuntime` ([bc6ddd1](https://github.com/ws-io/ws.io-ts-client/commit/bc6ddd1))
- Implement initial emit, buffer, and auto-resend functionality ([f563f52](https://github.com/ws-io/ws.io-ts-client/commit/f563f52))
- Implement initial event registrar and invocation functionality ([7992d85](https://github.com/ws-io/ws.io-ts-client/commit/7992d85))

### 🩹 Fixes

- Resolve alias configuration error in tsdown setup ([656e2e0](https://github.com/ws-io/ws.io-ts-client/commit/656e2e0))
- Add missing -b flag to typecheck command ([cf0c795](https://github.com/ws-io/ws.io-ts-client/commit/cf0c795))
- Remove custom exports configuration from tsdown ([efb18bc](https://github.com/ws-io/ws.io-ts-client/commit/efb18bc))
- Remove tsdown `remove-types-js` plugin ([6922c2f](https://github.com/ws-io/ws.io-ts-client/commit/6922c2f))
- Remove tsdown remove-types-js plugin and custom exports configuration ([735a3a9](https://github.com/ws-io/ws.io-ts-client/commit/735a3a9))
- Ensure tsdown `customExports` returns after deleting keys containing internals ([7324bab](https://github.com/ws-io/ws.io-ts-client/commit/7324bab))
- Correct type checking logic in WsIoPacket.fromInner for inner packet ([52acdb0](https://github.com/ws-io/ws.io-ts-client/commit/52acdb0))

### 💅 Refactors

- **tsconfig:** Separate references so src and tests use different settings ([df472e2](https://github.com/ws-io/ws.io-ts-client/commit/df472e2))
- Rename func parameters in `arr.map` and similar methods to `item` for consistency ([c5768ac](https://github.com/ws-io/ws.io-ts-client/commit/c5768ac))
- Tidy up code ([1a92f2c](https://github.com/ws-io/ws.io-ts-client/commit/1a92f2c))
- Change config `initHandler` data and return type to any ([b067cb9](https://github.com/ws-io/ws.io-ts-client/commit/b067cb9))
- Update `AsyncQueue` ([9c9125d](https://github.com/ws-io/ws.io-ts-client/commit/9c9125d))

### 📖 Documentation

- Update README badges urls ([499bc71](https://github.com/ws-io/ws.io-ts-client/commit/499bc71))
- Replace `%2F` with `/` in badge URLs in README ([4aaf916](https://github.com/ws-io/ws.io-ts-client/commit/4aaf916))
- Update README ([63ba464](https://github.com/ws-io/ws.io-ts-client/commit/63ba464))

### 📦 Build

- ⚠️  Switch builder to tsdown and convert package to pure ESM ([d307be4](https://github.com/ws-io/ws.io-ts-client/commit/d307be4))
- Clean up js files under `dist/types` after tsdown build and update exports config ([2affd31](https://github.com/ws-io/ws.io-ts-client/commit/2affd31))
- Clean up js files under `dist/types` after tsdown build and update exports config ([299e647](https://github.com/ws-io/ws.io-ts-client/commit/299e647))
- Clean up js files under `dist/types` after tsdown build and update exports config ([6fa1d2b](https://github.com/ws-io/ws.io-ts-client/commit/6fa1d2b))
- Update tsdown config to treat all dependencies as external ([f5e4f7a](https://github.com/ws-io/ws.io-ts-client/commit/f5e4f7a))
- Update tsdown customExports to remove entries with keys containing "internals" ([59b1622](https://github.com/ws-io/ws.io-ts-client/commit/59b1622))
- Update tsdown entry ([2e67d6b](https://github.com/ws-io/ws.io-ts-client/commit/2e67d6b))
- Set tsdown external from package.json instead of using wildcard * ([7dc5f28](https://github.com/ws-io/ws.io-ts-client/commit/7dc5f28))
- Update `customExports` rules to enable IDE import hints for package usage ([e4111c0](https://github.com/ws-io/ws.io-ts-client/commit/e4111c0))
- Update `customExports` rules to enable IDE import hints for package usage ([fa88888](https://github.com/ws-io/ws.io-ts-client/commit/fa88888))

### 🏡 Chore

- Format script ([16ca049](https://github.com/ws-io/ws.io-ts-client/commit/16ca049))
- Update file permissions after installing or updating dependencies ([d141f76](https://github.com/ws-io/ws.io-ts-client/commit/d141f76))
- Add `--hideAuthorEmail` flag to bumplog command ([382091b](https://github.com/ws-io/ws.io-ts-client/commit/382091b))
- Add typecheck command to package.json scripts ([2a1f7e0](https://github.com/ws-io/ws.io-ts-client/commit/2a1f7e0))
- Rename `jest.config.js` to `jest.config.mjs` ([76371a1](https://github.com/ws-io/ws.io-ts-client/commit/76371a1))
- Reorder lint, test, and build steps in release command ([b63dcb4](https://github.com/ws-io/ws.io-ts-client/commit/b63dcb4))
- Disable `isolatedDeclarations` in tsconfig ([ed1636f](https://github.com/ws-io/ws.io-ts-client/commit/ed1636f))
- Update `modify-files-permissions.sh` ([89f72e3](https://github.com/ws-io/ws.io-ts-client/commit/89f72e3))
- Add option to `upgrade-dependencies.sh` to clean `node_modules` and `pnpm-lock.yaml` before upgrading ([e542b14](https://github.com/ws-io/ws.io-ts-client/commit/e542b14))
- Upgrade dependencies ([d3ee5a7](https://github.com/ws-io/ws.io-ts-client/commit/d3ee5a7))
- Ensure all scripts change to their own directory before execution ([9be5fbf](https://github.com/ws-io/ws.io-ts-client/commit/9be5fbf))
- Update ignore files ([c81c294](https://github.com/ws-io/ws.io-ts-client/commit/c81c294))
- **scripts:** Ensure all scripts `cd` to their current directory correctly ([5362c3b](https://github.com/ws-io/ws.io-ts-client/commit/5362c3b))
- Set `--max-warnings=0` for `lint` and `lint:fix` ([bffe476](https://github.com/ws-io/ws.io-ts-client/commit/bffe476))
- Set eslint config to enable `lib` mode ([59e03e4](https://github.com/ws-io/ws.io-ts-client/commit/59e03e4))
- Disable `ts/explicit-function-return-type` eslint rule ([5190f6b](https://github.com/ws-io/ws.io-ts-client/commit/5190f6b))
- Lint code ([f8f0974](https://github.com/ws-io/ws.io-ts-client/commit/f8f0974))
- **test:** Migrate from `jest` to `vitest` ([9a9d869](https://github.com/ws-io/ws.io-ts-client/commit/9a9d869))
- Split `tsconfig` and create build-specific config for production builds ([564b6d2](https://github.com/ws-io/ws.io-ts-client/commit/564b6d2))
- **vitest:** Configure coverage to collect files only under `src/` ([e2c7f65](https://github.com/ws-io/ws.io-ts-client/commit/e2c7f65))
- Upgrade dependencies and remove `@types/node` ([32aaf31](https://github.com/ws-io/ws.io-ts-client/commit/32aaf31))
- Wrap all variable expansions in scripts with `${}` ([82c47c9](https://github.com/ws-io/ws.io-ts-client/commit/82c47c9))
- Update dependencies and modify scripts ([374cc56](https://github.com/ws-io/ws.io-ts-client/commit/374cc56))
- ⚠️  Drop support for Node.js 18.12.1, set minimum supported version to 20 ([32c6ad3](https://github.com/ws-io/ws.io-ts-client/commit/32c6ad3))
- Bump tsconfig target to es2023 ([b9185b7](https://github.com/ws-io/ws.io-ts-client/commit/b9185b7))
- Update `.gitignore` ([1465997](https://github.com/ws-io/ws.io-ts-client/commit/1465997))
- **ci:** Configure pnpm cache in workflow ([79e2264](https://github.com/ws-io/ws.io-ts-client/commit/79e2264))
- **ci:** Remove pnpm cache configure in workflow ([abc0801](https://github.com/ws-io/ws.io-ts-client/commit/abc0801))
- ⚠️  Drop support for Node.js 20, set minimum supported version to 22 ([3319820](https://github.com/ws-io/ws.io-ts-client/commit/3319820))
- Upgrade devDependencies ([57244a0](https://github.com/ws-io/ws.io-ts-client/commit/57244a0))
- Set tsdown alias and tsconfig paths ([be49779](https://github.com/ws-io/ws.io-ts-client/commit/be49779))
- Update tsdown config ([fc9e7cb](https://github.com/ws-io/ws.io-ts-client/commit/fc9e7cb))
- Add `tsconfig.base.json` ([f6ba6dd](https://github.com/ws-io/ws.io-ts-client/commit/f6ba6dd))
- Update eslint config ([99cd82e](https://github.com/ws-io/ws.io-ts-client/commit/99cd82e))
- Update tsdown entry ([9cbb6bb](https://github.com/ws-io/ws.io-ts-client/commit/9cbb6bb))
- Disable `isolatedDeclarations` ([85f066e](https://github.com/ws-io/ws.io-ts-client/commit/85f066e))
- Update eslint config ([09d584b](https://github.com/ws-io/ws.io-ts-client/commit/09d584b))
- Update all scripts ([fa5e797](https://github.com/ws-io/ws.io-ts-client/commit/fa5e797))
- Set minimum supported version to 22.12.0 ([76e8cc1](https://github.com/ws-io/ws.io-ts-client/commit/76e8cc1))
- Remove alias config ([e353604](https://github.com/ws-io/ws.io-ts-client/commit/e353604))
- Change `update-peer-dependencies-meta.ts` to non-executable permission file ([62a7690](https://github.com/ws-io/ws.io-ts-client/commit/62a7690))
- Update base tsconfig ([26f4158](https://github.com/ws-io/ws.io-ts-client/commit/26f4158))
- Add `.editorconfig` ([11056ce](https://github.com/ws-io/ws.io-ts-client/commit/11056ce))
- Upgrade devDependencies ([aca04e8](https://github.com/ws-io/ws.io-ts-client/commit/aca04e8))
- Replace `@kikiutils/changelogen` with `changelogen` ([8d1d648](https://github.com/ws-io/ws.io-ts-client/commit/8d1d648))
- Update script ([44312fb](https://github.com/ws-io/ws.io-ts-client/commit/44312fb))
- Update `pnpm.onlyBuiltDependencies` ([9788a78](https://github.com/ws-io/ws.io-ts-client/commit/9788a78))
- Upgrade dependencies ([419b739](https://github.com/ws-io/ws.io-ts-client/commit/419b739))
- Update tsdown config ([59407a9](https://github.com/ws-io/ws.io-ts-client/commit/59407a9))
- Disable tsdown `fixedExtension` config ([9039405](https://github.com/ws-io/ws.io-ts-client/commit/9039405))
- Upgrade deps ([397b08f](https://github.com/ws-io/ws.io-ts-client/commit/397b08f))
- Log warn if cbor-x or msgpackr native acceleration disabled at node env ([c524162](https://github.com/ws-io/ws.io-ts-client/commit/c524162))
- Update eslint config ([e75c3d7](https://github.com/ws-io/ws.io-ts-client/commit/e75c3d7))
- Upgrade deps ([35eeee6](https://github.com/ws-io/ws.io-ts-client/commit/35eeee6))
- Add missing deps ([b7d4087](https://github.com/ws-io/ws.io-ts-client/commit/b7d4087))
- Update some comments ([8e4347d](https://github.com/ws-io/ws.io-ts-client/commit/8e4347d))

### ✅ Tests

- Add pass test unit ([d7b98bd](https://github.com/ws-io/ws.io-ts-client/commit/d7b98bd))
- Change vitest config file to mjs ([5c3bc1f](https://github.com/ws-io/ws.io-ts-client/commit/5c3bc1f))
- Fix vitest config to correctly load tsconfig and aliases ([0522f79](https://github.com/ws-io/ws.io-ts-client/commit/0522f79))

### 🤖 CI

- Add test github workflow config file ([dd421d1](https://github.com/ws-io/ws.io-ts-client/commit/dd421d1))
- Update test workflow ([1519e46](https://github.com/ws-io/ws.io-ts-client/commit/1519e46))
- Update condition for uploading to Codecov in workflow job ([39851ac](https://github.com/ws-io/ws.io-ts-client/commit/39851ac))
- Set `--prod=false` when install dependencies ([93d7945](https://github.com/ws-io/ws.io-ts-client/commit/93d7945))
- Remove `--prod=false` flag when install dependencies ([249def0](https://github.com/ws-io/ws.io-ts-client/commit/249def0))
- Update config file ([cfba23c](https://github.com/ws-io/ws.io-ts-client/commit/cfba23c))

#### ⚠️ Breaking Changes

- ⚠️  Switch builder to tsdown and convert package to pure ESM ([d307be4](https://github.com/ws-io/ws.io-ts-client/commit/d307be4))
- ⚠️  Drop support for Node.js 18.12.1, set minimum supported version to 20 ([32c6ad3](https://github.com/ws-io/ws.io-ts-client/commit/32c6ad3))
- ⚠️  Drop support for Node.js 20, set minimum supported version to 22 ([3319820](https://github.com/ws-io/ws.io-ts-client/commit/3319820))

### ❤️ Contributors

- Kiki-kanri

## v0.1.0

[compare changes](https://github.com/ws-io/ws.io-ts-client/compare/1faa564b...v0.1.0)

### 🏡 Chore

- Upgrade dependencies ([a34f75c](https://github.com/ws-io/ws.io-ts-client/commit/a34f75c))
- Set package metadata ([7ac8434](https://github.com/ws-io/ws.io-ts-client/commit/7ac8434))
- Add empty index file ([206123d](https://github.com/ws-io/ws.io-ts-client/commit/206123d))

### ❤️ Contributors

- Kiki-kanri
