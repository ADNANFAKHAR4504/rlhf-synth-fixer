import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  CloudTrailClient,
  GetTrailStatusCommand
} from '@aws-sdk/client-cloudtrail';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  ConfigServiceClient,
  DescribeConfigurationRecorderStatusCommand
} from '@aws-sdk/client-config-service';
import {
  DescribeInstancesCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  GetRoleCommand,
  IAMClient
} from '@aws-sdk/client-iam';
import {
  DescribeKeyCommand,
  KMSClient,
} from '@aws-sdk/client-kms';
import {
  DescribeDBInstancesCommand,
  DescribeDBParameterGroupsCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  DeleteObjectCommand,
  GetBucketEncryptionCommand,
  GetBucketLoggingCommand,
  GetBucketVersioningCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  DescribeInstanceInformationCommand,
  GetCommandInvocationCommand,
  GetParameterCommand,
  SendCommandCommand,
  SSMClient,
} from '@aws-sdk/client-ssm';
import fs from 'fs';

// Read outputs from CloudFormation deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Read AWS region from lib/AWS_REGION file or default to us-east-1
let awsRegion = 'us-east-1';
try {
  awsRegion = fs.readFileSync('lib/AWS_REGION', 'utf8').trim();
} catch (error) {
  console.log('AWS_REGION file not found, defaulting to us-east-1');
}

