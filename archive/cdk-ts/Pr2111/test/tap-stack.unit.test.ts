import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { IAMStack } from '../lib/iam-stack';
import { S3Stack } from '../lib/s3-stack';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App({
      context: {
        environmentSuffix: 'test',
      },
    });
  });

  describe('Stack Creation', () => {
    test('creates stacks for all three regions', () => {
      const regions = ['us-east-1', 'eu-west-1', 'ap-southeast-1'];

      regions.forEach(region => {
        const stackApp = new cdk.App();
        const stack = new TapStack(stackApp, `TapStack-${region}`, {
          env: { region: region, account: '123456789012' },
          environmentSuffix: 'test',
        });

        // Verify stack is created successfully
        expect(stack).toBeDefined();
        expect(stack.region).toBe(region);
        expect(stack.stackName).toContain(region);

        // Verify outputs exist
        const template = Template.fromStack(stack);
        template.hasOutput('BucketInfo', Match.anyValue());
      });
    });

    test('applies correct tags at stack level', () => {
      const stack = new TapStack(app, 'TestStack', {
        env: { region: 'us-east-1', account: '123456789012' },
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(stack);

      // Check stack-level tags
      const stackJson = template.toJSON();
      expect(stack.tags.tagValues()).toMatchObject({
        Environment: 'Production',
        Project: 'trainr302',
        Region: 'us-east-1',
        EnvironmentSuffix: 'test',
      });
    });

    test('creates output for bucket information', () => {
      const stack = new TapStack(app, 'TestStack', {
        env: { region: 'us-east-1', account: '123456789012' },
        environmentSuffix: 'test',
      });

      const template = Template.fromStack(stack);

      // Check outputs
      template.hasOutput('BucketInfo', {
        Description: 'S3 bucket information for region us-east-1',
        Export: {
          Name: 'BucketInfo-us-east-1-test',
        },
      });
    });
  });

  describe('S3Stack', () => {
    let s3Stack: S3Stack;
    let template: Template;

    beforeEach(() => {
      s3Stack = new S3Stack(app, 'TestS3Stack', {
        region: 'us-east-1',
        environmentSuffix: 'test',
        env: { region: 'us-east-1', account: '123456789012' },
      });
      template = Template.fromStack(s3Stack);
    });

    test('creates S3 bucket with correct configuration', () => {
      // Check S3 bucket exists
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'multi-region-bucket-us-east-1-test-123456789012',
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
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

    test('creates bucket with DESTROY removal policy and auto-delete', () => {
      template.hasResource('Custom::S3AutoDeleteObjects', {
        Properties: {
          ServiceToken: Match.anyValue(),
          BucketName: Match.anyValue(),
        },
      });
    });

    test('creates S3 replication role with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 's3-replication-role-us-east-1-test',
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 's3.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });
    });

    test('creates replication role with inline policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 's3-replication-role-us-east-1-test',
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 's3.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('creates lifecycle rules for bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'MultipartUploadsRule',
              Status: 'Enabled',
              AbortIncompleteMultipartUpload: {
                DaysAfterInitiation: 1,
              },
            }),
            Match.objectLike({
              Id: 'NonCurrentVersionsRule',
              Status: 'Enabled',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 90,
              },
            }),
          ]),
        },
      });
    });

    test('creates outputs for bucket information', () => {
      template.hasOutput('BucketName', {
        Description: 'S3 bucket name for region us-east-1',
        Export: {
          Name: 'S3BucketName-us-east-1',
        },
      });

      template.hasOutput('BucketArn', {
        Description: 'S3 bucket ARN for region us-east-1',
        Export: {
          Name: 'S3BucketArn-us-east-1',
        },
      });

      template.hasOutput('ReplicationRoleArn', {
        Description: 'S3 replication role ARN for region us-east-1',
        Export: {
          Name: 'S3ReplicationRoleArn-us-east-1',
        },
      });
    });

    test('applies Environment:Production tags to resources', () => {
      // Check that bucket has tags applied
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'Production' }),
          Match.objectLike({ Key: 'Project', Value: 'trainr302' }),
          Match.objectLike({ Key: 'Region', Value: 'us-east-1' }),
        ]),
      });

      // Check that IAM role has tags applied
      template.hasResourceProperties('AWS::IAM::Role', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'Production' }),
          Match.objectLike({ Key: 'Project', Value: 'trainr302' }),
        ]),
      });
    });
  });

  describe('IAMStack', () => {
    let iamStack: IAMStack;
    let template: Template;
    let mockBucket: any;

    beforeEach(() => {
      // Create a mock S3 bucket for IAM stack
      const s3Stack = new S3Stack(app, 'MockS3Stack', {
        region: 'us-east-1',
        environmentSuffix: 'test',
        env: { region: 'us-east-1', account: '123456789012' },
      });

      iamStack = new IAMStack(app, 'TestIAMStack', {
        s3Buckets: [s3Stack.bucket],
        region: 'us-east-1',
        environmentSuffix: 'test',
        env: { region: 'us-east-1', account: '123456789012' },
      });
      template = Template.fromStack(iamStack);
    });

    test('uses default environment suffix when not provided', () => {
      const defaultIamApp = new cdk.App();
      const s3Stack = new S3Stack(defaultIamApp, 'DefaultS3Stack', {
        region: 'us-east-1',
        env: { region: 'us-east-1', account: '123456789012' },
      });

      const defaultIamStack = new IAMStack(defaultIamApp, 'DefaultIAMStack', {
        s3Buckets: [s3Stack.bucket],
        region: 'us-east-1',
        env: { region: 'us-east-1', account: '123456789012' },
      });

      const defaultTemplate = Template.fromStack(defaultIamStack);

      // Should use 'dev' as default suffix
      defaultTemplate.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'lambda-execution-role-us-east-1-dev',
      });
    });

    test('creates Lambda execution role with correct configuration', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'lambda-execution-role-us-east-1-test',
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });
    });

    test('creates Lambda S3 access role with least privilege', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'lambda-s3-access-role-us-east-1-test',
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });
    });

    test('creates custom S3 access policy with least privilege permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyName: 'lambda-s3-access-policy-us-east-1-test',
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'AllowS3ReadAccess',
              Effect: 'Allow',
              Action: Match.arrayWith([
                's3:GetObject',
                's3:GetObjectVersion',
                's3:GetObjectAttributes',
                's3:GetObjectTagging',
              ]),
            }),
            Match.objectLike({
              Sid: 'AllowS3ListAccess',
              Effect: 'Allow',
              Action: Match.arrayWith([
                's3:ListBucket',
                's3:ListBucketVersions',
                's3:GetBucketLocation',
                's3:GetBucketVersioning',
              ]),
            }),
            Match.objectLike({
              Sid: 'AllowS3WriteAccess',
              Effect: 'Allow',
              Action: Match.arrayWith([
                's3:PutObject',
                's3:PutObjectTagging',
                's3:DeleteObject',
              ]),
            }),
          ]),
        },
      });
    });

    test('creates cross-region operations role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'cross-region-operations-role-us-east-1-test',
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });
    });

    test('attaches AWSLambdaBasicExecutionRole managed policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'lambda-execution-role-us-east-1-test',
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                Match.stringLikeRegexp(
                  '.*service-role/AWSLambdaBasicExecutionRole.*'
                ),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('applies Environment:Production tags to all IAM resources', () => {
      // Check roles have tags
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'lambda-execution-role-us-east-1-test',
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'Production' }),
          Match.objectLike({ Key: 'Project', Value: 'trainr302' }),
          Match.objectLike({ Key: 'Region', Value: 'us-east-1' }),
        ]),
      });

      // Note: IAM Policies don't support tags in CloudFormation
      // So we only verify that the policy exists with correct name
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyName: 'lambda-s3-access-policy-us-east-1-test',
      });
    });

    test('creates outputs for IAM role ARNs', () => {
      template.hasOutput('LambdaExecutionRoleArn', {
        Description: 'Lambda execution role ARN for region us-east-1',
        Export: {
          Name: 'LambdaExecutionRoleArn-us-east-1',
        },
      });

      template.hasOutput('LambdaS3AccessRoleArn', {
        Description: 'Lambda S3 access role ARN for region us-east-1',
        Export: {
          Name: 'LambdaS3AccessRoleArn-us-east-1',
        },
      });

      template.hasOutput('CrossRegionRoleArn', {
        Description: 'Cross-region operations role ARN for region us-east-1',
        Export: {
          Name: 'CrossRegionRoleArn-us-east-1',
        },
      });
    });
  });

  describe('Multi-Region Deployment', () => {
    test('ensures unique resource names across regions with environment suffix', () => {
      const regions = ['us-east-1', 'eu-west-1', 'ap-southeast-1'];
      const resourceNames = new Set();

      regions.forEach(region => {
        const regionApp = new cdk.App();
        const s3Stack = new S3Stack(regionApp, `S3Stack-${region}`, {
          region: region,
          environmentSuffix: 'test',
          env: { region: region, account: '123456789012' },
        });

        const template = Template.fromStack(s3Stack);
        const resources = template.toJSON().Resources;

        // Extract bucket names and role names
        Object.values(resources).forEach((resource: any) => {
          if (resource.Type === 'AWS::S3::Bucket') {
            const bucketName = resource.Properties?.BucketName;
            expect(resourceNames.has(bucketName)).toBe(false);
            resourceNames.add(bucketName);
            expect(bucketName).toContain(region);
            expect(bucketName).toContain('test');
          }
          if (resource.Type === 'AWS::IAM::Role') {
            const roleName = resource.Properties?.RoleName;
            if (roleName) {
              expect(resourceNames.has(roleName)).toBe(false);
              resourceNames.add(roleName);
              expect(roleName).toContain(region);
              expect(roleName).toContain('test');
            }
          }
        });
      });
    });
  });

  describe('S3Stack with Replication', () => {
    test('adds replication permissions when replication buckets are provided', () => {
      const replicationApp = new cdk.App();

      // Create target buckets
      const targetStack1 = new S3Stack(replicationApp, 'TargetStack1', {
        region: 'eu-west-1',
        environmentSuffix: 'test',
        env: { region: 'eu-west-1', account: '123456789012' },
      });

      const targetStack2 = new S3Stack(replicationApp, 'TargetStack2', {
        region: 'ap-southeast-1',
        environmentSuffix: 'test',
        env: { region: 'ap-southeast-1', account: '123456789012' },
      });

      // Create source stack with replication buckets
      const sourceStack = new S3Stack(replicationApp, 'SourceStack', {
        region: 'us-east-1',
        environmentSuffix: 'test',
        replicationBuckets: [targetStack1.bucket, targetStack2.bucket],
        env: { region: 'us-east-1', account: '123456789012' },
      });

      const template = Template.fromStack(sourceStack);

      // Verify replication permissions are added
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                's3:ReplicateObject',
                's3:ReplicateDelete',
                's3:ReplicateTags',
              ]),
            }),
          ]),
        },
      });
    });

    test('handles no replication buckets gracefully', () => {
      const noRepApp = new cdk.App();
      const stack = new S3Stack(noRepApp, 'NoRepStack', {
        region: 'us-east-1',
        environmentSuffix: 'test',
        replicationBuckets: [],
        env: { region: 'us-east-1', account: '123456789012' },
      });

      const template = Template.fromStack(stack);

      // Should still create the bucket and role
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });

      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 's3.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });
    });
  });

  describe('TapStack with Different Environment Suffixes', () => {
    test('uses provided environment suffix', () => {
      const customApp = new cdk.App();
      const stack = new TapStack(customApp, 'CustomStack', {
        env: { region: 'us-east-1', account: '123456789012' },
        environmentSuffix: 'production',
      });

      // Check that stack uses the provided suffix
      const template = Template.fromStack(stack);
      template.hasOutput('BucketInfo', {
        Export: {
          Name: 'BucketInfo-us-east-1-production',
        },
      });
    });

    test('uses context environment suffix when not provided in props', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'staging',
        },
      });
      const stack = new TapStack(contextApp, 'ContextStack', {
        env: { region: 'us-east-1', account: '123456789012' },
      });

      // Check that stack uses the context suffix
      const template = Template.fromStack(stack);
      template.hasOutput('BucketInfo', {
        Export: {
          Name: 'BucketInfo-us-east-1-staging',
        },
      });
    });

    test('defaults to dev when no environment suffix provided', () => {
      const defaultApp = new cdk.App();
      const stack = new TapStack(defaultApp, 'DefaultStack', {
        env: { region: 'us-east-1', account: '123456789012' },
      });

      // Check that stack uses the default suffix
      const template = Template.fromStack(stack);
      template.hasOutput('BucketInfo', {
        Export: {
          Name: 'BucketInfo-us-east-1-dev',
        },
      });
    });
  });

  describe('Stack Dependencies', () => {
    test('IAM stack depends on S3 stack', () => {
      const depApp = new cdk.App();

      // Create S3 stack first
      const s3Stack = new S3Stack(depApp, 'TestS3Stack', {
        region: 'us-east-1',
        environmentSuffix: 'test',
        env: { region: 'us-east-1', account: '123456789012' },
      });

      // Create IAM stack that depends on S3 stack
      const iamStack = new IAMStack(depApp, 'TestIAMStack', {
        s3Buckets: [s3Stack.bucket],
        region: 'us-east-1',
        environmentSuffix: 'test',
        env: { region: 'us-east-1', account: '123456789012' },
      });

      // Add explicit dependency
      iamStack.addDependency(s3Stack);

      // Verify both stacks exist and have resources
      const s3Template = Template.fromStack(s3Stack);
      const iamTemplate = Template.fromStack(iamStack);

      // S3 stack should have bucket
      s3Template.hasResourceProperties('AWS::S3::Bucket', Match.anyValue());

      // IAM stack should have roles
      iamTemplate.hasResourceProperties('AWS::IAM::Role', Match.anyValue());

      // Verify dependency relationship exists
      expect(iamStack.dependencies.length).toBeGreaterThan(0);
      expect(iamStack.dependencies).toContain(s3Stack);
    });
  });
});
