import { describe, expect, it } from 'vitest';
import { buildTrackingSnippet } from './snippet';

describe('buildTrackingSnippet', () => {
  it('generates tracking snippet with base URL including /api', () => {
    const snippet = buildTrackingSnippet('test-site-id', 'https://analytics.mjmiller.cloud/api');

    expect(snippet.websiteId).toBe('test-site-id');
    expect(snippet.scriptUrl).toBe('https://analytics.mjmiller.cloud/script.js');
    expect(snippet.htmlTag).toBe(
      '<script defer src="https://analytics.mjmiller.cloud/script.js" data-website-id="test-site-id"></script>',
    );
  });

  it('generates tracking snippet without trailing slash or /api', () => {
    const snippet = buildTrackingSnippet('site-123', 'https://analytics.mjmiller.cloud');

    expect(snippet.scriptUrl).toBe('https://analytics.mjmiller.cloud/script.js');
    expect(snippet.htmlTag).toBe(
      '<script defer src="https://analytics.mjmiller.cloud/script.js" data-website-id="site-123"></script>',
    );
  });

  it('generates tracking snippet with custom script name', () => {
    const snippet = buildTrackingSnippet(
      'custom-site',
      'https://analytics.mjmiller.cloud/api',
      'custom-tracker.js',
    );

    expect(snippet.scriptUrl).toBe('https://analytics.mjmiller.cloud/custom-tracker.js');
    expect(snippet.htmlTag).toBe(
      '<script defer src="https://analytics.mjmiller.cloud/custom-tracker.js" data-website-id="custom-site"></script>',
    );
  });

  it('handles missing base URL gracefully', () => {
    const snippet = buildTrackingSnippet('site-xyz');

    expect(snippet.scriptUrl).toBe('/script.js');
    expect(snippet.htmlTag).toBe(
      '<script defer src="/script.js" data-website-id="site-xyz"></script>',
    );
  });
});
