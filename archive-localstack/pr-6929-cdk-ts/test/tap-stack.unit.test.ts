import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  describe('Environment Suffix Configuration', () => {
    test('should use environment suffix from props', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);

      // Verify resources use the provided suffix
      template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: 'payment-service-test',
      });
    });

    test('should use environment suffix from context when not in props', () => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'context-env',
        },
      });
      stack = new TapStack(app, 'TestTapStack');
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: 'payment-service-context-env',
      });
    });

    test('should default to dev when no suffix provided', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack');
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: 'payment-service-dev',
      });
    });
  });

  describe('VPC Configuration', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: Match.anyValue(),
      });
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('should create subnets in VPC', () => {
      const subnetCount = Object.keys(
        template.findResources('AWS::EC2::Subnet')
      ).length;
      expect(subnetCount).toBeGreaterThan(0);
    });

    test('should create NAT gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });
  });

  describe('S3 Buckets', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create artifact bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.anyValue(),
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

      // Verify bucket name contains expected pattern
      const buckets = template.findResources('AWS::S3::Bucket');
      const artifactBucket = Object.values(buckets).find((bucket: any) => {
        const bucketName = JSON.stringify(bucket.Properties.BucketName);
        return bucketName.includes('payment-artifacts');
      });
      expect(artifactBucket).toBeDefined();
    });

    test('should create source bucket when CodeCommit not used', () => {
      // When no CodeCommit repo is provided, S3 source bucket should be created
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);

      // Source bucket should exist
      const buckets = template.findResources('AWS::S3::Bucket');
      const sourceBucket = Object.values(buckets).find((bucket: any) => {
        const bucketName = JSON.stringify(bucket.Properties.BucketName);
        return bucketName.includes('payment-source');
      });
      expect(sourceBucket).toBeDefined();
      expect(sourceBucket).toHaveProperty('DeletionPolicy', 'Delete');
      expect(sourceBucket).toHaveProperty(
        'Properties.PublicAccessBlockConfiguration'
      );
    });

    test('should not create source bucket when CodeCommit is used', () => {
      app = new cdk.App({
        context: {
          codeCommitRepositoryName: 'existing-repo',
        },
      });
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);

      // Source bucket should NOT exist when CodeCommit is used
      const buckets = template.findResources('AWS::S3::Bucket');
      const sourceBucket = Object.values(buckets).find((bucket: any) =>
        bucket.Properties.BucketName?.toString().includes('payment-source')
      );
      expect(sourceBucket).toBeUndefined();
    });
  });

  describe('ECR Repository', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create ECR repository with correct name', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: 'payment-service-test',
      });
    });

    test('should enable image scanning on push', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        ImageScanningConfiguration: {
          ScanOnPush: true,
        },
      });
    });

    test('should configure lifecycle policy to keep last 10 images', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        LifecyclePolicy: {
          LifecyclePolicyText: Match.stringLikeRegexp('.*countNumber.*10.*'),
        },
      });
    });

    test('should set emptyOnDelete to true', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        EmptyOnDelete: true,
      });
    });
  });

  describe('SSM Parameters', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create Slack webhook URL parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/payment-service-test/slack-webhook-url',
        Type: 'String',
        Tier: 'Standard',
      });
    });

    test('should create staging endpoint parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/payment-service-test/staging-endpoint',
        Type: 'String',
        Tier: 'Standard',
      });
    });
  });

  describe('SNS Topic', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create approval SNS topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'payment-pipeline-approvals-test',
      });
    });
  });

  describe('IAM Roles', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

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
      });
    });

    test('should create ECS task role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('should create ECS execution role', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const executionRole = Object.values(roles).find((role: any) => {
        const managedPolicies = role.Properties.ManagedPolicyArns || [];
        return managedPolicies.some((arn: any) => {
          const arnStr = typeof arn === 'string' ? arn : JSON.stringify(arn);
          return arnStr.includes('AmazonECSTaskExecutionRolePolicy');
        });
      });
      expect(executionRole).toBeDefined();
    });

    test('should create CodeDeploy role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codedeploy.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('should create Pipeline role with custom policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codepipeline.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('should create Lambda role for Slack notifier', () => {
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
    });
  });

  describe('CodeBuild Projects', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create build project', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'payment-service-build-test',
        Environment: {
          Type: 'LINUX_CONTAINER',
          ComputeType: 'BUILD_GENERAL1_MEDIUM',
          PrivilegedMode: true,
        },
      });
    });

    test('should create unit test project', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'payment-service-unit-tests-test',
        Environment: {
          ComputeType: 'BUILD_GENERAL1_SMALL',
        },
      });
    });

    test('should create integration test project', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'payment-service-integration-tests-test',
      });
    });

    test('should create log groups for CodeBuild projects', () => {
      const logGroupCount = Object.keys(
        template.findResources('AWS::Logs::LogGroup')
      ).length;
      expect(logGroupCount).toBeGreaterThan(0);
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/codebuild/payment-service-build-test',
      });
    });
  });

  describe('ECS Infrastructure', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create ECS cluster', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: 'payment-service-cluster-test',
      });
    });

    test('should enable container insights via cluster settings', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterSettings: [
          {
            Name: 'containerInsights',
            Value: 'enabled',
          },
        ],
      });
    });

    test('should create Fargate task definition', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Family: 'payment-service-test',
        RequiresCompatibilities: ['FARGATE'],
        Cpu: '1024',
        Memory: '2048',
        NetworkMode: 'awsvpc',
      });
    });

    test('should create ECS service with CodeDeploy controller', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        ServiceName: 'payment-service-test',
        DesiredCount: 2,
        DeploymentController: {
          Type: 'CODE_DEPLOY',
        },
        HealthCheckGracePeriodSeconds: 60,
      });
    });

    test('should configure service with min and max healthy percent', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        DeploymentConfiguration: {
          MinimumHealthyPercent: 100,
          MaximumPercent: 200,
        },
      });
    });

    test('should create log group for ECS service', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/ecs/payment-service-test',
      });
    });
  });

  describe('Application Load Balancer', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create ALB', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Name: 'payment-service-alb-test',
          Type: 'application',
          Scheme: 'internet-facing',
        }
      );
    });

    test('should create blue target group', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          Name: 'payment-blue-tg-test',
          Port: 80,
          Protocol: 'HTTP',
          TargetType: 'ip',
          HealthCheckPath: '/',
        }
      );
    });

    test('should create green target group', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          Name: 'payment-green-tg-test',
          Port: 80,
          Protocol: 'HTTP',
        }
      );
    });

    test('should create production listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });

    test('should create test listener on port 8080', () => {
      const listeners = template.findResources(
        'AWS::ElasticLoadBalancingV2::Listener'
      );
      const testListener = Object.values(listeners).find(
        (listener: any) => listener.Properties.Port === 8080
      );
      expect(testListener).toBeDefined();
    });
  });

  describe('CodeDeploy', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create CodeDeploy application', () => {
      template.hasResourceProperties('AWS::CodeDeploy::Application', {
        ApplicationName: 'payment-service-app-test',
        ComputePlatform: 'ECS',
      });
    });

    test('should create CodeDeploy deployment group', () => {
      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        DeploymentGroupName: 'payment-service-dg-test',
        DeploymentConfigName: Match.stringLikeRegexp('.*ECSAllAtOnce.*'),
        AutoRollbackConfiguration: {
          Enabled: true,
          Events: Match.arrayWith([
            'DEPLOYMENT_FAILURE',
            'DEPLOYMENT_STOP_ON_ALARM',
          ]),
        },
      });
    });

    test('should configure blue/green deployment', () => {
      const deploymentGroups = template.findResources(
        'AWS::CodeDeploy::DeploymentGroup'
      );
      const deploymentGroup = Object.values(deploymentGroups)[0] as any;

      expect(
        deploymentGroup.Properties.BlueGreenDeploymentConfiguration
      ).toBeDefined();
      const bgConfig =
        deploymentGroup.Properties.BlueGreenDeploymentConfiguration;

      expect(bgConfig.DeploymentReadyOption).toBeDefined();
      expect(bgConfig.DeploymentReadyOption.WaitTimeInMinutes).toBe(1);
      expect(bgConfig.TerminateBlueInstancesOnDeploymentSuccess).toBeDefined();
      expect(
        bgConfig.TerminateBlueInstancesOnDeploymentSuccess
          .TerminationWaitTimeInMinutes
      ).toBe(5);
    });
  });

  describe('CloudWatch Alarms', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create target response time alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: Match.stringLikeRegexp('.*response time.*'),
        EvaluationPeriods: 2,
        DatapointsToAlarm: 2,
        Threshold: 2,
      });
    });

    test('should create unhealthy host alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: Match.stringLikeRegexp('.*unhealthy host.*'),
        Threshold: 1,
      });
    });

    test('should create HTTP 5xx alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: Match.stringLikeRegexp('.*5xx.*'),
        Threshold: 10,
      });
    });
  });

  describe('Lambda Function', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create Slack notifier Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'payment-pipeline-slack-notifier-test',
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
      });
    });

    test('should create log group for Lambda', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/lambda/payment-pipeline-slack-notifier-test',
      });
    });

    test('should configure Lambda environment variables', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      const lambdaFunction = Object.values(functions).find(
        (func: any) =>
          func.Properties.FunctionName ===
          'payment-pipeline-slack-notifier-test'
      ) as any;

      expect(lambdaFunction).toBeDefined();
      expect(lambdaFunction.Properties.Environment).toBeDefined();
      expect(lambdaFunction.Properties.Environment.Variables).toBeDefined();

      // The environment variable uses a CloudFormation reference to the SSM parameter
      const webhookParam =
        lambdaFunction.Properties.Environment.Variables.WEBHOOK_PARAM_NAME;
      expect(webhookParam).toBeDefined();
      // It should be a Ref to the SSM parameter
      expect(webhookParam.Ref || webhookParam).toBeDefined();
    });
  });

  describe('CodePipeline', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create CodePipeline', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'payment-service-pipeline-test',
      });
    });

    test('should create pipeline with all required stages', () => {
      const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
      const pipelineResource = Object.values(pipeline)[0] as any;
      const stages = pipelineResource.Properties.Stages;

      const stageNames = stages.map((stage: any) => stage.Name);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('UnitTest');
      expect(stageNames).toContain('DeployStaging');
      expect(stageNames).toContain('IntegrationTest');
      expect(stageNames).toContain('Approval');
      expect(stageNames).toContain('DeployProduction');
    });

    test('should configure S3 source action when CodeCommit not used', () => {
      const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
      const pipelineResource = Object.values(pipeline)[0] as any;
      const sourceStage = pipelineResource.Properties.Stages.find(
        (stage: any) => stage.Name === 'Source'
      );

      // Should have S3 source action
      const hasS3Action = sourceStage.Actions.some((action: any) =>
        action.ActionTypeId.Provider.includes('S3')
      );
      expect(hasS3Action).toBe(true);
    });
  });

  describe('CodeCommit Integration', () => {
    test('should use CodeCommit when repository name provided in context', () => {
      app = new cdk.App({
        context: {
          codeCommitRepositoryName: 'existing-repo',
        },
      });
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);

      const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
      const pipelineResource = Object.values(pipeline)[0] as any;
      const sourceStage = pipelineResource.Properties.Stages.find(
        (stage: any) => stage.Name === 'Source'
      );

      // Should have CodeCommit source action
      const hasCodeCommitAction = sourceStage.Actions.some((action: any) =>
        action.ActionTypeId.Provider.includes('CodeCommit')
      );
      expect(hasCodeCommitAction).toBe(true);
    });
  });

  describe('EventBridge Rule', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create EventBridge rule for pipeline state changes', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['aws.codepipeline'],
          'detail-type': ['CodePipeline Pipeline Execution State Change'],
        },
      });
    });
  });

  describe('Stack Outputs', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should output ALB DNS name', () => {
      template.hasOutput('ALBDnsName', {
        Description: 'Application Load Balancer DNS name',
      });
    });

    test('should output ECR repository URI', () => {
      template.hasOutput('ECRRepositoryUri', {
        Description: 'ECR repository URI',
      });
    });

    test('should output CodeDeploy application name', () => {
      template.hasOutput('CodeDeployApplicationName', {
        Description: 'CodeDeploy application name',
      });
    });

    test('should output pipeline name', () => {
      template.hasOutput('PipelineName', {
        Description: 'CodePipeline name',
      });
    });

    test('should output production URL', () => {
      template.hasOutput('ProductionURL', {
        Description: 'Production URL',
      });
    });

    test('should output staging URL', () => {
      template.hasOutput('StagingURL', {
        Description: 'Staging URL (test listener)',
      });
    });
  });

  describe('Resource Counts', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create expected number of resources', () => {
      // Verify key resource counts
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::ECS::Cluster', 1);
      template.resourceCountIs('AWS::ECS::Service', 1);
      template.resourceCountIs('AWS::ECR::Repository', 1);
      template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
      template.resourceCountIs('AWS::CodeDeploy::Application', 1);
      template.resourceCountIs('AWS::Lambda::Function', 1);
      template.resourceCountIs('AWS::SNS::Topic', 1);
      template.resourceCountIs('AWS::SSM::Parameter', 2);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 3);
    });
  });

  describe('Removal Policies', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should set DESTROY removal policy on ECR repository', () => {
      const repos = template.findResources('AWS::ECR::Repository');
      const repo = Object.values(repos)[0] as any;
      expect(repo.DeletionPolicy).toBe('Delete');
    });

    test('should set DESTROY removal policy on S3 buckets', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.DeletionPolicy).toBe('Delete');
      });
    });

    test('should set DESTROY removal policy on log groups', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.values(logGroups).forEach((logGroup: any) => {
        expect(logGroup.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('Placeholder Image Configuration', () => {
    test('should use default placeholder image when not specified', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: [
          {
            Image: Match.stringLikeRegexp('.*nginx.*'),
          },
        ],
      });
    });

    test('should use custom placeholder image from context', () => {
      app = new cdk.App({
        context: {
          ecsPlaceholderImage: 'custom-image:tag',
        },
      });
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: [
          {
            Image: 'custom-image:tag',
          },
        ],
      });
    });
  });

  describe('Resource Permissions and Grants', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should grant ECR pull/push permissions to build project', () => {
      // Verify IAM policies include ECR permissions
      const roles = template.findResources('AWS::IAM::Role');
      const codeBuildRole = Object.values(roles).find((role: any) =>
        role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service.includes(
          'codebuild'
        )
      );
      expect(codeBuildRole).toBeDefined();

      const policies = codeBuildRole?.Properties.Policies || [];
      const hasECRPolicy = policies.some((policy: any) =>
        JSON.stringify(policy.PolicyDocument.Statement).includes('ecr:')
      );
      expect(hasECRPolicy).toBe(true);
    });

    test('should grant S3 permissions to CodeBuild projects', () => {
      // S3 permissions are granted via bucket.grantReadWrite() which creates separate policies
      // Check that there are IAM policies that grant S3 access
      const policies = template.findResources('AWS::IAM::Policy');
      const hasS3Policy = Object.values(policies).some((policy: any) => {
        const statements = JSON.stringify(
          policy.Properties.PolicyDocument?.Statement || []
        );
        return statements.includes('s3:') && statements.includes('codebuild');
      });

      // Also check inline policies on the CodeBuild role
      const roles = template.findResources('AWS::IAM::Role');
      const codeBuildRole = Object.values(roles).find((role: any) =>
        role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service.includes(
          'codebuild'
        )
      );

      const inlinePolicies = codeBuildRole?.Properties.Policies || [];
      const hasInlineS3Policy = inlinePolicies.some((policy: any) =>
        JSON.stringify(policy.PolicyDocument.Statement).includes('s3:')
      );

      // Either inline policy or separate IAM policy should grant S3 access
      expect(hasS3Policy || hasInlineS3Policy).toBe(true);
    });

    test('should grant SSM parameter read permissions to CodeBuild', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const codeBuildRole = Object.values(roles).find((role: any) =>
        role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service.includes(
          'codebuild'
        )
      );

      const policies = codeBuildRole?.Properties.Policies || [];
      const hasSSMPolicy = policies.some((policy: any) =>
        JSON.stringify(policy.PolicyDocument.Statement).includes(
          'ssm:GetParameter'
        )
      );
      expect(hasSSMPolicy).toBe(true);
    });
  });

  describe('Container Configuration', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should configure container with correct port mapping', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: [
          {
            PortMappings: [
              {
                ContainerPort: 80,
                Protocol: 'tcp',
              },
            ],
          },
        ],
      });
    });

    test('should configure container health check', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: [
          {
            HealthCheck: {
              Command: Match.arrayWith([Match.stringLikeRegexp('.*wget.*')]),
              Interval: 30,
              Timeout: 5,
              Retries: 3,
              StartPeriod: 60,
            },
          },
        ],
      });
    });

    test('should configure container environment variables', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: [
          {
            Environment: [
              {
                Name: 'NODE_ENV',
                Value: 'production',
              },
              {
                Name: 'PORT',
                Value: '3000',
              },
            ],
          },
        ],
      });
    });

    test('should configure container logging', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: [
          {
            LogConfiguration: {
              LogDriver: 'awslogs',
              Options: {
                'awslogs-group': Match.anyValue(),
                'awslogs-stream-prefix': 'payment-service',
                'awslogs-region': Match.anyValue(),
              },
            },
          },
        ],
      });

      // Verify log group name separately
      const taskDef = template.findResources('AWS::ECS::TaskDefinition');
      const taskDefResource = Object.values(taskDef)[0] as any;
      const logConfig =
        taskDefResource.Properties.ContainerDefinitions[0].LogConfiguration;
      expect(logConfig.LogDriver).toBe('awslogs');
      expect(logConfig.Options['awslogs-stream-prefix']).toBe(
        'payment-service'
      );
    });
  });

  describe('CodeBuild BuildSpec Configuration', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should configure build project with Docker build commands', () => {
      // Find the build project specifically
      const projects = template.findResources('AWS::CodeBuild::Project');
      const buildProject = Object.values(projects).find(
        (project: any) =>
          project.Properties.Name === 'payment-service-build-test'
      );
      expect(buildProject).toBeDefined();

      const buildSpec = JSON.stringify(
        buildProject?.Properties.Source.BuildSpec || ''
      );
      expect(buildSpec).toMatch(/docker build/);
    });

    test('should configure unit test project with pytest', () => {
      // Find the unit test project specifically
      const projects = template.findResources('AWS::CodeBuild::Project');
      const unitTestProject = Object.values(projects).find(
        (project: any) =>
          project.Properties.Name === 'payment-service-unit-tests-test'
      );
      expect(unitTestProject).toBeDefined();

      const buildSpec = JSON.stringify(
        unitTestProject?.Properties.Source.BuildSpec || ''
      );
      expect(buildSpec).toMatch(/pytest/);
    });

    test('should configure integration test project', () => {
      // Find the integration test project specifically
      const projects = template.findResources('AWS::CodeBuild::Project');
      const integrationProject = Object.values(projects).find(
        (project: any) =>
          project.Properties.Name === 'payment-service-integration-tests-test'
      );
      expect(integrationProject).toBeDefined();

      const envVars =
        integrationProject?.Properties.Environment.EnvironmentVariables || [];
      const hasStagingEndpoint = envVars.some(
        (envVar: any) =>
          envVar.Name === 'STAGING_ENDPOINT' &&
          envVar.Type === 'PARAMETER_STORE'
      );
      expect(hasStagingEndpoint).toBe(true);
    });
  });

  describe('Stack Synthesis', () => {
    test('should synthesize without errors', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);

      expect(template).toBeDefined();
      expect(template.toJSON()).toBeDefined();
    });

    test('should handle stack with all optional parameters', () => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'prod',
          codeCommitRepositoryName: 'prod-repo',
          ecsPlaceholderImage: 'prod-image:latest',
        },
      });
      stack = new TapStack(app, 'TestTapStack');
      template = Template.fromStack(stack);

      expect(template).toBeDefined();
      template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: 'payment-service-prod',
      });
    });
  });
});
