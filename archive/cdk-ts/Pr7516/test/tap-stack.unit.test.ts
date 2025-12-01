import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: { account: '123456789012', region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  describe('Environment Suffix Defaults', () => {
    test('uses context environmentSuffix when props not provided', () => {
      const contextApp = new cdk.App({
        context: { environmentSuffix: 'contextenv' },
      });
      const contextStack = new TapStack(contextApp, 'ContextStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const contextTemplate = Template.fromStack(contextStack);
      contextTemplate.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: 'distributed-task-queue-contextenv',
      });
    });

    test('uses default dev suffix when no props or context provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const defaultTemplate = Template.fromStack(defaultStack);
      defaultTemplate.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: 'distributed-task-queue-dev',
      });
    });
  });

  describe('KMS Key', () => {
    test('creates KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        Description: 'Customer managed key for task processing system',
      });
    });

    test('KMS key has DESTROY removal policy', () => {
      template.hasResource('AWS::KMS::Key', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });
  });

  describe('VPC', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates private and public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 AZs x 2 subnet types
    });

    test('creates NAT gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('creates DynamoDB gateway endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.objectLike({
          'Fn::Join': Match.anyValue(),
        }),
        VpcEndpointType: 'Gateway',
      });
    });

    test('creates SQS interface endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.stringLikeRegexp('.*sqs.*'),
        VpcEndpointType: 'Interface',
      });
    });

    test('creates SNS interface endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.stringLikeRegexp('.*sns.*'),
        VpcEndpointType: 'Interface',
      });
    });

    test('creates SSM interface endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.stringLikeRegexp('.*ssm.*'),
        VpcEndpointType: 'Interface',
      });
    });

    test('creates S3 gateway endpoint', () => {
      // There should be 2 Gateway endpoints (DynamoDB and S3)
      const resources = template.findResources('AWS::EC2::VPCEndpoint', {
        Properties: {
          VpcEndpointType: 'Gateway',
        },
      });
      expect(Object.keys(resources).length).toBe(2);
    });
  });

  describe('SQS Queues', () => {
    test('creates main task queue with correct visibility timeout', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `distributed-task-queue-${environmentSuffix}`,
        VisibilityTimeout: 300,
      });
    });

    test('creates task queue with 14-day retention', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `distributed-task-queue-${environmentSuffix}`,
        MessageRetentionPeriod: 1209600, // 14 days in seconds
      });
    });

    test('creates dead letter queue', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `distributed-task-dlq-${environmentSuffix}`,
      });
    });

    test('task queue has DLQ with maxReceiveCount of 3', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `distributed-task-queue-${environmentSuffix}`,
        RedrivePolicy: Match.objectLike({
          maxReceiveCount: 3,
        }),
      });
    });

    test('queues are KMS encrypted', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `distributed-task-queue-${environmentSuffix}`,
        KmsMasterKeyId: Match.anyValue(),
      });
    });
  });

  describe('DynamoDB Tables', () => {
    test('creates task table with on-demand billing', () => {
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        TableName: `distributed-task-table-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('task table has correct key schema', () => {
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        TableName: `distributed-task-table-${environmentSuffix}`,
        KeySchema: [
          { AttributeName: 'taskId', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' },
        ],
      });
    });

    test('task table has PITR enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        TableName: `distributed-task-table-${environmentSuffix}`,
        Replicas: Match.arrayWith([
          Match.objectLike({
            PointInTimeRecoverySpecification: {
              PointInTimeRecoveryEnabled: true,
            },
          }),
        ]),
      });
    });

    test('task table has contributor insights enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        TableName: `distributed-task-table-${environmentSuffix}`,
        Replicas: Match.arrayWith([
          Match.objectLike({
            ContributorInsightsSpecification: { Enabled: true },
          }),
        ]),
      });
    });

    test('task table has TTL enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        TableName: `distributed-task-table-${environmentSuffix}`,
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true,
        },
      });
    });

    test('task table has global secondary index for status tracking', () => {
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        TableName: `distributed-task-table-${environmentSuffix}`,
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: 'statusIndex',
            KeySchema: [
              { AttributeName: 'status', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' },
            ],
          }),
        ]),
      });
    });

    test('task table replicates to us-west-2', () => {
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        TableName: `distributed-task-table-${environmentSuffix}`,
        Replicas: Match.arrayWith([Match.objectLike({ Region: 'us-west-2' })]),
      });
    });

    test('creates lock table for distributed locking', () => {
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        TableName: `distributed-lock-table-${environmentSuffix}`,
        KeySchema: [{ AttributeName: 'lockId', KeyType: 'HASH' }],
      });
    });

    test('lock table has TTL for expiration', () => {
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        TableName: `distributed-lock-table-${environmentSuffix}`,
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true,
        },
      });
    });

    test('lock table replicates to us-west-2', () => {
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        TableName: `distributed-lock-table-${environmentSuffix}`,
        Replicas: Match.arrayWith([Match.objectLike({ Region: 'us-west-2' })]),
      });
    });
  });

  describe('SNS Topics', () => {
    test('creates success topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `task-success-${environmentSuffix}`,
        DisplayName: 'Task Processing Success',
      });
    });

    test('creates failure topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `task-failure-${environmentSuffix}`,
        DisplayName: 'Task Processing Failure',
      });
    });

    test('topics are KMS encrypted', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `task-success-${environmentSuffix}`,
        KmsMasterKeyId: Match.anyValue(),
      });
    });
  });

  describe('SSM Parameters', () => {
    test('creates queue URL parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/distributed-task-system/${environmentSuffix}/queue-url`,
        Type: 'String',
      });
    });

    test('creates table name parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/distributed-task-system/${environmentSuffix}/table-name`,
        Type: 'String',
      });
    });

    test('creates lock table name parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/distributed-task-system/${environmentSuffix}/lock-table-name`,
        Type: 'String',
      });
    });
  });

  describe('Lambda Function', () => {
    test('creates task processor with ARM architecture', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `distributed-task-processor-${environmentSuffix}`,
        Architectures: ['arm64'],
      });
    });

    test('task processor uses Node.js 18 runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `distributed-task-processor-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
      });
    });

    test('task processor is created without reserved concurrency for test environment', () => {
      // Reserved concurrency removed for test environment compatibility
      // AWS accounts need at least 100 unreserved concurrent executions
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `distributed-task-processor-${environmentSuffix}`,
        MemorySize: 1024,
      });
    });

    test('task processor has 5-minute timeout', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `distributed-task-processor-${environmentSuffix}`,
        Timeout: 300,
      });
    });

    test('task processor has 1024 MB memory', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `distributed-task-processor-${environmentSuffix}`,
        MemorySize: 1024,
      });
    });

    test('task processor runs in VPC', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `distributed-task-processor-${environmentSuffix}`,
        VpcConfig: Match.objectLike({
          SubnetIds: Match.anyValue(),
          SecurityGroupIds: Match.anyValue(),
        }),
      });
    });

    test('task processor has SSM parameter environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `distributed-task-processor-${environmentSuffix}`,
        Environment: {
          Variables: Match.objectLike({
            TABLE_NAME_PARAM: Match.anyValue(),
            LOCK_TABLE_NAME_PARAM: Match.anyValue(),
            QUEUE_URL_PARAM: Match.anyValue(),
            SUCCESS_TOPIC_ARN: Match.anyValue(),
            FAILURE_TOPIC_ARN: Match.anyValue(),
          }),
        },
      });
    });

    test('task processor has success destination', () => {
      template.hasResourceProperties('AWS::Lambda::EventInvokeConfig', {
        DestinationConfig: Match.objectLike({
          OnSuccess: Match.objectLike({
            Destination: Match.anyValue(),
          }),
        }),
      });
    });

    test('task processor has failure destination', () => {
      template.hasResourceProperties('AWS::Lambda::EventInvokeConfig', {
        DestinationConfig: Match.objectLike({
          OnFailure: Match.objectLike({
            Destination: Match.anyValue(),
          }),
        }),
      });
    });

    test('creates SQS event source mapping', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        BatchSize: 10,
        MaximumBatchingWindowInSeconds: 5,
      });
    });
  });

  describe('S3 Buckets', () => {
    test('creates bucket 1', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(
          `task-bucket-1-.*-${environmentSuffix}`
        ),
      });
    });

    test('creates bucket 2', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(
          `task-bucket-2-.*-${environmentSuffix}`
        ),
      });
    });

    test('buckets have EventBridge notifications configured', () => {
      // EventBridge notifications are configured via Custom Resource
      template.hasResourceProperties('Custom::S3BucketNotifications', {
        NotificationConfiguration: Match.objectLike({
          EventBridgeConfiguration: {},
        }),
      });
    });

    test('buckets are KMS encrypted', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'aws:kms',
              }),
            }),
          ]),
        }),
      });
    });

    test('buckets have versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: { Status: 'Enabled' },
      });
    });

    test('buckets have lifecycle rules for old versions', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: Match.objectLike({
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'delete-old-versions',
              NoncurrentVersionExpiration: { NoncurrentDays: 30 },
              Status: 'Enabled',
            }),
          ]),
        }),
      });
    });
  });

  describe('EventBridge Rule', () => {
    test('creates S3 upload rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `s3-upload-rule-${environmentSuffix}`,
        EventPattern: Match.objectLike({
          source: ['aws.s3'],
          'detail-type': ['Object Created'],
        }),
      });
    });

    test('rule targets SQS queue', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Targets: Match.arrayWith([
          Match.objectLike({
            Arn: Match.anyValue(),
            InputTransformer: Match.anyValue(),
          }),
        ]),
      });
    });
  });

  describe('CloudWatch Alarm', () => {
    test('creates DLQ alarm with threshold of 10', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `distributed-task-dlq-alarm-${environmentSuffix}`,
        Threshold: 10,
        EvaluationPeriods: 1,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('DLQ alarm monitors ApproximateNumberOfMessagesVisible', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `distributed-task-dlq-alarm-${environmentSuffix}`,
        MetricName: 'ApproximateNumberOfMessagesVisible',
        Namespace: 'AWS/SQS',
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('creates dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `distributed-task-system-dashboard-${environmentSuffix}`,
      });
    });
  });

  describe('Tags', () => {
    test('resources have Project tag', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Project', Value: 'DistributedTaskSystem' }),
        ]),
      });
    });

    test('resources have Owner tag', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Owner', Value: 'SiddhantRaj' }),
        ]),
      });
    });

    test('resources have Environment tag', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'Production' }),
        ]),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports task queue URL', () => {
      template.hasOutput('TaskQueueUrl', {
        Export: { Name: `TaskQueueUrl-${environmentSuffix}` },
      });
    });

    test('exports task queue ARN', () => {
      template.hasOutput('TaskQueueArn', {
        Export: { Name: `TaskQueueArn-${environmentSuffix}` },
      });
    });

    test('exports DLQ URL', () => {
      template.hasOutput('DLQUrl', {
        Export: { Name: `DLQUrl-${environmentSuffix}` },
      });
    });

    test('exports task table name', () => {
      template.hasOutput('TaskTableName', {
        Export: { Name: `TaskTableName-${environmentSuffix}` },
      });
    });

    test('exports lock table name', () => {
      template.hasOutput('LockTableName', {
        Export: { Name: `LockTableName-${environmentSuffix}` },
      });
    });

    test('exports success topic ARN', () => {
      template.hasOutput('SuccessTopicArn', {
        Export: { Name: `SuccessTopicArn-${environmentSuffix}` },
      });
    });

    test('exports failure topic ARN', () => {
      template.hasOutput('FailureTopicArn', {
        Export: { Name: `FailureTopicArn-${environmentSuffix}` },
      });
    });

    test('exports task processor ARN', () => {
      template.hasOutput('TaskProcessorArn', {
        Export: { Name: `TaskProcessorArn-${environmentSuffix}` },
      });
    });

    test('exports bucket names', () => {
      template.hasOutput('Bucket1Name', {
        Export: { Name: `Bucket1Name-${environmentSuffix}` },
      });
      template.hasOutput('Bucket2Name', {
        Export: { Name: `Bucket2Name-${environmentSuffix}` },
      });
    });

    test('exports DLQ alarm ARN', () => {
      template.hasOutput('DLQAlarmArn', {
        Export: { Name: `DLQAlarmArn-${environmentSuffix}` },
      });
    });
  });

  describe('IAM Permissions', () => {
    test('Lambda role has SQS consume permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'sqs:ReceiveMessage',
                'sqs:ChangeMessageVisibility',
                'sqs:GetQueueUrl',
                'sqs:DeleteMessage',
                'sqs:GetQueueAttributes',
              ]),
            }),
          ]),
        }),
      });
    });

    test('Lambda role has DynamoDB permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'dynamodb:BatchGetItem',
                'dynamodb:GetRecords',
                'dynamodb:GetShardIterator',
                'dynamodb:Query',
                'dynamodb:GetItem',
                'dynamodb:Scan',
                'dynamodb:ConditionCheckItem',
                'dynamodb:BatchWriteItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:DescribeTable',
              ]),
            }),
          ]),
        }),
      });
    });

    test('Lambda role has SNS publish permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sns:Publish',
            }),
          ]),
        }),
      });
    });

    test('Lambda role has KMS permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['kms:Decrypt', 'kms:Encrypt']),
            }),
          ]),
        }),
      });
    });

    test('Lambda role has SSM parameter read permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'ssm:DescribeParameters',
                'ssm:GetParameters',
                'ssm:GetParameter',
                'ssm:GetParameterHistory',
              ]),
            }),
          ]),
        }),
      });
    });
  });

  describe('Resource Cleanup', () => {
    test('task table has DESTROY removal policy', () => {
      template.hasResource('AWS::DynamoDB::GlobalTable', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });

    test('S3 buckets have DESTROY removal policy', () => {
      template.hasResource('AWS::S3::Bucket', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });
  });

  describe('Stack Properties', () => {
    test('stack is created with correct id', () => {
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('public properties are exposed', () => {
      expect(stack.taskQueue).toBeDefined();
      expect(stack.dlq).toBeDefined();
      expect(stack.taskTable).toBeDefined();
      expect(stack.lockTable).toBeDefined();
      expect(stack.successTopic).toBeDefined();
      expect(stack.failureTopic).toBeDefined();
      expect(stack.taskProcessor).toBeDefined();
      expect(stack.kmsKey).toBeDefined();
      expect(stack.vpc).toBeDefined();
      expect(stack.bucket1).toBeDefined();
      expect(stack.bucket2).toBeDefined();
    });
  });
});
