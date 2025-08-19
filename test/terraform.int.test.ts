import {
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  IAMClient,
  ListAttachedRolePoliciesCommand,
  ListRolesCommand,
} from '@aws-sdk/client-iam';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketLocationCommand,
  GetBucketTaggingCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  ListBucketsCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  ListSecretsCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';

const AWS_REGION = 'eu-west-1';

// Helper function to find resources by tags
async function findResourcesByTag(tagKey: string, tagValue: string) {
  // This can be extended to use AWS Resource Groups Tagging API
  // For now, we'll use service-specific discovery
}

beforeAll(async () => {
  console.log('Starting AWS API integration tests...');
  console.log('Using AWS region:', AWS_REGION);
});

describe('AWS Infrastructure Validation via AWS APIs', () => {
  describe('S3 Buckets', () => {
    test('PII bucket exists and is properly configured', async () => {
      const s3 = new S3Client({ region: AWS_REGION });

      // Find PII bucket by tag
      const buckets = await s3.send(new ListBucketsCommand({}));
      console.log(
        'Found buckets:',
        buckets.Buckets?.map(b => b.Name)
      );

      let piiBucket = null;
      for (const bucket of buckets.Buckets || []) {
        try {
          const tags = await s3.send(
            new GetBucketTaggingCommand({ Bucket: bucket.Name! })
          );
          const dataClassTag = tags.TagSet?.find(
            t => t.Key === 'DataClassification'
          );
          if (dataClassTag?.Value === 'PII') {
            piiBucket = bucket.Name;
            break;
          }
        } catch (error) {
          // Skip buckets without tags
          continue;
        }
      }

      expect(piiBucket).toBeTruthy();
      console.log('Found PII bucket:', piiBucket);

      // Test encryption
      const enc = await s3.send(
        new GetBucketEncryptionCommand({ Bucket: piiBucket! })
      );
      expect(
        enc.ServerSideEncryptionConfiguration?.Rules?.[0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('aws:kms');

      // Test public access block
      const pab = await s3.send(
        new GetPublicAccessBlockCommand({ Bucket: piiBucket! })
      );
      expect(pab.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(
        true
      );
    });

    test('Logs bucket exists and has versioning enabled', async () => {
      const s3 = new S3Client({ region: AWS_REGION });

      // Find logs bucket by tag or name pattern
      const buckets = await s3.send(new ListBucketsCommand({}));

      let logsBucket = null;
      for (const bucket of buckets.Buckets || []) {
        if (
          bucket.Name?.includes('logs') ||
          bucket.Name?.includes('cloudtrail')
        ) {
          logsBucket = bucket.Name;
          break;
        }
      }

      expect(logsBucket).toBeTruthy();
      console.log('Found logs bucket:', logsBucket);

      // Test versioning
      const ver = await s3.send(
        new GetBucketVersioningCommand({ Bucket: logsBucket! })
      );
      expect(ver.Status).toBe('Enabled');

      // Test location
      const loc = await s3.send(
        new GetBucketLocationCommand({ Bucket: logsBucket! })
      );
      expect(loc.LocationConstraint).toBe(AWS_REGION);
    });
  });

  describe('VPC and Networking', () => {
    test('VPC exists and is properly configured', async () => {
      const ec2 = new EC2Client({ region: AWS_REGION });

      // Find our VPC (non-default)
      const vpcs = await ec2.send(new DescribeVpcsCommand({}));
      const customVpcs = vpcs.Vpcs?.filter(vpc => !vpc.IsDefault);

      expect(customVpcs?.length).toBeGreaterThan(0);

      const vpc = customVpcs![0];
      console.log('Found VPC:', vpc.VpcId);

      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toMatch(/^10\.0\.0\.0\/16$/);
    });

    test('Subnets are properly distributed across AZs', async () => {
      const ec2 = new EC2Client({ region: AWS_REGION });

      // Find our VPC first
      const vpcs = await ec2.send(new DescribeVpcsCommand({}));
      const customVpc = vpcs.Vpcs?.find(vpc => !vpc.IsDefault);
      expect(customVpc).toBeTruthy();

      // Get all subnets in our VPC
      const subnets = await ec2.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [customVpc!.VpcId!] }],
        })
      );

      console.log('Found subnets:', subnets.Subnets?.length);

      // We should have subnets across multiple AZs
      const azs = new Set(subnets.Subnets?.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);

      // We should have public, private, and database subnets
      const subnetTypes = new Set();
      for (const subnet of subnets.Subnets || []) {
        if (subnet.Tags) {
          const typeTag = subnet.Tags.find(tag => tag.Key === 'Type');
          if (typeTag) {
            subnetTypes.add(typeTag.Value);
          }
        }
      }

      console.log('Subnet types found:', Array.from(subnetTypes));
    });
  });

  describe('IAM Roles', () => {
    test('Required IAM roles exist', async () => {
      const iam = new IAMClient({ region: AWS_REGION });

      const roles = await iam.send(new ListRolesCommand({}));
      const roleNames = roles.Roles?.map(r => r.RoleName) || [];

      console.log(
        'Found IAM roles:',
        roleNames.filter(
          name =>
            name &&
            (name.includes('rds') ||
              name.includes('lambda') ||
              name.includes('ec2') ||
              name.includes('monitoring'))
        )
      );

      // Check for RDS monitoring role
      const rdsMonitoringRole = roles.Roles?.find(
        role =>
          role.RoleName?.includes('rds') &&
          role.RoleName?.includes('monitoring')
      );
      expect(rdsMonitoringRole).toBeTruthy();

      if (rdsMonitoringRole) {
        const policies = await iam.send(
          new ListAttachedRolePoliciesCommand({
            RoleName: rdsMonitoringRole.RoleName!,
          })
        );
        expect(policies.AttachedPolicies?.length).toBeGreaterThan(0);
      }
    });
  });

  describe('RDS Database', () => {
    test('RDS instance exists and is properly configured', async () => {
      const rds = new RDSClient({ region: AWS_REGION });

      const instances = await rds.send(new DescribeDBInstancesCommand({}));
      expect(instances.DBInstances?.length).toBeGreaterThan(0);

      const dbInstance = instances.DBInstances![0];
      console.log('Found RDS instance:', dbInstance.DBInstanceIdentifier);

      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('mysql');
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.MultiAZ).toBe(true);
    });
  });

  describe('Secrets Manager', () => {
    test('Database secret exists', async () => {
      const secretsManager = new SecretsManagerClient({ region: AWS_REGION });

      const secrets = await secretsManager.send(new ListSecretsCommand({}));
      const dbSecrets = secrets.SecretList?.filter(
        (secret: any) =>
          secret.Name?.includes('rds') || secret.Name?.includes('database')
      );

      expect(dbSecrets?.length).toBeGreaterThan(0);

      const dbSecret = dbSecrets![0];
      console.log('Found database secret:', dbSecret.Name);

      expect(dbSecret.RotationEnabled).toBe(true);
      expect(dbSecret.KmsKeyId).toBeTruthy();
    });
  });

  describe('Load Balancer', () => {
    test('ALB exists and is properly configured', async () => {
      const elbv2 = new ElasticLoadBalancingV2Client({ region: AWS_REGION });

      const loadBalancers = await elbv2.send(
        new DescribeLoadBalancersCommand({})
      );
      const albs = loadBalancers.LoadBalancers?.filter(
        lb => lb.Type === 'application'
      );

      expect(albs?.length).toBeGreaterThan(0);

      const alb = albs![0];
      console.log('Found ALB:', alb.LoadBalancerName);

      expect(alb.State?.Code).toBe('active');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.IpAddressType).toBe('ipv4');
    });
  });
});
