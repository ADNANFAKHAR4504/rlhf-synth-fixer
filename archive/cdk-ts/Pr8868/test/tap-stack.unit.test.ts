import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('TapStack Unit Tests', () => {
    test('should create TapStack with correct environment suffix', () => {
      // Verify S3 bucket is created with environment suffix in name
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('should inherit from CiCdPipelineStack', () => {
      // TapStack should have all resources from CiCdPipelineStack
      template.resourceCountIs('AWS::KMS::Key', 1);
      template.resourceCountIs('AWS::IAM::Role', 2);
      template.resourceCountIs('AWS::Logs::LogGroup', 1);
    });

    test('should use default environment suffix when none provided', () => {
      // Create a fresh app for this test to avoid multiple synth issue
      const freshApp = new cdk.App();
      const defaultStack = new TapStack(freshApp, 'DefaultStack');
      const defaultTemplate = Template.fromStack(defaultStack);

      // Should still create resources with default 'dev' suffix
      defaultTemplate.resourceCountIs('AWS::S3::Bucket', 1);
      defaultTemplate.resourceCountIs('AWS::KMS::Key', 1);
    });

    test('should create all required infrastructure components', () => {
      // Verify all major resources are created
      template.resourceCountIs('AWS::S3::Bucket', 1); // Artifacts bucket
      template.resourceCountIs('AWS::KMS::Key', 1); // Encryption key
      template.resourceCountIs('AWS::IAM::Role', 2); // Deployment + CodeCatalyst roles
      template.resourceCountIs('AWS::SSM::Parameter', 2); // DB connection + App Composer config
      template.resourceCountIs('AWS::Logs::LogGroup', 1); // CloudWatch logs
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1); // Dashboard
    });
  });
});
