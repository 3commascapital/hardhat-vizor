// tslint:disable-next-line no-implicit-dependencies
import { assert } from "chai";

import { useEnvironment } from "./helpers";
import { Vizor } from "./Vizor";

describe("Integration tests examples", function () {
  describe("Hardhat Runtime Environment extension", function () {
    useEnvironment("hardhat-project");

    it("Should add the example field", function () {
      assert.instanceOf(this.hre.vizor, Vizor);
    });
  });
});
