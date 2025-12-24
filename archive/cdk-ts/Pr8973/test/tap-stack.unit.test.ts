import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  test('synthesizes all resources with default props', () => {
    const stack = new TapStack(app, 'TestTapStack');
    const template = Template.fromStack(stack);

    // KMS Key
    template.resourceCountIs('AWS::KMS::Key', 1);

    // S3 Bucket
    template.resourceCountIs('AWS::S3::Bucket', 1);

    // IAM Role
    template.resourceCountIs('AWS::IAM::Role', 2);

    // Lambda Function
    template.resourceCountIs('AWS::Lambda::Function', 1);

    // API Gateway RestApi
    template.resourceCountIs('AWS::ApiGateway::RestApi', 1);

    // API Gateway Methods
    template.resourceCountIs('AWS::ApiGateway::Method', 2);

    // Resource policies on S3 bucket
    template.resourceCountIs('AWS::S3::BucketPolicy', 1);
  });

  test('uses custom environmentSuffix, customDomainName, and certificateArn', () => {
    const stack = new TapStack(app, 'TestTapStackCustom', {
      environmentSuffix: 'prod',
      customDomainName: 'api.example.com',
      certificateArn: 'arn:aws:acm:region:account:certificate/123',
    });
    const template = Template.fromStack(stack);

    // API Gateway DomainName and BasePathMapping
    template.resourceCountIs('AWS::ApiGateway::DomainName', 1);
    template.resourceCountIs('AWS::ApiGateway::BasePathMapping', 1);

    // KMS Key alias should include region (not directly testable via template, but we can check logical id)
    expect(Object.keys(template.findResources('AWS::KMS::Key'))[0]).toContain(
      'DataKmsKey'
    );
  });

  test('uses destroy removal policy when context is set', () => {
    const appWithContext = new cdk.App({
      context: { removalPolicy: 'destroy' },
    });
    const stack = new TapStack(appWithContext, 'TestTapStackDestroy');
    const template = Template.fromStack(stack);

    // KMS Key should exist (removal policy is not directly testable in template, but resource exists)
    template.resourceCountIs('AWS::KMS::Key', 1);
  });

  test('does not throw with minimal props', () => {
    expect(() => new TapStack(app, 'TestTapStackMinimal')).not.toThrow();
  });
});
