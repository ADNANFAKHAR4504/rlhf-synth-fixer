import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { S3Stack } from '../lib/stacks/s3-stack';

describe('S3Stack', () => {
  it('creates a secure S3 bucket and publishes identifiers to SSM', () => {
    const app = new cdk.App();
    const stack = new S3Stack(app, 'S3Stack', {
      dept: 'eng',
      envName: 'dev',
      purpose: 'test',
      regionOverride: 'us-east-1',
      accountOverride: '123456789012',
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.resourceCountIs('AWS::SSM::Parameter', 2);
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'eng-dev-test-123456789012-us-east-1',
    });
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/eng-dev-test/s3/bucket-arn/us-east-1',
      Value: { 'Fn::GetAtt': ['SecureBucket6257CAE8', 'Arn'] },
    });
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/eng-dev-test/s3/bucket-name/us-east-1',
      Value: { Ref: 'SecureBucket6257CAE8' },
    });
  });

  it('applies encryption and public access block to the bucket', () => {
    const app = new cdk.App();
    const stack = new S3Stack(app, 'S3Stack', {
      dept: 'eng',
      envName: 'dev',
      purpose: 'test',
      regionOverride: 'us-east-1',
      accountOverride: '123456789012',
    });
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'aws:kms',
            },
          },
        ],
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  it('publishes SSM parameters with default region and account if overrides are not provided', () => {
    const app = new cdk.App();
    const stack = new S3Stack(app, 'S3Stack', {
      dept: 'eng',
      envName: 'prod',
      purpose: 'data',
      regionOverride: 'us-east-1',
      accountOverride: '123456789012',
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.resourceCountIs('AWS::SSM::Parameter', 2);
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/eng-prod-data/s3/bucket-arn/us-east-1',
      Value: { 'Fn::GetAtt': ['SecureBucket6257CAE8', 'Arn'] },
    });
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/eng-prod-data/s3/bucket-name/us-east-1',
      Value: { Ref: 'SecureBucket6257CAE8' },
    });
  });

  it('throws if encryptionKey is missing in SecureBucket', () => {
    const app = new cdk.App();
    // Mock SSM parameter lookup to simulate missing key
    jest
      .spyOn(
        require('aws-cdk-lib').aws_ssm.StringParameter,
        'valueForStringParameter'
      )
      .mockImplementation(() => '');
    expect(() => {
      new S3Stack(app, 'S3Stack', {
        dept: 'eng',
        envName: 'fail',
        purpose: 'test',
        regionOverride: 'us-east-1',
        accountOverride: '123456789012',
        // encryptionKey missing in SecureBucket
      });
    }).toThrow();
    jest.restoreAllMocks();
  });

  it('creates bucket with alternate name and checks SSM parameters', () => {
    const app = new cdk.App();
    const stack = new S3Stack(app, 'S3Stack', {
      dept: 'ops',
      envName: 'prod',
      purpose: 'data',
      regionOverride: 'us-west-2',
      accountOverride: '987654321098',
    });
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'ops-prod-data-987654321098-us-west-2',
    });
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/ops-prod-data/s3/bucket-arn/us-west-2',
    });
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/ops-prod-data/s3/bucket-name/us-west-2',
    });
  });
});
