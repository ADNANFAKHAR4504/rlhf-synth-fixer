import { name } from '../lib/naming';

describe('name', () => {
  it('returns base name without suffix', () => {
    expect(name('eng', 'dev', 'test')).toBe('eng-dev-test');
  });

  it('returns name with suffix', () => {
    expect(name('eng', 'prod', 'data', 'bucket')).toBe('eng-prod-data-bucket');
  });

  it('handles empty suffix', () => {
    expect(name('eng', 'prod', 'data', '')).toBe('eng-prod-data');
  });

  it('handles numeric suffix', () => {
    expect(name('eng', 'prod', 'data', 123 as any)).toBe('eng-prod-data-123');
  });

  it('handles special characters in suffix', () => {
    expect(name('eng', 'prod', 'data', 'bucket@2025')).toBe(
      'eng-prod-data-bucket@2025'
    );
  });
});
