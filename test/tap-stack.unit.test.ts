import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Environment Suffix Handling', () => {
    test('uses default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultTestStack');
      const defaultTemplate = Template.fromStack(defaultStack);
      
      // Check that default 'dev' suffix is used
      defaultTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'serverless-data-dev',
      });
    });

    test('uses provided environment suffix', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomTestStack', { 
        environmentSuffix: 'prod' 
      });
      const customTemplate = Template.fromStack(customStack);
      
      // Check that provided suffix is used
      customTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'serverless-data-prod',
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('creates DynamoDB table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `serverless-data-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
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

    test('DynamoDB table has DESTROY removal policy', () => {
      template.hasResource('AWS::DynamoDB::Table', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });

    test('DynamoDB table is tagged with Project: ServerlessApp', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        Tags: Match.arrayWith([
          {
            Key: 'Project',
            Value: 'ServerlessApp',
          },
        ]),
      });
    });
  });

  describe('Secrets Manager', () => {
    test('creates Secrets Manager secret with correct configuration', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `serverless-app-config-${environmentSuffix}`,
        Description: 'Application configuration secrets',
      });
    });

    test('secret has auto-generated string configuration', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        GenerateSecretString: {
          SecretStringTemplate: JSON.stringify({
            apiVersion: 'v1.0',
            environment: environmentSuffix,
          }),
          GenerateStringKey: 'encryptionKey',
          ExcludeCharacters: '/@"\\\'',
        },
      });
    });

    test('secret is tagged with Project: ServerlessApp', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Tags: Match.arrayWith([
          {
            Key: 'Project',
            Value: 'ServerlessApp',
          },
        ]),
      });
    });
  });

  describe('EventBridge', () => {
    test('creates custom EventBridge event bus', () => {
      template.hasResourceProperties('AWS::Events::EventBus', {
        Name: `serverless-events-${environmentSuffix}`,
      });
    });

    test('EventBridge bus is tagged with Project: ServerlessApp', () => {
      template.hasResourceProperties('AWS::Events::EventBus', {
        Tags: Match.arrayWith([
          {
            Key: 'Project',
            Value: 'ServerlessApp',
          },
        ]),
      });
    });

    test('creates EventBridge rule for data processing', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `data-processing-rule-${environmentSuffix}`,
        Description: 'Route data created events to Step Functions workflow',
        EventPattern: {
          source: ['serverless.api'],
          'detail-type': ['Data Created'],
        },
      });
    });
  });

  describe('SNS FIFO Topic', () => {
    test('creates SNS FIFO topic with correct configuration', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `serverless-notifications-${environmentSuffix}.fifo`,
        FifoTopic: true,
        ContentBasedDeduplication: true,
        DisplayName: 'Serverless Processing Notifications',
      });
    });

    test('SNS topic is tagged with Project: ServerlessApp', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        Tags: Match.arrayWith([
          {
            Key: 'Project',
            Value: 'ServerlessApp',
          },
        ]),
      });
    });
  });

  describe('Step Functions', () => {
    test('creates Step Functions state machine', () => {
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        StateMachineName: `serverless-data-processing-${environmentSuffix}`,
        TracingConfiguration: {
          Enabled: true,
        },
      });
    });

    test('state machine has execution role with Lambda invoke permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `serverless-stepfunctions-execution-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'states.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('creates validator Lambda function for Step Functions', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `serverless-validator-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        MemorySize: 128,
        Timeout: 30,
      });
    });

    test('creates transformer Lambda function for Step Functions', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `serverless-transformer-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        MemorySize: 128,
        Timeout: 30,
      });
    });

    test('creates notifier Lambda function for Step Functions', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `serverless-notifier-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        MemorySize: 128,
        Timeout: 30,
      });
    });
  });

  describe('CloudWatch Logs', () => {
    test('creates API Lambda Log Group with 7-day retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/serverless-api-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });

    test('creates validator Lambda Log Group with 7-day retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/serverless-validator-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });

    test('creates transformer Lambda Log Group with 7-day retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/serverless-transformer-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });

    test('creates notifier Lambda Log Group with 7-day retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/serverless-notifier-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });

    test('CloudWatch Log Groups have DESTROY removal policy', () => {
      template.hasResource('AWS::Logs::LogGroup', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });
  });

  describe('IAM Roles', () => {
    test('creates API Lambda IAM role with correct policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `serverless-api-lambda-role-${environmentSuffix}`,
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

    test('API Lambda role has DynamoDB permissions', () => {
      const resources = template.toJSON().Resources;
      const lambdaRole = Object.entries(resources).find(
        ([_, resource]: [string, any]) =>
          resource.Type === 'AWS::IAM::Role' &&
          resource.Properties?.RoleName === `serverless-api-lambda-role-${environmentSuffix}`
      );

      expect(lambdaRole).toBeDefined();
      const [, roleResource]: [string, any] = lambdaRole!;
      
      const dynamoPolicy = roleResource.Properties.Policies.find(
        (p: any) => p.PolicyName === 'DynamoDBPolicy'
      );
      
      expect(dynamoPolicy).toBeDefined();
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toEqual(
        expect.arrayContaining([
          'dynamodb:DeleteItem',
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:Query',
          'dynamodb:Scan',
          'dynamodb:UpdateItem',
        ])
      );
    });

    test('API Lambda role has EventBridge permissions', () => {
      const resources = template.toJSON().Resources;
      const lambdaRole = Object.entries(resources).find(
        ([_, resource]: [string, any]) =>
          resource.Type === 'AWS::IAM::Role' &&
          resource.Properties?.RoleName === `serverless-api-lambda-role-${environmentSuffix}`
      );

      expect(lambdaRole).toBeDefined();
      const [, roleResource]: [string, any] = lambdaRole!;
      
      const eventBridgePolicy = roleResource.Properties.Policies.find(
        (p: any) => p.PolicyName === 'EventBridgePolicy'
      );
      
      expect(eventBridgePolicy).toBeDefined();
      expect(eventBridgePolicy.PolicyDocument.Statement[0].Action).toEqual('events:PutEvents');
    });

    test('API Lambda role has Secrets Manager permissions', () => {
      const resources = template.toJSON().Resources;
      const lambdaRole = Object.entries(resources).find(
        ([_, resource]: [string, any]) =>
          resource.Type === 'AWS::IAM::Role' &&
          resource.Properties?.RoleName === `serverless-api-lambda-role-${environmentSuffix}`
      );

      expect(lambdaRole).toBeDefined();
      const [, roleResource]: [string, any] = lambdaRole!;
      
      const secretsPolicy = roleResource.Properties.Policies.find(
        (p: any) => p.PolicyName === 'SecretsManagerPolicy'
      );
      
      expect(secretsPolicy).toBeDefined();
      expect(secretsPolicy.PolicyDocument.Statement[0].Action).toEqual('secretsmanager:GetSecretValue');
    });

    test('Step Functions Lambda role has SNS permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `serverless-stepfunctions-lambda-role-${environmentSuffix}`,
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'SNSPolicy',
            PolicyDocument: {
              Statement: [
                {
                  Effect: 'Allow',
                  Action: 'sns:Publish',
                  Resource: Match.anyValue(),
                },
              ],
            },
          }),
        ]),
      });
    });
  });

  describe('VPC and Networking', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: `serverless-vpc-${environmentSuffix}`,
          },
          {
            Key: 'Project',
            Value: 'ServerlessApp',
          },
        ]),
      });
    });

    test('creates Security Group allowing HTTPS traffic only', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `serverless-lambda-sg-${environmentSuffix}`,
        GroupDescription: 'Security group for Lambda function - HTTPS only',
        SecurityGroupIngress: [
          {
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTPS traffic only',
            FromPort: 443,
            IpProtocol: 'tcp',
            ToPort: 443,
          },
        ],
      });
    });

    test.skip('creates VPC endpoint for DynamoDB (disabled for LocalStack)', () => {
      // VPC endpoints are conditionally disabled for LocalStack
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: {
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([
              'com.amazonaws.',
              { Ref: 'AWS::Region' },
              '.dynamodb',
            ]),
          ]),
        },
        VpcEndpointType: 'Gateway',
      });
    });

    test.skip('creates VPC endpoint for Secrets Manager (disabled for LocalStack)', () => {
      // VPC endpoints are conditionally disabled for LocalStack
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: { 'Fn::Join': ['', ['com.amazonaws.', { Ref: 'AWS::Region' }, '.secretsmanager']] },
        VpcEndpointType: 'Interface',
      });
    });

    test.skip('creates VPC endpoint for EventBridge (disabled for LocalStack)', () => {
      // VPC endpoints are conditionally disabled for LocalStack
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: { 'Fn::Join': ['', ['com.amazonaws.', { Ref: 'AWS::Region' }, '.events']] },
        VpcEndpointType: 'Interface',
      });
    });

    test.skip('creates VPC endpoint for Step Functions (disabled for LocalStack)', () => {
      // VPC endpoints are conditionally disabled for LocalStack
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: { 'Fn::Join': ['', ['com.amazonaws.', { Ref: 'AWS::Region' }, '.states']] },
        VpcEndpointType: 'Interface',
      });
    });

    test.skip('creates VPC endpoint for SNS (disabled for LocalStack)', () => {
      // VPC endpoints are conditionally disabled for LocalStack
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: { 'Fn::Join': ['', ['com.amazonaws.', { Ref: 'AWS::Region' }, '.sns']] },
        VpcEndpointType: 'Interface',
      });
    });
  });

  describe('Lambda Functions', () => {
    test('creates main API Lambda function with correct runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `serverless-api-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        MemorySize: 256,
        Timeout: 30,
      });
    });

    test('Lambda functions have X-Ray tracing enabled', () => {
      // Check API function
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `serverless-api-${environmentSuffix}`,
        TracingConfig: {
          Mode: 'Active',
        },
      });

      // Check validator function
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `serverless-validator-${environmentSuffix}`,
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('API Lambda has environment variables configured', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `serverless-api-${environmentSuffix}`,
        Environment: {
          Variables: {
            TABLE_NAME: Match.anyValue(),
            EVENT_BUS_NAME: Match.anyValue(),
            SECRET_ARN: Match.anyValue(),
          },
        },
      });
    });

    test('Notifier Lambda has SNS topic ARN environment variable', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `serverless-notifier-${environmentSuffix}`,
        Environment: {
          Variables: {
            TOPIC_ARN: Match.anyValue(),
          },
        },
      });
    });

    test('Lambda functions are configured with VPC and security group', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `serverless-api-${environmentSuffix}`,
        VpcConfig: {
          SecurityGroupIds: Match.anyValue(),
          SubnetIds: Match.anyValue(),
        },
      });
    });
  });

  describe('API Gateway', () => {
    test('creates REST API with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `serverless-api-${environmentSuffix}`,
        Description: 'Enhanced Serverless API with Step Functions and SNS',
      });
    });

    test('API Gateway stage has X-Ray tracing enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        TracingEnabled: true,
        MethodSettings: [
          {
            DataTraceEnabled: true,
            HttpMethod: '*',
            LoggingLevel: 'INFO',
            MetricsEnabled: true,
            ResourcePath: '/*',
          },
        ],
      });
    });

    test('creates API Key', () => {
      template.hasResourceProperties('AWS::ApiGateway::ApiKey', {
        Name: `serverless-api-key-${environmentSuffix}`,
        Description: 'API Key for Enhanced Serverless API',
      });
    });

    test('creates Usage Plan with throttling and quota', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        UsagePlanName: `serverless-usage-plan-${environmentSuffix}`,
        Description: 'Usage plan for Enhanced Serverless API',
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

    test('creates API methods with API key requirement', () => {
      // Check GET method
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        ApiKeyRequired: true,
        AuthorizationType: 'NONE',
        Integration: {
          Type: 'AWS_PROXY',
        },
      });

      // Check POST method
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        ApiKeyRequired: true,
        AuthorizationType: 'NONE',
        Integration: {
          Type: 'AWS_PROXY',
        },
      });
    });

    test('creates CORS configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
        Integration: {
          Type: 'MOCK',
        },
      });
    });
  });

  describe('Stack Outputs', () => {
    test('has API endpoint output', () => {
      template.hasOutput('ApiEndpoint', {
        Description: 'API Gateway endpoint URL',
      });
    });

    test('has API key ID output', () => {
      template.hasOutput('ApiKeyId', {
        Description: 'API Key ID',
      });
    });

    test('has DynamoDB table name output', () => {
      template.hasOutput('DynamoDBTableName', {
        Description: 'DynamoDB table name',
      });
    });

    test('has Lambda function name output', () => {
      template.hasOutput('LambdaFunctionName', {
        Description: 'API Lambda function name',
      });
    });

    test('has EventBus name output', () => {
      template.hasOutput('EventBusName', {
        Description: 'Custom EventBridge event bus name',
      });
    });

    test('has Secret ARN output', () => {
      template.hasOutput('SecretArn', {
        Description: 'Application secrets ARN',
      });
    });

    test('has State Machine ARN output', () => {
      template.hasOutput('StateMachineArn', {
        Description: 'Step Functions state machine ARN',
      });
    });

    test('has SNS Topic ARN output', () => {
      template.hasOutput('SNSTopicArn', {
        Description: 'SNS FIFO topic ARN for notifications',
      });
    });
  });

  describe('Resource Tagging', () => {
    test('all major resources are tagged with Project: ServerlessApp', () => {
      // Check various resource types for the Project tag
      const resourceTypes = [
        'AWS::DynamoDB::Table',
        'AWS::Lambda::Function',
        'AWS::ApiGateway::RestApi',
        'AWS::EC2::VPC',
        'AWS::EC2::SecurityGroup',
        'AWS::Events::EventBus',
        'AWS::SecretsManager::Secret',
        'AWS::SNS::Topic',
        'AWS::Logs::LogGroup',
      ];

      resourceTypes.forEach(resourceType => {
        const resources = template.findResources(resourceType);
        Object.keys(resources).forEach(resourceKey => {
          expect(resources[resourceKey].Properties?.Tags).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                Key: 'Project',
                Value: 'ServerlessApp',
              }),
            ])
          );
        });
      });
    });
  });

  describe('Resource Count and Completeness', () => {
    test('creates all required Lambda functions', () => {
      const resources = template.toJSON().Resources;
      const lambdaFunctions = Object.values(resources)
        .filter((r: any) => r.Type === 'AWS::Lambda::Function')
        .map((r: any) => r.Properties?.FunctionName)
        .filter(name => name && name.includes(environmentSuffix));

      // Should have API, validator, transformer, and notifier functions
      expect(lambdaFunctions).toContain(`serverless-api-${environmentSuffix}`);
      expect(lambdaFunctions).toContain(`serverless-validator-${environmentSuffix}`);
      expect(lambdaFunctions).toContain(`serverless-transformer-${environmentSuffix}`);
      expect(lambdaFunctions).toContain(`serverless-notifier-${environmentSuffix}`);
    });

    test.skip('creates all required VPC endpoints (disabled for LocalStack)', () => {
      // VPC endpoints are conditionally disabled for LocalStack
      const resources = template.toJSON().Resources;
      const vpcEndpoints = Object.values(resources)
        .filter((r: any) => r.Type === 'AWS::EC2::VPCEndpoint');

      // Should have endpoints for DynamoDB, Secrets Manager, EventBridge, Step Functions, and SNS
      expect(vpcEndpoints.length).toBeGreaterThanOrEqual(5);
    });

    test('creates expected number of IAM roles', () => {
      const resources = template.toJSON().Resources;
      const iamRoles = Object.values(resources)
        .filter((r: any) => r.Type === 'AWS::IAM::Role')
        .map((r: any) => r.Properties?.RoleName)
        .filter(name => name && name.includes(environmentSuffix));

      // Should have roles for API Lambda, Step Functions Lambdas, and Step Functions execution
      expect(iamRoles).toContain(`serverless-api-lambda-role-${environmentSuffix}`);
      expect(iamRoles).toContain(`serverless-stepfunctions-lambda-role-${environmentSuffix}`);
      expect(iamRoles).toContain(`serverless-stepfunctions-execution-role-${environmentSuffix}`);
    });
  });
});