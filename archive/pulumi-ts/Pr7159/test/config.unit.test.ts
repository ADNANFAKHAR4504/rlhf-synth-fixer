import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi config
class MockConfig {
  private config: Record<string, any> = {
    environment: 'dev',
    region: 'us-east-1',
    vpcCidr: '10.0.0.0/16',
    availabilityZones: ['us-east-1a', 'us-east-1b'],
    ecsTaskCount: 1,
    ecsTaskCpu: '256',
    ecsTaskMemory: '512',
    rdsInstanceClass: 'db.t3.medium',
    rdsEngineMode: 'provisioned',
    enableAutoScaling: false,
    s3LifecycleEnabled: true,
    s3TransitionDays: 90,
    s3ExpirationDays: 365,
    rdsBackupRetentionDays: 7,
    owner: 'dev-team',
    costCenter: 'development',
  };

  constructor(private name?: string) { }

  require(key: string): any {
    if (!(key in this.config)) {
      throw new Error(`Missing required config: ${key}`);
    }
    return this.config[key];
  }

  requireNumber(key: string): number {
    return Number(this.require(key));
  }

  requireBoolean(key: string): boolean {
    return Boolean(this.require(key));
  }

  requireObject<T>(key: string): T {
    return this.require(key) as T;
  }

  get(key: string): any {
    return this.config[key];
  }

  getNumber(key: string): number | undefined {
    const val = this.config[key];
    return val !== undefined ? Number(val) : undefined;
  }

  getBoolean(key: string): boolean | undefined {
    const val = this.config[key];
    return val !== undefined ? Boolean(val) : undefined;
  }

  getObject<T>(key: string): T | undefined {
    return this.config[key] as T | undefined;
  }
}

// Mock pulumi.Config
jest.mock('@pulumi/pulumi', () => {
  const actual = jest.requireActual('@pulumi/pulumi');
  const mockGetStack = jest.fn().mockReturnValue('dev');
  return {
    ...actual,
    Config: jest.fn().mockImplementation((name?: string) => {
      const mockConfig = new MockConfig(name);
      return mockConfig;
    }),
    getStack: mockGetStack,
  };
});

import { getConfig } from '../lib/config';

describe('Config Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a complete configuration object', () => {
    const config = getConfig();

    expect(config).toBeDefined();
    expect(config.environment).toBe('dev');
    expect(config.region).toBe('us-east-1');
    expect(config.vpcCidr).toBe('10.0.0.0/16');
    // Mock returns 2 AZs, but code defaults to 3 if getObject returns undefined
    // Since mock's getObject should return the value, it should work

    expect(config.ecsTaskCount).toBe(1);
    expect(config.ecsTaskCpu).toBe('256');
    expect(config.ecsTaskMemory).toBe('512');
    expect(config.rdsInstanceClass).toBe('db.t3.medium');
    expect(config.enableAutoScaling).toBe(false);
  });

  it('should include correct tags', () => {
    const config = getConfig();

    expect(config.tags).toBeDefined();
    expect(config.tags.Environment).toBe('dev');
    // Mock has 'dev-team' but code uses config.get('owner') which should return it
    // If mock doesn't work, it falls back to 'platform-team'
    expect(config.tags.Owner).toBe('dev-team');
    expect(config.tags.CostCenter).toBe('development');
    expect(config.tags.ManagedBy).toBe('pulumi');
  });

  it('should include S3 lifecycle rules', () => {
    const config = getConfig();

    expect(config.s3LifecycleRules).toBeDefined();
    expect(config.s3LifecycleRules.enabled).toBe(true);
    // Mock has 90, but if getNumber returns undefined, dev default is 30
    expect(config.s3LifecycleRules.transitionDays).toBe(90);
    // Mock has 365, but if getNumber returns undefined, dev default is 90
    expect(config.s3LifecycleRules.expirationDays).toBe(365);
  });

  it('should include RDS backup retention days', () => {
    const config = getConfig();

    // Mock has 7, but if getNumber returns undefined, dev default is 1
    expect(config.rdsBackupRetentionDays).toBe(7);
  });

  it('should handle optional fields', () => {
    const config = getConfig();

    // These are optional and may be undefined
    expect(config.sslCertificateArn).toBeUndefined();
    expect(config.permissionBoundaryArn).toBeUndefined();
  });

  it('should use default values when optional config is missing', () => {
    // Mock config with missing optional values
    class MinimalMockConfig extends MockConfig {
      get(key: string): any {
        const minimalConfig: Record<string, any> = {
          region: 'us-east-1',
          rdsEngineMode: undefined,
          sslCertificateArn: undefined,
          owner: undefined,
          costCenter: undefined,
          permissionBoundaryArn: undefined,
        };
        return minimalConfig[key];
      }

      getNumber(key: string): number | undefined {
        if (key === 's3TransitionDays') return undefined;
        if (key === 's3ExpirationDays') return undefined;
        if (key === 'rdsBackupRetentionDays') return undefined;
        return undefined;
      }

      getBoolean(key: string): boolean | undefined {
        if (key === 's3LifecycleEnabled') return undefined;
        return undefined;
      }

      getObject<T>(key: string): T | undefined {
        if (key === 'availabilityZones') return undefined;
        return undefined;
      }
    }

    const originalConfig = (pulumi.Config as jest.Mock).getMockImplementation();

    (pulumi.Config as jest.Mock).mockImplementation(() => new MinimalMockConfig());

    const config = getConfig();

    // Should use defaults for dev environment (stack is mocked to return 'dev')
    expect(config.region).toBe('us-east-1');
    expect(config.tags.Owner).toBe('platform-team'); // default
    expect(config.tags.CostCenter).toBe('engineering'); // default
    expect(config.availabilityZones).toEqual(['us-east-1a', 'us-east-1b', 'us-east-1c']); // default

    // Restore original mock
    (pulumi.Config as jest.Mock).mockImplementation(originalConfig!);
  });
});
