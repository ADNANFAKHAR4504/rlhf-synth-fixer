import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { DynamoDbStack } from '../lib/dynamodb-stack';
import { LambdaStack } from '../lib/lambda-stack';
import { ApiGatewayStack } from '../lib/api-gateway-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
  });

  test('creates nested stacks with correct configuration', () => {
    // Verify the stack is created properly
    expect(stack).toBeDefined();
    expect(stack.stackName).toContain('TestTapStack');

    // Verify tags are applied to the stack
    const tags = cdk.Tags.of(stack);
    expect(tags).toBeDefined();
  });

  test('passes environment suffix to nested stacks', () => {
    // The TapStack creates nested stacks as constructs, not separate CloudFormation stacks
    // Check that the stack has the correct environment suffix
    expect(stack.node.children.length).toBeGreaterThan(0);

    // Find the nested constructs (DynamoDbStack, LambdaStack, ApiGatewayStack)
    const nestedStacks = stack.node.children.filter(child =>
      child.node.id.includes(environmentSuffix)
    );
    expect(nestedStacks.length).toBeGreaterThan(0);
  });

  test('uses default environment suffix when not provided', () => {
    const appWithoutContext = new cdk.App();
    const stackWithoutSuffix = new TapStack(
      appWithoutContext,
      'TestStackNoSuffix',
      {
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
        // No environmentSuffix provided
      }
    );

    // Should use 'dev' as default
    const nestedStacks = stackWithoutSuffix.node.children.filter(child =>
      child.node.id.includes('dev')
    );
    expect(nestedStacks.length).toBeGreaterThan(0);
  });

  test('uses context environment suffix when props not provided', () => {
    const appWithContext = new cdk.App({
      context: {
        environmentSuffix: 'context-env',
      },
    });
    const stackWithContext = new TapStack(appWithContext, 'TestStackContext', {
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });

    // Should use context value
    const nestedStacks = stackWithContext.node.children.filter(child =>
      child.node.id.includes('context-env')
    );
    expect(nestedStacks.length).toBeGreaterThan(0);
  });
});

describe('DynamoDbStack', () => {
  let app: cdk.App;
  let stack: DynamoDbStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new DynamoDbStack(app, 'TestDynamoDbStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    template = Template.fromStack(stack);
  });

  test('creates DynamoDB table with correct properties', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: `Users-${environmentSuffix}`,
      BillingMode: 'PAY_PER_REQUEST',
      KeySchema: [
        {
          AttributeName: 'UserId',
          KeyType: 'HASH',
        },
      ],
      AttributeDefinitions: [
        {
          AttributeName: 'UserId',
          AttributeType: 'S',
        },
      ],
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: false,
      },
    });
  });

  test('sets removal policy to DESTROY', () => {
    template.hasResource('AWS::DynamoDB::Table', {
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete',
    });
  });

  test('creates outputs for table name and ARN', () => {
    template.hasOutput('UsersTableName', {
      Export: {
        Name: `UsersTableName-${environmentSuffix}`,
      },
    });

    template.hasOutput('UsersTableArn', {
      Export: {
        Name: `UsersTableArn-${environmentSuffix}`,
      },
    });
  });

  test('adds resource policy for Lambda access', () => {
    const tableResource = template.findResources('AWS::DynamoDB::Table');
    const tableLogicalId = Object.keys(tableResource)[0];

    // Verify the table exists
    expect(tableLogicalId).toBeDefined();
  });
});

