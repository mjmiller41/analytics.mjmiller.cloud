export interface TrackingSnippet {
  websiteId: string;
  scriptUrl: string;
  htmlTag: string;
}

/**
 * Builds the tracking script snippet and URL for a given website ID.
 * Strips any trailing `/api` from the base URL to target the root script endpoint.
 */
export function buildTrackingSnippet(
  websiteId: string,
  baseUrl?: string,
  scriptName: string = 'script.js',
): TrackingSnippet {
  const rootUrl = baseUrl ? baseUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '') : '';
  const scriptUrl = rootUrl
    ? `${rootUrl}/${scriptName.replace(/^\/+/, '')}`
    : `/${scriptName.replace(/^\/+/, '')}`;
  const htmlTag = `<script defer src="${scriptUrl}" data-website-id="${websiteId}"></script>`;

  return {
    websiteId,
    scriptUrl,
    htmlTag,
  };
}
