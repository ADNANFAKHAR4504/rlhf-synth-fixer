import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    template = Template.fromStack(stack);
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [{
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256'
            }
          }]
        }
      });
    });

    test('should have versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('should block public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('should have proper naming convention', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(`lambda-artifacts-${environmentSuffix}-.*`)
      });
    });

    test('should have auto-delete objects enabled', () => {
      template.hasResource('Custom::S3AutoDeleteObjects', {
        Properties: {
          BucketName: {
            Ref: Match.anyValue()
          }
        }
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with Python 3.12 runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.12',
        Handler: 'index.handler'
      });
    });

    test('should have proper function name', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `serverless-api-${environmentSuffix}`
      });
    });

    test('should have correct memory and timeout settings', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        MemorySize: 256,
        Timeout: 30
      });
    });

    test('should not have Lambda Insights (LocalStack compatibility)', () => {
      // Lambda Insights layer removed for LocalStack compatibility
      // The main serverless function should not have Layers property defined
      const resources = template.findResources('AWS::Lambda::Function');
      const serverlessApiFunction = Object.values(resources).find((resource: any) =>
        resource.Properties.FunctionName === 'serverless-api-test'
      );
      expect(serverlessApiFunction).toBeDefined();
      // Layers property should be undefined or empty for LocalStack compatibility
      expect(serverlessApiFunction?.Properties.Layers).toBeUndefined();
    });

    test('should have environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            BUCKET_NAME: {
              Ref: Match.anyValue()
            }
          }
        }
      });
    });

    test('should have inline code', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Code: {
          ZipFile: Match.anyValue()
        }
      });
    });
  });

  describe('IAM Role', () => {
    test('should create execution role for Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com'
            }
          }]
        }
      });
    });

    test('should have CloudWatch Logs permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'CloudWatchLogsPolicy',
            PolicyDocument: {
              Statement: [{
                Effect: 'Allow',
                Action: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents'
                ],
                Resource: Match.anyValue()
              }]
            }
          })
        ])
      });
    });

    test('should have S3 permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'S3Policy',
            PolicyDocument: {
              Statement: [{
                Effect: 'Allow',
                Action: [
                  's3:GetObject',
                  's3:PutObject'
                ],
                Resource: Match.anyValue()
              }]
            }
          })
        ])
      });
    });

    test('should have AWS managed policies attached', () => {
      // Check for Lambda execution role specifically
      const resources = template.toJSON().Resources;
      const lambdaRole = Object.values(resources).find((r: any) => 
        r.Type === 'AWS::IAM::Role' && 
        r.Properties?.Policies?.some((p: any) => p.PolicyName === 'CloudWatchLogsPolicy')
      ) as any;
      
      expect(lambdaRole).toBeDefined();
      expect(lambdaRole.Properties.ManagedPolicyArns).toBeDefined();
      // Lambda Insights policy removed for LocalStack, so expect only 1 managed policy
      expect(lambdaRole.Properties.ManagedPolicyArns.length).toBeGreaterThanOrEqual(1);
      
      // Check for basic execution role
      const hasBasicExecutionRole = lambdaRole.Properties.ManagedPolicyArns.some((arn: any) => {
        if (typeof arn === 'string') {
          return arn.includes('AWSLambdaBasicExecutionRole');
        }
        if (arn['Fn::Join']) {
          const joinParts = arn['Fn::Join'][1];
          return joinParts.some((part: any) => 
            typeof part === 'string' && part.includes('AWSLambdaBasicExecutionRole')
          );
        }
        return false;
      });
      
      expect(hasBasicExecutionRole).toBe(true);
    });
  });

  describe('CloudWatch Logs', () => {
    test('should create log group for Lambda', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/serverless-api-${environmentSuffix}`,
        RetentionInDays: 7
      });
    });

    test('should have DESTROY removal policy', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      const logGroupKeys = Object.keys(logGroups);
      expect(logGroupKeys.length).toBeGreaterThan(0);
      
      logGroupKeys.forEach(key => {
        expect(logGroups[key].DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('API Gateway HTTP API v2', () => {
    test('should create HTTP API', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
        Name: `serverless-api-${environmentSuffix}`,
        ProtocolType: 'HTTP'
      });
    });

    test('should have CORS configuration', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
        CorsConfiguration: {
          AllowOrigins: ['*'],
          AllowMethods: ['*'],
          AllowHeaders: Match.arrayWith([
            'Content-Type',
            'X-Amz-Date',
            'Authorization',
            'X-Api-Key',
            'X-Amz-Security-Token'
          ])
        }
      });
    });

    test('should have description', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
        Description: 'Serverless API using HTTP API v2 with Lambda integration'
      });
    });

    test('should create default stage', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Stage', {
        StageName: '$default',
        AutoDeploy: true
      });
    });
  });

  describe('API Gateway Routes', () => {
    test('should create GET / route', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
        RouteKey: 'GET /',
        AuthorizationType: 'NONE'
      });
    });

    test('should create ANY /api/{proxy+} route', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
        RouteKey: 'ANY /api/{proxy+}',
        AuthorizationType: 'NONE'
      });
    });
  });

  describe('API Gateway Integration', () => {
    test('should create Lambda integration', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Integration', {
        IntegrationType: 'AWS_PROXY',
        PayloadFormatVersion: '2.0'
      });
    });

    test('should have Lambda invoke permissions for API Gateway', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 'apigateway.amazonaws.com'
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should output API URL', () => {
      template.hasOutput('ApiUrl', {
        Description: 'HTTP API Gateway URL',
        Export: {
          Name: `ServerlessApiUrl-${environmentSuffix}`
        }
      });
    });

    test('should output Lambda function name', () => {
      template.hasOutput('LambdaFunctionName', {
        Description: 'Lambda function name',
        Export: {
          Name: `ServerlessLambdaFunction-${environmentSuffix}`
        }
      });
    });

    test('should output S3 bucket name', () => {
      template.hasOutput('S3BucketName', {
        Description: 'S3 bucket for Lambda artifacts',
        Export: {
          Name: `ServerlessS3Bucket-${environmentSuffix}`
        }
      });
    });

    test('should output CloudWatch log group name', () => {
      template.hasOutput('LogGroupName', {
        Description: 'CloudWatch Log Group name',
        Export: {
          Name: `ServerlessLogGroup-${environmentSuffix}`
        }
      });
    });
  });

  describe('Stack Configuration', () => {
    test('should handle environment suffix properly', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: 'custom'
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'serverless-api-custom'
      });
    });

    test('should use default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      const defaultTemplate = Template.fromStack(defaultStack);

      defaultTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.anyValue()
      });
    });
  });

  describe('Resource Count', () => {
    test('should create expected number of resources', () => {
      const resources = template.toJSON().Resources;
      const resourceTypes = Object.values(resources).map((r: any) => r.Type);
      
      expect(resourceTypes.filter(t => t === 'AWS::S3::Bucket').length).toBe(1);
      expect(resourceTypes.filter(t => t === 'AWS::Lambda::Function').length).toBeGreaterThanOrEqual(1);
      expect(resourceTypes.filter(t => t === 'AWS::IAM::Role').length).toBeGreaterThanOrEqual(1);
      expect(resourceTypes.filter(t => t === 'AWS::Logs::LogGroup').length).toBe(1);
      expect(resourceTypes.filter(t => t === 'AWS::ApiGatewayV2::Api').length).toBe(1);
      expect(resourceTypes.filter(t => t === 'AWS::ApiGatewayV2::Stage').length).toBe(1);
      expect(resourceTypes.filter(t => t === 'AWS::ApiGatewayV2::Route').length).toBe(2);
    });
  });

  describe('Security Best Practices', () => {
    test('should not have any resources with Retain deletion policy', () => {
      const resources = template.toJSON().Resources;
      Object.values(resources).forEach((resource: any) => {
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('should have proper tags on resources', () => {
      const resources = template.findResources('AWS::S3::Bucket');
      Object.values(resources).forEach((resource: any) => {
        expect(resource.Properties.Tags).toBeDefined();
      });
    });
  });
});