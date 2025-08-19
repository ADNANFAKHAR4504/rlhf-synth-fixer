import { CloudTrailClient, GetTrailCommand } from '@aws-sdk/client-cloudtrail';
import {
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { GetInstanceProfileCommand, IAMClient } from '@aws-sdk/client-iam';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import {
  GetBucketAclCommand,
  GetBucketPolicyStatusCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { execSync } from 'child_process';
import * as path from 'path';

const region = 'us-east-1';
const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const kms = new KMSClient({ region });
const cloudtrail = new CloudTrailClient({ region });
const iam = new IAMClient({ region });

const outputs = JSON.parse(
  execSync('terraform output -json', {
    cwd: path.resolve(process.cwd(), 'lib'),
  }).toString()
);

describe('LIVE: Core Infrastructure Verification', () => {
  describe('Networking', () => {
    test('VPC created with correct CIDR', async () => {
      const vpcId = outputs.vpc_id.value;
      const vpc = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(vpc.Vpcs?.[0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('Public and private subnets created', async () => {
      const publicSubnets = outputs.public_subnet_ids.value;
      const privateSubnets = outputs.private_subnet_ids.value;
      expect(publicSubnets.length).toBeGreaterThan(0);
      expect(privateSubnets.length).toBeGreaterThan(0);
    });
  });

  describe('Security', () => {
    test('Security groups are created', async () => {
      const sgIds = [
        outputs.ec2_sg_id.value,
        outputs.rds_sg_id.value,
        outputs.vpc_endpoint_sg_id.value,
        outputs.alb_sg_id.value,
      ];
      const sgs = await ec2.send(
        new DescribeSecurityGroupsCommand({ GroupIds: sgIds })
      );
      expect(sgs.SecurityGroups?.length).toBe(4);
    });

    test('SSH is not open to the world', async () => {
      const sg = await ec2.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.ec2_sg_id.value],
        })
      );
      const sshRule = sg.SecurityGroups?.[0].IpPermissions?.find(
        p => p.FromPort === 22
      );
      expect(sshRule?.IpRanges?.every(r => r.CidrIp !== '0.0.0.0/0')).toBe(
        true
      );
    });
  });

  describe('Compute', () => {
    test('ALB DNS name is available', () => {
      expect(outputs.alb_dns_name.value).toBeTruthy();
    });
  });

  describe('Database', () => {
    test('RDS endpoint is available', () => {
      expect(outputs.rds_endpoint.value).toBeTruthy();
    });
  });

  describe('Storage', () => {
    const bucketName = outputs.s3_data_bucket_name.value;

    test('S3 bucket is versioned', async () => {
      const versioning = await s3.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      expect(versioning.Status).toBe('Enabled');
    });

    test('S3 bucket has public access blocked', async () => {
      const pab = await s3.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
      expect(pab.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(
        true
      );
    });

    test('S3 bucket is not public', async () => {
      try {
        const policyStatus = await s3.send(
          new GetBucketPolicyStatusCommand({ Bucket: bucketName })
        );
        expect(policyStatus.PolicyStatus?.IsPublic).toBe(false);
      } catch (e: any) {
        if (e.name !== 'NoSuchBucketPolicy') {
          throw e;
        }
      }
    });

    test('S3 bucket ACLs are private', async () => {
      const acl = await s3.send(
        new GetBucketAclCommand({ Bucket: bucketName })
      );
      const hasPublic = (acl.Grants || []).some(
        g =>
          g.Grantee?.URI?.includes('AllUsers') ||
          g.Grantee?.URI?.includes('AuthenticatedUsers')
      );
      expect(hasPublic).toBe(false);
    });

    test('KMS key is enabled', async () => {
      const key = await kms.send(
        new DescribeKeyCommand({ KeyId: outputs.kms_key_id.value })
      );
      expect(key.KeyMetadata?.Enabled).toBe(true);
    });
  });

  describe('IAM', () => {
    test('EC2 instance profile exists', async () => {
      const profile = await iam.send(
        new GetInstanceProfileCommand({
          InstanceProfileName: outputs.ec2_instance_profile_name.value,
        })
      );
      expect(profile.InstanceProfile).toBeTruthy();
    });
  });

  describe('Monitoring', () => {
    test('CloudTrail is enabled', async () => {
      const trail = await cloudtrail.send(
        new GetTrailCommand({ Name: outputs.cloudtrail_name.value })
      );
      expect(trail.Trail?.isLogging).toBe(true);
    });
  });
});
