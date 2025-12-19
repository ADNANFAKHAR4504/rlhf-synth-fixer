import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { ServerlessStack } from '../lib/serverless-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack Structure', () => {
    test('should create TapStack successfully', () => {
      expect(stack).toBeInstanceOf(TapStack);
      expect(stack.serverlessStack).toBeInstanceOf(ServerlessStack);
    });

    test('should have correct stack name', () => {
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should pass environment suffix to nested stack', () => {
      expect(stack.serverlessStack).toBeDefined();
    });

    test('should use default environment suffix when none provided', () => {
      const appDefault = new cdk.App();
      const stackDefault = new TapStack(appDefault, 'TestTapStackDefault');
      expect(stackDefault.serverlessStack).toBeDefined();
    });

    test('should use context environment suffix when available', () => {
      const appContext = new cdk.App({
        context: {
          environmentSuffix: 'context-test',
        },
      });
      const stackContext = new TapStack(appContext, 'TestTapStackContext');
      expect(stackContext.serverlessStack).toBeDefined();
    });
  });
});

describe('ServerlessStack', () => {
  let app: cdk.App;
  let parentStack: cdk.Stack;
  let stack: ServerlessStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    // Create parent stack first since ServerlessStack is now a NestedStack
    parentStack = new cdk.Stack(app, 'TestParentStack');
    stack = new ServerlessStack(parentStack, 'TestServerlessStack', {
      environmentSuffix: 'test',
      allowedIpCidrs: ['10.0.0.0/8'],
    });
    template = Template.fromStack(stack);
  });

  describe('Default Values', () => {
    test('should use default values when props not provided', () => {
      const appDefault = new cdk.App();
      const parentStackDefault = new cdk.Stack(appDefault, 'TestParentStackDefault');
      const stackDefault = new ServerlessStack(parentStackDefault, 'TestServerlessStackDefault');
      const templateDefault = Template.fromStack(stackDefault);

      templateDefault.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'CorpUserDataProcessor-dev',
      });

      templateDefault.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Policy: {
          Statement: [
            {
              Condition: {
                IpAddress: {
                  'aws:SourceIp': ['0.0.0.0/0'],
                },
              },
            },
          ],
        },
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'corp-user-data-bucket-test',
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should have S3 bucket policy for auto-delete', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        Bucket: Match.anyValue(),
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
            }),
          ]),
        }),
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with correct properties', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'CorpUserDataProcessor-test',
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Environment: {
          Variables: {
            BUCKET_NAME: {
              Ref: Match.anyValue(),
            },
          },
        },
      });
    });

    test('should have IAM role for Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'CorpLambdaRole-test',
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
              ],
            ],
          },
        ],
      });
    });

    test('should have IAM policies for S3 access', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: ['s3:PutObject', 's3:PutObjectAcl', 's3:GetObject', 's3:DeleteObject'],
            }),
            Match.objectLike({
              Effect: 'Allow',
              Action: 's3:ListBucket',
            }),
          ]),
        },
      });
    });
  });

  describe('API Gateway', () => {
    test('should create API Gateway with correct name', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'CorpUserDataApi-test',
        Description: 'API Gateway for processing user data with IP whitelisting',
        EndpointConfiguration: {
          Types: ['REGIONAL'],
        },
      });
    });

    test('should have IP whitelisting policy', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Policy: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                AWS: '*',
              },
              Action: 'execute-api:Invoke',
              Resource: 'execute-api:/*',
              Condition: {
                IpAddress: {
                  'aws:SourceIp': ['10.0.0.0/8'],
                },
              },
            },
          ],
        },
      });
    });

    test('should create userdata resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'userdata',
      });
    });

    test('should create POST method', () => {
      template.resourceCountIs('AWS::ApiGateway::Method', 3); // GET, POST, OPTIONS
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
      });
    });

    test('should create GET method', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
      });
    });

    test('should create OPTIONS method for CORS', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
      });
    });

    test('should have deployment and stage', () => {
      template.hasResourceProperties('AWS::ApiGateway::Deployment', Match.anyValue());
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
      });
    });
  });

  describe('Outputs', () => {
    test('should have required outputs', () => {
      template.hasOutput('BucketName', {
        Value: {
          Ref: Match.anyValue(),
        },
        Description: 'Name of the S3 bucket for user data',
      });

      template.hasOutput('LambdaFunctionName', {
        Value: {
          Ref: Match.anyValue(),
        },
        Description: 'Name of the Lambda function',
      });

      template.hasOutput('ApiGatewayUrl', {
        Description: 'URL of the API Gateway',
      });

      template.hasOutput('ApiGatewayId', {
        Description: 'ID of the API Gateway',
      });
    });
  });

  describe('Lambda Permissions', () => {
    test('should have Lambda permissions for API Gateway', () => {
      template.resourceCountIs('AWS::Lambda::Permission', 4); // 2 for test, 2 for actual invoke
    });
  });
});
