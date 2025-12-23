import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test-dev';

describe('TapStack - CI/CD Pipeline Integration', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  describe('Pipeline Infrastructure (deployEcsServices=false)', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix,
        deployEcsServices: false,
      });
      template = Template.fromStack(stack);
    });

    test('creates KMS key for artifact encryption', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        Description: `Pipeline artifact encryption key ${environmentSuffix}`,
      });
    });

    test('creates ECR repository with security features', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: `app-repo-${environmentSuffix}`,
        ImageScanningConfiguration: {
          ScanOnPush: true,
        },
        ImageTagMutability: 'IMMUTABLE',
        LifecyclePolicy: Match.objectLike({
          LifecyclePolicyText: Match.stringLikeRegexp('Keep last 10 images'),
        }),
      });
    });

    test('creates S3 bucket with KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [{
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'aws:kms',
            },
          }],
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

    test('creates CodeBuild project for Docker builds', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `docker-build-${environmentSuffix}`,
        Environment: {
          Type: 'LINUX_CONTAINER',
          Image: 'aws/codebuild/standard:7.0',
          PrivilegedMode: true,
          ComputeType: 'BUILD_GENERAL1_SMALL',
        },
      });
    });

    test('creates CodeBuild project for security scanning', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `security-scan-${environmentSuffix}`,
        Environment: {
          Type: 'LINUX_CONTAINER',
          ComputeType: 'BUILD_GENERAL1_SMALL',
        },
      });
    });

    test('creates CodePipeline with proper stages', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: `container-pipeline-${environmentSuffix}`,
        Stages: Match.arrayWith([
          Match.objectLike({ Name: 'Source' }),
          Match.objectLike({ Name: 'Build' }),
          Match.objectLike({ Name: 'Test' }),
        ]),
      });
    });

    test('creates CloudWatch log groups for CodeBuild', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 2);
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/codebuild/docker-build-${environmentSuffix}`,
        RetentionInDays: 7,
      });
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/codebuild/security-scan-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });

    test('creates SNS topic for notifications', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: `CI/CD Pipeline Notifications - ${environmentSuffix}`,
      });
    });

    test('creates CloudWatch alarms for pipeline monitoring', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `pipeline-failure-${environmentSuffix}`,
        AlarmDescription: 'Alert on pipeline execution failures',
      });
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `pipeline-success-${environmentSuffix}`,
        AlarmDescription: 'Alert on successful production deployments',
      });
    });

    test('creates IAM roles with least privilege', () => {
      // Build role
      template.hasResourceProperties('AWS::IAM::Role', {
        Description: Match.stringLikeRegexp('CodeBuild to build Docker images'),
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
            }),
          ]),
        }),
      });

      // Test role
      template.hasResourceProperties('AWS::IAM::Role', {
        Description: Match.stringLikeRegexp('CodeBuild to run tests and security scans'),
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
            }),
          ]),
        }),
      });

      // Pipeline role
      template.hasResourceProperties('AWS::IAM::Role', {
        Description: Match.stringLikeRegexp('CodePipeline orchestration'),
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'codepipeline.amazonaws.com',
              },
            }),
          ]),
        }),
      });
    });

    test('does NOT create VPC when ECS services disabled', () => {
      template.resourceCountIs('AWS::EC2::VPC', 0);
    });

    test('does NOT create ECS clusters when ECS services disabled', () => {
      template.resourceCountIs('AWS::ECS::Cluster', 0);
    });

    test('does NOT create ECS services when ECS services disabled', () => {
      template.resourceCountIs('AWS::ECS::Service', 0);
    });

    test('pipeline does NOT have ECS deployment stages when disabled', () => {
      const pipelineResource = template.findResources('AWS::CodePipeline::Pipeline');
      const pipelineProps = Object.values(pipelineResource)[0].Properties;
      const stageNames = pipelineProps.Stages.map((stage: any) => stage.Name);
      expect(stageNames).not.toContain('DeployStaging');
      expect(stageNames).not.toContain('DeployProduction');
      expect(stageNames).not.toContain('ApproveProduction');
    });

    test('applies resource tags correctly', () => {
      const resources = template.toJSON().Resources;
      const taggedResources = Object.values(resources).filter((resource: any) =>
        resource.Properties?.Tags || resource.Metadata?.['aws:cdk:path']
      );
      expect(taggedResources.length).toBeGreaterThan(0);
    });

    test('creates CloudFormation outputs for key resources', () => {
      template.hasOutput('PipelineName', {
        Description: 'Name of the CodePipeline',
        Export: {
          Name: `PipelineName-${environmentSuffix}`,
        },
      });
      template.hasOutput('ECRRepositoryUri', {
        Description: 'URI of the ECR repository',
      });
      template.hasOutput('ArtifactBucketName', {
        Description: 'Name of the artifact bucket',
      });
      template.hasOutput('NotificationTopicArn', {
        Description: 'ARN of the notification SNS topic',
      });
    });

    test('does NOT output ECS service names when disabled', () => {
      const outputs = template.toJSON().Outputs || {};
      expect(outputs.StagingServiceName).toBeUndefined();
      expect(outputs.ProductionServiceName).toBeUndefined();
    });
  });

  describe('Full Infrastructure (deployEcsServices=true)', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStackWithEcs', {
        environmentSuffix: `${environmentSuffix}-ecs`,
        deployEcsServices: true,
      });
      template = Template.fromStack(stack);
    });

    test('creates VPC when ECS services enabled', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `pipeline-vpc-${environmentSuffix}-ecs`,
          }),
        ]),
      });
    });

    test('creates staging ECS cluster', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: `staging-cluster-${environmentSuffix}-ecs`,
        ClusterSettings: [{
          Name: 'containerInsights',
          Value: 'enabled',
        }],
      });
    });

    test('creates production ECS cluster', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: `production-cluster-${environmentSuffix}-ecs`,
        ClusterSettings: [{
          Name: 'containerInsights',
          Value: 'enabled',
        }],
      });
    });

    test('creates staging Fargate task definition', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Family: `staging-task-${environmentSuffix}-ecs`,
        Cpu: '256',
        Memory: '512',
        NetworkMode: 'awsvpc',
        RequiresCompatibilities: ['FARGATE'],
      });
    });

    test('creates production Fargate task definition', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Family: `production-task-${environmentSuffix}-ecs`,
        Cpu: '512',
        Memory: '1024',
        NetworkMode: 'awsvpc',
        RequiresCompatibilities: ['FARGATE'],
      });
    });

    test('creates staging ECS service with circuit breaker', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        ServiceName: `staging-service-${environmentSuffix}-ecs`,
        DesiredCount: 1,
        DeploymentConfiguration: {
          DeploymentCircuitBreaker: {
            Enable: true,
            Rollback: true,
          },
        },
      });
    });

    test('creates production ECS service with circuit breaker', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        ServiceName: `production-service-${environmentSuffix}-ecs`,
        DesiredCount: 2,
        DeploymentConfiguration: {
          DeploymentCircuitBreaker: {
            Enable: true,
            Rollback: true,
          },
        },
      });
    });

    test('pipeline includes ECS deployment stages when enabled', () => {
      const pipelineResource = template.findResources('AWS::CodePipeline::Pipeline');
      const pipelineProps = Object.values(pipelineResource)[0].Properties;
      const stageNames = pipelineProps.Stages.map((stage: any) => stage.Name);
      expect(stageNames).toContain('DeployStaging');
      expect(stageNames).toContain('ApproveProduction');
      expect(stageNames).toContain('DeployProduction');
    });

    test('outputs ECS service names when enabled', () => {
      template.hasOutput('StagingServiceName', {
        Description: 'Name of the staging ECS service',
      });
      template.hasOutput('ProductionServiceName', {
        Description: 'Name of the production ECS service',
      });
    });
  });

  describe('Cross-Account Deployment', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestCrossAccountStack', {
        environmentSuffix: `${environmentSuffix}-xacct`,
        stagingAccountId: '111111111111',
        productionAccountId: '222222222222',
        deployEcsServices: false,
      });
      template = Template.fromStack(stack);
    });

    test('creates cross-account deployment role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Description: Match.stringLikeRegexp('cross-account deployments from pipeline'),
        AssumeRolePolicyDocument: {
          Statement: [{
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              AWS: {
                'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':iam::222222222222:root']],
              },
            },
          }],
        },
      });
    });

    test('outputs cross-account role ARN', () => {
      template.hasOutput('CrossAccountRoleArn', {
        Description: 'ARN of cross-account deployment role',
        Export: {
          Name: `CrossAccountDeployRole-${environmentSuffix}-xacct`,
        },
      });
    });
  });
});
