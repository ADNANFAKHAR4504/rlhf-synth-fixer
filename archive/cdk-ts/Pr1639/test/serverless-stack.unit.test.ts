import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { ServerlessStack } from '../lib/serverless-stack';

describe('ServerlessStack Unit Tests', () => {
  let app: cdk.App;
  let stack: ServerlessStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new ServerlessStack(app, 'TestServerlessStack', {
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('KMS Key Configuration', () => {
    test('Should create a KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: `KMS key for srv data encryption - ${environmentSuffix}`,
        EnableKeyRotation: true,
        KeySpec: 'SYMMETRIC_DEFAULT',
        KeyUsage: 'ENCRYPT_DECRYPT',
      });
    });

    test('Should create a KMS key alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/srv-data-${environmentSuffix}`,
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('Should create an S3 bucket with KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [{
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'aws:kms',
            },
          }],
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('Should create S3 bucket policy enforcing SSL', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Principal: { AWS: '*' },
              Action: 's3:*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }),
          ]),
        },
      });
    });

    test('Should have auto-delete objects custom resource', () => {
      template.hasResource('Custom::S3AutoDeleteObjects', {});
    });
  });

  describe('CloudWatch Log Group', () => {
    test('Should create a log group with correct retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/srv-handler-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });
  });

  describe('Lambda Function Configuration', () => {
    test('Should create Lambda function with correct runtime and handler', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `srv-handler-${environmentSuffix}`,
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        Timeout: 30,
        MemorySize: 256,
      });
    });

    test('Should have environment variables configured', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `srv-handler-${environmentSuffix}`,
        Environment: {
          Variables: Match.objectLike({
            BUCKET_NAME: Match.anyValue(),
            KMS_KEY_ID: Match.anyValue(),
            EVENT_BUS_NAME: Match.anyValue(),
            XRAY_TRACING_GROUP: Match.anyValue(),
          }),
        },
      });
    });

    test('Should have Lambda Insights layer attached', () => {
      // Lambda Insights layer is added via insightsVersion property
      const lambdaResources = template.findResources('AWS::Lambda::Function', {
        Properties: {
          FunctionName: `srv-handler-${environmentSuffix}`,
        },
      });
      const lambdaKeys = Object.keys(lambdaResources);
      expect(lambdaKeys.length).toBeGreaterThan(0);
      const lambdaFunction = lambdaResources[lambdaKeys[0]];
      expect(lambdaFunction.Properties.Layers).toBeDefined();
      expect(lambdaFunction.Properties.Layers.length).toBeGreaterThan(0);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('Should create Lambda execution role with correct trust policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          }],
        },
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                Match.stringLikeRegexp('.*AWSLambdaBasicExecutionRole'),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('Should have S3 access policy for Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'S3Access',
            PolicyDocument: {
              Statement: [{
                Effect: 'Allow',
                Action: [
                  's3:GetObject',
                  's3:PutObject',
                  's3:DeleteObject',
                  's3:ListBucket',
                ],
                Resource: Match.anyValue(),
              }],
            },
          }),
        ]),
      });
    });

    test('Should have KMS access policy for Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'KMSAccess',
            PolicyDocument: {
              Statement: [{
                Effect: 'Allow',
                Action: Match.arrayWith([
                  'kms:Decrypt',
                  'kms:Encrypt',
                  'kms:GenerateDataKey*',
                ]),
                Resource: Match.anyValue(),
              }],
            },
          }),
        ]),
      });
    });

    test('Should have CloudWatch Logs access policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'CloudWatchLogs',
            PolicyDocument: {
              Statement: [{
                Effect: 'Allow',
                Action: Match.arrayWith([
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                ]),
                Resource: Match.anyValue(),
              }],
            },
          }),
        ]),
      });
    });
  });

  describe('API Gateway Configuration', () => {
    test('Should create REST API with correct name and description', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `Serverless API - ${environmentSuffix}`,
        Description: 'API Gateway for serverless Lambda function with X-Ray tracing',
      });
    });

    test('Should have CORS configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
        AuthorizationType: 'NONE',
        Integration: {
          IntegrationResponses: Match.arrayWith([
            Match.objectLike({
              ResponseParameters: Match.objectLike({
                'method.response.header.Access-Control-Allow-Headers': Match.anyValue(),
                'method.response.header.Access-Control-Allow-Methods': Match.anyValue(),
                'method.response.header.Access-Control-Allow-Origin': Match.anyValue(),
              }),
            }),
          ]),
        },
      });
    });

    test('Should create GET method with Lambda integration', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        Integration: {
          Type: 'AWS_PROXY',
        },
      });
    });

    test('Should create POST method with Lambda integration', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        Integration: {
          Type: 'AWS_PROXY',
        },
      });
    });

    test('Should create health endpoint', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'health',
      });
    });

    test('Should have API Gateway deployment stage with tracing enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: environmentSuffix,
        TracingEnabled: true,
        MethodSettings: [{
          DataTraceEnabled: true,
          LoggingLevel: 'INFO',
          MetricsEnabled: true,
          ResourcePath: '/*',
          HttpMethod: '*',
        }],
      });
    });

    test('Should create CloudWatch role for API Gateway', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Principal: {
              Service: 'apigateway.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          }],
        },
      });
    });
  });

  describe('Lambda Permissions', () => {
    test('Should grant API Gateway permission to invoke Lambda for GET', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 'apigateway.amazonaws.com',
        SourceArn: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([
              Match.stringLikeRegexp('.*GET.*'),
            ]),
          ]),
        }),
      });
    });

    test('Should grant API Gateway permission to invoke Lambda for POST', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 'apigateway.amazonaws.com',
        SourceArn: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([
              Match.stringLikeRegexp('.*POST.*'),
            ]),
          ]),
        }),
      });
    });

    test('Should grant API Gateway permission to invoke Lambda for health endpoint', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 'apigateway.amazonaws.com',
        SourceArn: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([
              Match.stringLikeRegexp('.*health.*'),
            ]),
          ]),
        }),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Should output API Gateway URL', () => {
      template.hasOutput('ApiGatewayUrl', {
        Description: 'API Gateway invocation URL',
        Export: {
          Name: `ServerlessApiUrl-${environmentSuffix}`,
        },
      });
    });

    test('Should output Lambda function ARN', () => {
      template.hasOutput('LambdaFunctionArn', {
        Description: 'Lambda function ARN',
        Export: {
          Name: `ServerlessLambdaArn-${environmentSuffix}`,
        },
      });
    });

    test('Should output S3 bucket name', () => {
      template.hasOutput('S3BucketName', {
        Description: 'S3 bucket name for data storage',
        Export: {
          Name: `ServerlessS3Bucket-${environmentSuffix}`,
        },
      });
    });

    test('Should output KMS key ID', () => {
      template.hasOutput('KmsKeyId', {
        Description: 'KMS Key ID for encryption',
        Export: {
          Name: `ServerlessKmsKey-${environmentSuffix}`,
        },
      });
    });

    test('Should output CloudWatch log group name', () => {
      template.hasOutput('CloudWatchLogGroup', {
        Description: 'CloudWatch Log Group for Lambda function',
        Export: {
          Name: `ServerlessLogGroup-${environmentSuffix}`,
        },
      });
    });
  });

  describe('X-Ray Configuration', () => {
    test('Should create X-Ray tracing group', () => {
      template.hasResourceProperties('AWS::XRay::Group', {
        GroupName: `srv-trace-${environmentSuffix}`,
        FilterExpression: `service("srv-handler-${environmentSuffix}")`,
      });
    });

    test('Should enable X-Ray tracing for main Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `srv-handler-${environmentSuffix}`,
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('Should enable X-Ray tracing for event processor function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `event-processor-${environmentSuffix}`,
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('Should have X-Ray permissions in Lambda role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'XRayAccess',
            PolicyDocument: {
              Statement: [{
                Effect: 'Allow',
                Action: Match.arrayWith([
                  'xray:PutTraceSegments',
                  'xray:PutTelemetryRecords',
                ]),
                Resource: '*',
              }],
            },
          }),
        ]),
      });
    });
  });

  describe('EventBridge Configuration', () => {
    test('Should create custom EventBridge bus', () => {
      template.hasResourceProperties('AWS::Events::EventBus', {
        Name: `srv-events-${environmentSuffix}`,
        Description: 'Custom event bus for serverless application events',
      });
    });

    test('Should create EventBridge archive', () => {
      template.hasResourceProperties('AWS::Events::Archive', {
        ArchiveName: `srv-archive-${environmentSuffix}`,
        Description: 'Archive for serverless application events',
        RetentionDays: 7,
        EventPattern: {
          source: ['serverless.application'],
        },
      });
    });

    test('Should create event processing Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `event-processor-${environmentSuffix}`,
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('Should create EventBridge rule for processing', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `srv-event-proc-${environmentSuffix}`,
        Description: 'Rule to process serverless application events',
        EventPattern: {
          source: ['serverless.application'],
          'detail-type': ['API Request Processed'],
        },
      });
    });

    test('Should have EventBridge permissions in Lambda role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'EventBridgeAccess',
            PolicyDocument: {
              Statement: [{
                Effect: 'Allow',
                Action: Match.arrayWith([
                  'events:PutEvents',
                ]),
                Resource: Match.anyValue(),
              }],
            },
          }),
        ]),
      });
    });

    test('Should grant EventBridge permission to invoke event processor', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 'events.amazonaws.com',
        FunctionName: Match.objectLike({
          'Fn::GetAtt': Match.arrayWith([
            Match.stringLikeRegexp('EventProcessor.*'),
          ]),
        }),
      });
    });
  });

  describe('Enhanced Stack Outputs', () => {
    test('Should output X-Ray tracing group', () => {
      template.hasOutput('XRayTracingGroup', {
        Description: 'X-Ray tracing group name',
        Export: {
          Name: `ServerlessXRayGroup-${environmentSuffix}`,
        },
      });
    });

    test('Should output EventBridge bus name', () => {
      template.hasOutput('EventBusName', {
        Description: 'Custom EventBridge bus name',
        Export: {
          Name: `ServerlessEventBus-${environmentSuffix}`,
        },
      });
    });

    test('Should output EventBridge bus ARN', () => {
      template.hasOutput('EventBusArn', {
        Description: 'Custom EventBridge bus ARN',
        Export: {
          Name: `ServerlessEventBusArn-${environmentSuffix}`,
        },
      });
    });

    test('Should output event processor Lambda ARN', () => {
      template.hasOutput('EventProcessorFunctionArn', {
        Description: 'Event processor Lambda function ARN',
        Export: {
          Name: `EventProcessorArn-${environmentSuffix}`,
        },
      });
    });

    test('Should output EventBridge processing rule ARN', () => {
      template.hasOutput('EventProcessingRuleArn', {
        Description: 'EventBridge processing rule ARN',
        Export: {
          Name: `EventProcessingRuleArn-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Resource Removal Policies', () => {
    test('Should set DESTROY removal policy for KMS key', () => {
      template.hasResource('AWS::KMS::Key', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });

    test('Should set DESTROY removal policy for S3 bucket', () => {
      template.hasResource('AWS::S3::Bucket', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });

    test('Should set DESTROY removal policy for log group', () => {
      template.hasResource('AWS::Logs::LogGroup', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });
  });
});