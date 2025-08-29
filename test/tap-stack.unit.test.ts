import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack, TapStackProps } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();

    // Use TapStackProps interface with environmentSuffix
    const stackProps: TapStackProps = {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      environmentSuffix: 'test',
    };

    stack = new TapStack(app, 'TestTapStack', stackProps);
    template = Template.fromStack(stack);
  });

  test('Creates S3 bucket with correct configuration and environment suffix', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'tap-secure-bucket-test-123456789012-us-east-1',
      VersioningConfiguration: {
        Status: 'Enabled',
      },
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

  test('Does not create problematic bucket policy that conflicts with BlockPublicAccess', () => {
    // Ensure no bucket policy is created that would conflict with BlockPublicAccess
    const bucketPolicies = template.findResources('AWS::S3::BucketPolicy');

    // If bucket policies exist, they should only be for CloudFront OAC access
    Object.values(bucketPolicies).forEach((policy: any) => {
      const policyDocument = policy.Properties.PolicyDocument;
      const statements = policyDocument.Statement;

      statements.forEach((statement: any) => {
        // Ensure no wildcard principals that could be considered public
        if (statement.Principal === '*') {
          throw new Error(
            'Found wildcard principal in bucket policy - this conflicts with BlockPublicAccess'
          );
        }

        // If CloudFront service principal exists, ensure it has proper conditions
        if (statement.Principal?.Service === 'cloudfront.amazonaws.com') {
          expect(statement.Condition).toBeDefined();
          expect(statement.Condition.StringEquals).toBeDefined();
          expect(
            statement.Condition.StringEquals['AWS:SourceArn']
          ).toBeDefined();
        }
      });
    });
  });

  test('Creates KMS key with key rotation enabled and environment suffix in description', () => {
    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
      Description: 'KMS key for S3 bucket encryption - test',
    });
  });

  test('Creates Lambda function with proper IAM permissions instead of bucket policy', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'python3.9',
      Handler: 'index.handler',
      Description: 'TAP Lambda function triggered by S3 events - test',
      VpcConfig: {
        SubnetIds: Match.anyValue(),
        SecurityGroupIds: Match.anyValue(),
      },
    });

    // Check that Lambda role has proper S3 permissions via IAM policy, not bucket policy
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:PutObject',
              's3:DeleteObject',
              's3:ListBucket',
              's3:GetObjectVersion',
              's3:DeleteObjectVersion',
            ],
            Resource: Match.anyValue(),
          },
        ]),
      },
    });
  });

  test('Creates CloudFront distribution with Origin Access Control', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Comment:
          'TAP CloudFront distribution for secure content delivery - test',
        DefaultCacheBehavior: {
          ViewerProtocolPolicy: 'redirect-to-https',
          AllowedMethods: ['GET', 'HEAD'],
          CachedMethods: ['GET', 'HEAD'],
        },
        Enabled: true,
        IPV6Enabled: true,
      },
    });

    // Check for Origin Access Control
    template.hasResourceProperties('AWS::CloudFront::OriginAccessControl', {
      OriginAccessControlConfig: {
        Description: 'Origin Access Control for TAP S3 bucket - test',
      },
    });
  });

  test('Lambda has permission to be invoked by S3', () => {
    template.hasResourceProperties('AWS::Lambda::Permission', {
      Action: 'lambda:InvokeFunction',
      Principal: 's3.amazonaws.com',
    });
  });

  test('S3 bucket notification is configured correctly', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      NotificationConfiguration: {
        LambdaConfigurations: [
          {
            Event: 's3:ObjectCreated:*',
            Function: Match.anyValue(),
          },
        ],
      },
    });
  });

  test('IAM role has necessary permissions for Lambda execution', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      },
      ManagedPolicyArns: [
        {
          'Fn::Join': [
            '',
            [
              'arn:',
              { Ref: 'AWS::Partition' },
              ':iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
            ],
          ],
        },
      ],
    });
  });

  test('All outputs are present with correct environment suffix', () => {
    const outputs = template.findOutputs('*');

    expect(outputs).toHaveProperty('S3BucketArn');
    expect(outputs).toHaveProperty('LambdaFunctionArn');
    expect(outputs).toHaveProperty('LambdaRoleArn');
    expect(outputs).toHaveProperty('KmsKeyArn');
    expect(outputs).toHaveProperty('CloudFrontDistributionArn');
    expect(outputs).toHaveProperty('VpcId');
    expect(outputs).toHaveProperty('EnvironmentSuffix');

    // Check export names include environment suffix
    expect(outputs['S3BucketArn'].Export?.Name).toBe('TapS3BucketArn-test');
    expect(outputs['EnvironmentSuffix'].Export?.Name).toBe(
      'TapEnvironmentSuffix-test'
    );
  });
});
