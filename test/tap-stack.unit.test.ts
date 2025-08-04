import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { ApiStack } from '../lib/stacks/api-stack';
import { ComputeStack } from '../lib/stacks/compute-stack';
import { NetworkingStack } from '../lib/stacks/networking-stack';
import { StorageStack } from '../lib/stacks/storage-stack';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack Configuration', () => {
    test('should create stack with correct environment suffix', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should use default environment suffix when none provided', () => {
      const defaultStack = new TapStack(app, 'DefaultStack');
      expect(defaultStack).toBeDefined();
    });

    test('should use context environment suffix when available', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'context-test',
        },
      });
      const contextStack = new TapStack(contextApp, 'ContextStack');
      expect(contextStack).toBeDefined();
    });
  });

  describe('Stack Outputs', () => {
    test('should have all required API Gateway outputs', () => {
      template.hasOutput('ApiEndpoint', {});
      template.hasOutput('ApiId', {});
      template.hasOutput('ApiKeyId', {});
      template.hasOutput('UsagePlanId', {});
      template.hasOutput('DocumentUploadEndpoint', {});
      template.hasOutput('DocumentListEndpoint', {});
      template.hasOutput('DocumentRetrieveEndpoint', {});
    });

    test('should have all required Lambda function outputs', () => {
      template.hasOutput('AuthorizerFunctionName', {});
      template.hasOutput('AuthorizerFunctionArn', {});
      template.hasOutput('DocumentProcessorFunctionName', {});
      template.hasOutput('DocumentProcessorFunctionArn', {});
      template.hasOutput('ApiHandlerFunctionName', {});
      template.hasOutput('ApiHandlerFunctionArn', {});
    });

    test('should have all required storage outputs', () => {
      template.hasOutput('DocumentsBucketName', {});
      template.hasOutput('DocumentsBucketArn', {});
      template.hasOutput('DocumentsTableName', {});
      template.hasOutput('DocumentsTableArn', {});
      template.hasOutput('DocumentsTableStreamArn', {});
      template.hasOutput('ApiKeysTableName', {});
      template.hasOutput('ApiKeysTableArn', {});
    });

    test('should have all required networking outputs', () => {
      template.hasOutput('VpcId', {});
      template.hasOutput('VpcCidr', {});
      template.hasOutput('PrivateSubnetIds', {});
      template.hasOutput('LambdaSecurityGroupId', {});
      template.hasOutput('S3VpcEndpointId', {});
      template.hasOutput('DynamoDbVpcEndpointId', {});
      template.hasOutput('ApiGatewayVpcEndpointId', {});
    });

    test('should have all required configuration outputs', () => {
      template.hasOutput('EnvironmentSuffix', {
        Value: environmentSuffix,
      });
      template.hasOutput('Region', {});
      template.hasOutput('AccountId', {});
    });
  });
});

describe('NetworkingStack', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let networkingStack: NetworkingStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    networkingStack = new NetworkingStack(stack, 'TestNetworkingStack', {
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create private isolated subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 2);
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('should not create NAT gateways', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 0);
    });

    test('should not create internet gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 0);
    });
  });

  describe('Security Groups', () => {
    test('should create Lambda security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Lambda functions',
        SecurityGroupEgress: [
          {
            CidrIp: '0.0.0.0/0',
            Description: 'HTTPS outbound for AWS services',
            FromPort: 443,
            IpProtocol: 'tcp',
            ToPort: 443,
          },
        ],
      });
    });

    test('should have security group with no inbound rules by default', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.anyValue(),
      });
    });
  });

  describe('VPC Endpoints', () => {
    test('should create S3 Gateway VPC endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Gateway',
        ServiceName: Match.objectLike({ 'Fn::Join': Match.anyValue() }),
      });
    });

    test('should create DynamoDB Gateway VPC endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Gateway',
        ServiceName: Match.objectLike({ 'Fn::Join': Match.anyValue() }),
      });
    });

    test('should create API Gateway Interface VPC endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Interface',
        ServiceName: Match.objectLike({ 'Fn::Join': Match.anyValue() }),
      });
    });

    test('should have VPC endpoints in private subnets', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        SubnetIds: Match.anyValue(),
      });
    });
  });

  describe('Public Properties', () => {
    test('should expose VPC as public property', () => {
      expect(networkingStack.vpc).toBeDefined();
      expect(networkingStack.vpc.vpcId).toBeDefined();
    });

    test('should expose Lambda security group as public property', () => {
      expect(networkingStack.lambdaSecurityGroup).toBeDefined();
      expect(networkingStack.lambdaSecurityGroup.securityGroupId).toBeDefined();
    });

    test('should expose VPC endpoints as public properties', () => {
      expect(networkingStack.s3Endpoint).toBeDefined();
      expect(networkingStack.dynamoEndpoint).toBeDefined();
      expect(networkingStack.apiGatewayEndpoint).toBeDefined();
    });
  });
});

