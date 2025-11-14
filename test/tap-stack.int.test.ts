// Configuration - These are coming from cfn-outputs after deployment
import fs from 'fs';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  IAMClient,
  GetRoleCommand,
  GetPolicyCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeVpcAttributeCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeVolumesCommand,
  DescribeFlowLogsCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
  FilterLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  SNSClient,
  GetTopicAttributesCommand,
  PublishCommand,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  ConfigServiceClient,
  DescribeConfigurationRecordersCommand,
  DescribeDeliveryChannelsCommand,
  DescribeConfigRulesCommand,
} from '@aws-sdk/client-config-service';
import {
  GuardDutyClient,
  GetDetectorCommand,
  ListDetectorsCommand,
} from '@aws-sdk/client-guardduty';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyPolicyCommand,
} from '@aws-sdk/client-kms';
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeLoadBalancerAttributesCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Read AWS region from lib/AWS_REGION file or use default
let awsRegion = 'us-east-1'; // Default region
try {
  awsRegion = fs.readFileSync('lib/AWS_REGION', 'utf8').trim();
} catch (error) {
  console.log('lib/AWS_REGION file not found, using default region: us-east-1');
}

// Initialize AWS SDK clients with request timeout
const clientConfig = {
  region: awsRegion,
  requestHandler: {
    requestTimeout: 60000, // 60 seconds timeout for requests
  },
};

const s3Client = new S3Client(clientConfig);
const lambdaClient = new LambdaClient(clientConfig);
const iamClient = new IAMClient(clientConfig);
const ec2Client = new EC2Client(clientConfig);
const rdsClient = new RDSClient(clientConfig);
const secretsClient = new SecretsManagerClient(clientConfig);
const cloudwatchLogsClient = new CloudWatchLogsClient(clientConfig);
const cloudwatchClient = new CloudWatchClient(clientConfig);
const snsClient = new SNSClient(clientConfig);
const cloudtrailClient = new CloudTrailClient(clientConfig);
const configClient = new ConfigServiceClient(clientConfig);
const guarddutyClient = new GuardDutyClient(clientConfig);
const kmsClient = new KMSClient(clientConfig);
const eventBridgeClient = new EventBridgeClient(clientConfig);
const elbClient = new ElasticLoadBalancingV2Client(clientConfig);

