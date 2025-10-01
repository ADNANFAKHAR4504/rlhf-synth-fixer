import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, `TapStack${environmentSuffix}`, {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Main Stack Creation', () => {
    test('creates TapStack with correct naming', () => {
      expect(stack.stackName).toContain('TapStack');
      expect(stack.stackName).toContain(environmentSuffix);
    });

    test('includes FoodDeliveryStack as nested stack', () => {
      // Verify the stack contains nested stack resources
      const resources = template.findResources('AWS::CloudFormation::Stack');
      expect(Object.keys(resources).length).toBeGreaterThan(0);
    });
  });
});