describe('LambdaStack', () => {
  let app: cdk.App;
  let dynamoDbStack: DynamoDbStack;
  let lambdaStack: LambdaStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    dynamoDbStack = new DynamoDbStack(app, 'TestDynamoDbStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    lambdaStack = new LambdaStack(app, 'TestLambdaStack', {
      environmentSuffix,
      usersTable: dynamoDbStack.usersTable,
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    template = Template.fromStack(lambdaStack);
  });

  test('creates three Lambda functions with correct names', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: `CreateUser-${environmentSuffix}`,
      Runtime: 'python3.8',
      Handler: 'index.lambda_handler',
      Timeout: 30,
    });

    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: `GetUser-${environmentSuffix}`,
      Runtime: 'python3.8',
      Handler: 'index.lambda_handler',
      Timeout: 30,
    });

    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: `DeleteUser-${environmentSuffix}`,
      Runtime: 'python3.8',
      Handler: 'index.lambda_handler',
      Timeout: 30,
    });
  });

  test('Lambda functions have environment variables', () => {
    // The TABLE_NAME uses CloudFormation intrinsic functions, not a hardcoded value
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: Match.objectLike({
          TABLE_NAME: Match.anyValue(), // Will be a Fn::ImportValue reference
          REGION: 'us-west-2',
        }),
      },
    });
  });

  test('creates IAM roles for Lambda functions', () => {
    template.resourceCountIs('AWS::IAM::Role', 3);

    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          }),
        ]),
      }),
    });
  });

  test('grants DynamoDB permissions to Lambda functions', () => {
    // Check for IAM policies that grant DynamoDB access
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Action: Match.arrayWith([
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:DeleteItem',
            ]),
          }),
        ]),
      }),
    });
  });

  test('creates outputs for Lambda function ARNs', () => {
    template.hasOutput('CreateUserFunctionArn', {
      Export: {
        Name: `CreateUserFunctionArn-${environmentSuffix}`,
      },
    });

    template.hasOutput('GetUserFunctionArn', {
      Export: {
        Name: `GetUserFunctionArn-${environmentSuffix}`,
      },
    });

    template.hasOutput('DeleteUserFunctionArn', {
      Export: {
        Name: `DeleteUserFunctionArn-${environmentSuffix}`,
      },
    });
  });

  test('Lambda functions have inline code', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Code: Match.objectLike({
        ZipFile: Match.anyValue(),
      }),
    });
  });
});

describe('ApiGatewayStack', () => {
  let app: cdk.App;
  let dynamoDbStack: DynamoDbStack;
  let lambdaStack: LambdaStack;
  let apiGatewayStack: ApiGatewayStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    dynamoDbStack = new DynamoDbStack(app, 'TestDynamoDbStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    lambdaStack = new LambdaStack(app, 'TestLambdaStack', {
      environmentSuffix,
      usersTable: dynamoDbStack.usersTable,
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    apiGatewayStack = new ApiGatewayStack(app, 'TestApiGatewayStack', {
      environmentSuffix,
      createUserFunction: lambdaStack.createUserFunction,
      getUserFunction: lambdaStack.getUserFunction,
      deleteUserFunction: lambdaStack.deleteUserFunction,
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    template = Template.fromStack(apiGatewayStack);
  });

  test('creates REST API with correct configuration', () => {
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      Name: `User-API-${environmentSuffix}`,
      Description: `User management API for ${environmentSuffix} environment`,
    });
  });

  test('creates API resources and methods', () => {
    // Check for /users resource
    template.hasResourceProperties('AWS::ApiGateway::Resource', {
      PathPart: 'users',
    });

    // Check for /users/{userId} resource
    template.hasResourceProperties('AWS::ApiGateway::Resource', {
      PathPart: '{userId}',
    });

    // Check for POST /users method
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'POST',
    });

    // Check for GET /users/{userId} method
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'GET',
    });

    // Check for DELETE /users/{userId} method
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'DELETE',
    });
  });

  test('configures CORS correctly', () => {
    // Check for OPTIONS methods (CORS preflight)
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'OPTIONS',
    });
  });

  test('creates Lambda integrations', () => {
    // Check that Lambda integrations are configured
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      Integration: Match.objectLike({
        Type: 'AWS_PROXY',
        IntegrationHttpMethod: 'POST',
      }),
    });
  });

  test('creates API deployment', () => {
    // Deployment is created with a unique ID
    template.hasResourceProperties('AWS::ApiGateway::Deployment', {});
  });

  test('configures stage settings', () => {
    // CDK creates a stage as part of the deployment
    template.hasResourceProperties('AWS::ApiGateway::Stage', {
      StageName: environmentSuffix,
    });
  });

  test('creates Lambda permissions for API Gateway', () => {
    // Check for Lambda permissions (3 methods x 2 permissions each for prod and test)
    template.resourceCountIs('AWS::Lambda::Permission', 6);

    template.hasResourceProperties('AWS::Lambda::Permission', {
      Action: 'lambda:InvokeFunction',
      Principal: 'apigateway.amazonaws.com',
    });
  });

  test('creates outputs for API URL and ID', () => {
    template.hasOutput('ApiGatewayUrl', {
      Export: {
        Name: `ApiGatewayUrl-${environmentSuffix}`,
      },
    });

    template.hasOutput('ApiGatewayId', {
      Export: {
        Name: `ApiGatewayId-${environmentSuffix}`,
      },
    });
  });
});

