import {
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { GetInstanceProfileCommand, IAMClient } from '@aws-sdk/client-iam';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import {
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
const iam = new IAMClient({ region });

let outputs: any;

describe('LIVE: Core Infrastructure Verification', () => {
  beforeAll(() => {
    const libDir = path.resolve(process.cwd(), 'lib');
    execSync('terraform init -reconfigure -upgrade', {
      cwd: libDir,
      stdio: 'inherit',
    });
    execSync('terraform apply -auto-approve', {
      cwd: libDir,
      stdio: 'inherit',
    });
    outputs = JSON.parse(
      execSync('terraform output -json', {
        cwd: libDir,
      }).toString()
    );
  }, 300000);

  afterAll(() => {
    const libDir = path.resolve(process.cwd(), 'lib');
    execSync('terraform destroy -auto-approve', {
      cwd: libDir,
      stdio: 'inherit',
    });
  }, 300000);

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
        outputs.alb_sg_id.value,
      ];
      const sgs = await ec2.send(
        new DescribeSecurityGroupsCommand({ GroupIds: sgIds })
      );
      expect(sgs.SecurityGroups?.length).toBe(3);
    });
  });

  describe('Compute', () => {
    test('ALB DNS name is available', () => {
      expect(outputs.alb_dns_name.value).toBeTruthy();
    });
  });

  describe('Database', () => {
    test('RDS endpoint is available', () => {
      expect(outputs.rds_instance_endpoint.value).toBeTruthy();
    });
  });

  describe('Storage', () => {
    test('S3 app data bucket is versioned', async () => {
      const versioning = await s3.send(
        new GetBucketVersioningCommand({
          Bucket: outputs.app_data_s3_bucket_name.value,
        })
      );
      expect(versioning.Status).toBe('Enabled');
    });

    test('S3 app data bucket has public access blocked', async () => {
      const pab = await s3.send(
        new GetPublicAccessBlockCommand({
          Bucket: outputs.app_data_s3_bucket_name.value,
        })
      );
      expect(pab.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(
        true
      );
    });

    test('KMS key is enabled', async () => {
      const key = await kms.send(
        new DescribeKeyCommand({ KeyId: outputs.rds_kms_key_id.value })
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
});
