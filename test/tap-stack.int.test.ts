import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  let app: App;
  let stack: TapStack;

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, 'test-stack', {
      environmentSuffix: 'test',
    });
  });

  afterEach(() => {
    app = new App(); // Reset for next test
  });

  it('should synthesize without errors', () => {
    expect(() => {
      Testing.synth(stack);
    }).not.toThrow();
  });

  it('should generate valid Terraform configuration', () => {
    const synthesized = Testing.synth(stack);
    expect(synthesized).toBeDefined();
    expect(typeof synthesized).toBe('string');
    expect(synthesized.length).toBeGreaterThan(0);
  });

  it('should include AWS provider configuration', () => {
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"provider"');
    expect(synthesized).toContain('"aws"');
    expect(synthesized).toContain('"us-west-2"');
  });

  it('should include VPC configuration', () => {
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"aws_vpc"');
    expect(synthesized).toContain('"172.16.0.0/16"');
  });

  it('should include security resources', () => {
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"aws_security_group"');
    expect(synthesized).toContain('"aws_kms_key"');
  });

  it('should include RDS configuration', () => {
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"aws_db_instance"');
    expect(synthesized).toContain('"mysql"');
    expect(synthesized).toContain('"multi_az"');
  });

  it('should include Lambda function', () => {
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"aws_lambda_function"');
    expect(synthesized).toContain('"python3.9"');
  });

  it('should include CloudFront distribution', () => {
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"aws_cloudfront_distribution"');
  });

  it('should include Auto Scaling Group', () => {
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"aws_autoscaling_group"');
    expect(synthesized).toContain('"aws_launch_template"');
  });

  it('should include VPC Flow Logs', () => {
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"aws_flow_log"');
    expect(synthesized).toContain('"aws_cloudwatch_log_group"');
  });

  it('should include WAF v2 configuration', () => {
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"aws_wafv2_web_acl"');
    expect(synthesized).toContain('"CLOUDFRONT"'); // Changed from REGIONAL to CLOUDFRONT for better security
  });

  it('should include S3 bucket with encryption', () => {
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"aws_s3_bucket"');
    expect(synthesized).toContain(
      '"aws_s3_bucket_server_side_encryption_configuration"'
    );
  });

  it('should have proper IAM roles and policies', () => {
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"aws_iam_role"');
    expect(synthesized).toContain('"aws_iam_policy"');
    expect(synthesized).toContain('"aws_iam_role_policy_attachment"');
  });

  it('should include outputs', () => {
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"output"');
    expect(synthesized).toContain('"vpc-id"');
    expect(synthesized).toContain('"cloudfront-domain"');
    expect(synthesized).toContain('"s3-bucket-name"');
    expect(synthesized).toContain('"kms-key-id"');
  });

  it('should use test environment suffix in resource names', () => {
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('-test-');
  });

  it('should have proper tags on all resources', () => {
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('"Environment"');
    expect(synthesized).toContain('"test"');
    expect(synthesized).toContain('"Owner"');
    expect(synthesized).toContain('"DevOps-Team"');
    expect(synthesized).toContain('"Project"');
    expect(synthesized).toContain('"IaC-AWS-Nova-Model-Breaking"');
  });
});
