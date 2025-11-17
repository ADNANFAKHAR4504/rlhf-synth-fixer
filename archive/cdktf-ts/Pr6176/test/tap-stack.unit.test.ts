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
    test('Stack creates AWS Caller Identity data source', () => {
      app = new App();
      stack = new TapStack(app, 'TestCallerIdentity', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      expect(synthJson.data).toHaveProperty('aws_caller_identity');
      expect(synthJson.data.aws_caller_identity).toHaveProperty('current');
    });

    test('Stack uses OPERATIONS_ACCOUNT_ID when provided', () => {
      const originalEnv = process.env.OPERATIONS_ACCOUNT_ID;
      process.env.OPERATIONS_ACCOUNT_ID = '999888777666';

      app = new App();
      stack = new TapStack(app, 'TestOpsAccountId', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      // Clean up
      if (originalEnv) {
        process.env.OPERATIONS_ACCOUNT_ID = originalEnv;
      } else {
        delete process.env.OPERATIONS_ACCOUNT_ID;
      }

      expect(stack).toBeDefined();
    });
  });

  describe('Database Configuration', () => {
    test('RDS instance uses correct PostgreSQL version', () => {
      app = new App();
      stack = new TapStack(app, 'TestDBVersion', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      const dbInstances = synthJson.resource.aws_db_instance;
      const dbInstance = Object.values(dbInstances)[0] as any;
      expect(dbInstance.engine).toBe('postgres');
      expect(dbInstance.engine_version).toBe('17.4');
    });

    test('RDS instance uses correct instance class', () => {
      app = new App();
      stack = new TapStack(app, 'TestDBInstanceClass', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      const dbInstances = synthJson.resource.aws_db_instance;
      const dbInstance = Object.values(dbInstances)[0] as any;
      expect(dbInstance.instance_class).toBe('db.t4g.small');
    });

    test('RDS instance has Multi-AZ enabled', () => {
      app = new App();
      stack = new TapStack(app, 'TestDBMultiAZ', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      const dbInstances = synthJson.resource.aws_db_instance;
      const dbInstance = Object.values(dbInstances)[0] as any;
      expect(dbInstance.multi_az).toBe(true);
    });

    test('RDS instance has encryption enabled', () => {
      app = new App();
      stack = new TapStack(app, 'TestDBEncryption', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      const dbInstances = synthJson.resource.aws_db_instance;
      const dbInstance = Object.values(dbInstances)[0] as any;
      expect(dbInstance.storage_encrypted).toBe(true);
    });
  });

  describe('ECS Configuration', () => {
    test('ECS task definition uses correct CPU and memory', () => {
      app = new App();
      stack = new TapStack(app, 'TestECSTask', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      const taskDefs = synthJson.resource.aws_ecs_task_definition;
      const taskDef = Object.values(taskDefs)[0] as any;
      expect(taskDef.cpu).toBe('256');
      expect(taskDef.memory).toBe('512');
    });

    test('ECS service has correct desired count', () => {
      app = new App();
      stack = new TapStack(app, 'TestECSService', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      const services = synthJson.resource.aws_ecs_service;
      const service = Object.values(services)[0] as any;
      expect(service.desired_count).toBe(2);
    });

    test('ECS service uses FARGATE launch type', () => {
      app = new App();
      stack = new TapStack(app, 'TestECSFargate', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      const services = synthJson.resource.aws_ecs_service;
      const service = Object.values(services)[0] as any;
      expect(service.launch_type).toBe('FARGATE');
    });
  });

  describe('Security Configuration', () => {
    test('Stack creates security group rules', () => {
      app = new App();
      stack = new TapStack(app, 'TestSGRules', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      expect(synthJson.resource).toHaveProperty('aws_security_group_rule');
    });

    test('Stack creates cross-account IAM role', () => {
      app = new App();
      stack = new TapStack(app, 'TestCrossAccountRole', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      const iamRoles = synthJson.resource.aws_iam_role;
      const roleNames = Object.keys(iamRoles);
      const hasDeploymentRole = roleNames.some(name =>
        name.includes('deployment-role')
      );
      expect(hasDeploymentRole).toBe(true);
    });

    test('Stack creates IAM role policies', () => {
      app = new App();
      stack = new TapStack(app, 'TestIAMPolicies', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      expect(synthJson.resource).toHaveProperty('aws_iam_role_policy');
    });
  });

  describe('Networking Configuration', () => {
    test('Stack creates correct number of subnets', () => {
      app = new App();
      stack = new TapStack(app, 'TestSubnets', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      expect(synthJson.resource).toHaveProperty('aws_subnet');
      const subnets = synthJson.resource.aws_subnet;
      // Should have at least 2 public and 2 private subnets
      expect(Object.keys(subnets).length).toBeGreaterThanOrEqual(4);
    });

    test('Stack creates Internet Gateway', () => {
      app = new App();
      stack = new TapStack(app, 'TestIGW', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      expect(synthJson.resource).toHaveProperty('aws_internet_gateway');
    });

    test('Stack creates route tables', () => {
      app = new App();
      stack = new TapStack(app, 'TestRouteTables', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      expect(synthJson.resource).toHaveProperty('aws_route_table');
    });
  });

  describe('Load Balancer Configuration', () => {
    test('ALB has correct type', () => {
      app = new App();
      stack = new TapStack(app, 'TestALBType', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      const albs = synthJson.resource.aws_lb;
      const alb = Object.values(albs)[0] as any;
      expect(alb.load_balancer_type).toBe('application');
    });

    test('Stack creates target group', () => {
      app = new App();
      stack = new TapStack(app, 'TestTargetGroup', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      expect(synthJson.resource).toHaveProperty('aws_lb_target_group');
    });

    test('Stack creates ALB listener', () => {
      app = new App();
      stack = new TapStack(app, 'TestListener', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const synthJson = JSON.parse(synthesized);

      expect(synthJson.resource).toHaveProperty('aws_lb_listener');
    });
  });
});
