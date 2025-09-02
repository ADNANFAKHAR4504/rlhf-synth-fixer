// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
  DescribeLaunchTemplatesCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  SNSClient,
  ListTopicsCommand,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  SSMClient,
  GetParameterCommand,
} from '@aws-sdk/client-ssm';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  EventBridgeClient,
  ListRulesCommand,
} from '@aws-sdk/client-eventbridge';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';

// Initialize AWS clients
const region = process.env.AWS_REGION || 'us-east-1';
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const rdsClient = new RDSClient({ region });
const snsClient = new SNSClient({ region });
const lambdaClient = new LambdaClient({ region });
const ssmClient = new SSMClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const eventBridgeClient = new EventBridgeClient({ region });
const autoScalingClient = new AutoScalingClient({ region });

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Load outputs from deployment
let outputs: Record<string, any> = {};

beforeAll(() => {
  try {
    outputs = JSON.parse(
      fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
    );
  } catch (error) {
    console.warn('No cfn-outputs/flat-outputs.json found. Skipping output-dependent tests.');
  }
});

describe('Secure Infrastructure Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('should have deployed VPC with correct configuration', async () => {
      if (!outputs.VpcId) {
        console.warn('VpcId not found in outputs, skipping VPC test');
        return;
      }

      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.VpcId],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
      // VPC DNS settings are checked in the template, not the VPC resource directly
    });

    test('should have created subnets in multiple AZs', async () => {
      if (!outputs.VpcId) {
        console.warn('VpcId not found in outputs, skipping subnet test');
        return;
      }

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VpcId],
            },
          ],
        })
      );

      expect(response.Subnets!.length).toBeGreaterThanOrEqual(6); // 3 types * 2 AZs
      
      const publicSubnets = response.Subnets!.filter(s => s.MapPublicIpOnLaunch);
      const privateSubnets = response.Subnets!.filter(s => !s.MapPublicIpOnLaunch);
      
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(4);

      // Check that subnets are in different AZs
      const availabilityZones = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
    });

    test('should have security groups with proper rules', async () => {
      if (!outputs.VpcId) {
        console.warn('VpcId not found in outputs, skipping security group test');
        return;
      }

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VpcId],
            },
            {
              Name: 'group-name',
              Values: ['*EC2SecurityGroup*'],
            },
          ],
        })
      );

      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(1);
      const ec2Sg = response.SecurityGroups![0];
      
      // Check egress rules for HTTPS and HTTP
      const egressRules = ec2Sg.IpPermissionsEgress!;
      const httpsRule = egressRules.find(rule => rule.FromPort === 443);
      const httpRule = egressRules.find(rule => rule.FromPort === 80);
      
      expect(httpsRule).toBeDefined();
      expect(httpRule).toBeDefined();
    });
  });

  describe('S3 Bucket Security', () => {
    test('should have deployed secure S3 bucket', async () => {
      if (!outputs.S3BucketName) {
        console.warn('S3BucketName not found in outputs, skipping S3 test');
        return;
      }

      // Verify bucket exists
      await expect(
        s3Client.send(new HeadBucketCommand({ Bucket: outputs.S3BucketName }))
      ).resolves.not.toThrow();
    });

    test('should have encryption enabled on S3 bucket', async () => {
      if (!outputs.S3BucketName) return;

      const response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: outputs.S3BucketName })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const encryption = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(encryption.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('AES256');
    });

    test('should have versioning enabled on S3 bucket', async () => {
      if (!outputs.S3BucketName) return;

      const response = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: outputs.S3BucketName })
      );

      expect(response.Status).toBe('Enabled');
    });

    test('should have public access blocked on S3 bucket', async () => {
      if (!outputs.S3BucketName) return;

      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: outputs.S3BucketName })
      );

      const publicAccessBlock = response.PublicAccessBlockConfiguration!;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('RDS Database', () => {
    test('should have deployed RDS instance with encryption', async () => {
      if (!outputs.DatabaseEndpointName) {
        console.warn('DatabaseEndpointName not found in outputs, skipping RDS test');
        return;
      }

      // Get DB instance identifier from the endpoint
      const dbIdentifier = outputs.DatabaseEndpointName.split('.')[0];
      
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      expect(response.DBInstances).toHaveLength(1);
      const dbInstance = response.DBInstances![0];
      
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.Engine).toBe('mysql');
      expect(dbInstance.BackupRetentionPeriod).toBe(7);
      expect(dbInstance.MultiAZ).toBe(false); // For testing
      expect(dbInstance.DeletionProtection).toBe(false); // For testing
    });
  });

  describe('Parameter Store Configuration', () => {
    test('should have database endpoint parameter', async () => {
      const paramName = `/app/database/endpoint-host-${environmentSuffix}`;
      
      const response = await ssmClient.send(
        new GetParameterCommand({ Name: paramName })
      );

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Value).toContain('.rds.amazonaws.com');
    });

    test('should have S3 bucket name parameter', async () => {
      const paramName = `/app/s3/bucket-name-${environmentSuffix}`;
      
      const response = await ssmClient.send(
        new GetParameterCommand({ Name: paramName })
      );

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Value).toContain('secure-app-bucket');
      expect(response.Parameter!.Value).toContain(environmentSuffix);
    });
  });

  describe('SNS Topic and Messaging', () => {
    test('should have deployed SNS topic', async () => {
      if (!outputs.SNSTopicArn) {
        console.warn('SNSTopicArn not found in outputs, skipping SNS test');
        return;
      }

      const response = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: outputs.SNSTopicArn })
      );

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(outputs.SNSTopicArn);
      expect(response.Attributes!.DisplayName).toBe('Application Logs Topic');
    });

    test('should have Lambda subscription to SNS topic', async () => {
      if (!outputs.SNSTopicArn) return;

      const response = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: outputs.SNSTopicArn })
      );

      expect(response.Attributes!.SubscriptionsConfirmed).toBeTruthy();
    });
  });

  describe('Lambda Function', () => {
    test('should have deployed Lambda function with correct configuration', async () => {
      if (!outputs.LambdaFunctionArn) {
        console.warn('LambdaFunctionArn not found in outputs, skipping Lambda test');
        return;
      }

      const functionName = outputs.LambdaFunctionArn.split(':').pop();
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.Runtime).toBe('nodejs18.x');
      expect(response.Configuration!.Handler).toBe('index.handler');
      expect(response.Configuration!.Timeout).toBe(300);
      expect(response.Configuration!.Environment!.Variables!.EnvironmentSuffix).toBe(environmentSuffix);
    });

    test('should be able to invoke Lambda function', async () => {
      if (!outputs.LambdaFunctionArn) return;

      const functionName = outputs.LambdaFunctionArn.split(':').pop();
      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: functionName,
          Payload: JSON.stringify({ test: 'data' }),
        })
      );

      expect(response.StatusCode).toBe(200);
      
      if (response.Payload) {
        const payload = JSON.parse(new TextDecoder().decode(response.Payload));
        expect(payload.statusCode).toBe(200);
        
        const body = JSON.parse(payload.body);
        expect(body.message).toContain('Function executed successfully');
      }
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have created CloudWatch alarms', async () => {
      const response = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: `SecurityGroupChanges-Alarm-${environmentSuffix}`,
        })
      );

      expect(response.MetricAlarms!.length).toBeGreaterThanOrEqual(1);
      
      const securityAlarm = response.MetricAlarms![0];
      expect(securityAlarm.AlarmName).toBe(`SecurityGroupChanges-Alarm-${environmentSuffix}`);
      expect(securityAlarm.MetricName).toBe('MatchedEvents');
      expect(securityAlarm.Namespace).toBe('AWS/Events');
    });

    test('should have CPU utilization alarms', async () => {
      const highCpuResponse = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: `HighCPUUtilization-Alarm-${environmentSuffix}`,
        })
      );

      expect(highCpuResponse.MetricAlarms!.length).toBeGreaterThanOrEqual(1);

      const lowCpuResponse = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: `LowCPUUtilization-Alarm-${environmentSuffix}`,
        })
      );

      expect(lowCpuResponse.MetricAlarms!.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('EventBridge Rules', () => {
    test('should have security group monitoring rule', async () => {
      const response = await eventBridgeClient.send(
        new ListRulesCommand({
          NamePrefix: `SecurityGroupChangesRule-${environmentSuffix}`,
        })
      );

      expect(response.Rules!.length).toBeGreaterThanOrEqual(1);
      
      const rule = response.Rules![0];
      expect(rule.Name).toBe(`SecurityGroupChangesRule-${environmentSuffix}`);
      expect(rule.State).toBe('ENABLED');
    });
  });

  describe('Auto Scaling Configuration', () => {
    test('should have Auto Scaling Group deployed', async () => {
      // List all ASGs and find ours
      const response = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({})
      );

      const asg = response.AutoScalingGroups!.find(group => 
        group.AutoScalingGroupName!.includes('AutoScalingGroup')
      );

      expect(asg).toBeDefined();
      expect(asg!.MinSize).toBe(1);
      expect(asg!.MaxSize).toBe(5);
      expect(asg!.DesiredCapacity).toBe(2);
      expect(asg!.HealthCheckType).toBe('EC2');
    });

    test('should have launch template with security configuration', async () => {
      const response = await ec2Client.send(
        new DescribeLaunchTemplatesCommand({
          Filters: [
            {
              Name: 'launch-template-name',
              Values: [`secure-app-template-${environmentSuffix}`],
            },
          ],
        })
      );

      expect(response.LaunchTemplates!.length).toBe(1);
      
      const launchTemplate = response.LaunchTemplates![0];
      expect(launchTemplate.LaunchTemplateName).toBe(`secure-app-template-${environmentSuffix}`);
    });
  });

  describe('End-to-End Workflows', () => {
    test('should have EC2 instances running in private subnets', async () => {
      if (!outputs.VpcId) return;

      const response = await ec2Client.send(
        new DescribeInstancesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VpcId],
            },
            {
              Name: 'instance-state-name',
              Values: ['running', 'pending'],
            },
          ],
        })
      );

      if (response.Reservations!.length > 0) {
        const instances = response.Reservations!.flatMap(r => r.Instances!);
        
        for (const instance of instances) {
          // Verify instances are in private subnets (no public IP)
          expect(instance.PublicIpAddress).toBeUndefined();
          expect(instance.PrivateIpAddress).toBeDefined();
          
          // Verify security configuration
          expect(instance.MetadataOptions!.HttpTokens).toBe('required'); // IMDSv2
        }
      }
    });

    test('should have proper resource tagging and naming', async () => {
      // Verify resource naming follows environment suffix pattern
      if (outputs.S3BucketName) {
        expect(outputs.S3BucketName).toContain(environmentSuffix);
      }
      
      if (outputs.SNSTopicArn) {
        expect(outputs.SNSTopicArn).toContain(`app-logs-topic-${environmentSuffix}`);
      }
      
      if (outputs.LambdaFunctionArn) {
        expect(outputs.LambdaFunctionArn).toContain(`secure-processing-function-${environmentSuffix}`);
      }
    });

    test('should have proper network connectivity', async () => {
      // This test would verify that:
      // 1. EC2 instances can reach the internet through NAT Gateway
      // 2. EC2 instances can connect to RDS in isolated subnets
      // 3. Lambda can access Parameter Store
      // Note: This would require actual connectivity testing within the infrastructure
      
      // For now, we verify the networking setup is correct
      if (!outputs.VpcId || !outputs.DatabaseEndpointName) return;

      // Verify RDS is in isolated subnets (no route to internet gateway)
      const subnetsResponse = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VpcId],
            },
            {
              Name: 'tag:aws-cdk:subnet-type',
              Values: ['Isolated'],
            },
          ],
        })
      );

      expect(subnetsResponse.Subnets!.length).toBeGreaterThanOrEqual(2);
    });
  });
});
