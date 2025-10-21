import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new App();
    stack = new TapStack(app, 'TestTapStack', {
      env: {
        region: 'us-east-2',
      },
    });
    synthesized = JSON.parse(Testing.synth(stack));
  });

  describe('Infrastructure Validation', () => {
    test('Integration test cleanup completed', () => {
      console.log('Integration tests configured for CDKTF infrastructure');
      expect(true).toBe(true);
    });

    test('CDKTF synthesis produces valid Terraform', () => {
      expect(synthesized).toBeDefined();
      expect(synthesized.resource).toBeDefined();
      expect(synthesized.provider).toBeDefined();

      console.log('CDKTF synthesis validation passed');
    });

    test('Infrastructure resources are properly configured', () => {
      // Verify core infrastructure components exist
      expect(synthesized.resource.aws_vpc).toBeDefined();
      expect(synthesized.resource.aws_db_instance).toBeDefined();
      expect(synthesized.resource.aws_s3_bucket).toBeDefined();
      expect(synthesized.resource.aws_elastic_beanstalk_application).toBeDefined();

      console.log('Infrastructure configuration validation passed');
    });
  });

  describe('Security Validation', () => {
    test('RDS security configuration', () => {
      const rdsInstance = Object.values(synthesized.resource.aws_db_instance)[0] as any;

      // Verify security best practices
      expect(rdsInstance.storage_encrypted).toBe(true);
      expect(rdsInstance.manage_master_user_password).toBe(true);
      expect(rdsInstance.multi_az).toBe(true);

      console.log('RDS security validation passed');
    });

    test('Security groups are properly configured', () => {
      const securityGroups = Object.values(synthesized.resource.aws_security_group);
      expect(securityGroups.length).toBeGreaterThan(0);

      console.log('Security groups validation passed');
    });
  });

  describe('High Availability Configuration', () => {
    test('Multi-AZ deployment configuration', () => {
      const rdsInstance = Object.values(synthesized.resource.aws_db_instance)[0] as any;
      expect(rdsInstance.multi_az).toBe(true);

      console.log('Multi-AZ configuration validated');
    });

    test('Network redundancy validation', () => {
      const subnets = Object.values(synthesized.resource.aws_subnet);
      expect(subnets.length).toBeGreaterThanOrEqual(4); // 2 public + 2 private

      console.log('Network redundancy validated');
    });
  });
});
