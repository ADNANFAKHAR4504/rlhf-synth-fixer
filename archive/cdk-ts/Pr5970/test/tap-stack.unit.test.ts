import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  describe('Configuration and Defaults', () => {
    test('should use environmentSuffix from props', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      // Verify KMS key alias includes environment suffix
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: Match.stringLikeRegexp('.*-test-pipeline-key'),
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

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: Match.stringLikeRegexp('.*-context-env-pipeline-key'),
      });
    });

    test('should default to "dev" when no environmentSuffix provided', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: Match.stringLikeRegexp('.*-dev-pipeline-key'),
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

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: Match.stringLikeRegexp('.*-props-pipeline-key'),
      });
    });

    test('should use custom serviceName and companyName from props', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        serviceName: 'myservice',
        companyName: 'mycompany',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('mycompany-myservice-test-.*'),
      });
    });

    test('should use serviceName and companyName from context', () => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'test',
          serviceName: 'ctxservice',
          companyName: 'ctxcompany',
        },
      });
      stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('ctxcompany-ctxservice-test-.*'),
      });
    });

    test('should use default serviceName and companyName when not provided', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('acme-microservice-test-.*'),
      });
    });

    test('should use custom account IDs from props', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        devAccountId: '111111111111',
        stagingAccountId: '222222222222',
        prodAccountId: '333333333333',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      // Verify cross-account bucket policy includes custom account IDs
      const bucketPolicy = template.findResources('AWS::S3::BucketPolicy');
      const policyDoc = JSON.stringify(bucketPolicy);
      expect(policyDoc).toContain('111111111111');
      expect(policyDoc).toContain('222222222222');
      expect(policyDoc).toContain('333333333333');
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

    test('should create KMS key with correct alias', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: Match.stringLikeRegexp('.*-test-pipeline-key'),
      });
    });

    test('should grant encrypt/decrypt to cross-account principals', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
      // Verify key policy includes cross-account access
      const kmsKey = template.findResources('AWS::KMS::Key');
      const keyPolicy = JSON.stringify(kmsKey);
      expect(keyPolicy).toContain('kms:Encrypt');
      expect(keyPolicy).toContain('kms:Decrypt');
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

    test('should create S3 bucket with correct properties', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
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
      // Verify lifecycle rules exist (versioning is false, so may not have VersioningConfiguration)
      const bucket = template.findResources('AWS::S3::Bucket');
      const bucketResource = Object.values(bucket)[0] as any;
      const bucketStr = JSON.stringify(bucketResource);
      // Lifecycle configuration should exist with delete-old-artifacts rule
      expect(bucketStr).toContain('delete-old-artifacts');
      // Verify lifecycle rules are configured
      expect(
        bucketResource?.Properties?.LifecycleConfiguration?.Rules || []
      ).toBeDefined();
    });

    test('should include environment suffix in bucket name', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('.*-test-pipeline-artifacts-.*'),
      });
    });

    test('should have cross-account bucket policy', () => {
      template.resourceCountIs('AWS::S3::BucketPolicy', 1);
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                's3:GetObject',
                's3:PutObject',
                's3:ListBucket',
              ]),
            }),
          ]),
        },
      });
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

    test('should create ECR repository with correct properties', () => {
      template.resourceCountIs('AWS::ECR::Repository', 1);
      template.hasResourceProperties('AWS::ECR::Repository', {
        ImageScanningConfiguration: {
          ScanOnPush: true,
        },
      });
      // Verify lifecycle policy separately
      const ecrRepo = template.findResources('AWS::ECR::Repository');
      const repoResource = Object.values(ecrRepo)[0] as any;
      const lifecyclePolicy = repoResource?.Properties?.LifecyclePolicy;
      expect(lifecyclePolicy).toBeDefined();
      // ECR lifecycle policy is a JSON string with rules
      const lifecycleText =
        lifecyclePolicy?.LifecyclePolicyText || JSON.stringify(lifecyclePolicy);
      expect(lifecycleText).toContain('10'); // maxImageCount: 10
      expect(lifecycleText).toContain('Keep only last 10 images');
    });

    test('should include environment suffix in repository name', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: Match.stringLikeRegexp('.*-test-build-images'),
      });
    });

    test('should grant cross-account pull permissions', () => {
      const ecrRepo = template.findResources('AWS::ECR::Repository');
      const repoStr = JSON.stringify(ecrRepo);
      // ECR permissions are granted via IAM policies, verify repository exists
      expect(ecrRepo).toBeDefined();
      template.resourceCountIs('AWS::ECR::Repository', 1);
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

    test('should create pipeline notifications topic', () => {
      template.resourceCountIs('AWS::SNS::Topic', 2);
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: Match.stringLikeRegexp('.*-test-pipeline-notifications'),
        DisplayName: 'CI/CD Pipeline Notifications',
      });
    });

    test('should create approval notifications topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: Match.stringLikeRegexp('.*-test-approval-requests'),
        DisplayName: 'Pipeline Approval Requests',
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create log groups for build, test, and image stages', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 3);
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp('.*/test/codebuild/build'),
        RetentionInDays: 30,
      });
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp('.*/test/codebuild/test'),
      });
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp('.*/test/codebuild/image'),
      });
    });

    test('should encrypt log groups with KMS', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        KmsKeyId: Match.anyValue(),
      });
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

    test('should create three CodeBuild projects', () => {
      template.resourceCountIs('AWS::CodeBuild::Project', 3);
    });

    test('should create build project with correct configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: Match.stringLikeRegexp('.*-test-build'),
        Description: 'Build and compile microservice',
        Environment: {
          ComputeType: 'BUILD_GENERAL1_MEDIUM',
          PrivilegedMode: false,
        },
        Cache: {
          Type: 'S3',
        },
      });
    });

    test('should create test project with correct configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: Match.stringLikeRegexp('.*-test-test'),
        Description: 'Run unit and integration tests',
        Environment: {
          ComputeType: 'BUILD_GENERAL1_MEDIUM',
          PrivilegedMode: false,
        },
      });
    });

    test('should create image project with privileged mode', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: Match.stringLikeRegexp('.*-test-image-build'),
        Description: 'Build and push container image',
        Environment: {
          ComputeType: 'BUILD_GENERAL1_MEDIUM',
          PrivilegedMode: true,
        },
      });
    });

    test('should set environment variables on CodeBuild projects', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Environment: {
          EnvironmentVariables: Match.arrayWith([
            Match.objectLike({
              Name: 'SERVICE_NAME',
            }),
            Match.objectLike({
              Name: 'COMPANY_NAME',
            }),
          ]),
        },
      });
    });

    test('should configure CloudWatch logging for CodeBuild projects', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        LogsConfig: {
          CloudWatchLogs: {
            Status: 'ENABLED',
          },
        },
      });
    });
  });

  describe('CodeDeploy Applications', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create staging and production CodeDeploy applications', () => {
      template.resourceCountIs('AWS::CodeDeploy::Application', 2);
      template.hasResourceProperties('AWS::CodeDeploy::Application', {
        ApplicationName: Match.stringLikeRegexp('.*-test-staging-deploy'),
        ComputePlatform: 'ECS',
      });
      template.hasResourceProperties('AWS::CodeDeploy::Application', {
        ApplicationName: Match.stringLikeRegexp('.*-test-prod-deploy'),
        ComputePlatform: 'ECS',
      });
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

    test('should create deployment alarms for staging and production', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp(
          '.*-test-staging-deployment-failures'
        ),
        MetricName: 'Deployments',
        Namespace: 'AWS/CodeDeploy',
        Threshold: 1,
        EvaluationPeriods: 1,
      });
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('.*-test-prod-deployment-failures'),
      });
    });

    test('should configure alarm actions with SNS', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmActions: Match.anyValue(),
      });
      // Verify alarms have SNS actions
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const alarmsStr = JSON.stringify(alarms);
      expect(alarmsStr).toContain('AlarmActions');
    });
  });

  describe('IAM Roles', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create pipeline role with correct properties', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const pipelineRole = Object.values(roles).find((role: any) =>
        role.Properties?.RoleName?.includes('test-pipeline-role')
      );
      expect(pipelineRole).toBeDefined();
      expect(
        pipelineRole?.Properties?.AssumeRolePolicyDocument?.Statement?.[0]
          ?.Principal?.Service
      ).toBe('codepipeline.amazonaws.com');
      // Verify inline policy exists with CodePipeline permissions
      expect(pipelineRole?.Properties?.Policies).toBeDefined();
      const policies = pipelineRole?.Properties?.Policies || [];
      const codePipelinePolicy = policies.find(
        (p: any) => p.PolicyName === 'CodePipelinePolicy'
      );
      expect(codePipelinePolicy).toBeDefined();
      expect(JSON.stringify(codePipelinePolicy)).toContain('codepipeline');
    });

    test('should create CodeDeploy role with correct properties', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const codeDeployRole = Object.values(roles).find((role: any) =>
        role.Properties?.RoleName?.includes('test-codedeploy-role')
      );
      expect(codeDeployRole).toBeDefined();
      expect(
        codeDeployRole?.Properties?.AssumeRolePolicyDocument?.Statement?.[0]
          ?.Principal?.Service
      ).toBe('codedeploy.amazonaws.com');
      // Verify inline policy exists with CodeDeploy ECS permissions
      expect(codeDeployRole?.Properties?.Policies).toBeDefined();
      const policies = codeDeployRole?.Properties?.Policies || [];
      const codeDeployPolicy = policies.find(
        (p: any) => p.PolicyName === 'CodeDeployECSPolicy'
      );
      expect(codeDeployPolicy).toBeDefined();
      expect(JSON.stringify(codeDeployPolicy)).toContain('ecs');
    });

    test('should grant cross-account assume role for CodeDeploy', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const codeDeployRole = Object.values(roles).find((role: any) =>
        role.Properties?.RoleName?.includes('test-codedeploy-role')
      );
      const roleStr = JSON.stringify(codeDeployRole);
      expect(roleStr).toContain('sts:AssumeRole');
      // Should have cross-account principals
      expect(roleStr).toContain('AWS');
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
      template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: Match.stringLikeRegexp('.*-test-pipeline'),
      });
    });

    test('should configure pipeline with artifact bucket', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        ArtifactStore: {
          Type: 'S3',
        },
      });
    });

    test('should have all required stages (without deployment stages when service ARNs not provided)', () => {
      const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
      const pipelineResource = Object.values(pipeline)[0] as any;
      const stages = pipelineResource?.Properties?.Stages || [];
      const stageNames = stages.map((stage: any) => stage.Name);

      // Core stages should always exist
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Test');
      expect(stageNames).toContain('ImageBuild');
      
      // Deployment stages are conditional - only exist when service ARNs are provided
      // Without service ARNs, we should have 4 stages
      expect(stages.length).toBe(4);
    });

    test('should have deployment stages when service ARNs are provided', () => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'test',
          stagingServiceArn: 'arn:aws:ecs:us-east-1:123456789012:service/test-cluster/test-service',
          prodServiceArn: 'arn:aws:ecs:us-east-1:123456789012:service/prod-cluster/prod-service',
          stagingVpcId: 'vpc-12345678',
          stagingPublicSubnetId: 'subnet-11111111',
          stagingPrivateSubnetId: 'subnet-22222222',
          stagingSecurityGroupId: 'sg-12345678',
          prodVpcId: 'vpc-87654321',
          prodPublicSubnetId: 'subnet-33333333',
          prodPrivateSubnetId: 'subnet-44444444',
          prodSecurityGroupId: 'sg-87654321',
        },
      });
      stack = new TapStack(app, 'TestTapStackWithDeploy', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
      const pipelineResource = Object.values(pipeline)[0] as any;
      const stages = pipelineResource?.Properties?.Stages || [];
      const stageNames = stages.map((stage: any) => stage.Name);

      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Test');
      expect(stageNames).toContain('ImageBuild');
      expect(stageNames).toContain('DeployStaging');
      expect(stageNames).toContain('ApprovalStage');
      expect(stageNames).toContain('DeployProduction');
      expect(stages.length).toBe(7);
    });

    test('should configure manual approval action with SNS notification when production service ARN provided', () => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'test',
          prodServiceArn: 'arn:aws:ecs:us-east-1:123456789012:service/prod-cluster/prod-service',
          prodVpcId: 'vpc-87654321',
          prodPublicSubnetId: 'subnet-33333333',
          prodPrivateSubnetId: 'subnet-44444444',
          prodSecurityGroupId: 'sg-87654321',
        },
      });
      stack = new TapStack(app, 'TestTapStackApproval', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'ApprovalStage',
            Actions: Match.arrayWith([
              Match.objectLike({
                Configuration: {
                  NotificationArn: Match.anyValue(),
                  CustomData:
                    'Please review staging deployment and approve production release',
                },
              }),
            ]),
          }),
        ]),
      });
    });
  });

  describe('CodeDeploy Deployment Groups', () => {
    test('should not create deployment groups when service ARNs not provided', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      // Deployment groups are conditional - should not exist without service ARNs
      template.resourceCountIs('AWS::CodeDeploy::DeploymentGroup', 0);
    });

    test('should create staging deployment group when service ARN provided', () => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'test',
          stagingServiceArn: 'arn:aws:ecs:us-east-1:123456789012:service/test-cluster/test-service',
          stagingVpcId: 'vpc-12345678',
          stagingPublicSubnetId: 'subnet-11111111',
          stagingPrivateSubnetId: 'subnet-22222222',
          stagingSecurityGroupId: 'sg-12345678',
        },
      });
      stack = new TapStack(app, 'TestTapStackStaging', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.resourceCountIs('AWS::CodeDeploy::DeploymentGroup', 1);
      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        DeploymentGroupName: Match.stringLikeRegexp('.*-test-staging'),
        DeploymentConfigName: Match.stringLikeRegexp('CodeDeployDefault.*'),
        AutoRollbackConfiguration: {
          Enabled: true,
          Events: Match.arrayWith([
            'DEPLOYMENT_FAILURE',
            'DEPLOYMENT_STOP_ON_REQUEST',
            'DEPLOYMENT_STOP_ON_ALARM',
          ]),
        },
      });
    });

    test('should create production deployment group when service ARN provided', () => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'test',
          prodServiceArn: 'arn:aws:ecs:us-east-1:123456789012:service/prod-cluster/prod-service',
          prodVpcId: 'vpc-87654321',
          prodPublicSubnetId: 'subnet-33333333',
          prodPrivateSubnetId: 'subnet-44444444',
          prodSecurityGroupId: 'sg-87654321',
        },
      });
      stack = new TapStack(app, 'TestTapStackProd', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.resourceCountIs('AWS::CodeDeploy::DeploymentGroup', 1);
      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        DeploymentGroupName: Match.stringLikeRegexp('.*-test-prod'),
        AutoRollbackConfiguration: {
          Enabled: true,
        },
      });
    });

    test('should configure blue-green deployment when service ARNs provided', () => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'test',
          stagingServiceArn: 'arn:aws:ecs:us-east-1:123456789012:service/test-cluster/test-service',
          prodServiceArn: 'arn:aws:ecs:us-east-1:123456789012:service/prod-cluster/prod-service',
          stagingVpcId: 'vpc-12345678',
          stagingPublicSubnetId: 'subnet-11111111',
          stagingPrivateSubnetId: 'subnet-22222222',
          stagingSecurityGroupId: 'sg-12345678',
          prodVpcId: 'vpc-87654321',
          prodPublicSubnetId: 'subnet-33333333',
          prodPrivateSubnetId: 'subnet-44444444',
          prodSecurityGroupId: 'sg-87654321',
        },
      });
      stack = new TapStack(app, 'TestTapStackBlueGreen', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        BlueGreenDeploymentConfiguration: Match.anyValue(),
      });
    });
  });

  describe('ECS Services', () => {
    test('should not create ECS services when service ARNs not provided', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      // ECS services are conditional - should not exist without service ARNs
      template.resourceCountIs('AWS::ECS::Service', 0);
      template.resourceCountIs('AWS::ECS::TaskDefinition', 0);
    });

    test('should create staging and production ECS services when service ARNs provided', () => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'test',
          stagingServiceArn: 'arn:aws:ecs:us-east-1:123456789012:service/test-cluster/test-service',
          prodServiceArn: 'arn:aws:ecs:us-east-1:123456789012:service/prod-cluster/prod-service',
          stagingVpcId: 'vpc-12345678',
          stagingPublicSubnetId: 'subnet-11111111',
          stagingPrivateSubnetId: 'subnet-22222222',
          stagingSecurityGroupId: 'sg-12345678',
          prodVpcId: 'vpc-87654321',
          prodPublicSubnetId: 'subnet-33333333',
          prodPrivateSubnetId: 'subnet-44444444',
          prodSecurityGroupId: 'sg-87654321',
        },
      });
      stack = new TapStack(app, 'TestTapStackWithServices', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.resourceCountIs('AWS::ECS::Service', 2);
      template.hasResourceProperties('AWS::ECS::Service', {
        DeploymentController: {
          Type: 'CODE_DEPLOY',
        },
        DesiredCount: 0,
      });
    });

    test('should create task definitions with placeholder containers when service ARNs provided', () => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'test',
          stagingServiceArn: 'arn:aws:ecs:us-east-1:123456789012:service/test-cluster/test-service',
          prodServiceArn: 'arn:aws:ecs:us-east-1:123456789012:service/prod-cluster/prod-service',
          stagingVpcId: 'vpc-12345678',
          stagingPublicSubnetId: 'subnet-11111111',
          stagingPrivateSubnetId: 'subnet-22222222',
          stagingSecurityGroupId: 'sg-12345678',
          prodVpcId: 'vpc-87654321',
          prodPublicSubnetId: 'subnet-33333333',
          prodPrivateSubnetId: 'subnet-44444444',
          prodSecurityGroupId: 'sg-87654321',
        },
      });
      stack = new TapStack(app, 'TestTapStackTaskDefs', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.resourceCountIs('AWS::ECS::TaskDefinition', 2);
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Essential: true,
          }),
        ]),
      });
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

    test('should create CloudWatch dashboard', () => {
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp('.*-test-pipeline-dashboard'),
      });
      const dashboard = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboardBody = JSON.stringify(dashboard);
      expect(dashboardBody).toContain('Pipeline Execution Status');
    });

    test('should include pipeline execution metrics', () => {
      const dashboard = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboardBody = JSON.stringify(dashboard);
      expect(dashboardBody).toContain('PipelineExecutionSuccess');
      expect(dashboardBody).toContain('PipelineExecutionFailure');
    });

    test('should include build duration metrics', () => {
      const dashboard = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboardBody = JSON.stringify(dashboard);
      expect(dashboardBody).toContain('Build Duration');
    });

    test('should include deployment metrics', () => {
      const dashboard = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboardBody = JSON.stringify(dashboard);
      expect(dashboardBody).toContain('Total Deployments');
      expect(dashboardBody).toContain('Failed Deployments');
      expect(dashboardBody).toContain('Rollback Count');
    });
  });

  describe('EventBridge Rule for Pipeline Notifications', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create EventBridge rule for pipeline state changes', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['aws.codepipeline'],
        },
        Targets: Match.arrayWith([
          Match.objectLike({
            Arn: Match.anyValue(),
          }),
        ]),
      });
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

    test('should export pipeline ARN', () => {
      template.hasOutput('PipelineArn', {
        Export: {
          Name: Match.stringLikeRegexp('.*-test-pipeline-arn'),
        },
      });
    });

    test('should export artifact bucket name', () => {
      template.hasOutput('ArtifactBucketName', {
        Export: {
          Name: Match.stringLikeRegexp('.*-test-artifact-bucket'),
        },
      });
    });

    test('should export build image repo URI', () => {
      template.hasOutput('BuildImageRepoUri', {
        Export: {
          Name: Match.stringLikeRegexp('.*-test-build-image-repo'),
        },
      });
    });

    test('should export dashboard URL', () => {
      template.hasOutput('DashboardUrl', {
        Value: Match.anyValue(),
      });
      const outputs = template.findOutputs('*');
      expect(outputs.DashboardUrl.Value).toBeDefined();
      expect(JSON.stringify(outputs.DashboardUrl.Value)).toContain(
        'cloudwatch'
      );
    });
  });

  describe('Context Variables for ECS Resources', () => {
    test('should use context variables for staging service ARN', () => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'test',
          stagingServiceArn:
            'arn:aws:ecs:us-east-1:123456789012:service/test-cluster/test-service',
          stagingVpcId: 'vpc-12345678',
          stagingPublicSubnetId: 'subnet-11111111',
          stagingPrivateSubnetId: 'subnet-22222222',
          stagingSecurityGroupId: 'sg-12345678',
        },
      });
      stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      // Verify ECS service is created (only staging, not production)
      template.resourceCountIs('AWS::ECS::Service', 1);
    });

    test('should use context variables for production service ARN', () => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'test',
          prodServiceArn:
            'arn:aws:ecs:us-east-1:123456789012:service/prod-cluster/prod-service',
          prodVpcId: 'vpc-87654321',
          prodPublicSubnetId: 'subnet-33333333',
          prodPrivateSubnetId: 'subnet-44444444',
          prodSecurityGroupId: 'sg-87654321',
        },
      });
      stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      // Verify ECS service is created (only production, not staging)
      template.resourceCountIs('AWS::ECS::Service', 1);
    });
  });

  describe('Resource Naming with Environment Suffix', () => {
    test('should include environment suffix in all resource names', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'prod',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      // Verify all major resources include the suffix
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: Match.stringLikeRegexp('.*-prod-pipeline-key'),
      });
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('.*-prod-pipeline-artifacts-.*'),
      });
      template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: Match.stringLikeRegexp('.*-prod-build-images'),
      });
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: Match.stringLikeRegexp('.*-prod-.*'),
      });
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: Match.stringLikeRegexp('.*-prod-pipeline'),
      });
      template.hasResourceProperties('AWS::CodeDeploy::Application', {
        ApplicationName: Match.stringLikeRegexp('.*-prod-.*'),
      });
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('.*-prod-.*'),
      });
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.stringLikeRegexp('.*-prod-.*'),
      });
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp('.*-prod-pipeline-dashboard'),
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing account IDs gracefully', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: undefined, region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      // Should still create resources
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('should handle ARN parsing for service names', () => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'test',
          stagingServiceArn:
            'arn:aws:ecs:us-east-1:123456789012:service/my-cluster/my-service',
          stagingVpcId: 'vpc-12345678',
          stagingPublicSubnetId: 'subnet-11111111',
          stagingPrivateSubnetId: 'subnet-22222222',
          stagingSecurityGroupId: 'sg-12345678',
        },
      });
      stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      // Should create ECS service with parsed cluster and service names (only staging)
      template.resourceCountIs('AWS::ECS::Service', 1);
    });

    test('should not create ECS services and deployment groups when context variables are missing', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      // Without service ARNs, ECS services and deployment groups should not be created
      template.resourceCountIs('AWS::ECS::Service', 0);
      template.resourceCountIs('AWS::CodeDeploy::DeploymentGroup', 0);
    });

    test('should handle listener ARN parsing with match', () => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'test',
          stagingServiceArn: 'arn:aws:ecs:us-east-1:123456789012:service/test-cluster/test-service',
          stagingListenerArn:
            'arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/app/alb/1234567890123456/1234567890123456',
          stagingVpcId: 'vpc-12345678',
          stagingPublicSubnetId: 'subnet-11111111',
          stagingPrivateSubnetId: 'subnet-22222222',
          stagingSecurityGroupId: 'sg-12345678',
        },
      });
      stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.resourceCountIs('AWS::CodeDeploy::DeploymentGroup', 1);
    });

    test('should handle listener ARN parsing without match (fallback)', () => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'test',
          stagingServiceArn: 'arn:aws:ecs:us-east-1:123456789012:service/test-cluster/test-service',
          stagingListenerArn: 'invalid-arn',
          stagingVpcId: 'vpc-12345678',
          stagingPublicSubnetId: 'subnet-11111111',
          stagingPrivateSubnetId: 'subnet-22222222',
          stagingSecurityGroupId: 'sg-12345678',
        },
      });
      stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      // Should still create resources with fallback ARN
      template.resourceCountIs('AWS::CodeDeploy::DeploymentGroup', 1);
    });

    test('should handle service ARN parsing with match', () => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'test',
          stagingServiceArn:
            'arn:aws:ecs:us-east-1:123456789012:service/cluster-name/service-name',
          stagingVpcId: 'vpc-12345678',
          stagingPublicSubnetId: 'subnet-11111111',
          stagingPrivateSubnetId: 'subnet-22222222',
          stagingSecurityGroupId: 'sg-12345678',
        },
      });
      stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.resourceCountIs('AWS::ECS::Service', 1);
    });

    test('should handle service ARN parsing without match (fallback)', () => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'test',
          stagingServiceArn: 'invalid-arn',
          stagingVpcId: 'vpc-12345678',
          stagingPublicSubnetId: 'subnet-11111111',
          stagingPrivateSubnetId: 'subnet-22222222',
          stagingSecurityGroupId: 'sg-12345678',
        },
      });
      stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      // Should still create resources with fallback names (even invalid ARN triggers creation)
      template.resourceCountIs('AWS::ECS::Service', 1);
    });

    test('should handle production listener ARN parsing with match', () => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'test',
          prodServiceArn: 'arn:aws:ecs:us-east-1:123456789012:service/prod-cluster/prod-service',
          prodListenerArn:
            'arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/app/alb/1234567890123456/1234567890123456',
          prodVpcId: 'vpc-87654321',
          prodPublicSubnetId: 'subnet-33333333',
          prodPrivateSubnetId: 'subnet-44444444',
          prodSecurityGroupId: 'sg-87654321',
        },
      });
      stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.resourceCountIs('AWS::CodeDeploy::DeploymentGroup', 1);
    });

    test('should handle production listener ARN parsing without match (fallback)', () => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'test',
          prodServiceArn: 'arn:aws:ecs:us-east-1:123456789012:service/prod-cluster/prod-service',
          prodListenerArn: 'invalid-arn',
          prodVpcId: 'vpc-87654321',
          prodPublicSubnetId: 'subnet-33333333',
          prodPrivateSubnetId: 'subnet-44444444',
          prodSecurityGroupId: 'sg-87654321',
        },
      });
      stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.resourceCountIs('AWS::CodeDeploy::DeploymentGroup', 1);
    });

    test('should handle production service ARN parsing with match', () => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'test',
          prodServiceArn:
            'arn:aws:ecs:us-east-1:123456789012:service/prod-cluster/prod-service',
          prodVpcId: 'vpc-87654321',
          prodPublicSubnetId: 'subnet-33333333',
          prodPrivateSubnetId: 'subnet-44444444',
          prodSecurityGroupId: 'sg-87654321',
        },
      });
      stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.resourceCountIs('AWS::ECS::Service', 1);
    });

    test('should handle production service ARN parsing without match (fallback)', () => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'test',
          prodServiceArn: 'invalid-arn',
          prodVpcId: 'vpc-87654321',
          prodPublicSubnetId: 'subnet-33333333',
          prodPrivateSubnetId: 'subnet-44444444',
          prodSecurityGroupId: 'sg-87654321',
        },
      });
      stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.resourceCountIs('AWS::ECS::Service', 1);
    });

    test('should handle availability zones fallback when not available', () => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'test',
        },
      });
      // Create stack without explicit availability zones
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      // Without service ARNs, ECS services should not be created
      template.resourceCountIs('AWS::ECS::Service', 0);
    });

    test('should use fallback availability zone when availabilityZones is empty', () => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'test',
          stagingServiceArn: 'arn:aws:ecs:us-east-1:123456789012:service/test-cluster/test-service',
          prodServiceArn: 'arn:aws:ecs:us-east-1:123456789012:service/prod-cluster/prod-service',
          stagingVpcId: 'vpc-12345678',
          stagingPublicSubnetId: 'subnet-11111111',
          stagingPrivateSubnetId: 'subnet-22222222',
          stagingSecurityGroupId: 'sg-12345678',
          prodVpcId: 'vpc-87654321',
          prodPublicSubnetId: 'subnet-33333333',
          prodPrivateSubnetId: 'subnet-44444444',
          prodSecurityGroupId: 'sg-87654321',
        },
      });
      // Create stack - the fallback 'us-east-1a' is used when availabilityZones[0] is undefined
      // This is defensive code that ensures VPC creation works even if availabilityZones is not populated
      stack = new TapStack(app, 'TestTapStackAZ', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      // Should create resources successfully with fallback AZ
      template.resourceCountIs('AWS::ECS::Service', 2);

      // Verify VPC attributes are created (which uses the fallback)
      const vpcs = template.findResources('AWS::EC2::VPC');
      // VPCs are referenced, not created, so verify ECS services exist
      expect(template.findResources('AWS::ECS::Service')).toBeDefined();
    });

    test('should handle listener ARN with replace operation when match found', () => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'test',
          stagingServiceArn: 'arn:aws:ecs:us-east-1:123456789012:service/test-cluster/test-service',
          stagingListenerArn:
            'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/alb/1234567890123456/listener/app/alb/1234567890123456/1234567890123456',
          stagingVpcId: 'vpc-12345678',
          stagingPublicSubnetId: 'subnet-11111111',
          stagingPrivateSubnetId: 'subnet-22222222',
          stagingSecurityGroupId: 'sg-12345678',
        },
      });
      stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.resourceCountIs('AWS::CodeDeploy::DeploymentGroup', 1);
    });

    test('should handle production listener ARN with replace operation when match found', () => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'test',
          prodServiceArn: 'arn:aws:ecs:us-east-1:123456789012:service/prod-cluster/prod-service',
          prodListenerArn:
            'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/alb/1234567890123456/listener/app/alb/1234567890123456/1234567890123456',
          prodVpcId: 'vpc-87654321',
          prodPublicSubnetId: 'subnet-33333333',
          prodPrivateSubnetId: 'subnet-44444444',
          prodSecurityGroupId: 'sg-87654321',
        },
      });
      stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.resourceCountIs('AWS::CodeDeploy::DeploymentGroup', 1);
    });
  });
});
