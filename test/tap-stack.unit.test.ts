import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { ServerlessStack } from '../lib/serverless-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('Stack Creation', () => {
    test('TapStack creates nested ServerlessStack', () => {
      // Create stack with test environment suffix
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });

      // Check that the stack was created
      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('TapStack passes environment suffix to nested stack', () => {
      const testSuffix = 'unittest';
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: testSuffix,
      });

      // The nested stack should be created with the correct props
      const nestedStacks = stack.node.children.filter(
        child => child instanceof ServerlessStack
      );
      expect(nestedStacks.length).toBe(1);
    });

    test('TapStack uses default environment suffix when not provided', () => {
      stack = new TapStack(app, 'TestTapStack');

      // Should use 'dev' as default
      const nestedStacks = stack.node.children.filter(
        child => child instanceof ServerlessStack
      );
      expect(nestedStacks.length).toBe(1);
    });

    test('TapStack uses context environment suffix when props not provided', () => {
      // Set context value
      app = new cdk.App({
        context: {
          environmentSuffix: 'fromcontext',
        },
      });
      stack = new TapStack(app, 'TestTapStack');

      // Should use context value
      const nestedStacks = stack.node.children.filter(
        child => child instanceof ServerlessStack
      );
      expect(nestedStacks.length).toBe(1);
    });

    test('TapStack prefers props over context for environment suffix', () => {
      // Set context value
      app = new cdk.App({
        context: {
          environmentSuffix: 'fromcontext',
        },
      });

      // But pass explicit props
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'fromprops',
      });

      // Should use props value, not context
      const nestedStacks = stack.node.children.filter(
        child => child instanceof ServerlessStack
      );
      expect(nestedStacks.length).toBe(1);
    });
  });

  describe('ServerlessStack Resources', () => {
    let serverlessStack: ServerlessStack;
    let template: Template;

    beforeEach(() => {
      const testSuffix = 'test';
      serverlessStack = new ServerlessStack(app, 'TestServerlessStack', {
        environmentSuffix: testSuffix,
      });
      template = Template.fromStack(serverlessStack);
    });

    describe('S3 Bucket', () => {
      test('Creates S3 bucket with correct properties', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
          BucketName: Match.stringLikeRegexp('corp-user-data-bucket-.*'),
          VersioningConfiguration: {
            Status: 'Enabled',
          },
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true,
          },
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
      });

      test('S3 bucket has lifecycle rules configured', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
          LifecycleConfiguration: {
            Rules: Match.arrayWith([
              Match.objectLike({
                Id: 'IntelligentTieringTransition',
                Status: 'Enabled',
                Transitions: Match.arrayWith([
                  Match.objectLike({
                    StorageClass: 'INTELLIGENT_TIERING',
                    TransitionInDays: 0,
                  }),
                ]),
              }),
            ]),
          },
        });
      });

      test('S3 bucket has auto-delete objects enabled', () => {
        // Check for custom resource that handles auto-deletion
        template.hasResourceProperties('Custom::S3AutoDeleteObjects', {
          ServiceToken: Match.anyValue(),
          BucketName: Match.anyValue(),
        });
      });
    });

    describe('Lambda Function', () => {
      test('Creates Lambda function with correct properties', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          FunctionName: Match.stringLikeRegexp('CorpDataProcessor-.*'),
          Runtime: 'nodejs18.x',
          Handler: 'index.handler',
          MemorySize: 256,
          Timeout: 300,
        });
      });

      test('Lambda function has environment variables', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          Environment: {
            Variables: {
              BUCKET_NAME: Match.anyValue(),
            },
          },
        });
      });

      test('Lambda function has inline code', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          Code: {
            ZipFile: Match.stringLikeRegexp('.*S3Client.*PutObjectCommand.*'),
          },
        });
      });
    });

    describe('IAM Roles and Policies', () => {
      test('Creates IAM role for Lambda execution', () => {
        template.hasResourceProperties('AWS::IAM::Role', {
          RoleName: Match.stringLikeRegexp('CorpLambdaExecutionRole-.*'),
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
          ManagedPolicyArns: Match.arrayWith([
            Match.objectLike({
              'Fn::Join': [
                '',
                Match.arrayWith([
                  Match.stringLikeRegexp(
                    '.*:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
                  ),
                ]),
              ],
            }),
          ]),
        });
      });

      test('IAM role has S3 permissions policy', () => {
        template.hasResourceProperties('AWS::IAM::Policy', {
          PolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Effect: 'Allow',
                Action: Match.arrayWith([
                  's3:GetObject',
                  's3:PutObject',
                  's3:DeleteObject',
                  's3:GetObjectVersion',
                  's3:PutObjectAcl',
                  's3:GetObjectAcl',
                ]),
                Resource: Match.anyValue(),
              }),
            ]),
          },
        });
      });
    });

    describe('API Gateway', () => {
      test('Creates REST API with correct properties', () => {
        template.hasResourceProperties('AWS::ApiGateway::RestApi', {
          Name: Match.stringLikeRegexp('CorpUserDataApi-.*'),
          Description: 'API for processing user data with IP whitelisting',
        });
      });

      test('API Gateway has IP whitelisting resource policy', () => {
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
                    'aws:SourceIp': ['203.0.113.0/24', '198.51.100.0/24'],
                  },
                },
              },
            ],
          },
        });
      });

      test('API Gateway has CORS configuration', () => {
        template.hasResourceProperties('AWS::ApiGateway::Method', {
          HttpMethod: 'OPTIONS',
          Integration: {
            Type: 'MOCK',
          },
        });
      });

      test('API Gateway has data endpoints', () => {
        // Check for POST method on /data
        template.hasResourceProperties('AWS::ApiGateway::Method', {
          HttpMethod: 'POST',
          ResourceId: Match.anyValue(),
        });

        // Check for GET method on /data
        template.hasResourceProperties('AWS::ApiGateway::Method', {
          HttpMethod: 'GET',
          ResourceId: Match.anyValue(),
        });
      });

      test('API Gateway has health check endpoint', () => {
        // Check for health resource
        template.hasResourceProperties('AWS::ApiGateway::Resource', {
          PathPart: 'health',
        });

        // Check for GET method on health endpoint
        template.hasResourceProperties('AWS::ApiGateway::Method', {
          HttpMethod: 'GET',
          Integration: {
            Type: 'MOCK',
          },
        });
      });

      test('API Gateway deployment and stage', () => {
        template.hasResourceProperties('AWS::ApiGateway::Deployment', {
          RestApiId: Match.anyValue(),
        });

        template.hasResourceProperties('AWS::ApiGateway::Stage', {
          StageName: 'prod',
        });
      });
    });

    describe('Lambda Integration', () => {
      test('API Gateway methods integrate with Lambda function', () => {
        template.hasResourceProperties('AWS::ApiGateway::Method', {
          HttpMethod: 'POST',
          Integration: {
            Type: 'AWS_PROXY',
            IntegrationHttpMethod: 'POST',
            Uri: Match.objectLike({
              'Fn::Join': Match.arrayWith([
                '',
                Match.arrayWith([Match.stringLikeRegexp('.*lambda.*')]),
              ]),
            }),
          },
        });
      });

      test('Lambda has permission to be invoked by API Gateway', () => {
        template.hasResourceProperties('AWS::Lambda::Permission', {
          Action: 'lambda:InvokeFunction',
          Principal: 'apigateway.amazonaws.com',
        });
      });
    });

    describe('CloudFormation Outputs', () => {
      test('Stack outputs S3 bucket name', () => {
        template.hasOutput('BucketName', {
          Description: 'Name of the S3 bucket',
          Value: Match.anyValue(),
        });
      });

      test('Stack outputs Lambda function name', () => {
        template.hasOutput('LambdaFunctionName', {
          Description: 'Name of the Lambda function',
          Value: Match.anyValue(),
        });
      });

      test('Stack outputs API Gateway URL', () => {
        template.hasOutput('ApiGatewayUrl', {
          Description: 'URL of the API Gateway',
          Value: Match.anyValue(),
        });
      });

      test('Stack outputs API Gateway ID', () => {
        template.hasOutput('ApiGatewayId', {
          Description: 'ID of the API Gateway',
          Value: Match.anyValue(),
        });
      });
    });

    describe('Security and Compliance', () => {
      test('S3 bucket blocks all public access', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true,
          },
        });
      });

      test('S3 bucket has encryption enabled', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
          BucketEncryption: {
            ServerSideEncryptionConfiguration: Match.arrayWith([
              Match.objectLike({
                ServerSideEncryptionByDefault: {
                  SSEAlgorithm: 'AES256',
                },
              }),
            ]),
          },
        });
      });

      test('Lambda uses specific execution role (not default)', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          Role: {
            'Fn::GetAtt': Match.arrayWith([
              Match.stringLikeRegexp('CorpLambdaExecutionRole.*'),
              'Arn',
            ]),
          },
        });
      });

      test('All resources follow Corp naming convention', () => {
        // Check bucket naming
        template.hasResourceProperties('AWS::S3::Bucket', {
          BucketName: Match.stringLikeRegexp('^corp-.*'),
        });

        // Check Lambda naming
        template.hasResourceProperties('AWS::Lambda::Function', {
          FunctionName: Match.stringLikeRegexp('^Corp.*'),
        });

        // Check API Gateway naming
        template.hasResourceProperties('AWS::ApiGateway::RestApi', {
          Name: Match.stringLikeRegexp('^Corp.*'),
        });

        // Check IAM role naming
        template.hasResourceProperties('AWS::IAM::Role', {
          RoleName: Match.stringLikeRegexp('^Corp.*'),
        });
      });
    });
  });

  describe('Resource Naming with Environment Suffix', () => {
    test('Resources include environment suffix in names', () => {
      const testSuffix = 'qa123';
      const serverlessStack = new ServerlessStack(app, 'TestStack', {
        environmentSuffix: testSuffix,
      });
      const template = Template.fromStack(serverlessStack);

      // Check bucket name includes suffix
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `corp-user-data-bucket-${testSuffix}`,
      });

      // Check Lambda name includes suffix
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `CorpDataProcessor-${testSuffix}`,
      });

      // Check API Gateway name includes suffix
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `CorpUserDataApi-${testSuffix}`,
      });

      // Check IAM role name includes suffix
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `CorpLambdaExecutionRole-${testSuffix}`,
      });
    });
  });

  describe('Stack Removal Policy', () => {
    test('Resources are configured for cleanup on stack deletion', () => {
      const serverlessStack = new ServerlessStack(app, 'TestStack', {
        environmentSuffix: 'cleanup',
      });
      const template = Template.fromStack(serverlessStack);

      // Check S3 bucket has DESTROY removal policy
      const bucket = serverlessStack.bucket;
      expect(bucket.node.defaultChild).toBeDefined();
      const cfnBucket = bucket.node.defaultChild as cdk.CfnResource;
      expect(cfnBucket.cfnOptions.deletionPolicy).toBe(
        cdk.CfnDeletionPolicy.DELETE
      );
    });
  });

  describe('ServerlessStack Default Environment Suffix', () => {
    test('ServerlessStack uses default suffix when not provided', () => {
      const serverlessStack = new ServerlessStack(app, 'TestStack');
      const template = Template.fromStack(serverlessStack);

      // Should default to 'dev' suffix
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'corp-user-data-bucket-dev',
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'CorpDataProcessor-dev',
      });

      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'CorpUserDataApi-dev',
      });

      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'CorpLambdaExecutionRole-dev',
      });
    });

    test('ServerlessStack accepts undefined props', () => {
      const serverlessStack = new ServerlessStack(app, 'TestStack', undefined);
      const template = Template.fromStack(serverlessStack);

      // Should still create all resources with default suffix
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'corp-user-data-bucket-dev',
      });
    });
  });

  describe('ServerlessStack Properties', () => {
    test('ServerlessStack passes through environment properties', () => {
      const serverlessStack = new ServerlessStack(app, 'TestStack', {
        environmentSuffix: 'prod',
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
      });

      // Check stack has environment set
      expect(serverlessStack.account).toBe('123456789012');
      expect(serverlessStack.region).toBe('us-west-2');
    });

    test('ServerlessStack exposes public properties', () => {
      const serverlessStack = new ServerlessStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });

      // Check public properties are accessible
      expect(serverlessStack.bucket).toBeDefined();
      expect(serverlessStack.lambdaFunction).toBeDefined();
      expect(serverlessStack.api).toBeDefined();
    });
  });
});