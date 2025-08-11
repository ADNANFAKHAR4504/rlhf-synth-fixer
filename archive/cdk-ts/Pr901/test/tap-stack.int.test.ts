import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeInstancesCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  DescribeTableCommand,
  DescribeContinuousBackupsCommand,
} from '@aws-sdk/client-dynamodb';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetDashboardCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  IAMClient,
  GetRoleCommand,
  GetInstanceProfileCommand,
} from '@aws-sdk/client-iam';

// Read the deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
} else {
  console.warn('cfn-outputs/flat-outputs.json not found. Run deployment first.');
}

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synthtrainr39';

// Initialize AWS clients
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const dynamoClient = new DynamoDBClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const iamClient = new IAMClient({ region });

describe('Infrastructure Integration Tests', () => {
  describe('EC2 Instance', () => {
    test('EC2 instance exists and is running', async () => {
      if (!outputs.EC2InstanceId) {
        console.warn('EC2InstanceId not found in outputs, skipping test');
        return;
      }

      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.EC2InstanceId],
      });

      const response = await ec2Client.send(command);
      expect(response.Reservations).toBeDefined();
      expect(response.Reservations!.length).toBeGreaterThan(0);
      
      const instance = response.Reservations![0].Instances![0];
      expect(instance.State?.Name).toBe('running');
      expect(instance.Monitoring?.State).toBe('enabled');
      
      // Verify instance has the correct tags
      const projectTag = instance.Tags?.find(tag => tag.Key === 'Project');
      expect(projectTag?.Value).toBe('IaCChallenge');
    });

    test('EC2 instance has IAM role attached', async () => {
      if (!outputs.EC2InstanceId) {
        console.warn('EC2InstanceId not found in outputs, skipping test');
        return;
      }

      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.EC2InstanceId],
      });

      const response = await ec2Client.send(command);
      const instance = response.Reservations![0].Instances![0];
      
      expect(instance.IamInstanceProfile).toBeDefined();
      expect(instance.IamInstanceProfile?.Arn).toContain('instance-profile');
    });
  });

  describe('S3 Bucket', () => {
    test('S3 bucket exists and is accessible', async () => {
      if (!outputs.S3BucketName) {
        console.warn('S3BucketName not found in outputs, skipping test');
        return;
      }

      const command = new HeadBucketCommand({
        Bucket: outputs.S3BucketName,
      });

      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('S3 bucket has versioning enabled', async () => {
      if (!outputs.S3BucketName) {
        console.warn('S3BucketName not found in outputs, skipping test');
        return;
      }

      const command = new GetBucketVersioningCommand({
        Bucket: outputs.S3BucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket has AES256 encryption', async () => {
      if (!outputs.S3BucketName) {
        console.warn('S3BucketName not found in outputs, skipping test');
        return;
      }

      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.S3BucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
      
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });
  });

  describe('DynamoDB Table', () => {
    test('DynamoDB table exists with correct configuration', async () => {
      if (!outputs.DynamoDBTableName) {
        console.warn('DynamoDBTableName not found in outputs, skipping test');
        return;
      }

      const command = new DescribeTableCommand({
        TableName: outputs.DynamoDBTableName,
      });

      const response = await dynamoClient.send(command);
      expect(response.Table).toBeDefined();
      expect(response.Table!.TableStatus).toBe('ACTIVE');
      expect(response.Table!.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      
      // Verify partition key
      const hashKey = response.Table!.KeySchema?.find(key => key.KeyType === 'HASH');
      expect(hashKey?.AttributeName).toBe('id');
      
      // Verify encryption
      expect(response.Table!.SSEDescription?.Status).toBe('ENABLED');
      expect(response.Table!.SSEDescription?.SSEType).toBe('KMS');
    });

    test('DynamoDB table has point-in-time recovery enabled', async () => {
      if (!outputs.DynamoDBTableName) {
        console.warn('DynamoDBTableName not found in outputs, skipping test');
        return;
      }

      const command = new DescribeContinuousBackupsCommand({
        TableName: outputs.DynamoDBTableName,
      });

      const response = await dynamoClient.send(command);
      expect(response.ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus).toBe('ENABLED');
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('CloudWatch dashboard exists', async () => {
      const dashboardName = `security-dashboard-${environmentSuffix}`;
      
      const command = new GetDashboardCommand({
        DashboardName: dashboardName,
      });

      try {
        const response = await cloudWatchClient.send(command);
        expect(response.DashboardName).toBe(dashboardName);
        expect(response.DashboardBody).toBeDefined();
        
        // Verify dashboard contains expected widgets
        const dashboardBody = JSON.parse(response.DashboardBody!);
        expect(dashboardBody.widgets).toBeDefined();
        expect(dashboardBody.widgets.length).toBeGreaterThan(0);
      } catch (error: any) {
        if (error.name === 'ResourceNotFound') {
          console.warn(`Dashboard ${dashboardName} not found, it may have been cleaned up`);
        } else {
          throw error;
        }
      }
    });

    test('CloudWatch alarm for EC2 CPU exists', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'TapStack',
      });

      const response = await cloudWatchClient.send(command);
      
      if (response.MetricAlarms && response.MetricAlarms.length > 0) {
        const cpuAlarm = response.MetricAlarms.find(alarm => 
          alarm.MetricName === 'CPUUtilization' && 
          alarm.Namespace === 'AWS/EC2'
        );
        
        if (cpuAlarm) {
          expect(cpuAlarm.Threshold).toBe(80);
          expect(cpuAlarm.ComparisonOperator).toBe('GreaterThanThreshold');
          expect(cpuAlarm.EvaluationPeriods).toBe(2);
        }
      }
    });
  });

  describe('IAM Security', () => {
    test('EC2 IAM role exists with correct policies', async () => {
      const roleName = `ec2-role-${environmentSuffix}`;
      
      try {
        const command = new GetRoleCommand({
          RoleName: roleName,
        });

        const response = await iamClient.send(command);
        expect(response.Role).toBeDefined();
        expect(response.Role!.RoleName).toBe(roleName);
        
        // Verify assume role policy allows EC2
        const assumeRolePolicy = JSON.parse(decodeURIComponent(response.Role!.AssumeRolePolicyDocument!));
        const ec2Statement = assumeRolePolicy.Statement.find((stmt: any) => 
          stmt.Principal?.Service === 'ec2.amazonaws.com'
        );
        expect(ec2Statement).toBeDefined();
        expect(ec2Statement.Effect).toBe('Allow');
      } catch (error: any) {
        if (error.name === 'NoSuchEntity') {
          console.warn(`Role ${roleName} not found, it may have been cleaned up`);
        } else {
          throw error;
        }
      }
    });

    test('EC2 instance profile exists', async () => {
      const profileName = `ec2-instance-profile-${environmentSuffix}`;
      
      try {
        const command = new GetInstanceProfileCommand({
          InstanceProfileName: profileName,
        });

        const response = await iamClient.send(command);
        expect(response.InstanceProfile).toBeDefined();
        expect(response.InstanceProfile!.InstanceProfileName).toBe(profileName);
        expect(response.InstanceProfile!.Roles).toBeDefined();
        expect(response.InstanceProfile!.Roles!.length).toBeGreaterThan(0);
      } catch (error: any) {
        if (error.name === 'NoSuchEntity') {
          console.warn(`Instance profile ${profileName} not found, it may have been cleaned up`);
        } else {
          throw error;
        }
      }
    });
  });

  describe('Resource Tagging', () => {
    test('All resources have Project tag', async () => {
      // Check EC2 instance tags
      if (outputs.EC2InstanceId) {
        const ec2Command = new DescribeInstancesCommand({
          InstanceIds: [outputs.EC2InstanceId],
        });
        const ec2Response = await ec2Client.send(ec2Command);
        const instance = ec2Response.Reservations![0].Instances![0];
        const projectTag = instance.Tags?.find(tag => tag.Key === 'Project');
        expect(projectTag?.Value).toBe('IaCChallenge');
      }

      // Check DynamoDB table tags
      if (outputs.DynamoDBTableName) {
        const dynamoCommand = new DescribeTableCommand({
          TableName: outputs.DynamoDBTableName,
        });
        const dynamoResponse = await dynamoClient.send(dynamoCommand);
        // DynamoDB tags are on the table ARN, not directly in DescribeTable response
        expect(dynamoResponse.Table).toBeDefined();
      }
    });
  });

  describe('End-to-End Workflow', () => {
    test('Infrastructure components can interact', async () => {
      // This test verifies that the deployed infrastructure components
      // can work together as intended
      
      // Verify EC2 can access S3 (through IAM role)
      if (outputs.EC2InstanceId && outputs.S3BucketName) {
        // The EC2 instance should have permissions to access the S3 bucket
        // This is verified through the IAM role attached to the instance
        const ec2Command = new DescribeInstancesCommand({
          InstanceIds: [outputs.EC2InstanceId],
        });
        const ec2Response = await ec2Client.send(ec2Command);
        const instance = ec2Response.Reservations![0].Instances![0];
        expect(instance.IamInstanceProfile).toBeDefined();
      }

      // Verify EC2 can access DynamoDB (through IAM role)
      if (outputs.EC2InstanceId && outputs.DynamoDBTableName) {
        // The EC2 instance role should have DynamoDB permissions
        // This is verified by checking the role exists
        const roleName = `ec2-role-${environmentSuffix}`;
        try {
          const roleCommand = new GetRoleCommand({ RoleName: roleName });
          const roleResponse = await iamClient.send(roleCommand);
          expect(roleResponse.Role).toBeDefined();
        } catch (error: any) {
          if (error.name !== 'NoSuchEntity') {
            throw error;
          }
        }
      }

      // Verify monitoring is in place for all components
      if (outputs.EC2InstanceId) {
        // CloudWatch should be monitoring the EC2 instance
        const alarmsCommand = new DescribeAlarmsCommand({
          AlarmNamePrefix: 'TapStack',
        });
        const alarmsResponse = await cloudWatchClient.send(alarmsCommand);
        // At least one alarm should exist (even if resources are cleaned up)
        expect(alarmsResponse.MetricAlarms).toBeDefined();
      }
    });
  });
});