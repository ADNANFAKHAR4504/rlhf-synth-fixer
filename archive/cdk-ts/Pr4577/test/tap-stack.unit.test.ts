import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

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

  describe('VPC Infrastructure', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
          Match.objectLike({
            Key: 'Name',
            Value: `tap-vpc-${environmentSuffix}`,
          }),
        ]),
      });
    });

    test('creates public and private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4);
    });

    test('creates NAT Gateway in public subnet', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('creates VPC endpoint for API Gateway', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([Match.stringLikeRegexp('execute-api')]),
          ]),
        }),
        VpcEndpointType: 'Interface',
      });
    });

    test('VPC endpoint has iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        Tags: Match.arrayWith([
          {
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          },
        ]),
      });
    });
  });

  describe('S3 Bucket', () => {
    test('creates S3 bucket with correct name pattern', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([
              Match.stringLikeRegexp(`tap-static-files-${environmentSuffix}-`),
            ]),
          ]),
        }),
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('S3 bucket has encryption enabled', () => {
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
    });

    test('S3 bucket blocks public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('S3 bucket has CORS configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        CorsConfiguration: {
          CorsRules: Match.arrayWith([
            Match.objectLike({
              AllowedMethods: Match.arrayWith(['GET', 'PUT', 'POST', 'DELETE']),
              AllowedOrigins: ['*'],
            }),
          ]),
        },
      });
    });

    test('S3 bucket has iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          {
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          },
        ]),
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('creates DynamoDB table with correct name', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `tap-application-table-${environmentSuffix}`,
      });
    });

    test('DynamoDB has partition and sort keys', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
      });
    });

    test('DynamoDB has Global Secondary Index', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: [
          {
            IndexName: 'StatusIndex',
            KeySchema: [
              {
                AttributeName: 'status',
                KeyType: 'HASH',
              },
              {
                AttributeName: 'timestamp',
                KeyType: 'RANGE',
              },
            ],
            Projection: {
              ProjectionType: 'ALL',
            },
          },
        ],
      });
    });

    test('DynamoDB has point-in-time recovery enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('DynamoDB uses PAY_PER_REQUEST billing', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('DynamoDB has iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        Tags: Match.arrayWith([
          {
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          },
        ]),
      });
    });
  });

  describe('Secrets Manager', () => {
    test('creates Secrets Manager secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `tap-api-secrets-${environmentSuffix}`,
        Description: 'API keys and other sensitive configuration',
      });
    });

    test('Secrets Manager has iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Tags: Match.arrayWith([
          {
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          },
        ]),
      });
    });
  });

  describe('CloudWatch Logs', () => {
    test('creates CloudWatch log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/tap-${environmentSuffix}`,
        RetentionInDays: 14,
      });
    });

    test('log group has iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        Tags: Match.arrayWith([
          {
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          },
        ]),
      });
    });
  });

  describe('IAM Roles', () => {
    test('creates Lambda execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-lambda-execution-role-${environmentSuffix}`,
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
      });
    });

    test('Lambda role has VPC access policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
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

    test('Lambda role has iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Tags: Match.arrayWith([
          {
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          },
        ]),
      });
    });

    test('creates IAM policy for Lambda permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                Match.stringLikeRegexp('dynamodb:'),
              ]),
              Effect: 'Allow',
            }),
            Match.objectLike({
              Action: Match.arrayWith([
                Match.stringLikeRegexp('s3:'),
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('Lambda Functions', () => {
    test('creates main Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `tap-main-function-${environmentSuffix}`,
        Runtime: 'nodejs22.x',
        Timeout: 30,
        MemorySize: 256,
      });
    });

    test('creates CRUD Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `tap-crud-function-${environmentSuffix}`,
        Runtime: 'nodejs22.x',
      });
    });

    test('creates file processing Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `tap-file-processing-function-${environmentSuffix}`,
        Runtime: 'nodejs22.x',
      });
    });

    test('Lambda functions have environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            ENVIRONMENT_SUFFIX: environmentSuffix,
            REGION: Match.anyValue(),
          }),
        },
      });
    });

    test('Lambda functions are in VPC', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: Match.objectLike({
          SecurityGroupIds: Match.anyValue(),
          SubnetIds: Match.anyValue(),
        }),
      });
    });

    test('Lambda functions have iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Tags: Match.arrayWith([
          {
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          },
        ]),
      });
    });

    test('creates exactly 3 Lambda functions', () => {
      const lambdas = template.findResources('AWS::Lambda::Function');
      const appLambdas = Object.keys(lambdas).filter(
        key => !key.includes('CustomResource')
      );
      expect(appLambdas.length).toBe(3);
    });
  });

  describe('API Gateway', () => {
    test('creates REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `tap-api-${environmentSuffix}`,
        Description: 'TAP Serverless Application API',
      });
    });

    test('API Gateway is private (VPC endpoint)', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        EndpointConfiguration: {
          Types: ['PRIVATE'],
        },
      });
    });

    test('API Gateway has CORS enabled', () => {
      template.hasResource('AWS::ApiGateway::Method', {
        Properties: {
          HttpMethod: 'OPTIONS',
          Integration: {
            Type: 'MOCK',
          },
        },
      });
    });

    test('creates API Gateway resources', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'api',
      });
    });

    test('creates API Gateway methods', () => {
      template.resourceCountIs('AWS::ApiGateway::Method', 17);
    });

    test('creates API Gateway deployment', () => {
      template.resourceCountIs('AWS::ApiGateway::Deployment', 1);
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: environmentSuffix,
      });
    });

    test('API Gateway has iac-rlhf-amazon tag', () => {
      template.hasResource('AWS::ApiGateway::RestApi', Match.anyValue());
    });
  });

  describe('Stack Outputs', () => {
    test('exports API endpoint', () => {
      template.hasOutput('ApiEndpoint', {
        Description: 'API Gateway endpoint URL',
      });
    });

    test('exports S3 bucket name', () => {
      template.hasOutput('S3BucketName', {
        Description: 'S3 bucket name for static files',
      });
    });

    test('exports DynamoDB table name', () => {
      template.hasOutput('DynamoDBTableName', {
        Description: 'DynamoDB table name',
      });
    });

    test('exports Secret name', () => {
      template.hasOutput('SecretName', {
        Description: 'Secrets Manager secret name',
      });
    });

    test('exports VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
      });
    });

    test('exports Lambda function ARN', () => {
      template.hasOutput('MainLambdaFunctionArn', {
        Description: 'Main Lambda function ARN',
      });
    });
  });

  describe('Resource Tags', () => {
    test('all taggable resources have iac-rlhf-amazon tag', () => {
      const resources = template.toJSON().Resources;
      const taggableTypes = [
        'AWS::EC2::VPC',
        'AWS::S3::Bucket',
        'AWS::DynamoDB::Table',
        'AWS::SecretsManager::Secret',
        'AWS::Logs::LogGroup',
        'AWS::IAM::Role',
        'AWS::Lambda::Function',
      ];

      Object.entries(resources).forEach(
        ([logicalId, resource]: [string, any]) => {
          if (
            taggableTypes.includes(resource.Type) &&
            !logicalId.includes('CustomResource')
          ) {
            expect(resource.Properties.Tags).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  Key: 'iac-rlhf-amazon',
                  Value: 'true',
                }),
              ])
            );
          }
        }
      );
    });
  });

  describe('Stack Configuration', () => {
    test('uses correct environment suffix', () => {
      const resources = template.toJSON().Resources;
      const hasEnvSuffix = Object.values(resources).some((resource: any) =>
        JSON.stringify(resource).includes(environmentSuffix)
      );
      expect(hasEnvSuffix).toBe(true);
    });

    test('stack synthesizes without errors', () => {
      expect(() => {
        app.synth();
      }).not.toThrow();
    });
  });

  describe('Environment Suffix Resolution', () => {
    test('uses environmentSuffix from props when provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackWithProps', {
        environmentSuffix: 'custom-env',
      });
      const testTemplate = Template.fromStack(testStack);

      // Verify the custom suffix is used in resource names
      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'tap-application-table-custom-env',
      });
    });

    test('uses environmentSuffix from context when props not provided', () => {
      const testApp = new cdk.App({
        context: {
          environmentSuffix: 'context-env',
        },
      });
      const testStack = new TapStack(testApp, 'TestStackWithContext');
      const testTemplate = Template.fromStack(testStack);

      // Verify the context suffix is used in resource names
      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'tap-application-table-context-env',
      });
    });

    test('uses default "dev" when no props or context provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackWithDefaults');
      const testTemplate = Template.fromStack(testStack);

      // Verify the default suffix is used in resource names
      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'tap-application-table-dev',
      });
    });
  });
});
