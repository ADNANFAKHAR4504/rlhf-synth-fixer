import { getELBServiceAccount } from '../lib/infrastructure-stack';

describe('getELBServiceAccount()', () => {
  const mapping = {
    'us-east-1': '127311923021',
    'us-east-2': '033677994240',
    'us-west-1': '027434742980',
    'us-west-2': '797873946194',
    'eu-west-1': '156460612806',
    'eu-central-1': '054676820928',
    'ap-southeast-1': '114774131450',
    'ap-northeast-1': '582318560864',
  };

  it('should return the correct ELB account for known regions', () => {
    Object.entries(mapping).forEach(([region, expectedAccount]) => {
      expect(getELBServiceAccount(region)).toBe(expectedAccount);
    });
  });

  it('should return default ELB account for unknown region', () => {
    expect(getELBServiceAccount('mars-central-42')).toBe('127311923021');
    expect(getELBServiceAccount('')).toBe('127311923021');
    expect(getELBServiceAccount(undefined as any)).toBe('127311923021');
    expect(getELBServiceAccount(null as any)).toBe('127311923021');
  });
});
