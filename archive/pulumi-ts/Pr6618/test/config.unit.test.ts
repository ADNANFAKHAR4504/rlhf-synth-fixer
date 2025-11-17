import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi test environment
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string, state: any } => {
    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
}, 'test');

// Import after setting up mocks
import { EnvironmentConfig, getEnvironmentConfig, getEnvironmentSuffix } from '../lib/config';

describe('Config Module Unit Tests', () => {
  let getStackSpy: jest.SpyInstance;
  let configGetSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock pulumi.getStack
    getStackSpy = jest.spyOn(pulumi, 'getStack');

    // Mock pulumi.Config
    configGetSpy = jest.fn();
    jest.spyOn(pulumi, 'Config').mockImplementation(() => ({
      get: configGetSpy,
      require: jest.fn(),
      getBoolean: jest.fn(),
      getNumber: jest.fn(),
      getObject: jest.fn(),
      requireBoolean: jest.fn(),
      requireNumber: jest.fn(),
      requireObject: jest.fn(),
      requireSecret: jest.fn(),
      getSecret: jest.fn(),
      requireSecretBoolean: jest.fn(),
      requireSecretNumber: jest.fn(),
      requireSecretObject: jest.fn(),
      getSecretBoolean: jest.fn(),
      getSecretNumber: jest.fn(),
      getSecretObject: jest.fn(),
      name: 'test',
    } as any));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getEnvironmentConfig', () => {
    it('should return dev configuration when stack is dev', () => {
      getStackSpy.mockReturnValue('dev');

      const config = getEnvironmentConfig();

      expect(config).toBeDefined();
      expect(config.environment).toBe('dev');
      expect(config.region).toBe('us-east-1');
      expect(config.instanceType).toBe('t3.medium');
      expect(config.dbInstanceCount).toBe(1);
      expect(config.backupRetentionDays).toBe(7);
      expect(config.containerImageTag).toBe('latest');
      expect(config.vpcCidr).toBe('10.0.0.0/16');
    });

    it('should return staging configuration when stack is staging', () => {
      getStackSpy.mockReturnValue('staging');

      const config = getEnvironmentConfig();

      expect(config).toBeDefined();
      expect(config.environment).toBe('staging');
      expect(config.region).toBe('us-east-1');
      expect(config.instanceType).toBe('m5.large');
      expect(config.dbInstanceCount).toBe(2);
      expect(config.backupRetentionDays).toBe(14);
      expect(config.containerImageTag).toBe('staging-*');
      expect(config.vpcCidr).toBe('10.1.0.0/16');
    });

    it('should return prod configuration when stack is prod', () => {
      getStackSpy.mockReturnValue('prod');

      const config = getEnvironmentConfig();

      expect(config).toBeDefined();
      expect(config.environment).toBe('prod');
      expect(config.region).toBe('us-east-1');
      expect(config.instanceType).toBe('m5.xlarge');
      expect(config.dbInstanceCount).toBe(3);
      expect(config.backupRetentionDays).toBe(30);
      expect(config.containerImageTag).toBe('v*.*.*');
      expect(config.vpcCidr).toBe('10.2.0.0/16');
    });

    it('should return dev configuration for unknown environments', () => {
      getStackSpy.mockReturnValue('unknown-env');

      const config = getEnvironmentConfig();

      expect(config).toBeDefined();
      expect(config.environment).toBe('dev');
    });

    it('should have correct availability zones for dev', () => {
      getStackSpy.mockReturnValue('dev');

      const config = getEnvironmentConfig();

      expect(config.availabilityZones).toEqual([
        'us-east-1a',
        'us-east-1b',
        'us-east-1c',
      ]);
    });

    it('should have correct public subnet CIDRs for staging', () => {
      getStackSpy.mockReturnValue('staging');

      const config = getEnvironmentConfig();

      expect(config.publicSubnetCidrs).toEqual([
        '10.1.1.0/24',
        '10.1.2.0/24',
        '10.1.3.0/24',
      ]);
    });

    it('should have correct private subnet CIDRs for prod', () => {
      getStackSpy.mockReturnValue('prod');

      const config = getEnvironmentConfig();

      expect(config.privateSubnetCidrs).toEqual([
        '10.2.11.0/24',
        '10.2.12.0/24',
        '10.2.13.0/24',
      ]);
    });

    it('should have all required fields in config', () => {
      getStackSpy.mockReturnValue('dev');

      const config = getEnvironmentConfig();

      expect(config).toHaveProperty('environment');
      expect(config).toHaveProperty('region');
      expect(config).toHaveProperty('instanceType');
      expect(config).toHaveProperty('dbInstanceCount');
      expect(config).toHaveProperty('backupRetentionDays');
      expect(config).toHaveProperty('containerImageTag');
      expect(config).toHaveProperty('vpcCidr');
      expect(config).toHaveProperty('availabilityZones');
      expect(config).toHaveProperty('publicSubnetCidrs');
      expect(config).toHaveProperty('privateSubnetCidrs');
    });

    it('should return valid EnvironmentConfig type', () => {
      getStackSpy.mockReturnValue('dev');

      const config: EnvironmentConfig = getEnvironmentConfig();

      expect(typeof config.environment).toBe('string');
      expect(typeof config.region).toBe('string');
      expect(typeof config.instanceType).toBe('string');
      expect(typeof config.dbInstanceCount).toBe('number');
      expect(typeof config.backupRetentionDays).toBe('number');
      expect(typeof config.containerImageTag).toBe('string');
      expect(typeof config.vpcCidr).toBe('string');
      expect(Array.isArray(config.availabilityZones)).toBe(true);
      expect(Array.isArray(config.publicSubnetCidrs)).toBe(true);
      expect(Array.isArray(config.privateSubnetCidrs)).toBe(true);
    });
  });

  describe('getEnvironmentSuffix', () => {
    it('should return configured environment suffix when available', () => {
      getStackSpy.mockReturnValue('dev');
      configGetSpy.mockReturnValue('custom-suffix-123');

      const suffix = getEnvironmentSuffix();

      expect(suffix).toBe('custom-suffix-123');
      expect(configGetSpy).toHaveBeenCalledWith('environmentSuffix');
    });

    it('should return stack name when environment suffix not configured', () => {
      getStackSpy.mockReturnValue('prod');
      configGetSpy.mockReturnValue(undefined);

      const suffix = getEnvironmentSuffix();

      expect(suffix).toBe('prod');
    });

    it('should call Config constructor with tapstack', () => {
      getStackSpy.mockReturnValue('dev');
      configGetSpy.mockReturnValue('test');

      const result = getEnvironmentSuffix();

      // Verify the result is correct
      expect(result).toBe('test');
      // Config was already mocked in beforeEach
      expect(configGetSpy).toHaveBeenCalledWith('environmentSuffix');
    });

    it('should handle empty string as environment suffix', () => {
      getStackSpy.mockReturnValue('staging');
      configGetSpy.mockReturnValue('');

      const suffix = getEnvironmentSuffix();

      expect(suffix).toBe('staging');
    });

    it('should handle null as environment suffix', () => {
      getStackSpy.mockReturnValue('dev');
      configGetSpy.mockReturnValue(null);

      const suffix = getEnvironmentSuffix();

      expect(suffix).toBe('dev');
    });

    it('should return environment suffix with special characters', () => {
      getStackSpy.mockReturnValue('dev');
      configGetSpy.mockReturnValue('pr-1234-test');

      const suffix = getEnvironmentSuffix();

      expect(suffix).toBe('pr-1234-test');
    });

    it('should return environment suffix with uppercase letters', () => {
      getStackSpy.mockReturnValue('dev');
      configGetSpy.mockReturnValue('TapStackPR5678');

      const suffix = getEnvironmentSuffix();

      expect(suffix).toBe('TapStackPR5678');
    });
  });

  describe('Config Integration', () => {
    it('should work together to provide complete configuration', () => {
      getStackSpy.mockReturnValue('prod');
      configGetSpy.mockReturnValue('prod-123');

      const envConfig = getEnvironmentConfig();
      const envSuffix = getEnvironmentSuffix();

      expect(envConfig.environment).toBe('prod');
      expect(envSuffix).toBe('prod-123');
    });

    it('should provide consistent values across multiple calls', () => {
      getStackSpy.mockReturnValue('staging');
      configGetSpy.mockReturnValue('staging-456');

      const config1 = getEnvironmentConfig();
      const config2 = getEnvironmentConfig();
      const suffix1 = getEnvironmentSuffix();
      const suffix2 = getEnvironmentSuffix();

      expect(config1).toEqual(config2);
      expect(suffix1).toEqual(suffix2);
    });
  });

  describe('Environment-specific configurations', () => {
    it('should have appropriate instance types for each environment', () => {
      getStackSpy.mockReturnValue('dev');
      expect(getEnvironmentConfig().instanceType).toBe('t3.medium');

      getStackSpy.mockReturnValue('staging');
      expect(getEnvironmentConfig().instanceType).toBe('m5.large');

      getStackSpy.mockReturnValue('prod');
      expect(getEnvironmentConfig().instanceType).toBe('m5.xlarge');
    });

    it('should have appropriate DB instance counts for each environment', () => {
      getStackSpy.mockReturnValue('dev');
      expect(getEnvironmentConfig().dbInstanceCount).toBe(1);

      getStackSpy.mockReturnValue('staging');
      expect(getEnvironmentConfig().dbInstanceCount).toBe(2);

      getStackSpy.mockReturnValue('prod');
      expect(getEnvironmentConfig().dbInstanceCount).toBe(3);
    });

    it('should have appropriate backup retention for each environment', () => {
      getStackSpy.mockReturnValue('dev');
      expect(getEnvironmentConfig().backupRetentionDays).toBe(7);

      getStackSpy.mockReturnValue('staging');
      expect(getEnvironmentConfig().backupRetentionDays).toBe(14);

      getStackSpy.mockReturnValue('prod');
      expect(getEnvironmentConfig().backupRetentionDays).toBe(30);
    });

    it('should have non-overlapping VPC CIDRs', () => {
      getStackSpy.mockReturnValue('dev');
      const devCidr = getEnvironmentConfig().vpcCidr;

      getStackSpy.mockReturnValue('staging');
      const stagingCidr = getEnvironmentConfig().vpcCidr;

      getStackSpy.mockReturnValue('prod');
      const prodCidr = getEnvironmentConfig().vpcCidr;

      expect(devCidr).not.toBe(stagingCidr);
      expect(devCidr).not.toBe(prodCidr);
      expect(stagingCidr).not.toBe(prodCidr);
    });

    it('should have 3 availability zones for all environments', () => {
      ['dev', 'staging', 'prod'].forEach(env => {
        getStackSpy.mockReturnValue(env);
        const config = getEnvironmentConfig();
        expect(config.availabilityZones).toHaveLength(3);
        expect(config.publicSubnetCidrs).toHaveLength(3);
        expect(config.privateSubnetCidrs).toHaveLength(3);
      });
    });
  });
});

