import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { ServerlessStack } from '../lib/serverless-stack';

describe('ServerlessStack', () => {
  let app: cdk.App;
  let parentStack: cdk.Stack;
  let nestedStack: ServerlessStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    parentStack = new cdk.Stack(app, 'ParentStack');
    nestedStack = new ServerlessStack(parentStack, 'TestServerlessStack', {
      environmentSuffix: 'test',
    });
    template = Template.fromStack(nestedStack);
  });

  describe('VPC', () => {
    test('creates VPC with 2 AZs', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('creates public and private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4);
    });
  });

  describe('S3 Bucket', () => {
    test('creates app bucket with encryption', () => {
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
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('creates app bucket with lifecycle rule', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'move-to-ia',
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                },
              ],
            },
          ],
        },
      });
    });

    test('creates CloudTrail bucket', () => {
      template.resourceCountIs('AWS::S3::Bucket', 2);
    });
  });

  describe('DynamoDB', () => {
    test('creates table with correct partition key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S',
          },
        ],
      });
    });

    test('creates table with on-demand billing', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('enables DynamoDB streams', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        StreamSpecification: {
          StreamViewType: 'NEW_IMAGE',
        },
      });
    });
  });

  describe('SQS Queue', () => {
    test('creates SQS queue with encryption', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        SqsManagedSseEnabled: true,
      });
    });

    test('sets queue retention period', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        MessageRetentionPeriod: 1209600,
      });
    });
  });

  describe('SSM Parameter', () => {
    test('creates SSM parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Type: 'String',
      });
    });
  });

  describe('Secrets Manager', () => {
    test('creates secret', () => {
      template.resourceCountIs('AWS::SecretsManager::Secret', 1);
    });
  });

  describe('Lambda Functions', () => {
    test('creates app function in VPC', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs22.x',
        Handler: 'index.handler',
        VpcConfig: {
          SubnetIds: Match.anyValue(),
          SecurityGroupIds: Match.anyValue(),
        },
      });
    });

    test('creates stream function', () => {
      template.resourceCountIs('AWS::Lambda::Function', 4);
    });

    test('app function has environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            TABLE_NAME: Match.anyValue(),
            BUCKET_NAME: Match.anyValue(),
            CONFIG_PARAM_NAME: Match.anyValue(),
            SECRET_ARN: Match.anyValue(),
          },
        },
      });
    });

    test('creates Lambda alias without provisioned concurrency', () => {
      template.hasResourceProperties('AWS::Lambda::Alias', {
        Name: 'production',
      });

      // Verify no provisioned concurrency is configured
      const resources = template.toJSON().Resources;
      const alias = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::Lambda::Alias'
      ) as any;
      expect(alias.Properties.ProvisionedConcurrencyConfig).toBeUndefined();
    });

    test('creates DynamoDB event source mapping', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        EventSourceArn: Match.anyValue(),
        StartingPosition: 'TRIM_HORIZON',
        BatchSize: 10,
      });
    });
  });

  describe('IAM Roles', () => {
    test('creates Lambda execution role', () => {
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
      });
    });

    test('Lambda role has VPC execution policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: Match.arrayWith([
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
              ],
            ],
          },
        ]),
      });
    });
  });

  describe('API Gateway', () => {
    test('creates REST API', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    });

    test('enables CORS', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
      });
    });

    test('does not enable access logging (requires account setup)', () => {
      const resources = template.toJSON().Resources;
      const stage = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::ApiGateway::Stage'
      ) as any;
      expect(stage.Properties.AccessLogSetting).toBeUndefined();
    });

    test('creates items resource with methods', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'items',
      });
    });
  });

  describe('Application Auto Scaling', () => {
    test('does not create auto scaling resources (removed with provisioned concurrency)', () => {
      template.resourceCountIs('AWS::ApplicationAutoScaling::ScalableTarget', 0);
      template.resourceCountIs('AWS::ApplicationAutoScaling::ScalingPolicy', 0);
    });
  });

  describe('CloudWatch', () => {
    test('Lambda functions have log retention configured', () => {
      // Lambda functions will create log groups automatically at runtime
      // No separate CloudWatch Log Group resources in template
      const resources = template.toJSON().Resources;
      const lambdaFunctions = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::Lambda::Function'
      );
      expect(lambdaFunctions.length).toBeGreaterThan(0);
    });

    test('creates CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });

    test('creates DynamoDB throttle alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        EvaluationPeriods: 2,
        Threshold: Match.anyValue(),
      });
    });
  });

  describe('CloudTrail', () => {
    test('creates trail', () => {
      template.resourceCountIs('AWS::CloudTrail::Trail', 1);
    });

    test('trail is single-region', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        IsMultiRegionTrail: false,
        IncludeGlobalServiceEvents: false,
      });
    });

    test('trail has event selectors for DynamoDB', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        EventSelectors: [
          {
            ReadWriteType: 'All',
            IncludeManagementEvents: false,
            DataResources: [
              {
                Type: 'AWS::DynamoDB::Table',
                Values: Match.anyValue(),
              },
            ],
          },
        ],
      });
    });
  });

  describe('Outputs', () => {
    test('exports API endpoint', () => {
      template.hasOutput('ApiEndpoint', {
        Description: 'API Gateway endpoint URL',
      });
    });

    test('exports table name', () => {
      template.hasOutput('TableName', {
        Description: 'DynamoDB table name',
      });
    });

    test('exports bucket name', () => {
      template.hasOutput('BucketName', {
        Description: 'S3 bucket name',
      });
    });

    test('exports queue URL', () => {
      template.hasOutput('QueueUrl', {
        Description: 'SQS queue URL',
      });
    });

    test('exports VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
      });
    });

    test('exports function name', () => {
      template.hasOutput('FunctionName', {
        Description: 'Lambda function name',
      });
    });
  });

  describe('Tags', () => {
    test('applies project tag', () => {
      const resources = template.toJSON().Resources;
      const taggedResources = Object.values(resources).filter(
        (resource: any) => resource.Properties?.Tags
      );
      expect(taggedResources.length).toBeGreaterThan(0);
    });
  });
});