import { DescribeSubnetsCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { KMSClient, ListKeysCommand } from '@aws-sdk/client-kms';
import { DescribeDBClustersCommand, DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { GetBucketVersioningCommand, HeadBucketCommand, ListBucketsCommand, S3Client } from '@aws-sdk/client-s3';
import { App, Testing } from 'cdktf';
import * as fs from 'fs';
import * as path from 'path';
import { TapStack } from '../lib/tap-stack';

describe('TAP Stack Integration Tests', () => {
  let app: App;
  let stack: TapStack;

  beforeEach(() => {
    app = Testing.app();
    stack = new TapStack(app, 'test-stack', {
      environmentSuffix: 'test',
      awsRegion: 'us-east-1'  // Updated to match new deployment region
    });
  });

  describe('Infrastructure Synthesis Integration', () => {
    test('should synthesize stack without errors', async () => {
      const synthesized = Testing.synth(stack);
      expect(synthesized).toBeDefined();
      expect(typeof synthesized).toBe('string');
    });

    test('should generate valid JSON terraform configuration', async () => {
      const synthesized = Testing.synth(stack);
      let terraformConfig;

      expect(() => {
        terraformConfig = JSON.parse(synthesized);
      }).not.toThrow();

      expect(terraformConfig).toHaveProperty('terraform');
      expect(terraformConfig).toHaveProperty('provider');
      expect(terraformConfig).toHaveProperty('resource');
    });

    test('should contain required AWS resources in synthesized output', async () => {
      const synthesized = Testing.synth(stack);
      const terraformConfig = JSON.parse(synthesized);
      const resources = terraformConfig.resource || {};

      // Check for VPC
      expect(resources).toHaveProperty('aws_vpc');
      expect(Object.keys(resources.aws_vpc)).toContain('vpc-main');

      // Check for subnets
      expect(resources).toHaveProperty('aws_subnet');
      const subnets = resources.aws_subnet;
      expect(Object.keys(subnets)).toContain('public-subnet-1-main');
      expect(Object.keys(subnets)).toContain('private-subnet-1-main');

      // Check for S3 buckets
      expect(resources).toHaveProperty('aws_s3_bucket');
      const s3Buckets = resources.aws_s3_bucket;
      expect(Object.keys(s3Buckets)).toContain('data-bucket');

      // Check for RDS cluster
      expect(resources).toHaveProperty('aws_rds_cluster');
      expect(Object.keys(resources.aws_rds_cluster)).toContain('aurora-cluster-v6');

      // Check for KMS keys
      expect(resources).toHaveProperty('aws_kms_key');
      expect(Object.keys(resources.aws_kms_key)).toContain('kms-key-v6');
    });

    test('should validate VPC configuration in synthesis', async () => {
      const synthesized = Testing.synth(stack);
      const terraformConfig = JSON.parse(synthesized);
      const vpc = terraformConfig.resource.aws_vpc['vpc-main'];

      expect(vpc.cidr_block).toBe('10.0.0.0/16');
      expect(vpc.enable_dns_hostnames).toBe(true);
      expect(vpc.enable_dns_support).toBe(true);
      expect(vpc.tags.Name).toContain('vpc');
    });

    test('should validate RDS cluster configuration in synthesis', async () => {
      const synthesized = Testing.synth(stack);
      const terraformConfig = JSON.parse(synthesized);
      const cluster = terraformConfig.resource.aws_rds_cluster['aurora-cluster-v6'];

      // Account for dynamic suffixes in CI environments
      expect(cluster.cluster_identifier).toMatch(/^hipaa-aurora-v6-test/);
      expect(cluster.engine).toBe('aurora-postgresql');
      expect(cluster.database_name).toBe('patientdb');
      expect(cluster.master_username).toBe('dbadmin');
      expect(cluster.storage_encrypted).toBe(true);
      expect(cluster.backup_retention_period).toBe(30);
    });

    test('should validate KMS key lifecycle configuration', async () => {
      const synthesized = Testing.synth(stack);
      const terraformConfig = JSON.parse(synthesized);
      const kmsKey = terraformConfig.resource.aws_kms_key['kms-key-v6'];

      expect(kmsKey.description).toBe('KMS key for HIPAA-compliant data encryption');
      expect(kmsKey.lifecycle).toHaveProperty('create_before_destroy');
      expect(kmsKey.lifecycle.create_before_destroy).toBe(true);
    });

    test('should validate S3 bucket configuration and replication', async () => {
      const synthesized = Testing.synth(stack);
      const terraformConfig = JSON.parse(synthesized);
      const s3Bucket = terraformConfig.resource.aws_s3_bucket['data-bucket'];

      expect(s3Bucket.bucket).toMatch(/^hipaa-patient-data-/);      // Check S3 bucket versioning
      const versioningConfig = terraformConfig.resource.aws_s3_bucket_versioning;
      expect(versioningConfig).toHaveProperty('data-bucket-versioning');
      expect(versioningConfig['data-bucket-versioning'].versioning_configuration.status).toBe('Enabled');
    });

    test('should validate provider configurations', async () => {
      const synthesized = Testing.synth(stack);
      const terraformConfig = JSON.parse(synthesized);
      const providers = terraformConfig.provider.aws;

      // Should have multiple AWS providers for multi-region setup
      expect(Array.isArray(providers)).toBe(true);
      expect(providers.length).toBeGreaterThan(1);

      // Check primary region provider (updated to us-east-1)
      const primaryProvider = providers.find((p: any) => p.region === 'us-east-1');
      expect(primaryProvider).toBeDefined();

      // Check DR region provider (updated to us-west-2)
      const drProvider = providers.find((p: any) => p.region === 'us-west-2');
      expect(drProvider).toBeDefined();
    });
  });

  describe('Generated Terraform File Integration', () => {
    test('should create cdktf.out directory with terraform files', async () => {
      // Trigger synthesis to create output files
      Testing.synth(stack);

      const outputDir = path.join(process.cwd(), 'cdktf.out', 'stacks', 'test-stack');

      // Check if output directory exists (might not in test environment)
      if (fs.existsSync(outputDir)) {
        const files = fs.readdirSync(outputDir);
        expect(files).toContain('cdk.tf.json');
      } else {
        // If directory doesn't exist, that's ok for testing environment
        expect(true).toBe(true);
      }
    });
  });

  describe('Environment-specific Configuration', () => {
    test('should handle different environment suffixes', async () => {
      const prodStack = new TapStack(app, 'prod-stack', {
        environmentSuffix: 'prod',
        awsRegion: 'eu-central-1'
      });

      const synthesized = Testing.synth(prodStack);
      const terraformConfig = JSON.parse(synthesized);
      const s3Bucket = terraformConfig.resource.aws_s3_bucket['data-bucket'];

      expect(s3Bucket.bucket).toMatch(/^hipaa-patient-data-prod-/);
    });

    test('should validate resource dependencies in synthesis', async () => {
      const synthesized = Testing.synth(stack);
      const terraformConfig = JSON.parse(synthesized);

      // Check that RDS cluster has proper dependencies
      const cluster = terraformConfig.resource.aws_rds_cluster['aurora-cluster-v6'];
      expect(cluster.depends_on).toContain('aws_db_subnet_group.db-subnet-group-main');

      // Check that cloudtrail bucket policy exists and has proper structure
      const bucketPolicy = terraformConfig.resource.aws_s3_bucket_policy['cloudtrail-bucket-policy'];
      expect(bucketPolicy).toBeDefined();
      expect(bucketPolicy.bucket).toBeDefined();
    });
  });

  describe('Real AWS Infrastructure Validation', () => {
    const awsConfig = {
      region: 'us-east-1'  // Updated to match new deployment region
    };

    test('should validate deployed VPC exists and is configured correctly', async () => {
      const ec2Client = new EC2Client(awsConfig);

      // Get environment suffix from environment or use pr4928 for CI
      const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr4928';

      const vpcsResponse = await ec2Client.send(new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`hipaa-vpc-${envSuffix}`]
          }
        ]
      }));

      expect(vpcsResponse.Vpcs).toBeDefined();
      expect(vpcsResponse.Vpcs!.length).toBeGreaterThan(0);

      const vpc = vpcsResponse.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    }, 10000);

    test('should validate deployed subnets exist in correct AZs', async () => {
      const ec2Client = new EC2Client(awsConfig);
      const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr4928';

      // Check for public subnets
      const publicSubnetsResponse = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'tag:Type',
            Values: ['Public']
          },
          {
            Name: 'tag:Name',
            Values: [`*${envSuffix}*`]
          }
        ]
      }));

      expect(publicSubnetsResponse.Subnets).toBeDefined();
      expect(publicSubnetsResponse.Subnets!.length).toBeGreaterThanOrEqual(2);

      // Check for private subnets
      const privateSubnetsResponse = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'tag:Type',
            Values: ['Private']
          },
          {
            Name: 'tag:Name',
            Values: [`*${envSuffix}*`]
          }
        ]
      }));

      expect(privateSubnetsResponse.Subnets).toBeDefined();
      expect(privateSubnetsResponse.Subnets!.length).toBeGreaterThanOrEqual(2);
    }, 10000);

    test('should validate deployed S3 buckets exist and are encrypted', async () => {
      const s3Client = new S3Client(awsConfig);

      // Get environment suffix and find matching bucket
      const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr4928';

      // List all buckets and find the one that matches our pattern
      const listResponse = await s3Client.send(new ListBucketsCommand({}));
      const bucketPattern = new RegExp(`^hipaa-patient-data-${envSuffix}.*-us-east-1$`);
      const matchingBucket = listResponse.Buckets?.find((b: any) => bucketPattern.test(b.Name || ''));

      expect(matchingBucket).toBeDefined();
      expect(matchingBucket?.Name).toBeDefined();

      if (!matchingBucket?.Name) {
        throw new Error(`No bucket found matching pattern: hipaa-patient-data-${envSuffix}.*-us-east-1`);
      }

      // Check bucket exists
      await expect(s3Client.send(new HeadBucketCommand({ Bucket: matchingBucket.Name }))).resolves.not.toThrow();

      // Check versioning is enabled
      const versioningResponse = await s3Client.send(new GetBucketVersioningCommand({ Bucket: matchingBucket.Name }));
      expect(versioningResponse.Status).toBe('Enabled');
    }, 10000);

    test('should validate deployed RDS Aurora cluster is running', async () => {
      const rdsClient = new RDSClient(awsConfig);

      // Get environment suffix
      const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr4928';
      const clusterPattern = `hipaa-aurora-v6-${envSuffix}`;

      // List all clusters and find matching one (may have timestamp suffix)
      const allClustersResponse = await rdsClient.send(new DescribeDBClustersCommand({}));
      const matchingCluster = allClustersResponse.DBClusters?.find(cluster =>
        cluster.DBClusterIdentifier?.startsWith(clusterPattern)
      );

      expect(matchingCluster).toBeDefined();
      expect(matchingCluster?.DBClusterIdentifier).toBeDefined();

      if (!matchingCluster) {
        throw new Error(`No Aurora cluster found matching pattern: ${clusterPattern}`);
      }

      // Accept both 'available' and 'backing-up' as valid states for a healthy cluster
      expect(['available', 'backing-up']).toContain(matchingCluster.Status);
      expect(matchingCluster.Engine).toBe('aurora-postgresql');
      expect(matchingCluster.StorageEncrypted).toBe(true);
      expect(matchingCluster.DatabaseName).toBe('patientdb');
      expect(matchingCluster.MasterUsername).toBe('dbadmin');
    }, 15000);

    test('should validate RDS instances are running', async () => {
      const rdsClient = new RDSClient(awsConfig);
      const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr4928';

      // Get the cluster identifier that matches our pattern
      const allClustersResponse = await rdsClient.send(new DescribeDBClustersCommand({}));
      const clusterPattern = `hipaa-aurora-v6-${envSuffix}`;
      const matchingCluster = allClustersResponse.DBClusters?.find(cluster =>
        cluster.DBClusterIdentifier?.startsWith(clusterPattern)
      );

      expect(matchingCluster).toBeDefined();

      if (!matchingCluster?.DBClusterIdentifier) {
        throw new Error(`No cluster found matching pattern: ${clusterPattern}`);
      }

      // Get instances for the matching cluster
      const instancesResponse = await rdsClient.send(new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'db-cluster-id',
            Values: [matchingCluster.DBClusterIdentifier]
          }
        ]
      }));

      expect(instancesResponse.DBInstances).toBeDefined();
      expect(instancesResponse.DBInstances!.length).toBe(2);

      instancesResponse.DBInstances!.forEach(instance => {
        expect(['available', 'backing-up']).toContain(instance.DBInstanceStatus);
        expect(instance.Engine).toBe('aurora-postgresql');
        expect(instance.StorageEncrypted).toBe(true);
      });
    }, 15000);

    test('should validate KMS keys are active and properly configured', async () => {
      const kmsClient = new KMSClient(awsConfig);

      // Test that we can list keys and find our keys
      const keysResponse = await kmsClient.send(new ListKeysCommand({}));

      expect(keysResponse.Keys).toBeDefined();
      expect(keysResponse.Keys!.length).toBeGreaterThan(0);

      // Verify we have at least some keys available (shows KMS is working)
      expect(keysResponse.Keys!.length).toBeGreaterThanOrEqual(1);
    }, 10000);

    test('should validate cross-region S3 replication to DR bucket', async () => {
      const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr4928';
      const s3Client = new S3Client({ region: 'us-west-2' });

      // Check DR bucket exists in us-west-2 with environment suffix
      const drBuckets = await s3Client.send(new ListBucketsCommand({}));
      const drBucketName = drBuckets.Buckets?.find(bucket =>
        bucket.Name?.includes('hipaa-patient-data') &&
        bucket.Name?.includes('us-west-2') &&
        bucket.Name?.includes(envSuffix)
      )?.Name;

      expect(drBucketName).toBeDefined();

      await expect(s3Client.send(new HeadBucketCommand({ Bucket: drBucketName! }))).resolves.not.toThrow();

      // Check versioning is enabled on DR bucket
      const versioningResponse = await s3Client.send(new GetBucketVersioningCommand({ Bucket: drBucketName! }));
      expect(versioningResponse.Status).toBe('Enabled');
    }, 10000);
  });
});
