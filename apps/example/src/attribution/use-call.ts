import {useCallback, useEffect, useState} from 'react'

export type Call<T> =
  | {status: 'pending'}
  | {status: 'resolved'; value: T}
  | {status: 'rejected'; code: string; message: string}

/** The module's own reason, without the call chain Expo wraps it in. */
const reasonOf = (message: string) => /Caused by: \w+: (.+?)(?: \(at [^)]*\))?$/s.exec(message)?.[1] ?? message

/** Runs `call` on mount and on every `run()`, and keeps what it settled with. */
export const useCall = <T>(call: () => Promise<T>) => {
  const [state, setState] = useState<Call<T>>({status: 'pending'})

  const run = useCallback(() => {
    setState({status: 'pending'})
    call().then(
      value => setState({status: 'resolved', value}),
      (error: unknown) => {
        const {code, message} = error as {code?: string; message?: string}
        setState({code: code ?? 'Error', message: reasonOf(message ?? String(error)), status: 'rejected'})
      }
    )
  }, [call])

  useEffect(run, [run])

  return [state, run] as const
}
