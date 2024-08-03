import { db } from "db.server"

export type Database =
  | typeof db
  | Parameters<Parameters<typeof db.transaction>[0]>[0]

export type DbFunctionParams<P extends Record<string, unknown>> = P & {
  tx: Database
}

export type DbFunction<P extends Record<string, unknown>, R> = (
  params: DbFunctionParams<P>,
) => Promise<R>

export function wrapDbFunction<P extends Record<string, unknown>, R>(
  fn: DbFunction<P, R>,
): (params: Omit<P, "tx"> & { tx?: Database }) => Promise<R> {
  return async (params: Omit<P, "tx"> & { tx?: Database }) => {
    if (params.tx) {
      // If a transaction is provided, use it
      return fn(params as DbFunctionParams<P>)
    } else {
      // If no transaction is provided, create a new one
      return db.transaction(async tx => {
        return fn({ ...params, tx } as DbFunctionParams<P>)
      })
    }
  }
}
