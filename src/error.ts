import * as ethers from 'ethers'
import { EthersError, ReturnValue, getParsedEthersError } from "@enzoferey/ethers-error-parser";
import _ from 'lodash';

type FragmentBundle = {
  interface?: ethers.utils.Interface;
  signature: string;
  fragment?: ethers.utils.ErrorFragment;
}

export const fragmentFromId = (interfaces: ethers.utils.Interface[], _id: string): FragmentBundle => {
  const id = _id.slice(0, 10)
  for (const intrfce of interfaces) {
    const found = Object.entries(intrfce.errors).find(([signature, fragment]) => {
      return ethers.utils.id(signature).slice(0, 10) === id
    })
    if (found) {
      return {
        interface: intrfce,
        signature: found[0],
        fragment: found[1],
      }
    }
  }
  return {
    signature: '',
  }
}

export const fromError = (err: EthersError, intrfce: ethers.utils.Interface | ethers.utils.Interface[] = []) => {
  return new CustomInterfaceError(err, _.isArray(intrfce) ? intrfce : [intrfce])
}

export type ErrorArgValue = string | ethers.BigNumber | boolean
export type ErrorArgKey = string | number
export type ErrorArgMap = Map<string | number, ErrorArgValue>

const defaultKeyValue = () => new Map<ErrorArgKey, ErrorArgValue>()

const defaultSetup = (cError: CustomInterfaceError, parsed: ReturnValue) => {
  cError.signature = ''
  cError.fragment = null
  cError.args = defaultKeyValue()
  cError.errorCode = parsed.errorCode
  cError.context = parsed.context || ''
}

export class CustomInterfaceError {
  intrfce!: ethers.utils.Interface | null;
  args!: ErrorArgMap;
  errorCode = 'CUSTOM_ERROR'
  context = 'custom error'
  signature!: string
  fragment!: ethers.utils.ErrorFragment | null
  constructor(
    protected err: EthersError,
    interfaces: ethers.utils.Interface[],
  ) {
    const anyError = err as any
    const defaultKeyValueArgs = new Map<ErrorArgKey, ErrorArgValue>()
    const data = anyError?.data
      || anyError?.error?.data
      || anyError?.error?.error?.data
      || anyError?.error?.error?.error?.data
      || anyError?.error?.error?.error?.error?.data
    const parsed = getParsedEthersError(err)
    if (!interfaces.length || parsed.errorCode !== "UNKNOWN_ERROR") {
      defaultSetup(this, parsed)
      return
    }
    const { interface: intrfce, signature, fragment } = fragmentFromId(interfaces, data)
    if (!signature) {
      defaultSetup(this, parsed)
      return
    }
    this.intrfce = intrfce || null
    const argsData = data.slice(10)
    const keyValueArgs = fragment?.inputs.reduce((args, paramType, index) => {
      const contentLength = 64
      const contentStart = index * contentLength
      const content = argsData.slice(contentStart, contentStart + contentLength)
      const argAsValue = parseArg(paramType.type, content)
      args.set(paramType.name, argAsValue)
      return args
    }, defaultKeyValueArgs) || defaultKeyValueArgs
    this.fragment = fragment || null
    this.signature = signature
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
    return this.fragment?.name || null
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
  matches(matchers: Record<string, any>) {
    const {
      args,
      ...remainingMatchers
    } = matchers
    return _.matches(remainingMatchers)(this) && (!args || !_.find([...args.entries()], _.reject(
      ([key, value]: [string, any]) => {
        const existing = this.args.get(key)
        if (ethers.BigNumber.isBigNumber(existing)) {
          return existing.eq(value)
        }
        return existing === value
      },
    )))
  }
}

export const parseArg = (type: string, content: string) => {
  if (type.includes('uint')) {
    return ethers.BigNumber.from(`0x${content}`)
  }
  if (type.includes('int')) {
    return ethers.BigNumber.from(`0x${content}`).sub(ethers.constants.MaxInt256)
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
