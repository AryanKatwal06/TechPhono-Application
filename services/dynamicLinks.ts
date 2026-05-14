import { Linking } from 'react-native';

// Parse a URL that may be a Firebase Dynamic Link wrapping the real link.
// Returns an object with mode and oobCode when found, otherwise null.
export function extractModeAndOobCode(rawUrl: string | null): { mode?: string; oobCode?: string } | null {
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);
    const params = Object.fromEntries(url.searchParams.entries());

    // Common dynamic link wraps the real link in `link` param
    let inner = params.link as string | undefined;
    if (!inner) {
      // Some wrappers use deep_link_id or simply include mode/oobCode at top level
      const mode = params.mode as string | undefined;
      const oobCode = params.oobCode as string | undefined;
      if (mode || oobCode) return { mode, oobCode };
    }

    if (inner) {
      const innerUrl = new URL(inner);
      const innerParams = Object.fromEntries(innerUrl.searchParams.entries());
      const mode = innerParams.mode as string | undefined;
      const oobCode = innerParams.oobCode as string | undefined;
      if (mode || oobCode) return { mode, oobCode };
    }

    // Finally, attempt to parse raw url query directly
    const urlObj = new URL(rawUrl);
    const mode = urlObj.searchParams.get('mode') || undefined;
    const oobCode = urlObj.searchParams.get('oobCode') || undefined;
    if (mode || oobCode) return { mode, oobCode };

    return null;
  } catch (err) {
    console.warn('Failed to extract mode/oobCode from URL', err);
    return null;
  }
}

export default { extractModeAndOobCode };
