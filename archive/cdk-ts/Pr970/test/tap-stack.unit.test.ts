import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const testEnvironmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix: testEnvironmentSuffix 
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Initialization', () => {
    test('should create stack with environment suffix from context', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'context-suffix'
        }
      });
      const contextStack = new TapStack(contextApp, 'ContextStack');
      const contextTemplate = Template.fromStack(contextStack);
      
      contextTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'srvrless-items-context-suffix'
      });
    });

    test('should create stack with environment suffix from env variable', () => {
      process.env.ENVIRONMENT_SUFFIX = 'env-suffix';
      const envApp = new cdk.App();
      const envStack = new TapStack(envApp, 'EnvStack');
      const envTemplate = Template.fromStack(envStack);
      
      envTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'srvrless-items-env-suffix'
      });
      
      delete process.env.ENVIRONMENT_SUFFIX;
    });

    test('should create stack with default suffix when no env or context', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      const defaultTemplate = Template.fromStack(defaultStack);
      
      defaultTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'srvrless-items-dev'
      });
    });
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public and private subnets', () => {
      // Check for public subnets
      template.resourceCountIs('AWS::EC2::Subnet', 4);
      
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'aws-cdk:subnet-type', Value: 'Public' })
        ])
      });

      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'aws-cdk:subnet-type', Value: 'Private' })
        ])
      });
    });

    test('should create NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('should create VPC Endpoint for DynamoDB', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Gateway',
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('should create DynamoDB table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `srvrless-items-${testEnvironmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true
        },
        SSESpecification: {
          SSEEnabled: true
        },
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S'
          }
        ],
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH'
          }
        ]
      });
    });

    test('should have DESTROY removal policy', () => {
      template.hasResource('AWS::DynamoDB::Table', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete'
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create five Lambda functions with correct names', () => {
    
      template.resourceCountIs('AWS::Lambda::Function', 6);
      
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `srvrless-create-item-${testEnvironmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        MemorySize: 256,
        Timeout: 30
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `srvrless-read-item-${testEnvironmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler'
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `srvrless-update-item-${testEnvironmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler'
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `srvrless-delete-item-${testEnvironmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler'
      });
    });

    test('should configure Lambda functions with VPC', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: Match.objectLike({
          SecurityGroupIds: Match.anyValue(),
          SubnetIds: Match.anyValue()
        })
      });
    });

    test('should configure Lambda functions with environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            TABLE_NAME: Match.anyValue(),
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1'
          })
        }
      });
    });
  });

  describe('IAM Role and Policies', () => {
    test('should create IAM role for Lambda functions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `srvrless-lambda-role-${testEnvironmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com'
              }
            }
          ]
        }
      });
    });

    test('should attach VPC execution policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `srvrless-lambda-role-${testEnvironmentSuffix}`,
        ManagedPolicyArns: Match.anyValue()
      });
    });

    test('should grant DynamoDB permissions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const policyKeys = Object.keys(policies);
      const lambdaPolicy = policyKeys.find(key => 
        key.includes('srvrlesslambdarole')
      );
      
      expect(lambdaPolicy).toBeDefined();
      if (lambdaPolicy) {
        const statement = policies[lambdaPolicy].Properties.PolicyDocument.Statement[0];
        expect(statement.Effect).toBe('Allow');
        expect(statement.Action).toContain('dynamodb:GetItem');
        expect(statement.Action).toContain('dynamodb:PutItem');
        expect(statement.Action).toContain('dynamodb:UpdateItem');
        expect(statement.Action).toContain('dynamodb:DeleteItem');
        expect(statement.Action).toContain('dynamodb:Scan');
        expect(statement.Action).toContain('dynamodb:Query');
      }
    });
  });

  describe('Security Group', () => {
    test('should create security group for Lambda functions', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `srvrless-lambda-sg-${testEnvironmentSuffix}`,
        GroupDescription: 'Security group for Lambda functions',
        SecurityGroupEgress: [
          {
            CidrIp: '0.0.0.0/0',
            IpProtocol: '-1'
          }
        ]
      });
    });
  });

  describe('API Gateway', () => {
    test('should create REST API with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `srvrless-rest-api-${testEnvironmentSuffix}`,
        Description: 'Serverless REST API for CRUD operations',
        EndpointConfiguration: {
          Types: ['REGIONAL']
        }
      });
    });

    test('should configure API Gateway deployment options', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod'
      });
    });

    test('should create API Gateway methods with IAM auth', () => {
      // POST method
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        AuthorizationType: 'AWS_IAM'
      });

      // GET methods
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        AuthorizationType: 'AWS_IAM'
      });

      // PUT method
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'PUT',
        AuthorizationType: 'AWS_IAM'
      });

      // DELETE method
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'DELETE',
        AuthorizationType: 'AWS_IAM'
      });
    });
  });

  describe('Tags', () => {
    test('should apply common tags to resources', () => {
      // Check VPC has tags
      const vpc = template.findResources('AWS::EC2::VPC');
      const vpcKeys = Object.keys(vpc);
      expect(vpcKeys.length).toBeGreaterThan(0);
      const vpcTags = vpc[vpcKeys[0]].Properties.Tags;
      const tagKeys = vpcTags.map((tag: any) => tag.Key);
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('CostCenter');
      expect(tagKeys).toContain('Team');

      // Check DynamoDB has tags
      const dynamodb = template.findResources('AWS::DynamoDB::Table');
      const ddbKeys = Object.keys(dynamodb);
      expect(ddbKeys.length).toBeGreaterThan(0);
      const ddbTags = dynamodb[ddbKeys[0]].Properties.Tags;
      const ddbTagKeys = ddbTags.map((tag: any) => tag.Key);
      expect(ddbTagKeys).toContain('Project');
      expect(ddbTagKeys).toContain('Environment');
      expect(ddbTagKeys).toContain('CostCenter');
      expect(ddbTagKeys).toContain('Team');

      // Check Lambda has tags
      const lambdas = template.findResources('AWS::Lambda::Function');
      const lambdaKeys = Object.keys(lambdas).filter(key => 
        lambdas[key].Properties.FunctionName && 
        lambdas[key].Properties.FunctionName.includes('srvrless-')
      );
      expect(lambdaKeys.length).toBeGreaterThan(0);
      const lambdaTags = lambdas[lambdaKeys[0]].Properties.Tags;
      const lambdaTagKeys = lambdaTags.map((tag: any) => tag.Key);
      expect(lambdaTagKeys).toContain('Project');
      expect(lambdaTagKeys).toContain('Environment');
      expect(lambdaTagKeys).toContain('CostCenter');
      expect(lambdaTagKeys).toContain('Team');
    });
  });

  describe('EventBridge Configuration', () => {
    test('should create custom EventBridge event bus', () => {
      template.hasResourceProperties('AWS::Events::EventBus', {
        Name: `srvrless-event-bus-${testEnvironmentSuffix}`,
        Description: 'Custom event bus for CRUD operations'
      });
    });

    test('should create EventBridge rules for different event types', () => {
      // Check for Create event rule
      template.hasResourceProperties('AWS::Events::Rule', {
        EventBusName: Match.anyValue(),
        EventPattern: {
          source: ['srvrless.api'],
          'detail-type': ['Item Created']
        },
        Name: `srvrless-create-rule-${testEnvironmentSuffix}`
      });

      // Check for Update event rule
      template.hasResourceProperties('AWS::Events::Rule', {
        EventBusName: Match.anyValue(),
        EventPattern: {
          source: ['srvrless.api'],
          'detail-type': ['Item Updated']
        },
        Name: `srvrless-update-rule-${testEnvironmentSuffix}`
      });

      // Check for Delete event rule
      template.hasResourceProperties('AWS::Events::Rule', {
        EventBusName: Match.anyValue(),
        EventPattern: {
          source: ['srvrless.api'],
          'detail-type': ['Item Deleted']
        },
        Name: `srvrless-delete-rule-${testEnvironmentSuffix}`
      });
    });

    test('should create CloudWatch log group for events', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/events/srvrless-${testEnvironmentSuffix}`,
        RetentionInDays: 7
      });
    });

    test('should create event processor Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `srvrless-event-processor-${testEnvironmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        MemorySize: 256,
        Timeout: 30
      });
    });

    test('should grant EventBridge permissions to Lambda role', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const policyKeys = Object.keys(policies);
      const lambdaPolicy = policyKeys.find(key => 
        key.includes('srvrlesslambdarole')
      );
      
      expect(lambdaPolicy).toBeDefined();
      if (lambdaPolicy) {
        const statements = policies[lambdaPolicy].Properties.PolicyDocument.Statement;
        const eventBridgeStatement = statements.find((s: any) => 
          s.Action === 'events:PutEvents'
        );
        expect(eventBridgeStatement).toBeDefined();
        expect(eventBridgeStatement?.Effect).toBe('Allow');
      }
    });
  });

  describe('X-Ray Configuration', () => {
    test('should create X-Ray sampling rule', () => {
      template.hasResourceProperties('AWS::XRay::SamplingRule', {
        SamplingRule: {
          RuleName: `srvrless-sampling-rule-${testEnvironmentSuffix}`,
          Priority: 9000,
          FixedRate: 0.1,
          ReservoirSize: 1,
          ServiceName: 'srvrless-api',
          ServiceType: '*',
          Host: '*',
          HTTPMethod: '*',
          URLPath: '*',
          Version: 1,
          ResourceARN: '*'
        }
      });
    });

    test('should enable X-Ray tracing for Lambda functions', () => {
      // Check create function has tracing enabled
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `srvrless-create-item-${testEnvironmentSuffix}`,
        TracingConfig: {
          Mode: 'Active'
        }
      });

      // Check read function has tracing enabled
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `srvrless-read-item-${testEnvironmentSuffix}`,
        TracingConfig: {
          Mode: 'Active'
        }
      });

      // Check update function has tracing enabled
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `srvrless-update-item-${testEnvironmentSuffix}`,
        TracingConfig: {
          Mode: 'Active'
        }
      });

      // Check delete function has tracing enabled
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `srvrless-delete-item-${testEnvironmentSuffix}`,
        TracingConfig: {
          Mode: 'Active'
        }
      });
    });

    test('should enable X-Ray tracing for API Gateway', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        TracingEnabled: true
      });
    });

    test('should grant X-Ray permissions to Lambda role', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const policyKeys = Object.keys(policies);
      const lambdaPolicy = policyKeys.find(key => 
        key.includes('srvrlesslambdarole')
      );
      
      expect(lambdaPolicy).toBeDefined();
      if (lambdaPolicy) {
        const statements = policies[lambdaPolicy].Properties.PolicyDocument.Statement;
        const xrayStatement = statements.find((s: any) => 
          Array.isArray(s.Action) && 
          s.Action.includes('xray:PutTraceSegments')
        );
        expect(xrayStatement).toBeDefined();
        expect(xrayStatement?.Effect).toBe('Allow');
        expect(xrayStatement?.Action).toContain('xray:PutTraceSegments');
        expect(xrayStatement?.Action).toContain('xray:PutTelemetryRecords');
      }
    });
  });

  describe('Lambda Function Environment Variables', () => {
    test('should configure create and update functions with EventBridge environment variable', () => {
      // Check create function
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `srvrless-create-item-${testEnvironmentSuffix}`,
        Environment: {
          Variables: Match.objectLike({
            TABLE_NAME: Match.anyValue(),
            EVENT_BUS_NAME: Match.anyValue(),
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1'
          })
        }
      });

      // Check update function
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `srvrless-update-item-${testEnvironmentSuffix}`,
        Environment: {
          Variables: Match.objectLike({
            TABLE_NAME: Match.anyValue(),
            EVENT_BUS_NAME: Match.anyValue(),
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1'
          })
        }
      });

      // Check delete function
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `srvrless-delete-item-${testEnvironmentSuffix}`,
        Environment: {
          Variables: Match.objectLike({
            TABLE_NAME: Match.anyValue(),
            EVENT_BUS_NAME: Match.anyValue(),
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1'
          })
        }
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should output API URL', () => {
      template.hasOutput('ApiUrl', {
        Description: 'API Gateway URL',
        Export: {
          Name: `ApiUrl-${testEnvironmentSuffix}`
        }
      });
    });

    test('should output API ID', () => {
      template.hasOutput('ApiId', {
        Description: 'API Gateway ID',
        Export: {
          Name: `ApiId-${testEnvironmentSuffix}`
        }
      });
    });

    test('should output Table Name', () => {
      template.hasOutput('TableName', {
        Description: 'DynamoDB Table Name',
        Export: {
          Name: `TableName-${testEnvironmentSuffix}`
        }
      });
    });

    test('should output VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
        Export: {
          Name: `VpcId-${testEnvironmentSuffix}`
        }
      });
    });

    test('should output Lambda function names', () => {
      template.hasOutput('CreateFunctionName', {
        Description: 'Create Lambda Function Name',
        Export: {
          Name: `CreateFunctionName-${testEnvironmentSuffix}`
        }
      });

      template.hasOutput('ReadFunctionName', {
        Description: 'Read Lambda Function Name',
        Export: {
          Name: `ReadFunctionName-${testEnvironmentSuffix}`
        }
      });

      template.hasOutput('UpdateFunctionName', {
        Description: 'Update Lambda Function Name',
        Export: {
          Name: `UpdateFunctionName-${testEnvironmentSuffix}`
        }
      });

      template.hasOutput('DeleteFunctionName', {
        Description: 'Delete Lambda Function Name',
        Export: {
          Name: `DeleteFunctionName-${testEnvironmentSuffix}`
        }
      });

      template.hasOutput('EventProcessorFunctionName', {
        Description: 'Event Processor Lambda Function Name',
        Export: {
          Name: `EventProcessorFunctionName-${testEnvironmentSuffix}`
        }
      });
    });

    test('should output EventBridge resources', () => {
      template.hasOutput('EventBusName', {
        Description: 'EventBridge Event Bus Name',
        Export: {
          Name: `EventBusName-${testEnvironmentSuffix}`
        }
      });

      template.hasOutput('EventBusArn', {
        Description: 'EventBridge Event Bus ARN',
        Export: {
          Name: `EventBusArn-${testEnvironmentSuffix}`
        }
      });
    });

    test('should output X-Ray sampling rule', () => {
      template.hasOutput('XRaySamplingRuleName', {
        Description: 'X-Ray Sampling Rule Name',
        Export: {
          Name: `XRaySamplingRuleName-${testEnvironmentSuffix}`
        }
      });
    });
  });
});
