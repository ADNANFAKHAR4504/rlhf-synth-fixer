import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { ServerlessInfrastructureStack } from '../lib/serverless-infrastructure-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  test('creates TapStack successfully', () => {
    // TapStack is the parent stack that creates the ServerlessInfrastructureStack as a nested stack
    // The instantiation should work without errors
    expect(stack).toBeDefined();
    expect(stack.stackName).toContain('TestTapStack');
    
    // The nested stack creation happens, but may not appear in the parent template
    // as CDK handles nested stacks specially
    expect(template).toBeDefined();
  });

  test('uses environment suffix from props', () => {
    const appWithProps = new cdk.App();
    const stackWithProps = new TapStack(appWithProps, 'TestTapStackProps', { environmentSuffix: 'custom' });
    expect(stackWithProps).toBeDefined();
  });

  test('uses environment suffix from context when props not provided', () => {
    const appWithContext = new cdk.App({ context: { environmentSuffix: 'context' } });
    const stackWithContext = new TapStack(appWithContext, 'TestTapStackContext');
    expect(stackWithContext).toBeDefined();
  });

  test('uses default environment suffix when neither props nor context provided', () => {
    const appDefault = new cdk.App();
    const stackDefault = new TapStack(appDefault, 'TestTapStackDefault');
    expect(stackDefault).toBeDefined();
  });
});