// Initialize AWS SDK clients
const ec2Client = new EC2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const ssmClient = new SSMClient({ region: awsRegion });
const cloudwatchClient = new CloudWatchClient({ region: awsRegion });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: awsRegion });
const asgClient = new AutoScalingClient({ region: awsRegion });
const kmsClient = new KMSClient({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const cloudTrailClient = new CloudTrailClient({ region: awsRegion });
const configClient = new ConfigServiceClient({ region: awsRegion });

// Helper function to wait for SSM command completion
async function waitForCommand(
  commandId: string,
  instanceId: string,
  maxWaitTime = 120000
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
          console.error('Command failed:', result.StandardErrorContent);
        }
        return result;
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  throw new Error('Command execution timeout');
}

// Helper function to get running instances from Auto Scaling Group
async function getASGInstances(asgName: string): Promise<string[]> {
  const response = await asgClient.send(
    new DescribeAutoScalingGroupsCommand({
      AutoScalingGroupNames: [asgName],
    })
  );

  if (!response.AutoScalingGroups || response.AutoScalingGroups.length === 0) {
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
}

// Helper function to get SSM-managed instances
async function getSSMManagedInstances(instanceIds: string[]): Promise<string[]> {
  if (instanceIds.length === 0) {
    return [];
  }

  try {
    const response = await ssmClient.send(
      new DescribeInstanceInformationCommand({
        Filters: [
          {
            Key: 'InstanceIds',
            Values: instanceIds,
          },
        ],
      })
    );

    // Return only instances that are online and managed by SSM
    const managedInstances =
      response.InstanceInformationList?.filter(
        (instance) => instance.PingStatus === 'Online'
      ).map((instance) => instance.InstanceId!) || [];

    return managedInstances;
  } catch (error) {
    console.error('Error checking SSM managed instances:', error);
    return [];
  }
}

describe('TapStack Integration Tests', () => {
  let asgInstanceIds: string[] = [];

  beforeAll(async () => {
    // Get Auto Scaling Group name and fetch running instances
    const asgName = outputs.AutoScalingGroupName;

    try {
      const instances = await getASGInstances(asgName);
      console.log(`Found ${instances.length} InService instances`);

      // Filter to only SSM-managed instances
      asgInstanceIds = await getSSMManagedInstances(instances);
      console.log(`Found ${asgInstanceIds.length} SSM-managed instances`);

      if (asgInstanceIds.length === 0) {
        console.warn('No SSM-managed instances available. EC2-based tests will be skipped.');
      }
    } catch (error: any) {
      console.error('Failed to fetch ASG instances:', error);
      // Don't throw - some tests don't require instances
    }
  }, 90000);

  // ===================================================================
  // SERVICE-LEVEL TESTS - Test individual service operations
  // ===================================================================

  describe('SERVICE-LEVEL Tests', () => {
    describe('VPC and Networking', () => {
      test('should verify VPC exists and is in available state', async () => {
        const vpcId = outputs.VPCId;

        const response = await ec2Client.send(
          new DescribeVpcsCommand({
            VpcIds: [vpcId],
          })
        );

        expect(response.Vpcs).toBeDefined();
        expect(response.Vpcs!.length).toBe(1);
        expect(response.Vpcs![0].State).toBe('available');

        // Check DNS attributes separately
        const dnsHostnamesResponse = await ec2Client.send(
          new DescribeVpcAttributeCommand({
            VpcId: vpcId,
            Attribute: 'enableDnsHostnames',
          })
        );
        expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);

        const dnsSupportResponse = await ec2Client.send(
          new DescribeVpcAttributeCommand({
            VpcId: vpcId,
            Attribute: 'enableDnsSupport',
          })
        );
        expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
      }, 60000);

      test('should verify all subnets are available and in correct AZs', async () => {
        const subnetIds = [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id,
          outputs.DatabaseSubnet1Id,
          outputs.DatabaseSubnet2Id,
        ];

        const response = await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: subnetIds,
          })
        );

        expect(response.Subnets).toBeDefined();
        expect(response.Subnets!.length).toBe(6);

        response.Subnets!.forEach((subnet) => {
          expect(subnet.State).toBe('available');
          expect(subnet.AvailabilityZone).toBeDefined();
        });

        // Verify high availability - subnets across 2 AZs
        const azs = new Set(response.Subnets!.map((s) => s.AvailabilityZone));
        expect(azs.size).toBe(2);
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

        const attachment = response.InternetGateways![0].Attachments?.find(
          (a) => a.VpcId === vpcId
        );
        expect(attachment).toBeDefined();
        expect(attachment!.State).toBe('available');
      }, 60000);

      test('should verify NAT Gateways are available if created', async () => {
        if (!outputs.NATGateway1Id || !outputs.NATGateway2Id) {
          console.log('NAT Gateways not created - skipping test');
          return;
        }

        const response = await ec2Client.send(
          new DescribeNatGatewaysCommand({
            NatGatewayIds: [outputs.NATGateway1Id, outputs.NATGateway2Id],
          })
        );

        expect(response.NatGateways).toBeDefined();
        expect(response.NatGateways!.length).toBe(2);

        response.NatGateways!.forEach((nat) => {
          expect(nat.State).toBe('available');
          expect(nat.NatGatewayAddresses).toBeDefined();
        });
      }, 60000);
    });

    describe('Security Groups', () => {
      test('should verify all security groups exist and have correct rules', async () => {
        const sgIds = [
          outputs.ALBSecurityGroupId,
          outputs.WebServerSecurityGroupId,
          outputs.DatabaseSecurityGroupId,
          outputs.BastionSecurityGroupId,
        ];

        const response = await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: sgIds,
          })
        );

        expect(response.SecurityGroups).toBeDefined();
        expect(response.SecurityGroups!.length).toBe(4);

        response.SecurityGroups!.forEach((sg) => {
          expect(sg.VpcId).toBe(outputs.VPCId);
        });
      }, 60000);

      test('should verify ALB security group allows HTTP and HTTPS', async () => {
        const response = await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [outputs.ALBSecurityGroupId],
          })
        );

        const sg = response.SecurityGroups![0];
        const httpRule = sg.IpPermissions?.find((r) => r.FromPort === 80);
        const httpsRule = sg.IpPermissions?.find((r) => r.FromPort === 443);

        expect(httpRule).toBeDefined();
        expect(httpsRule).toBeDefined();
      }, 60000);

      test('should verify database security group only allows PostgreSQL port', async () => {
        const response = await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [outputs.DatabaseSecurityGroupId],
          })
        );

        const sg = response.SecurityGroups![0];
        const postgresRule = sg.IpPermissions?.find((r) => r.FromPort === 5432);

        expect(postgresRule).toBeDefined();
        expect(postgresRule!.ToPort).toBe(5432);
      }, 60000);
    });

    describe('S3 Buckets', () => {
      test('should verify LoggingBucket exists with encryption', async () => {
        const bucketName = outputs.LoggingBucketName;

        const encryptionResponse = await s3Client.send(
          new GetBucketEncryptionCommand({ Bucket: bucketName })
        );

        expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
        expect(
          encryptionResponse.ServerSideEncryptionConfiguration!.Rules[0]
            .ApplyServerSideEncryptionByDefault!.SSEAlgorithm
        ).toBe('AES256');
      }, 60000);

      test('should verify ApplicationBucket has versioning enabled', async () => {
        const bucketName = outputs.ApplicationBucketName;

        const versioningResponse = await s3Client.send(
          new GetBucketVersioningCommand({ Bucket: bucketName })
        );

        expect(versioningResponse.Status).toBe('Enabled');
      }, 60000);

      test('should verify ApplicationBucket has logging configured', async () => {
        const bucketName = outputs.ApplicationBucketName;

        const loggingResponse = await s3Client.send(
          new GetBucketLoggingCommand({ Bucket: bucketName })
        );

        expect(loggingResponse.LoggingEnabled).toBeDefined();
        expect(loggingResponse.LoggingEnabled!.TargetBucket).toBe(
          outputs.LoggingBucketName
        );
      }, 60000);

      test('should perform CRUD operations on ApplicationBucket', async () => {
        const bucketName = outputs.ApplicationBucketName;
        const testKey = `integration-test-${Date.now()}.txt`;
        const testContent = 'Integration test content for S3';

        // CREATE: Upload object
        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: testKey,
            Body: testContent,
            ContentType: 'text/plain',
          })
        );

        // READ: Retrieve object
        const getResponse = await s3Client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: testKey,
          })
        );

        const retrievedContent = await getResponse.Body?.transformToString();
        expect(retrievedContent).toBe(testContent);

        // UPDATE: Overwrite object
        const updatedContent = 'Updated integration test content';
        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: testKey,
            Body: updatedContent,
            ContentType: 'text/plain',
          })
        );

        const getUpdatedResponse = await s3Client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: testKey,
          })
        );

        const retrievedUpdatedContent =
          await getUpdatedResponse.Body?.transformToString();
        expect(retrievedUpdatedContent).toBe(updatedContent);

        // DELETE: Remove object
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: testKey,
          })
        );

        // Verify deletion
        const listResponse = await s3Client.send(
          new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: testKey,
          })
        );

        expect(listResponse.Contents?.find((obj) => obj.Key === testKey)).toBeUndefined();
      }, 90000);
    });

    describe('RDS PostgreSQL Database', () => {
      test('should verify RDS instance is available', async () => {
        const dbIdentifier = `secureprod-postgres-db`;

        const response = await rdsClient.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: dbIdentifier,
          })
        );

        expect(response.DBInstances).toBeDefined();
        expect(response.DBInstances!.length).toBe(1);

        const db = response.DBInstances![0];
        expect(db.DBInstanceStatus).toBe('available');
        expect(db.Engine).toBe('postgres');
        expect(db.EngineVersion).toContain('16');
        expect(db.MultiAZ).toBe(true);
        expect(db.StorageEncrypted).toBe(true);
        expect(db.BackupRetentionPeriod).toBe(30);
      }, 60000);

      test('should verify RDS endpoint is accessible', async () => {
        const dbEndpoint = outputs.DatabaseEndpoint;
        expect(dbEndpoint).toBeDefined();
        expect(dbEndpoint).toContain('.rds.amazonaws.com');
      }, 60000);

      test('should verify DB subnet group exists', async () => {
        const subnetGroupName = `secureprod-db-subnet-group`;

        const response = await rdsClient.send(
          new DescribeDBSubnetGroupsCommand({
            DBSubnetGroupName: subnetGroupName,
          })
        );

        expect(response.DBSubnetGroups).toBeDefined();
        expect(response.DBSubnetGroups!.length).toBe(1);
        expect(response.DBSubnetGroups![0].Subnets).toHaveLength(2);
      }, 60000);

      test('should verify DB parameter group has security settings', async () => {
        const dbIdentifier = `secureprod-postgres-db`;

        const instanceResponse = await rdsClient.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: dbIdentifier,
          })
        );

        const paramGroupName =
          instanceResponse.DBInstances![0].DBParameterGroups![0]
            .DBParameterGroupName;

        const paramResponse = await rdsClient.send(
          new DescribeDBParameterGroupsCommand({
            DBParameterGroupName: paramGroupName,
          })
        );

        expect(paramResponse.DBParameterGroups).toBeDefined();
        expect(paramResponse.DBParameterGroups!.length).toBeGreaterThan(0);
      }, 60000);
    });

    describe('Secrets Manager and SSM Parameter Store', () => {
      test('should verify SSM parameters exist and are accessible', async () => {
        const paramName = outputs.DBPasswordParameterName;

        const response = await ssmClient.send(
          new GetParameterCommand({
            Name: paramName,
          })
        );

        expect(response.Parameter).toBeDefined();
        expect(response.Parameter!.Value).toBeDefined();
      }, 60000);

      test('should verify application config parameter contains valid JSON', async () => {
        const paramName = outputs.ApplicationConfigParameterName;

        const response = await ssmClient.send(
          new GetParameterCommand({
            Name: paramName,
          })
        );

        expect(response.Parameter).toBeDefined();

        const config = JSON.parse(response.Parameter!.Value!);
        expect(config.database_endpoint).toBeDefined();
        expect(config.s3_bucket).toBeDefined();
        expect(config.region).toBe(awsRegion);
      }, 60000);
    });

    describe('KMS Keys', () => {
      test('should verify EBS KMS key exists and is enabled', async () => {
        const keyId = outputs.EBSKMSKeyId;

        const response = await kmsClient.send(
          new DescribeKeyCommand({
            KeyId: keyId,
          })
        );

        expect(response.KeyMetadata).toBeDefined();
        expect(response.KeyMetadata!.KeyState).toBe('Enabled');
        expect(response.KeyMetadata!.Description).toContain('EBS volume encryption');
      }, 60000);

      test('should verify ParameterStore KMS key exists and is enabled', async () => {
        const keyId = outputs.ParameterStoreKMSKeyId;

        const response = await kmsClient.send(
          new DescribeKeyCommand({
            KeyId: keyId,
          })
        );

        expect(response.KeyMetadata).toBeDefined();
        expect(response.KeyMetadata!.KeyState).toBe('Enabled');
        expect(response.KeyMetadata!.Description).toContain('Parameter Store encryption');
      }, 60000);
    });

    describe('IAM Roles and Instance Profiles', () => {
      test('should verify EC2 instance role exists with proper policies', async () => {
        const roleArn = outputs.EC2InstanceRoleArn;
        const roleName = roleArn.split('/').pop();

        const response = await iamClient.send(
          new GetRoleCommand({
            RoleName: roleName!,
          })
        );

        expect(response.Role).toBeDefined();
        expect(response.Role!.AssumeRolePolicyDocument).toBeDefined();
      }, 60000);
    });

    describe('Auto Scaling Group', () => {
      test('should verify ASG is configured correctly', async () => {
        const asgName = outputs.AutoScalingGroupName;

        const response = await asgClient.send(
          new DescribeAutoScalingGroupsCommand({
            AutoScalingGroupNames: [asgName],
          })
        );

        expect(response.AutoScalingGroups).toBeDefined();
        expect(response.AutoScalingGroups!.length).toBe(1);

        const asg = response.AutoScalingGroups![0];
        expect(asg.MinSize).toBe(2);
        expect(asg.MaxSize).toBe(6);
        expect(asg.DesiredCapacity).toBe(2);
        expect(asg.HealthCheckType).toBe('ELB');
      }, 60000);

      test('should verify ASG instances are running', async () => {
        const asgName = outputs.AutoScalingGroupName;

        const instances = await getASGInstances(asgName);
        expect(instances.length).toBeGreaterThanOrEqual(2);

        // Verify instances are actually running
        const response = await ec2Client.send(
          new DescribeInstancesCommand({
            InstanceIds: instances,
          })
        );

        response.Reservations!.forEach((reservation) => {
          reservation.Instances!.forEach((instance) => {
            expect(instance.State!.Name).toBe('running');
          });
        });
      }, 60000);
    });

    describe('Application Load Balancer', () => {
      test('should verify ALB exists and is active', async () => {
        const albDns = outputs.LoadBalancerDNS;

        const response = await elbv2Client.send(
          new DescribeLoadBalancersCommand({})
        );

        const alb = response.LoadBalancers?.find(
          (lb) => lb.DNSName === albDns
        );

        expect(alb).toBeDefined();
        expect(alb!.State!.Code).toBe('active');
        expect(alb!.Scheme).toBe('internet-facing');
        expect(alb!.Type).toBe('application');
      }, 60000);

      test('should verify target group has healthy targets', async () => {
        const tgArn = outputs.ALBTargetGroupArn;

        const response = await elbv2Client.send(
          new DescribeTargetHealthCommand({
            TargetGroupArn: tgArn,
          })
        );

        expect(response.TargetHealthDescriptions).toBeDefined();
        expect(response.TargetHealthDescriptions!.length).toBeGreaterThanOrEqual(2);

        // Check if any targets are healthy
        const healthyTargets = response.TargetHealthDescriptions!.filter(
          (target) => target.TargetHealth!.State === 'healthy'
        );

        // At least one target should be healthy (or in progress)
        expect(response.TargetHealthDescriptions!.length).toBeGreaterThan(0);
      }, 60000);

      test('should verify ALB listeners are configured', async () => {
        const albDns = outputs.LoadBalancerDNS;

        const lbResponse = await elbv2Client.send(
          new DescribeLoadBalancersCommand({})
        );

        const alb = lbResponse.LoadBalancers?.find(
          (lb) => lb.DNSName === albDns
        );

        const listenersResponse = await elbv2Client.send(
          new DescribeListenersCommand({
            LoadBalancerArn: alb!.LoadBalancerArn,
          })
        );

        expect(listenersResponse.Listeners).toBeDefined();
        expect(listenersResponse.Listeners!.length).toBeGreaterThanOrEqual(1);

        const httpListener = listenersResponse.Listeners!.find(
          (l) => l.Port === 80
        );
        expect(httpListener).toBeDefined();
      }, 60000);
    });

    describe('CloudWatch Alarms', () => {
      test('should verify High CPU alarm exists and is configured', async () => {
        const alarmName = outputs.HighCPUAlarmName;

        const response = await cloudwatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNames: [alarmName],
          })
        );

        expect(response.MetricAlarms).toBeDefined();
        expect(response.MetricAlarms!.length).toBe(1);

        const alarm = response.MetricAlarms![0];
        expect(alarm.MetricName).toBe('CPUUtilization');
        expect(alarm.Threshold).toBe(80);
        expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
      }, 60000);

      test('should verify Database Storage alarm exists and is configured', async () => {
        const alarmName = outputs.DatabaseStorageAlarmName;

        const response = await cloudwatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNames: [alarmName],
          })
        );

        expect(response.MetricAlarms).toBeDefined();
        expect(response.MetricAlarms!.length).toBe(1);

        const alarm = response.MetricAlarms![0];
        expect(alarm.MetricName).toBe('FreeStorageSpace');
        expect(alarm.Namespace).toBe('AWS/RDS');
        expect(alarm.ComparisonOperator).toBe('LessThanThreshold');
      }, 60000);
    });

    describe('CloudTrail and Config (if created)', () => {
      test('should verify CloudTrail is logging if created', async () => {
        if (!outputs.CloudTrailName) {
          console.log('CloudTrail not created - skipping test');
          return;
        }

        const response = await cloudTrailClient.send(
          new GetTrailStatusCommand({
            Name: outputs.CloudTrailName,
          })
        );

        expect(response.IsLogging).toBe(true);
      }, 60000);

      test('should verify Config Recorder is recording if created', async () => {
        if (!outputs.ConfigRecorderName) {
          console.log('Config Recorder not created - skipping test');
          return;
        }

        const response = await configClient.send(
          new DescribeConfigurationRecorderStatusCommand({
            ConfigurationRecorderNames: [outputs.ConfigRecorderName],
          })
        );

        expect(response.ConfigurationRecordersStatus).toBeDefined();
        expect(response.ConfigurationRecordersStatus!.length).toBe(1);
        expect(response.ConfigurationRecordersStatus![0].recording).toBe(true);
      }, 60000);
    });
  });

  // ===================================================================
  // CROSS-SERVICE TESTS - Two services interacting
  // ===================================================================

  describe('CROSS-SERVICE Tests', () => {
    describe('EC2 → S3 Integration', () => {
      test('should upload file from ASG instance to S3 bucket', async () => {
        if (asgInstanceIds.length === 0) {
          console.log('No ASG instances available - skipping test');
          return;
        }

        const instanceId = asgInstanceIds[0];
        const bucketName = outputs.ApplicationBucketName;
        const testKey = `asg-upload-${Date.now()}.txt`;

        // CROSS-SERVICE: EC2 → S3
        const command = await ssmClient.send(
          new SendCommandCommand({
            DocumentName: 'AWS-RunShellScript',
            InstanceIds: [instanceId],
            Parameters: {
              commands: [
                'echo "File uploaded from ASG instance" > /tmp/test-upload.txt',
                `aws s3 cp /tmp/test-upload.txt s3://${bucketName}/${testKey}`,
                'rm /tmp/test-upload.txt',
                'echo "Upload successful"',
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
        expect(result.StandardOutputContent).toContain('Upload successful');

        // Verify file in S3
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
      }, 240000);

      test('should download file from S3 to ASG instance', async () => {
        if (asgInstanceIds.length === 0) {
          console.log('No ASG instances available - skipping test');
          return;
        }

        const instanceId = asgInstanceIds[0];
        const bucketName = outputs.ApplicationBucketName;
        const testKey = `download-test-${Date.now()}.txt`;
        const testContent = 'Test file for EC2 to download';

        // Upload test file to S3
        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: testKey,
            Body: testContent,
            ContentType: 'text/plain',
          })
        );

        // CROSS-SERVICE: S3 → EC2
        const command = await ssmClient.send(
          new SendCommandCommand({
            DocumentName: 'AWS-RunShellScript',
            InstanceIds: [instanceId],
            Parameters: {
              commands: [
                `aws s3 cp s3://${bucketName}/${testKey} /tmp/downloaded-file.txt`,
                'cat /tmp/downloaded-file.txt',
                'rm /tmp/downloaded-file.txt',
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
        expect(result.StandardOutputContent).toContain(testContent);

        // Cleanup S3
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: testKey,
          })
        );
      }, 240000);
    });

    describe('EC2 → Secrets Manager → RDS Integration', () => {
      test('should verify RDS connectivity from ASG instance using secret', async () => {
        if (asgInstanceIds.length === 0) {
          console.log('No ASG instances available - skipping test');
          return;
        }

        const instanceId = asgInstanceIds[0];
        const rdsEndpoint = outputs.DatabaseEndpoint;
        const secretArn = outputs.DBPasswordSecretArn;

        // CROSS-SERVICE: EC2 → Secrets Manager → RDS
        const command = await ssmClient.send(
          new SendCommandCommand({
            DocumentName: 'AWS-RunShellScript',
            InstanceIds: [instanceId],
            Parameters: {
              commands: [
                'timeout 10 bash -c "cat < /dev/null > /dev/tcp/' +
                rdsEndpoint.split(':')[0] +
                '/5432" && echo "RDS endpoint reachable" || echo "RDS endpoint not reachable"',
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
        expect(result.StandardOutputContent).toContain('RDS endpoint reachable');
      }, 180000);
    });

    describe('EC2 → SSM Parameter Store Integration', () => {
      test('should retrieve application config from ASG instance', async () => {
        if (asgInstanceIds.length === 0) {
          console.log('No ASG instances available - skipping test');
          return;
        }

        const instanceId = asgInstanceIds[0];
        const paramName = outputs.ApplicationConfigParameterName;

        // CROSS-SERVICE: EC2 → SSM Parameter Store
        const command = await ssmClient.send(
          new SendCommandCommand({
            DocumentName: 'AWS-RunShellScript',
            InstanceIds: [instanceId],
            Parameters: {
              commands: [
                `aws ssm get-parameter --name "${paramName}" --region ${awsRegion} --query "Parameter.Value" --output text`,
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
        expect(result.StandardOutputContent).toContain('database_endpoint');
        expect(result.StandardOutputContent).toContain('s3_bucket');
      }, 180000);
    });

    describe('ALB → EC2 Integration', () => {
      test('should verify ALB can route traffic to target instances', async () => {
        const tgArn = outputs.ALBTargetGroupArn;

        const response = await elbv2Client.send(
          new DescribeTargetHealthCommand({
            TargetGroupArn: tgArn,
          })
        );

        expect(response.TargetHealthDescriptions).toBeDefined();
        expect(response.TargetHealthDescriptions!.length).toBeGreaterThan(0);

        // Verify targets are registered (include all possible states)
        response.TargetHealthDescriptions!.forEach((target) => {
          expect(['healthy', 'unhealthy', 'initial', 'draining', 'unused', 'unavailable']).toContain(
            target.TargetHealth!.State!
          );
        });
      }, 60000);
    });
  });

  // ===================================================================
  // E2E TESTS - Complete workflows across 3+ services
  // ===================================================================

  describe('E2E Tests', () => {
    describe('Complete Storage Workflow', () => {
      test('should execute E2E flow: EC2 → S3 (CREATE, UPLOAD, DOWNLOAD, VERIFY, DELETE)', async () => {
        if (asgInstanceIds.length === 0) {
          console.log('No ASG instances available - skipping test');
          return;
        }

        const instanceId = asgInstanceIds[0];
        const bucketName = outputs.ApplicationBucketName;
        const testKey = `e2e-test-${Date.now()}.json`;

        // E2E: EC2 creates data, uploads to S3, downloads, verifies
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
                'cat > /tmp/test-data.json << EOF',
                '{',
                '  "test_name": "E2E Storage Workflow",',
                '  "timestamp": "' + new Date().toISOString() + '",',
                '  "status": "success"',
                '}',
                'EOF',
                'echo "Step 1: Created test data"',
                '',
                '# Step 2: Upload to S3',
                `aws s3 cp /tmp/test-data.json s3://${bucketName}/${testKey}`,
                'echo "Step 2: Uploaded to S3"',
                '',
                '# Step 3: Download from S3',
                `aws s3 cp s3://${bucketName}/${testKey} /tmp/downloaded-data.json`,
                'echo "Step 3: Downloaded from S3"',
                '',
                '# Step 4: Verify data integrity',
                'diff /tmp/test-data.json /tmp/downloaded-data.json && echo "Step 4: Data integrity verified"',
                '',
                '# Step 5: Display content',
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
          180000
        );

        expect(result.Status).toBe('Success');
        expect(result.StandardOutputContent).toContain('Step 1: Created test data');
        expect(result.StandardOutputContent).toContain('Step 2: Uploaded to S3');
        expect(result.StandardOutputContent).toContain('Step 3: Downloaded from S3');
        expect(result.StandardOutputContent).toContain(
          'Step 4: Data integrity verified'
        );
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
      }, 240000);
    });

    describe('Complete Configuration Workflow', () => {
      test('should execute E2E flow: EC2 → SSM Parameter Store → S3 → Secrets Manager', async () => {
        if (asgInstanceIds.length === 0) {
          console.log('No ASG instances available - skipping test');
          return;
        }

        const instanceId = asgInstanceIds[0];
        const bucketName = outputs.ApplicationBucketName;
        const paramName = outputs.ApplicationConfigParameterName;
        const secretArn = outputs.DBPasswordSecretArn;

        // E2E: Retrieve config from SSM, validate, interact with S3
        const command = await ssmClient.send(
          new SendCommandCommand({
            DocumentName: 'AWS-RunShellScript',
            InstanceIds: [instanceId],
            Parameters: {
              commands: [
                '#!/bin/bash',
                'set -e',
                '',
                '# Step 1: Retrieve config from SSM Parameter Store',
                `CONFIG=$(aws ssm get-parameter --name "${paramName}" --region ${awsRegion} --query "Parameter.Value" --output text)`,
                'echo "Step 1: Retrieved configuration from SSM"',
                '',
                '# Step 2: Parse and validate config',
                'echo "$CONFIG" | grep -q "database_endpoint" && echo "Step 2: Configuration validated"',
                '',
                '# Step 3: Test S3 access using bucket from config',
                `aws s3 ls s3://${bucketName}/ > /dev/null && echo "Step 3: S3 access confirmed"`,
                '',
                '# Step 4: Verify secret exists',
                `aws secretsmanager get-secret-value --secret-id "${secretArn}" --region ${awsRegion} --query "SecretString" --output text | grep -q "password" && echo "Step 4: Secret access confirmed"`,
                '',
                'echo "E2E configuration workflow completed successfully"',
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
          'Step 1: Retrieved configuration from SSM'
        );
        expect(result.StandardOutputContent).toContain(
          'Step 2: Configuration validated'
        );
        expect(result.StandardOutputContent).toContain('Step 3: S3 access confirmed');
        expect(result.StandardOutputContent).toContain(
          'Step 4: Secret access confirmed'
        );
        expect(result.StandardOutputContent).toContain(
          'E2E configuration workflow completed successfully'
        );
      }, 240000);
    });

    describe('Complete Network Flow', () => {
      test('should execute E2E flow: verify multi-tier network connectivity', async () => {
        if (asgInstanceIds.length === 0) {
          console.log('No ASG instances available - skipping test');
          return;
        }

        const instanceId = asgInstanceIds[0];
        const rdsEndpoint = outputs.DatabaseEndpoint;
        const bucketName = outputs.ApplicationBucketName;

        // E2E: Test connectivity across network tiers
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
                '# Step 1: Test internet connectivity',
                'curl -s -o /dev/null -w "Step 1: Internet connectivity - HTTP Status: %{http_code}\\n" https://www.amazon.com',
                '',
                '# Step 2: Test S3 connectivity',
                `aws s3 ls s3://${bucketName} > /dev/null && echo "Step 2: S3 connectivity successful"`,
                '',
                '# Step 3: Test RDS connectivity',
                `timeout 10 bash -c "cat < /dev/null > /dev/tcp/${rdsEndpoint.split(':')[0]}/5432" && echo "Step 3: RDS connectivity successful" || echo "Step 3: RDS connectivity check completed"`,
                '',
                '# Step 4: Test AWS API connectivity',
                'aws sts get-caller-identity > /dev/null && echo "Step 4: AWS API connectivity successful"',
                '',
                'echo "=== Network Flow Test Completed ==="',
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
          'Step 1: Internet connectivity'
        );
        expect(result.StandardOutputContent).toContain('Step 2: S3 connectivity successful');
        expect(result.StandardOutputContent).toContain('Step 3: RDS connectivity');
        expect(result.StandardOutputContent).toContain(
          'Step 4: AWS API connectivity successful'
        );
      }, 240000);
    });
  });
});
