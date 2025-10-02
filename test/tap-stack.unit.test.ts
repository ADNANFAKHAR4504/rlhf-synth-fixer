import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
    template = Template.fromStack(stack);
  });

  // ============================================
  // NETWORKING & SECURITY TESTS
  // ============================================

  describe('VPC Configuration', () => {
    test('should create VPC with private isolated subnets', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });

      // Verify no NAT gateways for cost optimization
      template.resourceCountIs('AWS::EC2::NatGateway', 0);
    });

    test('should create VPC endpoints for S3 and DynamoDB', () => {
      // Gateway endpoints for S3
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([Match.stringLikeRegexp('s3')]),
          ]),
        }),
        VpcEndpointType: 'Gateway',
      });

      // Gateway endpoint for DynamoDB
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([Match.stringLikeRegexp('dynamodb')]),
          ]),
        }),
        VpcEndpointType: 'Gateway',
      });
    });

    test('should create interface endpoint for SageMaker Runtime', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([Match.stringLikeRegexp('sagemaker.runtime')]),
          ]),
        }),
        VpcEndpointType: 'Interface',
        PrivateDnsEnabled: true,
      });
    });

    test('should create security group for compute resources', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Lambda and Batch compute resources',
      });
    });
  });

  // ============================================
  // STORAGE & DATA MANAGEMENT TESTS
  // ============================================

  describe('S3 Buckets', () => {
    test('should create model artifacts bucket with versioning', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const modelBucket = Object.values(buckets).find((bucket: any) => {
        const bucketName = bucket.Properties?.BucketName;
        const nameStr = typeof bucketName === 'string' ? bucketName :
          (bucketName?.['Fn::Join'] ? bucketName['Fn::Join'][1]?.join('') : '');
        return nameStr.includes('ml-pipeline-models-prod');
      });

      expect(modelBucket).toBeDefined();
      expect(modelBucket?.Properties?.VersioningConfiguration).toEqual({ Status: 'Enabled' });
      expect(modelBucket?.Properties?.PublicAccessBlockConfiguration).toMatchObject({
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      });
    });

    test('should create data bucket with lifecycle rules', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const dataBucket = Object.values(buckets).find((bucket: any) => {
        const bucketName = bucket.Properties?.BucketName;
        const nameStr = typeof bucketName === 'string' ? bucketName :
          (bucketName?.['Fn::Join'] ? bucketName['Fn::Join'][1]?.join('') : '');
        return nameStr.includes('ml-pipeline-data-prod');
      });

      expect(dataBucket).toBeDefined();
      expect(dataBucket?.Properties?.LifecycleConfiguration?.Rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Id: 'expire-raw-data',
            ExpirationInDays: 30,
            Prefix: 'raw/',
            Status: 'Enabled',
          }),
        ])
      );
    });
  });

  describe('DynamoDB Table', () => {
    test('should create predictions table with TTL enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp('ml-pipeline-predictions-prod'),
        AttributeDefinitions: Match.arrayWith([
          { AttributeName: 'predictionId', AttributeType: 'S' },
          { AttributeName: 'timestamp', AttributeType: 'N' },
          { AttributeName: 'modelVersion', AttributeType: 'S' },
        ]),
        KeySchema: [
          { AttributeName: 'predictionId', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        TimeToLiveSpecification: {
          AttributeName: 'expirationTime',
          Enabled: true,
        },
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
      });
    });

    test('should create GSI for querying by model version', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: Match.arrayWith([
          {
            IndexName: 'ModelVersionIndex',
            KeySchema: [
              { AttributeName: 'modelVersion', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          },
        ]),
      });
    });
  });

  // ============================================
  // MODEL VERSIONING & CONFIGURATION TESTS
  // ============================================

  describe('SSM Parameter Store', () => {
    test('should create active model version parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/ml-pipeline/models/active-version',
        Type: 'String',
        Value: 'v1.0.0',
        Description: 'Currently active model version for inference',
      });
    });

    test('should create model metadata parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/ml-pipeline/models/metadata',
        Type: 'String',
        Description: 'Model version metadata and deployment history',
        Tier: 'Advanced',
      });
    });
  });

  // ============================================
  // SAGEMAKER INFRASTRUCTURE TESTS
  // ============================================

  describe('SageMaker Resources', () => {
    test('should create SageMaker execution role with required permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'ml-pipeline-sagemaker-prod',
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'sagemaker.amazonaws.com',
              },
            },
          ]),
        },
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp('AmazonSageMakerFullAccess'),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('should create SageMaker model with VPC configuration', () => {
      const models = template.findResources('AWS::SageMaker::Model');
      const sagemakerModel = Object.values(models)[0] as any;

      expect(sagemakerModel).toBeDefined();
      expect(sagemakerModel.Properties?.PrimaryContainer).toMatchObject({
        Environment: {
          MODEL_VERSION: 'v1.0.0',
          INFERENCE_FRAMEWORK: 'pytorch',
        },
      });
      expect(sagemakerModel.Properties?.VpcConfig).toBeDefined();
      expect(sagemakerModel.Properties?.VpcConfig?.Subnets).toBeDefined();
      expect(sagemakerModel.Properties?.VpcConfig?.SecurityGroupIds).toBeDefined();
    });

    test('should create endpoint configuration with A/B testing variants', () => {
      template.hasResourceProperties('AWS::SageMaker::EndpointConfig', {
        ProductionVariants: [
          {
            VariantName: 'ModelA',
            InitialInstanceCount: 1,
            InstanceType: 'ml.m5.large',
            InitialVariantWeight: 0.8,
          },
          {
            VariantName: 'ModelB',
            InitialInstanceCount: 1,
            InstanceType: 'ml.m5.large',
            InitialVariantWeight: 0.2,
          },
        ],
      });
    });

    test('should create SageMaker endpoint', () => {
      template.hasResourceProperties('AWS::SageMaker::Endpoint', {
        EndpointName: 'ml-pipeline-endpoint-prod-us-east-1',
      });
    });

    test('should configure auto-scaling for SageMaker endpoint', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
        ServiceNamespace: 'sagemaker',
        ScalableDimension: 'sagemaker:variant:DesiredInstanceCount',
        MinCapacity: 1,
        MaxCapacity: 10,
      });

      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingScalingPolicyConfiguration: {
          TargetValue: 1000,
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'SageMakerVariantInvocationsPerInstance',
          },
          ScaleInCooldown: 300,
          ScaleOutCooldown: 60,
        },
      });
    });
  });

  // ============================================
  // STREAMING INFRASTRUCTURE TESTS
  // ============================================

  describe('Kinesis Data Stream', () => {
    test('should create Kinesis stream with encryption', () => {
      template.hasResourceProperties('AWS::Kinesis::Stream', {
        Name: 'ml-pipeline-inference-stream-prod',
        ShardCount: 2,
        RetentionPeriodHours: 24,
        StreamEncryption: {
          EncryptionType: 'KMS',
          KeyId: 'alias/aws/kinesis',
        },
      });
    });
  });

  // ============================================
  // LAMBDA FUNCTIONS TESTS
  // ============================================

  describe('Lambda Functions', () => {
    test('should create Lambda execution role with required permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'ml-pipeline-lambda-prod',
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ]),
        },
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp('AWSLambdaVPCAccessExecutionRole'),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('should create preprocessing Lambda function in VPC', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      const preprocessFunction = Object.values(functions).find((fn: any) =>
        fn.Properties?.FunctionName === 'ml-pipeline-preprocess-prod'
      );

      expect(preprocessFunction).toBeDefined();
      expect(preprocessFunction?.Properties).toMatchObject({
        FunctionName: 'ml-pipeline-preprocess-prod',
        Runtime: 'python3.11',
        Handler: 'index.handler',
        Timeout: 30,
        MemorySize: 512,
      });
      expect(preprocessFunction?.Properties?.VpcConfig).toBeDefined();
      expect(preprocessFunction?.Properties?.Environment).toBeDefined();
    });

    test('should create stream processor Lambda function', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      const streamFunction = Object.values(functions).find((fn: any) =>
        fn.Properties?.FunctionName === 'ml-pipeline-stream-processor-prod'
      );

      expect(streamFunction).toBeDefined();
      expect(streamFunction?.Properties).toMatchObject({
        FunctionName: 'ml-pipeline-stream-processor-prod',
        Runtime: 'python3.11',
        Handler: 'index.handler',
        Timeout: 60,
        MemorySize: 1024,
      });
    });

    test('should create Kinesis event source mapping for stream processor', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        BatchSize: 100,
        StartingPosition: 'LATEST',
        MaximumRetryAttempts: 3,
      });
    });

    test('should grant SageMaker invoke permissions to Lambda role', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const hasSageMakerPermission = Object.values(policies).some((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some((stmt: any) => {
          const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
          return actions.includes('sagemaker:InvokeEndpoint');
        });
      });
      expect(hasSageMakerPermission).toBe(true);
    });
  });

  // ============================================
  // API GATEWAY TESTS
  // ============================================

  describe('API Gateway', () => {
    test('should create REST API with caching enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'ml-pipeline-api-prod',
        Description: 'ML inference API with caching and rate limiting',
      });
    });

    test('should enable caching on API deployment', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
        CacheClusterEnabled: true,
        CacheClusterSize: '0.5',
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            CachingEnabled: true,
            CacheTtlInSeconds: 300,
            MetricsEnabled: true,
            LoggingLevel: 'INFO',
            DataTraceEnabled: true,
          }),
        ]),
      });
    });

    test('should create predict resource and POST method', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'predict',
      });

      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
      });
    });
  });

  // ============================================
  // BATCH PROCESSING TESTS
  // ============================================

  describe('AWS Batch Infrastructure', () => {
    test('should create Batch service role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'batch.amazonaws.com',
              },
            },
          ]),
        },
      });
    });

    test('should create Fargate compute environment', () => {
      template.hasResourceProperties('AWS::Batch::ComputeEnvironment', {
        Type: 'MANAGED',
        ComputeEnvironmentName: 'ml-pipeline-batch-compute-prod',
        ComputeResources: {
          Type: 'FARGATE',
          MaxvCpus: 256,
        },
      });
    });

    test('should create Batch job queue', () => {
      template.hasResourceProperties('AWS::Batch::JobQueue', {
        JobQueueName: 'ml-pipeline-batch-queue-prod',
        Priority: 1,
      });
    });

    test('should create Batch job definition with correct configuration', () => {
      template.hasResourceProperties('AWS::Batch::JobDefinition', {
        JobDefinitionName: 'ml-pipeline-batch-job-prod',
        Type: 'container',
        PlatformCapabilities: ['FARGATE'],
        ContainerProperties: {
          Image: Match.stringLikeRegexp('pytorch-inference'),
          ResourceRequirements: [
            { Type: 'VCPU', Value: '2' },
            { Type: 'MEMORY', Value: '4096' },
          ],
          NetworkConfiguration: {
            AssignPublicIp: 'DISABLED',
          },
        },
      });
    });
  });

  // ============================================
  // STEP FUNCTIONS TESTS
  // ============================================

  describe('Step Functions', () => {
    test('should create Step Functions execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'states.amazonaws.com',
              },
            },
          ]),
        },
      });
    });

    test('should create state machine for batch processing', () => {
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        StateMachineName: 'ml-pipeline-batch-workflow-prod',
      });
    });

    test('should grant Batch permissions to Step Functions role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: ['batch:SubmitJob', 'batch:DescribeJobs', 'batch:TerminateJob'],
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  // ============================================
  // EVENTBRIDGE TESTS
  // ============================================

  describe('EventBridge Scheduled Rules', () => {
    test('should create scheduled rule for daily batch processing', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: 'ml-pipeline-batch-schedule-prod',
        Description: 'Trigger batch inference workflow daily',
        ScheduleExpression: 'cron(0 2 * * ? *)',
        State: 'ENABLED',
      });
    });

    test('should target Step Functions state machine', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Targets: Match.arrayWith([
          Match.objectLike({
            Arn: Match.anyValue(),
          }),
        ]),
      });
    });
  });

  // ============================================
  // GLUE & ATHENA TESTS
  // ============================================

  describe('Data Catalog and Analytics', () => {
    test('should create Glue database', () => {
      template.hasResourceProperties('AWS::Glue::Database', {
        DatabaseInput: {
          Name: 'ml_pipeline_db_prod',
          Description: 'Database for ML pipeline analytics and prediction results',
        },
      });
    });

    test('should create Glue crawler role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'glue.amazonaws.com',
              },
            },
          ]),
        },
      });
    });

    test('should create Athena workgroup', () => {
      template.hasResourceProperties('AWS::Athena::WorkGroup', {
        Name: 'ml-pipeline-analytics-prod',
        Description: 'Workgroup for running analytics queries on prediction data',
        WorkGroupConfiguration: {
          EnforceWorkGroupConfiguration: true,
          PublishCloudWatchMetricsEnabled: true,
          ResultConfiguration: {
            EncryptionConfiguration: {
              EncryptionOption: 'SSE_S3',
            },
          },
        },
      });
    });
  });

  // ============================================
  // MONITORING & ALERTING TESTS
  // ============================================

  describe('CloudWatch Monitoring', () => {
    test('should create SNS topic for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'ml-pipeline-alerts-prod',
        DisplayName: 'ML Pipeline Alerts',
      });
    });

    test('should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'ml-pipeline-metrics-prod',
      });
    });

    test('should create high latency alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'ml-pipeline-high-latency-prod',
        AlarmDescription: 'Alert when model latency exceeds threshold',
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2,
        Threshold: 500,
        TreatMissingData: 'notBreaching',
      });
    });

    test('should create high error rate alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'ml-pipeline-high-error-rate-prod',
        AlarmDescription: 'Alert when error rate exceeds 5%',
        ComparisonOperator: 'GreaterThanThreshold',
        Threshold: 50,
      });
    });

    test('should create Lambda error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'ml-pipeline-lambda-errors-prod',
        AlarmDescription: 'Alert on Lambda function errors',
      });
    });

    test('should create DynamoDB throttling alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'ml-pipeline-dynamodb-throttle-prod',
        AlarmDescription: 'Alert on DynamoDB throttling events',
      });
    });

    test('should configure SNS actions on all alarms', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      Object.values(alarms).forEach((alarm: any) => {
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });
  });

  // ============================================
  // IAM POLICY TESTS
  // ============================================

  describe('IAM Policies and Permissions', () => {
    test('should grant DynamoDB read/write to Lambda role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
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
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should grant S3 read permissions to SageMaker role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['s3:GetObject*', 's3:GetBucket*', 's3:List*']),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should grant SSM parameter read permissions to Lambda role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['ssm:DescribeParameters', 'ssm:GetParameters', 'ssm:GetParameter']),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  // ============================================
  // STACK OUTPUTS TESTS
  // ============================================

  describe('Stack Outputs', () => {
    test('should export API endpoint URL', () => {
      template.hasOutput('APIEndpoint', {
        Description: 'API Gateway endpoint URL',
        Export: {
          Name: 'ml-pipeline-api-url-prod',
        },
      });
    });

    test('should export SageMaker endpoint name', () => {
      template.hasOutput('SageMakerEndpointName', {
        Description: 'SageMaker endpoint name',
        Export: {
          Name: 'ml-pipeline-endpoint-prod',
        },
      });
    });

    test('should export DynamoDB table name', () => {
      template.hasOutput('PredictionsTableName', {
        Description: 'DynamoDB predictions table name',
        Export: {
          Name: 'ml-pipeline-table-prod',
        },
      });
    });

    test('should export model bucket name', () => {
      template.hasOutput('ModelBucketName', {
        Description: 'S3 bucket for model artifacts',
        Export: {
          Name: 'ml-pipeline-model-bucket-prod',
        },
      });
    });

    test('should export Kinesis stream name', () => {
      template.hasOutput('KinesisStreamName', {
        Description: 'Kinesis stream for real-time inference',
        Export: {
          Name: 'ml-pipeline-kinesis-stream-prod',
        },
      });
    });

    test('should export State Machine ARN', () => {
      template.hasOutput('StateMachineArn', {
        Description: 'Step Functions state machine ARN',
        Export: {
          Name: 'ml-pipeline-state-machine-prod',
        },
      });
    });

    test('should output CloudWatch Dashboard URL', () => {
      template.hasOutput('DashboardURL', {
        Description: 'CloudWatch Dashboard URL',
      });
    });
  });

  // ============================================
  // RESOURCE TAGGING TESTS
  // ============================================

  describe('Resource Tags', () => {
    test('should apply consistent tags to all resources', () => {
      const resources = template.toJSON().Resources;
      const taggedResources = Object.values(resources).filter(
        (resource: any) => resource.Properties && resource.Properties.Tags
      );

      taggedResources.forEach((resource: any) => {
        const tags = resource.Properties.Tags;
        // Tags can be array or object depending on resource type
        const tagMap = Array.isArray(tags)
          ? tags.reduce((acc: any, tag: any) => {
              acc[tag.Key] = tag.Value;
              return acc;
            }, {})
          : tags;

        expect(tagMap).toMatchObject({
          Project: 'MLInferencePipeline',
          Environment: 'prod',
          ManagedBy: 'CDK',
          CostCenter: 'ML-Operations',
        });
      });
    });
  });

  // ============================================
  // RESOURCE COUNT TESTS
  // ============================================

  describe('Resource Counts', () => {
    test('should create expected number of resources', () => {
      // VPC resources
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::SecurityGroup', 1);

      // Storage
      template.resourceCountIs('AWS::S3::Bucket', 2);
      template.resourceCountIs('AWS::DynamoDB::Table', 1);

      // SageMaker
      template.resourceCountIs('AWS::SageMaker::Model', 1);
      template.resourceCountIs('AWS::SageMaker::EndpointConfig', 1);
      template.resourceCountIs('AWS::SageMaker::Endpoint', 1);

      // Lambda (2 main functions + 2 singleton functions for log retention = 4)
      expect(
        Object.keys(template.findResources('AWS::Lambda::Function')).length
      ).toBeGreaterThanOrEqual(2);

      // API Gateway
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);

      // Batch
      template.resourceCountIs('AWS::Batch::ComputeEnvironment', 1);
      template.resourceCountIs('AWS::Batch::JobQueue', 1);
      template.resourceCountIs('AWS::Batch::JobDefinition', 1);

      // Step Functions
      template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);

      // Monitoring
      template.resourceCountIs('AWS::SNS::Topic', 1);
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
      expect(
        Object.keys(template.findResources('AWS::CloudWatch::Alarm')).length
      ).toBeGreaterThanOrEqual(4);

      // Kinesis
      template.resourceCountIs('AWS::Kinesis::Stream', 1);

      // Glue & Athena
      template.resourceCountIs('AWS::Glue::Database', 1);
      template.resourceCountIs('AWS::Athena::WorkGroup', 1);
    });
  });
});
