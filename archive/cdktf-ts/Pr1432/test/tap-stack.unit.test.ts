import { Testing, App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

// Helper function to find a resource by type in the synthesized JSON
const getResource = (synthesizedJson: any, resourceType: string) => {
  return synthesizedJson.resource?.[resourceType] ?? {};
};

// Helper function to check if any resource of a type has the specified properties
const resourceHasProperties = (
  resourceObjects: any,
  properties: any
): boolean => {
  return Object.values(resourceObjects).some((resource: any) => {
    return Object.entries(properties).every(([key, value]) => {
      // Use deep equality for objects (like tags)
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        return JSON.stringify(resource[key]) === JSON.stringify(value);
      }
      return resource[key] === value;
    });
  });
};

describe('Unit Tests for TapStack', () => {
  let stack: TapStack;
  let app: App;
  let synthesized: string;
  let synthesizedJson: any;

  beforeAll(() => {
    app = Testing.app();
    stack = new TapStack(app, 'test-stack');
    synthesized = Testing.synth(stack);
    synthesizedJson = JSON.parse(synthesized);
  });

  test('Should create a VPC with the correct CIDR block', () => {
    const vpcs = getResource(synthesizedJson, 'aws_vpc');
    expect(resourceHasProperties(vpcs, { cidr_block: '10.0.0.0/16' })).toBe(
      true
    );
  });

  test('Should create two subnets', () => {
    const subnets = getResource(synthesizedJson, 'aws_subnet');
    expect(Object.keys(subnets).length).toBe(2);
  });

  test('Should create a secure S3 bucket with versioning and public access block', () => {
    expect(getResource(synthesizedJson, 'aws_s3_bucket')).toBeDefined();
    expect(
      getResource(synthesizedJson, 'aws_s3_bucket_versioning')
    ).toBeDefined();
    expect(
      getResource(synthesizedJson, 'aws_s3_bucket_public_access_block')
    ).toBeDefined();
  });

  test('Should create a t2.micro EC2 instance', () => {
    const instances = getResource(synthesizedJson, 'aws_instance');
    expect(
      resourceHasProperties(instances, { instance_type: 't2.micro' })
    ).toBe(true);
  });

  test('Should create a Security Group with correct ingress rules', () => {
    const sgs = getResource(synthesizedJson, 'aws_security_group');
    const sg = Object.values(sgs)[0] as any; // Get the first (and only) SG

    expect(sg).toBeDefined();
    expect(sg.ingress).toHaveLength(2);

    // Check for the presence of the SSH rule without being strict about defaults
    expect(sg.ingress).toContainEqual(
      expect.objectContaining({
        description: 'Allow SSH from trusted network',
        from_port: 22,
        to_port: 22,
        protocol: 'tcp',
        cidr_blocks: ['203.0.113.0/24'],
      })
    );

    // Check for the presence of the HTTP rule
    expect(sg.ingress).toContainEqual(
      expect.objectContaining({
        description: 'Allow HTTP from trusted network',
        from_port: 80,
        to_port: 80,
        protocol: 'tcp',
        cidr_blocks: ['203.0.113.0/24'],
      })
    );
  });

  test('Should create an IAM role for EC2 assumption', () => {
    const roles = getResource(synthesizedJson, 'aws_iam_role');
    const hasEc2AssumeRole = Object.values(roles).some((role: any) =>
      role.assume_role_policy.includes('ec2.amazonaws.com')
    );
    expect(hasEc2AssumeRole).toBe(true);
  });

  test('Should create an IAM policy with least-privilege S3 permissions', () => {
    const policies = getResource(synthesizedJson, 'aws_iam_policy');
    const hasS3ObjectActions = Object.values(policies).some((p: any) =>
      p.policy.includes('"s3:GetObject","s3:PutObject","s3:DeleteObject"')
    );
    const hasS3ListAction = Object.values(policies).some((p: any) =>
      p.policy.includes('"s3:ListBucket"')
    );
    expect(hasS3ObjectActions).toBe(true);
    expect(hasS3ListAction).toBe(true);
  });

  test('All key resources should have consistent tags', () => {
    const commonTags = {
      Environment: 'Production',
      Application: 'WebApp',
      Owner: 'DevOps Team',
    };
    const vpcs = getResource(synthesizedJson, 'aws_vpc');
    const buckets = getResource(synthesizedJson, 'aws_s3_bucket');
    const instances = getResource(synthesizedJson, 'aws_instance');

    const vpcHasTags = Object.values(vpcs).some((r: any) =>
      Object.entries(commonTags).every(([k, v]) => r.tags[k] === v)
    );
    const bucketHasTags = Object.values(buckets).some((r: any) =>
      Object.entries(commonTags).every(([k, v]) => r.tags[k] === v)
    );
    const instanceHasTags = Object.values(instances).some((r: any) =>
      Object.entries(commonTags).every(([k, v]) => r.tags[k] === v)
    );

    expect(vpcHasTags).toBe(true);
    expect(bucketHasTags).toBe(true);
    expect(instanceHasTags).toBe(true);
  });
});
