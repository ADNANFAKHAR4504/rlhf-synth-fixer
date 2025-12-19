import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = 'test';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: { region: 'us-east-1', account: '123456789012' },
    });
    template = Template.fromStack(stack);
  });

  describe('SQS Dead Letter Queues', () => {
    test('should create all 4 DLQs with correct properties', () => {
      // Test that 4 SQS queues are created
      template.resourceCountIs('AWS::SQS::Queue', 4);

      // Test validator DLQ
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `validator-dlq-${environmentSuffix}`,
        MessageRetentionPeriod: 1209600, // 14 days
      });

      // Test transformer DLQ
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `transformer-dlq-${environmentSuffix}`,
        MessageRetentionPeriod: 1209600,
      });

      // Test enricher DLQ
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `enricher-dlq-${environmentSuffix}`,
        MessageRetentionPeriod: 1209600,
      });

      // Test quality check DLQ
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `quality-check-dlq-${environmentSuffix}`,
        MessageRetentionPeriod: 1209600,
      });
    });
  });

  describe('S3 Data Bucket', () => {
    test('should create S3 bucket with versioning and lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `etl-data-bucket-${environmentSuffix}`,
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteOldRawFiles',
              Prefix: 'raw/',
              Status: 'Enabled',
              ExpirationInDays: 30,
            },
            {
              Id: 'DeleteOldFailedFiles',
              Prefix: 'failed/',
              Status: 'Enabled',
              ExpirationInDays: 90,
            },
          ],
        },
      });
    });

    test('should have RemovalPolicy DESTROY and autoDeleteObjects', () => {
      const bucket = template.findResources('AWS::S3::Bucket');
      const bucketKeys = Object.keys(bucket);
      expect(bucketKeys.length).toBeGreaterThan(0);
      const bucketResource = bucket[bucketKeys[0]];
      expect(bucketResource.UpdateReplacePolicy).toBe('Delete');
      expect(bucketResource.DeletionPolicy).toBe('Delete');
    });

    test('should have S3 event notification configured', () => {
      template.hasResource('Custom::S3BucketNotifications', {
        Properties: {
          NotificationConfiguration: {
            LambdaFunctionConfigurations: [
              {
                Events: ['s3:ObjectCreated:*'],
                Filter: {
                  Key: {
                    FilterRules: [
                      { Name: 'suffix', Value: '.csv' },
                      { Name: 'prefix', Value: 'raw/' },
                    ],
                  },
                },
                LambdaFunctionArn: Match.anyValue(),
              },
            ],
          },
        },
      });
    });
  });

  describe('DynamoDB Metadata Table', () => {
    test('should create DynamoDB table with correct schema', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `etl-metadata-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        AttributeDefinitions: [
          { AttributeName: 'jobId', AttributeType: 'S' },
          { AttributeName: 'fileName', AttributeType: 'S' },
          { AttributeName: 'status', AttributeType: 'S' },
          { AttributeName: 'timestamp', AttributeType: 'N' },
        ],
        KeySchema: [
          { AttributeName: 'jobId', KeyType: 'HASH' },
          { AttributeName: 'fileName', KeyType: 'RANGE' },
        ],
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('should have Global Secondary Index', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: [
          {
            IndexName: 'TimestampIndex',
            KeySchema: [
              { AttributeName: 'status', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          },
        ],
      });
    });

    test('should have RemovalPolicy DESTROY', () => {
      const tables = template.findResources('AWS::DynamoDB::Table');
      const tableKeys = Object.keys(tables);
      expect(tableKeys.length).toBeGreaterThan(0);
      const table = tables[tableKeys[0]];
      expect(table.UpdateReplacePolicy).toBe('Delete');
      expect(table.DeletionPolicy).toBe('Delete');
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should create 6 log groups with correct retention', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 6);

      const logGroups = [
        'validator',
        'transformer',
        'enricher',
        'quality-check',
        'api-handler',
        'trigger-handler',
      ];

      logGroups.forEach((name) => {
        template.hasResourceProperties('AWS::Logs::LogGroup', {
          LogGroupName: `/aws/lambda/${name}-${environmentSuffix}`,
          RetentionInDays: 7,
        });
      });
    });

    test('should have RemovalPolicy DESTROY on log groups', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.values(logGroups).forEach((logGroup) => {
        expect(logGroup.UpdateReplacePolicy).toBe('Delete');
        expect(logGroup.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create all 6 Lambda functions', () => {
      // Excludes custom resource handlers
      const functions = template.findResources('AWS::Lambda::Function', {
        Properties: {
          Runtime: 'nodejs18.x',
        },
      });
      expect(Object.keys(functions).length).toBe(6);
    });

    test('should configure validator function correctly', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `validator-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 300,
        MemorySize: 512,
        Environment: {
          Variables: {
            METADATA_TABLE: Match.anyValue(),
            DATA_BUCKET: Match.anyValue(),
          },
        },
      });
    });

    test('should configure transformer function correctly', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `transformer-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 600,
        MemorySize: 1024,
        Environment: {
          Variables: {
            METADATA_TABLE: Match.anyValue(),
            DATA_BUCKET: Match.anyValue(),
          },
        },
      });
    });

    test('should configure enricher function correctly', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `enricher-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 300,
        MemorySize: 512,
        Environment: {
          Variables: {
            METADATA_TABLE: Match.anyValue(),
            DATA_BUCKET: Match.anyValue(),
          },
        },
      });
    });

    test('should configure quality check function correctly', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `quality-check-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 900,
        MemorySize: 1024,
        Environment: {
          Variables: {
            METADATA_TABLE: Match.anyValue(),
            DATA_BUCKET: Match.anyValue(),
          },
        },
      });
    });

    test('should configure trigger function correctly', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `trigger-handler-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        Environment: {
          Variables: {
            STATE_MACHINE_ARN: Match.anyValue(),
            METADATA_TABLE: Match.anyValue(),
          },
        },
      });
    });

    test('should configure API handler function correctly', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `api-handler-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        Environment: {
          Variables: {
            METADATA_TABLE: Match.anyValue(),
            STATE_MACHINE_ARN: Match.anyValue(),
          },
        },
      });
    });

    test('should have DLQ configured for each function', () => {
      const functions = template.findResources('AWS::Lambda::Function', {
        Properties: {
          Runtime: 'nodejs18.x',
          FunctionName: Match.stringLikeRegexp('validator|transformer|enricher'),
        },
      });

      Object.values(functions).forEach((func: any) => {
        expect(func.Properties.DeadLetterConfig).toBeDefined();
        expect(func.Properties.DeadLetterConfig.TargetArn).toBeDefined();
      });
    });
  });

  describe('IAM Permissions', () => {
    test('should have proper IAM roles for each Lambda function', () => {
      // Check that IAM roles exist (at least 6 for Lambda functions)
      const roles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(roles).length).toBeGreaterThanOrEqual(6);

      // Check validator role has DynamoDB and S3 permissions
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                Match.stringLikeRegexp('dynamodb:.*'),
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should grant proper S3 permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([Match.stringLikeRegexp('s3:.*')]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('Step Functions State Machine', () => {
    test('should create state machine with correct properties', () => {
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        StateMachineName: `etl-state-machine-${environmentSuffix}`,
        StateMachineType: 'EXPRESS',
        TracingConfiguration: {
          Enabled: true,
        },
      });
    });

    test('should have state machine role with Lambda invoke permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'lambda:InvokeFunction',
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should have proper definition with all tasks', () => {
      const stateMachines = template.findResources(
        'AWS::StepFunctions::StateMachine'
      );
      const stateMachineKeys = Object.keys(stateMachines);
      expect(stateMachineKeys.length).toBeGreaterThan(0);

      const sm = stateMachines[stateMachineKeys[0]];
      const definition = JSON.parse(sm.Properties.DefinitionString['Fn::Join'][1].join(''));

      expect(definition.States).toBeDefined();
      expect(definition.States.ValidateTask).toBeDefined();
      expect(definition.States.TransformTask).toBeDefined();
      expect(definition.States.EnrichTask).toBeDefined();
      expect(definition.States.ValidationFailed).toBeDefined();
      expect(definition.States.TransformationFailed).toBeDefined();
      expect(definition.States.EnrichmentFailed).toBeDefined();
      expect(definition.States.ProcessingSucceeded).toBeDefined();
    });
  });

  describe('API Gateway', () => {
    test('should create REST API with correct name', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `etl-api-${environmentSuffix}`,
        Description: 'API for ETL pipeline status and control',
      });
    });

    test('should have CORS configuration', () => {
      // Verify CORS preflight options are configured
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `etl-api-${environmentSuffix}`,
      });

      // Check for OPTIONS method (CORS preflight)
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
      });

      // Verify CORS headers in method responses
      const methods = template.findResources('AWS::ApiGateway::Method');
      const methodValues = Object.values(methods);
      const hasCorsHeaders = methodValues.some((method: any) => {
        const responseParams = method.Properties?.MethodResponses?.[0]?.ResponseParameters;
        return responseParams && (
          responseParams['method.response.header.Access-Control-Allow-Origin'] !== undefined ||
          responseParams['method.response.header.Access-Control-Allow-Methods'] !== undefined
        );
      });
      expect(hasCorsHeaders).toBe(true);
    });

    test('should have deployment with proper stage', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
      });
    });

    test('should have correct API resources', () => {
      // Check for status resource
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'status',
      });

      // Check for trigger resource
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'trigger',
      });

      // Check for {jobId} resource
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: '{jobId}',
      });
    });

    test('should have GET and POST methods with method responses', () => {
      // GET method for status
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        MethodResponses: Match.arrayWith([
          Match.objectLike({
            StatusCode: '200',
          }),
        ]),
      });

      // POST method for trigger
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        MethodResponses: Match.arrayWith([
          Match.objectLike({
            StatusCode: '200',
          }),
        ]),
      });
    });
  });

  describe('EventBridge Rules', () => {
    test('should create scheduled rule for quality checks', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `quality-check-rule-${environmentSuffix}`,
        Description: 'Trigger daily data quality checks at 2 AM UTC',
        ScheduleExpression: 'cron(0 2 * * ? *)',
      });
    });

    test('should have rule target pointing to Lambda function', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Targets: Match.arrayWith([
          Match.objectLike({
            Arn: Match.anyValue(),
            RetryPolicy: {
              MaximumRetryAttempts: 2,
            },
            DeadLetterConfig: {
              Arn: Match.anyValue(),
            },
          }),
        ]),
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('should create dashboard with correct name', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `etl-dashboard-${environmentSuffix}`,
      });
    });

    test('should have dashboard body with widgets', () => {
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboardKeys = Object.keys(dashboards);
      expect(dashboardKeys.length).toBeGreaterThan(0);

      const dashboard = dashboards[dashboardKeys[0]];
      // DashboardBody in CloudFormation template is often a Fn::Join or complex object
      expect(dashboard.Properties.DashboardBody).toBeDefined();
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create alarms for Lambda errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `validator-errors-${environmentSuffix}`,
        Threshold: 5,
        EvaluationPeriods: 1,
        AlarmDescription: 'Validator function has high error rate',
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `transformer-errors-${environmentSuffix}`,
        Threshold: 5,
        EvaluationPeriods: 1,
        AlarmDescription: 'Transformer function has high error rate',
      });
    });

    test('should create alarm for Step Functions failures', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `state-machine-failures-${environmentSuffix}`,
        Threshold: 3,
        EvaluationPeriods: 1,
        AlarmDescription: 'Step Functions executions are failing',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should have all required outputs', () => {
      template.hasOutput('DataBucketName', {
        Description: 'S3 bucket for data storage',
      });

      template.hasOutput('MetadataTableName', {
        Description: 'DynamoDB table for metadata',
      });

      template.hasOutput('StateMachineArn', {
        Description: 'Step Functions state machine ARN',
      });

      template.hasOutput('ApiEndpoint', {
        Description: 'API Gateway endpoint URL',
      });

      template.hasOutput('DashboardURL', {
        Description: 'CloudWatch Dashboard URL',
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should include environmentSuffix', () => {
      // SQS Queues
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: Match.stringLikeRegexp(`.*-${environmentSuffix}`),
      });

      // DynamoDB Table
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp(`.*-${environmentSuffix}`),
      });

      // Lambda Functions
      const functions = template.findResources('AWS::Lambda::Function', {
        Properties: { Runtime: 'nodejs18.x' },
      });
      Object.values(functions).forEach((func: any) => {
        if (func.Properties.FunctionName) {
          expect(func.Properties.FunctionName).toMatch(
            new RegExp(`.*-${environmentSuffix}`)
          );
        }
      });
    });
  });

  describe('Removal Policies', () => {
    test('all stateful resources should have DESTROY removal policy', () => {
      // S3 Bucket
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket) => {
        expect(bucket.DeletionPolicy).toBe('Delete');
        expect(bucket.UpdateReplacePolicy).toBe('Delete');
      });

      // DynamoDB Table
      const tables = template.findResources('AWS::DynamoDB::Table');
      Object.values(tables).forEach((table) => {
        expect(table.DeletionPolicy).toBe('Delete');
        expect(table.UpdateReplacePolicy).toBe('Delete');
      });

      // Log Groups
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.values(logGroups).forEach((logGroup) => {
        expect(logGroup.DeletionPolicy).toBe('Delete');
        expect(logGroup.UpdateReplacePolicy).toBe('Delete');
      });
    });
  });
});
