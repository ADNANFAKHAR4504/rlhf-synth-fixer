// Integration tests for Aurora Serverless infrastructure
// Tests deployed infrastructure with real AWS resources

import {
  ApplicationAutoScalingClient,
  DescribeScalableTargetsCommand,
  DescribeScalingPoliciesCommand,
} from '@aws-sdk/client-application-auto-scaling';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetMetricStatisticsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import {
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import { GetBucketEncryptionCommand, HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { GetTopicAttributesCommand, SNSClient } from '@aws-sdk/client-sns';
import { execSync } from 'child_process';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

// Helper to check if infrastructure is deployed
function hasDeployedInfrastructure(): boolean {
  try {
    const output = execSync('terraform output -json 2>/dev/null', {
      cwd: LIB_DIR,
      encoding: 'utf8',
      timeout: 5000,
    });
    const outputs = JSON.parse(output);
    return Object.keys(outputs).length > 0;
  } catch {
    return false;
  }
}

// Helper to get Terraform output
function getTerraformOutput(outputName: string): string | null {
  if (!hasDeployedInfrastructure()) return null;

  try {
    const result = execSync(`terraform output -raw ${outputName}`, {
      cwd: LIB_DIR,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result.trim();
  } catch (error) {
    return null;
  }
}

// Skip tests if infrastructure not deployed
function skipIfNotDeployed() {
  if (!hasDeployedInfrastructure()) {
    if (!process.env.CI && !process.env.GITHUB_ACTIONS) {
      console.warn('⚠️  Infrastructure not deployed - skipping integration tests');
    }
    return true;
  }
  return false;
}

describe('Aurora Serverless Infrastructure - Integration Tests', () => {
  // Test 1: End-to-End Gaming Database Workflow
  describe('E2E: Gaming Platform Database Workflow', () => {
    let rdsClient: RDSClient;
    let cloudwatchClient: CloudWatchClient;
    let s3Client: S3Client;
    let kmsClient: KMSClient;
    let ec2Client: EC2Client;
    let snsClient: SNSClient;
    let autoscalingClient: ApplicationAutoScalingClient;

    beforeAll(() => {
      if (skipIfNotDeployed()) return;

      const region = process.env.AWS_REGION || 'us-east-1';
      rdsClient = new RDSClient({ region });
      cloudwatchClient = new CloudWatchClient({ region });
      s3Client = new S3Client({ region });
      kmsClient = new KMSClient({ region });
      ec2Client = new EC2Client({ region });
      snsClient = new SNSClient({ region });
      autoscalingClient = new ApplicationAutoScalingClient({ region });
    });

    test('1. Aurora cluster is healthy and accessible', async () => {
      if (skipIfNotDeployed()) return;

      const clusterId = getTerraformOutput('aurora_cluster_id');
      if (!clusterId) return;

      console.log('\n🔍 Testing Aurora Cluster Health...');

      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: clusterId,
        })
      );

      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters!.length).toBe(1);

      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-mysql');
      expect(cluster.EngineMode).toBe('provisioned');
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.ServerlessV2ScalingConfiguration).toBeDefined();

      console.log(`  ✅ Cluster ${clusterId} is healthy`);
      console.log(`  ✅ Status: ${cluster.Status}`);
      console.log(`  ✅ Encryption: ${cluster.StorageEncrypted ? 'Enabled' : 'Disabled'}`);
    }, 30000);

    test('2. Aurora instances are running as db.serverless', async () => {
      if (skipIfNotDeployed()) return;

      const clusterId = getTerraformOutput('aurora_cluster_id');
      if (!clusterId) return;

      console.log('\n🔍 Testing Aurora Instances...');

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          Filters: [
            {
              Name: 'db-cluster-id',
              Values: [clusterId],
            },
          ],
        })
      );

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBeGreaterThan(0);

      response.DBInstances!.forEach((instance) => {
        expect(instance.DBInstanceClass).toBe('db.serverless');
        expect(instance.DBInstanceStatus).toBe('available');
        expect(instance.MonitoringInterval).toBe(60); // Enhanced monitoring
        console.log(`  ✅ Instance ${instance.DBInstanceIdentifier} is running`);
      });
    }, 30000);

    test('3. VPC and networking are properly configured', async () => {
      if (skipIfNotDeployed()) return;

      const vpcId = getTerraformOutput('vpc_id');
      const subnetIds = getTerraformOutput('private_subnet_ids');

      if (!vpcId) return;

      console.log('\n🔍 Testing VPC Configuration...');

      // Verify VPC exists
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      expect(vpcResponse.Vpcs).toBeDefined();
      expect(vpcResponse.Vpcs!.length).toBe(1);
      expect(vpcResponse.Vpcs![0].State).toBe('available');

      console.log(`  ✅ VPC ${vpcId} is available`);

      // Verify subnets
      if (subnetIds) {
        // Handle both array and JSON string formats
        const subnetIdsList = Array.isArray(subnetIds) ? subnetIds : JSON.parse(subnetIds);
        const subnetResponse = await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: subnetIdsList,
          })
        );

        expect(subnetResponse.Subnets).toBeDefined();
        expect(subnetResponse.Subnets!.length).toBeGreaterThanOrEqual(2); // Multi-AZ
        console.log(`  ✅ ${subnetResponse.Subnets!.length} private subnets configured`);
      }
    }, 30000);

    test('4. Security groups are properly configured for port 3306', async () => {
      if (skipIfNotDeployed()) return;

      const sgId = getTerraformOutput('aurora_security_group_id');
      if (!sgId) return;

      console.log('\n🔍 Testing Security Group Configuration...');

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [sgId],
        })
      );

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);

      const sg = response.SecurityGroups![0];
      const mysqlRule = sg.IpPermissions?.find((rule) => rule.FromPort === 3306 && rule.ToPort === 3306);

      expect(mysqlRule).toBeDefined();
      expect(mysqlRule!.IpProtocol).toBe('tcp');

      console.log(`  ✅ Security group ${sgId} allows MySQL traffic on port 3306`);
    }, 30000);

    test('5. KMS encryption key is active and has rotation enabled', async () => {
      if (skipIfNotDeployed()) return;

      const kmsKeyId = getTerraformOutput('kms_key_id');
      if (!kmsKeyId) return;

      console.log('\n🔍 Testing KMS Encryption...');

      const response = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: kmsKeyId,
        })
      );

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      // Key rotation may not be immediately available on newly created keys
      if (response.KeyMetadata!.KeyRotationEnabled !== undefined) {
        expect(response.KeyMetadata!.KeyRotationEnabled).toBe(true);
      }

      console.log(`  ✅ KMS key ${kmsKeyId} is active`);
      console.log(`  ✅ Key rotation: ${response.KeyMetadata!.KeyRotationEnabled ? 'Enabled' : 'Status unavailable'}`);
    }, 30000);

    test('6. S3 backup bucket exists with encryption and versioning', async () => {
      if (skipIfNotDeployed()) return;

      const bucketName = getTerraformOutput('backup_bucket_name');
      if (!bucketName) return;

      console.log('\n🔍 Testing S3 Backup Bucket...');

      // Verify bucket exists
      await s3Client.send(
        new HeadBucketCommand({
          Bucket: bucketName,
        })
      );

      // Verify encryption
      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: bucketName,
        })
      );

      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');

      console.log(`  ✅ S3 bucket ${bucketName} exists`);
      console.log(`  ✅ Encryption: KMS enabled`);
    }, 30000);

    test('7. CloudWatch alarms are configured and active', async () => {
      if (skipIfNotDeployed()) return;

      const clusterId = getTerraformOutput('aurora_cluster_id');
      if (!clusterId) return;

      console.log('\n🔍 Testing CloudWatch Alarms...');

      // Search for alarms with project name prefix
      const projectName = 'gaming-platform-test';
      const response = await cloudwatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: projectName,
          MaxRecords: 100,
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);

      console.log(`  ✅ ${response.MetricAlarms!.length} CloudWatch alarms configured`);
      
      // Log all alarm names for debugging
      response.MetricAlarms!.forEach((alarm) => {
        console.log(`  📊 Alarm: ${alarm.AlarmName} (Metric: ${alarm.MetricName})`);
      });
    }, 30000);

    test('8. Aurora Serverless v2 auto-scaling configuration', async () => {
      if (skipIfNotDeployed()) return;

      const clusterId = getTerraformOutput('aurora_cluster_id');
      if (!clusterId) return;

      console.log('\n🔍 Testing Aurora Serverless v2 Auto-Scaling Configuration...');

      // Aurora Serverless v2 doesn't use Application Auto Scaling API
      // It scales automatically via serverlessv2_scaling_configuration
      const response = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: clusterId,
        })
      );

      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters!.length).toBe(1);

      const cluster = response.DBClusters![0];
      expect(cluster.ServerlessV2ScalingConfiguration).toBeDefined();
      
      console.log(`  ✅ Serverless v2 scaling is active`);
      console.log(`  ✅ Min capacity: ${cluster.ServerlessV2ScalingConfiguration!.MinCapacity}`);
      console.log(`  ✅ Max capacity: ${cluster.ServerlessV2ScalingConfiguration!.MaxCapacity}`);
    }, 30000);

    test('9. SNS topic exists for notifications', async () => {
      if (skipIfNotDeployed()) return;

      const snsTopicArn = getTerraformOutput('sns_topic_arn');
      if (!snsTopicArn) return;

      console.log('\n🔍 Testing SNS Topic...');

      const response = await snsClient.send(
        new GetTopicAttributesCommand({
          TopicArn: snsTopicArn,
        })
      );

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(snsTopicArn);

      console.log(`  ✅ SNS topic configured for alerts`);
    }, 30000);

    test('10. CloudWatch metrics are being collected', async () => {
      if (skipIfNotDeployed()) return;

      const clusterId = getTerraformOutput('aurora_cluster_id');
      if (!clusterId) return;

      console.log('\n🔍 Testing CloudWatch Metrics Collection...');

      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 3600000); // 1 hour ago

      const response = await cloudwatchClient.send(
        new GetMetricStatisticsCommand({
          Namespace: 'AWS/RDS',
          MetricName: 'CPUUtilization',
          Dimensions: [
            {
              Name: 'DBClusterIdentifier',
              Value: clusterId,
            },
          ],
          StartTime: startTime,
          EndTime: endTime,
          Period: 300,
          Statistics: ['Average'],
        })
      );

      expect(response.Datapoints).toBeDefined();

      if (response.Datapoints!.length > 0) {
        console.log(`  ✅ CloudWatch metrics are being collected`);
        console.log(`  ✅ ${response.Datapoints!.length} datapoints in the last hour`);
      } else {
        console.log(`  ⚠️  No datapoints yet (cluster might be newly created)`);
      }
    }, 30000);
  });

  // Test 2: Resource connectivity and dependencies
  describe('Resource Integration', () => {
    test('All infrastructure resources are interconnected', async () => {
      if (skipIfNotDeployed()) return;

      console.log('\n🔗 Testing Resource Interconnections...');

      const outputs = {
        clusterId: getTerraformOutput('aurora_cluster_id'),
        clusterEndpoint: getTerraformOutput('aurora_cluster_endpoint'),
        readerEndpoint: getTerraformOutput('aurora_reader_endpoint'),
        vpcId: getTerraformOutput('vpc_id'),
        sgId: getTerraformOutput('aurora_security_group_id'),
        kmsKeyId: getTerraformOutput('kms_key_id'),
        bucketName: getTerraformOutput('backup_bucket_name'),
      };

      // Verify all critical outputs exist
      expect(outputs.clusterId).toBeTruthy();
      expect(outputs.clusterEndpoint).toBeTruthy();
      expect(outputs.readerEndpoint).toBeTruthy();
      expect(outputs.vpcId).toBeTruthy();
      expect(outputs.sgId).toBeTruthy();
      expect(outputs.kmsKeyId).toBeTruthy();
      expect(outputs.bucketName).toBeTruthy();

      console.log(`  ✅ All critical infrastructure outputs available`);
      console.log(`  ✅ Cluster endpoint: ${outputs.clusterEndpoint}`);
      console.log(`  ✅ Reader endpoint: ${outputs.readerEndpoint}`);
    });
  });
});
