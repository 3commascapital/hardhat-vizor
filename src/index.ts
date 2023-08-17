import '@nomiclabs/hardhat-ethers'
import { extendEnvironment } from "hardhat/config";
import { lazyObject } from "hardhat/plugins";

// This import is needed to let the TypeScript compiler know that it should include your type
// extensions in your npm package's types file.
import "./type-extensions";
import { Vizor } from "./Vizor";

extendEnvironment((hre) => {
  // We add a field to the Hardhat Runtime Environment here.
  // We use lazyObject to avoid initializing things until they are actually
  // needed.
  hre.vizor = lazyObject(() => new Vizor(hre));
});
