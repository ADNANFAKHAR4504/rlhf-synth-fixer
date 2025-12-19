import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests', () => {
  let outputs: any;

  beforeAll(() => {
    // Load outputs from synthesized stack
    const outputsPath = path.join(
      __dirname,
      '..',
      'cfn-outputs',
      'flat-outputs.json'
    );

    if (fs.existsSync(outputsPath)) {
      const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
      // Extract stack outputs from nested structure
      // The structure is { "TapStack<suffix>": { outputs } }
      const stackName = Object.keys(rawOutputs)[0];
      outputs = rawOutputs[stackName];
    }
  });

  it('should have VPC ID in outputs', () => {
    expect(outputs).toBeDefined();
    if (outputs) {
      expect(outputs.vpc_id).toBeDefined();
      expect(typeof outputs.vpc_id).toBe('string');
    }
  });

  it('should have RDS endpoint in outputs', () => {
    if (outputs) {
      expect(outputs.rds_endpoint).toBeDefined();
      expect(typeof outputs.rds_endpoint).toBe('string');
      // RDS endpoint should contain postgres
      expect(outputs.rds_endpoint).toContain('.rds.amazonaws.com');
    }
  });

  it('should have S3 bucket name in outputs', () => {
    if (outputs) {
      expect(outputs.s3_bucket_name).toBeDefined();
      expect(typeof outputs.s3_bucket_name).toBe('string');
      expect(outputs.s3_bucket_name).toContain('payment-data-');
    }
  });

  it('should have EC2 instance ID in outputs', () => {
    if (outputs) {
      expect(outputs.ec2_instance_id).toBeDefined();
      expect(typeof outputs.ec2_instance_id).toBe('string');
      expect(outputs.ec2_instance_id).toMatch(/^i-[a-f0-9]+$/);
    }
  });

  it('should have environment in outputs', () => {
    if (outputs) {
      expect(outputs.environment).toBeDefined();
      expect(['dev', 'staging', 'prod']).toContain(outputs.environment);
    }
  });

  it('should have environment_suffix in outputs', () => {
    if (outputs) {
      expect(outputs.environment_suffix).toBeDefined();
      expect(typeof outputs.environment_suffix).toBe('string');
    }
  });
});
