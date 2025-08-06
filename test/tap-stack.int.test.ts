import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  let app: App;
  let stack: TapStack;

  // Use the same environment and stack name as the live deployment
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
  const stackName = `TapStack${environmentSuffix}`;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Multi-Environment Infrastructure Integration', () => {
    test('should deploy environment successfully', async () => {
      app = new App();
      stack = new TapStack(app, stackName, {
        environmentSuffix: environmentSuffix,
        stateBucket: `test-state-bucket-${environmentSuffix}`,
      });

      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      // Validate VPC configuration
      expect(config.resource.aws_vpc).toBeDefined();
      const vpc = Object.values(config.resource.aws_vpc)[0] as any;
      expect(vpc.enable_dns_hostnames).toBe(true);
      expect(vpc.enable_dns_support).toBe(true);

      // Validate subnets are created
      expect(config.resource.aws_subnet).toBeDefined();
      const subnets = Object.values(config.resource.aws_subnet) as any[];
      expect(subnets.length).toBeGreaterThan(0);

      // Validate security groups
      expect(config.resource.aws_security_group).toBeDefined();
      const securityGroups = Object.values(
        config.resource.aws_security_group
      ) as any[];
      expect(securityGroups.length).toBeGreaterThanOrEqual(3); // web, app, db

      // Validate KMS key
      expect(config.resource.aws_kms_key).toBeDefined();

      // Validate IAM role
      expect(config.resource.aws_iam_role).toBeDefined();
    });

    test('should deploy staging environment successfully', async () => {
      app = new App();
      stack = new TapStack(app, stackName, {
        environmentSuffix: environmentSuffix,
        stateBucket: `test-state-bucket-${environmentSuffix}`,
      });

      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      // Validate VPC configuration for staging
      expect(config.resource.aws_vpc).toBeDefined();
      const vpc = Object.values(config.resource.aws_vpc)[0] as any;
      expect(vpc.cidr_block).toBe('10.1.0.0/16');

      // Validate backend configuration
      expect(config.terraform.backend.s3).toBeDefined();
      expect(config.terraform.backend.s3.bucket).toBe(
        'test-state-bucket-staging'
      );
    });

    test('should deploy prod environment successfully', async () => {
      app = new App();
      stack = new TapStack(app, stackName, {
        environmentSuffix: environmentSuffix,
        stateBucket: `test-state-bucket-${environmentSuffix}`,
      });

      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      // Validate VPC configuration for prod
      expect(config.resource.aws_vpc).toBeDefined();
      const vpc = Object.values(config.resource.aws_vpc)[0] as any;
      expect(vpc.cidr_block).toBe('10.2.0.0/16');

      // Validate production-specific settings
      expect(config.terraform.backend.s3).toBeDefined();
      expect(config.terraform.backend.s3.bucket).toBe('test-state-bucket-prod');
    });
  });

  describe('Network Architecture Validation', () => {
    test('should create proper network topology', async () => {
      app = new App();
      stack = new TapStack(app, stackName, {
        environmentSuffix: environmentSuffix,
      });

      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      // Validate Internet Gateway
      expect(config.resource.aws_internet_gateway).toBeDefined();

      // Validate NAT Gateways
      expect(config.resource.aws_nat_gateway).toBeDefined();
      const natGateways = Object.values(
        config.resource.aws_nat_gateway
      ) as any[];
      expect(natGateways.length).toBeGreaterThan(0);

      // Validate EIPs for NAT Gateways
      expect(config.resource.aws_eip).toBeDefined();

      // Validate Route Tables
      expect(config.resource.aws_route_table).toBeDefined();

      // Validate Routes
      expect(config.resource.aws_route).toBeDefined();

      // Validate Route Table Associations
      expect(config.resource.aws_route_table_association).toBeDefined();
    });

    test('should create VPC Flow Logs', async () => {
      app = new App();
      stack = new TapStack(app, stackName, {
        environmentSuffix: environmentSuffix,
      });

      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      // Validate VPC Flow Log
      expect(config.resource.aws_flow_log).toBeDefined();

      // Validate CloudWatch Log Group
      expect(config.resource.aws_cloudwatch_log_group).toBeDefined();
    });
  });

  describe('Security Architecture Validation', () => {
    test('should create layered security groups', async () => {
      app = new App();
      stack = new TapStack(app, stackName, {
        environmentSuffix: environmentSuffix,
      });

      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      const securityGroups = Object.values(
        config.resource.aws_security_group
      ) as any[];
      const securityGroupRules = Object.values(
        config.resource.aws_security_group_rule
      ) as any[];

      // Should have web, app, and db security groups
      expect(securityGroups.length).toBeGreaterThanOrEqual(3);

      // Should have multiple security group rules
      expect(securityGroupRules.length).toBeGreaterThan(5);

      // Validate web security group allows HTTP/HTTPS
      const webRules = securityGroupRules.filter(
        rule => rule.from_port === 80 || rule.from_port === 443
      );
      expect(webRules.length).toBeGreaterThanOrEqual(2);

      // Validate database security group restricts access
      const dbRules = securityGroupRules.filter(
        rule => rule.from_port === 3306
      );
      expect(dbRules.length).toBeGreaterThanOrEqual(1);
    });

    test('should create KMS encryption key', async () => {
      app = new App();
      stack = new TapStack(app, stackName, {
        environmentSuffix: environmentSuffix,
      });

      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      // Validate KMS key
      expect(config.resource.aws_kms_key).toBeDefined();
      const kmsKey = Object.values(config.resource.aws_kms_key)[0] as any;
      expect(kmsKey.description).toContain('encryption');

      // Validate KMS alias
      expect(config.resource.aws_kms_alias).toBeDefined();
    });

    test('should create IAM roles with proper policies', async () => {
      app = new App();
      stack = new TapStack(app, stackName, {
        environmentSuffix: environmentSuffix,
      });

      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      // Validate IAM role
      expect(config.resource.aws_iam_role).toBeDefined();

      // Validate IAM role policy
      expect(config.resource.aws_iam_role_policy).toBeDefined();

      // Validate IAM instance profile
      expect(config.resource.aws_iam_instance_profile).toBeDefined();
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('should apply consistent naming convention', async () => {
      app = new App();
      stack = new TapStack(app, stackName, {
        environmentSuffix: environmentSuffix,
      });

      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      // Check VPC naming
      const vpc = Object.values(config.resource.aws_vpc)[0] as any;
      expect(vpc.tags.Name).toContain('prod');
      expect(vpc.tags.Name).toContain('vpc');

      // Check that all resources have environment tags
      const checkTags = (resources: any) => {
        Object.values(resources).forEach((resource: any) => {
          if (resource.tags) {
            expect(resource.tags.Environment).toBe('prod');
            expect(resource.tags.ManagedBy).toBe('CDKTF');
          }
        });
      };

      checkTags(config.resource.aws_vpc);
      checkTags(config.resource.aws_subnet);
      checkTags(config.resource.aws_security_group);
    });
  });

  describe('Environment-Specific Configuration', () => {
    test('should use correct CIDR blocks per environment', async () => {
      const environments = [
        { env: 'dev', cidr: '10.0.0.0/16' },
        { env: 'staging', cidr: '10.1.0.0/16' },
        { env: 'prod', cidr: '10.2.0.0/16' },
      ];

      for (const { env, cidr } of environments) {
        app = new App();
        stack = new TapStack(app, `IntegrationTestCIDR${env}`, {
          environmentSuffix: env as any,
        });

        const synthesized = Testing.synth(stack);
        const config = JSON.parse(synthesized);
        const vpc = Object.values(config.resource.aws_vpc)[0] as any;

        expect(vpc.cidr_block).toBe(cidr);
      }
    });

    test('should configure backend state correctly per environment', async () => {
      const testEnvironments = ['dev', 'staging', 'prod'];

      for (const env of testEnvironments) {
        app = new App();
        stack = new TapStack(app, `IntegrationTestBackend${env}`, {
          environmentSuffix: env as any,
          stateBucket: `test-bucket-${env}`,
        });

        const synthesized = Testing.synth(stack);
        const config = JSON.parse(synthesized);

        expect(config.terraform.backend.s3.bucket).toBe(`test-bucket-${env}`);
        expect(config.terraform.backend.s3.key).toContain(env);
      }
    });
  });

  describe('Provider and Backend Integration', () => {
    test('should configure AWS provider correctly', async () => {
      app = new App();
      stack = new TapStack(app, stackName, {
        environmentSuffix: environmentSuffix,
        awsRegion: 'us-east-1',
      });

      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      expect(config.provider.aws).toBeDefined();
      expect(Array.isArray(config.provider.aws)).toBe(true);
      expect(config.provider.aws[0]).toBeDefined();
    });

    test('should configure S3 backend with encryption', async () => {
      app = new App();
      stack = new TapStack(app, stackName, {
        environmentSuffix: environmentSuffix,
      });

      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      expect(config.terraform.backend.s3.encrypt).toBe(true);
      expect(config.terraform.backend.s3.use_lockfile).toBe(true);
    });
  });

  describe('End-to-End Infrastructure Validation', () => {
    test('should create complete infrastructure stack', async () => {
      app = new App();
      stack = new TapStack(app, stackName, {
        environmentSuffix: environmentSuffix,
        stateBucket: 'complete-test-bucket',
        stateBucketRegion: 'us-east-1',
        awsRegion: 'us-east-1',
      });

      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      // Validate all major resource types are present
      const expectedResources = [
        'aws_vpc',
        'aws_subnet',
        'aws_internet_gateway',
        'aws_nat_gateway',
        'aws_eip',
        'aws_route_table',
        'aws_route',
        'aws_route_table_association',
        'aws_security_group',
        'aws_security_group_rule',
        'aws_kms_key',
        'aws_kms_alias',
        'aws_iam_role',
        'aws_iam_role_policy',
        'aws_iam_instance_profile',
        'aws_flow_log',
        'aws_cloudwatch_log_group',
      ];

      expectedResources.forEach(resourceType => {
        expect(config.resource[resourceType]).toBeDefined();
        expect(
          Object.keys(config.resource[resourceType]).length
        ).toBeGreaterThan(0);
      });

      // Validate configuration structure
      expect(config.terraform).toBeDefined();
      expect(config.provider).toBeDefined();
      expect(config.resource).toBeDefined();
    });
  });
});
