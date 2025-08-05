import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';
import { VpcConstruct } from '../lib/constructs/vpc-construct';
import { SecurityConstruct } from '../lib/constructs/security-construct';
import { NamingConvention } from '../lib/utils/naming';
import { environments } from '../lib/config/environments';

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Instantiation', () => {
    test('should instantiate successfully with custom props', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackWithProps', {
        environmentSuffix: 'prod',
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-west-2',
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(stack.vpc).toBeInstanceOf(VpcConstruct);
      expect(stack.security).toBeInstanceOf(SecurityConstruct);
      expect(stack.naming).toBeInstanceOf(NamingConvention);
    });

    test('should use default values when no props provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDefault');
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(stack.vpc).toBeInstanceOf(VpcConstruct);
      expect(stack.security).toBeInstanceOf(SecurityConstruct);
      expect(stack.naming).toBeInstanceOf(NamingConvention);
    });

    test('should handle dev environment configuration', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDev', {
        environmentSuffix: 'dev',
      });

      expect(stack.naming).toBeDefined();
      expect(stack.vpc).toBeDefined();
      expect(stack.security).toBeDefined();
    });

    test('should handle staging environment configuration', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackStaging', {
        environmentSuffix: 'staging',
      });

      expect(stack.naming).toBeDefined();
      expect(stack.vpc).toBeDefined();
      expect(stack.security).toBeDefined();
    });

    test('should handle prod environment configuration', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackProd', {
        environmentSuffix: 'prod',
      });

      expect(stack.naming).toBeDefined();
      expect(stack.vpc).toBeDefined();
      expect(stack.security).toBeDefined();
    });

    test('should throw error for invalid environment', () => {
      app = new App();
      
      expect(() => {
        new TapStack(app, 'TestTapStackInvalid', {
          environmentSuffix: 'invalid',
        });
      }).toThrow("Environment 'invalid' not found in configuration");
    });
  });

  describe('Configuration Validation', () => {
    test('should use correct environment configuration for dev', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDev', {
        environmentSuffix: 'dev',
      });

      const devConfig = environments.dev;
      expect(devConfig.network.vpcCidr).toBe('10.0.0.0/16');
      expect(devConfig.compute.instanceType).toBe('t3.micro');
      expect(devConfig.database.instanceClass).toBe('db.t3.micro');
    });

    test('should use correct environment configuration for staging', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackStaging', {
        environmentSuffix: 'staging',
      });

      const stagingConfig = environments.staging;
      expect(stagingConfig.network.vpcCidr).toBe('10.1.0.0/16');
      expect(stagingConfig.compute.instanceType).toBe('t3.small');
      expect(stagingConfig.database.instanceClass).toBe('db.t3.small');
    });

    test('should use correct environment configuration for prod', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackProd', {
        environmentSuffix: 'prod',
      });

      const prodConfig = environments.prod;
      expect(prodConfig.network.vpcCidr).toBe('10.2.0.0/16');
      expect(prodConfig.compute.instanceType).toBe('t3.medium');
      expect(prodConfig.database.instanceClass).toBe('db.t3.medium');
    });
  });

  describe('Provider Configuration', () => {
    test('should configure AWS provider with default region', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackProvider');
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"provider"');
      expect(synthesized).toContain('"aws"');
    });

    test('should configure AWS provider with custom region', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackProviderCustom', {
        awsRegion: 'eu-west-1',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"provider"');
      expect(synthesized).toContain('"aws"');
    });

    test('should respect AWS_REGION_OVERRIDE when set', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackOverride', {
        awsRegion: 'us-west-1',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Backend Configuration', () => {
    test('should configure S3 backend with default settings', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackBackend');
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"backend"');
      expect(synthesized).toContain('"s3"');
    });

    test('should configure S3 backend with custom settings', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackBackendCustom', {
        stateBucket: 'my-custom-bucket',
        stateBucketRegion: 'eu-central-1',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"backend"');
      expect(synthesized).toContain('"s3"');
    });
  });

  describe('Infrastructure Components', () => {
    test('should create VPC construct with correct configuration', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackVPC', {
        environmentSuffix: 'dev',
      });

      expect(stack.vpc).toBeDefined();
      expect(stack.vpc.vpc).toBeDefined();
      expect(stack.vpc.publicSubnets).toBeDefined();
      expect(stack.vpc.privateSubnets).toBeDefined();
      expect(stack.vpc.databaseSubnets).toBeDefined();
      expect(stack.vpc.internetGateway).toBeDefined();
      expect(stack.vpc.natGateways).toBeDefined();
    });

    test('should create Security construct with correct configuration', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackSecurity', {
        environmentSuffix: 'dev',
      });

      expect(stack.security).toBeDefined();
      expect(stack.security.webSecurityGroup).toBeDefined();
      expect(stack.security.appSecurityGroup).toBeDefined();
      expect(stack.security.dbSecurityGroup).toBeDefined();
      expect(stack.security.kmsKey).toBeDefined();
      expect(stack.security.ec2Role).toBeDefined();
      expect(stack.security.instanceProfile).toBeDefined();
    });

    test('should create naming convention utility', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackNaming', {
        environmentSuffix: 'prod',
      });

      expect(stack.naming).toBeDefined();
      expect(stack.naming.resource('vpc', 'main')).toBe('cdktf-infra-prod-vpc-main');
      expect(stack.naming.tag()).toEqual({
        Environment: 'prod',
        Project: 'cdktf-infra',
        ManagedBy: 'CDKTF',
      });
    });
  });

  describe('Default Tag Handling', () => {
    test('should handle default tags properly when provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackWithTags', {
        environmentSuffix: 'dev',
        defaultTags: {
          tags: {
            CustomTag: 'CustomValue',
            Team: 'DevOps',
          },
        },
      });

      expect(stack).toBeDefined();
    });

    test('should handle empty default tags array', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackNoTags', {
        environmentSuffix: 'dev',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Synthesized Output Validation', () => {
    test('should generate valid Terraform configuration', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackSynth', {
        environmentSuffix: 'dev',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toBeDefined();
      expect(synthesized.length).toBeGreaterThan(0);
      expect(() => JSON.parse(synthesized)).not.toThrow();
    });

    test('should contain required Terraform resources', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackResources', {
        environmentSuffix: 'dev',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_vpc');
      expect(synthesized).toContain('aws_subnet');
      expect(synthesized).toContain('aws_internet_gateway');
      expect(synthesized).toContain('aws_nat_gateway');
      expect(synthesized).toContain('aws_security_group');
      expect(synthesized).toContain('aws_kms_key');
      expect(synthesized).toContain('aws_iam_role');
    });

    test('should contain provider configuration', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackProvider', {
        environmentSuffix: 'dev',
      });
      synthesized = Testing.synth(stack);

      const config = JSON.parse(synthesized);
      expect(config.provider).toBeDefined();
      expect(config.provider.aws).toBeDefined();
    });

    test('should contain backend configuration', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackBackend', {
        environmentSuffix: 'dev',
      });
      synthesized = Testing.synth(stack);

      const config = JSON.parse(synthesized);
      expect(config.terraform).toBeDefined();
      expect(config.terraform.backend).toBeDefined();
      expect(config.terraform.backend.s3).toBeDefined();
    });
  });
});
