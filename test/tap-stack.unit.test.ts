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
    test('instantiates successfully with all props', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        stateBucket: 'test-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-west-2',
        defaultTags: {
          tags: {
            Environment: 'test',
            Project: 'test-project',
          },
        },
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('instantiates successfully with minimal props', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'dev',
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('uses default values when no props provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStack');
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('overrides AWS region to ca-central-1', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        awsRegion: 'us-east-1', // This should be overridden
      });
      synthesized = JSON.parse(Testing.synth(stack));

      // Verify region is ca-central-1
      const awsProvider = synthesized.provider.aws[0];
      expect(awsProvider.region).toBe('ca-central-1');
    });
  });

  describe('AWS Provider Configuration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        defaultTags: {
          tags: {
            Environment: 'production',
            Project: 'payment-platform',
          },
        },
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('configures AWS provider with correct region', () => {
      const awsProvider = synthesized.provider.aws[0];
      expect(awsProvider.region).toBe('ca-central-1');
    });

    test('configures AWS provider with default tags', () => {
      const awsProvider = synthesized.provider.aws[0];
      expect(awsProvider.default_tags).toBeDefined();
      expect(awsProvider.default_tags[0].tags).toBeDefined();
    });

    test('handles missing default tags gracefully', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackNoTags', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
      const awsProvider = synthesized.provider.aws[0];
      expect(awsProvider).toBeDefined();
    });
  });

  describe('NetworkingConstruct Integration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('creates networking construct with correct props', () => {
      // Verify VPC is created
      const vpc = Object.values(synthesized.resource.aws_vpc || {})[0] as any;
      expect(vpc).toBeDefined();
    });

    test('networking construct uses environment suffix', () => {
      const vpc = Object.values(synthesized.resource.aws_vpc || {})[0] as any;
      expect(vpc.tags.Name).toContain('test');
    });
  });

  describe('Stack Outputs', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('exports VpcId output', () => {
      expect(synthesized.output.VpcId).toBeDefined();
      expect(synthesized.output.VpcId.description).toBe('VPC ID');
    });

    test('exports PublicSubnetIds output', () => {
      expect(synthesized.output.PublicSubnetIds).toBeDefined();
      expect(synthesized.output.PublicSubnetIds.description).toBe(
        'Public subnet IDs'
      );
    });

    test('exports PrivateSubnetIds output', () => {
      expect(synthesized.output.PrivateSubnetIds).toBeDefined();
      expect(synthesized.output.PrivateSubnetIds.description).toBe(
        'Private subnet IDs'
      );
    });

    test('exports IsolatedSubnetIds output', () => {
      expect(synthesized.output.IsolatedSubnetIds).toBeDefined();
      expect(synthesized.output.IsolatedSubnetIds.description).toBe(
        'Isolated subnet IDs'
      );
    });

    test('exports WebSecurityGroupId output', () => {
      expect(synthesized.output.WebSecurityGroupId).toBeDefined();
      expect(synthesized.output.WebSecurityGroupId.description).toBe(
        'Web tier security group ID'
      );
    });

    test('exports AppSecurityGroupId output', () => {
      expect(synthesized.output.AppSecurityGroupId).toBeDefined();
      expect(synthesized.output.AppSecurityGroupId.description).toBe(
        'App tier security group ID'
      );
    });

    test('exports DatabaseSecurityGroupId output', () => {
      expect(synthesized.output.DatabaseSecurityGroupId).toBeDefined();
      expect(synthesized.output.DatabaseSecurityGroupId.description).toBe(
        'Database tier security group ID'
      );
    });

    test('all outputs are defined and have descriptions', () => {
      const outputs = synthesized.output;
      const expectedOutputs = [
        'VpcId',
        'PublicSubnetIds',
        'PrivateSubnetIds',
        'IsolatedSubnetIds',
        'WebSecurityGroupId',
        'AppSecurityGroupId',
        'DatabaseSecurityGroupId',
      ];

      expectedOutputs.forEach((outputName) => {
        expect(outputs[outputName]).toBeDefined();
        expect(outputs[outputName].description).toBeDefined();
        expect(outputs[outputName].description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Environment Suffix Usage', () => {
    test('uses environmentSuffix from props', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'custom',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      const vpc = Object.values(synthesized.resource.aws_vpc || {})[0] as any;
      expect(vpc.tags.Name).toContain('custom');
    });

    test('defaults to dev when no environmentSuffix provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStack');
      synthesized = JSON.parse(Testing.synth(stack));

      const vpc = Object.values(synthesized.resource.aws_vpc || {})[0] as any;
      expect(vpc.tags.Name).toContain('dev');
    });
  });

  describe('Resource Tagging', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('VPC has required tags', () => {
      const vpc = Object.values(synthesized.resource.aws_vpc || {})[0] as any;
      expect(vpc.tags).toBeDefined();
      expect(vpc.tags.Environment).toBe('production');
      expect(vpc.tags.Project).toBe('payment-platform');
    });

    test('all subnets have required tags', () => {
      const subnets = Object.values(synthesized.resource.aws_subnet || {});
      expect(subnets.length).toBeGreaterThan(0);

      subnets.forEach((subnet: any) => {
        expect(subnet.tags).toBeDefined();
        expect(subnet.tags.Environment).toBe('production');
        expect(subnet.tags.Project).toBe('payment-platform');
      });
    });

    test('security groups have required tags', () => {
      const securityGroups = Object.values(
        synthesized.resource.aws_security_group || {}
      );
      expect(securityGroups.length).toBeGreaterThan(0);

      securityGroups.forEach((sg: any) => {
        expect(sg.tags).toBeDefined();
        expect(sg.tags.Environment).toBe('production');
        expect(sg.tags.Project).toBe('payment-platform');
      });
    });
  });
});
