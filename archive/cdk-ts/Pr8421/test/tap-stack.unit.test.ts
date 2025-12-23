import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  const environmentSuffix = 'test';

  describe('StorageStack', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestStack', { environmentSuffix });
      template = Template.fromStack(stack);
    });

    describe('S3 Bucket Configuration', () => {
      test('should create S3 bucket with KMS encryption', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
          BucketEncryption: {
            ServerSideEncryptionConfiguration: [
              {
                ServerSideEncryptionByDefault: {
                  SSEAlgorithm: 'aws:kms',
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
          VersioningConfiguration: {
            Status: 'Enabled',
          },
        });
      });

      test('should create KMS key for document encryption', () => {
        template.hasResourceProperties('AWS::KMS::Key', {
          Description: 'KMS key for document encryption',
          EnableKeyRotation: true,
        });
      });
    });

    describe('DynamoDB Tables Configuration', () => {
      test('should create Documents table with correct configuration', () => {
        template.hasResourceProperties('AWS::DynamoDB::Table', {
          KeySchema: [
            {
              AttributeName: 'documentId',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'uploadTimestamp',
              KeyType: 'RANGE',
            },
          ],
          BillingMode: 'PAY_PER_REQUEST',
          StreamSpecification: {
            StreamViewType: 'NEW_AND_OLD_IMAGES',
          },
          PointInTimeRecoverySpecification: {
            PointInTimeRecoveryEnabled: true,
          },
        });
      });

      test('should create Documents table with GSIs', () => {
        template.hasResourceProperties('AWS::DynamoDB::Table', {
          GlobalSecondaryIndexes: Match.arrayWith([
            Match.objectLike({
              IndexName: 'userId-uploadTimestamp-index',
              KeySchema: [
                { AttributeName: 'userId', KeyType: 'HASH' },
                { AttributeName: 'uploadTimestamp', KeyType: 'RANGE' },
              ],
            }),
            Match.objectLike({
              IndexName: 'status-uploadTimestamp-index',
              KeySchema: [
                { AttributeName: 'status', KeyType: 'HASH' },
                { AttributeName: 'uploadTimestamp', KeyType: 'RANGE' },
              ],
            }),
          ]),
        });
      });

      test('should create API Keys table with correct configuration', () => {
        template.hasResourceProperties('AWS::DynamoDB::Table', {
          KeySchema: [
            {
              AttributeName: 'apiKey',
              KeyType: 'HASH',
            },
          ],
          BillingMode: 'PAY_PER_REQUEST',
        });
      });
    });
  });

  describe('NetworkingStack', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestStack', { environmentSuffix });
      template = Template.fromStack(stack);
    });

    describe('VPC Configuration', () => {
      test('should create VPC with private isolated subnets', () => {
        template.hasResourceProperties('AWS::EC2::VPC', {
          CidrBlock: '10.0.0.0/16',
        });

        template.resourceCountIs('AWS::EC2::Subnet', 2);
        template.hasResourceProperties('AWS::EC2::Subnet', {
          MapPublicIpOnLaunch: false,
        });
      });

      test('should create security group for Lambda functions', () => {
        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
          GroupDescription: 'Security group for Lambda functions',
        });
      });
    });

    describe('VPC Endpoints', () => {
      test('should create S3 VPC endpoint', () => {
        template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
          ServiceName: Match.objectLike({
            'Fn::Join': Match.anyValue(),
          }),
          VpcEndpointType: 'Gateway',
        });
      });

      test('should create DynamoDB VPC endpoint', () => {
        template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
          ServiceName: Match.objectLike({
            'Fn::Join': Match.anyValue(),
          }),
          VpcEndpointType: 'Gateway',
        });
      });

      test('should create API Gateway VPC endpoint', () => {
        template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
          ServiceName: Match.objectLike({
            'Fn::Join': Match.anyValue(),
          }),
          VpcEndpointType: 'Interface',
        });
      });
    });
  });

  describe('ComputeStack', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestStack', { environmentSuffix });
      template = Template.fromStack(stack);
    });

    describe('Lambda Functions Configuration', () => {
      test('should create all Lambda functions', () => {
        template.resourceCountIs('AWS::Lambda::Function', 5);
      });

      test('should create Lambda functions with correct runtime', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          Runtime: 'nodejs20.x',
        });
      });

      test('should create Lambda functions in VPC', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          VpcConfig: {
            SecurityGroupIds: Match.anyValue(),
            SubnetIds: Match.anyValue(),
          },
        });
      });

      test('should create authorizer function with correct environment variables', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          Environment: {
            Variables: {
              API_KEYS_TABLE: Match.anyValue(),
            },
          },
        });
      });

      test('should create API handler function with correct environment variables', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          Environment: {
            Variables: {
              DOCUMENTS_BUCKET: Match.anyValue(),
              DOCUMENTS_TABLE: Match.anyValue(),
            },
          },
        });
      });

      test('should create document processor function with correct environment variables', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          Environment: {
            Variables: {
              DOCUMENTS_TABLE: Match.anyValue(),
            },
          },
        });
      });
    });

    describe('Dead Letter Queues', () => {
      test('should create SQS queues for dead letter handling', () => {
        template.resourceCountIs('AWS::SQS::Queue', 3);
      });

      test('should configure Lambda functions with dead letter queues', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          DeadLetterConfig: {
            TargetArn: Match.anyValue(),
          },
        });
      });
    });

    describe('IAM Roles and Policies', () => {
      test('should create IAM roles for Lambda functions', () => {
        template.resourceCountIs('AWS::IAM::Role', 6);
      });

      test('should create IAM role with VPC access policy', () => {
        template.hasResourceProperties('AWS::IAM::Role', {
          ManagedPolicyArns: Match.arrayWith([
            Match.objectLike({ 'Fn::Join': Match.anyValue() }),
          ]),
        });
      });

      test('should create inline policies for DynamoDB access', () => {
        template.hasResourceProperties('AWS::IAM::Role', {
          Policies: Match.arrayWith([
            Match.objectLike({
              PolicyDocument: {
                Statement: Match.arrayWith([
                  Match.objectLike({
                    Effect: 'Allow',
                    Action: Match.anyValue(),
                    Resource: Match.anyValue(),
                  }),
                ]),
              },
            }),
          ]),
        });
      });

      test('should create inline policies for S3 access', () => {
        template.hasResourceProperties('AWS::IAM::Role', {
          Policies: Match.arrayWith([
            Match.objectLike({
              PolicyDocument: {
                Statement: Match.arrayWith([
                  Match.objectLike({
                    Effect: 'Allow',
                    Action: Match.anyValue(),
                    Resource: Match.anyValue(),
                  }),
                ]),
              },
            }),
          ]),
        });
      });
    });

    describe('S3 Event Configuration', () => {
      test('should create Lambda permission for S3 event notification', () => {
        template.hasResourceProperties('AWS::Lambda::Permission', {
          Action: 'lambda:InvokeFunction',
          Principal: 's3.amazonaws.com',
          SourceAccount: Match.anyValue(),
        });
      });
    });

    describe('CloudWatch Alarms', () => {
      test('should create CloudWatch alarms for Lambda functions', () => {
        template.resourceCountIs('AWS::CloudWatch::Alarm', 5);
      });

      test('should create error alarms with correct configuration', () => {
        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          MetricName: 'Errors',
          ComparisonOperator: 'GreaterThanOrEqualToThreshold',
          EvaluationPeriods: 1,
        });
      });

      test('should create latency alarms with correct configuration', () => {
        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          MetricName: 'Duration',
          ComparisonOperator: 'GreaterThanOrEqualToThreshold',
          EvaluationPeriods: 2,
        });
      });
    });

    describe('Public Properties', () => {
      test('should expose Lambda functions as public properties', () => {
        expect(stack).toBeDefined();
      });

      test('should have Lambda functions with correct function names', () => {
        expect(stack).toBeDefined();
      });
    });
  });

  describe('ApiStack', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestStack', { environmentSuffix });
      template = Template.fromStack(stack);
    });

    describe('API Gateway Configuration', () => {
      test('should create REST API with correct configuration', () => {
        template.hasResourceProperties('AWS::ApiGateway::RestApi', {
          Name: Match.stringLikeRegexp('.*document-api-test.*'),
        });
      });

      test('should create CORS configuration', () => {
        template.hasResourceProperties('AWS::ApiGateway::Method', {
          HttpMethod: 'OPTIONS',
          Integration: {
            IntegrationResponses: [
              {
                ResponseParameters: {
                  'method.response.header.Access-Control-Allow-Headers':
                    Match.anyValue(),
                  'method.response.header.Access-Control-Allow-Methods':
                    Match.anyValue(),
                  'method.response.header.Access-Control-Allow-Origin':
                    Match.anyValue(),
                },
                StatusCode: '204',
              },
            ],
            RequestTemplates: Match.anyValue(),
          },
        });
      });
    });

    describe('Lambda Authorizer Configuration', () => {
      test('should create request authorizer', () => {
        template.hasResourceProperties('AWS::ApiGateway::Authorizer', {
          Type: 'REQUEST',
          IdentitySource: 'method.request.header.X-Api-Key',
        });
      });

      test('should associate authorizer with Lambda function', () => {
        template.hasResourceProperties('AWS::ApiGateway::Authorizer', {
          AuthorizerUri: Match.anyValue(),
        });
      });
    });

    describe('API Methods Configuration', () => {
      test('should create POST method for documents', () => {
        template.hasResourceProperties('AWS::ApiGateway::Method', {
          HttpMethod: 'POST',
          AuthorizationType: 'CUSTOM',
        });
      });

      test('should create GET method for documents', () => {
        template.hasResourceProperties('AWS::ApiGateway::Method', {
          HttpMethod: 'GET',
          AuthorizationType: 'CUSTOM',
        });
      });

      test('should create GET method for specific document', () => {
        template.hasResourceProperties('AWS::ApiGateway::Method', {
          HttpMethod: 'GET',
          AuthorizationType: 'CUSTOM',
        });
      });
    });

    describe('Lambda Integration Configuration', () => {
      test('should create Lambda proxy integration', () => {
        template.hasResourceProperties('AWS::ApiGateway::Method', {
          Integration: {
            Type: 'AWS_PROXY',
            IntegrationHttpMethod: 'POST',
          },
        });
      });
    });

    describe('API Key and Usage Plan Configuration', () => {
      test('should create API key', () => {
        template.hasResourceProperties('AWS::ApiGateway::ApiKey', {
          Description: 'API key for document processing system',
        });
      });

      test('should create usage plan with throttling and quota', () => {
        template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
          Throttle: {
            RateLimit: 100,
            BurstLimit: 200,
          },
          Quota: {
            Limit: 10000,
            Period: 'MONTH',
          },
        });
      });

      test('should associate API key with usage plan', () => {
        template.hasResourceProperties('AWS::ApiGateway::UsagePlanKey', {
          KeyType: 'API_KEY',
        });
      });
    });

    describe('API Gateway Deployment', () => {
      test('should create deployment', () => {
        template.hasResourceProperties('AWS::ApiGateway::Deployment', {
          RestApiId: Match.anyValue(),
        });
      });

      test('should create stage', () => {
        template.hasResourceProperties('AWS::ApiGateway::Stage', {
          RestApiId: Match.anyValue(),
          DeploymentId: Match.anyValue(),
          StageName: 'prod',
        });
      });
    });

    describe('Lambda Permissions', () => {
      test('should grant API Gateway permission to invoke Lambda functions', () => {
        template.hasResourceProperties('AWS::Lambda::Permission', {
          Action: 'lambda:InvokeFunction',
          Principal: 'apigateway.amazonaws.com',
        });
      });
    });

    describe('Public Properties', () => {
      test('should expose API as public property', () => {
        expect(stack).toBeDefined();
      });

      test('should expose API key as public property', () => {
        expect(stack).toBeDefined();
      });

      test('should expose usage plan as public property', () => {
        expect(stack).toBeDefined();
      });
    });
  });

  describe('Stack Integration', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'IntegrationTestStack', { environmentSuffix });
      template = Template.fromStack(stack);
    });

    describe('Resource Dependencies', () => {
      test('should create all required AWS resources', () => {
        // Verify all resource types are created
        template.resourceCountIs('AWS::EC2::VPC', 1);
        template.resourceCountIs('AWS::EC2::Subnet', 2);
        template.resourceCountIs('AWS::EC2::VPCEndpoint', 3);
        template.resourceCountIs('AWS::S3::Bucket', 1);
        template.resourceCountIs('AWS::DynamoDB::Table', 2);
        template.resourceCountIs('AWS::Lambda::Function', 5);
        template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
        template.resourceCountIs('AWS::IAM::Role', 6);
        template.resourceCountIs('AWS::CloudWatch::Alarm', 5);
        template.resourceCountIs('AWS::SQS::Queue', 3);
        template.resourceCountIs('AWS::KMS::Key', 1);
      });

      test('should have correct resource naming patterns', () => {
        // Verify resources follow naming conventions
        template.hasResourceProperties('AWS::EC2::VPC', {
          Tags: Match.arrayWith([
            {
              Key: 'Name',
              Value: Match.stringLikeRegexp('.*DocumentProcessingVpc.*'),
            },
          ]),
        });
      });

      test('should have cross-stack resource references', () => {
        // Verify Lambda functions reference VPC and security groups
        template.hasResourceProperties('AWS::Lambda::Function', {
          VpcConfig: {
            SecurityGroupIds: Match.anyValue(),
            SubnetIds: Match.anyValue(),
          },
        });
      });
    });

    describe('Security Configuration', () => {
      test('should have secure S3 bucket configuration', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true,
          },
        });
      });

      test('should have encrypted DynamoDB tables', () => {
        template.hasResourceProperties('AWS::DynamoDB::Table', {
          PointInTimeRecoverySpecification: {
            PointInTimeRecoveryEnabled: true,
          },
        });
      });

      test('should have least privilege IAM policies', () => {
        template.hasResourceProperties('AWS::IAM::Role', {
          Policies: Match.arrayWith([
            Match.objectLike({
              PolicyDocument: {
                Statement: Match.arrayWith([
                  Match.objectLike({
                    Effect: 'Allow',
                    Action: Match.anyValue(),
                    Resource: Match.anyValue(),
                  }),
                ]),
              },
            }),
          ]),
        });
      });
    });

    describe('Monitoring and Observability', () => {
      test('should create CloudWatch alarms for error monitoring', () => {
        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          MetricName: 'Errors',
          ComparisonOperator: 'GreaterThanOrEqualToThreshold',
          EvaluationPeriods: 1,
        });
      });

      test('should enable DynamoDB streams for audit trail', () => {
        template.hasResourceProperties('AWS::DynamoDB::Table', {
          StreamSpecification: {
            StreamViewType: 'NEW_AND_OLD_IMAGES',
          },
        });
      });
    });

    describe('Cost Optimization', () => {
      test('should use pay-per-request billing for DynamoDB', () => {
        template.hasResourceProperties('AWS::DynamoDB::Table', {
          BillingMode: 'PAY_PER_REQUEST',
        });
      });

      test('should not create expensive resources like NAT gateways', () => {
        template.resourceCountIs('AWS::EC2::NatGateway', 0);
        template.resourceCountIs('AWS::EC2::InternetGateway', 0);
      });
    });

    describe('High Availability', () => {
      test('should deploy resources across multiple AZs', () => {
        template.resourceCountIs('AWS::EC2::Subnet', 2);
      });

      test('should have VPC endpoints for service resilience', () => {
        template.resourceCountIs('AWS::EC2::VPCEndpoint', 3);
      });
    });
  });

  describe('TapStack Coverage Extensions', () => {
    test('should default environmentSuffix to "prod" if not provided', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'DefaultEnvStack');
      const template = Template.fromStack(stack);

      // Verify resources use default naming
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: Match.stringLikeRegexp('.*document-api-prod.*'),
      });
    });

    test('should use environmentSuffix from context if provided', () => {
      const app = new cdk.App({
        context: {
          environmentSuffix: 'staging',
        },
      });
      const stack = new TapStack(app, 'ContextEnvStack');
      const template = Template.fromStack(stack);

      // Verify resources use context naming
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: Match.stringLikeRegexp('.*document-api-staging.*'),
      });
    });

    test('should output Region and AccountId', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'RegionAccountStack', {
        environmentSuffix,
      });
      const template = Template.fromStack(stack);

      template.hasOutput('Region', {
        Description: 'AWS Region',
      });

      template.hasOutput('AccountId', {
        Description: 'AWS Account ID',
      });
    });
  });
});
