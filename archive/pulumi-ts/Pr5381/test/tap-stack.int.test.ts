import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
} from '@aws-sdk/client-s3';

interface DeploymentOutputs {
  vpcId: string;
  publicSubnetIds: string[] | string;
  privateSubnetIds: string[] | string;
  databaseSubnetIds: string[] | string;
  webSecurityGroupId: string;
  appSecurityGroupId: string;
  dbSecurityGroupId: string;
  s3BucketName: string;
  [key: string]: unknown;
}

const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
const requiredKeys: Array<keyof DeploymentOutputs> = [
  'vpcId',
  'publicSubnetIds',
  'privateSubnetIds',
  'databaseSubnetIds',
  'webSecurityGroupId',
  'appSecurityGroupId',
  'dbSecurityGroupId',
  's3BucketName',
];

const normalizeIdList = (value: string[] | string): string[] => {
  if (Array.isArray(value)) {
    return value.map((v) => v.trim()).filter((v) => v.length > 0);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed
        .map((v) => (typeof v === 'string' ? v.trim() : String(v)))
        .filter((v) => v.length > 0);
    }
  } catch (error) {
    // Ignore parse errors and fall back to delimiter-based parsing.
  }

  if (trimmed.includes(',')) {
    return trimmed
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  }

  return trimmed
    .split(/\s+/)
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
};

let outputs: DeploymentOutputs;
let publicSubnets: string[];
let privateSubnets: string[];
let databaseSubnets: string[];

beforeAll(() => {
  if (!fs.existsSync(outputsPath)) {
    throw new Error(
      `Deployment outputs not found at ${outputsPath}. Deploy the stack and export outputs first.`
    );
  }

  const raw = fs.readFileSync(outputsPath, 'utf-8');
  outputs = JSON.parse(raw) as DeploymentOutputs;

  publicSubnets = normalizeIdList(outputs.publicSubnetIds);
  privateSubnets = normalizeIdList(outputs.privateSubnetIds);
  databaseSubnets = normalizeIdList(outputs.databaseSubnetIds);
});

describe('TapStack Integration Tests - Output Validation Suite', () => {
  it('should include all required deployment output keys', () => {
    requiredKeys.forEach((key) => {
      expect(outputs[key]).toBeDefined();
    });
  });

  it('should contain non-empty scalar outputs', () => {
    expect(outputs.vpcId).toMatch(/\S/);
    expect(outputs.webSecurityGroupId).toMatch(/\S/);
    expect(outputs.appSecurityGroupId).toMatch(/\S/);
    expect(outputs.dbSecurityGroupId).toMatch(/\S/);
    expect(outputs.s3BucketName).toMatch(/\S/);
  });

  it('should provide a VPC ID in the expected format', () => {
    expect(outputs.vpcId).toMatch(/^vpc-[0-9a-f]+$/);
  });

  it('should provide security group IDs in the expected format', () => {
    expect(outputs.webSecurityGroupId).toMatch(/^sg-[0-9a-f]+$/);
    expect(outputs.appSecurityGroupId).toMatch(/^sg-[0-9a-f]+$/);
    expect(outputs.dbSecurityGroupId).toMatch(/^sg-[0-9a-f]+$/);
  });

  it('should have unique security group identifiers', () => {
    const uniqueSecurityGroups = new Set([
      outputs.webSecurityGroupId,
      outputs.appSecurityGroupId,
      outputs.dbSecurityGroupId,
    ]);
    expect(uniqueSecurityGroups.size).toBe(3);
  });

  it('should normalize public subnet outputs into an array', () => {
    expect(Array.isArray(publicSubnets)).toBe(true);
    expect(publicSubnets.length).toBeGreaterThan(0);
  });

  it('should normalize private subnet outputs into an array', () => {
    expect(Array.isArray(privateSubnets)).toBe(true);
    expect(privateSubnets.length).toBeGreaterThan(0);
  });

  it('should normalize database subnet outputs into an array', () => {
    expect(Array.isArray(databaseSubnets)).toBe(true);
    expect(databaseSubnets.length).toBeGreaterThan(0);
  });

  it('should provide at least two public subnets for high availability', () => {
    expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
  });

  it('should provide at least two private subnets for high availability', () => {
    expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
  });

  it('should provide at least two database subnets for high availability', () => {
    expect(databaseSubnets.length).toBeGreaterThanOrEqual(2);
  });

  it('should expose only unique subnet identifiers across all tiers', () => {
    const allSubnets = [...publicSubnets, ...privateSubnets, ...databaseSubnets];
    const uniqueSubnets = new Set(allSubnets);
    expect(uniqueSubnets.size).toBe(allSubnets.length);
  });

  it('should provide subnet IDs in the expected AWS format', () => {
    const subnetIdPattern = /^subnet-[0-9a-f]+$/;
    [...publicSubnets, ...privateSubnets, ...databaseSubnets].forEach((subnetId) => {
      expect(subnetId).toMatch(subnetIdPattern);
    });
  });

  it('should expose a bucket name compatible with S3 requirements', () => {
    expect(outputs.s3BucketName).toMatch(/^[a-z0-9.-]{3,63}$/);
    expect(outputs.s3BucketName).not.toMatch(/[A-Z_]/);
  });
});

