export function createBaseLocationHook(
  base: string,
  loc: string,
  navigate: (to: string, options?: any) => void,
): [string, typeof navigate] {
  const cleanLoc =
    base !== '/' && loc.startsWith(base) ? loc.slice(base.length) || '/' : loc;
  return [cleanLoc, navigate];
}
