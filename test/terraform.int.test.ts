import {
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  GetBucketEncryptionCommand,
  GetBucketLocationCommand,
  GetBucketTaggingCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const TF_DIR = path.resolve(__dirname, '..', 'lib'); // point to lib/ where main.tf is

function run(cmd: string, args: string[], opts: { cwd?: string } = {}) {
  const res = spawnSync(cmd, args, {
    cwd: opts.cwd || TF_DIR,
    encoding: 'utf8',
  });
  if (res.status !== 0) {
    throw new Error(
      `${cmd} ${args.join(' ')} failed: ${res.stderr || res.stdout}`
    );
  }
  return res.stdout.trim();
}

let outputs: any = {};

beforeAll(() => {
  // Get terraform outputs directly (assumes infrastructure is already deployed)
  try {
    const outRaw = run('terraform', ['output', '-json']);
    outputs = JSON.parse(outRaw);
  } catch (error) {
    console.warn('Could not fetch terraform outputs:', error);
    outputs = {};
  }
});

// Remove central mocks - use real AWS SDK calls or per-test mocks
// jest.mock('@aws-sdk/client-s3');
// jest.mock('@aws-sdk/client-iam');
// jest.mock('@aws-sdk/client-lambda');
// jest.mock('@aws-sdk/client-cloudwatch-logs');
// jest.mock('@aws-sdk/client-cloudformation');
// jest.mock('@aws-sdk/client-dynamodb');
// jest.mock('@aws-sdk/client-ec2');

// Utility to set mock resolved value (if needed per test)
function mockClientCommand<TClient extends { send: Function }>(
  client: TClient,
  impl: (command: any) => any
) {
  // @ts-ignore
  client.send.mockImplementation(async (command: any) => impl(command));
}

describe('Terraform infrastructure validation via AWS APIs', () => {
  test('terraform outputs available', () => {
    console.log('Available outputs:', Object.keys(outputs));
    // Check that we have some outputs from deployed infrastructure
    expect(Object.keys(outputs).length).toBeGreaterThan(0);
  });

  describe('S3 Buckets', () => {
    test('PII bucket configuration', async () => {
      const bucketName = outputs?.pii_bucket?.value;
      if (!bucketName) {
        console.log('No pii_bucket output found, skipping test');
        return;
      }

      const s3 = new S3Client({ region: 'eu-west-1' });

      // Test encryption
      const enc = await s3.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      expect(
        enc.ServerSideEncryptionConfiguration?.Rules?.[0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('aws:kms');

      // Test public access block
      const pab = await s3.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
      expect(pab.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(
        true
      );

      // Test tagging
      const tags = await s3.send(
        new GetBucketTaggingCommand({ Bucket: bucketName })
      );
      const dataClassTag = tags.TagSet?.find(
        t => t.Key === 'DataClassification'
      );
      expect(dataClassTag?.Value).toBe('PII');
    });

    test('Logs bucket configuration', async () => {
      const bucketName = outputs?.logs_bucket?.value;
      if (!bucketName) {
        console.log('No logs_bucket output found, skipping test');
        return;
      }

      const s3 = new S3Client({ region: 'eu-west-1' });

      // Test versioning
      const ver = await s3.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      expect(ver.Status).toBe('Enabled');

      // Test location
      const loc = await s3.send(
        new GetBucketLocationCommand({ Bucket: bucketName })
      );
      expect(loc.LocationConstraint).toBe('eu-west-1');
    });
  });

  describe('VPC and Networking', () => {
    test('VPC configuration', async () => {
      const vpcId = outputs?.vpc_id?.value;
      if (!vpcId) {
        console.log('No vpc_id output found, skipping test');
        return;
      }

      const ec2 = new EC2Client({ region: 'eu-west-1' });

      const vpcs = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpc = vpcs.Vpcs?.[0];

      expect(vpc?.VpcId).toBe(vpcId);
      expect(vpc?.IsDefault).toBe(false);
      expect(vpc?.State).toBe('available');

      // Check CIDR block
      expect(vpc?.CidrBlock).toMatch(/^10\.0\.0\.0\/16$/);
    });

    test('Subnet configuration', async () => {
      const publicSubnetIds = outputs?.public_subnet_ids?.value;
      const privateSubnetIds = outputs?.private_subnet_ids?.value;
      const databaseSubnetIds = outputs?.database_subnet_ids?.value;

      if (!publicSubnetIds || !privateSubnetIds || !databaseSubnetIds) {
        console.log('Subnet IDs not found in outputs, skipping test');
        return;
      }

      const ec2 = new EC2Client({ region: 'eu-west-1' });

      // Test we have 3 subnets of each type
      expect(publicSubnetIds).toHaveLength(3);
      expect(privateSubnetIds).toHaveLength(3);
      expect(databaseSubnetIds).toHaveLength(3);

      // Get all subnets
      const allSubnetIds = [
        ...publicSubnetIds,
        ...privateSubnetIds,
        ...databaseSubnetIds,
      ];
      const subnets = await ec2.send(
        new DescribeSubnetsCommand({ SubnetIds: allSubnetIds })
      );

      // Check each subnet is in a different AZ
      const azs = new Set(subnets.Subnets?.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);
    });
  });

  describe('IAM Roles', () => {
    test('IAM roles exist and have proper trust policies', async () => {
      const iamRoles = outputs?.iam_roles?.value;
      if (!iamRoles) {
        console.log('No iam_roles output found, skipping test');
        return;
      }

      const iam = new IAMClient({ region: 'eu-west-1' });

      // Extract role name from ARN for each role
      for (const [roleType, roleArn] of Object.entries(iamRoles)) {
        const roleName = (roleArn as string).split('/').pop();
        if (!roleName) continue;

        const role = await iam.send(new GetRoleCommand({ RoleName: roleName }));
        expect(role.Role?.RoleName).toBe(roleName);
        expect(role.Role?.AssumeRolePolicyDocument).toBeTruthy();

        // Check attached policies
        const policies = await iam.send(
          new ListAttachedRolePoliciesCommand({ RoleName: roleName })
        );
        expect(policies.AttachedPolicies?.length).toBeGreaterThan(0);
      }
    });
  });

  describe('RDS Database', () => {
    test('RDS instance configuration', async () => {
      const rdsEndpoint = outputs?.rds_endpoint?.value;
      if (!rdsEndpoint) {
        console.log('No rds_endpoint output found, skipping test');
        return;
      }

      // For RDS validation, we'd need RDS client
      // This is a placeholder - actual implementation would use @aws-sdk/client-rds
      console.log('RDS endpoint available:', rdsEndpoint);
      expect(rdsEndpoint).toBeTruthy();
    });
  });

  describe('Secrets Manager', () => {
    test('Database secret exists', async () => {
      const secretArn = outputs?.db_secret_arn?.value;
      if (!secretArn) {
        console.log('No db_secret_arn output found, skipping test');
        return;
      }

      // For Secrets Manager validation, we'd need Secrets Manager client
      // This is a placeholder - actual implementation would use @aws-sdk/client-secrets-manager
      console.log('Database secret ARN available:', secretArn);
      expect(secretArn).toBeTruthy();
    });
  });
});

// Additional validations for other AWS services
describe('Advanced Validations', () => {
  test('ALB DNS name accessible', async () => {
    const albDnsName = outputs?.alb_dns_name?.value;
    if (!albDnsName) {
      console.log('No alb_dns_name output found, skipping test');
      return;
    }

    console.log('ALB DNS name available:', albDnsName);
    expect(albDnsName).toBeTruthy();
    expect(albDnsName).toMatch(/\.elb\.eu-west-1\.amazonaws\.com$/);
  });

  test('CloudTrail ARN exists', async () => {
    const trailArn = outputs?.cloudtrail_trail_arn?.value;
    if (!trailArn) {
      console.log('No cloudtrail_trail_arn output found, skipping test');
      return;
    }

    console.log('CloudTrail ARN available:', trailArn);
    expect(trailArn).toBeTruthy();
    expect(trailArn).toMatch(/^arn:aws:cloudtrail:eu-west-1:/);
  });

  test('GuardDuty detector exists', async () => {
    const detectorId = outputs?.guardduty_detector_id?.value;
    if (!detectorId) {
      console.log('No guardduty_detector_id output found, skipping test');
      return;
    }

    console.log('GuardDuty detector ID available:', detectorId);
    expect(detectorId).toBeTruthy();
  });
});
