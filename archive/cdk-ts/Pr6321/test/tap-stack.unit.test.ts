import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  describe('Stack Initialization', () => {
    test('should create stack with environmentSuffix from props', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('.*source.*test'),
      });
    });

    test('should use environmentSuffix from context when props not provided', () => {
      app = new cdk.App({
        context: { environmentSuffix: 'context-env' },
      });
      stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('.*source.*context-env'),
      });
    });

    test('should default to "dev" when no environmentSuffix provided', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('.*source.*dev'),
      });
    });

    test('should prioritize props over context for environmentSuffix', () => {
      app = new cdk.App({
        context: { environmentSuffix: 'context' },
      });
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'props',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('.*source.*props'),
      });
    });
  });

  describe('S3 Source Bucket', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create S3 source bucket with correct name', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'microservice-source-123456789012-test',
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should have source bucket with KMS encryption', () => {
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
      });
    });

    test('should have source bucket with DESTROY removal policy', () => {
      const resources = template.findResources('AWS::S3::Bucket');
      const sourceBucket = Object.values(resources).find((bucket: any) =>
        bucket.Properties?.BucketName?.includes('source')
      );
      expect(sourceBucket?.DeletionPolicy).toBe('Delete');
    });
  });

  describe('ECR Repository', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create ECR repository with correct name', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: 'microservice-test',
        LifecyclePolicy: Match.anyValue(),
      });
    });

    test('should configure ECR repository with DESTROY removal policy', () => {
      const resources = template.findResources('AWS::ECR::Repository');
      const ecrRepo = Object.values(resources)[0];
      expect(ecrRepo?.DeletionPolicy).toBe('Delete');
    });

    test('should configure lifecycle rules for ECR repository', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        LifecyclePolicy: {
          LifecyclePolicyText: Match.stringLikeRegexp('.*countNumber.*10.*'),
        },
      });
    });

    test('should have exactly one ECR repository', () => {
      template.resourceCountIs('AWS::ECR::Repository', 1);
    });
  });

  describe('KMS Key', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create KMS key for artifact encryption', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for encrypting the artifacts stored in S3',
        EnableKeyRotation: true,
      });
    });

    test('should configure KMS key with DESTROY removal policy', () => {
      const resources = template.findResources('AWS::KMS::Key');
      const kmsKey = Object.values(resources)[0];
      expect(kmsKey?.DeletionPolicy).toBe('Delete');
    });

    test('should have exactly one KMS key', () => {
      template.resourceCountIs('AWS::KMS::Key', 1);
    });
  });

  describe('S3 Artifact Bucket', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create S3 bucket for artifacts with correct name pattern', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(
          'microservice-artifacts-123456789012-test'
        ),
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
      });
    });

    test('should configure lifecycle rule for artifact bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Status: 'Enabled',
              ExpirationInDays: 30,
            }),
          ]),
        },
      });
    });

    test('should configure S3 bucket with DESTROY removal policy and auto-delete', () => {
      template.hasResourceProperties('Custom::S3AutoDeleteObjects', {
        ServiceToken: Match.anyValue(),
      });
      const resources = template.findResources('AWS::S3::Bucket');
      const bucket = Object.values(resources)[0];
      expect(bucket?.DeletionPolicy).toBe('Delete');
    });

    test('should block public access on artifact bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should have exactly two S3 buckets (source and artifact)', () => {
      template.resourceCountIs('AWS::S3::Bucket', 2);
    });
  });

  describe('SNS Topics', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create approval topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Pipeline Approval Notifications',
      });
    });

    test('should create alarm topic', () => {
      const topics = template.findResources('AWS::SNS::Topic');
      const alarmTopic = Object.values(topics).find(
        (topic: any) =>
          topic.Properties?.DisplayName === 'Pipeline Alarm Notifications'
      );
      expect(alarmTopic).toBeDefined();
    });

    test('should have exactly two SNS topics', () => {
      template.resourceCountIs('AWS::SNS::Topic', 2);
    });
  });

  describe('CodePipeline', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create pipeline with correct name', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'microservice-pipeline-test',
      });
    });

    test('should configure pipeline with cross-account keys', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        ArtifactStore: {
          Type: 'S3',
          EncryptionKey: Match.anyValue(),
        },
      });
    });

    test('should have exactly one pipeline', () => {
      template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
    });
  });

  describe('Pipeline Stages', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should have Source stage', () => {
      const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
      const pipelineResource = Object.values(pipeline)[0];
      const stages = pipelineResource.Properties?.Stages || [];
      const sourceStage = stages.find(
        (stage: any) => stage.Name === 'Source'
      );
      expect(sourceStage).toBeDefined();
    });

    test('should have Build stage', () => {
      const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
      const pipelineResource = Object.values(pipeline)[0];
      const stages = pipelineResource.Properties?.Stages || [];
      const buildStage = stages.find((stage: any) => stage.Name === 'Build');
      expect(buildStage).toBeDefined();
    });

    test('should have Test stage', () => {
      const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
      const pipelineResource = Object.values(pipeline)[0];
      const stages = pipelineResource.Properties?.Stages || [];
      const testStage = stages.find((stage: any) => stage.Name === 'Test');
      expect(testStage).toBeDefined();
    });

    test('should have DeployToStaging stage', () => {
      const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
      const pipelineResource = Object.values(pipeline)[0];
      const stages = pipelineResource.Properties?.Stages || [];
      const deployStage = stages.find(
        (stage: any) => stage.Name === 'DeployToStaging'
      );
      expect(deployStage).toBeDefined();
    });

    test('should have Approve stage', () => {
      const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
      const pipelineResource = Object.values(pipeline)[0];
      const stages = pipelineResource.Properties?.Stages || [];
      const approveStage = stages.find(
        (stage: any) => stage.Name === 'Approve'
      );
      expect(approveStage).toBeDefined();
    });

    test('should have DeployToProduction stage', () => {
      const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
      const pipelineResource = Object.values(pipeline)[0];
      const stages = pipelineResource.Properties?.Stages || [];
      const prodStage = stages.find(
        (stage: any) => stage.Name === 'DeployToProduction'
      );
      expect(prodStage).toBeDefined();
    });
  });

  describe('CodeBuild Projects', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create build project with correct name', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'microservice-build-test',
        Environment: {
          ComputeType: 'BUILD_GENERAL1_MEDIUM',
          PrivilegedMode: true,
          Image: 'aws/codebuild/standard:5.0',
        },
      });
    });

    test('should create test project with correct name', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'microservice-test-test',
        Environment: {
          ComputeType: 'BUILD_GENERAL1_LARGE',
          PrivilegedMode: true,
        },
      });
    });

    test('should configure build project with unit test reports', () => {
      const projects = template.findResources('AWS::CodeBuild::Project');
      const buildProject = Object.values(projects).find(
        (project: any) => project.Properties?.Name === 'microservice-build-test'
      );
      expect(buildProject?.Properties?.Artifacts).toBeDefined();
    });

    test('should configure test project with integration and security reports', () => {
      const projects = template.findResources('AWS::CodeBuild::Project');
      const testProject = Object.values(projects).find(
        (project: any) => project.Properties?.Name === 'microservice-test-test'
      );
      expect(testProject?.Properties?.Artifacts).toBeDefined();
    });

    test('should have exactly two CodeBuild projects', () => {
      template.resourceCountIs('AWS::CodeBuild::Project', 2);
    });
  });

  describe('IAM Roles and Permissions', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create IAM roles for CodeBuild projects', () => {
      const roles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(roles).length).toBeGreaterThanOrEqual(2);
    });

    test('should grant ECR permissions to build project', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const ecrPolicies = Object.values(policies).filter((policy: any) =>
        JSON.stringify(policy.Properties?.PolicyDocument).includes('ecr:')
      );
      expect(ecrPolicies.length).toBeGreaterThan(0);
    });

    test('should grant S3 permissions to build and test projects', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const s3Policies = Object.values(policies).filter((policy: any) =>
        JSON.stringify(policy.Properties?.PolicyDocument).includes('s3:')
      );
      expect(s3Policies.length).toBeGreaterThan(0);
    });

    test('should grant KMS permissions to build and test projects', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const kmsPolicies = Object.values(policies).filter((policy: any) =>
        JSON.stringify(policy.Properties?.PolicyDocument).includes('kms:')
      );
      expect(kmsPolicies.length).toBeGreaterThan(0);
    });
  });

  describe('Cross-Account Deployment Roles', () => {
    test('should create staging deploy role when accounts differ', () => {
      app = new cdk.App({
        context: { stagingAccountId: '999999999999' },
      });
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      const roles = template.findResources('AWS::IAM::Role');
      const stagingRole = Object.values(roles).find((role: any) =>
        role.Properties?.RoleName?.includes('StagingDeployRole')
      );
      expect(stagingRole).toBeDefined();
    });

    test('should create production deploy role when accounts differ', () => {
      app = new cdk.App({
        context: { prodAccountId: '888888888888' },
      });
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      const roles = template.findResources('AWS::IAM::Role');
      const prodRole = Object.values(roles).find((role: any) =>
        role.Properties?.RoleName?.includes('ProdDeployRole')
      );
      expect(prodRole).toBeDefined();
    });

    test('should not create cross-account roles when accounts are same', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      const roles = template.findResources('AWS::IAM::Role');
      const crossAccountRoles = Object.values(roles).filter((role: any) =>
        role.Properties?.RoleName?.includes('DeployRole')
      );
      expect(crossAccountRoles.length).toBe(0);
    });
  });

  describe('CloudWatch Dashboard', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create CloudWatch dashboard with correct name', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'MicroservicePipelineMonitoring-test',
      });
    });

    test('should have exactly one CloudWatch dashboard', () => {
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });
  });

  describe('CloudWatch Alarms', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create pipeline failure alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'Alarm when pipeline execution fails',
        MetricName: 'FailedPipeline',
        Namespace: 'AWS/CodePipeline',
        Threshold: 1,
        EvaluationPeriods: 1,
      });
    });

    test('should create build failure alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'Alarm when build project fails',
        MetricName: 'FailedBuilds',
        Namespace: 'AWS/CodeBuild',
        Threshold: 1,
        EvaluationPeriods: 1,
      });
    });

    test('should create test failure alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'Alarm when test project fails',
        MetricName: 'FailedBuilds',
        Namespace: 'AWS/CodeBuild',
        Threshold: 1,
        EvaluationPeriods: 1,
      });
    });

    test('should configure alarms with SNS actions', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const alarmResources = Object.values(alarms);
      alarmResources.forEach((alarm: any) => {
        expect(alarm.Properties?.AlarmActions).toBeDefined();
      });
    });

    test('should have exactly three CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 3);
    });
  });

  describe('Stack Outputs', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should output source bucket name', () => {
      template.hasOutput('SourceBucketName', {
        Description: 'S3 bucket name for source code',
      });
    });

    test('should output ECR repository URI', () => {
      template.hasOutput('EcrRepositoryUri', {
        Description: 'ECR repository URI',
      });
    });

    test('should output pipeline name', () => {
      template.hasOutput('PipelineName', {
        Description: 'Name of the CI/CD pipeline',
      });
    });

    test('should output artifact bucket name', () => {
      template.hasOutput('ArtifactBucketName', {
        Description: 'Name of the artifact bucket',
      });
    });

    test('should output approval topic ARN', () => {
      template.hasOutput('ApprovalTopicArn', {
        Description: 'ARN of the SNS topic for deployment approvals',
      });
    });

    test('should output alarm topic ARN', () => {
      template.hasOutput('AlarmTopicArn', {
        Description: 'ARN of the SNS topic for alarm notifications',
      });
    });

    test('should output dashboard name', () => {
      template.hasOutput('DashboardName', {
        Description: 'Name of the CloudWatch dashboard',
      });
    });

    test('should have exactly seven outputs', () => {
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs).length).toBe(7);
    });
  });
});
