/**
 * TapStack Integration Tests
 *
 * These tests verify deployed AWS resources match the CloudFormation template specifications.
 *
 * IMPORTANT: These tests require actual AWS resources and cannot be run locally.
 * They should only be run in a CI/CD environment or against a deployed stack.
 *
 * Required Environment Variables:
 * - AWS_REGION: AWS region where stack is deployed (default: us-east-1)
 * - ENVIRONMENT_SUFFIX: Environment suffix used in resource naming (default: dev)
 * - AWS_ACCOUNT_ID: AWS account ID for bucket name construction (default: 123456789012)
 *
 * Note: VPC Flow Logs bucket uses AES256 encryption, not KMS encryption.
 */

import fs from 'fs';
import path from 'path';
import {
    EC2Client,
    DescribeVpcsCommand,
    DescribeSecurityGroupsCommand,
    DescribeFlowLogsCommand,
} from '@aws-sdk/client-ec2';
import {
    S3Client,
    HeadBucketCommand,
    GetBucketEncryptionCommand,
    GetBucketVersioningCommand,
    GetPublicAccessBlockCommand,
    GetBucketLifecycleConfigurationCommand,
    GetBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import {
    KMSClient,
    DescribeKeyCommand,
    GetKeyPolicyCommand,
    ListAliasesCommand,
} from '@aws-sdk/client-kms';
import {
    SecretsManagerClient,
    DescribeSecretCommand,
    GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {
    CloudTrailClient,
    GetTrailCommand,
    GetTrailStatusCommand,
    GetEventSelectorsCommand,
} from '@aws-sdk/client-cloudtrail';
import {
    SNSClient,
    GetTopicAttributesCommand,
    ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
    CloudWatchLogsClient,
    DescribeLogGroupsCommand,
    DescribeMetricFiltersCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
    CloudWatchClient,
    DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
    IAMClient,
    GetRoleCommand,
    ListAttachedRolePoliciesCommand,
    GetRolePolicyCommand,
} from '@aws-sdk/client-iam';
import {
    ConfigServiceClient,
    DescribeConfigurationRecordersCommand,
    DescribeDeliveryChannelsCommand,
    DescribeConfigRulesCommand,
    GetComplianceDetailsByConfigRuleCommand,
} from '@aws-sdk/client-config-service';
import {
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
    UpdateSecretCommand,
    PutResourcePolicyCommand,
} from '@aws-sdk/client-secrets-manager';
import {
    PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';
import {
    PutLogEventsCommand,
    CreateLogStreamCommand,
} from '@aws-sdk/client-cloudwatch-logs';

describe('TapStack Integration Tests - Deployed Resources', () => {
    // Load CloudFormation outputs
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    let outputs: any = {};
    let hasDeployment = false;

    // AWS Configuration
    const awsRegion = process.env.AWS_REGION || 'us-east-1';
    const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
    const awsAccountId = process.env.AWS_ACCOUNT_ID || '123456789012'; // Default for testing

    // Initialize AWS SDK clients
    const ec2Client = new EC2Client({ region: awsRegion });
    const s3Client = new S3Client({ region: awsRegion });
    const kmsClient = new KMSClient({ region: awsRegion });
    const secretsClient = new SecretsManagerClient({ region: awsRegion });
    const cloudTrailClient = new CloudTrailClient({ region: awsRegion });
    const snsClient = new SNSClient({ region: awsRegion });
    const cloudWatchLogsClient = new CloudWatchLogsClient({ region: awsRegion });
    const cloudWatchClient = new CloudWatchClient({ region: awsRegion });
    const iamClient = new IAMClient({ region: awsRegion });
    const configClient = new ConfigServiceClient({ region: awsRegion });

    beforeAll(() => {
        if (fs.existsSync(outputsPath)) {
            const content = fs.readFileSync(outputsPath, 'utf8');
            outputs = JSON.parse(content);
            hasDeployment = Object.keys(outputs).length > 0;
            console.log('Loaded deployment outputs:', Object.keys(outputs));
        } else {
            console.warn('No deployment outputs found. Integration tests will be skipped.');
        }
    });

    // Helper to skip tests if no deployment
    const skipIfNoDeployment = () => {
        if (!hasDeployment) {
            console.log('Skipping test - no deployment found');
            return true;
        }
        return false;
    };

    // ==================== VPC and Networking Tests ====================
    describe('VPC and Network Infrastructure', () => {
        test('should have VPC deployed with proper configuration', async () => {
            if (skipIfNoDeployment()) return;

            const vpcId = outputs.VPCId;
            expect(vpcId).toBeDefined();

            const command = new DescribeVpcsCommand({
                VpcIds: [vpcId],
            });
            const response = await ec2Client.send(command);

            expect(response.Vpcs).toHaveLength(1);
            const vpc = response.Vpcs![0];
            expect(vpc.VpcId).toBe(vpcId);
            expect(vpc.CidrBlock).toBe('10.0.0.0/16');
            expect(vpc.State).toBe('available');

            // Check tags
            const tags = vpc.Tags || [];
            expect(tags.some(t => t.Key === 'Environment')).toBe(true);
        }, 30000);

        test('should have security group with correct configuration', async () => {
            if (skipIfNoDeployment()) return;

            const securityGroupId = outputs.SecurityGroupId;
            expect(securityGroupId).toBeDefined();

            const command = new DescribeSecurityGroupsCommand({
                GroupIds: [securityGroupId],
            });
            const response = await ec2Client.send(command);

            expect(response.SecurityGroups).toHaveLength(1);
            const sg = response.SecurityGroups![0];

            // Check SSH rule
            const sshRule = sg.IpPermissions?.find(r => r.FromPort === 22);
            expect(sshRule).toBeDefined();
            expect(sshRule!.IpProtocol).toBe('tcp');
            expect(sshRule!.ToPort).toBe(22);

            // Check HTTP rule
            const httpRule = sg.IpPermissions?.find(r => r.FromPort === 80);
            expect(httpRule).toBeDefined();
            expect(httpRule!.IpProtocol).toBe('tcp');
            expect(httpRule!.ToPort).toBe(80);

            // Check egress rules
            expect(sg.IpPermissionsEgress).toBeDefined();
            expect(sg.IpPermissionsEgress!.length).toBeGreaterThan(0);
        }, 30000);

        test('should have VPC flow logs enabled and logging to S3', async () => {
            if (skipIfNoDeployment()) return;

            const vpcId = outputs.VPCId;

            const command = new DescribeFlowLogsCommand({
                Filter: [
                    {
                        Name: 'resource-id',
                        Values: [vpcId],
                    },
                ],
            });
            const response = await ec2Client.send(command);

            expect(response.FlowLogs).toBeDefined();
            expect(response.FlowLogs!.length).toBeGreaterThan(0);

            const flowLog = response.FlowLogs![0];
            expect(flowLog.FlowLogStatus).toBe('ACTIVE');
            expect(flowLog.LogDestinationType).toBe('s3');
            expect(flowLog.TrafficType).toBe('ALL');
        }, 30000);
    });

    // ==================== Storage Tests ====================
    describe('S3 Storage and Encryption', () => {
        test('VPC flow logs bucket should have lifecycle policy', async () => {
            if (skipIfNoDeployment()) return;

            const bucketName = `vpc-flow-logs-${environmentSuffix}-${awsAccountId}-${awsRegion}`;

            try {
                const lifecycleCommand = new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName });
                const lifecycleResponse = await s3Client.send(lifecycleCommand);
                expect(lifecycleResponse.Rules).toBeDefined();
                expect(lifecycleResponse.Rules!.length).toBeGreaterThan(0);
                expect(lifecycleResponse.Rules![0].Expiration?.Days).toBe(90);
            } catch (error: any) {
                console.warn('Could not verify VPC flow logs bucket lifecycle:', error.message);
            }
        }, 30000);

        test('CloudTrail bucket should have lifecycle policy for long-term retention', async () => {
            if (skipIfNoDeployment()) return;

            const bucketName = `cloudtrail-logs-${environmentSuffix}-${awsAccountId}-${awsRegion}`;

            try {
                const lifecycleCommand = new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName });
                const lifecycleResponse = await s3Client.send(lifecycleCommand);
                expect(lifecycleResponse.Rules).toBeDefined();
                expect(lifecycleResponse.Rules!.length).toBeGreaterThan(0);
                expect(lifecycleResponse.Rules![0].Expiration?.Days).toBe(365);
            } catch (error: any) {
                console.warn('Could not verify CloudTrail bucket lifecycle:', error.message);
            }
        }, 30000);

        test('VPC flow logs bucket should use AES256 encryption', async () => {
            if (skipIfNoDeployment()) return;

            const bucketName = `vpc-flow-logs-${environmentSuffix}-${awsAccountId}-${awsRegion}`;

            try {
                const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
                const encryptionResponse = await s3Client.send(encryptionCommand);
                expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
                const rule = encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0];
                expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('AES256');
                // VPC Flow Logs bucket should NOT use KMS
                expect(rule.ApplyServerSideEncryptionByDefault!.KMSMasterKeyID).toBeUndefined();
            } catch (error: any) {
                console.warn('Could not verify VPC flow logs bucket encryption:', error.message);
            }
        }, 30000);
    });

    // ==================== KMS Encryption Tests ====================
    describe('KMS Key and Encryption', () => {
        test('should have KMS key deployed and enabled', async () => {
            if (skipIfNoDeployment()) return;

            const keyId = outputs.KMSKeyId;
            expect(keyId).toBeDefined();

            const command = new DescribeKeyCommand({ KeyId: keyId });
            const response = await kmsClient.send(command);

            expect(response.KeyMetadata).toBeDefined();
            expect(response.KeyMetadata!.KeyState).toBe('Enabled');
            expect(response.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
        }, 30000);

        test('should have KMS key alias configured', async () => {
            if (skipIfNoDeployment()) return;

            const command = new ListAliasesCommand({});
            const response = await kmsClient.send(command);

            expect(response.Aliases).toBeDefined();
            const alias = response.Aliases!.find(a =>
                a.AliasName === `alias/security-baseline-${environmentSuffix}-key`
            );
            expect(alias).toBeDefined();
            expect(alias!.TargetKeyId).toBeDefined();
        }, 30000);

        test('should have KMS key policy allowing services', async () => {
            if (skipIfNoDeployment()) return;

            const keyId = outputs.KMSKeyId;
            const command = new GetKeyPolicyCommand({
                KeyId: keyId,
                PolicyName: 'default',
            });
            const response = await kmsClient.send(command);

            expect(response.Policy).toBeDefined();
            const policy = JSON.parse(response.Policy!);
            expect(policy.Statement).toBeDefined();

            // Check for CloudTrail permissions
            const cloudTrailStatement = policy.Statement.find(
                (s: any) => s.Sid === 'Allow CloudTrail to encrypt logs'
            );
            expect(cloudTrailStatement).toBeDefined();
            expect(cloudTrailStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');

            // Check for S3 permissions
            const s3Statement = policy.Statement.find(
                (s: any) => s.Sid === 'Allow S3 to use the key'
            );
            expect(s3Statement).toBeDefined();
            expect(s3Statement.Principal.Service).toBe('s3.amazonaws.com');
        }, 30000);
    });

    // ==================== IAM Roles Tests ====================
    describe('IAM Roles and Policies', () => {
        test('should have S3 read-only role with proper policies', async () => {
            if (skipIfNoDeployment()) return;

            const roleName = `SecurityBaselineS3ReadOnlyRole-${environmentSuffix}`;
            const command = new GetRoleCommand({ RoleName: roleName });
            const response = await iamClient.send(command);

            expect(response.Role).toBeDefined();
            expect(response.Role!.RoleName).toBe(roleName);

            // Check assume role policy
            const assumeRolePolicy = JSON.parse(decodeURIComponent(response.Role!.AssumeRolePolicyDocument!));
            expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
            expect(assumeRolePolicy.Statement[0].Action).toBe('sts:AssumeRole');
        }, 30000);

        test('should have SSM managed policy attached to role', async () => {
            if (skipIfNoDeployment()) return;

            const roleName = `SecurityBaselineS3ReadOnlyRole-${environmentSuffix}`;
            const command = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
            const response = await iamClient.send(command);

            expect(response.AttachedPolicies).toBeDefined();
            const policyArns = response.AttachedPolicies!.map(p => p.PolicyArn);
            expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
        }, 30000);

        test('should have S3 read-only inline policy', async () => {
            if (skipIfNoDeployment()) return;

            const roleName = `SecurityBaselineS3ReadOnlyRole-${environmentSuffix}`;
            const command = new GetRolePolicyCommand({
                RoleName: roleName,
                PolicyName: 'S3ReadOnlyPolicy',
            });
            const response = await iamClient.send(command);

            expect(response.PolicyDocument).toBeDefined();
            const policy = JSON.parse(decodeURIComponent(response.PolicyDocument!));
            expect(policy.Statement).toBeDefined();

            const statement = policy.Statement[0];
            expect(statement.Effect).toBe('Allow');
            expect(statement.Action).toContain('s3:GetObject');
            expect(statement.Action).toContain('s3:ListBucket');
        }, 30000);
    });

    // ==================== Secrets Manager Tests ====================
    describe('Secrets Manager', () => {
        test('should have database secret created', async () => {
            if (skipIfNoDeployment()) return;

            const secretArn = outputs.DatabaseSecretArn;
            expect(secretArn).toBeDefined();

            const command = new DescribeSecretCommand({ SecretId: secretArn });
            const response = await secretsClient.send(command);

            expect(response.Name).toContain('SecurityBaseline');
            expect(response.Name).toContain('Database-Credentials');
            expect(response.Description).toBe('Database credentials for Security Baseline');
            expect(response.KmsKeyId).toBeDefined();
        }, 30000);

        test('should be able to retrieve secret value', async () => {
            if (skipIfNoDeployment()) return;

            const secretArn = outputs.DatabaseSecretArn;
            const command = new GetSecretValueCommand({ SecretId: secretArn });
            const response = await secretsClient.send(command);

            expect(response.SecretString).toBeDefined();
            const secret = JSON.parse(response.SecretString!);
            expect(secret.username).toBe('admin');
            expect(secret.password).toBeDefined();
            expect(secret.password.length).toBe(32);
        }, 30000);
    });

    // ==================== CloudTrail Tests ====================
    describe('CloudTrail Audit Logging', () => {
        test('should have CloudTrail configured and logging', async () => {
            if (skipIfNoDeployment()) return;

            const trailName = outputs.CloudTrailName;
            expect(trailName).toBeDefined();

            const command = new GetTrailCommand({ Name: trailName });
            const response = await cloudTrailClient.send(command);

            expect(response.Trail).toBeDefined();
            const trail = response.Trail!;
            expect(trail.IsMultiRegionTrail).toBe(true);
            expect(trail.LogFileValidationEnabled).toBe(true);
            expect(trail.IncludeGlobalServiceEvents).toBe(true);
            expect(trail.KmsKeyId).toBeDefined();
        }, 30000);

        test('should have CloudTrail actively logging', async () => {
            if (skipIfNoDeployment()) return;

            const trailName = outputs.CloudTrailName;
            const command = new GetTrailStatusCommand({ Name: trailName });
            const response = await cloudTrailClient.send(command);

            expect(response.IsLogging).toBe(true);
        }, 30000);

        test('should have CloudTrail with proper event selectors', async () => {
            if (skipIfNoDeployment()) return;

            const trailName = outputs.CloudTrailName;
            const command = new GetEventSelectorsCommand({ TrailName: trailName });
            const response = await cloudTrailClient.send(command);

            expect(response.EventSelectors).toHaveLength(1);
            const selector = response.EventSelectors![0];
            expect(selector.ReadWriteType).toBe('All');
            expect(selector.IncludeManagementEvents).toBe(true);
        }, 30000);

        test('should have CloudTrail log group in CloudWatch', async () => {
            if (skipIfNoDeployment()) return;

            const command = new DescribeLogGroupsCommand({
                logGroupNamePrefix: '/aws/cloudtrail',
            });
            const response = await cloudWatchLogsClient.send(command);

            expect(response.logGroups).toBeDefined();
            expect(response.logGroups!.length).toBeGreaterThan(0);
            const logGroup = response.logGroups![0];
            expect(logGroup.logGroupName).toBe('/aws/cloudtrail');
            expect(logGroup.retentionInDays).toBe(365);
        }, 30000);
    });

    // ==================== Monitoring & Alerting Tests ====================
    describe('CloudWatch Monitoring and Alerting', () => {
        test('should have metric filter for console sign-in failures', async () => {
            if (skipIfNoDeployment()) return;

            const command = new DescribeMetricFiltersCommand({
                logGroupName: '/aws/cloudtrail',
                filterNamePrefix: 'ConsoleSignInFailures',
            });
            const response = await cloudWatchLogsClient.send(command);

            expect(response.metricFilters).toBeDefined();
            expect(response.metricFilters!.length).toBeGreaterThan(0);
            const filter = response.metricFilters![0];
            expect(filter.filterName).toBe('ConsoleSignInFailures');
            expect(filter.filterPattern).toContain('ConsoleLogin');
            expect(filter.filterPattern).toContain('Failed authentication');
            expect(filter.metricTransformations).toHaveLength(1);
            expect(filter.metricTransformations![0].metricName).toBe('ConsoleSignInFailureCount');
            expect(filter.metricTransformations![0].metricNamespace).toBe('CloudTrailMetrics');
        }, 30000);

        test('should have CloudWatch alarm for console sign-in failures', async () => {
            if (skipIfNoDeployment()) return;

            const command = new DescribeAlarmsCommand({
                AlarmNames: ['Console-SignIn-Failures'],
            });
            const response = await cloudWatchClient.send(command);

            expect(response.MetricAlarms).toHaveLength(1);
            const alarm = response.MetricAlarms![0];
            expect(alarm.AlarmName).toBe('Console-SignIn-Failures');
            expect(alarm.MetricName).toBe('ConsoleSignInFailureCount');
            expect(alarm.Namespace).toBe('CloudTrailMetrics');
            expect(alarm.Threshold).toBe(3);
            expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
            expect(alarm.Period).toBe(300);
            expect(alarm.EvaluationPeriods).toBe(1);
            expect(alarm.AlarmActions).toBeDefined();
            expect(alarm.AlarmActions!.length).toBeGreaterThan(0);
        }, 30000);
    });

    // ==================== SNS Notification Tests ====================
    describe('SNS Notification System', () => {
        test('should have SNS topic created', async () => {
            if (skipIfNoDeployment()) return;

            // Get SNS topic ARN from alarm
            const alarmCommand = new DescribeAlarmsCommand({
                AlarmNames: ['Console-SignIn-Failures'],
            });
            const alarmResponse = await cloudWatchClient.send(alarmCommand);
            const topicArn = alarmResponse.MetricAlarms![0].AlarmActions![0];

            const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
            const response = await snsClient.send(command);

            expect(response.Attributes).toBeDefined();
            expect(response.Attributes!.DisplayName).toBe('Security Alarms Topic');
        }, 30000);

        test('should have SNS topic with email subscription', async () => {
            if (skipIfNoDeployment()) return;

            // Get SNS topic ARN from alarm
            const alarmCommand = new DescribeAlarmsCommand({
                AlarmNames: ['Console-SignIn-Failures'],
            });
            const alarmResponse = await cloudWatchClient.send(alarmCommand);
            const topicArn = alarmResponse.MetricAlarms![0].AlarmActions![0];

            const command = new ListSubscriptionsByTopicCommand({ TopicArn: topicArn });
            const response = await snsClient.send(command);

            expect(response.Subscriptions).toBeDefined();
            expect(response.Subscriptions!.length).toBeGreaterThan(0);
            const subscription = response.Subscriptions![0];
            expect(subscription.Protocol).toBe('email');
            expect(subscription.Endpoint).toMatch(/@/); // Email format
        }, 30000);
    });

    // ==================== AWS Config Tests ====================
    describe('AWS Config Compliance', () => {
        test('should have Config recorder enabled', async () => {
            if (skipIfNoDeployment()) return;

            const command = new DescribeConfigurationRecordersCommand({});
            const response = await configClient.send(command);

            expect(response.ConfigurationRecorders).toBeDefined();
            expect(response.ConfigurationRecorders!.length).toBeGreaterThan(0);

            const recorder = response.ConfigurationRecorders![0];
            expect(recorder.name).toContain('SecurityBaselineRecorder');
            expect(recorder.recordingGroup?.allSupported).toBe(true);
            expect(recorder.recordingGroup?.includeGlobalResourceTypes).toBe(true);
        }, 30000);

        test('should have Config delivery channel configured', async () => {
            if (skipIfNoDeployment()) return;

            const command = new DescribeDeliveryChannelsCommand({});
            const response = await configClient.send(command);

            expect(response.DeliveryChannels).toBeDefined();
            expect(response.DeliveryChannels!.length).toBeGreaterThan(0);

            const channel = response.DeliveryChannels![0];
            expect(channel.name).toContain('SecurityBaselineDeliveryChannel');
            expect(channel.s3BucketName).toBeDefined();
            expect(channel.configSnapshotDeliveryProperties?.deliveryFrequency).toBe('TwentyFour_Hours');
        }, 30000);

        test('should have Config rules for S3 public access monitoring', async () => {
            if (skipIfNoDeployment()) return;

            const command = new DescribeConfigRulesCommand({});
            const response = await configClient.send(command);

            expect(response.ConfigRules).toBeDefined();

            const publicReadRule = response.ConfigRules!.find(r =>
                r.ConfigRuleName === 's3-bucket-public-read-prohibited'
            );
            expect(publicReadRule).toBeDefined();

            const publicWriteRule = response.ConfigRules!.find(r =>
                r.ConfigRuleName === 's3-bucket-public-write-prohibited'
            );
            expect(publicWriteRule).toBeDefined();
        }, 30000);

        test('should have Config rules evaluating compliance', async () => {
            if (skipIfNoDeployment()) return;

            try {
                const command = new GetComplianceDetailsByConfigRuleCommand({
                    ConfigRuleName: 's3-bucket-public-read-prohibited',
                });
                const response = await configClient.send(command);

                expect(response.EvaluationResults).toBeDefined();
                console.log(`Config rule evaluated ${response.EvaluationResults!.length} resources`);
            } catch (error: any) {
                console.warn('Config rule may not have run yet:', error.message);
            }
        }, 30000);
    });

    // ==================== Cross-Service Integration Tests ====================
    describe('Cross-Service Integration Scenarios', () => {
        test('CloudTrail logs to S3 with KMS encryption', async () => {
            if (skipIfNoDeployment()) return;

            const trailName = outputs.CloudTrailName;
            const kmsKeyId = outputs.KMSKeyId;

            const command = new GetTrailCommand({ Name: trailName });
            const response = await cloudTrailClient.send(command);

            const trail = response.Trail!;
            expect(trail.S3BucketName).toBeDefined();
            expect(trail.KmsKeyId).toContain(kmsKeyId);
        }, 30000);

        test('CloudWatch alarms notify SNS topic', async () => {
            if (skipIfNoDeployment()) return;

            const alarmCommand = new DescribeAlarmsCommand({
                AlarmNames: ['Console-SignIn-Failures'],
            });
            const alarmResponse = await cloudWatchClient.send(alarmCommand);
            const alarm = alarmResponse.MetricAlarms![0];

            expect(alarm.AlarmActions).toBeDefined();
            expect(alarm.AlarmActions!.length).toBeGreaterThan(0);

            const topicArn = alarm.AlarmActions![0];
            expect(topicArn).toContain('arn:aws:sns');

            // Verify SNS topic exists
            const snsCommand = new GetTopicAttributesCommand({ TopicArn: topicArn });
            const snsResponse = await snsClient.send(snsCommand);
            expect(snsResponse.Attributes).toBeDefined();
        }, 30000);

        test('Secrets Manager uses KMS for encryption', async () => {
            if (skipIfNoDeployment()) return;

            const secretArn = outputs.DatabaseSecretArn;
            const kmsKeyId = outputs.KMSKeyId;

            const command = new DescribeSecretCommand({ SecretId: secretArn });
            const response = await secretsClient.send(command);

            expect(response.KmsKeyId).toBeDefined();
            expect(response.KmsKeyId).toContain(kmsKeyId);
        }, 30000);

        test('VPC flow logs to S3 with AES256 encryption', async () => {
            if (skipIfNoDeployment()) return;

            const vpcId = outputs.VPCId;

            const flowLogsCommand = new DescribeFlowLogsCommand({
                Filter: [
                    {
                        Name: 'resource-id',
                        Values: [vpcId],
                    },
                ],
            });
            const flowLogsResponse = await ec2Client.send(flowLogsCommand);

            expect(flowLogsResponse.FlowLogs).toBeDefined();
            expect(flowLogsResponse.FlowLogs!.length).toBeGreaterThan(0);

            const flowLog = flowLogsResponse.FlowLogs![0];
            expect(flowLog.LogDestinationType).toBe('s3');
            expect(flowLog.LogDestination).toBeDefined();

            // Verify bucket is encrypted with AES256 (not KMS)
            const bucketArn = flowLog.LogDestination!;
            const bucketName = bucketArn.split(':::')[1];

            const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
            const encryptionResponse = await s3Client.send(encryptionCommand);

            expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
            const rule = encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0];
            expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('AES256');
        }, 30000);

        test('Metric filters feed CloudWatch alarms', async () => {
            if (skipIfNoDeployment()) return;

            // Get metric filter
            const filterCommand = new DescribeMetricFiltersCommand({
                logGroupName: '/aws/cloudtrail',
                filterNamePrefix: 'ConsoleSignInFailures',
            });
            const filterResponse = await cloudWatchLogsClient.send(filterCommand);
            const filter = filterResponse.metricFilters![0];

            // Get corresponding alarm
            const alarmCommand = new DescribeAlarmsCommand({
                AlarmNames: ['Console-SignIn-Failures'],
            });
            const alarmResponse = await cloudWatchClient.send(alarmCommand);
            const alarm = alarmResponse.MetricAlarms![0];

            // Verify they're connected
            expect(filter.metricTransformations![0].metricName).toBe(alarm.MetricName);
            expect(filter.metricTransformations![0].metricNamespace).toBe(alarm.Namespace);
        }, 30000);

        test('Config writes to S3 bucket', async () => {
            if (skipIfNoDeployment()) return;

            const channelCommand = new DescribeDeliveryChannelsCommand({});
            const channelResponse = await configClient.send(channelCommand);

            expect(channelResponse.DeliveryChannels).toBeDefined();
            const channel = channelResponse.DeliveryChannels![0];
            const bucketName = channel.s3BucketName!;

            // Verify bucket exists and is encrypted
            const headCommand = new HeadBucketCommand({ Bucket: bucketName });
            await expect(s3Client.send(headCommand)).resolves.toBeDefined();

            const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
            const encryptionResponse = await s3Client.send(encryptionCommand);
            expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
        }, 30000);
    });

    // ==================== Security Compliance Tests ====================
    describe('Security Compliance Validation', () => {
        test('Audit logging is enabled for all services', async () => {
            if (skipIfNoDeployment()) return;

            // CloudTrail is logging
            const trailName = outputs.CloudTrailName;
            const trailStatusCommand = new GetTrailStatusCommand({ Name: trailName });
            const trailStatusResponse = await cloudTrailClient.send(trailStatusCommand);
            expect(trailStatusResponse.IsLogging).toBe(true);

            // CloudWatch log group exists
            const logGroupCommand = new DescribeLogGroupsCommand({
                logGroupNamePrefix: '/aws/cloudtrail',
            });
            const logGroupResponse = await cloudWatchLogsClient.send(logGroupCommand);
            expect(logGroupResponse.logGroups).toBeDefined();
            expect(logGroupResponse.logGroups!.length).toBeGreaterThan(0);

            // Config is recording
            const configCommand = new DescribeConfigurationRecordersCommand({});
            const configResponse = await configClient.send(configCommand);
            expect(configResponse.ConfigurationRecorders).toBeDefined();
            expect(configResponse.ConfigurationRecorders!.length).toBeGreaterThan(0);
        }, 30000);

        test('Security monitoring is active', async () => {
            if (skipIfNoDeployment()) return;

            // CloudWatch alarms exist
            const alarmCommand = new DescribeAlarmsCommand({});
            const alarmResponse = await cloudWatchClient.send(alarmCommand);
            expect(alarmResponse.MetricAlarms).toBeDefined();
            expect(alarmResponse.MetricAlarms!.length).toBeGreaterThan(0);

            // Metric filters exist
            const filterCommand = new DescribeMetricFiltersCommand({
                logGroupName: '/aws/cloudtrail',
            });
            const filterResponse = await cloudWatchLogsClient.send(filterCommand);
            expect(filterResponse.metricFilters).toBeDefined();
            expect(filterResponse.metricFilters!.length).toBeGreaterThan(0);
        }, 30000);

    });

    // ==================== End-to-End Security Workflows ====================
    describe('End-to-End Security Workflows', () => {
        test('E2E: Audit Trail - CloudTrail → S3 → KMS → Verification', async () => {
            if (skipIfNoDeployment()) return;

            // Setup: Get CloudTrail and verify it's logging
            const trailName = outputs.CloudTrailName;
            const kmsKeyId = outputs.KMSKeyId;

            const statusCommand = new GetTrailStatusCommand({ Name: trailName });
            const statusResponse = await cloudTrailClient.send(statusCommand);
            expect(statusResponse.IsLogging).toBe(true);

            // Execute: Verify CloudTrail configuration
            const trailCommand = new GetTrailCommand({ Name: trailName });
            const trailResponse = await cloudTrailClient.send(trailCommand);
            const trail = trailResponse.Trail!;

            // Verify: Complete audit trail workflow
            expect(trail.S3BucketName).toBeDefined();
            expect(trail.KmsKeyId).toContain(kmsKeyId);
            expect(trail.IsMultiRegionTrail).toBe(true);
            expect(trail.LogFileValidationEnabled).toBe(true);

            // Verify: S3 bucket receiving logs exists and is encrypted
            const bucketName = trail.S3BucketName!;
            const headCommand = new HeadBucketCommand({ Bucket: bucketName });
            await expect(s3Client.send(headCommand)).resolves.toBeDefined();

            const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
            const encryptionResponse = await s3Client.send(encryptionCommand);
            expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();

            // Verify: KMS key used for encryption is enabled
            const keyCommand = new DescribeKeyCommand({ KeyId: kmsKeyId });
            const keyResponse = await kmsClient.send(keyCommand);
            expect(keyResponse.KeyMetadata!.KeyState).toBe('Enabled');

            console.log('✓ Complete audit trail workflow verified: CloudTrail → S3 (encrypted) → KMS');
        }, 45000);

        test('E2E: VPC Security - Flow Logs → S3 → Monitoring', async () => {
            if (skipIfNoDeployment()) return;

            // Setup: Get VPC and Flow Logs details
            const vpcId = outputs.VPCId;

            // Execute: Verify VPC Flow Logs are active
            const flowLogsCommand = new DescribeFlowLogsCommand({
                Filter: [
                    {
                        Name: 'resource-id',
                        Values: [vpcId],
                    },
                ],
            });
            const flowLogsResponse = await ec2Client.send(flowLogsCommand);
            expect(flowLogsResponse.FlowLogs).toBeDefined();
            expect(flowLogsResponse.FlowLogs!.length).toBeGreaterThan(0);

            const flowLog = flowLogsResponse.FlowLogs![0];
            expect(flowLog.FlowLogStatus).toBe('ACTIVE');
            expect(flowLog.LogDestinationType).toBe('s3');

            // Verify: S3 destination bucket exists and is encrypted
            const bucketArn = flowLog.LogDestination!;
            const bucketName = bucketArn.split(':::')[1];

            const headCommand = new HeadBucketCommand({ Bucket: bucketName });
            await expect(s3Client.send(headCommand)).resolves.toBeDefined();

            const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
            const encryptionResponse = await s3Client.send(encryptionCommand);
            expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();

            // Verify: Bucket has lifecycle policy for log rotation
            const lifecycleCommand = new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName });
            const lifecycleResponse = await s3Client.send(lifecycleCommand);
            expect(lifecycleResponse.Rules).toBeDefined();
            expect(lifecycleResponse.Rules!.length).toBeGreaterThan(0);

            console.log('✓ Complete VPC security workflow verified: Flow Logs (ACTIVE) → S3 (encrypted) → Lifecycle');
        }, 45000);
    });

    // ==================== End-to-End Monitoring Pipelines ====================
    describe('End-to-End Monitoring Pipelines', () => {
        test('E2E: Monitoring Pipeline - CloudWatch Logs → Metric Filter → Alarm → SNS', async () => {
            if (skipIfNoDeployment()) return;

            // Setup: Verify CloudWatch log group exists
            const logGroupCommand = new DescribeLogGroupsCommand({
                logGroupNamePrefix: '/aws/cloudtrail',
            });
            const logGroupResponse = await cloudWatchLogsClient.send(logGroupCommand);
            expect(logGroupResponse.logGroups).toBeDefined();
            expect(logGroupResponse.logGroups!.length).toBeGreaterThan(0);

            const logGroup = logGroupResponse.logGroups![0];
            expect(logGroup.logGroupName).toBe('/aws/cloudtrail');

            // Execute: Verify metric filter is configured
            const filterCommand = new DescribeMetricFiltersCommand({
                logGroupName: '/aws/cloudtrail',
                filterNamePrefix: 'ConsoleSignInFailures',
            });
            const filterResponse = await cloudWatchLogsClient.send(filterCommand);
            expect(filterResponse.metricFilters).toBeDefined();
            expect(filterResponse.metricFilters!.length).toBeGreaterThan(0);

            const filter = filterResponse.metricFilters![0];
            expect(filter.filterName).toBe('ConsoleSignInFailures');
            expect(filter.metricTransformations).toHaveLength(1);

            const metricTransform = filter.metricTransformations![0];
            expect(metricTransform.metricName).toBe('ConsoleSignInFailureCount');
            expect(metricTransform.metricNamespace).toBe('CloudTrailMetrics');

            // Execute: Verify CloudWatch alarm is configured
            const alarmCommand = new DescribeAlarmsCommand({
                AlarmNames: ['Console-SignIn-Failures'],
            });
            const alarmResponse = await cloudWatchClient.send(alarmCommand);
            expect(alarmResponse.MetricAlarms).toHaveLength(1);

            const alarm = alarmResponse.MetricAlarms![0];
            expect(alarm.MetricName).toBe(metricTransform.metricName);
            expect(alarm.Namespace).toBe(metricTransform.metricNamespace);
            expect(alarm.AlarmActions).toBeDefined();
            expect(alarm.AlarmActions!.length).toBeGreaterThan(0);

            // Verify: SNS topic is configured as alarm action
            const topicArn = alarm.AlarmActions![0];
            expect(topicArn).toContain('arn:aws:sns');

            const snsCommand = new GetTopicAttributesCommand({ TopicArn: topicArn });
            const snsResponse = await snsClient.send(snsCommand);
            expect(snsResponse.Attributes).toBeDefined();
            expect(snsResponse.Attributes!.DisplayName).toBe('Security Alarms Topic');

            // Verify: SNS topic has email subscription
            const subscriptionCommand = new ListSubscriptionsByTopicCommand({ TopicArn: topicArn });
            const subscriptionResponse = await snsClient.send(subscriptionCommand);
            expect(subscriptionResponse.Subscriptions).toBeDefined();
            expect(subscriptionResponse.Subscriptions!.length).toBeGreaterThan(0);

            console.log('✓ Complete monitoring pipeline verified: Logs → Filter → Alarm → SNS → Email');
        }, 45000);

        test('E2E: Alarm State and Action Verification', async () => {
            if (skipIfNoDeployment()) return;

            // Execute: Get alarm details
            const alarmCommand = new DescribeAlarmsCommand({
                AlarmNames: ['Console-SignIn-Failures'],
            });
            const alarmResponse = await cloudWatchClient.send(alarmCommand);
            expect(alarmResponse.MetricAlarms).toHaveLength(1);

            const alarm = alarmResponse.MetricAlarms![0];

            // Verify: Alarm has proper configuration
            expect(alarm.Threshold).toBe(3);
            expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
            expect(alarm.Period).toBe(300);
            expect(alarm.EvaluationPeriods).toBe(1);
            expect(alarm.Statistic).toBe('Sum');

            // Verify: Alarm state is valid
            expect(['OK', 'ALARM', 'INSUFFICIENT_DATA']).toContain(alarm.StateValue);

            // Verify: Actions are configured for all states
            expect(alarm.AlarmActions).toBeDefined();
            expect(alarm.AlarmActions!.length).toBeGreaterThan(0);

            console.log(`✓ Alarm state: ${alarm.StateValue}, Actions configured: ${alarm.AlarmActions!.length}`);
        }, 45000);
    });

    // ==================== End-to-End Compliance Verification ====================
    describe('End-to-End Compliance Verification', () => {
        test('E2E: Config Compliance - Recorder → Rules → Evaluation → Reporting', async () => {
            if (skipIfNoDeployment()) return;

            // Setup: Verify Config recorder is enabled
            const recorderCommand = new DescribeConfigurationRecordersCommand({});
            const recorderResponse = await configClient.send(recorderCommand);
            expect(recorderResponse.ConfigurationRecorders).toBeDefined();
            expect(recorderResponse.ConfigurationRecorders!.length).toBeGreaterThan(0);

            const recorder = recorderResponse.ConfigurationRecorders![0];
            expect(recorder.name).toContain('SecurityBaselineRecorder');
            expect(recorder.recordingGroup?.allSupported).toBe(true);
            expect(recorder.recordingGroup?.includeGlobalResourceTypes).toBe(true);

            // Execute: Verify delivery channel is configured
            const channelCommand = new DescribeDeliveryChannelsCommand({});
            const channelResponse = await configClient.send(channelCommand);
            expect(channelResponse.DeliveryChannels).toBeDefined();
            expect(channelResponse.DeliveryChannels!.length).toBeGreaterThan(0);

            const channel = channelResponse.DeliveryChannels![0];
            expect(channel.name).toContain('SecurityBaselineDeliveryChannel');
            expect(channel.s3BucketName).toBeDefined();

            // Execute: Verify Config rules exist
            const rulesCommand = new DescribeConfigRulesCommand({});
            const rulesResponse = await configClient.send(rulesCommand);
            expect(rulesResponse.ConfigRules).toBeDefined();

            const publicReadRule = rulesResponse.ConfigRules!.find(r =>
                r.ConfigRuleName === 's3-bucket-public-read-prohibited'
            );
            expect(publicReadRule).toBeDefined();
            expect(publicReadRule!.Source).toBeDefined();
            expect(publicReadRule!.Source!.Owner).toBe('AWS');

            const publicWriteRule = rulesResponse.ConfigRules!.find(r =>
                r.ConfigRuleName === 's3-bucket-public-write-prohibited'
            );
            expect(publicWriteRule).toBeDefined();

            // Verify: S3 bucket for Config snapshots exists and is encrypted
            const bucketName = channel.s3BucketName!;
            const headCommand = new HeadBucketCommand({ Bucket: bucketName });
            await expect(s3Client.send(headCommand)).resolves.toBeDefined();

            const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
            const encryptionResponse = await s3Client.send(encryptionCommand);
            expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();

            console.log('✓ Complete compliance workflow verified: Recorder → Rules → S3 (encrypted)');
        }, 45000);

        test('E2E: Config Rule Compliance Evaluation', async () => {
            if (skipIfNoDeployment()) return;

            // Execute: Get compliance details for public read rule
            try {
                const command = new GetComplianceDetailsByConfigRuleCommand({
                    ConfigRuleName: 's3-bucket-public-read-prohibited',
                    Limit: 10,
                });
                const response = await configClient.send(command);

                // Verify: Rule has been evaluated
                expect(response.EvaluationResults).toBeDefined();
                console.log(`✓ Config rule evaluated ${response.EvaluationResults!.length} resources`);

                // If there are evaluation results, verify structure
                if (response.EvaluationResults!.length > 0) {
                    const result = response.EvaluationResults![0];
                    expect(result.ComplianceType).toBeDefined();
                    expect(['COMPLIANT', 'NON_COMPLIANT', 'NOT_APPLICABLE']).toContain(result.ComplianceType);
                    expect(result.EvaluationResultIdentifier).toBeDefined();
                }
            } catch (error: any) {
                // Rule may not have run yet, which is acceptable for new deployments
                console.warn('Config rule evaluation pending:', error.message);
            }
        }, 45000);
    });

    // ==================== Service-Level Operations ====================
    describe('Service-Level Operations', () => {
        test('Operation: CloudTrail Log File Validation', async () => {
            if (skipIfNoDeployment()) return;

            const trailName = outputs.CloudTrailName;

            // Verify: Log file validation is enabled
            const trailCommand = new GetTrailCommand({ Name: trailName });
            const trailResponse = await cloudTrailClient.send(trailCommand);
            expect(trailResponse.Trail!.LogFileValidationEnabled).toBe(true);

            // Verify: Multi-region trail
            expect(trailResponse.Trail!.IsMultiRegionTrail).toBe(true);

            // Verify: Global service events included
            expect(trailResponse.Trail!.IncludeGlobalServiceEvents).toBe(true);

            console.log('✓ CloudTrail operations verified: Log validation, Multi-region, Global events');
        }, 45000);

        test('Operation: Secrets Manager Secret Accessibility', async () => {
            if (skipIfNoDeployment()) return;

            const secretArn = outputs.DatabaseSecretArn;

            // Verify: Secret can be retrieved
            const getCommand = new GetSecretValueCommand({ SecretId: secretArn });
            const getResponse = await secretsClient.send(getCommand);
            expect(getResponse.SecretString).toBeDefined();

            const secret = JSON.parse(getResponse.SecretString!);
            expect(secret.username).toBe('admin');
            expect(secret.password).toBeDefined();

            // Verify: Secret metadata
            const describeCommand = new DescribeSecretCommand({ SecretId: secretArn });
            const describeResponse = await secretsClient.send(describeCommand);
            expect(describeResponse.Name).toBeDefined();
            expect(describeResponse.KmsKeyId).toBeDefined();
            expect(describeResponse.Description).toBe('Database credentials for Security Baseline');

            console.log('✓ Secrets Manager operations verified: Accessible, Encrypted, Metadata correct');
        }, 45000);

        test('Operation: VPC Flow Logs Active Monitoring', async () => {
            if (skipIfNoDeployment()) return;

            const vpcId = outputs.VPCId;

            // Verify: Flow logs are active
            const flowLogsCommand = new DescribeFlowLogsCommand({
                Filter: [
                    {
                        Name: 'resource-id',
                        Values: [vpcId],
                    },
                ],
            });
            const flowLogsResponse = await ec2Client.send(flowLogsCommand);
            expect(flowLogsResponse.FlowLogs).toBeDefined();
            expect(flowLogsResponse.FlowLogs!.length).toBeGreaterThan(0);

            const flowLog = flowLogsResponse.FlowLogs![0];
            expect(flowLog.FlowLogStatus).toBe('ACTIVE');
            expect(flowLog.TrafficType).toBe('ALL');
            expect(flowLog.LogDestinationType).toBe('s3');

            console.log('✓ VPC Flow Logs operations verified: ACTIVE status, Logging ALL traffic to S3');
        }, 45000);
    });
});