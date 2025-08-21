import {
  DescribeFlowLogsCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { GetInstanceProfileCommand, IAMClient } from '@aws-sdk/client-iam';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import {
  GetBucketAclCommand,
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
    execSync('terraform plan -out=tfplan', {
      cwd: libDir,
      stdio: 'inherit',
    });
    execSync('terraform apply -auto-approve tfplan', {
      cwd: libDir,
      stdio: 'inherit',
    });
    outputs = JSON.parse(
      execSync('terraform output -json', {
        cwd: libDir,
      }).toString()
    );
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

    test('RDS security group has correct rules', async () => {
      const sg = await ec2.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.rds_sg_id.value],
        })
      );
      const rdsRule = sg.SecurityGroups?.[0].IpPermissions?.find(
        p => p.FromPort === 3306
      );
      expect(
        rdsRule?.UserIdGroupPairs?.some(
          p => p.GroupId === outputs.ec2_sg_id.value
        )
      ).toBe(true);
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
    test('S3 logs bucket is versioned', async () => {
      const versioning = await s3.send(
        new GetBucketVersioningCommand({
          Bucket: outputs.s3_logs_bucket_name.value,
        })
      );
      expect(versioning.Status).toBe('Enabled');
    });

    test('S3 logs bucket has public access blocked', async () => {
      const pab = await s3.send(
        new GetPublicAccessBlockCommand({
          Bucket: outputs.s3_logs_bucket_name.value,
        })
      );
      expect(pab.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(
        true
      );
    });

    test('S3 logs bucket ACLs are private', async () => {
      const acl = await s3.send(
        new GetBucketAclCommand({ Bucket: outputs.s3_logs_bucket_name.value })
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
    test('VPC Flow Logs are enabled', async () => {
      const flowLogs = await ec2.send(
        new DescribeFlowLogsCommand({
          Filter: [
            {
              Name: 'resource-id',
              Values: [outputs.vpc_id.value],
            },
          ],
        })
      );
      expect(flowLogs.FlowLogs?.length).toBeGreaterThan(0);
    });
  });

  afterAll(() => {
    const libDir = path.resolve(process.cwd(), 'lib');
    execSync('terraform destroy -auto-approve', {
      cwd: libDir,
      stdio: 'inherit',
    });
  }, 300000);
});
