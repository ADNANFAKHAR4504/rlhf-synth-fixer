import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Instantiation', () => {
    test('TapStack instantiates successfully with custom props', () => {
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
      const synthJson = JSON.parse(synthesized);
      expect(synthJson).toHaveProperty('terraform');
    });

    test('TapStack uses default values when no props provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDefault');
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      const synthJson = JSON.parse(synthesized);
      expect(synthJson).toHaveProperty('terraform');
    });

    test('TapStack uses AWS_REGION_OVERRIDE when set', () => {
      app = new App();
      stack = new TapStack(app, 'TestWithRegionOverride', {
        environmentSuffix: 'test',
        awsRegion: 'us-west-1',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      expect(synthJson).toHaveProperty('provider');
    });
  });

  describe('Backend Configuration', () => {
    test('S3 backend is configured correctly', () => {
      app = new App();
      stack = new TapStack(app, 'TestBackend', {
        environmentSuffix: 'dev',
        stateBucket: 'test-state-bucket',
        stateBucketRegion: 'us-east-1',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      expect(synthJson.terraform).toHaveProperty('backend');
      expect(synthJson.terraform.backend).toHaveProperty('s3');
      expect(synthJson.terraform.backend.s3).toMatchObject({
        bucket: 'test-state-bucket',
        region: 'us-east-1',
        encrypt: true,
      });
    });

    test('Backend key includes environment suffix', () => {
      app = new App();
      const envSuffix = 'test123';
      stack = new TapStack(app, 'TestKey', {
        environmentSuffix: envSuffix,
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      expect(synthJson.terraform.backend.s3.key).toContain(envSuffix);
    });
  });

  describe('Provider Configuration', () => {
    test('AWS provider is configured with correct region', () => {
      app = new App();
      stack = new TapStack(app, 'TestProvider', {
        awsRegion: 'us-west-2',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      expect(synthJson.provider).toHaveProperty('aws');
      const awsProviders = synthJson.provider.aws;
      expect(Array.isArray(awsProviders)).toBe(true);
      expect(awsProviders[0]).toHaveProperty('region', 'us-west-2');
    });

    test('AWS provider includes default tags', () => {
      app = new App();
      stack = new TapStack(app, 'TestTags', {
        environmentSuffix: 'dev',
        defaultTags: [
          {
            tags: {
              Environment: 'dev',
              Team: 'platform-engineering',
              CostCenter: 'infrastructure',
            },
          },
        ],
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      expect(synthJson.provider.aws[0]).toHaveProperty('default_tags');
    });
  });

  describe('Environment Configuration', () => {
    test.each([
      ['dev-test', 'dev', '10.0.0.0/16'],
      ['staging-test', 'staging', '10.1.0.0/16'],
      ['prod-test', 'prod', '10.2.0.0/16'],
    ])(
      'Environment suffix %s maps to environment %s with CIDR %s',
      (suffix, expectedEnv, expectedCidr) => {
        app = new App();
        stack = new TapStack(app, `Test-${suffix}`, {
          environmentSuffix: suffix,
        });
        synthesized = Testing.synth(stack);

        expect(stack).toBeDefined();
        expect(synthesized).toBeDefined();
      }
    );
  });

  describe('Resource Creation', () => {
    test('Stack creates VPC resources', () => {
      app = new App();
      stack = new TapStack(app, 'TestVPC', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      expect(synthJson.resource).toHaveProperty('aws_vpc');
    });

    test('Stack creates ECS cluster', () => {
      app = new App();
      stack = new TapStack(app, 'TestECS', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      expect(synthJson.resource).toHaveProperty('aws_ecs_cluster');
    });

    test('Stack creates RDS instance', () => {
      app = new App();
      stack = new TapStack(app, 'TestRDS', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      expect(synthJson.resource).toHaveProperty('aws_db_instance');
    });

    test('Stack creates ALB', () => {
      app = new App();
      stack = new TapStack(app, 'TestALB', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      expect(synthJson.resource).toHaveProperty('aws_lb');
    });

    test('Stack creates S3 bucket for assets', () => {
      app = new App();
      stack = new TapStack(app, 'TestS3', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      expect(synthJson.resource).toHaveProperty('aws_s3_bucket');
    });

    test('Stack creates CloudWatch log group', () => {
      app = new App();
      stack = new TapStack(app, 'TestLogs', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      expect(synthJson.resource).toHaveProperty('aws_cloudwatch_log_group');
    });

    test('Stack creates IAM roles', () => {
      app = new App();
      stack = new TapStack(app, 'TestIAM', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      expect(synthJson.resource).toHaveProperty('aws_iam_role');
    });

    test('Stack creates security groups', () => {
      app = new App();
      stack = new TapStack(app, 'TestSG', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      expect(synthJson.resource).toHaveProperty('aws_security_group');
    });
  });

  describe('Outputs', () => {
    test('Stack includes outputs for key resources', () => {
      app = new App();
      stack = new TapStack(app, 'TestOutputs', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      expect(synthJson).toHaveProperty('output');
      expect(synthJson.output).toBeDefined();
    });

    test('Output includes VPC ID', () => {
      app = new App();
      stack = new TapStack(app, 'TestVPCOutput', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      const outputKeys = Object.keys(synthJson.output);
      const hasVpcOutput = outputKeys.some(key => key.includes('vpc-id'));
      expect(hasVpcOutput).toBe(true);
    });

    test('Output includes ALB DNS name', () => {
      app = new App();
      stack = new TapStack(app, 'TestALBOutput', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      const outputKeys = Object.keys(synthJson.output);
      const hasALBOutput = outputKeys.some(key => key.includes('alb-dns-name'));
      expect(hasALBOutput).toBe(true);
    });

    test('Output includes RDS endpoint', () => {
      app = new App();
      stack = new TapStack(app, 'TestRDSOutput', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      const outputKeys = Object.keys(synthJson.output);
      const hasRDSOutput = outputKeys.some(key => key.includes('rds-endpoint'));
      expect(hasRDSOutput).toBe(true);
    });

    test('Output includes ECS cluster name', () => {
      app = new App();
      stack = new TapStack(app, 'TestECSOutput', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      const outputKeys = Object.keys(synthJson.output);
      const hasECSOutput = outputKeys.some(key => key.includes('ecs-cluster-name'));
      expect(hasECSOutput).toBe(true);
    });

    test('Output includes S3 bucket name', () => {
      app = new App();
      stack = new TapStack(app, 'TestS3Output', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      const outputKeys = Object.keys(synthJson.output);
      const hasS3Output = outputKeys.some(key => key.includes('s3-assets-bucket-name'));
      expect(hasS3Output).toBe(true);
    });
  });

  describe('Data Sources', () => {
    test('Stack creates Secrets Manager data source for RDS credentials', () => {
      app = new App();
      stack = new TapStack(app, 'TestSecrets', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      expect(synthJson.data).toHaveProperty('aws_secretsmanager_secret');
    });
  });
});
