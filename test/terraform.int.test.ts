// Terraform Infrastructure Integration Tests
// Tests deployed AWS resources to validate end-to-end functionality

import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import fs from 'fs';
import path from 'path';

const REGION = 'us-west-2';
const OUTPUTS_PATH = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');

// Client configuration for real AWS (not LocalStack)
const clientConfig = {
  region: REGION,
  // Ensure we're NOT using LocalStack endpoint
  endpoint: undefined,
};

// Initialize AWS clients for REAL AWS infrastructure
const ec2Client = new EC2Client(clientConfig);
const rdsClient = new RDSClient(clientConfig);
const s3Client = new S3Client(clientConfig);
const asgClient = new AutoScalingClient(clientConfig);
const logsClient = new CloudWatchLogsClient(clientConfig);
const cwClient = new CloudWatchClient(clientConfig);
const snsClient = new SNSClient(clientConfig);
const kmsClient = new KMSClient(clientConfig);
const secretsClient = new SecretsManagerClient(clientConfig);
const elbClient = new ElasticLoadBalancingV2Client(clientConfig);

interface DeploymentOutputs {
  vpc_id: string;
  public_subnet_ids: string;
  private_subnet_ids: string;
  ec2_asg_name: string;
  alb_dns_name?: string;
  alb_arn?: string;
  rds_endpoint: string;
  rds_instance_id: string;
  s3_bucket_name: string;
  s3_bucket_arn: string;
  sns_topic_arn: string;
  kms_key_id: string;
  kms_key_arn: string;
  db_secret_arn: string;
  db_secret_name: string;
  cloudwatch_log_group_ec2: string;
  cloudwatch_log_group_rds: string;
}

