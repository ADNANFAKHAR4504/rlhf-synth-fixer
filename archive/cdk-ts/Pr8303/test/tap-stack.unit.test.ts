import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Environment Suffix Default Handling', () => {
    test('should use dev as default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultTestStack');
      const defaultTemplate = Template.fromStack(defaultStack);

      // Verify resources use 'dev' suffix
      defaultTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'lambda-source-bucket-dev',
      });

      defaultTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'UserData-dev',
      });
    });

    test('should use context environmentSuffix when props not provided', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'fromcontext',
        },
      });
      const contextStack = new TapStack(contextApp, 'ContextTestStack');
      const contextTemplate = Template.fromStack(contextStack);

      // Verify resources use context suffix
      contextTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'lambda-source-bucket-fromcontext',
      });

      contextTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'UserData-fromcontext',
      });
    });

    test('should prioritize props over context for environment suffix', () => {
      const priorityApp = new cdk.App({
        context: {
          environmentSuffix: 'fromcontext',
        },
      });
      const priorityStack = new TapStack(priorityApp, 'PriorityTestStack', {
        environmentSuffix: 'fromprops',
      });
      const priorityTemplate = Template.fromStack(priorityStack);

      // Verify resources use props suffix (takes priority)
      priorityTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'lambda-source-bucket-fromprops',
      });

      priorityTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'UserData-fromprops',
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `lambda-source-bucket-${environmentSuffix}`,
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should have deletion policy set to Delete', () => {
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('should have auto-delete objects custom resource', () => {
      template.hasResourceProperties('Custom::S3AutoDeleteObjects', {
        ServiceToken: Match.anyValue(),
        BucketName: Match.anyValue(),
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('should create DynamoDB table with correct properties', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `UserData-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S',
          },
        ],
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
        ],
      });
    });

    test('should have point-in-time recovery enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('should have deletion policy set to Delete', () => {
      template.hasResource('AWS::DynamoDB::Table', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create GetUserFunction with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `GetUserFunction-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        Environment: {
          Variables: {
            TABLE_NAME: Match.anyValue(),
            LOG_LEVEL: 'INFO',
          },
        },
      });
    });

    test('should create CreateUserFunction with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `CreateUserFunction-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        Environment: {
          Variables: {
            TABLE_NAME: Match.anyValue(),
            LOG_LEVEL: 'INFO',
          },
        },
      });
    });

    test('should create DeleteUserFunction with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `DeleteUserFunction-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        Environment: {
          Variables: {
            TABLE_NAME: Match.anyValue(),
            LOG_LEVEL: 'INFO',
          },
        },
      });
    });

    test('should have inline code for all Lambda functions', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      const functionKeys = Object.keys(functions).filter(
        (key) => !key.includes('CustomResourceProvider')
      );

      expect(functionKeys).toHaveLength(3);
      functionKeys.forEach((key) => {
        expect(functions[key].Properties.Code).toHaveProperty('ZipFile');
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create Lambda execution role with correct name', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `LambdaExecutionRole-${environmentSuffix}`,
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

    test('should attach AWSLambdaBasicExecutionRole managed policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `LambdaExecutionRole-${environmentSuffix}`,
        ManagedPolicyArns: [
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([Match.stringLikeRegexp('AWSLambdaBasicExecutionRole')]),
            ]),
          }),
        ],
      });
    });

    test('should create DynamoDB access policy for Lambda', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const policyKeys = Object.keys(policies);
      
      expect(policyKeys.length).toBeGreaterThan(0);
      
      // Find the Lambda execution role policy
      const lambdaPolicy = policyKeys.find(key => 
        key.includes('LambdaExecutionRoleDefaultPolicy')
      );
      
      expect(lambdaPolicy).toBeDefined();
      
      // Check it has DynamoDB permissions
      const policy = policies[lambdaPolicy!];
      const statement = policy.Properties.PolicyDocument.Statement[0];
      
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toContain('dynamodb:GetItem');
      expect(statement.Action).toContain('dynamodb:PutItem');
      expect(statement.Action).toContain('dynamodb:DeleteItem');
      expect(statement.Action).toContain('dynamodb:Scan');
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should create Lambda log group with correct properties', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/user-data-functions-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });

    test('should create API Gateway log group with correct properties', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/apigateway/user-data-api-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });

    test('log groups should have deletion policy set to Delete', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.keys(logGroups).forEach((key) => {
        expect(logGroups[key]).toHaveProperty('DeletionPolicy', 'Delete');
        expect(logGroups[key]).toHaveProperty('UpdateReplacePolicy', 'Delete');
      });
    });
  });

  describe('API Gateway', () => {
    test('should create REST API with correct name', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `User Data Service-${environmentSuffix}`,
        Description: 'API Gateway for user data operations',
      });
    });

    test('should create deployment stage with correct settings', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
        MethodSettings: [
          {
            DataTraceEnabled: true,
            HttpMethod: '*',
            LoggingLevel: 'INFO',
            ResourcePath: '/*',
          },
        ],
      });
    });

    test('should configure access logging', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        AccessLogSetting: {
          DestinationArn: Match.anyValue(),
          Format: Match.stringLikeRegexp('requestId'),
        },
      });
    });

    test('should create users resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'users',
      });
    });

    test('should create {id} resource under users', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: '{id}',
      });
    });

    test('should create GET method for /users', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        AuthorizationType: 'NONE',
        Integration: {
          Type: 'AWS_PROXY',
          IntegrationHttpMethod: 'POST',
        },
      });
    });

    test('should create POST method for /users', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        AuthorizationType: 'NONE',
        Integration: {
          Type: 'AWS_PROXY',
          IntegrationHttpMethod: 'POST',
        },
      });
    });

    test('should create DELETE method for /users/{id}', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'DELETE',
        AuthorizationType: 'NONE',
        Integration: {
          Type: 'AWS_PROXY',
          IntegrationHttpMethod: 'POST',
        },
      });
    });

    test('should create OPTIONS methods for CORS', () => {
      const methods = template.findResources('AWS::ApiGateway::Method', {
        Properties: {
          HttpMethod: 'OPTIONS',
        },
      });
      expect(Object.keys(methods)).toHaveLength(3); // root, /users, /users/{id}
    });

    test('should configure CORS headers in OPTIONS methods', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
        Integration: {
          IntegrationResponses: [
            {
              ResponseParameters: {
                'method.response.header.Access-Control-Allow-Headers':
                  "'Content-Type,X-Amz-Date,Authorization,X-Api-Key'",
                'method.response.header.Access-Control-Allow-Origin': "'*'",
                'method.response.header.Access-Control-Allow-Methods':
                  "'OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD'",
              },
            },
          ],
        },
      });
    });
  });

  describe('Lambda Permissions', () => {
    test('should create API Gateway invoke permissions for Lambda functions', () => {
      const permissions = template.findResources('AWS::Lambda::Permission');
      const apiPermissions = Object.keys(permissions).filter(
        (key) => permissions[key].Properties.Principal === 'apigateway.amazonaws.com'
      );

      // Each function needs 2 permissions (prod stage + test stage) for each method
      expect(apiPermissions.length).toBeGreaterThanOrEqual(8);
    });

    test('permissions should reference correct Lambda functions', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 'apigateway.amazonaws.com',
        FunctionName: Match.anyValue(),
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should output API Gateway URL', () => {
      template.hasOutput('ApiGatewayUrl', {
        Description: 'API Gateway URL',
        Export: {
          Name: `ApiGatewayUrl-${environmentSuffix}`,
        },
      });
    });

    test('should output DynamoDB table name', () => {
      template.hasOutput('DynamoDBTableName', {
        Description: 'DynamoDB Table Name',
        Export: {
          Name: `DynamoDBTableName-${environmentSuffix}`,
        },
      });
    });

    test('should output S3 bucket name', () => {
      template.hasOutput('S3BucketName', {
        Description: 'S3 Bucket Name for Lambda source code',
        Export: {
          Name: `S3BucketName-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Resource Tags', () => {
    test('should apply Environment tag to stack', () => {
      const resources = template.findResources('AWS::S3::Bucket');
      Object.keys(resources).forEach((key) => {
        const tags = resources[key].Properties.Tags;
        expect(tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              Key: 'Environment',
              Value: 'Production',
            }),
          ])
        );
      });
    });

    test('should apply tags to DynamoDB table', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'Production',
          },
        ]),
      });
    });

    test('should apply tags to Lambda functions', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      const functionKeys = Object.keys(functions).filter(
        (key) => !key.includes('CustomResourceProvider')
      );

      functionKeys.forEach((key) => {
        expect(functions[key].Properties.Tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              Key: 'Environment',
              Value: 'Production',
            }),
          ])
        );
      });
    });
  });

  describe('Environment Suffix Usage', () => {
    test('all named resources should include environment suffix', () => {
      // Check S3 bucket
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(`-${environmentSuffix}$`),
      });

      // Check DynamoDB table
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp(`-${environmentSuffix}$`),
      });

      // Check Lambda functions
      const functions = template.findResources('AWS::Lambda::Function');
      const functionKeys = Object.keys(functions).filter(
        (key) => !key.includes('CustomResourceProvider')
      );

      functionKeys.forEach((key) => {
        if (functions[key].Properties.FunctionName) {
          expect(functions[key].Properties.FunctionName).toMatch(
            new RegExp(`-${environmentSuffix}$`)
          );
        }
      });

      // Check IAM role
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.stringLikeRegexp(`-${environmentSuffix}$`),
      });

      // Check Log groups
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.keys(logGroups).forEach((key) => {
        if (logGroups[key].Properties.LogGroupName) {
          expect(logGroups[key].Properties.LogGroupName).toMatch(
            new RegExp(`-${environmentSuffix}$`)
          );
        }
      });

      // Check API Gateway
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: Match.stringLikeRegexp(`-${environmentSuffix}$`),
      });
    });
  });

  describe('Security Best Practices', () => {
    test('S3 bucket should block all public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('Lambda functions should have specific timeout values', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      const functionKeys = Object.keys(functions).filter(
        (key) => !key.includes('CustomResourceProvider')
      );

      functionKeys.forEach((key) => {
        expect(functions[key].Properties.Timeout).toBe(30);
      });
    });

    test('IAM role should follow least privilege principle', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: Match.not(Match.arrayWith(['dynamodb:*'])),
            },
          ],
        },
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should create exactly 3 Lambda functions for application logic', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      const appFunctions = Object.keys(functions).filter(
        (key) => !key.includes('CustomResourceProvider')
      );
      expect(appFunctions).toHaveLength(3);
    });

    test('should create exactly 2 log groups', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      // Excluding any custom resource log groups
      const appLogGroups = Object.keys(logGroups).filter(
        (key) => !key.includes('Custom')
      );
      expect(appLogGroups).toHaveLength(2);
    });

    test('should create exactly 1 DynamoDB table', () => {
      const tables = template.findResources('AWS::DynamoDB::Table');
      expect(Object.keys(tables)).toHaveLength(1);
    });

    test('should create exactly 1 S3 bucket', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      expect(Object.keys(buckets)).toHaveLength(1);
    });

    test('should create exactly 1 REST API', () => {
      const apis = template.findResources('AWS::ApiGateway::RestApi');
      expect(Object.keys(apis)).toHaveLength(1);
    });
  });
});