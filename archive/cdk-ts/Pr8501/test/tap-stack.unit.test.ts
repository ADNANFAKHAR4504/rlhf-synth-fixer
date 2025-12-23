import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let template: Template;
  let stack: TapStack;

  beforeAll(() => {
    const app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      env: { region: 'us-east-1', account: '123456789012' },
      environmentSuffix: 'test',
    });
    template = Template.fromStack(stack);
  });

  test('S3 bucket is created with correct configuration', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: Match.stringLikeRegexp('tap-test-secure-bucket-.*'),
      VersioningConfiguration: {
        Status: 'Enabled',
      },
    });
  });

  test('S3 bucket has Block Public Access enabled', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('S3 bucket has server-side encryption enabled', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: Match.arrayWith([
          Match.objectLike({
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          }),
        ]),
      },
    });
  });

  test('S3 bucket has lifecycle rules configured', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      LifecycleConfiguration: {
        Rules: Match.arrayWith([
          Match.objectLike({
            Id: 'DeleteIncompleteMultipartUploads',
            Status: 'Enabled',
          }),
        ]),
      },
    });
  });

  test('All resources are tagged appropriately', () => {
    const resources = template.findResources('AWS::S3::Bucket');
    const bucketKey = Object.keys(resources)[0];
    const bucket = resources[bucketKey];

    expect(bucket.Properties.Tags).toContainEqual({
      Key: 'Environment',
      Value: 'Production',
    });
    expect(bucket.Properties.Tags).toContainEqual({
      Key: 'Project',
      Value: 'TAP',
    });
  });

  test('Outputs are defined correctly', () => {
    template.hasOutput('S3BucketName', {});
  });

  test('Stack uses default environment suffix when not provided', () => {
    const app = new cdk.App();
    const stackWithoutSuffix = new TapStack(app, 'TestStackNoSuffix', {
      env: { region: 'us-east-1', account: '123456789012' },
    });
    const templateNoSuffix = Template.fromStack(stackWithoutSuffix);

    // Check that the bucket name includes 'dev' as default
    templateNoSuffix.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: Match.stringLikeRegexp('tap-dev-secure-bucket-.*'),
    });
  });

  test('Stack is LocalStack compatible', () => {
    // Verify no EC2 resources (not supported in LocalStack Community)
    const resources = template.toJSON().Resources;
    const ec2Resources = Object.values(resources).filter(
      (resource: any) =>
        resource.Type?.startsWith('AWS::EC2::') &&
        !resource.Type.includes('VPCEndpoint')
    );
    expect(ec2Resources.length).toBe(0);

    // Verify S3 bucket exists
    template.resourceCountIs('AWS::S3::Bucket', 1);
  });

  test('Stack outputs LocalStack compatibility flag when AWS_ENDPOINT_URL is set', () => {
    // Simulate LocalStack environment
    const originalEndpoint = process.env.AWS_ENDPOINT_URL;
    process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';

    const app = new cdk.App();
    const localstackStack = new TapStack(app, 'TestLocalStackStack', {
      env: { region: 'us-east-1', account: '123456789012' },
      environmentSuffix: 'test',
    });
    const localstackTemplate = Template.fromStack(localstackStack);

    // Verify LocalStack compatibility output exists
    localstackTemplate.hasOutput('LocalStackCompatibility', {
      Value: 'true',
    });

    // Restore original environment
    if (originalEndpoint) {
      process.env.AWS_ENDPOINT_URL = originalEndpoint;
    } else {
      delete process.env.AWS_ENDPOINT_URL;
    }
  });
});
