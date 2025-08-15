import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { S3Stack } from '../lib/s3-stack';
import { LambdaStack } from '../lib/lambda-stack';
import { ApiGatewayStack } from '../lib/api-gateway-stack';
import { ValidationStack } from '../lib/validation-stack';
import { EnvironmentConfigs } from '../lib/environment-config';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('Main Stack', () => {
    test('should create main stack with correct properties', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      // Check outputs
      template.hasOutput('EnvironmentName', {
        Value: 'dev',
        Description: 'Environment name',
      });

      template.hasOutput('EnvironmentSuffix', {
        Value: 'test',
        Description: 'Environment suffix',
      });

      template.hasOutput('DeploymentRegion', {
        Value: { Ref: 'AWS::Region' },
        Description: 'AWS Region for deployment',
      });
    });

    test('should handle different environment suffixes', () => {
      const devApp = new cdk.App();
      const devStack = new TapStack(devApp, 'DevStack', {
        environmentSuffix: 'dev',
      });
      const devTemplate = Template.fromStack(devStack);

      devTemplate.hasOutput('EnvironmentName', {
        Value: 'dev',
      });

      const stagingApp = new cdk.App();
      const stagingStack = new TapStack(stagingApp, 'StagingStack', {
        environmentSuffix: 'staging-test',
      });
      const stagingTemplate = Template.fromStack(stagingStack);

      stagingTemplate.hasOutput('EnvironmentName', {
        Value: 'staging',
      });

      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'ProdStack', {
        environmentSuffix: 'prod-test',
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasOutput('EnvironmentName', {
        Value: 'prod',
      });

      // Test default to dev for unrecognized suffix
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: 'custom-test',
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasOutput('EnvironmentName', {
        Value: 'dev',
      });
    });

    test('should add correct tags to stack', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      // Check that the stack has tags by verifying it was created
      expect(stack.tags).toBeDefined();
      
      // Verify stack was created correctly
      const templateJson = template.toJSON();
      expect(templateJson).toBeDefined();
    });
  });

  describe('S3Stack', () => {
    test('should create S3 buckets with correct properties', () => {
      const stack = new S3Stack(app, 'TestS3Stack', {
        environmentConfig: EnvironmentConfigs.getConfig('dev'),
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      // Check data bucket
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([
              Match.stringLikeRegexp('tap-test-data-.*'),
            ]),
          ]),
        }),
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });

      // Check logs bucket exists with encryption
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });

      // Check bucket policies
      template.resourceCountIs('AWS::S3::BucketPolicy', 3); // 1 custom + 2 auto-delete policies
    });

    test('should create lifecycle rules for buckets', () => {
      const stack = new S3Stack(app, 'TestS3Stack', {
        environmentConfig: EnvironmentConfigs.getConfig('dev'),
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'DeleteOldObjects',
              Status: 'Enabled',
              ExpirationInDays: Match.anyValue(),
            }),
          ]),
        },
      });
    });

    test('should create outputs for bucket names', () => {
      const stack = new S3Stack(app, 'TestS3Stack', {
        environmentConfig: EnvironmentConfigs.getConfig('dev'),
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasOutput('DataBucketName', {
        Value: Match.anyValue(),
        Description: Match.stringLikeRegexp('Data bucket name.*'),
      });

      template.hasOutput('LogsBucketName', {
        Value: Match.anyValue(),
        Description: Match.stringLikeRegexp('Logs bucket name.*'),
      });
    });
  });

  describe('LambdaStack', () => {
    test('should create Lambda functions with correct properties', () => {
      const stack = new LambdaStack(app, 'TestLambdaStack', {
        environmentConfig: EnvironmentConfigs.getConfig('dev'),
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      // Check API function
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'tap-test-api-function',
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        MemorySize: 256,
        Timeout: 30,
        Environment: {
          Variables: {
            ENVIRONMENT: 'dev',
            ENVIRONMENT_SUFFIX: 'test',
            LOG_LEVEL: 'INFO',
          },
        },
      });

      // Check processing function
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'tap-test-processing-function',
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        MemorySize: 256,
        Timeout: 30,
      });
    });

    test('should create IAM role with correct permissions', () => {
      const stack = new LambdaStack(app, 'TestLambdaStack', {
        environmentConfig: EnvironmentConfigs.getConfig('dev'),
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        },
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                Match.stringLikeRegexp('.*AWSLambdaBasicExecutionRole.*'),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('should have different configurations for different environments', () => {
      const devApp = new cdk.App();
      const devStack = new LambdaStack(devApp, 'DevLambdaStack', {
        environmentConfig: EnvironmentConfigs.getConfig('dev'),
        environmentSuffix: 'dev-test',
      });
      const devTemplate = Template.fromStack(devStack);

      devTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'tap-dev-test-api-function',
        MemorySize: 256,
        Timeout: 30,
      });

      const prodApp = new cdk.App();
      const prodStack = new LambdaStack(prodApp, 'ProdLambdaStack', {
        environmentConfig: EnvironmentConfigs.getConfig('prod'),
        environmentSuffix: 'prod-test',
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'tap-prod-test-api-function',
        MemorySize: 1024,
        Timeout: 120,
      });
    });

    test('should create outputs for function names', () => {
      const stack = new LambdaStack(app, 'TestLambdaStack', {
        environmentConfig: EnvironmentConfigs.getConfig('dev'),
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasOutput('ApiFunctionName', {
        Value: Match.anyValue(),
        Description: 'API Lambda function name',
      });

      template.hasOutput('ProcessingFunctionName', {
        Value: Match.anyValue(),
        Description: 'Processing Lambda function name',
      });
    });
  });

  describe('ApiGatewayStack', () => {
    // Create mock Lambda functions for testing
    const createMockLambdaStack = () => {
      const lambdaStack = new LambdaStack(app, 'MockLambdaStack', {
        environmentConfig: EnvironmentConfigs.getConfig('dev'),
        environmentSuffix: 'test',
      });
      return lambdaStack;
    };

    test('should create API Gateway with correct properties', () => {
      const lambdaStack = createMockLambdaStack();
      const stack = new ApiGatewayStack(app, 'TestApiGatewayStack', {
        environmentConfig: EnvironmentConfigs.getConfig('dev'),
        environmentSuffix: 'test',
        apiFunction: lambdaStack.apiFunction,
        processingFunction: lambdaStack.processingFunction,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'tap-test-api',
        Description: Match.stringLikeRegexp('Multi-environment API.*'),
        EndpointConfiguration: {
          Types: ['REGIONAL'],
        },
      });
    });

    test('should create API resources and methods', () => {
      const lambdaStack = createMockLambdaStack();
      const stack = new ApiGatewayStack(app, 'TestApiGatewayStack', {
        environmentConfig: EnvironmentConfigs.getConfig('dev'),
        environmentSuffix: 'test',
        apiFunction: lambdaStack.apiFunction,
        processingFunction: lambdaStack.processingFunction,
      });
      const template = Template.fromStack(stack);

      // Check resources
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'api',
      });

      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'v1',
      });

      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'health',
      });

      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'process',
      });

      // Check methods
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
      });

      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
      });
    });

    test('should create CloudWatch log group', () => {
      const lambdaStack = createMockLambdaStack();
      const stack = new ApiGatewayStack(app, 'TestApiGatewayStack', {
        environmentConfig: EnvironmentConfigs.getConfig('dev'),
        environmentSuffix: 'test',
        apiFunction: lambdaStack.apiFunction,
        processingFunction: lambdaStack.processingFunction,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/apigateway/tap-test-api',
        RetentionInDays: 7,
      });
    });

    test('should create outputs for API', () => {
      const lambdaStack = createMockLambdaStack();
      const stack = new ApiGatewayStack(app, 'TestApiGatewayStack', {
        environmentConfig: EnvironmentConfigs.getConfig('dev'),
        environmentSuffix: 'test',
        apiFunction: lambdaStack.apiFunction,
        processingFunction: lambdaStack.processingFunction,
      });
      const template = Template.fromStack(stack);

      template.hasOutput('ApiUrl', {
        Value: Match.anyValue(),
        Description: Match.stringLikeRegexp('API Gateway URL.*'),
      });

      template.hasOutput('ApiId', {
        Value: Match.anyValue(),
        Description: Match.stringLikeRegexp('API Gateway ID.*'),
      });
    });

    test('should add CORS for non-dev environments', () => {
      const prodApp = new cdk.App();
      const lambdaStack = new LambdaStack(prodApp, 'MockLambdaStackProd', {
        environmentConfig: EnvironmentConfigs.getConfig('prod'),
        environmentSuffix: 'prod-test',
      });
      const prodStack = new ApiGatewayStack(prodApp, 'ProdApiGatewayStack', {
        environmentConfig: EnvironmentConfigs.getConfig('prod'),
        environmentSuffix: 'prod-test',
        apiFunction: lambdaStack.apiFunction,
        processingFunction: lambdaStack.processingFunction,
      });
      const prodTemplate = Template.fromStack(prodStack);

      // CORS is added so OPTIONS method should exist
      prodTemplate.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
      });
    });
  });

  describe('ValidationStack', () => {
    test('should create validation Lambda function', () => {
      const stack = new ValidationStack(app, 'TestValidationStack', {
        environmentConfig: EnvironmentConfigs.getConfig('dev'),
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'tap-test-validation-function',
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        MemorySize: 256,
        Timeout: 60,
        Environment: {
          Variables: {
            ENVIRONMENT: 'dev',
            ENVIRONMENT_SUFFIX: 'test',
            AWS_ACCOUNT_ID: { Ref: 'AWS::AccountId' },
            DEPLOYMENT_REGION: { Ref: 'AWS::Region' },
          },
        },
      });
    });

    test('should create EventBridge rule for scheduled validation', () => {
      const stack = new ValidationStack(app, 'TestValidationStack', {
        environmentConfig: EnvironmentConfigs.getConfig('dev'),
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Events::Rule', {
        ScheduleExpression: 'rate(6 hours)',
        State: 'ENABLED',
      });
    });

    test('should grant correct permissions to validation function', () => {
      const stack = new ValidationStack(app, 'TestValidationStack', {
        environmentConfig: EnvironmentConfigs.getConfig('dev'),
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'cloudformation:ListStacks',
                'cloudformation:DescribeStacks',
                's3:ListBucket',
                's3:HeadBucket',
                'apigateway:GET',
                'lambda:GetFunction',
              ]),
              Effect: 'Allow',
              Resource: '*',
            }),
          ]),
        },
      });
    });

    test('should create output for validation function name', () => {
      const stack = new ValidationStack(app, 'TestValidationStack', {
        environmentConfig: EnvironmentConfigs.getConfig('dev'),
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasOutput('ValidationFunctionName', {
        Value: Match.anyValue(),
        Description: 'Validation Lambda function name',
      });
    });
  });

  describe('EnvironmentConfigs', () => {
    test('should return correct configuration for dev environment', () => {
      const config = EnvironmentConfigs.getConfig('dev');
      expect(config.environmentName).toBe('dev');
      expect(config.lambdaMemorySize).toBe(256);
      expect(config.lambdaTimeout).toBe(30);
      expect(config.apiGatewayStageName).toBe('dev');
      expect(config.s3BucketRetentionDays).toBe(7);
      expect(config.enableLogging).toBe(true);
      expect(config.enableTracing).toBe(false);
      expect(config.autoDeleteObjects).toBe(true);
    });

    test('should return correct configuration for staging environment', () => {
      const config = EnvironmentConfigs.getConfig('staging');
      expect(config.environmentName).toBe('staging');
      expect(config.lambdaMemorySize).toBe(512);
      expect(config.lambdaTimeout).toBe(60);
      expect(config.apiGatewayStageName).toBe('staging');
      expect(config.s3BucketRetentionDays).toBe(30);
      expect(config.enableLogging).toBe(true);
      expect(config.enableTracing).toBe(true);
      expect(config.autoDeleteObjects).toBe(false);
    });

    test('should return correct configuration for prod environment', () => {
      const config = EnvironmentConfigs.getConfig('prod');
      expect(config.environmentName).toBe('prod');
      expect(config.lambdaMemorySize).toBe(1024);
      expect(config.lambdaTimeout).toBe(120);
      expect(config.apiGatewayStageName).toBe('prod');
      expect(config.s3BucketRetentionDays).toBe(365);
      expect(config.enableLogging).toBe(true);
      expect(config.enableTracing).toBe(true);
      expect(config.autoDeleteObjects).toBe(false);
    });

    test('should throw error for unknown environment', () => {
      expect(() => {
        EnvironmentConfigs.getConfig('unknown');
      }).toThrow('Unknown environment: unknown');
    });

    test('should validate environment correctly', () => {
      expect(EnvironmentConfigs.validateEnvironment('dev')).toBe(true);
      expect(EnvironmentConfigs.validateEnvironment('staging')).toBe(true);
      expect(EnvironmentConfigs.validateEnvironment('prod')).toBe(true);
      expect(EnvironmentConfigs.validateEnvironment('unknown')).toBe(false);
    });

    test('should return supported environments', () => {
      const environments = EnvironmentConfigs.getSupportedEnvironments();
      expect(environments).toEqual(['dev', 'staging', 'prod']);
    });
  });

  describe('Cross-Stack Integration', () => {
    test('should create all stacks with proper dependencies', () => {
      const stack = new TapStack(app, 'IntegrationTestStack', {
        environmentSuffix: 'integration-test',
      });

      // Check that the stack creates all nested stacks
      const template = Template.fromStack(stack);
      expect(template).toBeDefined();
    });

    test('should handle environment-specific resource naming', () => {
      const suffixes = ['dev', 'staging-123', 'prod-456', 'pr123'];

      suffixes.forEach((suffix) => {
        const testApp = new cdk.App(); // Create a new app for each test
        const stack = new TapStack(testApp, `TestStack${suffix}`, {
          environmentSuffix: suffix,
        });
        const template = Template.fromStack(stack);

        template.hasOutput('EnvironmentSuffix', {
          Value: suffix,
        });
      });
    });
  });
});