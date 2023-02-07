import * as ethers from 'ethers'
import { EthersError, getParsedEthersError } from "@enzoferey/ethers-error-parser";
import _ from 'lodash';

export const parse = (err: any, intrfce: ethers.utils.Interface) => {
  const parsed = getParsedEthersError(err as EthersError)
  if (!intrfce || parsed.errorCode !== "UNKNOWN_ERROR") {
    return parsed
  }
  // only message is possible
  // try to parse custom
  const found = fragmentFromId(intrfce, err.data)
  if (!found) {
    return
  }
  const [signature, fragment] = found
  const argsData = err.data.slice(10)
  const parsedArgs = fragment.inputs.reduce((args, paramType, index) => {
    const contentLength = 64
    const contentStart = index * contentLength
    const content = argsData.slice(contentStart, contentStart + contentLength)
    const argAsValue = parseArg(paramType.type, content)
    args.set(paramType.name, argAsValue)
    return args
  }, new Map<number | string, string | boolean | ethers.BigNumber>())
  return new CustomInterfaceError(
    intrfce,
    signature,
    parsedArgs,
    fragment,
  )
}

export const fragmentFromId = (intrfce: ethers.utils.Interface, _id: string) => {
  const id = _id.slice(0, 10)
  return Object.entries(intrfce.errors).find(([signature, fragment]) => {
    return ethers.utils.id(signature).slice(0, 10) === id
  })
}

export type ErrorArgValue = string | ethers.BigNumber | boolean
export type ErrorArgMap = Map<string | number, ErrorArgValue>

export class CustomInterfaceError {
  args: ErrorArgMap;
  errorCode = 'CUSTOM_ERROR'
  fragment: ethers.utils.ErrorFragment
  constructor(
    protected intrfce: ethers.utils.Interface,
    protected signature: string,
    protected keyValueArgs: ErrorArgMap,
    fragmentOrData?: ethers.utils.ErrorFragment | string,
  ) {
    const found = (_.isString(fragmentOrData)
      ? fragmentFromId(intrfce, fragmentOrData)
      : [signature, fragmentOrData] as [string, ethers.utils.ErrorFragment])
    if (!found) {
      throw new Error('unable to find fragment')
    }
    const [, fragment] = found
    this.fragment = fragment
    this.args = new Map(_.flatMap([...keyValueArgs.entries()], ([key, value], index) => ([
      [key, value],
      [index, value],
      [`${index}`, value],
    ]))) as ErrorArgMap
  }
  interface() {
    return this.intrfce
  }
  name() {
    return this.fragment.name
  }
  argSeries() {
    return [...this.args.entries()].reduce((series, [key, value]) => {
      if (_.isNumber(key)) {
        series.push(value)
      }
      return series
    }, [] as ErrorArgValue[])
  }
  argHash() {
    return [...this.args.entries()].reduce((hash, [key, value]) => {
      if (!_.isNumber(+key)) {
        hash[key] = value
      }
      return hash
    }, {} as Record<string, ErrorArgValue>)
  }
}

export const parseArg = (type: string, content: string) => {
  if (type.includes('uint')) {
    return ethers.BigNumber.from(`0x${content}`)
  }
  if (type.includes('int')) {
    return ethers.BigNumber.from(`0x${content}`).sub(ethers.constants.MaxInt256.div(2))
  }
  if (type === 'address') {
    return ethers.utils.getAddress(`0x${content.slice(64-40)}`)
  }
  if (type.includes('boolean')) {
    return content[content.length - 1] === '1'
  }
  if (type.includes('string') || type.includes('byte')) {
    return `0x${content}`
  }
  console.log(type, content)
  throw new Error('unsupported type!')
}
