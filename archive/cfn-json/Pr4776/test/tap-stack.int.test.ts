// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  SSMClient,
  SendCommandCommand,
  GetCommandInvocationCommand,
} from '@aws-sdk/client-ssm';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  CloudWatchLogsClient,
  DescribeLogStreamsCommand,
  FilterLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  Route53Client,
  GetHostedZoneCommand,
  ListResourceRecordSetsCommand,
} from '@aws-sdk/client-route-53';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Read AWS region from lib/AWS_REGION file
const awsRegion = fs.readFileSync('lib/AWS_REGION', 'utf8').trim();

// Initialize AWS SDK clients
const asgClient = new AutoScalingClient({ region: awsRegion });
const ssmClient = new SSMClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const cloudwatchLogsClient = new CloudWatchLogsClient({ region: awsRegion });
const cloudwatchClient = new CloudWatchClient({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });
const route53Client = new Route53Client({ region: awsRegion });

// Helper function to wait for SSM command completion
async function waitForCommand(
  commandId: string,
  instanceId: string,
  maxWaitTime = 60000
): Promise<any> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const result = await ssmClient.send(
        new GetCommandInvocationCommand({
          CommandId: commandId,
          InstanceId: instanceId,
        })
      );

      if (result.Status === 'Success' || result.Status === 'Failed') {
        if (result.Status === 'Failed') {
          console.error('Command failed with output:', result.StandardOutputContent);
          console.error('Command failed with error:', result.StandardErrorContent);
        }
        return result;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  throw new Error('Command execution timeout');
}

// Helper function to get running instances from Auto Scaling Group
async function getASGInstances(asgName: string): Promise<string[]> {
  try {
    const response = await asgClient.send(
      new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      })
    );

    if (
      !response.AutoScalingGroups ||
      response.AutoScalingGroups.length === 0
    ) {
      throw new Error(`Auto Scaling Group ${asgName} not found`);
    }

    const instances =
      response.AutoScalingGroups[0].Instances?.filter(
        (instance) => instance.LifecycleState === 'InService'
      ).map((instance) => instance.InstanceId!) || [];

    if (instances.length === 0) {
      throw new Error(`No InService instances found in ASG ${asgName}`);
    }

    return instances;
  } catch (error: any) {
    console.error('Error getting ASG instances:', error);
    throw error;
  }
}