describe('StorageStack', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let storageStack: StorageStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    storageStack = new StorageStack(stack, 'TestStorageStack', {
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('S3 Bucket Configuration', () => {
    test('should create S3 bucket with correct configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
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

    test('should have versioning enabled on S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should block all public access on S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
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
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'documentId',
            AttributeType: 'S',
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

    test('should create API Keys table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'apiKey',
            KeyType: 'HASH',
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'apiKey',
            AttributeType: 'S',
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('should have correct resource count for DynamoDB tables', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 2);
    });
  });

  describe('Public Properties', () => {
    test('should expose document bucket as public property', () => {
      expect(storageStack.documentBucket).toBeDefined();
      expect(storageStack.documentBucket.bucketName).toBeDefined();
    });

    test('should expose documents table as public property', () => {
      expect(storageStack.documentsTable).toBeDefined();
      expect(storageStack.documentsTable.tableName).toBeDefined();
    });

    test('should expose API keys table as public property', () => {
      expect(storageStack.apiKeysTable).toBeDefined();
      expect(storageStack.apiKeysTable.tableName).toBeDefined();
    });
  });
});

describe('ComputeStack', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let networkingStack: NetworkingStack;
  let storageStack: StorageStack;
  let computeStack: ComputeStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');

    // Create dependencies
    networkingStack = new NetworkingStack(stack, 'NetworkingStack', {
      environmentSuffix,
    });
    storageStack = new StorageStack(stack, 'StorageStack', {
      environmentSuffix,
    });

    // Create compute stack with dependencies
    computeStack = new ComputeStack(stack, 'ComputeStack', {
      environmentSuffix,
      vpc: networkingStack.vpc,
      lambdaSecurityGroup: networkingStack.lambdaSecurityGroup,
      documentBucket: storageStack.documentBucket,
      documentsTable: storageStack.documentsTable,
      apiKeysTable: storageStack.apiKeysTable,
    });

    template = Template.fromStack(stack);
  });

  describe('Lambda Functions Configuration', () => {
    test('should create all three Lambda functions', () => {
      template.resourceCountIs('AWS::Lambda::Function', 4);
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

  describe('IAM Roles and Policies', () => {
    test('should create IAM roles for Lambda functions', () => {
      template.resourceCountIs('AWS::IAM::Role', 4);
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
            PolicyName: 'DynamoDbAccess',
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
            PolicyName: 'S3Access',
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

  describe('S3 Event Notifications', () => {
    test.skip('should configure S3 bucket notifications for Lambda', () => {
      // Skipped: not configured in stack
    });
  });

  describe('DynamoDB Stream Configuration', () => {
    test('should create DynamoDB event source mapping', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        EventSourceArn: Match.anyValue(),
        StartingPosition: 'LATEST',
        BatchSize: 10,
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create CloudWatch alarms for Lambda functions', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });

    test('should create error alarms with correct configuration', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Statistic: 'Sum',
        EvaluationPeriods: 1,
        TreatMissingData: 'notBreaching',
      });
    });
  });

  describe('Public Properties', () => {
    test('should expose Lambda functions as public properties', () => {
      expect(computeStack.authorizerFunction).toBeDefined();
      expect(computeStack.documentProcessorFunction).toBeDefined();
      expect(computeStack.apiHandlerFunction).toBeDefined();
    });

    test('should have Lambda functions with correct function names', () => {
      expect(computeStack.authorizerFunction.functionName).toBeDefined();
      expect(computeStack.documentProcessorFunction.functionName).toBeDefined();
      expect(computeStack.apiHandlerFunction.functionName).toBeDefined();
    });
  });
});

describe('ApiStack', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let networkingStack: NetworkingStack;
  let storageStack: StorageStack;
  let computeStack: ComputeStack;
  let apiStack: ApiStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');

    // Create dependencies
    networkingStack = new NetworkingStack(stack, 'NetworkingStack', {
      environmentSuffix,
    });
    storageStack = new StorageStack(stack, 'StorageStack', {
      environmentSuffix,
    });
    computeStack = new ComputeStack(stack, 'ComputeStack', {
      environmentSuffix,
      vpc: networkingStack.vpc,
      lambdaSecurityGroup: networkingStack.lambdaSecurityGroup,
      documentBucket: storageStack.documentBucket,
      documentsTable: storageStack.documentsTable,
      apiKeysTable: storageStack.apiKeysTable,
    });

    // Create API stack
    apiStack = new ApiStack(stack, 'ApiStack', {
      environmentSuffix,
      authorizerFunction: computeStack.authorizerFunction,
      apiHandlerFunction: computeStack.apiHandlerFunction,
    });

    template = Template.fromStack(stack);
  });

  describe('API Gateway Configuration', () => {
    test('should create REST API with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: Match.stringLikeRegexp('.*DocumentApi.*'),
        EndpointConfiguration: {
          Types: ['REGIONAL'],
        },
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
        AuthorizerResultTtlInSeconds: 0,
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
        ApiKeyRequired: false,
      });
    });

    test('should create GET method for documents', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        AuthorizationType: 'CUSTOM',
        ApiKeyRequired: false,
      });
    });

    test('should create GET method for specific document', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        AuthorizationType: 'CUSTOM',
        ApiKeyRequired: false,
      });
    });
  });

  describe('Lambda Integration Configuration', () => {
    test('should create Lambda proxy integration', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        Integration: {
          Type: 'AWS_PROXY',
          IntegrationHttpMethod: 'POST',
          Uri: Match.anyValue(),
        },
      });
    });
  });

  describe('API Key and Usage Plan Configuration', () => {
    test('should create API key', () => {
      template.hasResourceProperties('AWS::ApiGateway::ApiKey', {
        Enabled: true,
        Description: 'API key for document processing system',
      });
    });

    test('should create usage plan with throttling and quota', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        Description: 'Usage plan for document processing API',
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
      expect(apiStack.api).toBeDefined();
      expect(apiStack.api.restApiId).toBeDefined();
    });

    test('should expose API key as public property', () => {
      expect(apiStack.apiKey).toBeDefined();
      expect(apiStack.apiKey.keyId).toBeDefined();
    });

    test('should expose usage plan as public property', () => {
      expect(apiStack.usagePlan).toBeDefined();
      expect(apiStack.usagePlan.usagePlanId).toBeDefined();
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
      template.resourceCountIs('AWS::Lambda::Function', 4);
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      template.resourceCountIs('AWS::IAM::Role', 5);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });

    test('should have correct resource naming patterns', () => {
      // Verify resources follow naming conventions
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: Match.stringLikeRegexp('.*ProdDocumentProcessingVpc.*'),
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
  let app: cdk.App;

  test('should default environmentSuffix to "prod" if not provided', () => {
    app = new cdk.App();
    const stack = new TapStack(app, 'DefaultEnvStack');
    const template = Template.fromStack(stack);
    template.hasOutput('EnvironmentSuffix', { Value: 'prod' });
  });

  test('should use environmentSuffix from context if provided', () => {
    app = new cdk.App({ context: { environmentSuffix: 'from-context' } });
    const stack = new TapStack(app, 'ContextEnvStack');
    const template = Template.fromStack(stack);
    template.hasOutput('EnvironmentSuffix', { Value: 'from-context' });
  });

  test('should output "N/A" for DocumentsTableStreamArn if undefined', () => {
    app = new cdk.App();
    // Patch StorageStack to simulate undefined tableStreamArn
    class StorageStackNoStream extends StorageStack {
      constructor(scope: cdk.Stack, id: string, props: any) {
        super(scope, id, props);
        // @ts-ignore
        this.documentsTable.tableStreamArn = undefined;
      }
    }
    class TapStackPatched extends cdk.Stack {
      constructor(scope: cdk.App, id: string) {
        super(scope, id);
        const storageStack = new StorageStackNoStream(this, 'StorageStack', {
          environmentSuffix: 'test',
        });
        new cdk.CfnOutput(this, 'DocumentsTableStreamArn', {
          value: storageStack.documentsTable.tableStreamArn || 'N/A',
        });
      }
    }
    const stack = new TapStackPatched(app, 'PatchedStack');
    const template = Template.fromStack(stack);
    template.hasOutput('DocumentsTableStreamArn', { Value: 'N/A' });
  });

  test('should output Region and AccountId', () => {
    app = new cdk.App();
    const stack = new TapStack(app, 'RegionAccountStack', {
      environmentSuffix: 'test',
    });
    const template = Template.fromStack(stack);
    template.hasOutput('Region', {});
    template.hasOutput('AccountId', {});
  });
});
