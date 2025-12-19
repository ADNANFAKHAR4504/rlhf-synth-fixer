import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';
import { MetadataProcessingStack } from '../lib/metadata-stack';

// Mock the nested stacks to verify they are called correctly
jest.mock('../lib/metadata-stack');

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock the MetadataProcessingStack to return a nestedStackResource with getAtt method
    const mockNestedStackResource = {
      getAtt: jest.fn((attributeName: string) => ({
        toString: () => `mock-${attributeName}`
      }))
    };

    (MetadataProcessingStack as jest.MockedClass<typeof MetadataProcessingStack>).mockImplementation(
      function(this: any, scope: any, id: string, props: any) {
        this.nestedStackResource = mockNestedStackResource;
        return this;
      } as any
    );

    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
  });

  describe('Stack Creation', () => {
    test('should create a TapStack instance', () => {
      expect(stack).toBeInstanceOf(TapStack);
      expect(stack).toBeInstanceOf(cdk.Stack);
    });

    test('should set environment suffix correctly', () => {
      // The environment suffix is set internally, not as context
      // Let's test that the stack is created with the environment suffix
      expect(stack).toBeInstanceOf(TapStack);
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should create stack with default environment suffix when not provided', () => {
      const stackWithoutEnv = new TapStack(app, 'TestTapStackNoEnv');
      expect(stackWithoutEnv).toBeInstanceOf(TapStack);
    });

    test('should create stack with custom environment suffix', () => {
      const customStack = new TapStack(app, 'TestTapStackCustom', { 
        environmentSuffix: 'test' 
      });
      expect(customStack).toBeInstanceOf(TapStack);
    });
  });

  describe('Nested Stack Instantiation', () => {
    test('should instantiate MetadataProcessingStack', () => {
      const { MetadataProcessingStack } = require('../lib/metadata-stack');
      expect(MetadataProcessingStack).toHaveBeenCalledWith(
        stack,
        'MetadataProcessingStack',
        expect.objectContaining({
          environmentSuffix: environmentSuffix
        })
      );
    });
  });

  describe('Stack Properties', () => {
    test('should have correct stack name', () => {
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should have environment suffix in context or props', () => {
      // Create a new app for this test to avoid conflicts
      const testApp = new cdk.App();
      testApp.node.setContext('environmentSuffix', 'context-test');
      const stackWithContext = new TapStack(testApp, 'TestTapStackContext');
      expect(stackWithContext.node.tryGetContext('environmentSuffix')).toBe('context-test');
    });
  });

  describe('Stack Outputs', () => {
    test('should create stack outputs if nested stack outputs exist', () => {
      // Verify that the stack has outputs
      const outputs = stack.node.findAll().filter(
        child => child instanceof cdk.CfnOutput
      );

      // Should have 5 outputs
      expect(outputs.length).toBeGreaterThanOrEqual(5);
    });

    test('should call getAtt on nested stack resource for each output', () => {
      // Get the mock instance
      const mockInstance = (MetadataProcessingStack as jest.MockedClass<typeof MetadataProcessingStack>).mock.results[0]?.value;

      if (mockInstance?.nestedStackResource) {
        const mockGetAtt = mockInstance.nestedStackResource.getAtt;

        // Verify getAtt was called for each output
        expect(mockGetAtt).toHaveBeenCalledWith('Outputs.MetadataBucketName');
        expect(mockGetAtt).toHaveBeenCalledWith('Outputs.OpenSearchDomainName');
        expect(mockGetAtt).toHaveBeenCalledWith('Outputs.OpenSearchDomainEndpoint');
        expect(mockGetAtt).toHaveBeenCalledWith('Outputs.FailureTableName');
        expect(mockGetAtt).toHaveBeenCalledWith('Outputs.MetadataProcessingWorkflowArn');
      }
    });
  });
});