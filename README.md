# Hardhat Vizor

This plugin adds tooling to help quickly run tasks related to low level needs when interacting with the hre.

## Installation

To start working on your project, just run

```bash
npm install
```

## Building the project

Just run `npm run build` ️👷

## Usage in your projects

```ts
// hardhat.config.ts
import "hardhat-vizor"
```
```ts
// tests/MyContract.test.ts
// ...
await hre.vizor.impersonate("0xdeadbeef...", async (signer) => {
  // do something with impersonated deadbeef signer
})
```
