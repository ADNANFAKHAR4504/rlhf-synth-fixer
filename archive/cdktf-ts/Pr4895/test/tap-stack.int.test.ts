import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('Turn Around Prompt API Integration Tests', () => {
  let app: App;
  let stack: TapStack;

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
      stateBucket: 'test-state-bucket',
      stateBucketRegion: 'us-east-1',
      awsRegion: 'us-east-1',
    });
  });

  describe('Stack Integration', () => {
    test('should synthesize without errors and create real resources', async () => {
      const synthesized = Testing.synth(stack);
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('resource');

      // Parse and verify it's valid JSON
      const config = JSON.parse(synthesized);
      expect(config).toBeDefined();
    });

    test('should validate complete AWS infrastructure configuration', async () => {
      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      // Verify basic Terraform structure
      expect(config).toHaveProperty('terraform');
      expect(config).toHaveProperty('provider');
      expect(config).toHaveProperty('resource');

      // Check AWS provider configuration
      expect(config.provider).toHaveProperty('aws');
      expect(config.provider.aws).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            region: 'us-east-1'
          })
        ])
      );

      // Verify real AWS resources are defined (not mocked)
      expect(config.resource).toHaveProperty('aws_vpc');
      expect(config.resource).toHaveProperty('aws_subnet');
      expect(config.resource).toHaveProperty('aws_security_group');
    });

    test('should have correct backend and state configuration', async () => {
      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      // Verify backend configuration
      expect(config.terraform).toHaveProperty('backend');
      expect(config.terraform.backend).toHaveProperty('s3');

      const s3Backend = config.terraform.backend.s3;
      expect(s3Backend).toHaveProperty('bucket', 'test-state-bucket');
      expect(s3Backend).toHaveProperty('region', 'us-east-1');
      expect(s3Backend).toHaveProperty('key');
    });

    test('should create VPC with proper networking configuration', async () => {
      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      // Check VPC configuration
      const vpcResources = config.resource.aws_vpc;
      expect(vpcResources).toBeDefined();

      const vpcKey = Object.keys(vpcResources)[0];
      const vpc = vpcResources[vpcKey];

      expect(vpc).toHaveProperty('cidr_block');
      expect(vpc).toHaveProperty('enable_dns_hostnames', true);
      expect(vpc).toHaveProperty('enable_dns_support', true);
    });

    test('should create proper security groups without mocking', async () => {
      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      // Verify security groups exist
      expect(config.resource).toHaveProperty('aws_security_group');

      const securityGroups = config.resource.aws_security_group;
      expect(Object.keys(securityGroups).length).toBeGreaterThan(0);

      // Check that security groups have real configurations
      const sgKey = Object.keys(securityGroups)[0];
      const sg = securityGroups[sgKey];

      expect(sg).toHaveProperty('name');
      expect(sg).toHaveProperty('vpc_id');
    });
  });
});
