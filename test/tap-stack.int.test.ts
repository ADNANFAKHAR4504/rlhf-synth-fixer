import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  GetBucketLocationCommand,
} from '@aws-sdk/client-s3';
import {
  IAMClient,
  GetRoleCommand,
} from '@aws-sdk/client-iam';
import * as fs from 'fs';
import * as path from 'path';

const awsRegion =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';

const ec2Client = new EC2Client({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });

describe('TAP Stack Core AWS Infrastructure (Integration)', () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let stateBucketName: string;
  let ec2RoleName: string;

  beforeAll(() => {
    const suffix = process.env.ENVIRONMENT_SUFFIX;
    if (!suffix) {
      throw new Error('ENVIRONMENT_SUFFIX environment variable is not set.');
    }

    const outputFilePath = path.join(
      __dirname,
      '..',
      'cfn-outputs',
      'flat-outputs.json'
    );
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }

    const outputs = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));
    const stackKey = Object.keys(outputs).find((k) => k.includes(suffix));
    if (!stackKey) {
      throw new Error(`No output found for environment: ${suffix}`);
    }

    const stackOutputs = outputs[stackKey];
    vpcId = stackOutputs['VpcId'];
    publicSubnetIds = stackOutputs['PublicSubnetIds'] || [];
    privateSubnetIds = stackOutputs['PrivateSubnetIds'] || [];
    stateBucketName = stackOutputs['StateBucketName'];
    ec2RoleName = stackOutputs['Ec2S3StateRoleName'];

    if (
      !vpcId ||
      publicSubnetIds.length === 0 ||
      privateSubnetIds.length === 0 ||
      !stateBucketName ||
      !ec2RoleName
    ) {
      throw new Error('Missing one or more required stack outputs.');
    }
  });

  // --- VPC Test ---
  describe('VPC Configuration', () => {
    test(
      `should have VPC "${vpcId}" present in AWS`,
      async () => {
        const { Vpcs } = await ec2Client.send(
          new DescribeVpcsCommand({ VpcIds: [vpcId] })
        );
        expect(Vpcs?.length).toBe(1);
        expect(Vpcs?.[0].VpcId).toBe(vpcId);
        expect(Vpcs?.[0].State).toBe('available');
      },
      20000
    );

    test(
      `should have public and private subnets in the VPC`,
      async () => {
        const { Subnets } = await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: [...publicSubnetIds, ...privateSubnetIds],
          })
        );
        const subnetVpcIds = [...new Set(Subnets?.map((s) => s.VpcId))];
        expect(subnetVpcIds).toEqual([vpcId]);
      },
      20000
    );
  });

  // --- S3 Backend Bucket Test ---
  describe('S3 State Bucket', () => {
    test(
      `should have state bucket "${stateBucketName}" in correct region`,
      async () => {
        const { LocationConstraint } = await s3Client.send(
          new GetBucketLocationCommand({ Bucket: stateBucketName })
        );
        const expectedRegion = LocationConstraint || 'us-east-1';
        expect(expectedRegion).toBe(awsRegion);
      },
      20000
    );
  });

  // --- IAM Role Test ---
  describe('EC2 S3 State Role', () => {
    test(
      `should have IAM role "${ec2RoleName}" present in AWS`,
      async () => {
        const { Role } = await iamClient.send(
          new GetRoleCommand({ RoleName: ec2RoleName })
        );
        expect(Role?.RoleName).toBe(ec2RoleName);
      },
      20000
    );
  });
});
