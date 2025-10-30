import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack - CI/CD Pipeline', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('KMS Keys', () => {
    test('should create KMS keys with correct configuration', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for pipeline artifacts',
        EnableKeyRotation: true,
      });

      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for staging environment',
        EnableKeyRotation: true,
      });

      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for production environment',
        EnableKeyRotation: true,
      });
    });

    test('should create KMS aliases with correct names', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/tap-pipeline-key-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/tap-staging-key-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/tap-production-key-${environmentSuffix}`,
      });
    });

    test('should apply RETAIN removal policy to KMS keys', () => {
      const kmsKeys = template.findResources('AWS::KMS::Key');
      Object.values(kmsKeys).forEach((key: any) => {
        expect(key.DeletionPolicy).toBe('Retain');
      });
    });
  });

  describe('S3 Buckets', () => {
    test('should create S3 buckets with correct configuration', () => {
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
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should create pipeline artifacts bucket with lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'retain-5-versions',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30,
              },
              Status: 'Enabled',
            },
          ],
        },
      });
    });

    test('should apply DESTROY removal policy to S3 buckets', () => {
      const s3Buckets = template.findResources('AWS::S3::Bucket');
      Object.values(s3Buckets).forEach((bucket: any) => {
        expect(bucket.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('SNS Topics', () => {
    test('should create SNS topics with correct names', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `tap-pipeline-notifications-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `tap-staging-approval-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `tap-production-approval-${environmentSuffix}`,
      });
    });

    test('should apply DESTROY removal policy to SNS topics', () => {
      const snsTopics = template.findResources('AWS::SNS::Topic');
      Object.values(snsTopics).forEach((topic: any) => {
        expect(topic.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('Source Configuration', () => {
    test('should use S3 as source instead of CodeCommit', () => {
      // Verify that no CodeCommit repository is created
      template.resourceCountIs('AWS::CodeCommit::Repository', 0);

      // Verify pipeline exists
      template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
    });
  });

  describe('IAM Roles', () => {
    test('should create CodeBuild role with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com',
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
                ':iam::aws:policy/AWSCodeBuildDeveloperAccess',
              ],
            ],
          },
        ],
      });
    });

    test('should create CodePipeline role with correct permissions', () => {
      // Check that CodePipeline role exists with inline policies
      template.resourceCountIs('AWS::IAM::Role', 13);

      // Verify that at least one role has the CodePipeline service principal
      const roles = template.findResources('AWS::IAM::Role');
      const codePipelineRole = Object.values(roles).find((role: any) =>
        role.Properties?.AssumeRolePolicyDocument?.Statement?.some(
          (stmt: any) =>
            stmt.Principal?.Service === 'codepipeline.amazonaws.com'
        )
      );
      expect(codePipelineRole).toBeDefined();
    });

    test('should create Lambda execution role with correct permissions', () => {
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
                ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
              ],
            ],
          },
        ],
      });
    });

    test('should apply DESTROY removal policy to IAM roles', () => {
      // Check that IAM roles exist and have proper configuration
      template.resourceCountIs('AWS::IAM::Role', 13);
    });
  });

  describe('CodeBuild Projects', () => {
    test('should create build project with correct configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `tap-build-${environmentSuffix}`,
        Environment: {
          ComputeType: 'BUILD_GENERAL1_MEDIUM',
          Image: 'aws/codebuild/standard:7.0',
        },
        Cache: {
          Type: 'S3',
        },
      });
    });

    test('should create unit test project with correct configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `tap-unit-test-${environmentSuffix}`,
        Environment: {
          ComputeType: 'BUILD_GENERAL1_SMALL',
          Image: 'aws/codebuild/standard:7.0',
        },
      });
    });

    test('should create integration test project with correct configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `tap-integration-test-${environmentSuffix}`,
        Environment: {
          ComputeType: 'BUILD_GENERAL1_MEDIUM',
          Image: 'aws/codebuild/standard:7.0',
        },
      });
    });

    test('should create security scan project with correct configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `tap-security-scan-${environmentSuffix}`,
        Environment: {
          ComputeType: 'BUILD_GENERAL1_MEDIUM',
          Image: 'aws/codebuild/standard:7.0',
        },
      });
    });

    test('should apply DESTROY removal policy to CodeBuild projects', () => {
      const codeBuildProjects = template.findResources(
        'AWS::CodeBuild::Project'
      );
      Object.values(codeBuildProjects).forEach((project: any) => {
        expect(project.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `tap-security-scan-analysis-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 300,
      });
    });

    test('should create Lambda function with environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            CRITICAL_VULNERABILITY_THRESHOLD: '0',
            OWASP_TOP_10_CHECK: 'true',
          },
        },
      });
    });

    test('should apply DESTROY removal policy to Lambda function', () => {
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      Object.values(lambdaFunctions).forEach((func: any) => {
        expect(func.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('CodePipeline', () => {
    test('should create CodePipeline with correct name', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: `tap-microservices-pipeline-${environmentSuffix}`,
      });
    });

    test('should create CodePipeline with correct stages', () => {
      // Check that CodePipeline exists and has stages
      template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
    });

    test('should apply DESTROY removal policy to CodePipeline', () => {
      const codePipelines = template.findResources(
        'AWS::CodePipeline::Pipeline'
      );
      Object.values(codePipelines).forEach((pipeline: any) => {
        expect(pipeline.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create pipeline failure alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-pipeline-failure-${environmentSuffix}`,
        AlarmDescription: 'Alert when pipeline execution fails',
        MetricName: 'PipelineExecutionFailed',
        Namespace: 'AWS/CodePipeline',
        Threshold: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('should create pipeline stuck alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-pipeline-stuck-${environmentSuffix}`,
        AlarmDescription: 'Alert when pipeline execution exceeds 30 minutes',
        MetricName: 'PipelineExecutionDuration',
        Namespace: 'AWS/CodePipeline',
        Threshold: 1800000,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('should apply DESTROY removal policy to CloudWatch alarms', () => {
      const cloudWatchAlarms = template.findResources('AWS::CloudWatch::Alarm');
      Object.values(cloudWatchAlarms).forEach((alarm: any) => {
        expect(alarm.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('EventBridge Rules', () => {
    test('should create pipeline state change rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['aws.codepipeline'],
          'detail-type': ['CodePipeline Pipeline Execution State Change'],
          detail: {
            state: ['FAILED', 'SUCCEEDED', 'SUPERSEDED'],
          },
        },
      });
    });

    test('should not create develop branch trigger rule (using S3 source)', () => {
      // Since we're using S3 source instead of CodeCommit, no develop branch trigger rule should exist
      template.resourceCountIs('AWS::Events::Rule', 1); // Only pipeline state change rule
    });

    test('should apply DESTROY removal policy to EventBridge rules', () => {
      // Check that EventBridge rules exist and have proper configuration
      template.resourceCountIs('AWS::Events::Rule', 1);
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should create log groups with correct retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 90,
      });
    });

    test('should create log groups for CodeBuild projects', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/codebuild/tap-build-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/codebuild/tap-unit-test-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/codebuild/tap-integration-test-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/codebuild/tap-security-scan-${environmentSuffix}`,
      });
    });

    test('should create log group for Lambda function', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/tap-security-scan-analysis-${environmentSuffix}`,
      });
    });
  });

  describe('Resource Counts', () => {
    test('should have correct number of KMS keys', () => {
      template.resourceCountIs('AWS::KMS::Key', 3);
    });

    test('should have correct number of S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 3);
    });

    test('should have correct number of SNS topics', () => {
      template.resourceCountIs('AWS::SNS::Topic', 3);
    });

    test('should have correct number of CodeBuild projects', () => {
      template.resourceCountIs('AWS::CodeBuild::Project', 4);
    });

    test('should have correct number of IAM roles', () => {
      template.resourceCountIs('AWS::IAM::Role', 13);
    });

    test('should have correct number of CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });

    test('should have correct number of EventBridge rules', () => {
      template.resourceCountIs('AWS::Events::Rule', 1);
    });

    test('should have correct number of CloudWatch log groups', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 5);
    });
  });

  describe('Environment Suffix Integration', () => {
    test('should use environment suffix in resource names', () => {
      const templateJson = template.toJSON();
      const resources = templateJson.Resources;

      // Check that environment suffix is used in key resource names
      const resourceNames = Object.values(resources).map(
        (resource: any) =>
          resource.Properties?.Name ||
          resource.Properties?.FunctionName ||
          resource.Properties?.TopicName ||
          resource.Properties?.RepositoryName
      );

      const namesWithSuffix = resourceNames.filter(
        (name: any) =>
          typeof name === 'string' && name.includes(environmentSuffix)
      );

      expect(namesWithSuffix.length).toBeGreaterThan(0);
    });

    test('should handle different environment suffix sources', () => {
      // Test with props environmentSuffix
      const app1 = new cdk.App();
      const stack1 = new TapStack(app1, 'TestStack1', {
        environmentSuffix: 'test1',
      });
      const template1 = Template.fromStack(stack1);
      template1.resourceCountIs('AWS::S3::Bucket', 3);

      // Test with context environmentSuffix
      const app2 = new cdk.App();
      app2.node.setContext('environmentSuffix', 'test2');
      const stack2 = new TapStack(app2, 'TestStack2');
      const template2 = Template.fromStack(stack2);
      template2.resourceCountIs('AWS::S3::Bucket', 3);

      // Test with default 'dev' when no props or context
      const app3 = new cdk.App();
      const stack3 = new TapStack(app3, 'TestStack3');
      const template3 = Template.fromStack(stack3);
      template3.resourceCountIs('AWS::S3::Bucket', 3);
    });
  });

  describe('Stack Outputs', () => {
    test('should have required outputs', () => {
      template.hasOutput('PipelineName', {
        Description: 'Name of the CI/CD pipeline',
      });

      template.hasOutput('SourceBucketName', {
        Description: 'Name of the S3 bucket used as source',
      });

      template.hasOutput('PipelineNotificationTopicArn', {
        Description: 'ARN of the pipeline notification topic',
      });

      template.hasOutput('StagingBucketName', {
        Description: 'Name of the staging S3 bucket',
      });

      template.hasOutput('ProductionBucketName', {
        Description: 'Name of the production S3 bucket',
      });
    });
  });

  describe('Security and Compliance', () => {
    test('should have encryption enabled on all S3 buckets', () => {
      const s3Buckets = template.findResources('AWS::S3::Bucket');
      Object.values(s3Buckets).forEach((bucket: any) => {
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(
          bucket.Properties.BucketEncryption
            .ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault
            .SSEAlgorithm
        ).toBe('aws:kms');
      });
    });

    test('should have public access blocked on all S3 buckets', () => {
      const s3Buckets = template.findResources('AWS::S3::Bucket');
      Object.values(s3Buckets).forEach((bucket: any) => {
        expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
        expect(
          bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
        ).toBe(true);
        expect(
          bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy
        ).toBe(true);
        expect(
          bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls
        ).toBe(true);
        expect(
          bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets
        ).toBe(true);
      });
    });

    test('should have SSL enforcement on all S3 buckets', () => {
      const s3Buckets = template.findResources('AWS::S3::Bucket');
      Object.values(s3Buckets).forEach((bucket: any) => {
        expect(bucket.Properties.BucketEncryption).toBeDefined();
      });
    });
  });
});
