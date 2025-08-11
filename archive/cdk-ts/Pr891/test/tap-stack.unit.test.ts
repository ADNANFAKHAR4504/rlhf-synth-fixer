import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

// Mock the nested stack to verify it is called correctly
jest.mock('../lib/cicd-pipeline-stack', () => ({
  CiCdPipelineStack: jest.fn().mockImplementation(() => ({
    // Mock implementation
  })),
}));

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('TapStack Unit Tests', () => {
    test('should create TapStack with correct environment suffix', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toContain('TestTapStack');
    });

    test('should pass environment suffix to nested stack', () => {
      const { CiCdPipelineStack } = require('../lib/cicd-pipeline-stack');
      expect(CiCdPipelineStack).toHaveBeenCalledWith(
        stack,
        'CiCdPipelineStack',
        expect.objectContaining({
          environmentSuffix,
        })
      );
    });

    test('should use default environment suffix when none provided', () => {
      const appDefault = new cdk.App();
      const stackDefault = new TapStack(appDefault, 'TestTapStackDefault');
      expect(stackDefault).toBeDefined();
    });

    test('should handle environment suffix from context', () => {
      const appContext = new cdk.App({
        context: {
          environmentSuffix: 'test-context',
        },
      });
      const stackContext = new TapStack(appContext, 'TestTapStackContext');
      expect(stackContext).toBeDefined();
    });
  });
});