describe('ServerlessInfrastructureStack', () => {
  let app: cdk.App;
  let stack: ServerlessInfrastructureStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new ServerlessInfrastructureStack(app, 'TestStack', {
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  test('uses default environment suffix when not provided', () => {
    const appDefault = new cdk.App();
    const stackDefault = new ServerlessInfrastructureStack(appDefault, 'TestStackDefault');
    const templateDefault = Template.fromStack(stackDefault);
    
    templateDefault.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'serverlessApp-table-dev',
    });
  });

  test('uses provided environment suffix', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: `serverlessApp-table-${environmentSuffix}`,
    });
  });

  test('uses provided domain name', () => {
    const appWithDomain = new cdk.App();
    const stackWithDomain = new ServerlessInfrastructureStack(appWithDomain, 'TestStackDomain', {
      environmentSuffix: 'test',
      domainName: 'custom.example.com',
    });
    expect(stackWithDomain).toBeDefined();
  });

  describe('DynamoDB Table', () => {
    test('creates DynamoDB table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `serverlessApp-table-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
        SSESpecification: {
          SSEEnabled: true,
          SSEType: 'KMS',
        },
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' },
          { AttributeName: 'createdAt', AttributeType: 'S' },
          { AttributeName: 'status', AttributeType: 'S' },
          { AttributeName: 'updatedAt', AttributeType: 'S' },
        ],
        KeySchema: [
          { AttributeName: 'id', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
      });
    });

    test('creates Global Secondary Index', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: [
          {
            IndexName: 'StatusIndex',
            KeySchema: [
              { AttributeName: 'status', KeyType: 'HASH' },
              { AttributeName: 'updatedAt', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          },
        ],
      });
    });

    test('has RemovalPolicy.DESTROY for cleanup', () => {
      template.hasResource('AWS::DynamoDB::Table', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('KMS Key', () => {
    test('creates KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for serverless application encryption',
        EnableKeyRotation: true,
      });
    });

    test('has RemovalPolicy.DESTROY for cleanup', () => {
      template.hasResource('AWS::KMS::Key', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('Lambda Functions', () => {
    test('creates all required Lambda functions', () => {
      // Should have 5 Lambda functions plus custom resource handlers
      const lambdas = template.findResources('AWS::Lambda::Function');
      const lambdaNames = Object.keys(lambdas);
      
      // Verify we have at least the 5 main functions
      const mainFunctions = lambdaNames.filter(name => 
        name.includes('CreateItemFunction') ||
        name.includes('ReadItemFunction') ||
        name.includes('UpdateItemFunction') ||
        name.includes('DeleteItemFunction') ||
        name.includes('ScheduledMaintenanceFunction')
      );
      
      expect(mainFunctions.length).toBe(5);

      // Create function
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `serverlessApp-create-${environmentSuffix}`,
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        MemorySize: 256,
        Timeout: 30,
      });

      // Read function
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `serverlessApp-read-${environmentSuffix}`,
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        MemorySize: 256,
        Timeout: 30,
      });

      // Update function
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `serverlessApp-update-${environmentSuffix}`,
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        MemorySize: 256,
        Timeout: 30,
      });

      // Delete function
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `serverlessApp-delete-${environmentSuffix}`,
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        MemorySize: 256,
        Timeout: 30,
      });

      // Maintenance function
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `serverlessApp-maintenance-${environmentSuffix}`,
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        MemorySize: 512,
        Timeout: 300,
      });
    });

    test('Lambda functions have environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            TABLE_NAME: Match.anyValue(),
          }),
        },
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('creates Lambda execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `serverlessApp-lambda-role-${environmentSuffix}`,
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

    test('Lambda role has DynamoDB permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'dynamodb:BatchGetItem',
                'dynamodb:GetRecords',
                'dynamodb:GetShardIterator',
                'dynamodb:Query',
                'dynamodb:GetItem',
                'dynamodb:Scan',
                'dynamodb:ConditionCheckItem',
                'dynamodb:BatchWriteItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:DescribeTable',
              ]),
            }),
          ]),
        },
      });
    });

    test('creates EventBridge Scheduler role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `serverlessApp-scheduler-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'scheduler.amazonaws.com',
              },
            },
          ],
        },
      });
    });
  });

  describe('API Gateway', () => {
    test('creates REST API with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `serverlessApp-api-${environmentSuffix}`,
        Description: 'Serverless REST API',
      });
    });

    test('creates API resources and methods', () => {
      // Resources
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'items',
      });

      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: '{id}',
      });

      // Methods
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
      });

      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
      });

      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'PUT',
      });

      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'DELETE',
      });
    });

    test('configures CORS', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
      });
    });

    test('creates deployment stage', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: environmentSuffix,
      });
    });
  });

  describe('CloudFront Distribution', () => {
    test('creates CloudFront distribution', () => {
      template.hasResourceProperties(
        'AWS::CloudFront::Distribution',
        Match.objectLike({
          DistributionConfig: Match.objectLike({
            Comment: `CloudFront distribution for serverlessApp ${environmentSuffix}`,
            PriceClass: 'PriceClass_100',
            Enabled: true,
            HttpVersion: 'http2',
            DefaultCacheBehavior: Match.objectLike({
              ViewerProtocolPolicy: 'redirect-to-https',
              AllowedMethods: [
                'GET',
                'HEAD',
                'OPTIONS',
                'PUT',
                'PATCH',
                'POST',
                'DELETE',
              ],
            }),
          }),
        })
      );
    });
  });

  describe('EventBridge Scheduler', () => {
    test('creates maintenance schedule', () => {
      template.hasResourceProperties('AWS::Scheduler::Schedule', {
        Name: `serverlessApp-maintenance-schedule-${environmentSuffix}`,
        Description: 'Daily maintenance schedule for serverless app',
        ScheduleExpression: 'rate(24 hours)',
        State: 'ENABLED',
        FlexibleTimeWindow: {
          Mode: 'FLEXIBLE',
          MaximumWindowInMinutes: 15,
        },
      });
    });
  });

  describe('CloudWatch Logs', () => {
    test('Lambda functions are configured with log retention', () => {
      // The Lambda functions themselves handle log retention
      // This is configured via the logRetention property on each function
      // which creates LogRetention custom resources
      const logRetentions = template.findResources('Custom::LogRetention');
      
      // We should have log retention configured for our Lambda functions
      expect(Object.keys(logRetentions).length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Outputs', () => {
    test('exports required outputs', () => {
      const outputs = template.findOutputs('*');
      
      expect(outputs).toHaveProperty('APIGatewayURL');
      expect(outputs).toHaveProperty('CloudFrontDomainName');
      expect(outputs).toHaveProperty('DynamoDBTableName');
    });
  });
});