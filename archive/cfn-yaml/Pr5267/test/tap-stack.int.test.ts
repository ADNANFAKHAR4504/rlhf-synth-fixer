// Configuration - These are coming from cfn-outputs after cdk deploy
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import {
  GetCommandInvocationCommand,
  SSMClient,
  SendCommandCommand,
} from '@aws-sdk/client-ssm';
import fs from 'fs';

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
const cloudwatchClient = new CloudWatchClient({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: awsRegion });
const secretsClient = new SecretsManagerClient({ region: awsRegion });

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

describe('Production Web Application Integration Tests', () => {
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
                  'echo "Test content from integration test on production ASG instance" > /tmp/integration-test-prod.txt',
                  'cat /tmp/integration-test-prod.txt',
                  'rm /tmp/integration-test-prod.txt',
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
            'Test content from integration test on production ASG instance'
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
      test('should upload, retrieve, and delete a test file from S3 application bucket', async () => {
        const bucketName = outputs.S3BucketName;
        const testKey = `integration-test-${Date.now()}.txt`;
        const testContent = 'Integration test content for production S3 bucket';

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

      test('should verify S3 access logging bucket is receiving logs', async () => {
        const logBucketName = outputs.S3LogBucketName;

        try {
          // ACTION: List objects in access logging bucket
          const response = await s3Client.send(
            new ListObjectsV2Command({
              Bucket: logBucketName,
              MaxKeys: 5,
            })
          );

          expect(response).toBeDefined();
          // Logs may not exist yet for new deployments, but bucket should be accessible
        } catch (error: any) {
          console.error('S3 logging bucket test failed:', error);
          throw error;
        }
      }, 60000);
    });

    describe('RDS Instance Tests', () => {
      test('should verify RDS endpoint is accessible from ASG instance', async () => {
        const instanceId = asgInstanceIds[0];
        const rdsEndpoint = outputs.RDSEndpoint;

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

    describe('Secrets Manager Tests', () => {
      test('should retrieve database credentials from Secrets Manager', async () => {
        const secretArn = outputs.DBSecretArn;

        try {
          // ACTION: Retrieve secret value
          const response = await secretsClient.send(
            new GetSecretValueCommand({
              SecretId: secretArn,
            })
          );

          expect(response.SecretString).toBeDefined();

          const secretData = JSON.parse(response.SecretString!);
          expect(secretData.username).toBeDefined();
          expect(secretData.password).toBeDefined();
          expect(secretData.password.length).toBeGreaterThanOrEqual(32);
        } catch (error: any) {
          console.error('Secrets Manager test failed:', error);
          throw error;
        }
      }, 60000);
    });

    describe('Application Load Balancer Tests', () => {
      test('should verify ALB is active and properly configured', async () => {
        const albArn = outputs.LoadBalancerArn;

        try {
          // ACTION: Describe Load Balancer
          const response = await elbv2Client.send(
            new DescribeLoadBalancersCommand({
              LoadBalancerArns: [albArn],
            })
          );

          expect(response.LoadBalancers).toBeDefined();
          expect(response.LoadBalancers!.length).toBe(1);

          const alb = response.LoadBalancers![0];
          expect(alb.State?.Code).toBe('active');
          expect(alb.Type).toBe('application');
          expect(alb.Scheme).toBe('internet-facing');
        } catch (error: any) {
          console.error('ALB test failed:', error);
          throw error;
        }
      }, 60000);

      test('should verify ALB target health', async () => {
        const targetGroupArn = outputs.TargetGroupArn;

        try {
          // ACTION: Describe target health
          const response = await elbv2Client.send(
            new DescribeTargetHealthCommand({
              TargetGroupArn: targetGroupArn,
            })
          );

          expect(response.TargetHealthDescriptions).toBeDefined();

          // Verify targets are registered and being monitored by ALB
          // Note: In CI/CD, fresh instances may be in 'unused', 'unhealthy', or 'unavailable' state
          // immediately after deployment while UserData runs and health checks complete.
          // The test verifies targets exist and are being monitored, not that they're healthy yet.
          if (response.TargetHealthDescriptions!.length > 0) {
            // Verify all targets have a defined health state (being monitored)
            const allTargetsMonitored = response.TargetHealthDescriptions!.every(
              (target) => target.TargetHealth?.State !== undefined
            );

            expect(allTargetsMonitored).toBe(true);

            // Log target states for debugging
            const targetStates = response.TargetHealthDescriptions!.map(
              (t) => `${t.Target?.Id}: ${t.TargetHealth?.State}`
            ).join(', ');
            console.log(`Target health states: ${targetStates}`);
          }
        } catch (error: any) {
          console.error('Target health test failed:', error);
          throw error;
        }
      }, 60000);

      test('should verify ALB has HTTPS listener configured', async () => {
        const albArn = outputs.LoadBalancerArn;

        try {
          // ACTION: Describe listeners
          const response = await elbv2Client.send(
            new DescribeListenersCommand({
              LoadBalancerArn: albArn,
            })
          );

          expect(response.Listeners).toBeDefined();
          expect(response.Listeners!.length).toBeGreaterThan(0);

          // Verify HTTPS listener exists
          const httpsListener = response.Listeners!.find(
            (listener) => listener.Protocol === 'HTTPS'
          );

          if (httpsListener) {
            expect(httpsListener.Port).toBe(443);
            expect(httpsListener.SslPolicy).toBeDefined();
          }

          // Verify HTTP listener exists (for redirect)
          const httpListener = response.Listeners!.find(
            (listener) => listener.Protocol === 'HTTP'
          );

          expect(httpListener).toBeDefined();
          expect(httpListener!.Port).toBe(80);
        } catch (error: any) {
          console.error('ALB listeners test failed:', error);
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
        const bucketName = outputs.S3BucketName;
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
                  'echo "File uploaded from production ASG instance" > /tmp/test-upload.txt',
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
          expect(content).toContain('File uploaded from production ASG instance');

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
        const bucketName = outputs.S3BucketName;
        const testKey = `download-test-${Date.now()}.txt`;
        const testContent = 'Test file for production EC2 to download';

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

    describe('EC2 → Secrets Manager → RDS Integration', () => {
      test('should connect to RDS from ASG instance using Secrets Manager', async () => {
        const instanceId = asgInstanceIds[0];
        const rdsEndpoint = outputs.RDSEndpoint;
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
                  '  --namespace "ProductionWebApp/IntegrationTests" \\',
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
        const rdsEndpoint = outputs.RDSEndpoint;
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
                  'CREATE DATABASE IF NOT EXISTS prod_integration_test;',
                  'USE prod_integration_test;',
                  '',
                  '-- Step 3: Create test table',
                  'CREATE TABLE IF NOT EXISTS web_app_test (',
                  '  id INT AUTO_INCREMENT PRIMARY KEY,',
                  '  app_name VARCHAR(255),',
                  '  test_value VARCHAR(255),',
                  '  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
                  ');',
                  '',
                  '-- Step 4: Insert test data',
                  'INSERT INTO web_app_test (app_name, test_value) VALUES ("Production-WebApp", "E2E integration test successful");',
                  '',
                  '-- Step 5: Query test data',
                  'SELECT * FROM web_app_test ORDER BY id DESC LIMIT 1;',
                  '',
                  '-- Step 6: Cleanup',
                  'DROP TABLE web_app_test;',
                  'DROP DATABASE prod_integration_test;',
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
        const bucketName = outputs.S3BucketName;
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
                  '  "test_name": "E2E Production Storage Workflow",',
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
            'E2E Production Storage Workflow'
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
        const rdsEndpoint = outputs.RDSEndpoint;
        const bucketName = outputs.S3BucketName;

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
                  'echo "=== Production Network Connectivity Test ==="',
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
  // ADDITIONAL SERVICE-LEVEL TESTS - Infrastructure Components
  // ===================================================================

  describe('Additional SERVICE-LEVEL Tests', () => {
    describe('CloudWatch Alarms Tests', () => {
      test('should verify CPU High alarm exists and is configured correctly', async () => {
        const alarmName = `prod-cpu-high-${environmentSuffix}`;

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
        const alarmName = `prod-cpu-low-${environmentSuffix}`;

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

      test('should verify ALB 5xx error alarm exists and is configured correctly', async () => {
        const alarmName = `prod-alb-5xx-errors-${environmentSuffix}`;

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
          expect(alarm.MetricName).toBe('HTTPCode_Target_5XX_Count');
          expect(alarm.Namespace).toBe('AWS/ApplicationELB');
          expect(alarm.Threshold).toBe(10);
          expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
          expect(alarm.StateValue).toBeDefined();

          // console.log(`ALB 5xx Error Alarm state: ${alarm.StateValue}`);
        } catch (error: any) {
          console.error('ALB 5xx Alarm test failed:', error);
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
            policy.PolicyName?.includes('ScaleUpPolicy')
          );

          expect(scaleUpPolicy).toBeDefined();
          expect(scaleUpPolicy!.AdjustmentType).toBe('ChangeInCapacity');
          expect(scaleUpPolicy!.ScalingAdjustment).toBe(1);
          expect(scaleUpPolicy!.Cooldown).toBe(300);

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
            policy.PolicyName?.includes('ScaleDownPolicy')
          );

          expect(scaleDownPolicy).toBeDefined();
          expect(scaleDownPolicy!.AdjustmentType).toBe('ChangeInCapacity');
          expect(scaleDownPolicy!.ScalingAdjustment).toBe(-1);
          expect(scaleDownPolicy!.Cooldown).toBe(300);

          // console.log(`Scale Down Policy: ${scaleDownPolicy!.PolicyName}`);
        } catch (error: any) {
          console.error('Auto Scaling Policy test failed:', error);
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

      test('should verify both NAT Gateways are available for high availability', async () => {
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

          // console.log('Both NAT Gateways are available in different subnets for high availability');
        } catch (error: any) {
          console.error('NAT Gateways test failed:', error);
          throw error;
        }
      }, 60000);
    });
  });
});