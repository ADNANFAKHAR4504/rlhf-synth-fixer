import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { EcsDeploymentConstruct } from '../lib/ecs-deployment-construct';

describe('EcsDeploymentConstruct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let vpc: ec2.Vpc;
  let repository: ecr.Repository;
  let deployment: EcsDeploymentConstruct;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');

    vpc = new ec2.Vpc(stack, 'TestVpc', {
      maxAzs: 2,
      natGateways: 0,
    });

    repository = new ecr.Repository(stack, 'TestRepo', {
      repositoryName: 'test-repo',
    });

    deployment = new EcsDeploymentConstruct(stack, 'TestDeployment', {
      environmentSuffix: 'test',
      vpc,
      ecrRepository: repository,
    });

    template = Template.fromStack(stack);
  });

  test('Construct is created successfully', () => {
    expect(deployment).toBeDefined();
    expect(deployment.cluster).toBeDefined();
    expect(deployment.service).toBeDefined();
    expect(deployment.loadBalancer).toBeDefined();
    expect(deployment.taskDefinition).toBeDefined();
  });

  test('ECS Cluster is created with correct name', () => {
    template.hasResourceProperties('AWS::ECS::Cluster', {
      ClusterName: 'cicd-cluster-test',
    });
  });

  test('Container Insights is enabled', () => {
    template.hasResourceProperties('AWS::ECS::Cluster', {
      ClusterSettings: [
        {
          Name: 'containerInsights',
          Value: 'enabled',
        },
      ],
    });
  });

  test('Task Execution Role is created', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'cicd-task-exec-role-test',
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
          }),
        ]),
      }),
    });
  });

  test('Task Role is created', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'cicd-task-role-test',
    });
  });

  test('CloudWatch Log Group is created', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/ecs/cicd-app-test',
      RetentionInDays: 7,
    });
  });

  test('Fargate Task Definition is created', () => {
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      Family: 'cicd-app-test',
      Cpu: '256',
      Memory: '512',
      NetworkMode: 'awsvpc',
      RequiresCompatibilities: ['FARGATE'],
    });
  });

  test('Container has health check configured', () => {
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          HealthCheck: {
            Command: ['CMD-SHELL', 'curl -f http://localhost:8080/health || exit 1'],
            Interval: 30,
            Timeout: 5,
            Retries: 3,
            StartPeriod: 60,
          },
        }),
      ]),
    });
  });

  test('Container has environment variables', () => {
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Environment: [
            {
              Name: 'ENVIRONMENT',
              Value: 'test',
            },
          ],
        }),
      ]),
    });
  });

  test('Application Load Balancer is created', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      Name: 'cicd-alb-test',
      Scheme: 'internet-facing',
      Type: 'application',
    });
  });

  test('Target Group is created with health check', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      Name: 'cicd-tg-test',
      Port: 8080,
      Protocol: 'HTTP',
      TargetType: 'ip',
      HealthCheckIntervalSeconds: 30,
      HealthCheckPath: '/health',
    });
  });

  test('HTTP Listener is created on port 80', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 80,
      Protocol: 'HTTP',
    });
  });

  test('ECS Service is created with Fargate launch type', () => {
    template.hasResourceProperties('AWS::ECS::Service', {
      ServiceName: 'cicd-service-test',
      LaunchType: 'FARGATE',
      DesiredCount: 2,
    });
  });

  test('ECS Service has circuit breaker enabled', () => {
    template.hasResourceProperties('AWS::ECS::Service', {
      DeploymentConfiguration: Match.objectLike({
        DeploymentCircuitBreaker: {
          Enable: true,
          Rollback: true,
        },
      }),
    });
  });

  test('ECS Service uses public subnets', () => {
    template.hasResourceProperties('AWS::ECS::Service', {
      NetworkConfiguration: {
        AwsvpcConfiguration: Match.objectLike({
          AssignPublicIp: 'ENABLED',
        }),
      },
    });
  });

  test('Security Group for ECS tasks is created', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupName: 'cicd-ecs-sg-test',
      GroupDescription: 'Security group for ECS tasks',
    });
  });

  test('Auto Scaling is configured', () => {
    template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
      MinCapacity: 2,
      MaxCapacity: 10,
    });
  });

  test('CPU-based auto scaling policy is created', () => {
    template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
      TargetTrackingScalingPolicyConfiguration: {
        PredefinedMetricSpecification: {
          PredefinedMetricType: 'ECSServiceAverageCPUUtilization',
        },
        TargetValue: 70,
      },
    });
  });

  test('Memory-based auto scaling policy is created', () => {
    template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
      TargetTrackingScalingPolicyConfiguration: {
        PredefinedMetricSpecification: {
          PredefinedMetricType: 'ECSServiceAverageMemoryUtilization',
        },
        TargetValue: 80,
      },
    });
  });
});