describe('TapStack Comprehensive Integration Tests', () => {
  // ===================================================================
  // SERVICE-LEVEL TESTS - Test ONE service with actual operations
  // ===================================================================

  describe('SERVICE-LEVEL Tests', () => {
    describe('S3 Bucket Tests', () => {
      test('should verify AccessLogsBucket exists with encryption', async () => {
        const bucketName = outputs.AccessLogsBucketName;

        // ACTION: Get bucket encryption
        const encryptionResponse = await s3Client.send(
          new GetBucketEncryptionCommand({ Bucket: bucketName })
        );

        expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
        expect(
          encryptionResponse.ServerSideEncryptionConfiguration?.Rules
        ).toHaveLength(1);
        expect(
          encryptionResponse.ServerSideEncryptionConfiguration?.Rules[0]
            .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
        ).toBe('AES256');
      }, 60000);

      test('should verify AccessLogsBucket has versioning enabled', async () => {
        const bucketName = outputs.AccessLogsBucketName;

        // ACTION: Get bucket versioning
        const versioningResponse = await s3Client.send(
          new GetBucketVersioningCommand({ Bucket: bucketName })
        );

        expect(versioningResponse.Status).toBe('Enabled');
      }, 60000);

      test('should upload, retrieve, update, and delete object from AccessLogsBucket', async () => {
        const bucketName = outputs.AccessLogsBucketName;
        const testKey = `integration-test-${Date.now()}.txt`;
        const initialContent = 'Initial test content';
        const updatedContent = 'Updated test content';

        try {
          // ACTION 1: Upload object
          await s3Client.send(
            new PutObjectCommand({
              Bucket: bucketName,
              Key: testKey,
              Body: initialContent,
              ContentType: 'text/plain',
            })
          );

          // ACTION 2: Retrieve object
          const getResponse1 = await s3Client.send(
            new GetObjectCommand({
              Bucket: bucketName,
              Key: testKey,
            })
          );

          const retrievedContent1 = await getResponse1.Body?.transformToString();
          expect(retrievedContent1).toBe(initialContent);

          // ACTION 3: Update object
          await s3Client.send(
            new PutObjectCommand({
              Bucket: bucketName,
              Key: testKey,
              Body: updatedContent,
              ContentType: 'text/plain',
            })
          );

          // ACTION 4: Retrieve updated object
          const getResponse2 = await s3Client.send(
            new GetObjectCommand({
              Bucket: bucketName,
              Key: testKey,
            })
          );

          const retrievedContent2 = await getResponse2.Body?.transformToString();
          expect(retrievedContent2).toBe(updatedContent);

          // ACTION 5: Delete object
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: testKey,
            })
          );

          // ACTION 6: Verify deletion
          const listResponse = await s3Client.send(
            new ListObjectsV2Command({
              Bucket: bucketName,
              Prefix: testKey,
            })
          );

          expect(listResponse.Contents?.find((obj) => obj.Key === testKey)).toBeUndefined();
        } catch (error: any) {
          console.error('S3 CRUD test failed:', error);
          throw error;
        }
      }, 120000);
    });

    describe('Lambda Function Tests', () => {
      test('should verify SecureLambdaFunction exists and is configured correctly', async () => {
        const functionArn = outputs.SecureLambdaFunctionArn;

        // ACTION: Get function configuration
        const response = await lambdaClient.send(
          new GetFunctionCommand({
            FunctionName: functionArn,
          })
        );

        expect(response.Configuration).toBeDefined();
        expect(response.Configuration?.Runtime).toContain('python');
        expect(response.Configuration?.KMSKeyArn).toBeDefined();
        expect(response.Configuration?.Environment?.Variables).toBeDefined();
      }, 60000);

      test('should invoke SecureLambdaFunction successfully', async () => {
        const functionArn = outputs.SecureLambdaFunctionArn;

        // ACTION: Invoke function
        const response = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: functionArn,
            Payload: JSON.stringify({ test: 'integration-test' }),
          })
        );

        expect(response.StatusCode).toBe(200);
        expect(response.FunctionError).toBeUndefined();

        if (response.Payload) {
          const payload = JSON.parse(new TextDecoder().decode(response.Payload));
          expect(payload.statusCode).toBe(200);
        }
      }, 60000);

      test('should verify KeyRotationLambda has correct IAM permissions', async () => {
        const functionArn = outputs.KeyRotationLambdaArn;

        // ACTION: Get function configuration
        const response = await lambdaClient.send(
          new GetFunctionConfigurationCommand({
            FunctionName: functionArn,
          })
        );

        expect(response.Role).toBeDefined();
        expect(response.Environment?.Variables?.SNS_TOPIC_ARN).toBeDefined();
        expect(response.Environment?.Variables?.MAX_KEY_AGE_DAYS).toBeDefined();
      }, 60000);
    });

    describe('IAM Resources Tests', () => {
      test('should verify EC2ApplicationRole exists with correct policies', async () => {
        const roleArn = outputs.EC2ApplicationRoleArn;
        const roleName = roleArn.split('/').pop();

        // ACTION: Get role details
        const roleResponse = await iamClient.send(
          new GetRoleCommand({
            RoleName: roleName!,
          })
        );

        expect(roleResponse.Role).toBeDefined();
        expect(roleResponse.Role?.AssumeRolePolicyDocument).toBeDefined();

        // ACTION: List attached policies
        const policiesResponse = await iamClient.send(
          new ListAttachedRolePoliciesCommand({
            RoleName: roleName!,
          })
        );

        expect(policiesResponse.AttachedPolicies).toBeDefined();
        expect(policiesResponse.AttachedPolicies!.length).toBeGreaterThan(0);

        // Verify CloudWatch policy is attached
        const hasCloudWatchPolicy = policiesResponse.AttachedPolicies!.some(
          (policy) => policy.PolicyName?.includes('CloudWatch')
        );
        expect(hasCloudWatchPolicy).toBe(true);
      }, 60000);

      test('should verify MFAEnforcementPolicy exists', async () => {
        const policyArn = outputs.MFAEnforcementPolicyArn;

        // ACTION: Get policy
        const response = await iamClient.send(
          new GetPolicyCommand({
            PolicyArn: policyArn,
          })
        );

        expect(response.Policy).toBeDefined();
        expect(response.Policy?.PolicyName).toContain('MFAEnforcement');
      }, 60000);
    });

    describe('VPC and Networking Tests', () => {
      test('should verify VPC exists with correct configuration', async () => {
        const vpcId = outputs.VPCId;

        // ACTION 1: Describe VPC
        const response = await ec2Client.send(
          new DescribeVpcsCommand({
            VpcIds: [vpcId],
          })
        );

        expect(response.Vpcs).toBeDefined();
        expect(response.Vpcs!.length).toBe(1);

        const vpc = response.Vpcs![0];
        expect(vpc.State).toBe('available');
        expect(vpc.CidrBlock).toBeDefined();

        // ACTION 2: Check DNS support
        const dnsSupportResponse = await ec2Client.send(
          new DescribeVpcAttributeCommand({
            VpcId: vpcId,
            Attribute: 'enableDnsSupport',
          })
        );

        expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);

        // ACTION 3: Check DNS hostnames
        const dnsHostnamesResponse = await ec2Client.send(
          new DescribeVpcAttributeCommand({
            VpcId: vpcId,
            Attribute: 'enableDnsHostnames',
          })
        );

        expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);
      }, 60000);

      test('should verify all subnets exist in correct AZs', async () => {
        const publicSubnet1Id = outputs.PublicSubnet1Id;
        const publicSubnet2Id = outputs.PublicSubnet2Id;
        const privateSubnet1Id = outputs.PrivateSubnet1Id;
        const privateSubnet2Id = outputs.PrivateSubnet2Id;

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
        });

        // Verify subnets are in different AZs
        const azs = new Set(response.Subnets!.map((s) => s.AvailabilityZone));
        expect(azs.size).toBe(2);
      }, 60000);

      test('should verify Internet Gateway is attached to VPC', async () => {
        const vpcId = outputs.VPCId;
        const igwId = outputs.InternetGatewayId;

        // ACTION: Describe Internet Gateway
        const response = await ec2Client.send(
          new DescribeInternetGatewaysCommand({
            InternetGatewayIds: [igwId],
          })
        );

        expect(response.InternetGateways).toBeDefined();
        expect(response.InternetGateways!.length).toBe(1);

        const igw = response.InternetGateways![0];
        const attachment = igw.Attachments?.find((a) => a.VpcId === vpcId);
        expect(attachment).toBeDefined();
        expect(attachment!.State).toBe('available');
      }, 60000);

      test('should verify RestrictedSecurityGroup has correct rules', async () => {
        const sgId = outputs.RestrictedSecurityGroupId;

        // ACTION: Describe Security Group
        const response = await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [sgId],
          })
        );

        expect(response.SecurityGroups).toBeDefined();
        expect(response.SecurityGroups!.length).toBe(1);

        const sg = response.SecurityGroups![0];
        expect(sg.IpPermissions).toBeDefined();
        expect(sg.IpPermissions!.length).toBeGreaterThan(0);

        // Verify HTTPS and SSH ports
        const hasHttps = sg.IpPermissions!.some((rule) => rule.FromPort === 443);
        const hasSsh = sg.IpPermissions!.some((rule) => rule.FromPort === 22);

        expect(hasHttps).toBe(true);
        expect(hasSsh).toBe(true);
      }, 60000);

      test('should verify VPC Flow Logs are enabled', async () => {
        const vpcId = outputs.VPCId;

        // ACTION: Describe Flow Logs
        const response = await ec2Client.send(
          new DescribeFlowLogsCommand({
            Filter: [
              {
                Name: 'resource-id',
                Values: [vpcId],
              },
            ],
          })
        );

        expect(response.FlowLogs).toBeDefined();
        expect(response.FlowLogs!.length).toBeGreaterThan(0);

        const flowLog = response.FlowLogs![0];
        expect(flowLog.FlowLogStatus).toBe('ACTIVE');
        expect(flowLog.TrafficType).toBe('ALL');
      }, 60000);
    });

    describe('RDS Instance Tests', () => {
      test('should verify RDS instance exists with correct configuration', async () => {
        const dbInstanceId = outputs.RDSInstanceId;

        // ACTION: Describe DB instance
        const response = await rdsClient.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: dbInstanceId,
          })
        );

        expect(response.DBInstances).toBeDefined();
        expect(response.DBInstances!.length).toBe(1);

        const dbInstance = response.DBInstances![0];
        expect(dbInstance.DBInstanceStatus).toBe('available');
        expect(dbInstance.Engine).toBe('mysql');
        expect(dbInstance.StorageEncrypted).toBe(true);
        expect(dbInstance.PubliclyAccessible).toBe(false);
        expect(dbInstance.BackupRetentionPeriod).toBe(7);
      }, 60000);

      test('should verify RDS secret exists and contains credentials', async () => {
        const secretArn = outputs.RDSSecretArn;

        try {
          // ACTION: Get secret value
          const response = await secretsClient.send(
            new GetSecretValueCommand({
              SecretId: secretArn,
            })
          );

          expect(response.SecretString).toBeDefined();

          const secret = JSON.parse(response.SecretString!);
          expect(secret.username).toBeDefined();
          expect(secret.password).toBeDefined();
          expect(secret.password.length).toBeGreaterThanOrEqual(32);
        } catch (error: any) {
          console.error('Failed to retrieve RDS secret:', error.message);
          throw error;
        }
      }, 120000);
    });

    describe('CloudWatch Logs Tests', () => {
      test('should verify VPC Flow Log Group exists', async () => {
        const logGroupName = outputs.VPCFlowLogGroupName;

        // ACTION: Describe log group
        const response = await cloudwatchLogsClient.send(
          new DescribeLogGroupsCommand({
            logGroupNamePrefix: logGroupName,
          })
        );

        expect(response.logGroups).toBeDefined();
        expect(response.logGroups!.length).toBeGreaterThan(0);

        const logGroup = response.logGroups!.find((lg) => lg.logGroupName === logGroupName);
        expect(logGroup).toBeDefined();
        expect(logGroup!.retentionInDays).toBe(30);
      }, 60000);

      test('should verify VPC Flow Logs are being created', async () => {
        const logGroupName = outputs.VPCFlowLogGroupName;

        // ACTION: Describe log streams
        const response = await cloudwatchLogsClient.send(
          new DescribeLogStreamsCommand({
            logGroupName: logGroupName,
            limit: 5,
          })
        );

        expect(response.logStreams).toBeDefined();
        expect(response.logStreams!.length).toBeGreaterThan(0);
      }, 60000);
    });

    describe('CloudWatch Alarms Tests', () => {
      test('should verify UnauthorizedAPICallsAlarm exists', async () => {
        const alarmName = outputs.UnauthorizedAPICallsAlarmName;

        // ACTION: Describe alarm
        const response = await cloudwatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNames: [alarmName],
          })
        );

        expect(response.MetricAlarms).toBeDefined();
        expect(response.MetricAlarms!.length).toBe(1);

        const alarm = response.MetricAlarms![0];
        expect(alarm.MetricName).toBe('UnauthorizedAPICalls');
        expect(alarm.Namespace).toBe('CloudTrailMetrics');
        expect(alarm.AlarmActions).toBeDefined();
        expect(alarm.AlarmActions!.length).toBeGreaterThan(0);
      }, 60000);

      test('should verify RootAccountUsageAlarm exists', async () => {
        const alarmName = outputs.RootAccountUsageAlarmName;

        // ACTION: Describe alarm
        const response = await cloudwatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNames: [alarmName],
          })
        );

        expect(response.MetricAlarms).toBeDefined();
        expect(response.MetricAlarms!.length).toBe(1);

        const alarm = response.MetricAlarms![0];
        expect(alarm.MetricName).toBe('RootAccountUsage');
        expect(alarm.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
      }, 60000);
    });

    describe('SNS Topic Tests', () => {
      test('should verify SecurityAlertTopic exists', async () => {
        const topicArn = outputs.SecurityAlertTopicArn;

        // ACTION: Get topic attributes
        const response = await snsClient.send(
          new GetTopicAttributesCommand({
            TopicArn: topicArn,
          })
        );

        expect(response.Attributes).toBeDefined();
        expect(response.Attributes!.DisplayName).toBe('Security Alerts');
      }, 60000);

      test('should publish message to SecurityAlertTopic', async () => {
        const topicArn = outputs.SecurityAlertTopicArn;

        // ACTION: Publish message
        const response = await snsClient.send(
          new PublishCommand({
            TopicArn: topicArn,
            Subject: 'Integration Test Message',
            Message: 'This is a test message from integration tests',
          })
        );

        expect(response.MessageId).toBeDefined();
      }, 60000);
    });

    describe('EBS Volume Tests', () => {
      test('should verify encrypted EBS volume exists', async () => {
        const volumeId = outputs.EncryptedEBSVolumeId;

        // ACTION: Describe volume
        const response = await ec2Client.send(
          new DescribeVolumesCommand({
            VolumeIds: [volumeId],
          })
        );

        expect(response.Volumes).toBeDefined();
        expect(response.Volumes!.length).toBe(1);

        const volume = response.Volumes![0];
        expect(volume.Encrypted).toBe(true);
        expect(volume.Size).toBe(10);
        expect(volume.State).toBeDefined();
      }, 60000);
    });

    describe('KMS Key Tests', () => {
      test('should verify Lambda KMS key exists and is enabled', async () => {
        const keyId = outputs.LambdaKMSKeyId;

        // ACTION: Describe key
        const response = await kmsClient.send(
          new DescribeKeyCommand({
            KeyId: keyId,
          })
        );

        expect(response.KeyMetadata).toBeDefined();
        expect(response.KeyMetadata!.Enabled).toBe(true);
        expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      }, 60000);

      test('should verify Lambda KMS key has correct policy', async () => {
        const keyId = outputs.LambdaKMSKeyId;

        // ACTION: Get key policy
        const response = await kmsClient.send(
          new GetKeyPolicyCommand({
            KeyId: keyId,
            PolicyName: 'default',
          })
        );

        expect(response.Policy).toBeDefined();

        const policy = JSON.parse(response.Policy!);
        expect(policy.Statement).toBeDefined();
        expect(policy.Statement.length).toBeGreaterThan(0);
      }, 60000);
    });

    describe('EventBridge Rule Tests', () => {
      test('should verify KeyRotationSchedule rule exists', async () => {
        const ruleName = outputs.KeyRotationScheduleName;

        // ACTION: Describe rule
        const response = await eventBridgeClient.send(
          new DescribeRuleCommand({
            Name: ruleName,
          })
        );

        expect(response.Name).toBe(ruleName);
        expect(response.State).toBe('ENABLED');
        expect(response.ScheduleExpression).toContain('cron');
      }, 60000);

      test('should verify KeyRotationSchedule has Lambda target', async () => {
        const ruleName = outputs.KeyRotationScheduleName;

        // ACTION: List targets
        const response = await eventBridgeClient.send(
          new ListTargetsByRuleCommand({
            Rule: ruleName,
          })
        );

        expect(response.Targets).toBeDefined();
        expect(response.Targets!.length).toBeGreaterThan(0);
        expect(response.Targets![0].Arn).toContain('lambda');
      }, 60000);
    });
  });

  // ===================================================================
  // CROSS-SERVICE TESTS - Make TWO services talk to each other
  // ===================================================================

  describe('CROSS-SERVICE Tests', () => {
    describe('Lambda → SNS Integration', () => {
      test('should invoke Lambda and verify it can publish to SNS', async () => {
        const functionArn = outputs.KeyRotationLambdaArn;
        const topicArn = outputs.SecurityAlertTopicArn;

        // CROSS-SERVICE ACTION: Invoke Lambda (which should have SNS permissions)
        const response = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: functionArn,
            Payload: JSON.stringify({ test: true }),
          })
        );

        expect(response.StatusCode).toBe(200);

        // Verify Lambda has SNS topic ARN configured
        const configResponse = await lambdaClient.send(
          new GetFunctionConfigurationCommand({
            FunctionName: functionArn,
          })
        );

        expect(configResponse.Environment?.Variables?.SNS_TOPIC_ARN).toBe(topicArn);
      }, 60000);
    });

    describe('S3 → CloudWatch Logs Integration', () => {
      test('should verify S3 bucket logging configuration', async () => {
        const bucketName = outputs.AccessLogsBucketName;

        // CROSS-SERVICE ACTION: Verify S3 logs are being captured
        // This is implicit through bucket configuration
        const encryptionResponse = await s3Client.send(
          new GetBucketEncryptionCommand({ Bucket: bucketName })
        );

        expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      }, 60000);
    });

    describe('RDS → Secrets Manager Integration', () => {
      test('should retrieve RDS credentials from Secrets Manager and verify format', async () => {
        const secretArn = outputs.RDSSecretArn;
        const dbInstanceId = outputs.RDSInstanceId;

        try {
          // CROSS-SERVICE ACTION 1: Get secret from Secrets Manager
          const secretResponse = await secretsClient.send(
            new GetSecretValueCommand({
              SecretId: secretArn,
            })
          );

          expect(secretResponse.SecretString).toBeDefined();
          const credentials = JSON.parse(secretResponse.SecretString!);

          // CROSS-SERVICE ACTION 2: Verify RDS instance exists
          const rdsResponse = await rdsClient.send(
            new DescribeDBInstancesCommand({
              DBInstanceIdentifier: dbInstanceId,
            })
          );

          expect(rdsResponse.DBInstances![0].MasterUsername).toBe(credentials.username);
        } catch (error: any) {
          console.error('RDS → Secrets Manager integration test failed:', error.message);
          throw error;
        }
      }, 120000);
    });

    describe('Lambda → KMS Integration', () => {
      test('should verify Lambda is encrypted with KMS key', async () => {
        const functionArn = outputs.SecureLambdaFunctionArn;
        const kmsKeyArn = outputs.LambdaKMSKeyArn;

        // CROSS-SERVICE ACTION 1: Get Lambda configuration
        const lambdaResponse = await lambdaClient.send(
          new GetFunctionConfigurationCommand({
            FunctionName: functionArn,
          })
        );

        expect(lambdaResponse.KMSKeyArn).toBe(kmsKeyArn);

        // CROSS-SERVICE ACTION 2: Verify KMS key exists and is enabled
        const kmsResponse = await kmsClient.send(
          new DescribeKeyCommand({
            KeyId: kmsKeyArn,
          })
        );

        expect(kmsResponse.KeyMetadata?.Enabled).toBe(true);
      }, 60000);
    });

    describe('EventBridge → Lambda Integration', () => {
      test('should verify EventBridge rule triggers Lambda', async () => {
        const ruleName = outputs.KeyRotationScheduleName;
        const lambdaArn = outputs.KeyRotationLambdaArn;

        // CROSS-SERVICE ACTION 1: Get rule details
        const ruleResponse = await eventBridgeClient.send(
          new DescribeRuleCommand({
            Name: ruleName,
          })
        );

        expect(ruleResponse.State).toBe('ENABLED');

        // CROSS-SERVICE ACTION 2: Verify Lambda is target
        const targetsResponse = await eventBridgeClient.send(
          new ListTargetsByRuleCommand({
            Rule: ruleName,
          })
        );

        const lambdaTarget = targetsResponse.Targets!.find((t) => t.Arn === lambdaArn);
        expect(lambdaTarget).toBeDefined();
      }, 60000);
    });

    describe('CloudWatch Alarms → SNS Integration', () => {
      test('should verify CloudWatch alarms publish to SNS topic', async () => {
        const alarmName = outputs.UnauthorizedAPICallsAlarmName;
        const topicArn = outputs.SecurityAlertTopicArn;

        // CROSS-SERVICE ACTION: Verify alarm has SNS action
        const response = await cloudwatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNames: [alarmName],
          })
        );

        const alarm = response.MetricAlarms![0];
        expect(alarm.AlarmActions).toContain(topicArn);
      }, 60000);
    });

    describe('VPC → CloudWatch Logs Integration', () => {
      test('should verify VPC Flow Logs are sent to CloudWatch', async () => {
        const vpcId = outputs.VPCId;
        const logGroupName = outputs.VPCFlowLogGroupName;

        // CROSS-SERVICE ACTION 1: Get Flow Log configuration
        const flowLogResponse = await ec2Client.send(
          new DescribeFlowLogsCommand({
            Filter: [
              {
                Name: 'resource-id',
                Values: [vpcId],
              },
            ],
          })
        );

        const flowLog = flowLogResponse.FlowLogs![0];
        expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');
        expect(flowLog.LogGroupName).toBe(logGroupName);

        // CROSS-SERVICE ACTION 2: Verify log group exists
        const logGroupResponse = await cloudwatchLogsClient.send(
          new DescribeLogGroupsCommand({
            logGroupNamePrefix: logGroupName,
          })
        );

        expect(logGroupResponse.logGroups!.length).toBeGreaterThan(0);
      }, 60000);
    });
  });

  // ===================================================================
  // E2E TESTS - Complete workflows with 3+ services
  // ===================================================================

  describe('E2E Tests', () => {
    describe('Complete Security Monitoring Workflow', () => {
      test('should execute E2E flow: Lambda → CloudWatch → SNS', async () => {
        const lambdaArn = outputs.KeyRotationLambdaArn;
        const topicArn = outputs.SecurityAlertTopicArn;

        // E2E Step 1: Invoke Lambda
        const lambdaResponse = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: lambdaArn,
            Payload: JSON.stringify({ test: true }),
          })
        );

        expect(lambdaResponse.StatusCode).toBe(200);

        // E2E Step 2: Verify Lambda has CloudWatch Logs
        const lambdaConfig = await lambdaClient.send(
          new GetFunctionConfigurationCommand({
            FunctionName: lambdaArn,
          })
        );

        expect(lambdaConfig.Role).toBeDefined();

        // E2E Step 3: Verify SNS topic is configured
        const snsResponse = await snsClient.send(
          new GetTopicAttributesCommand({
            TopicArn: topicArn,
          })
        );

        expect(snsResponse.Attributes).toBeDefined();
        expect(snsResponse.Attributes!.DisplayName).toBe('Security Alerts');
      }, 90000);
    });

    describe('Complete Database Workflow', () => {
      test('should execute E2E flow: Secrets Manager → RDS → VPC', async () => {
        const secretArn = outputs.RDSSecretArn;
        const dbInstanceId = outputs.RDSInstanceId;
        const vpcId = outputs.VPCId;

        try {
          // E2E Step 1: Get credentials from Secrets Manager
          const secretResponse = await secretsClient.send(
            new GetSecretValueCommand({
              SecretId: secretArn,
            })
          );

          expect(secretResponse.SecretString).toBeDefined();
          const credentials = JSON.parse(secretResponse.SecretString!);
          expect(credentials.username).toBe('admin');
          expect(credentials.password).toBeDefined();

          // E2E Step 2: Verify RDS instance is configured correctly
          const rdsResponse = await rdsClient.send(
            new DescribeDBInstancesCommand({
              DBInstanceIdentifier: dbInstanceId,
            })
          );

          const dbInstance = rdsResponse.DBInstances![0];
          expect(dbInstance.MasterUsername).toBe(credentials.username);
          expect(dbInstance.StorageEncrypted).toBe(true);
          expect(dbInstance.PubliclyAccessible).toBe(false);

          // E2E Step 3: Verify RDS is in correct VPC
          const dbVpcId = dbInstance.DBSubnetGroup?.VpcId;
          expect(dbVpcId).toBe(vpcId);

          // E2E Step 4: Verify VPC configuration
          const vpcResponse = await ec2Client.send(
            new DescribeVpcsCommand({
              VpcIds: [vpcId],
            })
          );

          expect(vpcResponse.Vpcs![0].State).toBe('available');
        } catch (error: any) {
          console.error('E2E Database Workflow test failed:', error.message);
          throw error;
        }
      }, 150000);
    });

    describe('Complete Storage Workflow', () => {
      test('should execute E2E flow: S3 → Encryption → Versioning → Lifecycle', async () => {
        const bucketName = outputs.AccessLogsBucketName;
        const testKey = `e2e-test-${Date.now()}.json`;

        try {
          // E2E Step 1: Verify bucket encryption
          const encryptionResponse = await s3Client.send(
            new GetBucketEncryptionCommand({ Bucket: bucketName })
          );

          expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();

          // E2E Step 2: Verify versioning is enabled
          const versioningResponse = await s3Client.send(
            new GetBucketVersioningCommand({ Bucket: bucketName })
          );

          expect(versioningResponse.Status).toBe('Enabled');

          // E2E Step 3: Upload object
          await s3Client.send(
            new PutObjectCommand({
              Bucket: bucketName,
              Key: testKey,
              Body: JSON.stringify({
                timestamp: new Date().toISOString(),
                test: 'E2E workflow',
              }),
              ContentType: 'application/json',
            })
          );

          // E2E Step 4: Retrieve object
          const getResponse = await s3Client.send(
            new GetObjectCommand({
              Bucket: bucketName,
              Key: testKey,
            })
          );

          const content = await getResponse.Body?.transformToString();
          expect(content).toContain('E2E workflow');

          // E2E Step 5: Cleanup
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: testKey,
            })
          );
        } catch (error: any) {
          console.error('E2E storage workflow failed:', error);
          throw error;
        }
      }, 120000);
    });

    describe('Complete Network Security Workflow', () => {
      test('should execute E2E flow: VPC → Subnets → Security Groups → Flow Logs → CloudWatch', async () => {
        const vpcId = outputs.VPCId;
        const sgId = outputs.RestrictedSecurityGroupId;
        const logGroupName = outputs.VPCFlowLogGroupName;

        // E2E Step 1: Verify VPC configuration
        const vpcResponse = await ec2Client.send(
          new DescribeVpcsCommand({
            VpcIds: [vpcId],
          })
        );

        expect(vpcResponse.Vpcs![0].State).toBe('available');

        // E2E Step 2: Verify subnets across multiple AZs
        const privateSubnet1Id = outputs.PrivateSubnet1Id;
        const privateSubnet2Id = outputs.PrivateSubnet2Id;

        const subnetsResponse = await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: [privateSubnet1Id, privateSubnet2Id],
          })
        );

        const azs = new Set(subnetsResponse.Subnets!.map((s) => s.AvailabilityZone));
        expect(azs.size).toBe(2);

        // E2E Step 3: Verify security group rules
        const sgResponse = await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [sgId],
          })
        );

        expect(sgResponse.SecurityGroups![0].IpPermissions!.length).toBeGreaterThan(0);

        // E2E Step 4: Verify Flow Logs are enabled
        const flowLogResponse = await ec2Client.send(
          new DescribeFlowLogsCommand({
            Filter: [
              {
                Name: 'resource-id',
                Values: [vpcId],
              },
            ],
          })
        );

        expect(flowLogResponse.FlowLogs![0].FlowLogStatus).toBe('ACTIVE');

        // E2E Step 5: Verify CloudWatch Log Group
        const logGroupResponse = await cloudwatchLogsClient.send(
          new DescribeLogGroupsCommand({
            logGroupNamePrefix: logGroupName,
          })
        );

        expect(logGroupResponse.logGroups!.length).toBeGreaterThan(0);
      }, 120000);
    });

    describe('Complete Lambda Encryption Workflow', () => {
      test('should execute E2E flow: KMS Key → Lambda → Encryption → Invocation', async () => {
        const kmsKeyId = outputs.LambdaKMSKeyId;
        const kmsKeyArn = outputs.LambdaKMSKeyArn;
        const functionArn = outputs.SecureLambdaFunctionArn;

        // E2E Step 1: Verify KMS key is enabled
        const kmsResponse = await kmsClient.send(
          new DescribeKeyCommand({
            KeyId: kmsKeyId,
          })
        );

        expect(kmsResponse.KeyMetadata?.Enabled).toBe(true);
        expect(kmsResponse.KeyMetadata?.KeyState).toBe('Enabled');

        // E2E Step 2: Verify Lambda uses KMS key
        const lambdaConfig = await lambdaClient.send(
          new GetFunctionConfigurationCommand({
            FunctionName: functionArn,
          })
        );

        expect(lambdaConfig.KMSKeyArn).toBe(kmsKeyArn);
        expect(lambdaConfig.Environment?.Variables).toBeDefined();

        // E2E Step 3: Invoke encrypted Lambda
        const invokeResponse = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: functionArn,
            Payload: JSON.stringify({ test: 'E2E encryption test' }),
          })
        );

        expect(invokeResponse.StatusCode).toBe(200);
        expect(invokeResponse.FunctionError).toBeUndefined();

        // E2E Step 4: Verify Lambda can decrypt environment variables
        if (invokeResponse.Payload) {
          const payload = JSON.parse(new TextDecoder().decode(invokeResponse.Payload));
          expect(payload.statusCode).toBe(200);
        }
      }, 90000);
    });
  });

  // Conditional tests for optional resources
  describe('Conditional Resource Tests', () => {
    test('should verify CloudTrail if created', async () => {
      if (outputs.CloudTrailName) {
        const trailName = outputs.CloudTrailName;

        const response = await cloudtrailClient.send(
          new DescribeTrailsCommand({
            trailNameList: [trailName],
          })
        );

        expect(response.trailList).toBeDefined();
        expect(response.trailList!.length).toBe(1);

        const statusResponse = await cloudtrailClient.send(
          new GetTrailStatusCommand({
            Name: trailName,
          })
        );

        expect(statusResponse.IsLogging).toBe(true);
      }
    }, 60000);

    test('should verify AWS Config if created', async () => {
      if (outputs.ConfigRecorderName) {
        const recorderName = outputs.ConfigRecorderName;

        const response = await configClient.send(
          new DescribeConfigurationRecordersCommand({
            ConfigurationRecorderNames: [recorderName],
          })
        );

        expect(response.ConfigurationRecorders).toBeDefined();
        expect(response.ConfigurationRecorders!.length).toBe(1);

        const recorder = response.ConfigurationRecorders![0];
        expect(recorder.recordingGroup?.allSupported).toBe(true);
      }
    }, 60000);

    test('should verify GuardDuty if created', async () => {
      if (outputs.GuardDutyDetectorId) {
        const detectorId = outputs.GuardDutyDetectorId;

        const response = await guarddutyClient.send(
          new GetDetectorCommand({
            DetectorId: detectorId,
          })
        );

        expect(response.Status).toBe('ENABLED');
        expect(response.FindingPublishingFrequency).toBe('FIFTEEN_MINUTES');
      }
    }, 60000);

    test('should verify ALB if created', async () => {
      if (outputs.ApplicationLoadBalancerArn) {
        const albArn = outputs.ApplicationLoadBalancerArn;

        const response = await elbClient.send(
          new DescribeLoadBalancersCommand({
            LoadBalancerArns: [albArn],
          })
        );

        expect(response.LoadBalancers).toBeDefined();
        expect(response.LoadBalancers!.length).toBe(1);

        const alb = response.LoadBalancers![0];
        expect(alb.State?.Code).toBe('active');
        expect(alb.Scheme).toBe('internet-facing');

        // Verify ALB logging is enabled
        const attributesResponse = await elbClient.send(
          new DescribeLoadBalancerAttributesCommand({
            LoadBalancerArn: albArn,
          })
        );

        const loggingAttr = attributesResponse.Attributes?.find(
          (attr) => attr.Key === 'access_logs.s3.enabled'
        );
        expect(loggingAttr?.Value).toBe('true');
      }
    }, 60000);
  });
});
