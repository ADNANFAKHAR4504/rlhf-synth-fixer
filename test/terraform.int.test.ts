import {
  CloudTrailClient,
  GetEventSelectorsCommand,
  GetTrailCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { GetRoleCommand, IAMClient } from '@aws-sdk/client-iam';
import {
  DescribeKeyCommand,
  GetKeyPolicyCommand,
  KMSClient,
} from '@aws-sdk/client-kms';
import {
  GetBucketEncryptionCommand,
  GetBucketLocationCommand,
  GetBucketVersioningCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import * as path from 'path';

const region = 'us-east-1';
const stsClient = new STSClient({ region });
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const kmsClient = new KMSClient({ region });
const cloudTrailClient = new CloudTrailClient({ region });
const iamClient = new IAMClient({ region });

import { execSync } from 'child_process';

const outputs = JSON.parse(
  execSync('terraform output -json', {
    cwd: path.join(__dirname, '../lib'),
  }).toString()
);

const validateS3BucketLocation = (
  locationConstraint: string | undefined,
  expectedRegion: string
) => {
  if (expectedRegion === 'us-east-1') {
    expect(locationConstraint).toBeUndefined();
  } else {
    expect(locationConstraint).toBe(expectedRegion);
  }
};

describe('Secure Infrastructure Integration Tests', () => {
  let accountId: string;

  beforeAll(async () => {
    const identity = await stsClient.send(new GetCallerIdentityCommand({}));
    accountId = identity.Account!;
  });

  describe('VPC and Networking', () => {
    test('VPC exists and has correct configuration', async () => {
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.vpc_id.value],
        })
      );

      expect(vpcResponse.Vpcs).toHaveLength(1);
      const vpc = vpcResponse.Vpcs![0];

      expect(vpc.VpcId).toBe(outputs.vpc_id.value);
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('Public subnets exist and are properly configured', async () => {
      const publicSubnetIds = outputs.public_subnet_ids.value;

      const subnetResponse = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: publicSubnetIds,
        })
      );

      expect(subnetResponse.Subnets).toHaveLength(2);

      for (const subnet of subnetResponse.Subnets!) {
        expect(publicSubnetIds).toContain(subnet.SubnetId);
        expect(subnet.VpcId).toBe(outputs.vpc_id.value);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.State).toBe('available');
      }
    });

    test('Private subnets exist and are properly configured', async () => {
      const privateSubnetIds = outputs.private_subnet_ids.value;

      const subnetResponse = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: privateSubnetIds,
        })
      );

      expect(subnetResponse.Subnets).toHaveLength(2);

      for (const subnet of subnetResponse.Subnets!) {
        expect(privateSubnetIds).toContain(subnet.SubnetId);
        expect(subnet.VpcId).toBe(outputs.vpc_id.value);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.State).toBe('available');
      }
    });
  });

  describe('Security Groups', () => {
    test('All security groups exist and are properly configured', async () => {
      const sgIds = [
        outputs.ec2_sg_id.value,
        outputs.alb_sg_id.value,
        outputs.rds_sg_id.value,
        outputs.vpc_endpoint_sg_id.value,
      ];

      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: sgIds,
        })
      );

      expect(sgResponse.SecurityGroups).toHaveLength(4);

      for (const sg of sgResponse.SecurityGroups!) {
        expect(sgIds).toContain(sg.GroupId);
        expect(sg.VpcId).toBe(outputs.vpc_id.value);
      }
    });
  });

  describe('S3 Storage', () => {
    test('S3 data bucket exists and is properly configured', async () => {
      const bucketName = outputs.s3_data_bucket_name.value;

      const locationResponse = await s3Client.send(
        new GetBucketLocationCommand({
          Bucket: bucketName,
        })
      );
      validateS3BucketLocation(locationResponse.LocationConstraint, region);

      const versioningResponse = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: bucketName,
        })
      );
      expect(versioningResponse.Status).toBe('Enabled');

      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: bucketName,
        })
      );
      expect(
        encryptionResponse.ServerSideEncryptionConfiguration
      ).toBeDefined();
    });
  });

  describe('KMS Encryption', () => {
    test('KMS key exists and is properly configured', async () => {
      const keyResponse = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: outputs.kms_key_id.value,
        })
      );

      const key = keyResponse.KeyMetadata!;
      expect(key.KeyId).toBe(outputs.kms_key_id.value);
      expect(key.KeyState).toBe('Enabled');
      expect(key.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(key.Origin).toBe('AWS_KMS');
      expect(key.Enabled).toBe(true);
    });

    test('KMS key policy is properly configured', async () => {
      const policyResponse = await kmsClient.send(
        new GetKeyPolicyCommand({
          KeyId: outputs.kms_key_id.value,
          PolicyName: 'default',
        })
      );

      const policy = JSON.parse(policyResponse.Policy!);
      expect(policy.Statement).toBeDefined();
      expect(Array.isArray(policy.Statement)).toBe(true);
    });
  });

  describe('CloudTrail Monitoring', () => {
    test('CloudTrail trail exists and is properly configured', async () => {
      const trailResponse = await cloudTrailClient.send(
        new GetTrailCommand({
          Name: outputs.cloudtrail_name.value,
        })
      );

      const trail = trailResponse.Trail!;
      expect(trail.Name).toBe(outputs.cloudtrail_name.value);
      expect(trail.S3BucketName).toBeDefined();
      expect(trail.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.IsMultiRegionTrail).toBe(true);
    });

    test('CloudTrail has proper event selectors', async () => {
      const selectorsResponse = await cloudTrailClient.send(
        new GetEventSelectorsCommand({
          TrailName: outputs.cloudtrail_name.value,
        })
      );

      expect(selectorsResponse.EventSelectors).toBeDefined();
      expect(selectorsResponse.EventSelectors!.length).toBeGreaterThan(0);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('EC2 instance profile exists and is properly configured', async () => {
      const roleResponse = await iamClient.send(
        new GetRoleCommand({
          RoleName: outputs.ec2_instance_profile_name.value,
        })
      );
      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role!.RoleName).toBe(
        outputs.ec2_instance_profile_name.value
      );
    });
  });
});
