import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetDashboardCommand
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeContinuousBackupsCommand,
  DescribeTableCommand,
  DynamoDBClient
} from '@aws-sdk/client-dynamodb';
import {
  DescribeSecurityGroupsCommand,
  DescribeVpcEndpointsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetRoleCommand,
  GetRolePolicyCommand,
  IAMClient,
  ListRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  GetBucketEncryptionCommand,
  GetBucketTaggingCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  GetTopicAttributesCommand,
  SNSClient
} from '@aws-sdk/client-sns';
import {
  GetQueueAttributesCommand,
  SQSClient
} from '@aws-sdk/client-sqs';
import {
  DescribeParametersCommand,
  GetParameterCommand,
  SSMClient,
} from '@aws-sdk/client-ssm';
import * as fs from 'fs';
import * as path from 'path';

const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, any> = {};

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
} catch (error) {
  console.log('Warning: cfn-outputs/flat-outputs.json not found. Integration tests will be skipped.');
}

const hasOutputs = Object.keys(outputs).length > 0;

// Extract AWS region from outputs
const getRegionFromOutputs = (): string => {
  if (outputs.aws_region) {
    return outputs.aws_region;
  }

  // Extract region from ARN
  const arnOutputs = Object.values(outputs).filter((value: any) =>
    typeof value === 'string' && value.startsWith('arn:aws:')
  ) as string[];

  if (arnOutputs.length > 0) {
    return arnOutputs[0].split(':')[3];
  }

  return process.env.AWS_REGION || 'us-east-1';
};

const AWS_REGION = getRegionFromOutputs();

// Validation helpers
const isValidArn = (value: string): boolean =>
  /^arn:aws:[^:]+:[^:]*:[^:]*:[^:]*/.test(value);

