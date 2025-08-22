import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  let resources: any;

  beforeAll(() => {
    const app = Testing.app();
    const stack = new TapStack(app, 'integration-test-stack');
    const synthesized = Testing.synth(stack);
    resources = JSON.parse(synthesized).resource;
  });

  it('should create a NAT Gateway and an Internet Gateway', () => {
    expect(Object.keys(resources.aws_nat_gateway || {}).length).toBe(1);
    expect(Object.keys(resources.aws_internet_gateway || {}).length).toBe(1);
  });

  it('should create two subnets (one public, one private)', () => {
    const subnets = Object.values(resources.aws_subnet) as any[];
    const publicSubnets = subnets.filter(
      s => s.map_public_ip_on_launch === true
    );
    const privateSubnets = subnets.filter(
      s => s.map_public_ip_on_launch === false
    );

    expect(subnets.length).toBe(2);
    expect(publicSubnets.length).toBe(1);
    expect(privateSubnets.length).toBe(1);
  });

  it('should create two S3 buckets and enable bucket key on the data bucket', () => {
    const buckets = Object.values(resources.aws_s3_bucket) as any[];
    const encryptionConfig = Object.values(
      resources.aws_s3_bucket_server_side_encryption_configuration
    )[0] as any;

    expect(buckets.length).toBe(2);
    expect(encryptionConfig.rule[0].bucket_key_enabled).toBe(true);
  });

  it('should create two IAM Roles (one for Flow Logs, one for EC2)', () => {
    const roles = Object.keys(resources.aws_iam_role || {});
    expect(roles.length).toBe(2);
    expect(roles.some(r => r.startsWith('FlowLogRole'))).toBe(true);
    expect(roles.some(r => r.startsWith('Ec2AppRole'))).toBe(true);
  });

  it('should apply correct tags to all key resources', () => {
    const vpc = Object.values(resources.aws_vpc)[0] as any;
    const instance = Object.values(resources.aws_instance)[0] as any;
    const kmsKey = Object.values(resources.aws_kms_key)[0] as any;
    const dataBucket = Object.values(resources.aws_s3_bucket).find((b: any) =>
      b.bucket.startsWith('secure-infra-data-')
    ) as any;

    const expectedTags = {
      Project: 'SecureWebApp',
      Environment: 'Production',
      Owner: 'SecurityTeam',
    };

    expect(vpc.tags).toMatchObject(expectedTags);
    expect(instance.tags).toMatchObject(expectedTags);
    expect(kmsKey.tags).toMatchObject(expectedTags);
    expect(dataBucket.tags).toMatchObject(expectedTags);
  });
});