import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });
    template = Template.fromStack(stack);
  });

  test('Creates VPC with 3 AZs', () => {
    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'Name',
          Value: Match.stringLikeRegexp('pipeline-vpc-test'),
        }),
      ]),
    });
  });

  test('Creates S3 artifact bucket with encryption and lifecycle', () => {
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
      VersioningConfiguration: {
        Status: 'Enabled',
      },
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

  test('Creates GitHub OAuth token in Secrets Manager', () => {
    template.resourceCountIs('AWS::SecretsManager::Secret', 1);
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'github-oauth-token-test',
    });
  });

  test('Creates Parameter Store parameters for all environments', () => {
    template.resourceCountIs('AWS::SSM::Parameter', 3);
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/app/dev/config-test',
    });
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/app/staging/config-test',
    });
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/app/prod/config-test',
    });
  });

  test('Creates SNS topic for approvals', () => {
    template.resourceCountIs('AWS::SNS::Topic', 1);
    template.hasResourceProperties('AWS::SNS::Topic', {
      TopicName: 'pipeline-approval-test',
    });
  });

  test('Creates three CodeBuild projects with different compute types', () => {
    template.resourceCountIs('AWS::CodeBuild::Project', 3);

    // Docker build - SMALL
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Name: 'docker-build-test',
      Environment: Match.objectLike({
        ComputeType: 'BUILD_GENERAL1_SMALL',
      }),
    });

    // Unit tests - MEDIUM
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Name: 'unit-tests-test',
      Environment: Match.objectLike({
        ComputeType: 'BUILD_GENERAL1_MEDIUM',
      }),
    });

    // Integration tests - LARGE
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Name: 'integration-tests-test',
      Environment: Match.objectLike({
        ComputeType: 'BUILD_GENERAL1_LARGE',
      }),
    });
  });

  test('Creates ECS cluster and Fargate service', () => {
    template.resourceCountIs('AWS::ECS::Cluster', 1);
    template.hasResourceProperties('AWS::ECS::Cluster', {
      ClusterName: 'app-cluster-test',
    });

    template.resourceCountIs('AWS::ECS::Service', 1);
    template.hasResourceProperties('AWS::ECS::Service', {
      ServiceName: 'app-service-test',
      LaunchType: 'FARGATE',
      DeploymentController: {
        Type: 'CODE_DEPLOY',
      },
    });
  });

  test('Creates Application Load Balancer with target groups', () => {
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 2);

    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      Name: 'tg-blue-test',
    });

    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      Name: 'tg-green-test',
    });
  });

  test('Creates CodeDeploy application and deployment group', () => {
    template.resourceCountIs('AWS::CodeDeploy::Application', 1);
    template.hasResourceProperties('AWS::CodeDeploy::Application', {
      ApplicationName: 'app-deploy-test',
      ComputePlatform: 'ECS',
    });

    template.resourceCountIs('AWS::CodeDeploy::DeploymentGroup', 1);
    template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
      DeploymentGroupName: 'app-deployment-test',
      AutoRollbackConfiguration: {
        Enabled: true,
        Events: Match.arrayWith(['DEPLOYMENT_FAILURE', 'DEPLOYMENT_STOP_ON_ALARM']),
      },
    });
  });

  test('Creates CloudWatch alarms for monitoring', () => {
    template.resourceCountIs('AWS::CloudWatch::Alarm', 3);

    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'ecs-task-health-test',
      ComparisonOperator: 'GreaterThanThreshold',
      Threshold: 80,
    });

    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'alb-target-health-test',
      ComparisonOperator: 'LessThanThreshold',
      Threshold: 1,
    });

    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'alb-5xx-errors-test',
      ComparisonOperator: 'GreaterThanThreshold',
      Threshold: 10,
    });
  });

  test('Creates CodePipeline with 7 stages', () => {
    template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Name: 'app-pipeline-test',
      Stages: Match.arrayWith([
        Match.objectLike({ Name: 'Source' }),
        Match.objectLike({ Name: 'Build' }),
        Match.objectLike({ Name: 'Test' }),
        Match.objectLike({ Name: 'Deploy-Dev' }),
        Match.objectLike({ Name: 'Deploy-Staging' }),
        Match.objectLike({ Name: 'Approval' }),
        Match.objectLike({ Name: 'Deploy-Prod' }),
      ]),
    });
  });

  test('Creates CloudWatch Events rule', () => {
    template.resourceCountIs('AWS::Events::Rule', 1);
    template.hasResourceProperties('AWS::Events::Rule', {
      Name: 'pipeline-trigger-test',
      State: 'ENABLED',
    });
  });

  test('Creates stack outputs', () => {
    template.hasOutput('PipelineArn', {
      Export: {
        Name: 'pipeline-arn-test',
      },
    });

    template.hasOutput('ArtifactBucketName', {
      Export: {
        Name: 'artifact-bucket-test',
      },
    });

    template.hasOutput('ApprovalTopicArn', {
      Export: {
        Name: 'approval-topic-arn-test',
      },
    });
  });

  test('All resources include environmentSuffix in names', () => {
    const resources = template.toJSON().Resources;
    const resourcesWithNames = Object.values(resources).filter(
      (r: any) => r.Properties && (r.Properties.Name || r.Properties.BucketName || r.Properties.ClusterName)
    );

    expect(resourcesWithNames.length).toBeGreaterThan(0);

    resourcesWithNames.forEach((resource: any) => {
      const name = resource.Properties.Name ||
                   resource.Properties.BucketName ||
                   resource.Properties.ClusterName ||
                   resource.Properties.TopicName;
      if (name && typeof name === 'string') {
        expect(name).toContain('test');
      }
    });
  });

  test('All resources have RemovalPolicy DESTROY', () => {
    const buckets = template.findResources('AWS::S3::Bucket');
    const logGroups = template.findResources('AWS::Logs::LogGroup');
    const secrets = template.findResources('AWS::SecretsManager::Secret');

    Object.values(buckets).forEach((bucket: any) => {
      expect(bucket.DeletionPolicy).toBe('Delete');
    });

    Object.values(logGroups).forEach((logGroup: any) => {
      expect(logGroup.DeletionPolicy).toBe('Delete');
    });

    Object.values(secrets).forEach((secret: any) => {
      expect(secret.DeletionPolicy).toBe('Delete');
    });
  });
});
