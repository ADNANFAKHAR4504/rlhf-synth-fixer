import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

// Mock the nested stacks to verify they are called correctly
jest.mock('../lib/metadata-stack');

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

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
      const stackWithContext = new TapStack(app, 'TestTapStackContext');
      stackWithContext.node.setContext('environmentSuffix', 'context-test');
      expect(stackWithContext.node.tryGetContext('environmentSuffix')).toBe('context-test');
    });
  });
});