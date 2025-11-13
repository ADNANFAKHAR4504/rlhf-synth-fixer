import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { PrimaryStack, SharedConfig } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

const sharedConfig: SharedConfig = {
  domainName: 'payments.example.com',
  alertEmail: 'ops-team@example.com',
  tags: {
    Environment: 'Production',
    'DR-Tier': 'Critical',
    ManagedBy: 'CDK',
    Application: 'PaymentProcessor',
  },
};

describe('PrimaryStack', () => {
  let app: cdk.App;
  let stack: PrimaryStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new PrimaryStack(app, 'TestPrimaryStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      stackName: 'TestPrimaryStack',
      description: 'Test primary stack',
      config: sharedConfig,
      replicationRegion: 'us-west-2',
    });
    template = Template.fromStack(stack);
  });

  describe('Write Integration TESTS', () => {
    test('Dont forget!', async () => {
      expect(false).toBe(true);
    });
  });
});
