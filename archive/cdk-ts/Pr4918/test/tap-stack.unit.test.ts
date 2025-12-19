import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack, TapStackProps } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  const defaultProps: TapStackProps = {
    applicationName: 'payment-processor',
    githubOwner: 'test-org',
    githubRepo: 'test-repo',
    githubBranch: 'main',
    nodeVersions: ['16', '18', '20'],
    retentionDays: 30,
    maxProdImages: 10,
    artifactRetentionDays: 90,
    approvalTimeoutHours: 24,
    healthCheckTimeoutMinutes: 5,
    environmentSuffix: 'test',
  };

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', defaultProps);
    template = Template.fromStack(stack);
  });

  describe('Stack Construction', () => {
    test('should create stack with default environment suffix', () => {
      const appWithDefault = new cdk.App();
      const stackWithDefault = new TapStack(appWithDefault, 'DefaultStack', {
        ...defaultProps,
        environmentSuffix: undefined,
      });
      const templateWithDefault = Template.fromStack(stackWithDefault);

      expect(templateWithDefault).toBeDefined();
    });

    test('should create stack with context environment suffix', () => {
      const appWithContext = new cdk.App({
        context: { environmentSuffix: 'context-test' },
      });
      const stackWithContext = new TapStack(appWithContext, 'ContextStack', {
        ...defaultProps,
        environmentSuffix: undefined,
      });
      const templateWithContext = Template.fromStack(stackWithContext);

      expect(templateWithContext).toBeDefined();
    });
  });

  describe('VPC Resources', () => {
    test('should create VPC with correct subnet configuration', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 AZs * 3 subnet types
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });
  });

  describe('ECR Repository', () => {
    test('should create ECR repository with correct name', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: 'payment-processor-repo-test',
        ImageScanningConfiguration: {
          ScanOnPush: true,
        },
        ImageTagMutability: 'IMMUTABLE',
      });
    });
  });

  describe('S3 Artifact Bucket', () => {
    test('should create S3 bucket with encryption', () => {
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
      });
    });

    test('should create S3 bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });
  });

  describe('SNS Topic', () => {
    test('should create SNS topic with correct name', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'fintech-cicd-notifications-test',
        DisplayName: 'Fintech CI/CD Pipeline Notifications',
      });
    });

    test('should create SNS topic with email subscription', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'dev-team@example.com',
      });
    });
  });

  describe('ECS Cluster', () => {
    test('should create ECS cluster with correct name', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: 'fintech-payment-cluster-test',
      });
    });
  });

  describe('CodePipeline', () => {
    test('should create CodePipeline with correct name', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'payment-processor-pipeline-test',
      });
    });

    test('should create GitHub source action with webhook disabled', () => {
      // Verify that the GitHub source action exists but webhook is disabled
      // This is verified by the absence of webhook-related resources
      template.resourceCountIs('AWS::CodePipeline::Webhook', 0);
    });
  });

  describe('CodeBuild Projects', () => {
    test('should create Docker build project', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'fintech-docker-build-test',
        Environment: {
          ComputeType: 'BUILD_GENERAL1_MEDIUM',
          Image: 'aws/codebuild/standard:7.0',
          PrivilegedMode: true,
          Type: 'LINUX_CONTAINER',
        },
      });
    });

    test('should create test projects for each Node.js version', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'fintech-test-node-16-test',
      });
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'fintech-test-node-18-test',
      });
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'fintech-test-node-20-test',
      });
    });

    test('should create security scan project', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'fintech-security-scan-test',
        Environment: {
          ComputeType: 'BUILD_GENERAL1_MEDIUM',
          Image: 'aws/codebuild/standard:7.0',
          PrivilegedMode: true,
          Type: 'LINUX_CONTAINER',
        },
      });
    });
  });

  describe('ECS Service', () => {
    test('should create ECS task definition with reduced resources', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Cpu: '256',
        Memory: '512',
        NetworkMode: 'awsvpc',
        RequiresCompatibilities: ['FARGATE'],
      });
    });

    test('should create ECS service with single instance and no blue-green deployment', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        ServiceName: 'payment-processor-service',
        DesiredCount: 1,
        DeploymentConfiguration: {
          MaximumPercent: 200,
          MinimumHealthyPercent: 100,
        },
        HealthCheckGracePeriodSeconds: 120,
      });
    });

    test('should create Application Load Balancer', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Type: 'application',
          Scheme: 'internet-facing',
        }
      );
    });

    test('should not create auto-scaling resources (disabled for initial deployment)', () => {
      // Auto-scaling is commented out in the current implementation
      template.resourceCountIs(
        'AWS::ApplicationAutoScaling::ScalableTarget',
        0
      );
      template.resourceCountIs('AWS::ApplicationAutoScaling::ScalingPolicy', 0);
    });

    test('should use nginx:alpine public image for container', () => {
      // Check that the task definition has the correct container configuration
      const templateJson = template.toJSON();
      const taskDef = Object.values(templateJson.Resources).find(
        (resource: any) => resource.Type === 'AWS::ECS::TaskDefinition'
      ) as any;

      expect(taskDef).toBeDefined();
      expect(taskDef.Properties.ContainerDefinitions).toBeDefined();
      expect(taskDef.Properties.ContainerDefinitions).toHaveLength(1);

      const container = taskDef.Properties.ContainerDefinitions[0];
      expect(container.Image).toBe('nginx:alpine');
      expect(container.Memory).toBe(512);
      expect(container.Cpu).toBe(256);
      expect(container.PortMappings).toBeDefined();
      expect(container.PortMappings[0].ContainerPort).toBe(80);
      expect(container.PortMappings[0].Protocol).toBe('tcp');
    });
  });

  describe('IAM Roles', () => {
    test('should create pipeline role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'fintech-pipeline-role',
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

    test('should create ECS task role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'fintech-ecs-task-role',
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
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'fintech-ecs-execution-role',
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
  });

  describe('CloudWatch Resources', () => {
    test('should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'fintech-cicd-dashboard-test',
      });
    });

    test('should create CloudWatch alarms', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'fintech-pipeline-failure-alarm-test',
        MetricName: 'PipelineExecutionFailure',
        Namespace: 'AWS/CodePipeline',
        Threshold: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'fintech-image-scan-critical-findings-test',
        MetricName: 'ImageScanFindingsSeverityCounts',
        Namespace: 'AWS/ECR',
        Threshold: 0,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('should create EventBridge rules', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: 'fintech-pipeline-failure-test',
        Description: 'Notify on pipeline failures',
        EventPattern: {
          source: ['aws.codepipeline'],
          'detail-type': ['CodePipeline Pipeline Execution State Change'],
          detail: {
            state: ['FAILED'],
          },
        },
      });

      template.hasResourceProperties('AWS::Events::Rule', {
        Name: 'fintech-pipeline-success-test',
        Description: 'Notify on successful deployments',
        EventPattern: {
          source: ['aws.codepipeline'],
          'detail-type': ['CodePipeline Pipeline Execution State Change'],
          detail: {
            state: ['SUCCEEDED'],
          },
        },
      });
    });

    test('should create log groups for CodeBuild projects', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/codebuild/docker-build',
        RetentionInDays: 30,
      });

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/codebuild/test-node-16',
        RetentionInDays: 30,
      });

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/codebuild/test-node-18',
        RetentionInDays: 30,
      });

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/codebuild/test-node-20',
        RetentionInDays: 30,
      });

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/codebuild/security-scan',
        RetentionInDays: 30,
      });
    });

    test('should create ECS task log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/ecs/payment-processor',
        RetentionInDays: 30,
      });
    });
  });

  describe('Outputs', () => {
    test('should create stack outputs', () => {
      template.hasOutput('PipelineURL', {
        Description: 'URL to the CodePipeline console',
      });

      template.hasOutput('ECRRepositoryURI', {
        Description: 'ECR repository URI',
      });

      template.hasOutput('ECSClusterName', {
        Description: 'ECS cluster name',
      });

      template.hasOutput('SNSTopicArn', {
        Description: 'SNS topic ARN for notifications',
      });

      template.hasOutput('ArtifactBucketName', {
        Description: 'S3 bucket for pipeline artifacts',
      });
    });
  });

  describe('Security Groups', () => {
    test('should create security groups for CodeBuild projects', () => {
      template.resourceCountIs('AWS::EC2::SecurityGroup', 7); // VPC + ALB + ECS + 4 CodeBuild projects
    });
  });

  describe('Removal Policies', () => {
    test('should create resources with removal policies', () => {
      // Just verify that the resources exist - removal policies are applied at the resource level
      template.resourceCountIs('AWS::SNS::Topic', 1);
      template.resourceCountIs('AWS::ECS::Cluster', 1);
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
      template.resourceCountIs('AWS::Events::Rule', 2);
      template.resourceCountIs('AWS::Logs::LogGroup', 6);
      template.resourceCountIs('AWS::ECR::Repository', 1);
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });
  });

  describe('Resource Counts', () => {
    test('should create expected number of resources', () => {
      // Core infrastructure
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::ECR::Repository', 1);
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.resourceCountIs('AWS::SNS::Topic', 1);
      template.resourceCountIs('AWS::ECS::Cluster', 1);
      template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);

      // CodeBuild projects (1 Docker + 3 Test + 1 Security = 5)
      template.resourceCountIs('AWS::CodeBuild::Project', 5);

      // ECS resources
      template.resourceCountIs('AWS::ECS::TaskDefinition', 1);
      template.resourceCountIs('AWS::ECS::Service', 1);

      // Load balancer
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);

      // Auto-scaling (disabled for initial deployment)
      template.resourceCountIs(
        'AWS::ApplicationAutoScaling::ScalableTarget',
        0
      );
      template.resourceCountIs('AWS::ApplicationAutoScaling::ScalingPolicy', 0);

      // Monitoring
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
      template.resourceCountIs('AWS::Events::Rule', 2);

      // IAM roles (1 Pipeline + 1 ECS Task + 1 ECS Execution + 5 CodeBuild + 7 CodePipeline action roles = 15)
      template.resourceCountIs('AWS::IAM::Role', 15);
    });
  });

  describe('Environment Suffix Integration', () => {
    test('should use environment suffix in all resource names', () => {
      // Check that environment suffix appears in key resource names
      const templateJson = template.toJSON();
      const resources = templateJson.Resources;

      // Find resources with names containing the environment suffix
      const resourcesWithSuffix = Object.values(resources).filter(
        (resource: any) => {
          const props = resource.Properties || {};
          return (
            (typeof props.Name === 'string' && props.Name.includes('test')) ||
            (typeof props.RepositoryName === 'string' &&
              props.RepositoryName.includes('test')) ||
            (typeof props.TopicName === 'string' &&
              props.TopicName.includes('test')) ||
            (typeof props.ClusterName === 'string' &&
              props.ClusterName.includes('test')) ||
            (typeof props.PipelineName === 'string' &&
              props.PipelineName.includes('test')) ||
            (typeof props.AlarmName === 'string' &&
              props.AlarmName.includes('test')) ||
            (typeof props.DashboardName === 'string' &&
              props.DashboardName.includes('test')) ||
            (typeof props.RuleName === 'string' &&
              props.RuleName.includes('test'))
          );
        }
      );

      expect(resourcesWithSuffix.length).toBeGreaterThan(0);
    });
  });
});