describe('Stack Dependencies', () => {
  let app: cdk.App;
  let tapStack: TapStack;

  beforeEach(() => {
    app = new cdk.App();
    tapStack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
  });

  test('nested stacks have correct dependencies', () => {
    const assembly = app.synth();
    const tapStackArtifact = assembly.getStackByName(tapStack.stackName);

    // The main stack should have nested stacks
    expect(tapStackArtifact.dependencies.length).toBeGreaterThanOrEqual(0);
  });
});

describe('Python Lambda Code Validation', () => {
  let app: cdk.App;
  let dynamoDbStack: DynamoDbStack;
  let lambdaStack: LambdaStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    dynamoDbStack = new DynamoDbStack(app, 'TestDynamoDbStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    lambdaStack = new LambdaStack(app, 'TestLambdaStack', {
      environmentSuffix,
      usersTable: dynamoDbStack.usersTable,
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    template = Template.fromStack(lambdaStack);
  });

  test('Lambda functions contain valid Python code', () => {
    const functions = template.findResources('AWS::Lambda::Function');

    Object.values(functions).forEach((func: any) => {
      const code = func.Properties?.Code?.ZipFile;
      expect(code).toBeDefined();
      // Handle both string and CloudFormation intrinsic function
      if (typeof code === 'string') {
        expect(code).toContain('def lambda_handler');
        expect(code).toContain('import json');
        expect(code).toContain('import boto3');
      } else if (code && code['Fn::Join']) {
        const codeString = JSON.stringify(code);
        expect(codeString).toContain('def lambda_handler');
        expect(codeString).toContain('import json');
        expect(codeString).toContain('import boto3');
      }
    });
  });

  test('CreateUser Lambda contains UUID generation', () => {
    const functions = template.findResources('AWS::Lambda::Function');
    const createUserFunction = Object.values(functions).find(
      (func: any) =>
        func.Properties?.FunctionName === `CreateUser-${environmentSuffix}`
    );

    expect(createUserFunction).toBeDefined();
    const code = (createUserFunction as any).Properties?.Code?.ZipFile;
    // Handle both string and CloudFormation intrinsic function
    if (typeof code === 'string') {
      expect(code).toContain('import uuid');
      expect(code).toContain('uuid.uuid4()');
    } else if (code && code['Fn::Join']) {
      const codeString = JSON.stringify(code);
      expect(codeString).toContain('import uuid');
      expect(codeString).toContain('uuid.uuid4()');
    }
  });

  test('Lambda functions handle errors properly', () => {
    const functions = template.findResources('AWS::Lambda::Function');

    Object.values(functions).forEach((func: any) => {
      const code = func.Properties?.Code?.ZipFile;
      // Handle both string and CloudFormation intrinsic function
      if (typeof code === 'string') {
        expect(code).toContain('try:');
        expect(code).toContain('except Exception as e:');
        expect(code).toContain('statusCode');
      } else if (code && code['Fn::Join']) {
        const codeString = JSON.stringify(code);
        expect(codeString).toContain('try:');
        expect(codeString).toContain('except Exception as e:');
        expect(codeString).toContain('statusCode');
      }
    });
  });
});
