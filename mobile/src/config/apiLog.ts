/**
 * Development diagnostics for API reachability.
 * Never pass tokens, passwords, or request bodies into this logger.
 */
export function logApi(message: string): void {
  console.log(message);
}
