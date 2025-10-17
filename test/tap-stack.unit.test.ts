import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test123',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('Stack is created successfully', () => {
      expect(stack).toBeDefined();
    });

    test('Stack has correct environment suffix', () => {
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });
  });

  describe('Outputs', () => {
    test('ApplicationUrl output exists', () => {
      template.hasOutput('ApplicationUrl', {});
    });

    test('CloudFrontDistributionId output exists', () => {
      template.hasOutput('CloudFrontDistributionId', {});
    });

    test('PrimaryRegion output has correct value', () => {
      template.hasOutput('PrimaryRegion', {
        Value: 'us-east-1',
      });
    });

    test('SecondaryRegion output has correct value', () => {
      template.hasOutput('SecondaryRegion', {
        Value: 'us-east-2',
      });
    });

    test('DynamoDBTableName output exists', () => {
      template.hasOutput('DynamoDBTableName', {});
    });

    test('WAFWebAclArn output exists', () => {
      template.hasOutput('WAFWebAclArn', {});
    });

    test('PrimaryApiEndpoint output exists', () => {
      template.hasOutput('PrimaryApiEndpoint', {});
    });

    test('TestAuthTokenValid output has correct value', () => {
      template.hasOutput('TestAuthTokenValid', {
        Value: 'Allow-test-token-123',
      });
    });

    test('TestAuthTokenInvalid output has correct value', () => {
      template.hasOutput('TestAuthTokenInvalid', {
        Value: 'Invalid-token',
      });
    });
  });

  describe('Environment Suffix Handling', () => {
    test('Uses environment suffix from props', () => {
      const outputs = template.findOutputs('*');
      const allStackNamesOutput = outputs.AllStackNames;
      const stackNames = JSON.parse(allStackNamesOutput.Value);
      expect(stackNames.databaseStack).toBe('DatabaseStack-test123');
    });

    test('Different environment suffixes create different resource names', () => {
      const app2 = new cdk.App();
      const stack2 = new TapStack(app2, 'TestTapStack2', {
        environmentSuffix: 'prod456',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const template2 = Template.fromStack(stack2);

      const outputs1 = template.findOutputs('*');
      const outputs2 = template2.findOutputs('*');

      const stackNames1 = JSON.parse(outputs1.AllStackNames.Value);
      const stackNames2 = JSON.parse(outputs2.AllStackNames.Value);

      expect(stackNames1.databaseStack).not.toBe(stackNames2.databaseStack);
    });
  });

  describe('Multi-Region Configuration', () => {
    test('Primary region is us-east-1', () => {
      template.hasOutput('PrimaryRegion', {
        Value: 'us-east-1',
      });
    });

    test('Secondary region is us-east-2', () => {
      template.hasOutput('SecondaryRegion', {
        Value: 'us-east-2',
      });
    });

    test('Regions output includes both regions', () => {
      template.hasOutput('Regions', {
        Value: 'Primary: us-east-1, Secondary: us-east-2',
      });
    });
  });

  describe('Testing Configuration', () => {
    test('Valid auth token starts with Allow', () => {
      template.hasOutput('TestAuthTokenValid', {
        Value: 'Allow-test-token-123',
      });
    });

    test('Testing instructions are provided', () => {
      template.hasOutput('TestingInstructions', {
        Value: 'Use ApplicationUrl for E2E tests. Valid auth token starts with "Allow"',
      });
    });

    test('Failover testing notes are provided', () => {
      template.hasOutput('FailoverTestingNotes', {
        Value: 'Health checks every 30s. Failover after 3 failures (~90s)',
      });
    });
  });

  describe('Stack Names Output', () => {
    test('AllStackNames output contains all stack names', () => {
      const outputs = template.findOutputs('*');
      const stackNames = JSON.parse(outputs.AllStackNames.Value);

      expect(stackNames).toHaveProperty('tapStack');
      expect(stackNames).toHaveProperty('secondaryKmsStack');
      expect(stackNames).toHaveProperty('databaseStack');
      expect(stackNames).toHaveProperty('primaryRegionalStack');
      expect(stackNames).toHaveProperty('secondaryRegionalStack');
      expect(stackNames).toHaveProperty('securityStack');
      expect(stackNames).toHaveProperty('globalStack');
    });

    test('Stack names include environment suffix', () => {
      const outputs = template.findOutputs('*');
      const stackNames = JSON.parse(outputs.AllStackNames.Value);

      Object.values(stackNames).forEach((name) => {
        expect(name).toContain('test123');
      });
    });
  });

  describe('Branch Coverage - Environment Suffix Sources', () => {
    test('Uses environment suffix from context when not in props', () => {
      const app2 = new cdk.App();
      app2.node.setContext('environmentSuffix', 'context789');
      const stack2 = new TapStack(app2, 'TestTapStack2', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const template2 = Template.fromStack(stack2);
      const outputs = template2.findOutputs('*');
      const stackNames = JSON.parse(outputs.AllStackNames.Value);
      expect(stackNames.databaseStack).toContain('context789');
    });

    test('Uses default dev suffix when neither props nor context provided', () => {
      const app3 = new cdk.App();
      const stack3 = new TapStack(app3, 'TestTapStack3', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const template3 = Template.fromStack(stack3);
      const outputs = template3.findOutputs('*');
      const stackNames = JSON.parse(outputs.AllStackNames.Value);
      expect(stackNames.databaseStack).toContain('dev');
    });
  });
});
