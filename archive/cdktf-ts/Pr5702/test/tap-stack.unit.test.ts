import { App, Testing } from 'cdktf';
import { TapStack, TapStackConfig } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  const defaultConfig: TapStackConfig = {
    environmentSuffix: 'test',
    stateBucket: 'test-state-bucket',
    stateBucketRegion: 'us-east-1',
    awsRegion: 'us-east-1',
    defaultTags: {
      tags: {
        Environment: 'test',
        Project: 'tap-test',
        Owner: 'test-team',
      },
    },
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    app = new App();
  });

  describe('Stack Instantiation', () => {
    test('TapStack instantiates successfully with required config properties', () => {
      stack = new TapStack(app, 'TestTapStackWithProps', defaultConfig);
      synthesized = Testing.synth(stack);

      // Verify that TapStack instantiates without errors
      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized.length).toBeGreaterThan(0);
    });

    test('TapStack instantiates with production environment suffix', () => {
      const prodConfig: TapStackConfig = {
        ...defaultConfig,
        environmentSuffix: 'prod',
      };
      stack = new TapStack(app, 'TestTapStackProd', prodConfig);
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toContain('prod');
    });

    test('TapStack instantiates with different AWS regions', () => {
      const regions = ['us-east-1', 'us-west-2', 'eu-west-1'];

      regions.forEach((region) => {
        const regionalConfig: TapStackConfig = {
          ...defaultConfig,
          awsRegion: region,
          stateBucketRegion: region,
        };
        const regionalStack = new TapStack(app, `TestTapStack${region}`, regionalConfig);
        const regionalSynth = Testing.synth(regionalStack);

        expect(regionalStack).toBeDefined();
        expect(regionalSynth).toBeDefined();
      });
    });
  });

  describe('Provider Configuration', () => {
    test('Synthesized template contains AWS provider configuration', () => {
      stack = new TapStack(app, 'TestTapStackProvider', defaultConfig);
      synthesized = Testing.synth(stack);

      // Verify AWS provider is configured
      expect(synthesized).toContain('aws');
      expect(synthesized).toContain(defaultConfig.awsRegion);
    });

    test('Synthesized template contains Random provider', () => {
      stack = new TapStack(app, 'TestTapStackRandomProvider', defaultConfig);
      synthesized = Testing.synth(stack);

      // Verify Random provider is configured
      expect(synthesized).toContain('random');
    });

    test('Synthesized template contains S3 backend configuration', () => {
      stack = new TapStack(app, 'TestTapStackBackend', defaultConfig);
      synthesized = Testing.synth(stack);

      // Verify S3 backend is configured
      expect(synthesized).toContain('s3');
      expect(synthesized).toContain(defaultConfig.stateBucket);
      expect(synthesized).toContain('terraform.tfstate');
      expect(synthesized).toContain('encrypt');
    });

    test('S3 backend includes state key with environment suffix', () => {
      const envSuffix = 'staging';
      const stagingConfig: TapStackConfig = {
        ...defaultConfig,
        environmentSuffix: envSuffix,
      };
      stack = new TapStack(app, 'TestTapStackBackendKey', stagingConfig);
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain(`tap-stack-${envSuffix}`);
    });
  });

  describe('Networking Resources', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStackNetworking', defaultConfig);
      synthesized = Testing.synth(stack);
    });

    test('Synthesized template contains VPC configuration', () => {
      expect(synthesized).toContain('vpc');
      expect(synthesized).toContain('10.0.0.0/16');
      expect(synthesized).toContain('client-dashboard-vpc');
    });

    test('Synthesized template contains subnet definitions', () => {
      expect(synthesized).toContain('subnet');
      expect(synthesized).toContain('10.0.1.0/24');
      expect(synthesized).toContain('10.0.2.0/24');
      expect(synthesized).toContain('10.0.11.0/24');
      expect(synthesized).toContain('10.0.12.0/24');
      expect(synthesized).toContain('public-subnet');
      expect(synthesized).toContain('private-subnet');
    });

    test('Synthesized template contains Internet Gateway', () => {
      expect(synthesized).toContain('internet_gateway');
      expect(synthesized).toContain('igw');
    });

    test('Synthesized template contains NAT Gateways and Elastic IPs', () => {
      expect(synthesized).toContain('nat_gateway');
      expect(synthesized).toContain('eip');
      expect(synthesized).toContain('nat-eip');
    });

    test('Synthesized template contains route tables', () => {
      expect(synthesized).toContain('route_table');
      expect(synthesized).toContain('public-rt');
      expect(synthesized).toContain('private-rt');
    });

    test('Synthesized template contains route associations', () => {
      expect(synthesized).toContain('route_table_association');
      expect(synthesized).toContain('rta');
    });
  });

  describe('Security Configuration', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStackSecurity', defaultConfig);
      synthesized = Testing.synth(stack);
    });

    test('Synthesized template contains security groups', () => {
      expect(synthesized).toContain('security_group');
      expect(synthesized).toContain('alb-sg');
      expect(synthesized).toContain('ecs-sg');
    });

    test('Synthesized template contains security group rules', () => {
      expect(synthesized).toContain('security_group_rule');
      expect(synthesized).toContain('ingress');
      expect(synthesized).toContain('egress');
    });

    test('ALB security group allows HTTP traffic', () => {
      expect(synthesized).toContain('alb-ingress-http');
      expect(synthesized).toContain('"from_port": 80');
      expect(synthesized).toContain('"to_port": 80');
    });
  });

  describe('Environment-specific Configuration', () => {
    test('Stack uses environment suffix in resource names', () => {
      const envSuffix = 'development';
      const envConfig: TapStackConfig = {
        ...defaultConfig,
        environmentSuffix: envSuffix,
      };
      stack = new TapStack(app, 'TestTapStackEnv', envConfig);
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain(`vpc-${envSuffix}`);
      expect(synthesized).toContain(`igw-${envSuffix}`);
    });

    test('Stack applies default tags to resources', () => {
      const tagsConfig: TapStackConfig = {
        ...defaultConfig,
        defaultTags: {
          tags: {
            Environment: 'production',
            Project: 'client-dashboard',
            ManagedBy: 'terraform',
          },
        },
      };
      stack = new TapStack(app, 'TestTapStackTags', tagsConfig);
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('default_tags');
      expect(synthesized).toContain('production');
      expect(synthesized).toContain('client-dashboard');
    });
  });

  describe('Stack Synthesis', () => {
    test('Synthesized template is valid JSON/HCL format', () => {
      stack = new TapStack(app, 'TestTapStackSynthesis', defaultConfig);
      synthesized = Testing.synth(stack);

      // Basic validation that synthesis produces expected format
      expect(synthesized).toBeTruthy();
      expect(synthesized.length).toBeGreaterThan(100);
      expect(synthesized).toMatch(/resource|provider|terraform|variable/);
    });

    test('Multiple stacks can be created independently', () => {
      const stack1 = new TapStack(app, 'Stack1', defaultConfig);
      const stack2 = new TapStack(app, 'Stack2', {
        ...defaultConfig,
        environmentSuffix: 'stage',
      });

      const synth1 = Testing.synth(stack1);
      const synth2 = Testing.synth(stack2);

      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
      expect(synth1).toBeDefined();
      expect(synth2).toBeDefined();
      expect(synth1.length).toBeGreaterThan(0);
      expect(synth2.length).toBeGreaterThan(0);
    });
  });
});
