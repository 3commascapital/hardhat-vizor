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
impersonate account
```ts
// tests/MyContract.test.ts
// ...
await hre.vizor.impersonate("0xdeadbeef...", async (signer) => {
  // do something with impersonated deadbeef signer
})
```
attempt to verify contract
```ts
await hre.vizor.attemptVerify(
  contract, // deployedBaseContract
  [1, 2, 3], // args
  true, // print error if it occurs (default false)
)
```

reset a forked network
```ts
await hre.vizor.resetNetwork(
  forkConfig, // optional HardhatNetworkForkingUserConfig (defaults to hardhat.config.ts settings)
)
```
