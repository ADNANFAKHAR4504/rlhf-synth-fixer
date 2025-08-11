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
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      approvedSshCidr: '10.0.0.0/8',
      alarmEmail: 'test@example.com'
    });
    template = Template.fromStack(stack);
  });

  describe('TapStack Creation', () => {
    test('should create stack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should have production web app stack when required props provided', () => {
      expect(stack.productionWebAppStack).toBeDefined();
    });

    test('should not create production stack when missing required props', () => {
      const separateApp = new cdk.App();
      const stackWithoutProps = new TapStack(separateApp, 'TestStackWithoutProps', {
        environmentSuffix: 'test'
      });
      expect(stackWithoutProps.productionWebAppStack).toBeUndefined();
    });

    test('should accept certificate ARN parameter', () => {
      const separateApp = new cdk.App();
      const stackWithCert = new TapStack(separateApp, 'TestStackWithCert', { 
        environmentSuffix: 'test',
        approvedSshCidr: '10.0.0.0/8',
        alarmEmail: 'test@example.com',
        certificateArn: 'arn:aws:acm:us-west-2:123456789012:certificate/example'
      });
      expect(stackWithCert.productionWebAppStack).toBeDefined();
    });

    test('should use default environment suffix when not provided', () => {
      const separateApp = new cdk.App();
      const stackWithoutSuffix = new TapStack(separateApp, 'TestStackNoSuffix', {
        approvedSshCidr: '10.0.0.0/8',
        alarmEmail: 'test@example.com'
      });
      expect(stackWithoutSuffix).toBeDefined();
    });

    test('should work with minimal props', () => {
      const separateApp = new cdk.App();
      const minimalStack = new TapStack(separateApp, 'TestStackMinimal');
      expect(minimalStack).toBeDefined();
      expect(minimalStack.productionWebAppStack).toBeUndefined();
    });
  });

  describe('Write Integration TESTS', () => {
    test('Dont forget!', async () => {
      // TODO: Add meaningful integration tests
      expect(true).toBe(true);
    });
  });
});
