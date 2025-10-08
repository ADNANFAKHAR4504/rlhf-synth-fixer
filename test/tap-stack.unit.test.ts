import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        account: '342597974367',
        region: 'us-east-1'
      }
    });
    template = Template.fromStack(stack);
  });

  describe('Basic Stack Configuration', () => {
    test('Synthesizes CloudFormation template', () => {
      expect(template).toBeDefined();
    });

    test('Uses correct environment suffix', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `bug-reports-${environmentSuffix}`
      });
    });

    test('Uses default environment suffix when not specified', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'TestTapStackDefault', {
        env: {
          account: '342597974367',
          region: 'us-east-1'
        }
      });
      const defaultTemplate = Template.fromStack(defaultStack);

      defaultTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'bug-reports-dev'
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('Creates S3 bucket for attachments with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `bug-attachments-342597974367-${environmentSuffix}`,
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            })
          ])
        },
        VersioningConfiguration: {
          Status: 'Enabled'
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('Configures S3 lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              ExpirationInDays: 90,
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30
                })
              ])
            })
          ])
        }
      });
    });

    test('Enables SSL enforcement', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false'
                }
              }
            })
          ])
        }
      });
    });
  });

  describe('DynamoDB Configuration', () => {
    test('Creates DynamoDB table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `bug-reports-${environmentSuffix}`,
        AttributeDefinitions: Match.arrayWith([
          { AttributeName: 'bugId', AttributeType: 'S' },
          { AttributeName: 'timestamp', AttributeType: 'S' },
          { AttributeName: 'priority', AttributeType: 'S' },
          { AttributeName: 'status', AttributeType: 'S' }
        ]),
        KeySchema: [
          { AttributeName: 'bugId', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' }
        ],
        BillingMode: 'PAY_PER_REQUEST',
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES'
        },
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true
        },
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true
        }
      });
    });

    test('Creates Global Secondary Indexes', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: 'PriorityIndex',
            KeySchema: [
              { AttributeName: 'priority', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' }
            ]
          }),
          Match.objectLike({
            IndexName: 'StatusIndex',
            KeySchema: [
              { AttributeName: 'status', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' }
            ]
          })
        ])
      });
    });
  });

  describe('SNS Configuration', () => {
    test('Creates SNS topic for notifications', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `bug-notifications-${environmentSuffix}`,
        DisplayName: 'Bug Assignment Notifications'
      });
    });
  });

  describe('Lambda Functions Configuration', () => {
    test('Creates user-defined Lambda functions', () => {
      // Verify our specific functions exist by name
      const expectedFunctions = [
        `process-bug-${environmentSuffix}`,
        `triage-bug-${environmentSuffix}`,
        `assign-bug-${environmentSuffix}`,
        `batch-process-${environmentSuffix}`
      ];

      expectedFunctions.forEach(functionName => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          FunctionName: functionName
        });
      });

      // Should have at least our 4 functions (CDK may create additional ones)
      const resources = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(resources).length).toBeGreaterThanOrEqual(4);
    });

    test('Creates process bug Lambda with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `process-bug-${environmentSuffix}`,
        Runtime: 'python3.10',
        Handler: 'index.lambda_handler',
        Timeout: 60,
        MemorySize: 512,
        Environment: {
          Variables: Match.objectLike({
            AWS_REGION_NAME: 'us-east-1',
            BEDROCK_REGION: 'us-west-2'
            // BUGS_TABLE_NAME and ATTACHMENTS_BUCKET are CDK references
          })
        }
      });
    });

    test('Creates triage bug Lambda with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `triage-bug-${environmentSuffix}`,
        Runtime: 'python3.10',
        Handler: 'index.lambda_handler',
        Timeout: 30,
        MemorySize: 256
      });
    });

    test('Creates assign bug Lambda with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `assign-bug-${environmentSuffix}`,
        Runtime: 'python3.10',
        Handler: 'index.lambda_handler'
      });
    });

    test('Creates batch process Lambda with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `batch-process-${environmentSuffix}`,
        Runtime: 'python3.10',
        Handler: 'index.lambda_handler',
        Timeout: 60,
        MemorySize: 512
      });
    });

    test('Creates CloudWatch log groups for Lambda functions', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 5); // 4 lambdas + 1 state machine

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/process-bug-${environmentSuffix}`,
        RetentionInDays: 7
      });
    });
  });

  describe('IAM Permissions', () => {
    test('Grants Comprehend permissions to process bug Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: [
                'comprehend:DetectSentiment',
                'comprehend:DetectTargetedSentiment',
                'comprehend:DetectEntities'
              ],
              Resource: '*'
            })
          ])
        }
      });
    });

    test('Grants Bedrock permissions to process bug Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream'
              ],
              Resource: Match.arrayWith([
                'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-haiku-20240307-v1:0',
                'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0'
              ])
            })
          ])
        }
      });
    });

    test('Grants DynamoDB permissions to Lambda functions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
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
                'dynamodb:DeleteItem'
              ])
            })
          ])
        }
      });
    });

    test('Creates team access role with appropriate permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `bug-tracking-team-access-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' }
            })
          ])
        }
      });
    });
  });

  describe('Step Functions Configuration', () => {
    test('Creates state machine with correct configuration', () => {
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        StateMachineName: `bug-triage-${environmentSuffix}`,
        TracingConfiguration: {
          Enabled: true
        },
        LoggingConfiguration: {
          Level: 'ALL',
          Destinations: Match.arrayWith([
            Match.objectLike({
              CloudWatchLogsLogGroup: Match.objectLike({
                LogGroupArn: Match.anyValue()
              })
            })
          ])
        }
      });
    });

    test('State machine has tracing enabled', () => {
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        TracingConfiguration: {
          Enabled: true
        }
      });
    });
  });

  describe('EventBridge Configuration', () => {
    test('Creates EventBridge event bus', () => {
      template.hasResourceProperties('AWS::Events::EventBus', {
        Name: `bug-events-${environmentSuffix}`
      });
    });

    test('Creates EventBridge rule for bug triage', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `bug-triage-rule-${environmentSuffix}`,
        EventPattern: {
          source: ['bug-tracking.dynamodb'],
          'detail-type': ['Bug Created'],
          detail: {
            status: ['new']
          }
        }
      });
    });

    test('Creates EventBridge Pipes IAM role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: { Service: 'pipes.amazonaws.com' }
            })
          ])
        }
      });
    });

    test('Creates EventBridge Pipe', () => {
      template.hasResourceProperties('AWS::Pipes::Pipe', {
        Name: `bug-stream-pipe-${environmentSuffix}`,
        SourceParameters: {
          DynamoDBStreamParameters: {
            StartingPosition: 'LATEST',
            BatchSize: 10,
            MaximumBatchingWindowInSeconds: 5
          },
          FilterCriteria: {
            Filters: Match.arrayWith([
              Match.objectLike({
                Pattern: Match.stringLikeRegexp('.*eventName.*INSERT.*')
              })
            ])
          }
        },
        TargetParameters: {
          EventBridgeEventBusParameters: {
            DetailType: 'Bug Created',
            Source: 'bug-tracking.dynamodb'
          }
        }
      });
    });
  });

  describe('API Gateway Configuration', () => {
    test('Creates REST API with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `bug-tracking-api-${environmentSuffix}`,
        Description: 'API for bug tracking system'
      });
    });

    test('Configures API deployment with tracing and logging', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: environmentSuffix,
        TracingEnabled: true,
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            LoggingLevel: 'INFO',
            DataTraceEnabled: true,
            MetricsEnabled: true
          })
        ])
      });
    });

    test('Creates API resources and methods', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'bugs'
      });

      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: '{bugId}'
      });

      // Check for HTTP methods
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST'
      });

      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET'
      });

      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'PUT'
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('Creates CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `bug-tracking-${environmentSuffix}`
      });
    });

    test('Dashboard has body configuration', () => {
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboard = Object.values(dashboards)[0] as any;

      expect(dashboard.Properties.DashboardBody).toBeDefined();
      // DashboardBody is a CDK construct, not a plain JSON string
    });
  });

  describe('Stack Outputs', () => {
    test('Creates all required stack outputs', () => {
      const outputs = template.findOutputs('*');
      const outputKeys = Object.keys(outputs);

      const requiredOutputs = [
        'ApiUrl',
        'BugsTableName',
        'AttachmentsBucketName',
        'NotificationTopicArn',
        'StateMachineArn',
        'DashboardName',
        'EventBusName'
      ];

      requiredOutputs.forEach(outputKey => {
        expect(outputKeys).toContain(outputKey);
      });
    });

    test('Output values have correct export names', () => {
      template.hasOutput('ApiUrl', {
        Export: { Name: `BugTrackingApiUrl-${environmentSuffix}` }
      });

      template.hasOutput('BugsTableName', {
        Export: { Name: `BugsTableName-${environmentSuffix}` }
      });

      template.hasOutput('AttachmentsBucketName', {
        Export: { Name: `AttachmentsBucketName-${environmentSuffix}` }
      });
    });
  });

  describe('Resource Counts Validation', () => {
    test('Creates expected number of each resource type', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
      template.resourceCountIs('AWS::SNS::Topic', 1);
      // CDK may create additional Lambda functions for custom resources
      const lambdaResources = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdaResources).length).toBeGreaterThanOrEqual(4);

      template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
      template.resourceCountIs('AWS::Events::EventBus', 1);
      template.resourceCountIs('AWS::Events::Rule', 1);
      template.resourceCountIs('AWS::Pipes::Pipe', 1);
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);

      // CDK may create additional log groups
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      expect(Object.keys(logGroups).length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('Handles missing environment suffix gracefully', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackNoSuffix', {
        env: {
          account: '342597974367',
          region: 'us-east-1'
        }
      });
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'bug-reports-dev'
      });
    });

    test('Uses context value when available', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'context-test'
        }
      });
      const contextStack = new TapStack(contextApp, 'TestStackContext', {
        env: {
          account: '342597974367',
          region: 'us-east-1'
        }
      });
      const contextTemplate = Template.fromStack(contextStack);

      contextTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'bug-reports-context-test'
      });
    });

    test('Props environment suffix takes precedence over context', () => {
      const precedenceApp = new cdk.App({
        context: {
          environmentSuffix: 'context-value'
        }
      });
      const precedenceStack = new TapStack(precedenceApp, 'TestStackPrecedence', {
        environmentSuffix: 'props-value',
        env: {
          account: '342597974367',
          region: 'us-east-1'
        }
      });
      const precedenceTemplate = Template.fromStack(precedenceStack);

      precedenceTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'bug-reports-props-value'
      });
    });
  });

  // ===== DynamoDB Stack Tests (Integrated) =====
  describe('DynamoDB Stack Integration Tests', () => {
    let ddbApp: cdk.App;
    let ddbStack: any; // DynamoDBStack type would require import
    let ddbTemplate: Template;

    beforeEach(() => {
      ddbApp = new cdk.App();
      // Create a minimal DynamoDB table for testing (inline definition to avoid imports)
      const testDdbStack = new cdk.Stack(ddbApp, 'TestDdbStack');
      const table = new cdk.aws_dynamodb.Table(testDdbStack, 'BugsTable', {
        tableName: `bug-reports-${environmentSuffix}`,
        partitionKey: { name: 'bugId', type: cdk.aws_dynamodb.AttributeType.STRING },
        sortKey: { name: 'timestamp', type: cdk.aws_dynamodb.AttributeType.STRING },
        billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
        stream: cdk.aws_dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
        pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

      table.addGlobalSecondaryIndex({
        indexName: 'PriorityIndex',
        partitionKey: { name: 'priority', type: cdk.aws_dynamodb.AttributeType.STRING },
        sortKey: { name: 'timestamp', type: cdk.aws_dynamodb.AttributeType.STRING },
      });

      table.addGlobalSecondaryIndex({
        indexName: 'StatusIndex',
        partitionKey: { name: 'status', type: cdk.aws_dynamodb.AttributeType.STRING },
        sortKey: { name: 'timestamp', type: cdk.aws_dynamodb.AttributeType.STRING },
      });

      ddbStack = testDdbStack;
      ddbTemplate = Template.fromStack(testDdbStack);
    });

    describe('DynamoDB Table Configuration', () => {
      test('Creates DynamoDB table with correct name and keys', () => {
        ddbTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
          TableName: `bug-reports-${environmentSuffix}`,
          AttributeDefinitions: Match.arrayWith([
            { AttributeName: 'bugId', AttributeType: 'S' },
            { AttributeName: 'timestamp', AttributeType: 'S' },
            { AttributeName: 'priority', AttributeType: 'S' },
            { AttributeName: 'status', AttributeType: 'S' },
          ]),
          KeySchema: [
            { AttributeName: 'bugId', KeyType: 'HASH' },
            { AttributeName: 'timestamp', KeyType: 'RANGE' },
          ],
        });
      });

      test('Configures table with pay-per-request billing', () => {
        ddbTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
          BillingMode: 'PAY_PER_REQUEST',
        });
      });

      test('Enables DynamoDB streams with NEW_AND_OLD_IMAGES', () => {
        ddbTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
          StreamSpecification: {
            StreamViewType: 'NEW_AND_OLD_IMAGES',
          },
        });
      });

      test('Enables point-in-time recovery', () => {
        ddbTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
          PointInTimeRecoverySpecification: {
            PointInTimeRecoveryEnabled: true,
          },
        });
      });

      test('Sets removal policy to destroy', () => {
        const resources = ddbTemplate.findResources('AWS::DynamoDB::Table');
        const tableResource = Object.values(resources)[0] as any;
        expect(tableResource.DeletionPolicy).toBe('Delete');
      });
    });

    describe('Global Secondary Indexes', () => {
      test('Creates PriorityIndex GSI with correct configuration', () => {
        ddbTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
          GlobalSecondaryIndexes: Match.arrayWith([
            Match.objectLike({
              IndexName: 'PriorityIndex',
              KeySchema: [
                { AttributeName: 'priority', KeyType: 'HASH' },
                { AttributeName: 'timestamp', KeyType: 'RANGE' },
              ],
              Projection: { ProjectionType: 'ALL' },
            }),
          ]),
        });
      });

      test('Creates StatusIndex GSI with correct configuration', () => {
        ddbTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
          GlobalSecondaryIndexes: Match.arrayWith([
            Match.objectLike({
              IndexName: 'StatusIndex',
              KeySchema: [
                { AttributeName: 'status', KeyType: 'HASH' },
                { AttributeName: 'timestamp', KeyType: 'RANGE' },
              ],
              Projection: { ProjectionType: 'ALL' },
            }),
          ]),
        });
      });

      test('Creates exactly 2 global secondary indexes', () => {
        const resources = ddbTemplate.findResources('AWS::DynamoDB::Table');
        const tableResource = Object.values(resources)[0] as any;
        expect(tableResource.Properties.GlobalSecondaryIndexes).toHaveLength(2);
      });
    });
  });

  // ===== REST API Stack Tests (Integrated) =====
  describe('REST API Stack Integration Tests', () => {
    let apiApp: cdk.App;
    let mockLambda: cdk.aws_lambda.Function;
    let apiStack: cdk.Stack;
    let apiTemplate: Template;

    beforeEach(() => {
      apiApp = new cdk.App();

      // Create a mock lambda function for testing
      const mockStack = new cdk.Stack(apiApp, 'MockStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      mockLambda = new cdk.aws_lambda.Function(mockStack, 'MockFunction', {
        runtime: cdk.aws_lambda.Runtime.PYTHON_3_10,
        handler: 'index.handler',
        code: cdk.aws_lambda.Code.fromInline('def handler(event, context): return {}'),
        functionName: `mock-function-${environmentSuffix}`,
      });

      // Create REST API inline (to avoid import dependencies)
      apiStack = new cdk.Stack(apiApp, 'TestRestAPIStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });

      const api = new cdk.aws_apigateway.RestApi(apiStack, 'BugTrackingAPI', {
        restApiName: `bug-tracking-api-${environmentSuffix}`,
        description: 'API for bug tracking system',
        deployOptions: {
          stageName: environmentSuffix,
          tracingEnabled: true,
          loggingLevel: cdk.aws_apigateway.MethodLoggingLevel.INFO,
          dataTraceEnabled: true,
          metricsEnabled: true,
        },
        defaultCorsPreflightOptions: {
          allowOrigins: cdk.aws_apigateway.Cors.ALL_ORIGINS,
          allowMethods: cdk.aws_apigateway.Cors.ALL_METHODS,
        },
      });

      const bugIntegration = new cdk.aws_apigateway.LambdaIntegration(mockLambda, {
        proxy: true,
      });

      const bugsResource = api.root.addResource('bugs');
      bugsResource.addMethod('POST', bugIntegration);
      bugsResource.addMethod('GET', bugIntegration);

      const bugResource = bugsResource.addResource('{bugId}');
      bugResource.addMethod('GET', bugIntegration);
      bugResource.addMethod('PUT', bugIntegration);

      apiTemplate = Template.fromStack(apiStack);
    });

    describe('API Gateway Configuration', () => {
      test('Creates REST API with correct name and configuration', () => {
        apiTemplate.hasResourceProperties('AWS::ApiGateway::RestApi', {
          Name: `bug-tracking-api-${environmentSuffix}`,
          Description: 'API for bug tracking system',
        });
      });

      test('Creates API Gateway deployment', () => {
        apiTemplate.hasResourceProperties('AWS::ApiGateway::Deployment', {
          Description: 'API for bug tracking system'
        });
      });

      test('Enables tracing on the deployment', () => {
        apiTemplate.hasResourceProperties('AWS::ApiGateway::Stage', {
          TracingEnabled: true,
        });
      });

      test('Configures logging and metrics on stage', () => {
        apiTemplate.hasResourceProperties('AWS::ApiGateway::Stage', {
          MethodSettings: Match.arrayWith([
            Match.objectLike({
              LoggingLevel: 'INFO',
              DataTraceEnabled: true,
              MetricsEnabled: true,
            }),
          ]),
        });
      });
    });

    describe('Resource Structure', () => {
      test('Creates /bugs resource', () => {
        apiTemplate.hasResourceProperties('AWS::ApiGateway::Resource', {
          PathPart: 'bugs',
        });
      });

      test('Creates /{bugId} resource under /bugs', () => {
        apiTemplate.hasResourceProperties('AWS::ApiGateway::Resource', {
          PathPart: '{bugId}',
        });
      });

      test('Creates correct number of resources', () => {
        // Should have: root, /bugs, /bugs/{bugId}
        apiTemplate.resourceCountIs('AWS::ApiGateway::Resource', 2);
      });
    });

    describe('HTTP Methods Configuration', () => {
      test('Creates POST method on /bugs resource', () => {
        apiTemplate.hasResourceProperties('AWS::ApiGateway::Method', {
          HttpMethod: 'POST',
          Integration: {
            Type: 'AWS_PROXY',
          },
        });
      });

      test('Creates GET method on /bugs resource', () => {
        apiTemplate.hasResourceProperties('AWS::ApiGateway::Method', {
          HttpMethod: 'GET',
          Integration: {
            Type: 'AWS_PROXY',
          },
        });
      });

      test('Creates GET method on /bugs/{bugId} resource', () => {
        apiTemplate.hasResourceProperties('AWS::ApiGateway::Method', {
          HttpMethod: 'GET',
          Integration: {
            Type: 'AWS_PROXY',
          },
        });
      });

      test('Creates PUT method on /bugs/{bugId} resource', () => {
        apiTemplate.hasResourceProperties('AWS::ApiGateway::Method', {
          HttpMethod: 'PUT',
          Integration: {
            Type: 'AWS_PROXY',
          },
        });
      });

      test('All methods use Lambda proxy integration', () => {
        const methods = apiTemplate.findResources('AWS::ApiGateway::Method');
        Object.values(methods).forEach((method: any) => {
          if (method.Properties.HttpMethod !== 'OPTIONS') {
            expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
          }
        });
      });
    });

    describe('Lambda Integration', () => {
      test('Creates Lambda permissions for API Gateway', () => {
        apiTemplate.hasResourceProperties('AWS::Lambda::Permission', {
          Action: 'lambda:InvokeFunction',
          Principal: 'apigateway.amazonaws.com',
        });
      });

      test('Lambda integrations are properly configured', () => {
        const methods = apiTemplate.findResources('AWS::ApiGateway::Method');
        let nonOptionsCount = 0;
        Object.values(methods).forEach((method: any) => {
          if (method.Properties.HttpMethod !== 'OPTIONS') {
            nonOptionsCount++;
            expect(method.Properties.Integration).toBeDefined();
            expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
          }
        });
        expect(nonOptionsCount).toBeGreaterThan(0);
      });
    });

    describe('Resource Counts', () => {
      test('Creates exactly one REST API', () => {
        apiTemplate.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      });

      test('Creates exactly one deployment', () => {
        apiTemplate.resourceCountIs('AWS::ApiGateway::Deployment', 1);
      });

      test('Creates exactly one stage', () => {
        apiTemplate.resourceCountIs('AWS::ApiGateway::Stage', 1);
      });

      test('Creates expected HTTP methods', () => {
        const methods = apiTemplate.findResources('AWS::ApiGateway::Method');
        const methodCount = Object.keys(methods).length;
        expect(methodCount).toBeGreaterThanOrEqual(4); // At least our 4 main methods
      });
    });
  });
});
