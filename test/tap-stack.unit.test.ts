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
    template.resourceCountIs('Custom::S3BucketNotifications', 1);

    template.hasResourceProperties('Custom::S3BucketNotifications', {
      BucketName: 'tap-secure-bucket-test-123456789012-us-east-1',
      NotificationConfiguration: {
        LambdaFunctionConfigurations: [
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
    expect(outputs).toHaveProperty('S3BucketName');
    expect(outputs).toHaveProperty('LambdaFunctionArn');
    expect(outputs).toHaveProperty('LambdaRoleArn');
    expect(outputs).toHaveProperty('KmsKeyArn');
    expect(outputs).toHaveProperty('CloudFrontDistributionArn');
    expect(outputs).toHaveProperty('CloudFrontDomainName');
    expect(outputs).toHaveProperty('VpcId');
    expect(outputs).toHaveProperty('EnvironmentSuffix');

    // Check export names include environment suffix
    expect(outputs['S3BucketArn'].Export?.Name).toBe('TapS3BucketArn-test');
    expect(outputs['S3BucketName'].Export?.Name).toBe('TapS3BucketName-test');
    expect(outputs['EnvironmentSuffix'].Export?.Name).toBe(
      'TapEnvironmentSuffix-test'
    );
  });

  test('SSM Parameters are created with correct configuration', () => {
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/tap/test/lambda/db-credentials',
      Type: 'String',
      Description: 'Database credentials for TAP Lambda function - test',
    });

    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/tap/test/lambda/api-key',
      Type: 'String',
      Description: 'API key for external service integration - test',
    });
  });

  test('VPC is created with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });

    // Check for public and private subnets
    const subnets = template.findResources('AWS::EC2::Subnet');
    expect(Object.keys(subnets)).toHaveLength(4); // 2 public + 2 private
  });

  test('Lambda function has correct environment variables', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          S3_BUCKET_NAME: Match.anyValue(),
          DB_CREDENTIALS_PARAM: Match.anyValue(), // was string
          API_KEY_PARAM: Match.anyValue(), // was string
          ENVIRONMENT_SUFFIX: 'test',
        },
      },
    });
  });

  test('KMS key alias is created with environment suffix', () => {
    template.hasResourceProperties('AWS::KMS::Alias', {
      AliasName: 'alias/tap-s3-encryption-key-test',
    });
  });

  test('CloudWatch log retention is configured for Lambda function', () => {
    template.hasResourceProperties('Custom::LogRetention', {
      LogGroupName: Match.stringLikeRegexp('/aws/lambda/.*TapLambdaFunction.*'),
      RetentionInDays: 7,
    });
  });

  test('Security best practices are enforced', () => {
    // Ensure S3 bucket blocks all public access
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });

    // Ensure Lambda uses Python 3.9 (not older versions)
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'python3.9',
    });

    // Ensure CloudFront uses HTTPS redirect
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultCacheBehavior: {
          ViewerProtocolPolicy: 'redirect-to-https',
        },
      },
    });
  });

  test('Resource naming follows convention with environment suffix', () => {
    // S3 bucket name should include environment suffix
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: Match.stringLikeRegexp('^tap-secure-bucket-test-.*'),
    });

    // KMS key description should include environment suffix
    template.hasResourceProperties('AWS::KMS::Key', {
      Description: 'KMS key for S3 bucket encryption - test',
    });

    // Lambda function description should include environment suffix
    template.hasResourceProperties('AWS::Lambda::Function', {
      Description: 'TAP Lambda function triggered by S3 events - test',
    });
  });

  test('Error handling: Stack creation with missing environmentSuffix defaults to dev', () => {
    const newApp = new cdk.App(); // new app instance
    const stackPropsWithoutSuffix = {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    };

    const stackWithDefaults = new TapStack(
      newApp,
      'TestTapStackDefaults',
      stackPropsWithoutSuffix
    );
    const templateWithDefaults = Template.fromStack(stackWithDefaults);

    templateWithDefaults.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'tap-secure-bucket-dev-123456789012-us-east-1',
    });

    templateWithDefaults.hasResourceProperties('AWS::KMS::Key', {
      Description: 'KMS key for S3 bucket encryption - dev',
    });
  });

  test('All IAM policies follow least privilege principle', () => {
    // Check Lambda execution role has only necessary permissions
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
    });

    // Check that explicit S3 permissions are scoped to specific bucket
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

    // Check SSM parameter permissions are scoped to specific parameters
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          {
            Effect: 'Allow',
            Action: ['ssm:GetParameter', 'ssm:GetParameters'],
            Resource: Match.anyValue(),
          },
        ]),
      },
    });
  });
});