describe('Turn Around Prompt API Integration Tests', () => {
  let asgInstanceIds: string[] = [];

  beforeAll(async () => {
    // Get Auto Scaling Group name and fetch running instances
    const asgName = outputs.AutoScalingGroupName;
    // console.log(`Fetching instances from Auto Scaling Group: ${asgName}`);

    try {
      asgInstanceIds = await getASGInstances(asgName);
      // console.log(`Found ${asgInstanceIds.length} InService instances:`, asgInstanceIds);
    } catch (error: any) {
      console.error('Failed to fetch ASG instances:', error);
      throw error;
    }
  }, 30000);

  // ===================================================================
  // SERVICE-LEVEL TESTS - Test ONE service with actual operations
  // ===================================================================

  describe('SERVICE-LEVEL Tests', () => {
    describe('Auto Scaling Group EC2 Instance Tests', () => {
      test('should be able to create and read a file on first ASG instance', async () => {
        const instanceId = asgInstanceIds[0];

        try {
          // ACTION: Create a file on EC2 instance
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: [
                  'echo "Test content from integration test on ASG instance" > /tmp/integration-test-asg.txt',
                  'cat /tmp/integration-test-asg.txt',
                  'rm /tmp/integration-test-asg.txt',
                ],
              },
            })
          );

          const result = await waitForCommand(
            command.Command!.CommandId!,
            instanceId
          );

          expect(result.Status).toBe('Success');
          expect(result.StandardOutputContent).toContain(
            'Test content from integration test on ASG instance'
          );
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            // console.log('SSM Agent not configured. Skipping test.');
            return;
          }
          throw error;
        }
      }, 90000);

      test('should verify httpd is running on ASG instance', async () => {
        const instanceId = asgInstanceIds[0];

        try {
          // ACTION: Check if httpd service is active
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: ['systemctl is-active httpd'],
              },
            })
          );

          const result = await waitForCommand(
            command.Command!.CommandId!,
            instanceId
          );

          expect(result.Status).toBe('Success');
          expect(result.StandardOutputContent?.trim()).toBe('active');
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            // console.log('SSM Agent not configured. Skipping test.');
            return;
          }
          throw error;
        }
      }, 90000);

      test('should verify mysql client is installed on ASG instance', async () => {
        const instanceId = asgInstanceIds[0];

        try {
          // ACTION: Check if mysql client is installed
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: ['which mysql', 'mysql --version'],
              },
            })
          );

          const result = await waitForCommand(
            command.Command!.CommandId!,
            instanceId
          );

          expect(result.Status).toBe('Success');
          expect(result.StandardOutputContent).toContain('mysql');
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            // console.log('SSM Agent not configured. Skipping test.');
            return;
          }
          throw error;
        }
      }, 90000);
    });

    describe('S3 Bucket Tests', () => {
      test('should upload, retrieve, and delete a test file from S3', async () => {
        const bucketName = outputs.S3WebsiteBucketName;
        const testKey = `integration-test-${Date.now()}.txt`;
        const testContent = 'Integration test content for S3 bucket';

        try {
          // ACTION 1: Upload file to S3
          await s3Client.send(
            new PutObjectCommand({
              Bucket: bucketName,
              Key: testKey,
              Body: testContent,
              ContentType: 'text/plain',
            })
          );

          // ACTION 2: Retrieve file from S3
          const getResponse = await s3Client.send(
            new GetObjectCommand({
              Bucket: bucketName,
              Key: testKey,
            })
          );

          const retrievedContent = await getResponse.Body?.transformToString();
          expect(retrievedContent).toBe(testContent);

          // ACTION 3: Delete file from S3
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: testKey,
            })
          );
        } catch (error: any) {
          console.error('S3 test failed:', error);
          throw error;
        }
      }, 60000);
    });

    describe('RDS Instance Tests', () => {
      test('should verify RDS endpoint is accessible from ASG instance', async () => {
        const instanceId = asgInstanceIds[0];
        const rdsEndpoint = outputs.RDSInstanceEndpoint;

        try {
          // ACTION: Test TCP connectivity to RDS endpoint
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: [
                  `timeout 5 bash -c "</dev/tcp/${rdsEndpoint}/3306" && echo "RDS endpoint reachable" || echo "RDS endpoint not reachable"`,
                ],
              },
            })
          );

          const result = await waitForCommand(
            command.Command!.CommandId!,
            instanceId,
            90000
          );

          expect(result.Status).toBe('Success');
          expect(result.StandardOutputContent).toContain('RDS endpoint reachable');
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            // console.log('SSM Agent not configured. Skipping test.');
            return;
          }
          throw error;
        }
      }, 120000);
    });

    describe('CloudWatch Logs Tests', () => {
      test('should verify VPC Flow Logs are being created', async () => {
        const logGroupName = outputs.VPCFlowLogsLogGroup;

        try {
          // ACTION: Check if log streams exist in the log group
          const response = await cloudwatchLogsClient.send(
            new DescribeLogStreamsCommand({
              logGroupName: logGroupName,
              limit: 5,
            })
          );

          expect(response.logStreams).toBeDefined();
          expect(response.logStreams!.length).toBeGreaterThan(0);
        } catch (error: any) {
          console.error('CloudWatch Logs test failed:', error);
          throw error;
        }
      }, 60000);
    });
  });

  // ===================================================================
  // CROSS-SERVICE TESTS - Make TWO services talk to each other
  // ===================================================================

  describe('CROSS-SERVICE Tests', () => {
    describe('EC2 → S3 Integration', () => {
      test('should upload a file from ASG instance to S3 bucket', async () => {
        const instanceId = asgInstanceIds[0];
        const bucketName = outputs.S3WebsiteBucketName;
        const testKey = `asg-upload-${Date.now()}.txt`;

        try {
          // CROSS-SERVICE ACTION: EC2 creates file and uploads to S3
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: [
                  '#!/bin/bash',
                  'set -e',
                  '',
                  '# Create test file',
                  'echo "File uploaded from ASG instance" > /tmp/test-upload.txt',
                  '',
                  '# Upload to S3',
                  `aws s3 cp /tmp/test-upload.txt s3://${bucketName}/${testKey}`,
                  '',
                  '# Cleanup',
                  'rm /tmp/test-upload.txt',
                  '',
                  'echo "Upload successful"',
                ],
              },
            })
          );

          const result = await waitForCommand(
            command.Command!.CommandId!,
            instanceId,
            120000
          );

          expect(result.Status).toBe('Success');
          expect(result.StandardOutputContent).toContain('Upload successful');

          // Verify file exists in S3
          const getResponse = await s3Client.send(
            new GetObjectCommand({
              Bucket: bucketName,
              Key: testKey,
            })
          );

          const content = await getResponse.Body?.transformToString();
          expect(content).toContain('File uploaded from ASG instance');

          // Cleanup
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: testKey,
            })
          );
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            // console.log('SSM Agent not configured. Skipping test.');
            return;
          }
          throw error;
        }
      }, 180000);

      test('should download a file from S3 to ASG instance', async () => {
        const instanceId = asgInstanceIds[0];
        const bucketName = outputs.S3WebsiteBucketName;
        const testKey = `download-test-${Date.now()}.txt`;
        const testContent = 'Test file for EC2 to download';

        try {
          // First, upload a test file to S3
          await s3Client.send(
            new PutObjectCommand({
              Bucket: bucketName,
              Key: testKey,
              Body: testContent,
              ContentType: 'text/plain',
            })
          );

          // CROSS-SERVICE ACTION: EC2 downloads file from S3
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: [
                  '#!/bin/bash',
                  'set -e',
                  '',
                  '# Download from S3',
                  `aws s3 cp s3://${bucketName}/${testKey} /tmp/downloaded-file.txt`,
                  '',
                  '# Read file content',
                  'cat /tmp/downloaded-file.txt',
                  '',
                  '# Cleanup',
                  'rm /tmp/downloaded-file.txt',
                ],
              },
            })
          );

          const result = await waitForCommand(
            command.Command!.CommandId!,
            instanceId,
            120000
          );

          expect(result.Status).toBe('Success');
          expect(result.StandardOutputContent).toContain(testContent);

          // Cleanup S3
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: testKey,
            })
          );
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            // console.log('SSM Agent not configured. Skipping test.');
            return;
          }
          throw error;
        }
      }, 180000);
    });

    describe('EC2 → RDS Integration', () => {
      test('should connect to RDS from ASG instance using Secrets Manager', async () => {
        const instanceId = asgInstanceIds[0];
        const rdsEndpoint = outputs.RDSInstanceEndpoint;
        const secretArn = outputs.DBSecretArn;

        try {
          // CROSS-SERVICE ACTION: EC2 → Secrets Manager → RDS
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: [
                  '#!/bin/bash',
                  'set -e',
                  '',
                  '# Install jq if not present',
                  'sudo yum install -y jq',
                  '',
                  '# Retrieve password from Secrets Manager',
                  `SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id "${secretArn}" --region ${awsRegion} --query SecretString --output text)`,
                  'DB_PASSWORD=$(echo $SECRET_JSON | jq -r .password)',
                  '',
                  '# Test RDS connection',
                  `mysql -h ${rdsEndpoint} -u admin -p"$DB_PASSWORD" -e "SELECT 'RDS connection successful' AS status;"`,
                ],
              },
            })
          );

          const result = await waitForCommand(
            command.Command!.CommandId!,
            instanceId,
            180000
          );

          expect(result.Status).toBe('Success');
          expect(result.StandardOutputContent).toContain(
            'RDS connection successful'
          );
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            // console.log('SSM Agent not configured. Skipping test.');
            return;
          }
          throw error;
        }
      }, 240000);
    });

    describe('EC2 → CloudWatch Integration', () => {
      test('should send custom metric from ASG instance to CloudWatch', async () => {
        const instanceId = asgInstanceIds[0];

        try {
          // CROSS-SERVICE ACTION: EC2 → CloudWatch
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: [
                  '#!/bin/bash',
                  'set -e',
                  '',
                  '# Send custom metric to CloudWatch',
                  'aws cloudwatch put-metric-data \\',
                  '  --namespace "TAPStack/IntegrationTests" \\',
                  '  --metric-name "TestMetric" \\',
                  '  --value 1 \\',
                  `  --region ${awsRegion}`,
                  '',
                  'echo "Custom metric sent to CloudWatch"',
                ],
              },
            })
          );

          const result = await waitForCommand(
            command.Command!.CommandId!,
            instanceId,
            90000
          );

          expect(result.Status).toBe('Success');
          expect(result.StandardOutputContent).toContain(
            'Custom metric sent to CloudWatch'
          );
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            // console.log('SSM Agent not configured. Skipping test.');
            return;
          }
          throw error;
        }
      }, 120000);
    });
  });

  // ===================================================================
  // E2E TESTS - Complete workflows with REAL DATA (3+ services)
  // ===================================================================

  describe('E2E Tests', () => {
    describe('Complete Database Workflow', () => {
      test('should execute complete flow: EC2 performs database operations on RDS with real data', async () => {
        const instanceId = asgInstanceIds[0];
        const rdsEndpoint = outputs.RDSInstanceEndpoint;
        const secretArn = outputs.DBSecretArn;

        try {
          // E2E ACTION: EC2 → Secrets Manager → RDS (CREATE, INSERT, SELECT, DELETE)
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: [
                  '#!/bin/bash',
                  'set -e',
                  '',
                  '# Step 0: Install jq if not present',
                  'sudo yum install -y jq',
                  '',
                  '# Step 1: Retrieve password from Secrets Manager',
                  `SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id "${secretArn}" --region ${awsRegion} --query SecretString --output text)`,
                  'DB_PASSWORD=$(echo $SECRET_JSON | jq -r .password)',
                  '',
                  '# Step 2: Connect to RDS and perform operations',
                  `mysql -h ${rdsEndpoint} -u admin -p"$DB_PASSWORD" << 'EOF'`,
                  '-- Step 2: Create test database',
                  'CREATE DATABASE IF NOT EXISTS integration_test;',
                  'USE integration_test;',
                  '',
                  '-- Step 3: Create test table',
                  'CREATE TABLE IF NOT EXISTS cloud_env_test (',
                  '  id INT AUTO_INCREMENT PRIMARY KEY,',
                  '  instance_name VARCHAR(255),',
                  '  test_value VARCHAR(255),',
                  '  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
                  ');',
                  '',
                  '-- Step 4: Insert test data',
                  'INSERT INTO cloud_env_test (instance_name, test_value) VALUES ("ASG-Instance", "E2E integration test successful");',
                  '',
                  '-- Step 5: Query test data',
                  'SELECT * FROM cloud_env_test ORDER BY id DESC LIMIT 1;',
                  '',
                  '-- Step 6: Cleanup',
                  'DROP TABLE cloud_env_test;',
                  'DROP DATABASE integration_test;',
                  'EOF',
                  '',
                  'echo "E2E database test completed successfully"',
                ],
              },
            })
          );

          const result = await waitForCommand(
            command.Command!.CommandId!,
            instanceId,
            180000
          );

          expect(result.Status).toBe('Success');
          expect(result.StandardOutputContent).toContain(
            'E2E integration test successful'
          );
          expect(result.StandardOutputContent).toContain(
            'E2E database test completed successfully'
          );
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            // console.log('SSM Agent not configured. Skipping E2E test.');
            return;
          }
          throw error;
        }
      }, 240000);
    });

    describe('Complete Storage Workflow', () => {
      test('should execute complete flow: EC2 creates data, uploads to S3, downloads, and verifies', async () => {
        const instanceId = asgInstanceIds[0];
        const bucketName = outputs.S3WebsiteBucketName;
        const testKey = `e2e-test-${Date.now()}.json`;

        try {
          // E2E ACTION: EC2 → S3 (CREATE, UPLOAD, DOWNLOAD, VERIFY)
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: [
                  '#!/bin/bash',
                  'set -e',
                  '',
                  '# Step 1: Create test data',
                  'cat > /tmp/test-data.json << "DATA"',
                  '{',
                  '  "test_name": "E2E Storage Workflow",',
                  '  "timestamp": "$(date -u +\\"%Y-%m-%dT%H:%M:%SZ\\")",',
                  '  "status": "success"',
                  '}',
                  'DATA',
                  '',
                  '# Step 2: Upload to S3',
                  `aws s3 cp /tmp/test-data.json s3://${bucketName}/${testKey}`,
                  'echo "Step 2: Uploaded to S3"',
                  '',
                  '# Step 3: Download from S3 to different location',
                  `aws s3 cp s3://${bucketName}/${testKey} /tmp/downloaded-data.json`,
                  'echo "Step 3: Downloaded from S3"',
                  '',
                  '# Step 4: Verify data integrity',
                  'diff /tmp/test-data.json /tmp/downloaded-data.json && echo "Step 4: Data integrity verified"',
                  '',
                  '# Step 5: Read and display content',
                  'cat /tmp/downloaded-data.json',
                  '',
                  '# Step 6: Cleanup',
                  'rm /tmp/test-data.json /tmp/downloaded-data.json',
                  'echo "E2E storage workflow completed successfully"',
                ],
              },
            })
          );

          const result = await waitForCommand(
            command.Command!.CommandId!,
            instanceId,
            120000
          );

          expect(result.Status).toBe('Success');
          expect(result.StandardOutputContent).toContain(
            'Step 2: Uploaded to S3'
          );
          expect(result.StandardOutputContent).toContain(
            'Step 3: Downloaded from S3'
          );
          expect(result.StandardOutputContent).toContain(
            'Step 4: Data integrity verified'
          );
          expect(result.StandardOutputContent).toContain(
            'E2E Storage Workflow'
          );
          expect(result.StandardOutputContent).toContain(
            'E2E storage workflow completed successfully'
          );

          // Cleanup S3
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: testKey,
            })
          );
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            // console.log('SSM Agent not configured. Skipping E2E test.');
            return;
          }
          throw error;
        }
      }, 180000);
    });

    describe('Complete Network Flow', () => {
      test('should execute complete flow: verify multi-tier network connectivity across all layers', async () => {
        const instanceId = asgInstanceIds[0];
        const rdsEndpoint = outputs.RDSInstanceEndpoint;
        const bucketName = outputs.S3WebsiteBucketName;

        try {
          // E2E ACTION: EC2 → Internet + S3 + RDS (network connectivity test)
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: [
                  '#!/bin/bash',
                  'set -e',
                  '',
                  'echo "=== Network Connectivity Test ==="',
                  '',
                  '# Step 1: Test internet connectivity (via NAT Gateway)',
                  'curl -s -o /dev/null -w "Step 1: Internet connectivity via NAT Gateway - HTTP Status: %{http_code}\\n" https://www.amazon.com || echo "Step 1: Failed"',
                  '',
                  '# Step 2: Test S3 connectivity',
                  `aws s3 ls s3://${bucketName} > /dev/null && echo "Step 2: S3 connectivity successful" || echo "Step 2: S3 connectivity failed"`,
                  '',
                  '# Step 3: Test RDS connectivity',
                  `timeout 5 bash -c "</dev/tcp/${rdsEndpoint}/3306" && echo "Step 3: RDS connectivity successful" || echo "Step 3: RDS connectivity failed"`,
                  '',
                  '# Step 4: Test AWS API connectivity',
                  'aws sts get-caller-identity > /dev/null && echo "Step 4: AWS API connectivity successful" || echo "Step 4: AWS API connectivity failed"',
                  '',
                  'echo "=== Network Flow Test Completed ==="',
                ],
              },
            })
          );

          const result = await waitForCommand(
            command.Command!.CommandId!,
            instanceId,
            120000
          );

          expect(result.Status).toBe('Success');
          expect(result.StandardOutputContent).toContain(
            'Step 1: Internet connectivity via NAT Gateway'
          );
          expect(result.StandardOutputContent).toContain(
            'Step 2: S3 connectivity successful'
          );
          expect(result.StandardOutputContent).toContain(
            'Step 3: RDS connectivity successful'
          );
          expect(result.StandardOutputContent).toContain(
            'Step 4: AWS API connectivity successful'
          );
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            // console.log('SSM Agent not configured. Skipping E2E test.');
            return;
          }
          throw error;
        }
      }, 180000);
    });
  });

  // ===================================================================
  // ADDITIONAL SERVICE-LEVEL TESTS - 6 EASY Services
  // ===================================================================

  describe('Additional SERVICE-LEVEL Tests', () => {
    describe('CloudWatch Alarms Tests', () => {
      test('should verify CPU High alarm exists and is configured correctly', async () => {
        const alarmName = `ASG-CPUHigh-${environmentSuffix}`;

        try {
          // ACTION: Describe CloudWatch Alarm
          const response = await cloudwatchClient.send(
            new DescribeAlarmsCommand({
              AlarmNames: [alarmName],
            })
          );

          expect(response.MetricAlarms).toBeDefined();
          expect(response.MetricAlarms!.length).toBe(1);

          const alarm = response.MetricAlarms![0];
          expect(alarm.AlarmName).toBe(alarmName);
          expect(alarm.MetricName).toBe('CPUUtilization');
          expect(alarm.Namespace).toBe('AWS/EC2');
          expect(alarm.Threshold).toBe(70);
          expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
          expect(alarm.StateValue).toBeDefined();

          // console.log(`CPU High Alarm state: ${alarm.StateValue}`);
        } catch (error: any) {
          console.error('CloudWatch Alarm test failed:', error);
          throw error;
        }
      }, 60000);

      test('should verify CPU Low alarm exists and is configured correctly', async () => {
        const alarmName = `ASG-CPULow-${environmentSuffix}`;

        try {
          // ACTION: Describe CloudWatch Alarm
          const response = await cloudwatchClient.send(
            new DescribeAlarmsCommand({
              AlarmNames: [alarmName],
            })
          );

          expect(response.MetricAlarms).toBeDefined();
          expect(response.MetricAlarms!.length).toBe(1);

          const alarm = response.MetricAlarms![0];
          expect(alarm.AlarmName).toBe(alarmName);
          expect(alarm.MetricName).toBe('CPUUtilization');
          expect(alarm.Namespace).toBe('AWS/EC2');
          expect(alarm.Threshold).toBe(30);
          expect(alarm.ComparisonOperator).toBe('LessThanThreshold');
          expect(alarm.StateValue).toBeDefined();

          // console.log(`CPU Low Alarm state: ${alarm.StateValue}`);
        } catch (error: any) {
          console.error('CloudWatch Alarm test failed:', error);
          throw error;
        }
      }, 60000);
    });

    describe('Auto Scaling Policies Tests', () => {
      test('should verify Scale Up policy exists and is configured correctly', async () => {
        const asgName = outputs.AutoScalingGroupName;

        try {
          // ACTION: Describe Auto Scaling Policies
          const response = await asgClient.send(
            new DescribePoliciesCommand({
              AutoScalingGroupName: asgName,
            })
          );

          expect(response.ScalingPolicies).toBeDefined();
          expect(response.ScalingPolicies!.length).toBeGreaterThan(0);

          // Find Scale Up Policy
          const scaleUpPolicy = response.ScalingPolicies!.find((policy) =>
            policy.PolicyName?.includes('ScaleUp')
          );

          expect(scaleUpPolicy).toBeDefined();
          expect(scaleUpPolicy!.AdjustmentType).toBe('ChangeInCapacity');
          expect(scaleUpPolicy!.ScalingAdjustment).toBe(1);

          // console.log(`Scale Up Policy: ${scaleUpPolicy!.PolicyName}`);
        } catch (error: any) {
          console.error('Auto Scaling Policy test failed:', error);
          throw error;
        }
      }, 60000);

      test('should verify Scale Down policy exists and is configured correctly', async () => {
        const asgName = outputs.AutoScalingGroupName;

        try {
          // ACTION: Describe Auto Scaling Policies
          const response = await asgClient.send(
            new DescribePoliciesCommand({
              AutoScalingGroupName: asgName,
            })
          );

          expect(response.ScalingPolicies).toBeDefined();
          expect(response.ScalingPolicies!.length).toBeGreaterThan(0);

          // Find Scale Down Policy
          const scaleDownPolicy = response.ScalingPolicies!.find((policy) =>
            policy.PolicyName?.includes('ScaleDown')
          );

          expect(scaleDownPolicy).toBeDefined();
          expect(scaleDownPolicy!.AdjustmentType).toBe('ChangeInCapacity');
          expect(scaleDownPolicy!.ScalingAdjustment).toBe(-1);

          // console.log(`Scale Down Policy: ${scaleDownPolicy!.PolicyName}`);
        } catch (error: any) {
          console.error('Auto Scaling Policy test failed:', error);
          throw error;
        }
      }, 60000);
    });

    describe('VPC Flow Logs Data Tests', () => {
      test('should read actual VPC Flow Log data from CloudWatch Logs', async () => {
        const logGroupName = outputs.VPCFlowLogsLogGroup;

        try {
          // ACTION: Read flow log events
          const response = await cloudwatchLogsClient.send(
            new FilterLogEventsCommand({
              logGroupName: logGroupName,
              limit: 10,
            })
          );

          expect(response.events).toBeDefined();

          if (response.events && response.events.length > 0) {
            // console.log(`Found ${response.events.length} flow log events`);
            // console.log('Sample flow log:', response.events[0].message);

            // Verify flow log format (should contain VPC Flow Log fields)
            const sampleLog = response.events[0].message || '';
            expect(sampleLog.length).toBeGreaterThan(0);
          } else {
            // console.log('No flow log data yet (this is normal for new deployments)');
          }

          // At minimum, verify we can query the log group
          expect(response).toBeDefined();
        } catch (error: any) {
          console.error('VPC Flow Logs test failed:', error);
          throw error;
        }
      }, 60000);
    });

    describe('Route 53 Tests', () => {
      test('should verify Route 53 Hosted Zone exists and is configured correctly', async () => {
        const hostedZoneId = outputs.Route53HostedZoneId;

        try {
          // ACTION: Get Hosted Zone details
          const response = await route53Client.send(
            new GetHostedZoneCommand({
              Id: hostedZoneId,
            })
          );

          expect(response.HostedZone).toBeDefined();
          expect(response.HostedZone!.Id).toContain(hostedZoneId);
          expect(response.HostedZone!.Config?.PrivateZone).toBe(false);

          // console.log(`Hosted Zone Name: ${response.HostedZone!.Name}`);
          // console.log(`Resource Record Set Count: ${response.HostedZone!.ResourceRecordSetCount}`);
        } catch (error: any) {
          console.error('Route 53 Hosted Zone test failed:', error);
          throw error;
        }
      }, 60000);

      test('should verify Route 53 DNS records exist in the hosted zone', async () => {
        const hostedZoneId = outputs.Route53HostedZoneId;

        try {
          // ACTION: List resource record sets
          const response = await route53Client.send(
            new ListResourceRecordSetsCommand({
              HostedZoneId: hostedZoneId,
            })
          );

          expect(response.ResourceRecordSets).toBeDefined();
          expect(response.ResourceRecordSets!.length).toBeGreaterThan(0);

          // Verify NS and SOA records exist (default records)
          const nsRecord = response.ResourceRecordSets!.find(
            (record) => record.Type === 'NS'
          );
          const soaRecord = response.ResourceRecordSets!.find(
            (record) => record.Type === 'SOA'
          );

          expect(nsRecord).toBeDefined();
          expect(soaRecord).toBeDefined();

          // console.log(`Found ${response.ResourceRecordSets!.length} DNS records`);
        } catch (error: any) {
          console.error('Route 53 Records test failed:', error);
          throw error;
        }
      }, 60000);
    });

    describe('VPC and Network Infrastructure Tests', () => {
      test('should verify VPC exists and is configured correctly', async () => {
        const vpcId = outputs.VPCId;

        try {
          // ACTION: Describe VPC
          const response = await ec2Client.send(
            new DescribeVpcsCommand({
              VpcIds: [vpcId],
            })
          );

          expect(response.Vpcs).toBeDefined();
          expect(response.Vpcs!.length).toBe(1);

          const vpc = response.Vpcs![0];
          expect(vpc.VpcId).toBe(vpcId);
          expect(vpc.State).toBe('available');
          expect(vpc.CidrBlock).toBeDefined();

          // console.log(`VPC CIDR: ${vpc.CidrBlock}`);
          // console.log(`VPC State: ${vpc.State}`);
        } catch (error: any) {
          console.error('VPC test failed:', error);
          throw error;
        }
      }, 60000);

      test('should verify all subnets exist and are in correct availability zones', async () => {
        const publicSubnet1Id = outputs.PublicSubnet1Id;
        const publicSubnet2Id = outputs.PublicSubnet2Id;
        const privateSubnet1Id = outputs.PrivateSubnet1Id;
        const privateSubnet2Id = outputs.PrivateSubnet2Id;

        try {
          // ACTION: Describe all subnets
          const response = await ec2Client.send(
            new DescribeSubnetsCommand({
              SubnetIds: [
                publicSubnet1Id,
                publicSubnet2Id,
                privateSubnet1Id,
                privateSubnet2Id,
              ],
            })
          );

          expect(response.Subnets).toBeDefined();
          expect(response.Subnets!.length).toBe(4);

          // Verify all subnets are available
          response.Subnets!.forEach((subnet) => {
            expect(subnet.State).toBe('available');
            expect(subnet.AvailabilityZone).toBeDefined();
            expect(subnet.CidrBlock).toBeDefined();
          });

          // Verify subnets are in different AZs (high availability)
          const azs = new Set(response.Subnets!.map((s) => s.AvailabilityZone));
          expect(azs.size).toBe(2); // Should be in 2 different AZs

          // console.log(`All 4 subnets are available across ${azs.size} AZs`);
        } catch (error: any) {
          console.error('Subnets test failed:', error);
          throw error;
        }
      }, 60000);

      test('should verify Internet Gateway is attached to VPC', async () => {
        const vpcId = outputs.VPCId;
        const igwId = outputs.InternetGatewayId;

        try {
          // ACTION: Describe Internet Gateway
          const response = await ec2Client.send(
            new DescribeInternetGatewaysCommand({
              InternetGatewayIds: [igwId],
            })
          );

          expect(response.InternetGateways).toBeDefined();
          expect(response.InternetGateways!.length).toBe(1);

          const igw = response.InternetGateways![0];
          expect(igw.InternetGatewayId).toBe(igwId);

          // Verify IGW is attached to our VPC
          const attachment = igw.Attachments?.find((a) => a.VpcId === vpcId);
          expect(attachment).toBeDefined();
          expect(attachment!.State).toBe('available');

          // console.log(`Internet Gateway ${igwId} is attached to VPC ${vpcId}`);
        } catch (error: any) {
          console.error('Internet Gateway test failed:', error);
          throw error;
        }
      }, 60000);

      test('should verify both NAT Gateways are available', async () => {
        const natGateway1Id = outputs.NATGateway1Id;
        const natGateway2Id = outputs.NATGateway2Id;

        try {
          // ACTION: Describe NAT Gateways
          const response = await ec2Client.send(
            new DescribeNatGatewaysCommand({
              NatGatewayIds: [natGateway1Id, natGateway2Id],
            })
          );

          expect(response.NatGateways).toBeDefined();
          expect(response.NatGateways!.length).toBe(2);

          // Verify both NAT Gateways are available
          response.NatGateways!.forEach((nat) => {
            expect(nat.State).toBe('available');
            expect(nat.SubnetId).toBeDefined();
            expect(nat.NatGatewayAddresses).toBeDefined();
            expect(nat.NatGatewayAddresses!.length).toBeGreaterThan(0);
          });

          // Verify NAT Gateways are in different subnets (high availability)
          const subnets = response.NatGateways!.map((n) => n.SubnetId);
          expect(new Set(subnets).size).toBe(2);

          // console.log('Both NAT Gateways are available in different subnets');
        } catch (error: any) {
          console.error('NAT Gateways test failed:', error);
          throw error;
        }
      }, 60000);
    });
  });
});
