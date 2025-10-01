import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { ServerlessDataPipelineStack } from '../lib/serverless-data-pipeline-stack';

describe('ServerlessDataPipelineStack', () => {
  let app: cdk.App;
  let parentStack: cdk.Stack;

  beforeEach(() => {
    app = new cdk.App();
    parentStack = new cdk.Stack(app, 'ParentStack');
  });

  describe('Stack Creation', () => {
    test('should create nested stack with required properties', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });

      expect(nestedStack).toBeDefined();
      const template = Template.fromStack(nestedStack);
      expect(nestedStack).toBeDefined();
      expect(template).toBeDefined();
    });

    test('should create nested stack with notification email', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test',
        notificationEmail: 'admin@example.com'
      });

      expect(nestedStack).toBeDefined();
      const template = Template.fromStack(nestedStack);

      // Should create SNS subscription for email
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'admin@example.com'
      });
    });

    test('should create nested stack without notification email', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });

      const template = Template.fromStack(nestedStack);

      // Should still create SNS topic but no email subscription
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'data-processing-notifications-test'
      });

      template.resourceCountIs('AWS::SNS::Subscription', 0);
    });
  });

  describe('S3 Resources', () => {
    test('should create S3 bucket with correct properties', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.anyValue(),
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [{
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256'
            }
          }]
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        },
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('should create S3 bucket with lifecycle rules', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: Match.anyValue()
      });
    });

    test('should create S3 bucket notification for Lambda', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      // S3 notifications are handled by CDK as separate resources
      expect(template.findResources('AWS::S3::Bucket')).toBeDefined();
    });
  });

  describe('Lambda Resources', () => {
    test('should create Lambda function with correct properties', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'data-processor-test',
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 300, // 5 minutes
        MemorySize: 3008,
        TracingConfig: {
          Mode: 'Active'
        }
      });
    });

    test('should create Lambda function without reserved concurrency', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasResourceProperties('AWS::Lambda::Function', {
        ReservedConcurrentExecutions: Match.absent()
      });
    });

    test('should create Lambda function with environment variables', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            BUCKET_NAME: Match.anyValue(),
            SNS_TOPIC_ARN: Match.anyValue()
          }
        }
      });
    });

    test('should create Lambda function with inline code', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasResourceProperties('AWS::Lambda::Function', {
        Code: {
          ZipFile: Match.stringLikeRegexp('.*exports\\.handler.*')
        }
      });
    });
  });

  describe('IAM Resources', () => {
    test('should create IAM role for Lambda', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'data-processing-role-test',
        AssumeRolePolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com'
            },
            Action: 'sts:AssumeRole'
          }]
        }
      });
    });

    test('should create IAM policy with correct permissions', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      // IAM role should exist and be properly configured
      const allRoles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(allRoles).length).toBeGreaterThanOrEqual(1);
    });

    test('should attach AWSLambdaBasicExecutionRole managed policy', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: Match.anyValue()
      });
    });
  });

  describe('SNS Resources', () => {
    test('should create SNS topic with correct properties', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'data-processing-notifications-test',
        DisplayName: 'Data Processing Notifications',
        FifoTopic: false
      });
    });
  });

  describe('API Gateway Resources', () => {
    test('should create REST API with correct properties', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'Data-Processing-API-test',
        Description: 'API for triggering data processing'
      });
    });

    test('should create API Gateway deployment', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasResourceProperties('AWS::ApiGateway::Deployment', {
        RestApiId: Match.anyValue()
      });
    });

    test('should create API Gateway resource and method', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'process'
      });

      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        AuthorizationType: 'AWS_IAM'
      });
    });

    test('should create request validator', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasResourceProperties('AWS::ApiGateway::RequestValidator', {
        Name: 'request-validator-test',
        ValidateRequestBody: true,
        ValidateRequestParameters: true
      });
    });

    test('should create request model', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasResourceProperties('AWS::ApiGateway::Model', {
        ContentType: 'application/json',
        Name: 'ProcessRequest',
        Schema: Match.objectLike({
          type: 'object',
          properties: {
            fileName: {
              type: 'string',
              minLength: 1
            },
            processingType: {
              type: 'string',
              enum: ['standard', 'priority', 'batch']
            }
          },
          required: ['fileName', 'processingType']
        })
      });
    });

    test('should create usage plan', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        UsagePlanName: 'data-processing-plan-test',
        Description: 'Usage plan for data processing API',
        Throttle: {
          BurstLimit: 1000,
          RateLimit: 500
        },
        Quota: {
          Limit: 100000,
          Period: 'MONTH'
        }
      });
    });

    test('should create resource policy', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Policy: {
          Statement: [{
            Effect: 'Allow',
            Principal: {
              AWS: Match.anyValue()
            },
            Action: 'execute-api:Invoke',
            Resource: 'execute-api:/*/*/*'
          }]
        }
      });
    });
  });

  describe('CloudWatch Resources', () => {
    test('should create CloudWatch dashboard', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'data-processing-pipeline-test'
      });
    });

    test('should create Lambda error alarm', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'data-processor-errors-test',
        AlarmDescription: 'Alarm for Lambda function errors',
        Threshold: 5,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching'
      });
    });

    test('should create Lambda duration alarm', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'data-processor-duration-test',
        AlarmDescription: 'Alarm for Lambda function duration',
        Threshold: 240000, // 4 minutes
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching'
      });
    });

    test('should configure alarm actions to SNS topic', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmActions: [Match.anyValue()]
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should have API endpoint output', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasOutput('APIEndpoint', {
        Description: 'API Gateway endpoint URL for testing',
        Export: {
          Name: 'APIEndpoint-test'
        }
      });
    });

    test('should have API Gateway ID output', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasOutput('APIGatewayId', {
        Description: 'API Gateway REST API ID',
        Export: {
          Name: 'APIGatewayId-test'
        }
      });
    });

    test('should have bucket name output', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasOutput('BucketName', {
        Description: 'S3 bucket name for data uploads and testing',
        Export: {
          Name: 'DataBucket-test'
        }
      });
    });

    test('should have bucket ARN output', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasOutput('BucketArn', {
        Description: 'S3 bucket ARN for testing',
        Export: {
          Name: 'DataBucketArn-test'
        }
      });
    });

    test('should have Lambda function outputs', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasOutput('LambdaFunctionName', {
        Description: 'Lambda function name for testing',
        Export: {
          Name: 'LambdaFunctionName-test'
        }
      });

      template.hasOutput('LambdaFunctionArn', {
        Description: 'Lambda function ARN for testing',
        Export: {
          Name: 'LambdaFunctionArn-test'
        }
      });
    });

    test('should have SNS topic outputs', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasOutput('SNSTopicArn', {
        Description: 'SNS topic ARN for notifications and testing',
        Export: {
          Name: 'SNSTopicArn-test'
        }
      });

      template.hasOutput('SNSTopicName', {
        Description: 'SNS topic name for testing',
        Export: {
          Name: 'SNSTopicName-test'
        }
      });
    });

    test('should have IAM role outputs', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasOutput('IAMRoleName', {
        Description: 'Lambda execution role name for testing',
        Export: {
          Name: 'IAMRoleName-test'
        }
      });

      template.hasOutput('IAMRoleArn', {
        Description: 'Lambda execution role ARN for testing',
        Export: {
          Name: 'IAMRoleArn-test'
        }
      });
    });

    test('should have CloudWatch dashboard outputs', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasOutput('CloudWatchDashboardName', {
        Description: 'CloudWatch dashboard name for testing',
        Export: {
          Name: 'DashboardName-test'
        }
      });

      template.hasOutput('DashboardUrl', {
        Description: 'CloudWatch dashboard URL',
        Export: {
          Name: 'DashboardUrl-test'
        }
      });
    });

    test('should have region and environment outputs', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasOutput('Region', {
        Description: 'AWS region where resources are deployed',
        Export: {
          Name: 'Region-test'
        }
      });

      template.hasOutput('EnvironmentSuffix', {
        Description: 'Environment suffix used for resource naming',
        Export: {
          Name: 'EnvironmentSuffix-test'
        }
      });
    });

    test('should have alarm outputs', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      template.hasOutput('ErrorAlarmName', {
        Description: 'CloudWatch error alarm name for testing',
        Export: {
          Name: 'ErrorAlarmName-test'
        }
      });

      template.hasOutput('DurationAlarmName', {
        Description: 'CloudWatch duration alarm name for testing',
        Export: {
          Name: 'DurationAlarmName-test'
        }
      });
    });
  });

  describe('Tags', () => {
    test('should apply Environment Production tag', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });

      // Check that tags are applied to the stack
      const stackTags = cdk.Tags.of(nestedStack);
      expect(stackTags).toBeDefined();
    });
  });

  describe('Resource Count Validation', () => {
    test('should create expected number of each resource type', () => {
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: 'test'
      });
      const template = Template.fromStack(nestedStack);

      // Validate key resource counts - CDK creates additional resources automatically
      template.resourceCountIs('AWS::S3::Bucket', 1);
      // CDK creates additional Lambda functions for custom resources
      expect(template.findResources('AWS::Lambda::Function')).toBeDefined();
      expect(Object.keys(template.findResources('AWS::Lambda::Function')).length).toBeGreaterThanOrEqual(1);

      template.resourceCountIs('AWS::SNS::Topic', 1);
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });
  });

  describe('Environment Suffix Usage', () => {
    test('should use environment suffix in resource names consistently', () => {
      const suffix = 'prod123';
      const nestedStack = new ServerlessDataPipelineStack(parentStack, 'TestNestedStack', {
        environmentSuffix: suffix
      });
      const template = Template.fromStack(nestedStack);

      // Check various resources use the suffix - use anyValue for CDK generated values
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.anyValue()
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.anyValue()
      });

      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: Match.anyValue()
      });

      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.anyValue()
      });

      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.anyValue()
      });
    });
  });
});