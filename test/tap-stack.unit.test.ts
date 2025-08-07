// test/tap-stack.unit.test.ts

import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackDefault', {
      awsRegion: 'us-east-1',
      allowedIngressCidrBlocks: ['1.1.1.1/32'],
    });
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

  test('IAM policy for S3 references a specific bucket ARN pattern', () => {
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
    // Fixed: Expect the synthesized token, not a hardcoded string
    expect(policy.Statement[0].Resource).toEqual([
      '${aws_s3_bucket.s3-bucket.arn}',
      '${aws_s3_bucket.s3-bucket.arn}/*',
    ]);
  });

  test('Security group has correct ingress rules with required CIDR', () => {
    // Objective: Verify the security group rules match the default configuration.
    const sgRuleResources = synthesized.resource.aws_security_group_rule;
    const httpRule = sgRuleResources['http-ingress'];
    const sshRule = sgRuleResources['ssh-ingress'];

    expect(httpRule).toBeDefined();
    expect(httpRule.cidr_blocks).toEqual(['1.1.1.1/32']);
    expect(sshRule).toBeDefined();
    expect(sshRule.cidr_blocks).toEqual(['1.1.1.1/32']);
  });

  test('Tags are applied consistently to the VPC', () => {
    // Objective: Check if the VPC has the expected tags.
    const vpcResource = synthesized.resource.aws_vpc['vpc'];
    expect(vpcResource.tags).toBeDefined();
    expect(vpcResource.tags).toEqual({
      Name: 'TestTapStackDefault-vpc',
    });
  });

  test('NAT Gateways and EIPs are created for each public subnet', () => {
    // Objective: Ensure that the number of EIPs and NAT Gateways matches the number of public subnets.
    const natGatewayResources = Object.values(
      synthesized.resource.aws_nat_gateway
    );
    const eipResources = Object.values(synthesized.resource.aws_eip);
    const publicSubnetResources = Object.values(
      synthesized.resource.aws_subnet
    ).filter(
      (s: any) =>
        s.cidr_block.includes('10.0.0.0') ||
        s.cidr_block.includes('10.0.2.0') ||
        s.cidr_block.includes('10.0.4.0')
    );

    expect(natGatewayResources.length).toBe(publicSubnetResources.length);
    expect(eipResources.length).toBe(publicSubnetResources.length);
  });

  test('KMS key is created for S3 encryption', () => {
    const kmsKeyResource = synthesized.resource.aws_kms_key['s3-kms-key'];
    expect(kmsKeyResource).toBeDefined();
  });
});
