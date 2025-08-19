import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app;
  let stack;
  let template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack creation', () => {
    test('creates stack successfully', () => {
      expect(stack).toBeDefined();
      expect(template).toBeDefined();
    });

    test('creates S3 bucket with correct naming pattern', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `my-bucket-${environmentSuffix}`,
      });
    });
  });

  describe('Write Integration TESTS', () => {
    test('Reminder to write integration tests', () => {
      expect(true).toBe(true);
    });
  });
});
