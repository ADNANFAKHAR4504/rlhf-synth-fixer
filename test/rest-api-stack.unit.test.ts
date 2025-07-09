import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { ApiGatewayStack } from '../lib/rest-api-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('ApiGatewayStack', () => {
  let app: cdk.App;
  let dynamoDBTable: dynamodb.Table;
  let stack: ApiGatewayStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();

    // Create a mock DynamoDB table for testing
    const dynamoDBStack = new cdk.Stack(app, 'TestDynamoDBStack');
    dynamoDBTable = new dynamodb.Table(dynamoDBStack, 'TestTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create the ApiGatewayStack with the mock table
    stack = new ApiGatewayStack(app, 'TestApiGatewayStack', {
      dynamoDBTable: dynamoDBTable,
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('REST API Creation', () => {
    test('should create a REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `Turn Around Prompt Service ${environmentSuffix}`,
        Description:
          'This service provides CRUD operations for turn around prompts.',
      });
    });

    test('should create a deployment', () => {
      template.hasResourceProperties('AWS::ApiGateway::Deployment', {
        Description:
          'This service provides CRUD operations for turn around prompts.',
      });
    });

    test('should create a stage with prod name', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
      });
    });

    test('should enable CloudWatch role', () => {
      template.hasResourceProperties('AWS::ApiGateway::Account', {
        CloudWatchRoleArn: Match.anyValue(),
      });
    });
  });

  describe('API Keys and Usage Plan', () => {
    test('should create read-only API key', () => {
      template.hasResourceProperties('AWS::ApiGateway::ApiKey', {
        Name: `readOnlyApiKey${environmentSuffix}`,
        Value: 'readOnlyApiKeyValuexxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      });
    });

    test('should create admin API key', () => {
      template.hasResourceProperties('AWS::ApiGateway::ApiKey', {
        Name: `adminApiKey${environmentSuffix}`,
        Value: 'adminApiKeyValuexxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      });
    });

    test('should create usage plan with throttling', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        UsagePlanName: `Easy${environmentSuffix}`,
        Throttle: {
          RateLimit: 10,
          BurstLimit: 20,
        },
      });
    });

    test('should associate API keys with usage plan', () => {
      template.resourceCountIs('AWS::ApiGateway::UsagePlanKey', 2);
    });
  });

  describe('IAM Role for DynamoDB Integration', () => {
    test('should create IAM role for DynamoDB access', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'apigateway.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            }),
          ]),
        },
      });
    });

    test('should grant read/write permissions to DynamoDB table', () => {
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
              ]),
            }),
          ]),
        },
      });
    });
  });

  describe('API Resource and Methods', () => {
    test('should create turnaroundprompt resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'turnaroundprompt',
      });
    });

    test('should create GET method', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        AuthorizationType: 'NONE',
        ApiKeyRequired: true,
        MethodResponses: [
          { StatusCode: '200' },
          { StatusCode: '400' },
          { StatusCode: '404' },
          { StatusCode: '500' },
        ],
      });
    });

    test('should create PUT method', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'PUT',
        AuthorizationType: 'NONE',
        ApiKeyRequired: true,
        MethodResponses: [
          { StatusCode: '200' },
          { StatusCode: '400' },
          { StatusCode: '404' },
          { StatusCode: '500' },
        ],
      });
    });

    test('should create PATCH method', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'PATCH',
        AuthorizationType: 'NONE',
        ApiKeyRequired: true,
        MethodResponses: [
          { StatusCode: '200' },
          { StatusCode: '400' },
          { StatusCode: '404' },
          { StatusCode: '500' },
        ],
      });
    });

    test('should create DELETE method', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'DELETE',
        AuthorizationType: 'NONE',
        ApiKeyRequired: true,
        MethodResponses: [
          { StatusCode: '200' },
          { StatusCode: '400' },
          { StatusCode: '404' },
          { StatusCode: '500' },
        ],
      });
    });

    test('should have exactly 4 HTTP methods', () => {
      template.resourceCountIs('AWS::ApiGateway::Method', 4);
    });
  });

  describe('Request Validators', () => {
    test('should create GET request validator', () => {
      template.hasResourceProperties('AWS::ApiGateway::RequestValidator', {
        Name: `GETValidator${environmentSuffix}`,
        ValidateRequestBody: true,
        ValidateRequestParameters: false,
      });
    });

    test('should create PUT request validator', () => {
      template.hasResourceProperties('AWS::ApiGateway::RequestValidator', {
        Name: `PUTValidator${environmentSuffix}`,
        ValidateRequestBody: true,
        ValidateRequestParameters: false,
      });
    });

    test('should create PATCH request validator', () => {
      template.hasResourceProperties('AWS::ApiGateway::RequestValidator', {
        Name: `PATCHValidator${environmentSuffix}`,
        ValidateRequestBody: true,
        ValidateRequestParameters: false,
      });
    });

    test('should create DELETE request validator', () => {
      template.hasResourceProperties('AWS::ApiGateway::RequestValidator', {
        Name: `DELETEValidator${environmentSuffix}`,
        ValidateRequestBody: true,
        ValidateRequestParameters: false,
      });
    });

    test('should have exactly 4 request validators', () => {
      template.resourceCountIs('AWS::ApiGateway::RequestValidator', 4);
    });
  });

  describe('Request Models and Schemas', () => {
    test('should create GET request model with correct schema', () => {
      template.hasResourceProperties('AWS::ApiGateway::Model', {
        Name: `TurnAroundPromptModel${environmentSuffix}`,
        ContentType: 'application/json',
        Schema: {
          $schema: 'http://json-schema.org/draft-04/schema#',
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            status: { type: 'string' },
          },
          required: ['id', 'name', 'status'],
        },
      });
    });

    test('should create PUT request model with correct schema', () => {
      template.hasResourceProperties('AWS::ApiGateway::Model', {
        Name: `TurnAroundPromptModelPut${environmentSuffix}`,
        ContentType: 'application/json',
        Schema: {
          $schema: 'http://json-schema.org/draft-04/schema#',
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            status: { type: 'string' },
          },
          required: ['id', 'name', 'status'],
        },
      });
    });

    test('should create PATCH request model with correct schema', () => {
      template.hasResourceProperties('AWS::ApiGateway::Model', {
        Name: `TurnAroundPromptModel${environmentSuffix}`,
        ContentType: 'application/json',
        Schema: {
          $schema: 'http://json-schema.org/draft-04/schema#',
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            status: { type: 'string' },
          },
          required: ['id', 'name', 'status'],
        },
      });
    });

    test('should create DELETE request model with correct schema', () => {
      template.hasResourceProperties('AWS::ApiGateway::Model', {
        Name: `TurnAroundPromptModelDelete${environmentSuffix}`,
        ContentType: 'application/json',
        Schema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
      });
    });

    test('should have exactly 3 request models: PUT, PATCH, DELETE', () => {
      template.resourceCountIs('AWS::ApiGateway::Model', 3);
    });
  });

  describe('DynamoDB Integration', () => {
    test('should create AWS integration for DynamoDB', () => {
      // Verify integration configuration through method properties
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        Integration: {
          Type: 'AWS',
          IntegrationHttpMethod: 'POST',
          PassthroughBehavior: 'WHEN_NO_TEMPLATES',
          RequestParameters: {
            'integration.request.header.Content-Type': "'application/json'",
          },
        },
      });
    });

    test('should set correct integration credentials', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        Integration: {
          Credentials: Match.anyValue(),
        },
      });
    });
  });

  describe('Stack Properties', () => {
    test('should be an instance of cdk.Stack', () => {
      expect(stack).toBeInstanceOf(cdk.Stack);
    });

    test('should have correct stack name', () => {
      expect(stack.stackName).toBe('TestApiGatewayStack');
    });
  });

  describe('Security Configuration', () => {
    test('should require API key for all methods', () => {
      const methods = template.findResources('AWS::ApiGateway::Method');

      Object.values(methods).forEach((method: any) => {
        expect(method.Properties.ApiKeyRequired).toBe(true);
      });
    });

    test('should have no authorization type (NONE) for all methods', () => {
      const methods = template.findResources('AWS::ApiGateway::Method');

      Object.values(methods).forEach((method: any) => {
        expect(method.Properties.AuthorizationType).toBe('NONE');
      });
    });

    test('should not expose sensitive information in outputs', () => {
      const outputs = template.findOutputs('*');

      // Ensure no API keys are exposed in outputs
      Object.values(outputs).forEach((output: any) => {
        const outputValue = JSON.stringify(output);
        expect(outputValue).not.toContain('readOnlyApiKeyValue');
        expect(outputValue).not.toContain('adminApiKeyValue');
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have expected number of resources', () => {
      // Verify the total count of key resources
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      template.resourceCountIs('AWS::ApiGateway::Resource', 1);
      template.resourceCountIs('AWS::ApiGateway::Method', 4);
      template.resourceCountIs('AWS::ApiGateway::Model', 3);
      template.resourceCountIs('AWS::ApiGateway::RequestValidator', 4);
      template.resourceCountIs('AWS::ApiGateway::ApiKey', 2);
      template.resourceCountIs('AWS::ApiGateway::UsagePlan', 1);
      template.resourceCountIs('AWS::ApiGateway::UsagePlanKey', 2);
      // Note: There are 2 IAM roles - one for DynamoDB access and one for CloudWatch logging
      template.resourceCountIs('AWS::IAM::Role', 2);
    });
  });

  describe('Constructor Parameters', () => {
    test('should require dynamoDBTable in props', () => {
      expect(() => {
        // @ts-ignore - Testing invalid props
        new ApiGatewayStack(app, 'InvalidStack', {});
      }).toThrow();
    });

    test('should accept valid props with dynamoDBTable', () => {
      expect(() => {
        new ApiGatewayStack(app, 'ValidStack', {
          dynamoDBTable: dynamoDBTable,
        });
      }).not.toThrow();
    });
  });
});
