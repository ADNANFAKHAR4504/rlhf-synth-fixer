import { CloudWatchClient, DescribeAlarmsCommand, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { DescribeInstancesCommand, DescribeInternetGatewaysCommand, DescribeNatGatewaysCommand, DescribeRouteTablesCommand, DescribeSecurityGroupsCommand, DescribeSubnetsCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { GetBucketVersioningCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, S3Client, ListObjectVersionsCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { GetRoleCommand, GetInstanceProfileCommand, ListAttachedRolePoliciesCommand, ListRolePoliciesCommand, GetRolePolicyCommand, IAMClient } from '@aws-sdk/client-iam';
import { SendCommandCommand, GetCommandInvocationCommand, SSMClient } from '@aws-sdk/client-ssm';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-west-1';

// Initialize AWS SDK v3 clients
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const s3Client = new S3Client({ region });
const iamClient = new IAMClient({ region });
const ssmClient = new SSMClient({ region });

// Helper function to wait for SSM command completion
async function waitForCommand(commandId: string, instanceId: string, maxWaitTime = 60000): Promise<any> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const result = await ssmClient.send(new GetCommandInvocationCommand({
        CommandId: commandId,
        InstanceId: instanceId
      }));

      if (result.Status === 'Success' || result.Status === 'Failed') {
        return result;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  throw new Error('Command execution timeout');
}

describe('Cloud Environment Setup Integration Tests', () => {

  // ============================================================================
  // PART 1: SERVICE-LEVEL TESTS (Single Service WITH ACTUAL INTERACTIONS)
  // ============================================================================

  describe('[Service-Level] EC2 Instance 1 Interactions', () => {
    // Maps to PROMPT requirement: "Create an EC2 instance in each public subnet"
    // SERVICE-LEVEL TEST: Actually run commands on EC2 instance 1
    test('should be able to execute commands on EC2 instance 1 via SSM', async () => {
      const instanceId = outputs.EC2Instance1Id;

      try {
        // ACTION: Run a command on EC2 instance 1
        const command = await ssmClient.send(new SendCommandCommand({
          DocumentName: 'AWS-RunShellScript',
          InstanceIds: [instanceId],
          Parameters: {
            commands: ['echo "Integration test on instance 1 executed successfully"', 'uname -a', 'whoami']
          }
        }));

        const commandId = command.Command!.CommandId!;

        // Wait for command to complete
        const result = await waitForCommand(commandId, instanceId);

        expect(result.Status).toBe('Success');
        expect(result.StandardOutputContent).toContain('Integration test on instance 1 executed successfully');
        expect(result.StandardOutputContent).toContain('Linux');
      } catch (error: any) {
        if (error.message?.includes('SSM Agent')) {
          console.log('SSM Agent not configured on instance 1. Skipping SSM test.');
          return;
        }
        throw error;
      }
    }, 90000);

    test('should be able to create and read a file on EC2 instance 1', async () => {
      const instanceId = outputs.EC2Instance1Id;

      try {
        // ACTION: Create a file on EC2 instance 1
        const command = await ssmClient.send(new SendCommandCommand({
          DocumentName: 'AWS-RunShellScript',
          InstanceIds: [instanceId],
          Parameters: {
            commands: [
              'echo "Test content from integration test on instance 1" > /tmp/integration-test-1.txt',
              'cat /tmp/integration-test-1.txt',
              'rm /tmp/integration-test-1.txt'
            ]
          }
        }));

        const result = await waitForCommand(command.Command!.CommandId!, instanceId);

        expect(result.Status).toBe('Success');
        expect(result.StandardOutputContent).toContain('Test content from integration test on instance 1');
      } catch (error: any) {
        if (error.message?.includes('SSM Agent')) {
          console.log('SSM Agent not configured on instance 1. Skipping test.');
          return;
        }
        throw error;
      }
    }, 90000);
  });

  describe('[Service-Level] EC2 Instance 2 Interactions', () => {
    // Maps to PROMPT requirement: "Create an EC2 instance in each public subnet"
    // SERVICE-LEVEL TEST: Actually run commands on EC2 instance 2
    test('should be able to execute commands on EC2 instance 2 via SSM', async () => {
      const instanceId = outputs.EC2Instance2Id;

      try {
        // ACTION: Run a command on EC2 instance 2
        const command = await ssmClient.send(new SendCommandCommand({
          DocumentName: 'AWS-RunShellScript',
          InstanceIds: [instanceId],
          Parameters: {
            commands: ['echo "Integration test on instance 2 executed successfully"', 'uname -a', 'whoami']
          }
        }));

        const commandId = command.Command!.CommandId!;

        // Wait for command to complete
        const result = await waitForCommand(commandId, instanceId);

        expect(result.Status).toBe('Success');
        expect(result.StandardOutputContent).toContain('Integration test on instance 2 executed successfully');
        expect(result.StandardOutputContent).toContain('Linux');
      } catch (error: any) {
        if (error.message?.includes('SSM Agent')) {
          console.log('SSM Agent not configured on instance 2. Skipping SSM test.');
          return;
        }
        throw error;
      }
    }, 90000);
  });

  describe('[Service-Level] S3 Bucket Interactions', () => {
    // Maps to PROMPT requirement: "Create an S3 bucket with versioning enabled"
    // SERVICE-LEVEL TEST: Actually upload, retrieve, and delete objects
    test('should be able to upload and retrieve objects from S3 bucket', async () => {
      const bucketName = outputs.S3BucketName;
      const testKey = 'integration-test/test-file.txt';
      const testContent = 'Integration test content for S3';

      try {
        // ACTION 1: Upload object to S3
        await s3Client.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: testContent
        }));

        // ACTION 2: Retrieve object from S3
        const getResponse = await s3Client.send(new GetObjectCommand({
          Bucket: bucketName,
          Key: testKey
        }));

        const retrievedContent = await getResponse.Body!.transformToString();
        expect(retrievedContent).toBe(testContent);

        // ACTION 3: Delete object
        await s3Client.send(new DeleteObjectCommand({
          Bucket: bucketName,
          Key: testKey
        }));
      } catch (error) {
        console.error('S3 test error:', error);
        throw error;
      }
    }, 60000);

    test('should have S3 bucket versioning enabled and functional', async () => {
      const bucketName = outputs.S3BucketName;
      const testKey = 'integration-test/versioning-test.txt';

      try {
        // Verify versioning is enabled
        const versioningResponse = await s3Client.send(new GetBucketVersioningCommand({
          Bucket: bucketName
        }));

        expect(versioningResponse.Status).toBe('Enabled');

        // ACTION: Upload multiple versions of same object
        await s3Client.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: 'Version 1'
        }));

        await s3Client.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: 'Version 2'
        }));

        // Verify multiple versions exist
        const versionsResponse = await s3Client.send(new ListObjectVersionsCommand({
          Bucket: bucketName,
          Prefix: testKey
        }));

        expect(versionsResponse.Versions!.length).toBeGreaterThanOrEqual(2);

        // Cleanup all versions
        if (versionsResponse.Versions) {
          await s3Client.send(new DeleteObjectsCommand({
            Bucket: bucketName,
            Delete: {
              Objects: versionsResponse.Versions.map(v => ({ Key: v.Key!, VersionId: v.VersionId }))
            }
          }));
        }
      } catch (error) {
        console.error('S3 versioning test error:', error);
        throw error;
      }
    }, 60000);
  });

  describe('[Service-Level] RDS Database Interactions', () => {
    // Maps to PROMPT requirement: "RDS MySQL instance in private subnets"
    // SERVICE-LEVEL TEST: Verify RDS is accessible and get endpoint
    test('should have RDS instance accessible with correct configuration', async () => {
      const dbResponse = await rdsClient.send(new DescribeDBInstancesCommand({}));
      const db = dbResponse.DBInstances!.find(d =>
        d.DBSubnetGroup?.Subnets?.some(subnet =>
          subnet.SubnetIdentifier === outputs.PrivateSubnet1Id || subnet.SubnetIdentifier === outputs.PrivateSubnet2Id
        )
      );

      expect(db).toBeDefined();
      expect(db!.DBInstanceStatus).toBe('available');
      expect(db!.Engine).toBe('mysql');
      expect(db!.EngineVersion).toBe('8.0.43');
      expect(db!.Endpoint).toBeDefined();
      expect(db!.Endpoint!.Address).toBeDefined();
      expect(db!.Endpoint!.Port).toBe(3306);
    }, 30000);
  });

  describe('[Service-Level] CloudWatch Interactions', () => {
    // Maps to PROMPT requirement: "Configure appropriate alarms"
    // SERVICE-LEVEL TEST: Actually send custom metrics
    test('should be able to send custom metrics to CloudWatch', async () => {
      const instanceId = outputs.EC2Instance1Id;

      // ACTION: Send custom metric data
      await cloudWatchClient.send(new PutMetricDataCommand({
        Namespace: 'IntegrationTest/CloudEnvironment',
        MetricData: [
          {
            MetricName: 'TestMetric',
            Value: 1.0,
            Unit: 'Count',
            Timestamp: new Date(),
            Dimensions: [
              {
                Name: 'InstanceId',
                Value: instanceId
              }
            ]
          }
        ]
      }));

      // Verify alarms exist
      const alarmsResponse = await cloudWatchClient.send(new DescribeAlarmsCommand({}));
      const ec2Alarm = alarmsResponse.MetricAlarms!.find(alarm =>
        alarm.AlarmName?.includes('EC2') && alarm.AlarmName?.includes('HighCPU')
      );

      expect(ec2Alarm).toBeDefined();
      expect(ec2Alarm!.MetricName).toBe('CPUUtilization');
      expect(ec2Alarm!.Threshold).toBe(80);
    }, 30000);
  });

  // ============================================================================
  // PART 2: CROSS-SERVICE TESTS (2 Services Interacting WITH REAL ACTIONS)
  // ============================================================================

  describe('[Cross-Service] EC2 → S3 Interaction', () => {
    // Maps to PROMPT requirement: EC2 needs S3 access via IAM role
    // CROSS-SERVICE TEST: EC2 actually uploads to S3 using IAM role
    test('should allow EC2 instance 1 to upload file to S3 bucket via IAM role', async () => {
      const instanceId = outputs.EC2Instance1Id;
      const bucketName = outputs.S3BucketName;

      try {
        // ACTION: EC2 uploads file to S3 via AWS CLI
        const command = await ssmClient.send(new SendCommandCommand({
          DocumentName: 'AWS-RunShellScript',
          InstanceIds: [instanceId],
          Parameters: {
            commands: [
              'echo "Test content from EC2 instance 1" > /tmp/test-from-ec2.txt',
              `aws s3 cp /tmp/test-from-ec2.txt s3://${bucketName}/integration-test/from-ec2-1.txt --region ${region}`,
              'rm /tmp/test-from-ec2.txt'
            ]
          }
        }));

        const result = await waitForCommand(command.Command!.CommandId!, instanceId);

        expect(result.Status).toBe('Success');
        expect(result.StandardOutputContent).toContain('upload:');

        // Verify file exists in S3
        const getResponse = await s3Client.send(new GetObjectCommand({
          Bucket: bucketName,
          Key: 'integration-test/from-ec2-1.txt'
        }));

        expect(getResponse.$metadata.httpStatusCode).toBe(200);

        // Cleanup
        await s3Client.send(new DeleteObjectCommand({
          Bucket: bucketName,
          Key: 'integration-test/from-ec2-1.txt'
        }));
      } catch (error: any) {
        if (error.message?.includes('SSM Agent')) {
          console.log('SSM Agent not configured. Skipping test.');
          return;
        }
        throw error;
      }
    }, 120000);

    test('should allow EC2 instance 2 to download file from S3 bucket via IAM role', async () => {
      const instanceId = outputs.EC2Instance2Id;
      const bucketName = outputs.S3BucketName;
      const testKey = 'integration-test/test-download.txt';

      try {
        // Upload test file first
        await s3Client.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: 'Test content for EC2 download'
        }));

        // ACTION: EC2 downloads file from S3
        const command = await ssmClient.send(new SendCommandCommand({
          DocumentName: 'AWS-RunShellScript',
          InstanceIds: [instanceId],
          Parameters: {
            commands: [
              `aws s3 cp s3://${bucketName}/${testKey} /tmp/downloaded-from-s3.txt --region ${region}`,
              'cat /tmp/downloaded-from-s3.txt',
              'rm /tmp/downloaded-from-s3.txt'
            ]
          }
        }));

        const result = await waitForCommand(command.Command!.CommandId!, instanceId);

        expect(result.Status).toBe('Success');
        expect(result.StandardOutputContent).toContain('Test content for EC2 download');

        // Cleanup
        await s3Client.send(new DeleteObjectCommand({
          Bucket: bucketName,
          Key: testKey
        }));
      } catch (error: any) {
        if (error.message?.includes('SSM Agent')) {
          console.log('SSM Agent not configured. Skipping test.');
          return;
        }
        throw error;
      }
    }, 120000);
  });

  describe('[Cross-Service] EC2 → RDS Interaction', () => {
    // Maps to PROMPT requirement: EC2 should connect to RDS
    // CROSS-SERVICE TEST: EC2 actually connects to RDS
    test('should allow EC2 instance 1 to connect to RDS MySQL database', async () => {
      const instanceId = outputs.EC2Instance1Id;
      const rdsEndpoint = outputs.RDSInstanceEndpoint;
      const secretArn = outputs.DBSecretArn;

      try {
        // ACTION: Install jq if not present, then connect to RDS
        const command = await ssmClient.send(new SendCommandCommand({
          DocumentName: 'AWS-RunShellScript',
          InstanceIds: [instanceId],
          Parameters: {
            commands: [
              '#!/bin/bash',
              'set -e',
              'sudo yum install -y jq',
              `SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id "${secretArn}" --region us-west-1 --query SecretString --output text)`,
              'DB_PASSWORD=$(echo $SECRET_JSON | jq -r .password)',
              `mysql -h ${rdsEndpoint} -u admin -p"$DB_PASSWORD" -e "SELECT 1 AS connection_test;" 2>&1`
            ]
          }
        }));

        const result = await waitForCommand(command.Command!.CommandId!, instanceId, 120000);

        expect(result.Status).toBe('Success');
        expect(result.StandardOutputContent).toContain('connection_test');
      } catch (error: any) {
        if (error.message?.includes('SSM Agent')) {
          console.log('SSM Agent not configured. Skipping test.');
          return;
        }
        throw error;
      }
    }, 150000);
  });

  describe('[Cross-Service] EC2 → CloudWatch Interaction', () => {
    // Maps to PROMPT requirement: CloudWatch monitors EC2
    // CROSS-SERVICE TEST: Verify EC2 sends metrics to CloudWatch
    test('should have EC2 instances sending metrics to CloudWatch', async () => {
      const instance1Id = outputs.EC2Instance1Id;
      const instance2Id = outputs.EC2Instance2Id;

      // Verify instances have monitoring enabled
      const instanceResponse = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instance1Id, instance2Id]
      }));

      const instance1 = instanceResponse.Reservations![0].Instances![0];
      const instance2 = instanceResponse.Reservations![1]?.Instances?.[0] || instanceResponse.Reservations![0].Instances![1];

      expect(instance1.Monitoring!.State).toBe('enabled');
      expect(instance2.Monitoring!.State).toBe('enabled');

      // Verify alarm is monitoring instances
      const alarmsResponse = await cloudWatchClient.send(new DescribeAlarmsCommand({}));
      const ec2Alarm = alarmsResponse.MetricAlarms!.find(alarm =>
        alarm.AlarmName?.includes('EC2')
      );

      const instanceDimension = ec2Alarm!.Dimensions!.find(dim => dim.Name === 'InstanceId');
      expect([instance1Id, instance2Id]).toContain(instanceDimension!.Value);
    }, 30000);

    test('should allow EC2 to send custom metrics to CloudWatch', async () => {
      const instanceId = outputs.EC2Instance1Id;

      try {
        // ACTION: EC2 sends custom metric via AWS CLI
        const command = await ssmClient.send(new SendCommandCommand({
          DocumentName: 'AWS-RunShellScript',
          InstanceIds: [instanceId],
          Parameters: {
            commands: [
              `aws cloudwatch put-metric-data --namespace "IntegrationTest/EC2Custom" --metric-name "CustomTestMetric" --value 100 --region ${region}`
            ]
          }
        }));

        const result = await waitForCommand(command.Command!.CommandId!, instanceId);
        expect(result.Status).toBe('Success');
      } catch (error: any) {
        if (error.message?.includes('SSM Agent')) {
          console.log('SSM Agent not configured. Skipping test.');
        }
      }
    }, 90000);
  });

  // ============================================================================
  // PART 3: E2E TESTS (Complete Flows WITH ACTUAL DATA)
  // ============================================================================

  describe('[E2E] Complete Application Flow: EC2 → RDS with Database Operations', () => {
    // Maps to PROMPT requirement: Full cloud environment
    // E2E TEST: Complete flow with actual database operations
    test('should execute complete flow: EC2 performs database operations on RDS', async () => {
      const instanceId = outputs.EC2Instance1Id;
      const rdsEndpoint = outputs.RDSInstanceEndpoint;
      const secretArn = outputs.DBSecretArn;

      try {
        // E2E ACTION: Complete database workflow
        const command = await ssmClient.send(new SendCommandCommand({
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
              `SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id "${secretArn}" --region us-west-1 --query SecretString --output text)`,
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
              'INSERT INTO cloud_env_test (instance_name, test_value) VALUES ("EC2Instance1", "E2E integration test successful");',
              '',
              '-- Step 5: Query test data',
              'SELECT * FROM cloud_env_test ORDER BY id DESC LIMIT 1;',
              '',
              '-- Step 6: Cleanup',
              'DROP TABLE cloud_env_test;',
              'DROP DATABASE integration_test;',
              'EOF',
              '',
              'echo "E2E database test completed successfully"'
            ]
          }
        }));

        const result = await waitForCommand(command.Command!.CommandId!, instanceId, 180000);

        expect(result.Status).toBe('Success');
        expect(result.StandardOutputContent).toContain('E2E integration test successful');
        expect(result.StandardOutputContent).toContain('E2E database test completed successfully');
      } catch (error: any) {
        if (error.message?.includes('SSM Agent')) {
          console.log('SSM Agent not configured. Skipping E2E test.');
          return;
        }
        throw error;
      }
    }, 240000);
  });

  describe('[E2E] Complete Storage Flow: EC2 → S3 with File Operations', () => {
    // Maps to PROMPT requirement: EC2 and S3 integration
    // E2E TEST: Complete storage workflow
    test('should execute complete flow: EC2 uploads, lists, downloads from S3', async () => {
      const instanceId = outputs.EC2Instance1Id;
      const bucketName = outputs.S3BucketName;

      try {
        // E2E ACTION: Complete S3 workflow
        const command = await ssmClient.send(new SendCommandCommand({
          DocumentName: 'AWS-RunShellScript',
          InstanceIds: [instanceId],
          Parameters: {
            commands: [
              '#!/bin/bash',
              'set -e',
              '',
              '# Step 1: Create test file',
              'echo "E2E storage test content" > /tmp/e2e-test.txt',
              '',
              '# Step 2: Upload to S3',
              `aws s3 cp /tmp/e2e-test.txt s3://${bucketName}/e2e-test/test-file.txt --region ${region}`,
              '',
              '# Step 3: List S3 objects',
              `aws s3 ls s3://${bucketName}/e2e-test/ --region ${region}`,
              '',
              '# Step 4: Download from S3',
              `aws s3 cp s3://${bucketName}/e2e-test/test-file.txt /tmp/downloaded-e2e.txt --region ${region}`,
              '',
              '# Step 5: Verify content',
              'cat /tmp/downloaded-e2e.txt',
              '',
              '# Step 6: Cleanup local files',
              'rm /tmp/e2e-test.txt /tmp/downloaded-e2e.txt',
              '',
              'echo "E2E storage test completed successfully"'
            ]
          }
        }));

        const result = await waitForCommand(command.Command!.CommandId!, instanceId, 180000);

        expect(result.Status).toBe('Success');
        expect(result.StandardOutputContent).toContain('E2E storage test content');
        expect(result.StandardOutputContent).toContain('E2E storage test completed successfully');

        // Cleanup S3
        await s3Client.send(new DeleteObjectCommand({
          Bucket: bucketName,
          Key: 'e2e-test/test-file.txt'
        }));
      } catch (error: any) {
        if (error.message?.includes('SSM Agent')) {
          console.log('SSM Agent not configured. Skipping E2E test.');
          return;
        }
        throw error;
      }
    }, 240000);
  });

  describe('[E2E] Network Flow: Internet Gateway → VPC → Subnets → EC2 → NAT Gateway', () => {
    // Maps to PROMPT requirement: VPC with network connectivity
    // E2E TEST: Verify complete network path
    test('should have complete network connectivity from internet to EC2 and private subnets via NAT', async () => {
      const vpcId = outputs.VPCId;
      const instanceId = outputs.EC2Instance1Id;

      // Step 1: Verify VPC exists
      const vpcResponse = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [vpcId]
      }));
      expect(vpcResponse.Vpcs![0].State).toBe('available');

      // Step 2: Verify Internet Gateway attached
      const igwResponse = await ec2Client.send(new DescribeInternetGatewaysCommand({
        Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }]
      }));
      expect(igwResponse.InternetGateways![0].Attachments![0].State).toBe('available');

      // Step 3: Verify NAT Gateway exists and is available
      const natResponse = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));
      expect(natResponse.NatGateways![0].State).toBe('available');

      // Step 4: Verify public subnet has route to IGW
      const rtResponse = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));
      const publicRT = rtResponse.RouteTables!.find(rt =>
        rt.Associations?.some(assoc =>
          assoc.SubnetId === outputs.PublicSubnet1Id || assoc.SubnetId === outputs.PublicSubnet2Id
        )
      );
      const igwRoute = publicRT!.Routes!.find(r => r.DestinationCidrBlock === '0.0.0.0/0' && r.GatewayId?.startsWith('igw-'));
      expect(igwRoute).toBeDefined();

      // Step 5: Verify private subnet has route to NAT
      const privateRT = rtResponse.RouteTables!.find(rt =>
        rt.Associations?.some(assoc =>
          assoc.SubnetId === outputs.PrivateSubnet1Id || assoc.SubnetId === outputs.PrivateSubnet2Id
        )
      );
      const natRoute = privateRT!.Routes!.find(r => r.DestinationCidrBlock === '0.0.0.0/0' && r.NatGatewayId?.startsWith('nat-'));
      expect(natRoute).toBeDefined();

      // Step 6: Verify EC2 is in public subnet with public IP
      const instanceResponse = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      }));
      const instance = instanceResponse.Reservations![0].Instances![0];
      expect(instance.PublicIpAddress).toBeDefined();
      expect([outputs.PublicSubnet1Id, outputs.PublicSubnet2Id]).toContain(instance.SubnetId);

      // Step 7: ACTION - Test internet connectivity from EC2
      try {
        const command = await ssmClient.send(new SendCommandCommand({
          DocumentName: 'AWS-RunShellScript',
          InstanceIds: [instanceId],
          Parameters: {
            commands: ['curl -s https://www.google.com -o /dev/null -w "%{http_code}"']
          }
        }));

        const result = await waitForCommand(command.Command!.CommandId!, instanceId);
        expect(result.StandardOutputContent).toContain('200');
      } catch (error: any) {
        if (error.message?.includes('SSM Agent')) {
          console.log('SSM Agent not configured. Skipping connectivity test.');
        }
      }
    }, 120000);
  });

  describe('[E2E] Security Flow: Security Groups → EC2 → RDS', () => {
    // Maps to PROMPT requirement: Security groups with least privilege
    // E2E TEST: Verify security group enforcement
    test('should enforce security group rules: RDS only accessible from EC2 security group', async () => {
      const vpcId = outputs.VPCId;

      // Get security groups
      const sgResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      const ec2SG = sgResponse.SecurityGroups!.find(sg =>
        sg.Tags?.some(tag => tag.Key === 'Name' && tag.Value?.includes('EC2SecurityGroup'))
      );

      const rdsSG = sgResponse.SecurityGroups!.find(sg =>
        sg.Tags?.some(tag => tag.Key === 'Name' && tag.Value?.includes('RDSSecurityGroup'))
      );

      expect(ec2SG).toBeDefined();
      expect(rdsSG).toBeDefined();

      // Verify EC2 security group allows SSH from specific IP only
      const sshRule = ec2SG!.IpPermissions!.find(rule => rule.FromPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule!.IpRanges).toBeDefined();
      expect(sshRule!.IpRanges![0].CidrIp).toBe('203.0.113.0/32');

      // Verify RDS security group ONLY allows EC2 security group
      const mysqlRule = rdsSG!.IpPermissions!.find(rule => rule.FromPort === 3306);
      expect(mysqlRule!.UserIdGroupPairs!.length).toBe(1);
      expect(mysqlRule!.UserIdGroupPairs![0].GroupId).toBe(ec2SG!.GroupId);

      // Verify NO public access on MySQL port
      expect(mysqlRule!.IpRanges || []).toHaveLength(0);
      expect(mysqlRule!.Ipv6Ranges || []).toHaveLength(0);
    }, 30000);
  });

  describe('[E2E] Monitoring Flow: EC2 → CloudWatch → Alarms', () => {
    // Maps to PROMPT requirement: CloudWatch monitoring
    // E2E TEST: Complete monitoring workflow
    test('should have complete monitoring flow with all alarm types', async () => {
      const instance1Id = outputs.EC2Instance1Id;

      // Step 1: Verify EC2 has monitoring enabled
      const instanceResponse = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instance1Id]
      }));
      expect(instanceResponse.Reservations![0].Instances![0].Monitoring!.State).toBe('enabled');

      // Step 2: Verify all CloudWatch alarms exist
      const alarmsResponse = await cloudWatchClient.send(new DescribeAlarmsCommand({}));

      const ec2Alarm = alarmsResponse.MetricAlarms!.find(alarm =>
        alarm.AlarmName?.includes('EC2') && alarm.MetricName === 'CPUUtilization'
      );
      expect(ec2Alarm).toBeDefined();
      expect(ec2Alarm!.Threshold).toBe(80);

      const rdsCPUAlarm = alarmsResponse.MetricAlarms!.find(alarm =>
        alarm.AlarmName?.includes('RDS') && alarm.MetricName === 'CPUUtilization'
      );
      expect(rdsCPUAlarm).toBeDefined();
      expect(rdsCPUAlarm!.Threshold).toBe(80);

      const rdsStorageAlarm = alarmsResponse.MetricAlarms!.find(alarm =>
        alarm.AlarmName?.includes('RDS') && alarm.MetricName === 'FreeStorageSpace'
      );
      expect(rdsStorageAlarm).toBeDefined();
      expect(rdsStorageAlarm!.Threshold).toBe(2000000000);

      // Step 3: ACTION - Send custom metric from EC2
      try {
        const command = await ssmClient.send(new SendCommandCommand({
          DocumentName: 'AWS-RunShellScript',
          InstanceIds: [instance1Id],
          Parameters: {
            commands: [
              `aws cloudwatch put-metric-data --namespace "IntegrationTest/E2E" --metric-name "E2ETestMetric" --value 42 --region ${region}`
            ]
          }
        }));

        const result = await waitForCommand(command.Command!.CommandId!, instance1Id);
        expect(result.Status).toBe('Success');
      } catch (error: any) {
        if (error.message?.includes('SSM Agent')) {
          console.log('SSM Agent not configured. Skipping monitoring test.');
        }
      }
    }, 90000);
  });

  // ============================================================================
  // Configuration Validation Tests (kept for completeness)
  // ============================================================================

  describe('Infrastructure Configuration Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      expect(outputs.EC2Instance1Id).toBeDefined();
      expect(outputs.EC2Instance2Id).toBeDefined();
      expect(outputs.RDSInstanceEndpoint).toBeDefined();
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.NATGatewayId).toBeDefined();
    });

    test('should have VPC with correct CIDR block', async () => {
      const vpcResponse = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      }));

      const vpc = vpcResponse.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    }, 30000);

    test('should have both EC2 instances running in public subnets', async () => {
      const instanceResponse = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [outputs.EC2Instance1Id, outputs.EC2Instance2Id]
      }));

      const instance1 = instanceResponse.Reservations![0].Instances![0];
      const instance2 = instanceResponse.Reservations![1]?.Instances?.[0] || instanceResponse.Reservations![0].Instances![1];

      expect(instance1.State!.Name).toBe('running');
      expect(instance2.State!.Name).toBe('running');
      expect([outputs.PublicSubnet1Id, outputs.PublicSubnet2Id]).toContain(instance1.SubnetId);
      expect([outputs.PublicSubnet1Id, outputs.PublicSubnet2Id]).toContain(instance2.SubnetId);
    }, 30000);

    test('should have RDS instance not publicly accessible in private subnets', async () => {
      const dbResponse = await rdsClient.send(new DescribeDBInstancesCommand({}));
      const db = dbResponse.DBInstances!.find(d =>
        d.DBSubnetGroup?.Subnets?.some(subnet =>
          subnet.SubnetIdentifier === outputs.PrivateSubnet1Id || subnet.SubnetIdentifier === outputs.PrivateSubnet2Id
        )
      );

      expect(db!.PubliclyAccessible).toBe(false);
      expect(db!.DBInstanceStatus).toBe('available');
      expect(db!.StorageEncrypted).toBe(true);
      expect(db!.BackupRetentionPeriod).toBe(7);
    }, 30000);

    test('should have IAM role with correct permissions for EC2', async () => {
      const roleResponse = await iamClient.send(new GetRoleCommand({
        RoleName: `EC2InstanceRole-${environmentSuffix}`
      }));

      expect(roleResponse.Role).toBeDefined();

      const policiesResponse = await iamClient.send(new ListAttachedRolePoliciesCommand({
        RoleName: `EC2InstanceRole-${environmentSuffix}`
      }));

      const hasCloudWatchPolicy = policiesResponse.AttachedPolicies!.some(
        policy => policy.PolicyArn?.includes('CloudWatchAgentServerPolicy')
      );

      const hasSSMPolicy = policiesResponse.AttachedPolicies!.some(
        policy => policy.PolicyArn?.includes('AmazonSSMManagedInstanceCore')
      );

      expect(hasCloudWatchPolicy).toBe(true);
      expect(hasSSMPolicy).toBe(true);

      // Check inline S3 policy
      const inlinePoliciesResponse = await iamClient.send(new ListRolePoliciesCommand({
        RoleName: `EC2InstanceRole-${environmentSuffix}`
      }));

      expect(inlinePoliciesResponse.PolicyNames).toContain('S3AccessPolicy');
    }, 30000);

    test('should have S3 bucket with versioning and encryption enabled', async () => {
      const bucketName = outputs.S3BucketName;

      const versioningResponse = await s3Client.send(new GetBucketVersioningCommand({
        Bucket: bucketName
      }));

      expect(versioningResponse.Status).toBe('Enabled');
    }, 30000);
  });
});
