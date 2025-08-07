// test/tap-stack.unit.test.ts

import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackDefault');
    synthesized = JSON.parse(Testing.synth(stack));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('synthesizes a valid stack with default properties', () => {
    // Objective: Ensure the stack synthesizes without errors and contains the expected resources.
    expect(synthesized).toHaveProperty('resource');
    expect(synthesized.resource).toHaveProperty('aws_vpc');
    expect(synthesized.resource).toHaveProperty('aws_s3_bucket');
    expect(synthesized.resource).toHaveProperty('aws_iam_role');
    expect(synthesized.resource).toHaveProperty('aws_launch_template');
    expect(synthesized.resource).toHaveProperty('aws_autoscaling_group');
    expect(synthesized.resource).toHaveProperty('aws_cloudwatch_log_group');
  });

  test('VPC is created with the correct default CIDR block', () => {
    // Objective: Verify that the VPC resource is created with the default CIDR block.
    const vpcResource = synthesized.resource.aws_vpc['vpc'];
    expect(vpcResource).toBeDefined();
    expect(vpcResource.cidr_block).toBe('10.0.0.0/16');
  });

  test('S3 bucket name is correctly formatted with environment and a unique ID', () => {
    // Objective: Ensure the S3 bucket name follows the naming convention.
    const s3BucketResource = synthesized.resource.aws_s3_bucket['data-bucket'];
    expect(s3BucketResource).toBeDefined();
    expect(s3BucketResource.bucket).toBe(
      'my-tap-bucket-dev-TestTapStackDefault'
    );
  });

  test('IAM policy adheres to least privilege for S3 access', () => {
    // Objective: Check that the IAM policy is scoped to specific actions and resources.
    const s3PolicyResource = synthesized.resource.aws_iam_policy['s3-policy'];
    expect(s3PolicyResource).toBeDefined();
    const policy = JSON.parse(s3PolicyResource.policy);
    expect(policy.Statement[0].Effect).toBe('Allow');
    expect(policy.Statement[0].Action).toEqual([
      's3:GetObject',
      's3:ListBucket',
    ]);
    expect(policy.Statement[0].Resource.length).toBe(2);
    expect(policy.Statement[0].Resource[0]).toContain(
      'arn:aws:s3:::my-tap-bucket-*'
    );
  });

  test('Security group has correct ingress rules with default CIDR', () => {
    // Objective: Verify the security group rules match the default configuration.
    const sgRuleResources = synthesized.resource.aws_security_group_rule;
    const httpRule = sgRuleResources['http-ingress'];
    const sshRule = sgRuleResources['ssh-ingress'];

    expect(httpRule).toBeDefined();
    expect(httpRule.cidr_blocks).toEqual(['0.0.0.0/0']);
    expect(sshRule).toBeDefined();
    expect(sshRule.cidr_blocks).toEqual(['0.0.0.0/0']);
  });

  test('Tags are applied consistently to the VPC', () => {
    // Objective: Check if the VPC has the expected tags.
    const vpcResource = synthesized.resource.aws_vpc['vpc'];
    expect(vpcResource.tags).toBeDefined();
    expect(vpcResource.tags.Project).toBe('MyProject');
    expect(vpcResource.tags.Environment).toBe('Dev');
    expect(vpcResource.tags.Owner).toBe('Akshat Jain');
  });
});
