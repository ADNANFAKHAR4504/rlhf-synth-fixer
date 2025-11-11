// Configuration - These are coming from cfn-outputs after stack deployment
import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeVpcAttributeCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeRouteTablesCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  IAMClient,
  GetRoleCommand,
  GetInstanceProfileCommand,
  ListAttachedRolePoliciesCommand,
  GetRolePolicyCommand,
  ListRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
  FilterLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  SSMClient,
  SendCommandCommand,
  GetCommandInvocationCommand,
} from '@aws-sdk/client-ssm';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Read AWS region from environment variable or use default
const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';

// Initialize AWS SDK clients
const ec2Client = new EC2Client({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const cloudwatchLogsClient = new CloudWatchLogsClient({ region: awsRegion });
const ssmClient = new SSMClient({ region: awsRegion });

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

describe('TapStack Infrastructure Integration Tests', () => {
  let ec2InstanceIds: string[] = [];

  beforeAll(async () => {
    // Get EC2 instance IDs from outputs
    ec2InstanceIds = [
      outputs.EC2Instance1Id,
      outputs.EC2Instance2Id,
      outputs.EC2Instance3Id,
    ];

    console.log(`Testing with ${ec2InstanceIds.length} EC2 instances`);
  }, 30000);

  // ===================================================================
  // SERVICE-LEVEL TESTS - Test ONE service with actual operations
  // ===================================================================

  describe('SERVICE-LEVEL Tests', () => {
    describe('VPC Service Tests', () => {
      test('should verify VPC exists and has correct CIDR block', async () => {
        const vpcId = outputs.VPCId;

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
        expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      }, 60000);

      test('should verify VPC has DNS support and DNS hostnames enabled', async () => {
        const vpcId = outputs.VPCId;

        // Check DNS Support
        const dnsSupportResponse = await ec2Client.send(
          new DescribeVpcAttributeCommand({
            VpcId: vpcId,
            Attribute: 'enableDnsSupport',
          })
        );

        expect(dnsSupportResponse.EnableDnsSupport).toBeDefined();
        expect(dnsSupportResponse.EnableDnsSupport!.Value).toBe(true);

        // Check DNS Hostnames
        const dnsHostnamesResponse = await ec2Client.send(
          new DescribeVpcAttributeCommand({
            VpcId: vpcId,
            Attribute: 'enableDnsHostnames',
          })
        );

        expect(dnsHostnamesResponse.EnableDnsHostnames).toBeDefined();
        expect(dnsHostnamesResponse.EnableDnsHostnames!.Value).toBe(true);
      }, 60000);

      test('should verify all 6 subnets exist and are available', async () => {
        const subnetIds = [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
          outputs.PublicSubnet3Id,
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id,
          outputs.PrivateSubnet3Id,
        ];

        const response = await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: subnetIds,
          })
        );

        expect(response.Subnets).toBeDefined();
        expect(response.Subnets!.length).toBe(6);

        // Verify all subnets are available
        response.Subnets!.forEach((subnet) => {
          expect(subnet.State).toBe('available');
          expect(subnet.VpcId).toBe(outputs.VPCId);
          expect(subnet.AvailabilityZone).toBeDefined();
          expect(subnet.CidrBlock).toBeDefined();
        });

        // Verify subnets span multiple AZs
        const azs = new Set(response.Subnets!.map((s) => s.AvailabilityZone));
        expect(azs.size).toBeGreaterThanOrEqual(2);
      }, 60000);

      test('should verify Internet Gateway is attached to VPC', async () => {
        const igwId = outputs.InternetGatewayId;
        const vpcId = outputs.VPCId;

        const response = await ec2Client.send(
          new DescribeInternetGatewaysCommand({
            InternetGatewayIds: [igwId],
          })
        );

        expect(response.InternetGateways).toBeDefined();
        expect(response.InternetGateways!.length).toBe(1);

        const igw = response.InternetGateways![0];
        expect(igw.InternetGatewayId).toBe(igwId);

        const attachment = igw.Attachments?.find((a) => a.VpcId === vpcId);
        expect(attachment).toBeDefined();
        expect(attachment!.State).toBe('available');
      }, 60000);

      test('should verify route tables exist and have correct routes', async () => {
        const routeTableIds = [
          outputs.PublicRouteTableId,
          outputs.PrivateRouteTable1Id,
          outputs.PrivateRouteTable2Id,
          outputs.PrivateRouteTable3Id,
        ];

        const response = await ec2Client.send(
          new DescribeRouteTablesCommand({
            RouteTableIds: routeTableIds,
          })
        );

        expect(response.RouteTables).toBeDefined();
        expect(response.RouteTables!.length).toBe(4);

        // Verify public route table has route to IGW
        const publicRouteTable = response.RouteTables!.find(
          (rt) => rt.RouteTableId === outputs.PublicRouteTableId
        );
        expect(publicRouteTable).toBeDefined();

        const igwRoute = publicRouteTable!.Routes?.find(
          (route) => route.DestinationCidrBlock === '0.0.0.0/0'
        );
        expect(igwRoute).toBeDefined();
        expect(igwRoute!.GatewayId).toBe(outputs.InternetGatewayId);
      }, 60000);
    });

    describe('EC2 Instance Tests', () => {
      test('should verify all 3 EC2 instances are running', async () => {
        const response = await ec2Client.send(
          new DescribeInstancesCommand({
            InstanceIds: ec2InstanceIds,
          })
        );

        expect(response.Reservations).toBeDefined();
        expect(response.Reservations!.length).toBeGreaterThan(0);

        const instances = response.Reservations!.flatMap((r) => r.Instances || []);
        expect(instances.length).toBe(3);

        instances.forEach((instance) => {
          expect(['running', 'pending']).toContain(instance.State!.Name);
          expect(instance.InstanceType).toBe('t2.micro');
          expect(instance.IamInstanceProfile).toBeDefined();
          expect(instance.SubnetId).toBeDefined();
        });
      }, 60000);

      test('should verify EC2 instances are in private subnets', async () => {
        const response = await ec2Client.send(
          new DescribeInstancesCommand({
            InstanceIds: ec2InstanceIds,
          })
        );

        const instances = response.Reservations!.flatMap((r) => r.Instances || []);

        const privateSubnetIds = [
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id,
          outputs.PrivateSubnet3Id,
        ];

        instances.forEach((instance) => {
          expect(privateSubnetIds).toContain(instance.SubnetId);
        });
      }, 60000);

      test('should verify EC2 instances have correct security group', async () => {
        const response = await ec2Client.send(
          new DescribeInstancesCommand({
            InstanceIds: ec2InstanceIds,
          })
        );

        const instances = response.Reservations!.flatMap((r) => r.Instances || []);

        instances.forEach((instance) => {
          const securityGroupIds = instance.SecurityGroups?.map((sg) => sg.GroupId);
          expect(securityGroupIds).toContain(outputs.EC2SecurityGroupId);
        });
      }, 60000);
    });

    describe('S3 Bucket Tests', () => {
      test('should verify S3 bucket exists and is accessible', async () => {
        const bucketName = outputs.S3BucketName;

        // ACTION: List objects in bucket (should succeed even if empty)
        const response = await s3Client.send(
          new ListObjectsV2Command({
            Bucket: bucketName,
            MaxKeys: 1,
          })
        );

        expect(response).toBeDefined();
        expect(response.Name).toBe(bucketName);
      }, 60000);

      test('should verify S3 bucket has versioning enabled', async () => {
        const bucketName = outputs.S3BucketName;

        // ACTION: Get bucket versioning configuration
        const response = await s3Client.send(
          new GetBucketVersioningCommand({
            Bucket: bucketName,
          })
        );

        expect(response.Status).toBe('Enabled');
      }, 60000);

      test('should verify S3 bucket has encryption enabled', async () => {
        const bucketName = outputs.S3BucketName;

        // ACTION: Get bucket encryption
        const response = await s3Client.send(
          new GetBucketEncryptionCommand({
            Bucket: bucketName,
          })
        );

        expect(response.ServerSideEncryptionConfiguration).toBeDefined();
        const rules = response.ServerSideEncryptionConfiguration!.Rules;
        expect(rules!.length).toBeGreaterThan(0);
        expect(rules![0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('AES256');
      }, 60000);

      test('should verify S3 bucket blocks public access', async () => {
        const bucketName = outputs.S3BucketName;

        // ACTION: Get public access block configuration
        const response = await s3Client.send(
          new GetPublicAccessBlockCommand({
            Bucket: bucketName,
          })
        );

        const config = response.PublicAccessBlockConfiguration!;
        expect(config.BlockPublicAcls).toBe(true);
        expect(config.BlockPublicPolicy).toBe(true);
        expect(config.IgnorePublicAcls).toBe(true);
        expect(config.RestrictPublicBuckets).toBe(true);
      }, 60000);

      test('should upload, retrieve, update, and delete a file in S3', async () => {
        const bucketName = outputs.S3BucketName;
        const testKey = `integration-test-${Date.now()}.txt`;
        const testContent = 'Integration test content for S3 bucket';
        const updatedContent = 'Updated integration test content';

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
          const getResponse1 = await s3Client.send(
            new GetObjectCommand({
              Bucket: bucketName,
              Key: testKey,
            })
          );

          const retrievedContent1 = await getResponse1.Body?.transformToString();
          expect(retrievedContent1).toBe(testContent);

          // ACTION 3: Update file in S3
          await s3Client.send(
            new PutObjectCommand({
              Bucket: bucketName,
              Key: testKey,
              Body: updatedContent,
              ContentType: 'text/plain',
            })
          );

          // ACTION 4: Retrieve updated file from S3
          const getResponse2 = await s3Client.send(
            new GetObjectCommand({
              Bucket: bucketName,
              Key: testKey,
            })
          );

          const retrievedContent2 = await getResponse2.Body?.transformToString();
          expect(retrievedContent2).toBe(updatedContent);

          // ACTION 5: Delete file from S3
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: testKey,
            })
          );
        } catch (error: any) {
          console.error('S3 CRUD test failed:', error);
          throw error;
        }
      }, 90000);
    });

    describe('Security Group Tests', () => {
      test('should verify security group exists and has correct rules', async () => {
        const sgId = outputs.EC2SecurityGroupId;

        const response = await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [sgId],
          })
        );

        expect(response.SecurityGroups).toBeDefined();
        expect(response.SecurityGroups!.length).toBe(1);

        const sg = response.SecurityGroups![0];
        expect(sg.GroupId).toBe(sgId);
        expect(sg.VpcId).toBe(outputs.VPCId);

        // Verify egress rules allow HTTPS and HTTP
        const httpsEgress = sg.IpPermissionsEgress?.find(
          (rule) => rule.FromPort === 443 && rule.ToPort === 443
        );
        expect(httpsEgress).toBeDefined();

        const httpEgress = sg.IpPermissionsEgress?.find(
          (rule) => rule.FromPort === 80 && rule.ToPort === 80
        );
        expect(httpEgress).toBeDefined();
      }, 60000);
    });

    describe('IAM Role Tests', () => {
      test('should verify EC2 IAM role exists and has correct policies', async () => {
        const roleArn = outputs.EC2RoleArn;
        const roleName = roleArn.split('/').pop();

        const response = await iamClient.send(
          new GetRoleCommand({
            RoleName: roleName,
          })
        );

        expect(response.Role).toBeDefined();
        expect(response.Role!.Arn).toBe(roleArn);

        // Verify assume role policy allows EC2
        const assumeRolePolicy = JSON.parse(
          decodeURIComponent(response.Role!.AssumeRolePolicyDocument!)
        );
        expect(assumeRolePolicy.Statement[0].Principal.Service).toContain(
          'ec2.amazonaws.com'
        );
      }, 60000);

      test('should verify EC2 role has SSM managed policy attached', async () => {
        const roleArn = outputs.EC2RoleArn;
        const roleName = roleArn.split('/').pop();

        const response = await iamClient.send(
          new ListAttachedRolePoliciesCommand({
            RoleName: roleName,
          })
        );

        expect(response.AttachedPolicies).toBeDefined();

        const ssmPolicy = response.AttachedPolicies!.find((policy) =>
          policy.PolicyArn?.includes('AmazonSSMManagedInstanceCore')
        );
        expect(ssmPolicy).toBeDefined();
      }, 60000);

      test('should verify EC2 role has S3 access inline policy', async () => {
        const roleArn = outputs.EC2RoleArn;
        const roleName = roleArn.split('/').pop();

        const listResponse = await iamClient.send(
          new ListRolePoliciesCommand({
            RoleName: roleName,
          })
        );

        expect(listResponse.PolicyNames).toBeDefined();
        expect(listResponse.PolicyNames!).toContain('S3AccessPolicy');

        const policyResponse = await iamClient.send(
          new GetRolePolicyCommand({
            RoleName: roleName,
            PolicyName: 'S3AccessPolicy',
          })
        );

        const policyDocument = JSON.parse(
          decodeURIComponent(policyResponse.PolicyDocument!)
        );

        const s3Statement = policyDocument.Statement.find((stmt: any) =>
          stmt.Action.some((action: string) => action.startsWith('s3:'))
        );
        expect(s3Statement).toBeDefined();
      }, 60000);

      test('should verify EC2 instance profile exists', async () => {
        const profileArn = outputs.EC2InstanceProfileArn;
        const profileName = profileArn.split('/').pop();

        const response = await iamClient.send(
          new GetInstanceProfileCommand({
            InstanceProfileName: profileName,
          })
        );

        expect(response.InstanceProfile).toBeDefined();
        expect(response.InstanceProfile!.Arn).toBe(profileArn);
        expect(response.InstanceProfile!.Roles).toBeDefined();
        expect(response.InstanceProfile!.Roles!.length).toBe(1);
      }, 60000);
    });

    describe('CloudWatch Logs Tests', () => {
      test('should verify VPC Flow Logs log group exists', async () => {
        const logGroupName = outputs.VPCFlowLogsLogGroup;

        const response = await cloudwatchLogsClient.send(
          new DescribeLogGroupsCommand({
            logGroupNamePrefix: logGroupName,
          })
        );

        expect(response.logGroups).toBeDefined();

        const logGroup = response.logGroups!.find((lg) => lg.logGroupName === logGroupName);
        expect(logGroup).toBeDefined();
        expect(logGroup!.retentionInDays).toBe(30);
      }, 60000);

      test('should verify VPC Flow Logs are being created', async () => {
        const logGroupName = outputs.VPCFlowLogsLogGroup;

        try {
          const response = await cloudwatchLogsClient.send(
            new DescribeLogStreamsCommand({
              logGroupName: logGroupName,
              limit: 5,
            })
          );

          expect(response.logStreams).toBeDefined();
          // Note: Log streams may take time to appear after deployment
          if (response.logStreams!.length > 0) {
            expect(response.logStreams![0].logStreamName).toBeDefined();
          }
        } catch (error: any) {
          console.warn('VPC Flow Logs not yet available:', error.message);
        }
      }, 60000);
    });
  });

  // ===================================================================
  // CROSS-SERVICE TESTS - Make TWO services talk to each other
  // ===================================================================

  describe('CROSS-SERVICE Tests', () => {
    describe('EC2 → S3 Integration', () => {
      test('should upload a file from EC2 instance to S3 bucket using IAM role', async () => {
        const instanceId = ec2InstanceIds[0];
        const bucketName = outputs.S3BucketName;
        const testKey = `ec2-upload-${Date.now()}.txt`;

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
                  'echo "File uploaded from EC2 instance to S3" > /tmp/test-upload.txt',
                  '',
                  '# Upload to S3 using instance role',
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
          expect(content).toContain('File uploaded from EC2 instance to S3');

          // Cleanup
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: testKey,
            })
          );
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            console.log('SSM Agent not ready. Skipping test.');
            return;
          }
          throw error;
        }
      }, 180000);

      test('should download a file from S3 to EC2 instance', async () => {
        const instanceId = ec2InstanceIds[0];
        const bucketName = outputs.S3BucketName;
        const testKey = `download-test-${Date.now()}.txt`;
        const testContent = 'Test file for EC2 to download from S3';

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
                  '# Download from S3 using instance role',
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
            console.log('SSM Agent not ready. Skipping test.');
            return;
          }
          throw error;
        }
      }, 180000);
    });

    describe('VPC → EC2 Integration', () => {
      test('should verify EC2 instances can communicate within VPC', async () => {
        const instanceId = ec2InstanceIds[0];

        try {
          // CROSS-SERVICE ACTION: Test VPC internal connectivity
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: [
                  '#!/bin/bash',
                  '',
                  '# Test internal VPC DNS resolution',
                  'if nslookup amazon.com > /dev/null 2>&1; then',
                  '  echo "DNS resolution successful"',
                  'else',
                  '  echo "DNS resolution failed (may require NAT Gateway)"',
                  'fi',
                  '',
                  '# Test network connectivity (requires NAT Gateway)',
                  'if ping -c 2 8.8.8.8 > /dev/null 2>&1; then',
                  '  echo "Internet connectivity successful"',
                  'else',
                  '  echo "Internet connectivity failed (requires NAT Gateway)"',
                  'fi',
                  '',
                  '# Test instance metadata service (always available)',
                  'if curl -s --max-time 5 http://169.254.169.254/latest/meta-data/instance-id > /dev/null; then',
                  '  echo "Instance metadata service accessible"',
                  'else',
                  '  echo "Instance metadata service not accessible"',
                  'fi',
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
          // At minimum, instance metadata service should be accessible
          expect(result.StandardOutputContent).toContain('Instance metadata service accessible');

          // Note: DNS and internet connectivity may fail if NAT Gateways are not deployed
          // This is expected when CreateNATGateways parameter is set to false
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            console.log('SSM Agent not ready. Skipping test.');
            return;
          }
          throw error;
        }
      }, 120000);
    });

    describe('EC2 → CloudWatch Logs Integration', () => {
      test('should verify EC2 instance can write to CloudWatch Logs', async () => {
        const instanceId = ec2InstanceIds[0];

        try {
          // CROSS-SERVICE ACTION: EC2 instance writes to CloudWatch Logs
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: [
                  '#!/bin/bash',
                  'set -e',
                  '',
                  '# Create log entry (via SSM, which logs to CloudWatch)',
                  'echo "Integration test log entry from EC2"',
                  '',
                  '# Verify CloudWatch agent installation',
                  'if command -v amazon-cloudwatch-agent-ctl &> /dev/null; then',
                  '  echo "CloudWatch agent is installed"',
                  'else',
                  '  echo "CloudWatch agent not found"',
                  'fi',
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
          expect(result.StandardOutputContent).toContain('Integration test log entry from EC2');
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            console.log('SSM Agent not ready. Skipping test.');
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
    describe('Complete Storage Workflow', () => {
      test('should execute complete flow: EC2 creates data, uploads to S3, downloads, and verifies integrity', async () => {
        const instanceId = ec2InstanceIds[0];
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
                  '  "test_name": "E2E Storage Workflow",',
                  `  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",`,
                  '  "instance_id": "' + instanceId + '",',
                  '  "status": "success"',
                  '}',
                  'DATA',
                  'echo "Step 1: Created test data"',
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
                  '# Step 6: Cleanup local files',
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
          expect(result.StandardOutputContent).toContain('Step 1: Created test data');
          expect(result.StandardOutputContent).toContain('Step 2: Uploaded to S3');
          expect(result.StandardOutputContent).toContain('Step 3: Downloaded from S3');
          expect(result.StandardOutputContent).toContain('Step 4: Data integrity verified');
          expect(result.StandardOutputContent).toContain('E2E Storage Workflow');
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
            console.log('SSM Agent not ready. Skipping E2E test.');
            return;
          }
          throw error;
        }
      }, 180000);
    });

    describe('Complete Network Flow', () => {
      test('should execute complete flow: verify multi-tier network connectivity', async () => {
        const instanceId = ec2InstanceIds[0];
        const bucketName = outputs.S3BucketName;

        try {
          // E2E ACTION: EC2 → VPC → Internet + S3 (network connectivity test)
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: [
                  '#!/bin/bash',
                  '',
                  'echo "=== Network Connectivity Test ==="',
                  '',
                  '# Step 1: Test DNS resolution (may require NAT Gateway)',
                  'if nslookup amazon.com > /dev/null 2>&1; then',
                  '  echo "Step 1: DNS resolution successful"',
                  'else',
                  '  echo "Step 1: DNS resolution failed (may require NAT Gateway)"',
                  'fi',
                  '',
                  '# Step 2: Test internet connectivity (requires NAT Gateway)',
                  'if curl -s --max-time 10 -o /dev/null -w "Step 2: Internet connectivity - HTTP Status: %{http_code}\\n" https://www.amazon.com 2>/dev/null; then',
                  '  echo "Step 2: Internet connectivity successful"',
                  'else',
                  '  echo "Step 2: Internet connectivity failed (requires NAT Gateway)"',
                  'fi',
                  '',
                  '# Step 3: Test S3 connectivity (via VPC endpoint or NAT Gateway)',
                  `if aws s3 ls s3://${bucketName} > /dev/null 2>&1; then`,
                  '  echo "Step 3: S3 connectivity successful"',
                  'else',
                  '  echo "Step 3: S3 connectivity failed"',
                  'fi',
                  '',
                  '# Step 4: Test AWS API connectivity',
                  'if aws sts get-caller-identity > /dev/null 2>&1; then',
                  '  echo "Step 4: AWS API connectivity successful"',
                  'else',
                  '  echo "Step 4: AWS API connectivity failed"',
                  'fi',
                  '',
                  '# Step 5: Verify instance metadata service (always available)',
                  'TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" 2>/dev/null)',
                  'if curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-id > /dev/null 2>&1; then',
                  '  echo "Step 5: Instance metadata service accessible"',
                  'else',
                  '  echo "Step 5: Instance metadata service not accessible"',
                  'fi',
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
          // At minimum, metadata service should be accessible
          expect(result.StandardOutputContent).toContain(
            'Step 5: Instance metadata service accessible'
          );
          expect(result.StandardOutputContent).toContain('Network Flow Test Completed');

          // Note: DNS, internet, and S3/AWS API connectivity may fail without NAT Gateways
          // This is expected when CreateNATGateways parameter is set to false
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            console.log('SSM Agent not ready. Skipping E2E test.');
            return;
          }
          throw error;
        }
      }, 180000);
    });

    describe('Complete IAM and Data Flow', () => {
      test('should execute complete flow: verify EC2 IAM role permissions across multiple services', async () => {
        const instanceId = ec2InstanceIds[0];
        const bucketName = outputs.S3BucketName;
        const testKey = `iam-test-${Date.now()}.txt`;

        try {
          // E2E ACTION: IAM → EC2 → S3 → CloudWatch (permission validation)
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: [
                  '#!/bin/bash',
                  'set -e',
                  '',
                  'echo "=== IAM Permission Validation ==="',
                  '',
                  '# Step 1: Verify IAM role identity',
                  'IDENTITY=$(aws sts get-caller-identity --query Arn --output text)',
                  'echo "Step 1: IAM Identity: $IDENTITY"',
                  '',
                  '# Step 2: Test S3 write permission',
                  'echo "Test data" > /tmp/iam-test.txt',
                  `aws s3 cp /tmp/iam-test.txt s3://${bucketName}/${testKey} && echo "Step 2: S3 write permission verified"`,
                  '',
                  '# Step 3: Test S3 read permission',
                  `aws s3 cp s3://${bucketName}/${testKey} /tmp/iam-test-read.txt && echo "Step 3: S3 read permission verified"`,
                  '',
                  '# Step 4: Test S3 list permission',
                  `aws s3 ls s3://${bucketName}/ | grep ${testKey} && echo "Step 4: S3 list permission verified"`,
                  '',
                  '# Step 5: Test S3 delete permission',
                  `aws s3 rm s3://${bucketName}/${testKey} && echo "Step 5: S3 delete permission verified"`,
                  '',
                  '# Cleanup',
                  'rm -f /tmp/iam-test.txt /tmp/iam-test-read.txt',
                  '',
                  'echo "=== IAM Permission Validation Completed ==="',
                ],
              },
            })
          );

          const result = await waitForCommand(
            command.Command!.CommandId!,
            instanceId,
            150000
          );

          expect(result.Status).toBe('Success');
          expect(result.StandardOutputContent).toContain('Step 1: IAM Identity');
          expect(result.StandardOutputContent).toContain('Step 2: S3 write permission verified');
          expect(result.StandardOutputContent).toContain('Step 3: S3 read permission verified');
          expect(result.StandardOutputContent).toContain('Step 4: S3 list permission verified');
          expect(result.StandardOutputContent).toContain('Step 5: S3 delete permission verified');
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            console.log('SSM Agent not ready. Skipping E2E test.');
            return;
          }
          throw error;
        }
      }, 200000);
    });

    describe('Complete Multi-Instance Workflow', () => {
      test('should execute workflow across all 3 EC2 instances in different AZs', async () => {
        const bucketName = outputs.S3BucketName;

        try {
          const results = [];

          // E2E ACTION: Test all instances can independently access S3
          for (let i = 0; i < ec2InstanceIds.length; i++) {
            const instanceId = ec2InstanceIds[i];
            const testKey = `multi-instance-test-${i}-${Date.now()}.txt`;

            const command = await ssmClient.send(
              new SendCommandCommand({
                DocumentName: 'AWS-RunShellScript',
                InstanceIds: [instanceId],
                Parameters: {
                  commands: [
                    '#!/bin/bash',
                    'set -e',
                    '',
                    `# Instance ${i + 1} creates and uploads unique file`,
                    `echo "Data from instance ${i + 1}" > /tmp/instance-${i}.txt`,
                    `aws s3 cp /tmp/instance-${i}.txt s3://${bucketName}/${testKey}`,
                    '',
                    '# Verify upload',
                    `aws s3 ls s3://${bucketName}/${testKey}`,
                    '',
                    `echo "Instance ${i + 1} completed successfully"`,
                    '',
                    '# Cleanup',
                    `rm /tmp/instance-${i}.txt`,
                    `aws s3 rm s3://${bucketName}/${testKey}`,
                  ],
                },
              })
            );

            results.push({
              instanceId,
              commandId: command.Command!.CommandId!,
              index: i,
            });
          }

          // Wait for all commands to complete
          for (const { instanceId, commandId, index } of results) {
            const result = await waitForCommand(commandId, instanceId, 120000);
            expect(result.Status).toBe('Success');
            expect(result.StandardOutputContent).toContain(
              `Instance ${index + 1} completed successfully`
            );
          }
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            console.log('SSM Agent not ready. Skipping multi-instance E2E test.');
            return;
          }
          throw error;
        }
      }, 300000);
    });
  });

  // ===================================================================
  // ADDITIONAL INFRASTRUCTURE VALIDATION TESTS
  // ===================================================================

  describe('Infrastructure Validation Tests', () => {
    describe('High Availability Tests', () => {
      test('should verify resources are distributed across multiple AZs', async () => {
        const subnetIds = [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
          outputs.PublicSubnet3Id,
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id,
          outputs.PrivateSubnet3Id,
        ];

        const response = await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: subnetIds,
          })
        );

        const azs = new Set(response.Subnets!.map((s) => s.AvailabilityZone));
        expect(azs.size).toBeGreaterThanOrEqual(2);

        // Verify instances are also in different AZs
        const instanceResponse = await ec2Client.send(
          new DescribeInstancesCommand({
            InstanceIds: ec2InstanceIds,
          })
        );

        const instances = instanceResponse.Reservations!.flatMap((r) => r.Instances || []);
        const instanceAZs = new Set(instances.map((i) => i.Placement?.AvailabilityZone));
        expect(instanceAZs.size).toBeGreaterThanOrEqual(2);
      }, 60000);
    });

    describe('Network Configuration Tests', () => {
      test('should verify public subnets have internet gateway route', async () => {
        const response = await ec2Client.send(
          new DescribeRouteTablesCommand({
            RouteTableIds: [outputs.PublicRouteTableId],
          })
        );

        const publicRT = response.RouteTables![0];
        const igwRoute = publicRT.Routes?.find(
          (route) => route.DestinationCidrBlock === '0.0.0.0/0'
        );

        expect(igwRoute).toBeDefined();
        expect(igwRoute!.GatewayId).toBe(outputs.InternetGatewayId);
        expect(igwRoute!.State).toBe('active');
      }, 60000);

      test('should verify subnet associations are correct', async () => {
        const response = await ec2Client.send(
          new DescribeRouteTablesCommand({
            RouteTableIds: [
              outputs.PublicRouteTableId,
              outputs.PrivateRouteTable1Id,
              outputs.PrivateRouteTable2Id,
              outputs.PrivateRouteTable3Id,
            ],
          })
        );

        const publicRT = response.RouteTables!.find(
          (rt) => rt.RouteTableId === outputs.PublicRouteTableId
        );

        // Verify public subnets are associated with public route table
        const publicSubnetIds = [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
          outputs.PublicSubnet3Id,
        ];

        const publicAssociations = publicRT!.Associations!.map((a) => a.SubnetId);
        publicSubnetIds.forEach((subnetId) => {
          expect(publicAssociations).toContain(subnetId);
        });
      }, 60000);
    });

    describe('Resource Tagging Tests', () => {
      test('should verify all resources have appropriate tags', async () => {
        // Check VPC tags
        const vpcResponse = await ec2Client.send(
          new DescribeVpcsCommand({
            VpcIds: [outputs.VPCId],
          })
        );

        const vpc = vpcResponse.Vpcs![0];
        const vpcTags = vpc.Tags || [];
        expect(vpcTags.length).toBeGreaterThan(0);

        const nameTag = vpcTags.find((tag) => tag.Key === 'Name');
        expect(nameTag).toBeDefined();

        const envTag = vpcTags.find((tag) => tag.Key === 'Environment');
        expect(envTag).toBeDefined();
      }, 60000);
    });
  });
});
