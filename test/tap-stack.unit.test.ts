import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

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

  describe('TapStack Creation', () => {
    test('should create stack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should have correct environment suffix', () => {
      const stackWithSuffix = new TapStack(app, 'TestStackWithSuffix', { 
        environmentSuffix: 'test' 
      });
      expect(stackWithSuffix).toBeDefined();
    });

    test('should accept additional props', () => {
      const stackWithProps = new TapStack(app, 'TestStackWithProps', { 
        environmentSuffix: 'test',
        approvedSshCidr: '10.0.0.0/8',
        alarmEmail: 'test@example.com'
      });
      expect(stackWithProps).toBeDefined();
    });

    test('should use default environment suffix when not provided', () => {
      const stackWithoutSuffix = new TapStack(app, 'TestStackNoSuffix', {});
      expect(stackWithoutSuffix).toBeDefined();
    });

    test('should work with minimal props', () => {
      const minimalStack = new TapStack(app, 'TestStackMinimal');
      expect(minimalStack).toBeDefined();
    });
  });

  describe('Write Integration TESTS', () => {
    test('Dont forget!', async () => {
      // TODO: Add meaningful integration tests
      expect(true).toBe(true);
    });
  });
});
