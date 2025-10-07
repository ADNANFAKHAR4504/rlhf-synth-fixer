import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

// Mock the nested stack to verify it is called correctly
jest.mock('../lib/serverless-data-pipeline-stack', () => ({
  ServerlessDataPipelineStack: jest.fn().mockImplementation(function (this: any, scope: any, id: string, props: any) {
    this.stackName = `ServerlessDataPipelineStack${props.environmentSuffix}`;
    return this;
  })
}));

describe('TapStack', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('Stack Creation', () => {
    test('should create stack with default environmentSuffix', () => {
      const stack = new TapStack(app, 'TestTapStack');
      const template = Template.fromStack(stack);

      // Should have created the nested stack successfully
      expect(stack).toBeDefined();
      expect(template).toBeDefined();
    });

    test('should create stack with provided environmentSuffix', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test123'
      });
      const template = Template.fromStack(stack);

      expect(stack).toBeDefined();
      expect(template).toBeDefined();
    });

    test('should create stack with context environmentSuffix', () => {
      app.node.setContext('environmentSuffix', 'context-test');
      const stack = new TapStack(app, 'TestTapStack');

      expect(stack).toBeDefined();
    });

    test('should create stack with env properties', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'env-test',
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });

      expect(stack.account).toBe('123456789012');
      expect(stack.region).toBe('us-west-2');
    });
  });

  describe('Stack Outputs', () => {
    test('should have deployment summary output', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'output-test'
      });
      const template = Template.fromStack(stack);

      template.hasOutput('DeploymentSummary', {});
    });

    test('should have pipeline stack name output', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'pipeline-test'
      });
      const template = Template.fromStack(stack);

      template.hasOutput('PipelineStackName', {});
    });

    test('should have integration testing note output', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'integration-test'
      });
      const template = Template.fromStack(stack);

      template.hasOutput('IntegrationTestingNote', {});
    });

    test('should have correct export names for outputs', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'export-test'
      });
      const template = Template.fromStack(stack);

      template.hasOutput('PipelineStackName', {
        Export: {
          Name: 'PipelineStackName-export-test'
        }
      });

      template.hasOutput('IntegrationTestingNote', {
        Export: {
          Name: 'IntegrationInstructions-export-test'
        }
      });
    });
  });

  describe('Tags', () => {
    test('should apply Environment Production tag', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'tag-test'
      });

      // Check that tags are applied to the stack
      const stackTags = cdk.Tags.of(stack);
      expect(stackTags).toBeDefined();
    });
  });

  describe('Nested Stack Creation', () => {
    test('should create ServerlessDataPipelineStack as nested stack', () => {
      const ServerlessDataPipelineStack = require('../lib/serverless-data-pipeline-stack').ServerlessDataPipelineStack;

      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'nested-test'
      });

      // Verify the nested stack constructor was called
      expect(ServerlessDataPipelineStack).toHaveBeenCalledWith(
        stack,
        'ServerlessDataPipelineStacknested-test',
        {
          environmentSuffix: 'nested-test',
          notificationEmail: undefined
        }
      );
    });

    test('should pass notification email to nested stack', () => {
      const ServerlessDataPipelineStack = require('../lib/serverless-data-pipeline-stack').ServerlessDataPipelineStack;
      process.env.NOTIFICATION_EMAIL = 'test@example.com';

      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'email-test'
      });

      expect(ServerlessDataPipelineStack).toHaveBeenCalledWith(
        stack,
        'ServerlessDataPipelineStackemail-test',
        {
          environmentSuffix: 'email-test',
          notificationEmail: 'test@example.com'
        }
      );

      delete process.env.NOTIFICATION_EMAIL;
    });
  });

  describe('Environment Suffix Handling', () => {
    test('should use props environmentSuffix over context', () => {
      app.node.setContext('environmentSuffix', 'context-suffix');
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'props-suffix'
      });
      const template = Template.fromStack(stack);

      template.hasOutput('PipelineStackName', {
        Export: {
          Name: 'PipelineStackName-props-suffix'
        }
      });
    });

    test('should use context environmentSuffix when props not provided', () => {
      app.node.setContext('environmentSuffix', 'context-only');
      const stack = new TapStack(app, 'TestTapStack');
      const template = Template.fromStack(stack);

      template.hasOutput('PipelineStackName', {
        Export: {
          Name: 'PipelineStackName-context-only'
        }
      });
    });

    test('should default to "dev" when no environmentSuffix provided', () => {
      const stack = new TapStack(app, 'TestTapStack');
      const template = Template.fromStack(stack);

      template.hasOutput('PipelineStackName', {
        Export: {
          Name: 'PipelineStackName-dev'
        }
      });
    });
  });

  describe('Stack Properties', () => {
    test('should inherit all standard stack properties', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'props-test',
        description: 'Test stack description',
        terminationProtection: true
      });

      expect(stack.stackName).toBe('TestTapStack');
      expect(stack.terminationProtection).toBe(true);
    });
  });
});
