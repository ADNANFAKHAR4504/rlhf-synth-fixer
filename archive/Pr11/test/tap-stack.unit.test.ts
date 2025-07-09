import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DynamoDBStack } from '../lib/ddb-stack';
import { ApiGatewayStack } from '../lib/rest-api-stack';
import { TapStack } from '../lib/tap-stack';

// Mock the nested stacks to verify they are called correctly
jest.mock('../lib/ddb-stack');
jest.mock('../lib/rest-api-stack');

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  // Create mock instances
  const mockDynamoDBStack = {
    table: {
      tableName: 'mock-table',
    },
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock the DynamoDBStack constructor to return our mock instance
    (
      DynamoDBStack as jest.MockedClass<typeof DynamoDBStack>
    ).mockImplementation(() => mockDynamoDBStack as any);

    // Mock the ApiGatewayStack constructor
    (
      ApiGatewayStack as jest.MockedClass<typeof ApiGatewayStack>
    ).mockImplementation(() => ({}) as any);

    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('should create a TapStack instance', () => {
      expect(stack).toBeInstanceOf(TapStack);
      expect(stack).toBeInstanceOf(cdk.Stack);
    });
  });

  describe('Output Verification', () => {
    test('should not expose sensitive information in outputs', () => {
      const template = Template.fromStack(stack);
      const outputs = template.findOutputs('*');

      // Ensure no API keys are exposed in outputs
      Object.values(outputs).forEach(output => {
        expect(JSON.stringify(output)).not.toMatch(/readOnlyApiKeyValue/);
        expect(JSON.stringify(output)).not.toMatch(/adminApiKeyValue/);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle missing props gracefully', () => {
      expect(() => {
        new TapStack(app, 'TestTapStackNProps');
      }).not.toThrow();
    });

    test('should create stack with custom props', () => {
      const customProps: cdk.StackProps = {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        description: 'Test stack with custom props',
      };

      expect(() => {
        new TapStack(app, 'TestTapStackCustomProps', customProps);
      }).not.toThrow();
    });
  });

  describe('Tagging and Metadata', () => {
    test('should allow adding tags to the stack', () => {
      cdk.Tags.of(stack).add('Environment', 'Test');
      cdk.Tags.of(stack).add('Project', 'TAP');

      // The stack should accept tags without throwing errors
      expect(stack).toBeDefined();
    });
  });

  describe('Stack Dependencies', () => {
    test('should create DynamoDBStack instance', () => {
      // Verify DynamoDBStack constructor was called
      expect(DynamoDBStack).toHaveBeenCalledTimes(1);
      expect(DynamoDBStack).toHaveBeenCalledWith(
        stack, // scope should be the TapStack instance
        'DynamoDBStack', // id should be 'DynamoDBStack'
        { environmentSuffix } // props should contain environmentSuffix
      );
    });

    test('should create ApiGatewayStack with DynamoDB table parameter', () => {
      // Verify ApiGatewayStack constructor was called
      expect(ApiGatewayStack).toHaveBeenCalledTimes(1);
      expect(ApiGatewayStack).toHaveBeenCalledWith(
        stack, // scope should be the TapStack instance
        'ApiGatewayStack', // id should be 'ApiGatewayStack'
        { dynamoDBTable: mockDynamoDBStack.table, environmentSuffix } // props should contain the DynamoDB table
      );
    });

    test('should pass DynamoDB table from DynamoDBStack to ApiGatewayStack', () => {
      // Verify both stacks were called
      expect(DynamoDBStack).toHaveBeenCalledTimes(1);
      expect(ApiGatewayStack).toHaveBeenCalledTimes(1);

      // Get the ApiGateway call arguments
      const apiGatewayCall = (
        ApiGatewayStack as jest.MockedClass<typeof ApiGatewayStack>
      ).mock.calls[0];

      // ApiGatewayStack should receive the table from DynamoDBStack
      const apiGatewayProps = apiGatewayCall[2]; // Third argument is props
      expect(apiGatewayProps).toHaveProperty('dynamoDBTable');
      expect(apiGatewayProps.dynamoDBTable).toBe(mockDynamoDBStack.table);
    });
  });
});
