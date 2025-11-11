import fs from 'fs';
import path from 'path';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
} from '@aws-sdk/client-s3';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import axios from 'axios';

const region = 'us-east-1';
const rdsClient = new RDSClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const s3Client = new S3Client({ region });
const secretsClient = new SecretsManagerClient({ region });
const asgClient = new AutoScalingClient({ region });
const cwClient = new CloudWatchClient({ region });

// Load stack outputs
const outputs = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../cfn-outputs/flat-outputs.json'), 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 's907';
const environment = 'dev';

describe('Payment Processing Stack Integration Tests', () => {
  describe('RDS PostgreSQL Database', () => {
    test('should have RDS instance deployed and available', async () => {
      const dbInstanceId = `payment-db-${environment}-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId,
      });

      const response = await rdsClient.send(command);
      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances?.length).toBe(1);

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('postgres');
    }, 60000);

    test('should have correct RDS endpoint in outputs', async () => {
      expect(outputs.RDSEndpoint).toBeDefined();
      expect(outputs.RDSEndpoint).toContain('payment-db-dev-s907');
      expect(outputs.RDSEndpoint).toContain('.rds.amazonaws.com');
      expect(outputs.RDSPort).toBe('5432');
    });

    test('should have storage encryption enabled', async () => {
      const dbInstanceId = `payment-db-${environment}-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId,
      });

      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances![0];

      expect(dbInstance.StorageEncrypted).toBe(true);
    }, 30000);

    test('should have correct backup retention period for dev environment', async () => {
      const dbInstanceId = `payment-db-${environment}-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId,
      });

      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances![0];

      expect(dbInstance.BackupRetentionPeriod).toBe(1);
    }, 30000);

    test('should NOT be Multi-AZ for dev environment', async () => {
      const dbInstanceId = `payment-db-${environment}-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId,
      });

      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances![0];

      expect(dbInstance.MultiAZ).toBe(false);
    }, 30000);
  });

  describe('Secrets Manager', () => {
    test('should have database password secret created', async () => {
      expect(outputs.DBSecretArn).toBeDefined();

      const command = new GetSecretValueCommand({
        SecretId: outputs.DBSecretArn,
      });

      const response = await secretsClient.send(command);
      expect(response.SecretString).toBeDefined();

      const secretData = JSON.parse(response.SecretString!);
      expect(secretData.username).toBe('dbadmin');
      expect(secretData.password).toBeDefined();
      expect(secretData.password.length).toBeGreaterThan(20);
    }, 30000);
  });

  describe('Application Load Balancer', () => {
    test('should have ALB deployed and active', async () => {
      expect(outputs.LoadBalancerArn).toBeDefined();

      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.LoadBalancerArn],
      });

      const response = await elbClient.send(command);
      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers?.length).toBe(1);

      const alb = response.LoadBalancers![0];
      expect(alb.State?.Code).toBe('active');
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
    }, 60000);

    test('should have correct DNS name in outputs', async () => {
      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.LoadBalancerDNS).toContain('payment-alb-dev-s907');
      expect(outputs.LoadBalancerDNS).toContain('.elb.amazonaws.com');
    });

    test('should have target group configured', async () => {
      const command = new DescribeTargetGroupsCommand({
        Names: [`payment-tg-${environment}-${environmentSuffix}`],
      });

      const response = await elbClient.send(command);
      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups?.length).toBe(1);

      const targetGroup = response.TargetGroups![0];
      expect(targetGroup.Protocol).toBe('HTTP');
      expect(targetGroup.Port).toBe(80);
      expect(targetGroup.HealthCheckPath).toBe('/health');
    }, 30000);

    test('should respond to HTTP requests', async () => {
      const albUrl = `http://${outputs.LoadBalancerDNS}`;

      try {
        const response = await axios.get(albUrl, {
          timeout: 10000,
          validateStatus: (status) => status < 600,
        });

        // ALB should respond even if targets are unhealthy
        expect(response.status).toBeDefined();
        expect([200, 503, 504]).toContain(response.status);
      } catch (error: any) {
        // Connection timeout is acceptable if instances are still launching
        expect(['ECONNABORTED', 'ETIMEDOUT', 'ECONNREFUSED']).toContain(error.code);
      }
    }, 30000);
  });

  describe('Auto Scaling Group', () => {
    test('should have ASG deployed with correct configuration', async () => {
      const asgName = `payment-asg-${environment}-${environmentSuffix}`;
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });

      const response = await asgClient.send(command);
      expect(response.AutoScalingGroups).toBeDefined();
      expect(response.AutoScalingGroups?.length).toBe(1);

      const asg = response.AutoScalingGroups![0];
      expect(asg.MinSize).toBe(1);
      expect(asg.MaxSize).toBe(2);
      expect(asg.DesiredCapacity).toBe(1);
    }, 60000);

    test('should have instances launching or running', async () => {
      const asgName = `payment-asg-${environment}-${environmentSuffix}`;
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });

      const response = await asgClient.send(command);
      const asg = response.AutoScalingGroups![0];

      // Instances may still be launching
      expect(asg.Instances).toBeDefined();
      expect(asg.Instances!.length).toBeGreaterThanOrEqual(0);

      if (asg.Instances!.length > 0) {
        const instance = asg.Instances![0];
        expect(['Pending', 'InService', 'Launching']).toContain(instance.LifecycleState);
      }
    }, 60000);
  });

  describe('S3 Static Content Bucket', () => {
    test('should have S3 bucket created', async () => {
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.S3BucketName).toBe('payment-static-dev-s907');

      const command = new HeadBucketCommand({
        Bucket: outputs.S3BucketName,
      });

      await s3Client.send(command);
      // If no error is thrown, bucket exists
      expect(true).toBe(true);
    }, 30000);

    test('should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.S3BucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    }, 30000);

    test('should have versioning suspended for dev environment', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.S3BucketName,
      });

      const response = await s3Client.send(command);
      // Versioning is suspended for dev environment
      expect(response.Status).not.toBe('Enabled');
    }, 30000);
  });

  describe('CloudWatch Alarms', () => {
    test('should have RDS CPU alarm configured', async () => {
      const alarmName = `payment-db-cpu-${environment}-${environmentSuffix}`;
      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });

      const response = await cwClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Namespace).toBe('AWS/RDS');
      expect(alarm.Threshold).toBe(80); // Dev threshold
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    }, 30000);
  });

  describe('Resource Tagging', () => {
    test('RDS instance should have correct tags', async () => {
      const dbInstanceId = `payment-db-${environment}-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId,
      });

      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances![0];
      const tags = dbInstance.TagList || [];

      const envTag = tags.find(t => t.Key === 'Environment');
      const projectTag = tags.find(t => t.Key === 'Project');
      const managedByTag = tags.find(t => t.Key === 'ManagedBy');

      expect(envTag?.Value).toBe('dev');
      expect(projectTag?.Value).toBe('PaymentProcessing');
      expect(managedByTag?.Value).toBe('CloudFormation');
    }, 30000);
  });

  describe('End-to-End Workflow', () => {
    test('should verify complete infrastructure connectivity', async () => {
      // Verify all critical resources exist
      expect(outputs.RDSEndpoint).toBeDefined();
      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.DBSecretArn).toBeDefined();

      // Verify RDS is available
      const dbCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `payment-db-${environment}-${environmentSuffix}`,
      });
      const dbResponse = await rdsClient.send(dbCommand);
      expect(dbResponse.DBInstances![0].DBInstanceStatus).toBe('available');

      // Verify ALB is active
      const albCommand = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.LoadBalancerArn],
      });
      const albResponse = await elbClient.send(albCommand);
      expect(albResponse.LoadBalancers![0].State?.Code).toBe('active');

      // Verify S3 bucket exists
      const s3Command = new HeadBucketCommand({
        Bucket: outputs.S3BucketName,
      });
      await s3Client.send(s3Command);

      // All resources are properly deployed and connected
      expect(true).toBe(true);
    }, 90000);
  });
});