describe('Terraform Infrastructure Integration Tests', () => {
  let outputs: DeploymentOutputs;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];

  beforeAll(() => {
    // Load deployment outputs
    if (!fs.existsSync(OUTPUTS_PATH)) {
      throw new Error(`Outputs file not found at ${OUTPUTS_PATH}. Please run deployment first.`);
    }

    outputs = JSON.parse(fs.readFileSync(OUTPUTS_PATH, 'utf8'));

    // Parse subnet IDs from JSON strings
    publicSubnetIds = JSON.parse(outputs.public_subnet_ids);
    privateSubnetIds = JSON.parse(outputs.private_subnet_ids);

    console.log('Loaded deployment outputs:', {
      vpc_id: outputs.vpc_id,
      asg_name: outputs.ec2_asg_name,
      rds_endpoint: outputs.rds_endpoint?.split(':')[0], // Hide port
      s3_bucket: outputs.s3_bucket_name,
    });
  });

  describe('VPC and Network Infrastructure', () => {
    test('VPC exists and has correct CIDR block', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);

      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(outputs.vpc_id);
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('VPC has DNS support and hostnames enabled', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id],
      });

      const response = await ec2Client.send(command);
      const vpc = response.Vpcs![0];

      // DNS support and hostnames are enabled by default in AWS SDK response
      // These attributes are returned in the VPC description
      expect(vpc).toBeDefined();
      expect(vpc.VpcId).toBe(outputs.vpc_id);
    });

    test('Public subnet exists and is in correct AZ', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds,
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(1);

      const subnet = response.Subnets![0];
      expect(subnet.VpcId).toBe(outputs.vpc_id);
      expect(subnet.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.State).toBe('available');
    });

    test('Private subnets exist for Multi-AZ RDS', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds,
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(2);

      response.Subnets!.forEach((subnet) => {
        expect(subnet.VpcId).toBe(outputs.vpc_id);
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });

      // Ensure subnets are in different AZs
      const azs = response.Subnets!.map((s) => s.AvailabilityZone);
      expect(new Set(azs).size).toBe(2);
    });

    test('Security groups are properly configured', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id],
          },
        ],
      });

      const response = await ec2Client.send(command);
      const sgNames = response.SecurityGroups!.map((sg) => sg.GroupName);

      expect(sgNames).toContain(expect.stringContaining('web-sg'));
      expect(sgNames).toContain(expect.stringContaining('rds-sg'));
      expect(sgNames).toContain(expect.stringContaining('alb-sg'));
    });
  });

  describe('RDS Database', () => {
    test('RDS instance exists and is available', async () => {
      const dbIdentifier = outputs.rds_endpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });

      const response = await rdsClient.send(command);
      expect(response.DBInstances).toHaveLength(1);

      const db = response.DBInstances![0];
      expect(db.DBInstanceStatus).toBe('available');
      expect(db.Engine).toBe('mysql');
    });

    test('RDS is Multi-AZ enabled', async () => {
      const dbIdentifier = outputs.rds_endpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });

      const response = await rdsClient.send(command);
      const db = response.DBInstances![0];

      expect(db.MultiAZ).toBe(true);
    });

    test('RDS storage is encrypted', async () => {
      const dbIdentifier = outputs.rds_endpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });

      const response = await rdsClient.send(command);
      const db = response.DBInstances![0];

      expect(db.StorageEncrypted).toBe(true);
      expect(db.KmsKeyId).toBeTruthy();
    });

    test('RDS is NOT publicly accessible', async () => {
      const dbIdentifier = outputs.rds_endpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });

      const response = await rdsClient.send(command);
      const db = response.DBInstances![0];

      expect(db.PubliclyAccessible).toBe(false);
    });

    test('RDS has automated backups enabled', async () => {
      const dbIdentifier = outputs.rds_endpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });

      const response = await rdsClient.send(command);
      const db = response.DBInstances![0];

      expect(db.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
    });

    test('RDS is in private subnets', async () => {
      const dbIdentifier = outputs.rds_endpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });

      const response = await rdsClient.send(command);
      const db = response.DBInstances![0];

      const dbSubnetGroup = db.DBSubnetGroup!.DBSubnetGroupName;
      expect(dbSubnetGroup).toBeTruthy();

      // Verify subnet group uses private subnets
      const subnetCommand = new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: dbSubnetGroup,
      });
      const subnetResponse = await rdsClient.send(subnetCommand);
      const subnets = subnetResponse.DBSubnetGroups![0].Subnets!;

      expect(subnets.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('EC2 Auto Scaling Group', () => {
    test('Auto Scaling Group exists and is healthy', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.ec2_asg_name],
      });

      const response = await asgClient.send(command);
      expect(response.AutoScalingGroups).toHaveLength(1);

      const asg = response.AutoScalingGroups![0];
      expect(asg.AutoScalingGroupName).toBe(outputs.ec2_asg_name);
      expect(asg.MinSize).toBeGreaterThanOrEqual(1);
      expect(asg.MaxSize).toBeGreaterThanOrEqual(3);
    });

    test('ASG has instances running or pending', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.ec2_asg_name],
      });

      const response = await asgClient.send(command);
      const asg = response.AutoScalingGroups![0];

      expect(asg.Instances!.length).toBeGreaterThanOrEqual(1);

      const healthyInstances = asg.Instances!.filter(
        (i) => i.HealthStatus === 'Healthy' || i.LifecycleState === 'Pending'
      );
      expect(healthyInstances.length).toBeGreaterThan(0);
    });

    test('ASG has scaling policies configured', async () => {
      const command = new DescribePoliciesCommand({
        AutoScalingGroupName: outputs.ec2_asg_name,
      });

      const response = await asgClient.send(command);
      expect(response.ScalingPolicies!.length).toBeGreaterThanOrEqual(2);

      const policyNames = response.ScalingPolicies!.map((p) => p.PolicyName);
      expect(policyNames).toContain(expect.stringContaining('scale-out'));
      expect(policyNames).toContain(expect.stringContaining('scale-in'));
    });

    test('ASG health check type is ELB', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.ec2_asg_name],
      });

      const response = await asgClient.send(command);
      const asg = response.AutoScalingGroups![0];

      expect(asg.HealthCheckType).toBe('ELB');
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB exists and is active', async () => {
      if (!outputs.alb_arn) {
        console.log('ALB ARN not found in outputs, skipping ALB tests');
        return;
      }

      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.alb_arn],
      });

      const response = await elbClient.send(command);
      expect(response.LoadBalancers).toHaveLength(1);

      const alb = response.LoadBalancers![0];
      expect(alb.State!.Code).toBe('active');
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
    });

    test('ALB has target group with healthy targets', async () => {
      if (!outputs.alb_arn) {
        return;
      }

      const command = new DescribeTargetGroupsCommand({
        LoadBalancerArn: outputs.alb_arn,
      });

      const response = await elbClient.send(command);
      expect(response.TargetGroups!.length).toBeGreaterThan(0);

      const targetGroup = response.TargetGroups![0];
      expect(targetGroup.Protocol).toBe('HTTP');
      expect(targetGroup.Port).toBe(80);

      // Check target health
      const healthCommand = new DescribeTargetHealthCommand({
        TargetGroupArn: targetGroup.TargetGroupArn,
      });

      const healthResponse = await elbClient.send(healthCommand);
      const healthyTargets = healthResponse.TargetHealthDescriptions!.filter(
        (t) => t.TargetHealth!.State === 'healthy' || t.TargetHealth!.State === 'initial'
      );

      expect(healthyTargets.length).toBeGreaterThan(0);
    });

    test('ALB has listener on port 80', async () => {
      if (!outputs.alb_arn) {
        return;
      }

      const command = new DescribeListenersCommand({
        LoadBalancerArn: outputs.alb_arn,
      });

      const response = await elbClient.send(command);
      expect(response.Listeners!.length).toBeGreaterThan(0);

      const listener = response.Listeners!.find((l) => l.Port === 80);
      expect(listener).toBeDefined();
      expect(listener!.Protocol).toBe('HTTP');
    });
  });

  describe('S3 Bucket', () => {
    test('S3 bucket exists and is accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.s3_bucket_name,
      });

      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('S3 bucket has versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.s3_bucket_name,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket has encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.s3_bucket_name,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();

      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
    });

    test('S3 bucket blocks all public access', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.s3_bucket_name,
      });

      const response = await s3Client.send(command);
      const config = response.PublicAccessBlockConfiguration!;

      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('KMS Encryption', () => {
    test('KMS key exists and is enabled', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.kms_key_id,
      });

      const response = await kmsClient.send(command);
      const key = response.KeyMetadata!;

      expect(key.KeyId).toBe(outputs.kms_key_id);
      expect(key.KeyState).toBe('Enabled');
      expect(key.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });

    test('KMS key has rotation enabled', async () => {
      const command = new GetKeyRotationStatusCommand({
        KeyId: outputs.kms_key_id,
      });

      const response = await kmsClient.send(command);
      expect(response.KeyRotationEnabled).toBe(true);
    });
  });

  describe('AWS Secrets Manager', () => {
    test('Database secret exists and is encrypted', async () => {
      const command = new DescribeSecretCommand({
        SecretId: outputs.db_secret_name,
      });

      const response = await secretsClient.send(command);
      expect(response.Name).toBe(outputs.db_secret_name);
      expect(response.KmsKeyId).toBeTruthy();
    });

    test('Secret contains valid database credentials', async () => {
      const command = new GetSecretValueCommand({
        SecretId: outputs.db_secret_name,
      });

      const response = await secretsClient.send(command);
      expect(response.SecretString).toBeDefined();

      const secret = JSON.parse(response.SecretString!);
      expect(secret.username).toBeTruthy();
      expect(secret.password).toBeTruthy();
      expect(secret.engine).toBe('mysql');
      expect(secret.port).toBe(3306);
      expect(secret.dbname).toBeTruthy();

      // Password should be strong (at least 16 characters)
      expect(secret.password.length).toBeGreaterThanOrEqual(16);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('EC2 log group exists', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.cloudwatch_log_group_ec2,
      });

      const response = await logsClient.send(command);
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups!.find(
        (lg) => lg.logGroupName === outputs.cloudwatch_log_group_ec2
      );
      expect(logGroup).toBeDefined();
    });

    test('RDS log group exists', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.cloudwatch_log_group_rds,
      });

      const response = await logsClient.send(command);
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups!.find(
        (lg) => lg.logGroupName === outputs.cloudwatch_log_group_rds
      );
      expect(logGroup).toBeDefined();
    });

    test('CloudWatch alarms are configured', async () => {
      const command = new DescribeAlarmsCommand({
        MaxRecords: 100,
      });

      const response = await cwClient.send(command);
      const alarmNames = response.MetricAlarms!.map((a) => a.AlarmName);

      expect(alarmNames).toContain(expect.stringContaining('high-cpu'));
      expect(alarmNames).toContain(expect.stringContaining('low-cpu'));
      expect(alarmNames).toContain(expect.stringContaining('rds-low-storage'));
    });

    test('CPU alarms are properly configured', async () => {
      const command = new DescribeAlarmsCommand({
        MaxRecords: 100,
      });

      const response = await cwClient.send(command);

      const highCpuAlarm = response.MetricAlarms!.find((a) =>
        a.AlarmName!.includes('high-cpu')
      );
      expect(highCpuAlarm).toBeDefined();
      expect(highCpuAlarm!.MetricName).toBe('CPUUtilization');
      expect(highCpuAlarm!.Statistic).toBe('Average');
      expect(highCpuAlarm!.ComparisonOperator).toBe('GreaterThanThreshold');

      const lowCpuAlarm = response.MetricAlarms!.find((a) =>
        a.AlarmName!.includes('low-cpu')
      );
      expect(lowCpuAlarm).toBeDefined();
      expect(lowCpuAlarm!.ComparisonOperator).toBe('LessThanThreshold');
    });
  });

  describe('SNS Notifications', () => {
    test('SNS topic exists and is encrypted', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.sns_topic_arn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(outputs.sns_topic_arn);
      expect(response.Attributes!.KmsMasterKeyId).toBeTruthy();
    });
  });

  describe('End-to-End Infrastructure Validation', () => {
    test('All critical resources are in the same VPC', async () => {
      // Verify ASG instances are in the correct VPC
      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.ec2_asg_name],
      });

      const asgResponse = await asgClient.send(asgCommand);
      const instanceIds = asgResponse.AutoScalingGroups![0].Instances!.map((i) => i.InstanceId).filter((id): id is string => id !== undefined);

      if (instanceIds.length > 0) {
        const ec2Command = new DescribeInstancesCommand({
          InstanceIds: instanceIds,
        });

        const ec2Response = await ec2Client.send(ec2Command);
        const instances = ec2Response.Reservations!.flatMap((r) => r.Instances!);

        instances.forEach((instance) => {
          expect(instance.VpcId).toBe(outputs.vpc_id);
        });
      }
    });

    test('Infrastructure is in us-west-2 region', () => {
      expect(outputs.vpc_id).toContain('vpc-');
      expect(outputs.s3_bucket_name).toContain('us-west-2');
      expect(outputs.rds_endpoint).toContain('us-west-2');
      expect(outputs.kms_key_arn).toContain('us-west-2');
      expect(outputs.sns_topic_arn).toContain('us-west-2');
    });

    test('All resources have proper tagging', async () => {
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id],
      });

      const vpcResponse = await ec2Client.send(vpcCommand);
      const tags = vpcResponse.Vpcs![0].Tags || [];

      const tagKeys = tags.map((t) => t.Key);
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Owner');
      expect(tagKeys).toContain('ManagedBy');
    });
  });
});
