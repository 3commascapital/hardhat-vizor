import "@nomicfoundation/hardhat-toolbox";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "ethers";
import {
  HardhatNetworkForkingUserConfig,
  HardhatRuntimeEnvironment,
} from "hardhat/types";
import {
  addressFromTarget,
} from './utils'

export class Vizor {
  static addressFromTarget = addressFromTarget;
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
  public async resetNetwork(args: HardhatNetworkForkingUserConfig) {
    if (args.blockNumber) {
      args.blockNumber = +args.blockNumber;
    }
    await this.hre.network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            ...this.hre.config.networks.hardhat.forking,
            ...(this.hre.userConfig.networks?.hardhat?.forking || {}),
            ...args,
          },
        },
      ],
    });
  }
  async attemptVerify(contract: ethers.BaseContract, args: any[] = [], printFailure = false) {
    // contract.deployTransaction
    await this.hre.run('verify:verify', {
      address: contract.address,
      constructorArguments: args,
    }).catch((err: any) => {
      if (printFailure) {
        console.log(err)
      }
    })
  }
}
