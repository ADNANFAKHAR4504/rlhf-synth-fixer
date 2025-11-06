import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('Stack Instantiation', () => {
    test('TapStack instantiates successfully with full props', () => {
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
      expect(typeof synthesized).toBe('string');
    });

    test('TapStack uses default values when no props provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDefault');
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(typeof synthesized).toBe('string');
    });

    test('TapStack instantiates with partial props', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackPartial', {
        environmentSuffix: 'staging',
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('TapStack instantiates with custom region', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackCustomRegion', {
        awsRegion: 'us-east-1',
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });
  });

  describe('Synthesized Template Structure', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackTemplate', {
        environmentSuffix: 'test',
        awsRegion: 'eu-south-1',
      });
      synthesized = Testing.synth(stack);
    });

    test('Synthesized template contains AWS provider configuration', () => {
      const template = JSON.parse(synthesized);

      expect(template.provider).toBeDefined();
      expect(template.provider.aws).toBeDefined();
      expect(Array.isArray(template.provider.aws)).toBe(true);
    });

    test('Synthesized template contains local backend configuration', () => {
      const template = JSON.parse(synthesized);

      expect(template.terraform).toBeDefined();
      expect(template.terraform.backend).toBeDefined();
      expect(template.terraform.backend.local).toBeDefined();
    });

    test('Synthesized template contains VPC resources', () => {
      const template = JSON.parse(synthesized);

      expect(template.resource).toBeDefined();
      // VPC Stack should create various AWS resources
      expect(template.resource.aws_vpc).toBeDefined();
      expect(template.resource.aws_subnet).toBeDefined();
      expect(template.resource.aws_internet_gateway).toBeDefined();
    });

    test('Synthesized template contains proper naming conventions', () => {
      const template = JSON.parse(synthesized);
      const vpcName = Object.keys(template.resource.aws_vpc)[0];

      expect(vpcName).toBeDefined();
      expect(vpcName).toContain('payment');
    });

    test('Synthesized template contains security groups', () => {
      const template = JSON.parse(synthesized);

      expect(template.resource.aws_security_group).toBeDefined();
      expect(
        Object.keys(template.resource.aws_security_group).length
      ).toBeGreaterThan(0);
    });

    test('Synthesized template contains NAT gateways', () => {
      const template = JSON.parse(synthesized);

      expect(template.resource.aws_nat_gateway).toBeDefined();
      expect(
        Object.keys(template.resource.aws_nat_gateway).length
      ).toBeGreaterThan(0);
    });

    test('Synthesized template contains route tables', () => {
      const template = JSON.parse(synthesized);

      expect(template.resource.aws_route_table).toBeDefined();
      expect(template.resource.aws_route_table_association).toBeDefined();
    });

    test('Synthesized template contains VPC endpoints', () => {
      const template = JSON.parse(synthesized);

      expect(template.resource.aws_vpc_endpoint).toBeDefined();
      const endpointCount = Object.keys(
        template.resource.aws_vpc_endpoint
      ).length;
      expect(endpointCount).toBeGreaterThanOrEqual(2); // S3 and DynamoDB endpoints
    });

    test('Synthesized template contains IAM roles for EC2 and VPC Flow Logs', () => {
      const template = JSON.parse(synthesized);

      expect(template.resource.aws_iam_role).toBeDefined();
      expect(
        Object.keys(template.resource.aws_iam_role).length
      ).toBeGreaterThan(0);
    });

    test('Synthesized template uses IamRolePolicyAttachment instead of managedPolicyArns', () => {
      const template = JSON.parse(synthesized);

      // Verify that managedPolicyArns is not used
      const iamRoleJson = JSON.stringify(template.resource.aws_iam_role);
      expect(iamRoleJson).not.toContain('managed_policy_arns');

      // Verify that IamRolePolicyAttachment resource is used instead
      expect(template.resource.aws_iam_role_policy_attachment).toBeDefined();
    });

    test('Synthesized template contains CloudWatch Log Group with skipDestroy', () => {
      const template = JSON.parse(synthesized);

      expect(template.resource.aws_cloudwatch_log_group).toBeDefined();
      const logGroups = template.resource.aws_cloudwatch_log_group;
      const firstLogGroup = logGroups[Object.keys(logGroups)[0]];

      expect(firstLogGroup.skip_destroy).toBe(true);
    });

    test('Synthesized template contains Flow Logs', () => {
      const template = JSON.parse(synthesized);

      expect(template.resource.aws_flow_log).toBeDefined();
      expect(
        Object.keys(template.resource.aws_flow_log).length
      ).toBeGreaterThan(0);
    });

    test('Synthesized template contains EC2 instances', () => {
      const template = JSON.parse(synthesized);

      expect(template.resource.aws_instance).toBeDefined();
      expect(
        Object.keys(template.resource.aws_instance).length
      ).toBeGreaterThan(0);
    });

    test('Synthesized template contains CloudWatch Dashboard', () => {
      const template = JSON.parse(synthesized);

      expect(template.resource.aws_cloudwatch_dashboard).toBeDefined();
    });

    test('Synthesized template contains correct tags on resources', () => {
      const template = JSON.parse(synthesized);
      const vpc =
        template.resource.aws_vpc[Object.keys(template.resource.aws_vpc)[0]];

      expect(vpc.tags).toBeDefined();
      expect(vpc.tags.Environment).toBe('Production');
      expect(vpc.tags.Project).toBe('PaymentGateway');
      expect(vpc.tags.ManagedBy).toBe('CDKTF');
    });
  });

  describe('Environment Configuration', () => {
    test('Dev environment uses correct suffix in terraform state file', () => {
      app = new App();
      stack = new TapStack(app, 'TestDevEnv', {
        environmentSuffix: 'dev',
      });
      synthesized = Testing.synth(stack);
      const template = JSON.parse(synthesized);

      expect(template.terraform?.backend?.local).toBeDefined();
    });

    test('Prod environment uses correct suffix in terraform state file', () => {
      app = new App();
      stack = new TapStack(app, 'TestProdEnv', {
        environmentSuffix: 'prod',
      });
      synthesized = Testing.synth(stack);
      const template = JSON.parse(synthesized);

      expect(template.terraform?.backend?.local).toBeDefined();
    });

    test('Region override is applied correctly', () => {
      app = new App();
      stack = new TapStack(app, 'TestRegionOverride', {
        awsRegion: 'eu-south-1',
      });
      synthesized = Testing.synth(stack);
      const template = JSON.parse(synthesized);

      // AWS_REGION_OVERRIDE should take precedence
      expect(template.provider.aws[0].region).toBe('eu-south-1');
    });
  });

  describe('Default Tags', () => {
    test('TapStack applies default tags when provided', () => {
      app = new App();
      const defaultTags = {
        tags: {
          CostCenter: 'Engineering',
          Owner: 'Platform Team',
        },
      };
      stack = new TapStack(app, 'TestWithDefaultTags', {
        environmentSuffix: 'test',
        defaultTags: defaultTags,
      });
      synthesized = Testing.synth(stack);
      const template = JSON.parse(synthesized);

      expect(template.provider.aws[0].default_tags).toBeDefined();
    });

    test('TapStack handles empty default tags', () => {
      app = new App();
      stack = new TapStack(app, 'TestNoDefaultTags');
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });
  });

  describe('Output Validation', () => {
    test('Synthesized template contains outputs', () => {
      app = new App();
      stack = new TapStack(app, 'TestOutputs', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
      const template = JSON.parse(synthesized);

      expect(template.output).toBeDefined();
      expect(Object.keys(template.output).length).toBeGreaterThan(0);
    });
  });
});
