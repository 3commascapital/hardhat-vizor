import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "ethers";

export type AddressTarget = string | ethers.Contract | SignerWithAddress

export const addressFromTarget = async (target: AddressTarget): Promise<string> => {
  if (typeof target === 'string') {
    return target
  }
  const contract = target as ethers.Contract
  if (contract.address) {
    return contract.address
  }
  return await (target as SignerWithAddress).getAddress()
}