const liveRegion = process.env.AWS_REGION?.trim();
const describeLiveAws = liveRegion ? describe : describe.skip;

describeLiveAws('TapStack Live AWS Integration Tests', () => {
  const region = liveRegion!;
  const ec2Client = new EC2Client({ region });
  const s3Client = new S3Client({ region });

  it('should confirm the VPC exists in the target region', async () => {
    const response = await ec2Client.send(
      new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      })
    );

    expect(response.Vpcs).toBeDefined();
    expect(response.Vpcs!.length).toBeGreaterThan(0);

    const [vpc] = response.Vpcs!;
    expect(vpc.VpcId).toBe(outputs.vpcId);
    expect(vpc.State).toBe('available');
    expect(vpc.CidrBlock).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.0\/\d{1,2}$/);
  });

  it('should verify all declared subnets exist and belong to the VPC', async () => {
    const subnetIds = [...publicSubnets, ...privateSubnets, ...databaseSubnets];
    const response = await ec2Client.send(
      new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      })
    );

    expect(response.Subnets).toBeDefined();
    expect(response.Subnets!.length).toBe(subnetIds.length);

    response.Subnets!.forEach((subnet) => {
      expect(subnet.VpcId).toBe(outputs.vpcId);
      expect(subnet.AvailabilityZone).toMatch(new RegExp(`^${region}[a-z]?$`, 'i'));
    });
  });

  it('should ensure security groups exist and are scoped to the VPC', async () => {
    const response = await ec2Client.send(
      new DescribeSecurityGroupsCommand({
        GroupIds: [
          outputs.webSecurityGroupId,
          outputs.appSecurityGroupId,
          outputs.dbSecurityGroupId,
        ],
      })
    );

    expect(response.SecurityGroups).toBeDefined();
    expect(response.SecurityGroups!.length).toBe(3);

    response.SecurityGroups!.forEach((group) => {
      expect(group.VpcId).toBe(outputs.vpcId);
      expect(group.GroupId).toMatch(/^sg-[0-9a-f]+$/);
      expect(group.GroupName).toMatch(/\S/);
    });
  });

  it('should confirm the S3 bucket is accessible and versioned', async () => {
    await s3Client.send(
      new HeadBucketCommand({
        Bucket: outputs.s3BucketName,
      })
    );

    const versioning = await s3Client.send(
      new GetBucketVersioningCommand({
        Bucket: outputs.s3BucketName,
      })
    );

    expect(versioning.Status).toBe('Enabled');
  });
});
