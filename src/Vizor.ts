import "@nomicfoundation/hardhat-toolbox";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export class Vizor {
  constructor(protected hre: HardhatRuntimeEnvironment) {}
  /**
   * impersonate
   * @param impersonatingAddress the address you wish to impersonate
   * @param fn a function to run while having access to that signer
   * @returns the result from the impersonate method or if a transaction is returned
   */
  public async impersonate<T>(
    impersonatingAddress: string,
    fn: (swa: SignerWithAddress) => Promise<T>,
    shouldWait = false
  ): Promise<T | ethers.ContractReceipt> {
    await this.hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [impersonatingAddress],
    });
    const result = await fn(
      await this.hre.ethers.getSigner(impersonatingAddress)
    );
    let receipt = null;
    if (
      shouldWait &&
      result &&
      ((result as unknown) as ethers.ContractTransaction).wait
    ) {
      receipt = (await ((result as unknown) as ethers.ContractTransaction).wait()) as ethers.ContractReceipt;
    }
    await this.hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [impersonatingAddress],
    });
    return receipt || result;
  }
}