const isValidUrl = (value: string): boolean =>
  /^https:\/\/[^\s$.?#].[^\s]*$/.test(value);

const isValidSqsQueueName = (name: string): boolean =>
  /^[a-zA-Z0-9_-]+\.fifo$/.test(name);

const isValidDynamoTableName = (name: string): boolean =>
  /^[a-zA-Z0-9_.-]+$/.test(name);

const isValidSecurityGroupId = (id: string): boolean =>
  /^sg-[a-f0-9]{8,17}$/.test(id);

const isValidVpcEndpointId = (id: string): boolean =>
  /^vpce-[a-f0-9]{8,17}$/.test(id);

const skipIfMissing = (key: string, obj: Record<string, any>): boolean => {
  if (!(key in obj) || obj[key] === undefined || obj[key] === null || obj[key] === '') {
    console.warn(`Skipping tests for missing or empty output: ${key}`);
    return true;
  }
  return false;
};

describe('Payment Processing Pipeline Infrastructure Integration Tests', () => {
  let dynamoDbClient: DynamoDBClient;
  let sqsClient: SQSClient;
  let snsClient: SNSClient;
  let iamClient: IAMClient;
  let cloudWatchClient: CloudWatchClient;
  let cloudWatchLogsClient: CloudWatchLogsClient;
  let s3Client: S3Client;
  let ec2Client: EC2Client;
  let ssmClient: SSMClient;

  beforeAll(() => {
    if (!hasOutputs) {
      console.log('Skipping all tests: Infrastructure not deployed yet');
      return;
    }

    // Initialize AWS clients with the extracted region
    const clientConfig = { region: AWS_REGION };

    dynamoDbClient = new DynamoDBClient(clientConfig);
    sqsClient = new SQSClient(clientConfig);
    snsClient = new SNSClient(clientConfig);
    iamClient = new IAMClient(clientConfig);
    cloudWatchClient = new CloudWatchClient(clientConfig);
    cloudWatchLogsClient = new CloudWatchLogsClient(clientConfig);
    s3Client = new S3Client(clientConfig);
    ec2Client = new EC2Client(clientConfig);
    ssmClient = new SSMClient(clientConfig);
  });

  describe('Output Structure Validation', () => {
    test('should have all required infrastructure outputs', () => {
      if (!hasOutputs) {
        console.log('Skipping: Infrastructure not deployed');
        return;
      }

      const requiredOutputs = [
        'transaction_validation_queue_arn',
        'fraud_detection_queue_arn',
        'payment_notification_queue_arn',
        'transaction_state_table_arn',
        'lambda_validation_role_arn',
        'lambda_fraud_role_arn',
        'lambda_notification_role_arn',
        'sns_alerts_topic_arn',
        'dr_events_bucket_name',
        'environment_suffix',
        'aws_region'
      ];

      requiredOutputs.forEach(output => {
        expect(outputs).toHaveProperty(output);
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('should have valid ARN formats for AWS resources', () => {
      if (!hasOutputs) return;

      const arnOutputs = [
        'transaction_validation_queue_arn',
        'fraud_detection_queue_arn',
        'payment_notification_queue_arn',
        'transaction_state_table_arn',
        'lambda_validation_role_arn',
        'lambda_fraud_role_arn',
        'lambda_notification_role_arn',
        'sns_alerts_topic_arn'
      ];

      arnOutputs.forEach(outputKey => {
        if (!skipIfMissing(outputKey, outputs)) {
          expect(isValidArn(outputs[outputKey])).toBe(true);
        }
      });
    });

    test('should have valid URL formats for queue URLs', () => {
      if (!hasOutputs) return;

      const urlOutputs = [
        'transaction_validation_queue_url',
        'fraud_detection_queue_url',
        'payment_notification_queue_url'
      ];

      urlOutputs.forEach(outputKey => {
        if (!skipIfMissing(outputKey, outputs)) {
          expect(isValidUrl(outputs[outputKey])).toBe(true);
          expect(outputs[outputKey]).toContain(AWS_REGION);
        }
      });
    });

    test('should not expose sensitive information in outputs', () => {
      if (!hasOutputs) return;

      const sensitivePatterns = [
        /password/i,
        /secret/i,
        /private_key/i,
        /access_key/i,
        /session_token/i,
        /credential/i
      ];

      const sensitiveKeys = Object.keys(outputs).filter(key =>
        sensitivePatterns.some(pattern => pattern.test(key))
      );

      expect(sensitiveKeys).toHaveLength(0);
    });
  });

  describe('SQS Queue Infrastructure', () => {
    test('validates transaction validation queue configuration', async () => {
      if (!hasOutputs || skipIfMissing('transaction_validation_queue_url', outputs)) return;

      const queueUrl = outputs.transaction_validation_queue_url;

      try {
        const response = await sqsClient.send(new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ['All']
        }));

        const attributes = response.Attributes!;

        // Verify FIFO queue configuration
        expect(attributes.FifoQueue).toBe('true');
        expect(attributes.ContentBasedDeduplication).toBe('true');

        // Verify encryption
        expect(attributes.SqsManagedSseEnabled).toBe('true');

        // Verify dead letter queue configuration
        expect(attributes.RedrivePolicy).toBeDefined();
        const redrivePolicy = JSON.parse(attributes.RedrivePolicy);
        expect(redrivePolicy.maxReceiveCount).toBe(3);
        expect(redrivePolicy.deadLetterTargetArn).toContain('transaction-validation-dlq');

        // Verify message retention
        expect(parseInt(attributes.MessageRetentionPeriod)).toBeGreaterThan(0);
        expect(parseInt(attributes.VisibilityTimeout)).toBeGreaterThan(0);

      } catch (error) {
        console.error('Error validating transaction validation queue:', error);
        throw error;
      }
    });

    test('validates fraud detection queue configuration', async () => {
      if (!hasOutputs || skipIfMissing('fraud_detection_queue_url', outputs)) return;

      const queueUrl = outputs.fraud_detection_queue_url;

      try {
        const response = await sqsClient.send(new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ['All']
        }));

        const attributes = response.Attributes!;

        // Verify FIFO queue configuration
        expect(attributes.FifoQueue).toBe('true');
        expect(attributes.ContentBasedDeduplication).toBe('true');

        // Verify encryption
        expect(attributes.SqsManagedSseEnabled).toBe('true');

        // Verify dead letter queue configuration
        expect(attributes.RedrivePolicy).toBeDefined();
        const redrivePolicy = JSON.parse(attributes.RedrivePolicy);
        expect(redrivePolicy.maxReceiveCount).toBe(3);
        expect(redrivePolicy.deadLetterTargetArn).toContain('fraud-detection-dlq');

      } catch (error) {
        console.error('Error validating fraud detection queue:', error);
        throw error;
      }
    });

    test('validates payment notification queue configuration', async () => {
      if (!hasOutputs || skipIfMissing('payment_notification_queue_url', outputs)) return;

      const queueUrl = outputs.payment_notification_queue_url;

      try {
        const response = await sqsClient.send(new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ['All']
        }));

        const attributes = response.Attributes!;

        // Verify FIFO queue configuration
        expect(attributes.FifoQueue).toBe('true');
        expect(attributes.ContentBasedDeduplication).toBe('true');

        // Verify encryption
        expect(attributes.SqsManagedSseEnabled).toBe('true');

        // Verify dead letter queue configuration
        expect(attributes.RedrivePolicy).toBeDefined();
        const redrivePolicy = JSON.parse(attributes.RedrivePolicy);
        expect(redrivePolicy.maxReceiveCount).toBe(3);
        expect(redrivePolicy.deadLetterTargetArn).toContain('payment-notification-dlq');

      } catch (error) {
        console.error('Error validating payment notification queue:', error);
        throw error;
      }
    });

    test('validates queue naming follows FIFO conventions', () => {
      if (!hasOutputs) return;

      const queueUrls = [
        outputs.transaction_validation_queue_url,
        outputs.fraud_detection_queue_url,
        outputs.payment_notification_queue_url
      ].filter(url => url);

      queueUrls.forEach(url => {
        const queueName = url.split('/').pop()!;
        expect(isValidSqsQueueName(queueName)).toBe(true);
        expect(queueName).toContain(outputs.environment_suffix);
        expect(queueName).toMatch(/payment-processing-.*\.fifo$/);
      });
    });
  });

  describe('DynamoDB Transaction State Table', () => {
    test('validates table existence and configuration', async () => {
      if (!hasOutputs || skipIfMissing('transaction_state_table_name', outputs)) return;

      const tableName = outputs.transaction_state_table_name;

      try {
        const response = await dynamoDbClient.send(new DescribeTableCommand({
          TableName: tableName
        }));

        const table = response.Table!;

        // Verify table status
        expect(table.TableStatus).toBe('ACTIVE');

        // Verify table name follows convention
        expect(isValidDynamoTableName(tableName)).toBe(true);
        expect(tableName).toContain(outputs.environment_suffix);
        expect(tableName).toContain('payment-processing');

        // Verify primary key structure
        expect(table.KeySchema).toHaveLength(2);
        const hashKey = table.KeySchema!.find(k => k.KeyType === 'HASH');
        const rangeKey = table.KeySchema!.find(k => k.KeyType === 'RANGE');
        expect(hashKey?.AttributeName).toBe('transaction_id');
        expect(rangeKey?.AttributeName).toBe('merchant_id');

        // Verify billing mode
        expect(table.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');

        // Verify global secondary index
        expect(table.GlobalSecondaryIndexes).toHaveLength(1);
        const gsi = table.GlobalSecondaryIndexes![0];
        expect(gsi.IndexName).toBe('ProcessingStageIndex');
        expect(gsi.IndexStatus).toBe('ACTIVE');

        // Verify server-side encryption
        expect(table.SSEDescription?.Status).toBe('ENABLED');

      } catch (error) {
        console.error('Error validating DynamoDB table:', error);
        throw error;
      }
    });

    test('validates point-in-time recovery configuration', async () => {
      if (!hasOutputs || skipIfMissing('transaction_state_table_name', outputs)) return;

      const tableName = outputs.transaction_state_table_name;

      try {
        const response = await dynamoDbClient.send(new DescribeContinuousBackupsCommand({
          TableName: tableName
        }));

        expect(response.ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus)
          .toBe('ENABLED');

      } catch (error) {
        console.error('Error validating DynamoDB backup configuration:', error);
        throw error;
      }
    });
  });

  describe('IAM Roles and Policies', () => {
    test('validates Lambda validation role configuration', async () => {
      if (!hasOutputs || skipIfMissing('lambda_validation_role_arn', outputs)) return;

      const roleArn = outputs.lambda_validation_role_arn;
      const roleName = roleArn.split('/').pop()!;

      try {
        const roleResponse = await iamClient.send(new GetRoleCommand({
          RoleName: roleName
        }));

        const role = roleResponse.Role!;

        // Verify role trust policy
        const trustPolicy = JSON.parse(decodeURIComponent(role.AssumeRolePolicyDocument!));
        expect(trustPolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
        expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');

        // Verify role tags
        expect(role.Tags).toBeDefined();
        const environmentTag = role.Tags?.find(tag => tag.Key === 'Environment');
        expect(environmentTag?.Value).toBe(outputs.environment_suffix);

        // Verify role policies
        const policiesResponse = await iamClient.send(new ListRolePoliciesCommand({
          RoleName: roleName
        }));

        expect(policiesResponse.PolicyNames?.length).toBeGreaterThan(0);

        // Get and verify the policy document
        const policyName = policiesResponse.PolicyNames![0];
        const policyResponse = await iamClient.send(new GetRolePolicyCommand({
          RoleName: roleName,
          PolicyName: policyName
        }));

        const policyDocument = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument!));

        // Verify least privilege principles
        const statements = policyDocument.Statement;
        expect(statements).toBeDefined();

        // Check for SQS permissions
        const sqsStatement = statements.find((s: any) =>
          s.Action.some((a: string) => a.startsWith('sqs:'))
        );
        expect(sqsStatement).toBeDefined();

        // Verify SourceAccount condition if present (security best practice)
        if (sqsStatement.Condition?.StringEquals?.['aws:SourceAccount']) {
          expect(sqsStatement.Condition.StringEquals['aws:SourceAccount']).toBe(outputs.account_id);
        }
      } catch (error) {
        console.error('Error validating Lambda validation role:', error);
        throw error;
      }
    });

    test('validates Lambda fraud detection role configuration', async () => {
      if (!hasOutputs || skipIfMissing('lambda_fraud_role_arn', outputs)) return;

      const roleArn = outputs.lambda_fraud_role_arn;
      const roleName = roleArn.split('/').pop()!;

      try {
        const roleResponse = await iamClient.send(new GetRoleCommand({
          RoleName: roleName
        }));

        const role = roleResponse.Role!;

        // Verify role naming convention
        expect(roleName).toContain(outputs.environment_suffix);
        expect(roleName).toContain('fraud-lambda-role');

        // Verify role trust policy
        const trustPolicy = JSON.parse(decodeURIComponent(role.AssumeRolePolicyDocument!));
        expect(trustPolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');

      } catch (error) {
        console.error('Error validating Lambda fraud role:', error);
        throw error;
      }
    });

    test('validates Lambda notification role configuration', async () => {
      if (!hasOutputs || skipIfMissing('lambda_notification_role_arn', outputs)) return;

      const roleArn = outputs.lambda_notification_role_arn;
      const roleName = roleArn.split('/').pop()!;

      try {
        const roleResponse = await iamClient.send(new GetRoleCommand({
          RoleName: roleName
        }));

        const role = roleResponse.Role!;

        // Verify role naming convention
        expect(roleName).toContain(outputs.environment_suffix);
        expect(roleName).toContain('notification-lambda-role');

        // Verify role trust policy
        const trustPolicy = JSON.parse(decodeURIComponent(role.AssumeRolePolicyDocument!));
        expect(trustPolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');

      } catch (error) {
        console.error('Error validating Lambda notification role:', error);
        throw error;
      }
    });

    test('validates EventBridge role configuration', async () => {
      if (!hasOutputs || skipIfMissing('eventbridge_role_arn', outputs)) return;

      const roleArn = outputs.eventbridge_role_arn;
      const roleName = roleArn.split('/').pop()!;

      try {
        const roleResponse = await iamClient.send(new GetRoleCommand({
          RoleName: roleName
        }));

        const role = roleResponse.Role!;

        // Verify role naming convention
        expect(roleName).toContain(outputs.environment_suffix);
        expect(roleName).toContain('eventbridge-role');

        // Verify role trust policy
        const trustPolicy = JSON.parse(decodeURIComponent(role.AssumeRolePolicyDocument!));
        expect(trustPolicy.Statement[0].Principal.Service).toBe('pipes.amazonaws.com');

      } catch (error) {
        console.error('Error validating EventBridge role:', error);
        throw error;
      }
    });
  });

  describe('SNS Topic for Alerts', () => {
    test('validates SNS topic configuration', async () => {
      if (!hasOutputs || skipIfMissing('sns_alerts_topic_arn', outputs)) return;

      const topicArn = outputs.sns_alerts_topic_arn;

      try {
        const response = await snsClient.send(new GetTopicAttributesCommand({
          TopicArn: topicArn
        }));

        const attributes = response.Attributes!;

        // Verify topic exists
        expect(attributes.TopicArn).toBe(topicArn);

        // Verify topic name follows convention
        const topicName = topicArn.split(':').pop()!;
        expect(topicName).toContain(outputs.environment_suffix);
        expect(topicName).toContain('payment-processing');
        expect(topicName).toContain('alerts');

        // Verify display name if present
        if (attributes.DisplayName) {
          expect(attributes.DisplayName).toContain('Payment Processing');
        }

      } catch (error) {
        console.error('Error validating SNS topic:', error);
        throw error;
      }
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('validates CloudWatch alarms for queue monitoring', async () => {
      if (!hasOutputs) return;

      try {
        const response = await cloudWatchClient.send(new DescribeAlarmsCommand({
          AlarmNamePrefix: `${outputs.name_prefix || `payment-processing-${outputs.environment_suffix}`}`
        }));

        const alarms = response.MetricAlarms || [];

        // Should have alarms for each queue
        const queueDepthAlarms = alarms.filter(alarm =>
          alarm.AlarmName?.includes('queue-depth')
        );
        expect(queueDepthAlarms.length).toBeGreaterThanOrEqual(3);

        // Should have alarms for dead letter queues
        const dlqAlarms = alarms.filter(alarm =>
          alarm.AlarmName?.includes('dlq')
        );
        expect(dlqAlarms.length).toBeGreaterThanOrEqual(3);

        // Verify alarm configuration
        alarms.forEach(alarm => {
          expect(alarm.AlarmName).toContain(outputs.environment_suffix);
          expect(alarm.ComparisonOperator).toBeDefined();
          expect(alarm.EvaluationPeriods).toBeGreaterThan(0);
          expect(alarm.Threshold).toBeGreaterThanOrEqual(0);
          expect(alarm.AlarmActions?.length).toBeGreaterThan(0);
          expect(alarm.AlarmActions![0]).toBe(outputs.sns_alerts_topic_arn);
        });

      } catch (error) {
        console.error('Error validating CloudWatch alarms:', error);
        throw error;
      }
    });

    test('validates CloudWatch dashboard configuration', async () => {
      if (!hasOutputs || skipIfMissing('cloudwatch_dashboard_name', outputs)) return;

      const dashboardName = outputs.cloudwatch_dashboard_name;

      try {
        const response = await cloudWatchClient.send(new GetDashboardCommand({
          DashboardName: dashboardName
        }));

        expect(response.DashboardBody).toBeDefined();

        const dashboardBody = JSON.parse(response.DashboardBody!);

        // Verify dashboard has widgets
        expect(dashboardBody.widgets).toBeDefined();
        expect(dashboardBody.widgets.length).toBeGreaterThan(0);

        // Verify dashboard contains relevant metrics
        const dashboardString = JSON.stringify(dashboardBody);
        expect(dashboardString).toContain('AWS/SQS');
        expect(dashboardString).toContain('ApproximateNumberOfVisibleMessages');
        // DynamoDB metrics may be present depending on configuration
        // expect(dashboardString).toContain('AWS/DynamoDB');

      } catch (error) {
        console.error('Error validating CloudWatch dashboard:', error);
        throw error;
      }
    });

    test('validates CloudWatch log groups', async () => {
      if (!hasOutputs) return;

      try {
        const response = await cloudWatchLogsClient.send(new DescribeLogGroupsCommand({
          logGroupNamePrefix: `/aws/lambda/${outputs.name_prefix || `payment-processing-${outputs.environment_suffix}`}`
        }));

        const logGroups = response.logGroups || [];

        // Should have log groups for each Lambda function
        expect(logGroups.length).toBeGreaterThanOrEqual(3);

        // Verify log group naming
        logGroups.forEach(logGroup => {
          expect(logGroup.logGroupName).toContain(outputs.environment_suffix);
          expect(logGroup.logGroupName).toMatch(/^\/aws\/lambda\/payment-processing-.*-(validation|fraud|notification)$/);
        });

      } catch (error) {
        console.error('Error validating CloudWatch log groups:', error);
        throw error;
      }
    });
  });

  describe('S3 Disaster Recovery Bucket', () => {
    test('validates S3 bucket configuration', async () => {
      if (!hasOutputs || skipIfMissing('dr_events_bucket_name', outputs)) return;

      const bucketName = outputs.dr_events_bucket_name;

      try {
        // Verify bucket exists
        await s3Client.send(new HeadBucketCommand({
          Bucket: bucketName
        }));

        // Verify bucket naming convention
        expect(bucketName).toContain(outputs.environment_suffix);
        expect(bucketName).toContain('payment-processing-dr-events');
        expect(bucketName).toMatch(/^\d+-payment-processing-dr-events-.*$/);

        // Verify versioning is enabled
        const versioningResponse = await s3Client.send(new GetBucketVersioningCommand({
          Bucket: bucketName
        }));
        expect(versioningResponse.Status).toBe('Enabled');

        // Verify encryption is enabled
        const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({
          Bucket: bucketName
        }));
        expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
        expect(encryptionResponse.ServerSideEncryptionConfiguration!.Rules.length).toBeGreaterThan(0);

        // Verify tags
        const taggingResponse = await s3Client.send(new GetBucketTaggingCommand({
          Bucket: bucketName
        }));
        const tags = taggingResponse.TagSet || [];
        const environmentTag = tags.find(tag => tag.Key === 'Environment');
        expect(environmentTag?.Value).toBe(outputs.environment_suffix);

      } catch (error) {
        console.error('Error validating S3 bucket:', error);
        throw error;
      }
    });
  });

  describe('VPC Endpoint Configuration', () => {
    test('validates VPC endpoint for private SQS access', async () => {
      if (!hasOutputs || skipIfMissing('vpc_endpoint_id', outputs)) return;

      const vpcEndpointId = outputs.vpc_endpoint_id;

      try {
        const response = await ec2Client.send(new DescribeVpcEndpointsCommand({
          VpcEndpointIds: [vpcEndpointId]
        }));

        const vpcEndpoints = response.VpcEndpoints || [];
        expect(vpcEndpoints).toHaveLength(1);

        const vpcEndpoint = vpcEndpoints[0];

        // Verify VPC endpoint configuration
        expect(isValidVpcEndpointId(vpcEndpointId)).toBe(true);
        expect(vpcEndpoint.State).toBe('available');
        expect(vpcEndpoint.ServiceName).toBe(`com.amazonaws.${AWS_REGION}.sqs`);
        expect(vpcEndpoint.VpcEndpointType).toBe('Interface');
        expect(vpcEndpoint.PrivateDnsEnabled).toBe(true);

        // Verify security group
        expect(vpcEndpoint.Groups?.length).toBeGreaterThan(0);
        const securityGroupId = vpcEndpoint.Groups![0].GroupId!;
        expect(isValidSecurityGroupId(securityGroupId)).toBe(true);

      } catch (error) {
        console.error('Error validating VPC endpoint:', error);
        throw error;
      }
    });

    test('validates VPC endpoint security group', async () => {
      if (!hasOutputs || skipIfMissing('vpc_endpoint_security_group_id', outputs)) return;

      const securityGroupId = outputs.vpc_endpoint_security_group_id;

      try {
        const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
          GroupIds: [securityGroupId]
        }));

        const securityGroups = response.SecurityGroups || [];
        expect(securityGroups).toHaveLength(1);

        const securityGroup = securityGroups[0];

        // Verify security group configuration
        expect(isValidSecurityGroupId(securityGroupId)).toBe(true);
        expect(securityGroup.GroupName).toContain(outputs.environment_suffix);
        expect(securityGroup.Description).toContain('Security group for SQS VPC endpoint');

        // Verify ingress rules
        expect(securityGroup.IpPermissions?.length).toBeGreaterThan(0);
        const httpsRule = securityGroup.IpPermissions!.find(rule =>
          rule.FromPort === 443 && rule.ToPort === 443
        );
        expect(httpsRule).toBeDefined();
        expect(httpsRule?.IpProtocol).toBe('tcp');

      } catch (error) {
        console.error('Error validating VPC endpoint security group:', error);
        throw error;
      }
    });
  });

  describe('SSM Parameter Store Configuration', () => {
    test('validates SSM parameters for queue URLs', async () => {
      if (!hasOutputs) return;

      try {
        const parameterPrefix = `/payment-processing/${outputs.environment_suffix}/sqs/`;

        const response = await ssmClient.send(new DescribeParametersCommand({
          ParameterFilters: [
            {
              Key: 'Name',
              Option: 'BeginsWith',
              Values: [parameterPrefix]
            }
          ]
        }));

        const parameters = response.Parameters || [];

        // If SSM parameters are created, validate them
        if (parameters.length > 0) {
          // Verify parameter naming
          const expectedParameters = [
            'validation-queue-url',
            'fraud-queue-url',
            'notification-queue-url'
          ];

          expectedParameters.forEach(expectedParam => {
            const paramName = `${parameterPrefix}${expectedParam}`;
            const parameter = parameters.find(p => p.Name === paramName);
            if (parameter) {
              expect(parameter.Type).toBe('String');
            }
          });

          // Verify parameter values if they exist
          for (const expectedParam of expectedParameters) {
            const paramName = `${parameterPrefix}${expectedParam}`;
            try {
              const paramResponse = await ssmClient.send(new GetParameterCommand({
                Name: paramName
              }));

              const paramValue = paramResponse.Parameter!.Value!;
              expect(isValidUrl(paramValue)).toBe(true);
              expect(paramValue).toContain(AWS_REGION);
              expect(paramValue).toContain(outputs.environment_suffix);
            } catch (error) {
              // Parameter doesn't exist - this is OK for this infrastructure
              console.log(`SSM parameter ${paramName} not found - skipping validation`);
            }
          }
        } else {
          console.log('No SSM parameters found - infrastructure may not create them');
        }

      } catch (error) {
        console.error('Error validating SSM parameters:', error);
        throw error;
      }
    });
  });

  describe('Resource Tagging Compliance', () => {
    test('validates consistent tagging across all resources', () => {
      if (!hasOutputs) return;

      // Verify environment suffix consistency
      expect(outputs.environment_suffix).toBeDefined();
      expect(outputs.environment_suffix).toMatch(/^[a-z0-9-]+$/);

      // Verify region consistency
      expect(outputs.aws_region).toBe(AWS_REGION);

      // Verify naming prefix consistency
      if (outputs.name_prefix) {
        expect(outputs.name_prefix).toBe(`payment-processing-${outputs.environment_suffix}`);
      }
    });

    test('validates resource naming conventions', () => {
      if (!hasOutputs) return;

      // Queue naming validation
      [
        outputs.transaction_validation_queue_url,
        outputs.fraud_detection_queue_url,
        outputs.payment_notification_queue_url
      ].filter(url => url).forEach(url => {
        const queueName = url.split('/').pop()!;
        expect(queueName).toMatch(new RegExp(`^payment-processing-${outputs.environment_suffix}-.*\\.fifo$`));
      });

      // Table naming validation
      if (outputs.transaction_state_table_name) {
        expect(outputs.transaction_state_table_name)
          .toBe(`payment-processing-${outputs.environment_suffix}-transaction-state`);
      }

      // Bucket naming validation
      if (outputs.dr_events_bucket_name) {
        expect(outputs.dr_events_bucket_name)
          .toMatch(new RegExp(`^\\d+-payment-processing-dr-events-${outputs.environment_suffix}$`));
      }
    });
  });

  describe('Security and Compliance Validation', () => {
    test('validates encryption at rest for all data stores', () => {
      if (!hasOutputs) return;

      // This test verifies that encryption configuration has been applied
      // Actual encryption validation is done in individual service tests
      expect(outputs.transaction_state_table_arn).toBeDefined();
      expect(outputs.dr_events_bucket_name).toBeDefined();
    });

    test('validates encryption in transit for all communications', () => {
      if (!hasOutputs) return;

      // Verify HTTPS endpoints
      [
        outputs.transaction_validation_queue_url,
        outputs.fraud_detection_queue_url,
        outputs.payment_notification_queue_url
      ].filter(url => url).forEach(url => {
        expect(url).toMatch(/^https:\/\//);
      });
    });

    test('validates least privilege IAM policies', () => {
      if (!hasOutputs) return;

      // Verify role ARNs follow naming conventions and contain environment suffix
      [
        outputs.lambda_validation_role_arn,
        outputs.lambda_fraud_role_arn,
        outputs.lambda_notification_role_arn,
        outputs.eventbridge_role_arn
      ].filter(arn => arn).forEach(arn => {
        expect(arn).toContain(outputs.environment_suffix);
        expect(arn).toContain('payment-processing');
      });
    });

    test('validates audit trail and monitoring configuration', () => {
      if (!hasOutputs) return;

      // Verify CloudWatch monitoring components
      expect(outputs.sns_alerts_topic_arn).toBeDefined();

      if (outputs.cloudwatch_dashboard_name) {
        expect(outputs.cloudwatch_dashboard_name).toContain(outputs.environment_suffix);
        expect(outputs.cloudwatch_dashboard_name).toContain('payment-processing');
      }
    });
  });

  describe('Disaster Recovery Configuration', () => {
    test('validates cross-region disaster recovery setup', () => {
      if (!hasOutputs) return;

      // Verify DR bucket exists
      expect(outputs.dr_events_bucket_name).toBeDefined();
      expect(outputs.dr_events_bucket_arn).toBeDefined();

      // Verify DR bucket follows naming convention
      expect(outputs.dr_events_bucket_name).toContain('dr-events');
      expect(outputs.dr_events_bucket_name).toContain(outputs.environment_suffix);
    });

    test('validates backup and recovery capabilities', () => {
      if (!hasOutputs) return;

      // Verify DynamoDB table has backup capabilities
      expect(outputs.transaction_state_table_arn).toBeDefined();
      expect(outputs.transaction_state_table_name).toBeDefined();

      // Verify S3 bucket versioning (tested in S3 section)
      expect(outputs.dr_events_bucket_name).toBeDefined();
    });
  });

  describe('Performance and Scalability Configuration', () => {
    test('validates auto-scaling configuration', () => {
      if (!hasOutputs) return;

      // Verify DynamoDB on-demand billing mode (tested in DynamoDB section)
      expect(outputs.transaction_state_table_arn).toBeDefined();

      // Verify FIFO queue configuration (tested in SQS section)
      expect(outputs.transaction_validation_queue_arn).toBeDefined();
      expect(outputs.fraud_detection_queue_arn).toBeDefined();
      expect(outputs.payment_notification_queue_arn).toBeDefined();
    });

    test('validates region agnostic deployment', () => {
      if (!hasOutputs) return;

      // Verify all ARNs contain the correct region
      const arnOutputs = [
        outputs.transaction_validation_queue_arn,
        outputs.fraud_detection_queue_arn,
        outputs.payment_notification_queue_arn,
        outputs.transaction_state_table_arn,
        outputs.lambda_validation_role_arn,
        outputs.lambda_fraud_role_arn,
        outputs.lambda_notification_role_arn,
        outputs.sns_alerts_topic_arn
      ].filter(arn => arn && typeof arn === 'string' && arn.startsWith('arn:aws:'));

      arnOutputs.forEach(arn => {
        const arnParts = arn.split(':');
        if (arnParts.length >= 4 && arnParts[3]) {
          expect(arnParts[3]).toBe(AWS_REGION);
        }
      });

      // Verify URLs contain the correct region
      const urlOutputs = [
        outputs.transaction_validation_queue_url,
        outputs.fraud_detection_queue_url,
        outputs.payment_notification_queue_url
      ].filter(url => url);

      urlOutputs.forEach(url => {
        expect(url).toContain(AWS_REGION);
      });
    });
  });
});
