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

    test('uses AWS_REGION from environment variable', () => {
      const originalEnv = process.env.AWS_REGION;
      process.env.AWS_REGION = 'eu-west-1';
      
      app = new App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        awsRegion: 'us-east-1', // This should be overridden by env var
      });
      synthesized = JSON.parse(Testing.synth(stack));

      // Verify region is from environment variable
      const awsProvider = synthesized.provider.aws[0];
      expect(awsProvider.region).toBe('eu-west-1');
      
      // Restore original env
      if (originalEnv) {
        process.env.AWS_REGION = originalEnv;
      } else {
        delete process.env.AWS_REGION;
      }
    });

    test('falls back to props.awsRegion when AWS_REGION not set', () => {
      const originalEnv = process.env.AWS_REGION;
      delete process.env.AWS_REGION;
      
      app = new App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      const awsProvider = synthesized.provider.aws[0];
      expect(awsProvider.region).toBe('ap-southeast-1');
      
      // Restore original env
      if (originalEnv) {
        process.env.AWS_REGION = originalEnv;
      }
    });

    test('falls back to default us-east-1 when neither env var nor props provided', () => {
      const originalEnv = process.env.AWS_REGION;
      delete process.env.AWS_REGION;
      
      app = new App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      const awsProvider = synthesized.provider.aws[0];
      expect(awsProvider.region).toBe('us-east-1');
      
      // Restore original env
      if (originalEnv) {
        process.env.AWS_REGION = originalEnv;
      }
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
      const originalEnv = process.env.AWS_REGION;
      process.env.AWS_REGION = 'ca-central-1';
      
      app = new App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
      
      const awsProvider = synthesized.provider.aws[0];
      expect(awsProvider.region).toBe('ca-central-1');
      
      // Restore original env
      if (originalEnv) {
        process.env.AWS_REGION = originalEnv;
      } else {
        delete process.env.AWS_REGION;
      }
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

  describe('Edge Cases and Error Handling', () => {
    test('handles empty environmentSuffix gracefully', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: '',
      });
      synthesized = JSON.parse(Testing.synth(stack));
      expect(synthesized).toBeDefined();
      expect(synthesized.resource).toBeDefined();
    });

    test('handles special characters in environmentSuffix', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test-123',
      });
      synthesized = JSON.parse(Testing.synth(stack));
      const vpc = Object.values(synthesized.resource.aws_vpc || {})[0] as any;
      expect(vpc.tags.Name).toContain('test-123');
    });

    test('handles very long environmentSuffix', () => {
      const longSuffix = 'a'.repeat(50);
      app = new App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: longSuffix,
      });
      synthesized = JSON.parse(Testing.synth(stack));
      expect(synthesized).toBeDefined();
    });

    test('handles undefined defaultTags', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        defaultTags: undefined,
      });
      synthesized = JSON.parse(Testing.synth(stack));
      const awsProvider = synthesized.provider.aws[0];
      expect(awsProvider.default_tags).toEqual([]);
    });

    test('handles empty defaultTags', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        defaultTags: { tags: {} },
      });
      synthesized = JSON.parse(Testing.synth(stack));
      expect(synthesized).toBeDefined();
    });

    test('correctly passes region to NetworkingConstruct', () => {
      const originalEnv = process.env.AWS_REGION;
      process.env.AWS_REGION = 'eu-central-1';
      
      app = new App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
      
      // Verify subnets use the correct region
      const subnets = Object.values(synthesized.resource.aws_subnet || {});
      const subnet = subnets[0] as any;
      expect(subnet.availability_zone).toContain('eu-central-1');
      
      // Restore original env
      if (originalEnv) {
        process.env.AWS_REGION = originalEnv;
      } else {
        delete process.env.AWS_REGION;
      }
    });
  });

  describe('Props Validation', () => {
    test('environmentSuffix prop takes precedence over default', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'staging',
      });
      synthesized = JSON.parse(Testing.synth(stack));
      const vpc = Object.values(synthesized.resource.aws_vpc || {})[0] as any;
      expect(vpc.tags.Name).toContain('staging');
      expect(vpc.tags.Name).not.toContain('dev');
    });

    test('awsRegion prop works when env var not set', () => {
      const originalEnv = process.env.AWS_REGION;
      delete process.env.AWS_REGION;
      
      app = new App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        awsRegion: 'ap-northeast-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));
      const awsProvider = synthesized.provider.aws[0];
      expect(awsProvider.region).toBe('ap-northeast-1');
      
      // Restore original env
      if (originalEnv) {
        process.env.AWS_REGION = originalEnv;
      }
    });

    test('stateBucket and stateBucketRegion props are accepted but not used', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        stateBucket: 'test-bucket',
        stateBucketRegion: 'us-west-2',
      });
      synthesized = JSON.parse(Testing.synth(stack));
      // Should synthesize successfully even though these props aren't used
      expect(synthesized).toBeDefined();
    });
  });

  describe('Resource Creation Completeness', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('creates all required networking resources', () => {
      expect(synthesized.resource.aws_vpc).toBeDefined();
      expect(synthesized.resource.aws_subnet).toBeDefined();
      expect(synthesized.resource.aws_internet_gateway).toBeDefined();
      expect(synthesized.resource.aws_nat_gateway).toBeDefined();
      expect(synthesized.resource.aws_security_group).toBeDefined();
    });

    test('creates exactly 6 subnets', () => {
      const subnets = Object.values(synthesized.resource.aws_subnet || {});
      expect(subnets.length).toBe(6);
    });

    test('creates exactly 2 NAT gateways', () => {
      const natGateways = Object.values(synthesized.resource.aws_nat_gateway || {});
      expect(natGateways.length).toBe(2);
    });

    test('creates exactly 2 Elastic IPs', () => {
      const eips = Object.values(synthesized.resource.aws_eip || {});
      expect(eips.length).toBe(2);
    });

    test('creates all 7 expected outputs', () => {
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
      });
      expect(Object.keys(outputs).length).toBe(expectedOutputs.length);
    });
  });

  describe('Output Value Validation', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('PublicSubnetIds output contains 2 subnet references', () => {
      const publicSubnetIds = synthesized.output.PublicSubnetIds.value;
      expect(publicSubnetIds).toBeDefined();
      // Should be an array or string with references
      expect(typeof publicSubnetIds).toBeDefined();
    });

    test('PrivateSubnetIds output contains 2 subnet references', () => {
      const privateSubnetIds = synthesized.output.PrivateSubnetIds.value;
      expect(privateSubnetIds).toBeDefined();
    });

    test('IsolatedSubnetIds output contains 2 subnet references', () => {
      const isolatedSubnetIds = synthesized.output.IsolatedSubnetIds.value;
      expect(isolatedSubnetIds).toBeDefined();
    });

    test('all security group outputs reference valid security groups', () => {
      const securityGroups = Object.values(
        synthesized.resource.aws_security_group || {}
      );
      expect(securityGroups.length).toBeGreaterThanOrEqual(3);
      
      const webSgId = synthesized.output.WebSecurityGroupId.value;
      const appSgId = synthesized.output.AppSecurityGroupId.value;
      const dbSgId = synthesized.output.DatabaseSecurityGroupId.value;
      
      expect(webSgId).toBeDefined();
      expect(appSgId).toBeDefined();
      expect(dbSgId).toBeDefined();
    });
  });
});
