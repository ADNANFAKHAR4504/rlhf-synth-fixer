import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

describe('TapStack', () => {
  let app;
  let stack;
  let template;

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      environmentSuffix: 'test'
    });
    template = Template.fromStack(stack);
  });

  test('Stack creates S3 bucket with encryption', () => {
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [{
          ServerSideEncryptionByDefault: {
            SSEAlgorithm: 'aws:kms'
          }
        }]
      }
    });
  });

  test('Stack creates KMS key', () => {
    template.resourceCountIs('AWS::KMS::Key', 1);
    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true
    });
  });

  test('Stack creates CloudWatch dashboard', () => {
    template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
  });

  test('Stack handles LocalStack environment', () => {
    process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';
    
    const localApp = new App();
    const localStack = new TapStack(localApp, 'LocalTestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      environmentSuffix: 'local-test'
    });
    const localTemplate = Template.fromStack(localStack);
    
    // In LocalStack mode, CloudFront resources should not be created
    localTemplate.resourceCountIs('AWS::CloudFront::Distribution', 0);
    
    // But S3 bucket should still be created
    localTemplate.resourceCountIs('AWS::S3::Bucket', 1);
    
    delete process.env.AWS_ENDPOINT_URL;
  });

  test('Stack creates CloudFront distribution in non-LocalStack mode', () => {
    // Ensure we're not in LocalStack mode
    delete process.env.AWS_ENDPOINT_URL;
    
    const prodApp = new App();
    const prodStack = new TapStack(prodApp, 'ProdTestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
      environmentSuffix: 'prod-test'
    });
    const prodTemplate = Template.fromStack(prodStack);
    
    prodTemplate.resourceCountIs('AWS::CloudFront::Distribution', 1);
    prodTemplate.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        ViewerProtocolPolicy: 'redirect-to-https'
      }
    });
  });
});
