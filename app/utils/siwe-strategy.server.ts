import { type SessionStorage } from "@remix-run/node"
import {
  type AuthenticateOptions,
  Strategy,
  type StrategyVerifyCallback,
} from "remix-auth"
import { SiweError, SiweMessage } from "siwe"
import { type VerifyOpts } from "siwe/dist/types"

export interface StrategyOptions {
  domain: string
  provider?: VerifyOpts["provider"]
}

type VerifierFn = {
  message: SiweMessage
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isStrategyOptions(value: unknown): value is StrategyOptions {
  return (
    // options must be a non-null object
    isRecord(value) &&
    // the domain is required
    typeof value.domain === "string"
  )
}

export class SiweStrategy<User> extends Strategy<User, VerifierFn> {
  name = "siwe"

  private options: StrategyOptions
  protected verify: StrategyVerifyCallback<User, VerifierFn>

  constructor(
    options: StrategyOptions,
    verify: StrategyVerifyCallback<User, VerifierFn>,
  ) {
    super(verify)

    if (!isStrategyOptions(options)) {
      throw new Error("invalid options object")
    }

    if (typeof verify !== "function") {
      throw new Error("verify is not a function")
    }

    this.options = options
    this.verify = verify
  }

  async authenticate(
    request: Request,
    sessionStorage: SessionStorage,
    options: AuthenticateOptions,
  ): Promise<User> {
    const formData = await request.formData()

    const message = formData.get("message")

    if (typeof message !== "string") {
      throw new Error(`request formData "message" is not a string`)
    }

    const signature = formData.get("signature")

    if (typeof signature !== "string") {
      throw new Error(`request formData "signature" is not a string`)
    }

    let siweMessage: SiweMessage

    try {
      siweMessage = new SiweMessage(message)
    } catch (err) {
      // SiweMessage constructor throws a SiweError an object-type message is invalid
      // https://github.com/spruceid/siwe/blob/23f7e17163ea15456b4afed3c28fb091b39feee3/packages/siwe/lib/client.ts#L352
      if (err instanceof SiweError) {
        return await this.failure(err.type, request, sessionStorage, options)
      }

      // SiweMessage constructor throws a generic Error if string message syntax is invalid
      // https://github.com/spruceid/siwe/blob/23f7e17163ea15456b4afed3c28fb091b39feee3/packages/siwe-parser/lib/abnf.ts#L327
      // the string message is parsed using the grammar defined in here:
      // https://github.com/spruceid/siwe/blob/23f7e17163ea15456b4afed3c28fb091b39feee3/packages/siwe-parser/lib/abnf.ts#L23)
      if (err instanceof Error) {
        return await this.failure(err.message, request, sessionStorage, options)
      }

      throw new Error(
        `SiweMessage constructor threw an unexpected error: ${String(err)}`,
      )
    }

    let user = {} as User

    try {
      const siweResponse = await siweMessage.verify(
        {
          signature: signature,
          domain: this.options.domain,
        },
        {
          provider: this.options.provider,
          suppressExceptions: true,
        },
      )

      if (!siweResponse.success && !siweResponse.error) {
        throw new Error(
          `siweResponse.success is false but no error was specified: ${JSON.stringify(
            siweResponse,
          )}`,
        )
      }

      if (siweResponse.error) {
        const { error } = siweResponse
        return await this.failure(error.type, request, sessionStorage, options)
      }

      const { data } = siweResponse

      user = await this.verify({ message: data })
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message)
      }

      if (typeof err === "string") {
        throw new Error(err)
      }

      throw err
    }

    return this.success(user, request, sessionStorage, options)
  }
}
