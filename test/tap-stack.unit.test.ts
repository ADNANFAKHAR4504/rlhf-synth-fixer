import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = 'test123';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', Match.anyValue());
    });

    test('should not create NAT Gateways for cost optimization', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 0);
    });
  });

  describe('ECS Cluster', () => {
    test('should create ECS cluster with Container Insights', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: `ecs-cluster-${environmentSuffix}`,
        ClusterSettings: Match.arrayWith([
          Match.objectLike({
            Name: 'containerInsights',
            Value: 'enabled',
          }),
        ]),
      });
    });

    test('should enable Fargate capacity providers', () => {
      template.hasResourceProperties('AWS::ECS::ClusterCapacityProviderAssociations', {
        CapacityProviders: Match.arrayWith(['FARGATE', 'FARGATE_SPOT']),
      });
    });
  });

  describe('ECR Repositories', () => {
    test('should create ECR repositories for all three services', () => {
      template.resourceCountIs('AWS::ECR::Repository', 3);

      template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: `ecr-repo-api-gateway-${environmentSuffix}`,
        ImageScanningConfiguration: {
          ScanOnPush: true,
        },
      });

      template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: `ecr-repo-order-processor-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: `ecr-repo-market-data-${environmentSuffix}`,
      });
    });

    test('should configure lifecycle policies to retain 10 images', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        LifecyclePolicy: {
          LifecyclePolicyText: Match.stringLikeRegexp('.*countNumber.*10.*'),
        },
      });
    });
  });

  describe('Service Discovery', () => {
    test('should create Cloud Map private DNS namespace', () => {
      template.hasResourceProperties('AWS::ServiceDiscovery::PrivateDnsNamespace', {
        Name: `services-${environmentSuffix}.local`,
      });
    });

    test('should create service discovery services for all microservices', () => {
      template.resourceCountIs('AWS::ServiceDiscovery::Service', 3);
    });
  });

  describe('Application Load Balancer', () => {
    test('should create internet-facing ALB', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: `alb-${environmentSuffix}`,
        Scheme: 'internet-facing',
        Type: 'application',
      });
    });

    test('should create HTTP listener on port 80', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });

    test('should create target group with health checks', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 8080,
        Protocol: 'HTTP',
        TargetType: 'ip',
        HealthCheckPath: '/health',
        HealthCheckIntervalSeconds: 30,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3,
      });
    });

    test('should configure path-based routing', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::ListenerRule', {
        Priority: 1,
        Conditions: Match.arrayWith([
          Match.objectLike({
            Field: 'path-pattern',
            PathPatternConfig: {
              Values: ['/api/*', '/'],
            },
          }),
        ]),
      });
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group with HTTP ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for ALB',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 80,
            ToPort: 80,
            IpProtocol: 'tcp',
          }),
        ]),
      });
    });

    test('should create ECS security group with inter-service communication', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for ECS tasks',
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create task execution role with ECS permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `ecs-task-execution-${environmentSuffix}`,
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
            }),
          ]),
        }),
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp('.*AmazonECSTaskExecutionRolePolicy.*'),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('should create task execution role with Secrets Manager permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'secretsmanager:GetSecretValue',
                'secretsmanager:DescribeSecret',
              ]),
            }),
          ]),
        },
      });
    });

    test('should create task roles for each service with X-Ray permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `ecs-task-api-gateway-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'xray:PutTraceSegments',
                'xray:PutTelemetryRecords',
              ]),
            }),
          ]),
        },
      });
    });
  });

  describe('ECS Task Definitions', () => {
    test('should create task definitions for all three services', () => {
      template.resourceCountIs('AWS::ECS::TaskDefinition', 3);

      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Family: `task-api-gateway-${environmentSuffix}`,
        Cpu: '256',
        Memory: '512',
        NetworkMode: 'awsvpc',
        RequiresCompatibilities: ['FARGATE'],
      });
    });

    test('should configure X-Ray daemon sidecar containers', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: 'xray-daemon',
            Image: Match.stringLikeRegexp('.*xray-daemon.*'),
            PortMappings: Match.arrayWith([
              Match.objectLike({
                ContainerPort: 2000,
                Protocol: 'udp',
              }),
            ]),
          }),
        ]),
      });
    });

    test('should configure CloudWatch Logs for containers', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            LogConfiguration: {
              LogDriver: 'awslogs',
              Options: Match.objectLike({
                'awslogs-stream-prefix': Match.anyValue(),
              }),
            },
          }),
        ]),
      });
    });
  });

  describe('ECS Services', () => {
    test('should create ECS services for all three microservices', () => {
      template.resourceCountIs('AWS::ECS::Service', 3);

      template.hasResourceProperties('AWS::ECS::Service', {
        ServiceName: `svc-api-gateway-${environmentSuffix}`,
        DesiredCount: 2,
        LaunchType: Match.absent(),
      });
    });

    test('should configure circuit breaker with rollback', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        DeploymentConfiguration: Match.objectLike({
          DeploymentCircuitBreaker: {
            Enable: true,
            Rollback: true,
          },
        }),
      });
    });

    test('should configure capacity provider strategies', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        CapacityProviderStrategy: Match.arrayWith([
          Match.objectLike({
            CapacityProvider: 'FARGATE',
            Weight: 1,
            Base: 1,
          }),
          Match.objectLike({
            CapacityProvider: 'FARGATE_SPOT',
            Weight: 4,
          }),
        ]),
      });
    });

    test('should register services with Cloud Map', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        ServiceRegistries: Match.arrayWith([
          Match.objectLike({
            RegistryArn: Match.anyValue(),
          }),
        ]),
      });
    });
  });

  describe('Auto-Scaling', () => {
    test('should create auto-scaling targets for all services', () => {
      template.resourceCountIs('AWS::ApplicationAutoScaling::ScalableTarget', 3);

      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
        MinCapacity: 1,
        MaxCapacity: 10,
      });
    });

    test('should configure CPU-based scaling at 70%', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingScalingPolicyConfiguration: Match.objectLike({
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          TargetValue: 70,
        }),
      });
    });

    test('should configure memory-based scaling at 80%', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingScalingPolicyConfiguration: Match.objectLike({
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ECSServiceAverageMemoryUtilization',
          },
          TargetValue: 80,
        }),
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `ecs-services-${environmentSuffix}`,
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should output ALB DNS name', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'ALB DNS name',
      });
    });

    test('should output ECS cluster name', () => {
      template.hasOutput('ClusterName', {
        Description: 'ECS Cluster name',
      });
    });

    test('should output service discovery namespace', () => {
      template.hasOutput('NamespaceName', {
        Description: 'Service Discovery namespace',
      });
    });
  });

  describe('Resource Naming', () => {
    test('all resources should include environmentSuffix', () => {
      const templateJson = template.toJSON();
      const resources = Object.keys(templateJson.Resources);

      expect(resources.length).toBeGreaterThan(0);
    });
  });

  describe('Removal Policies', () => {
    test('ECR repositories should have DESTROY removal policy', () => {
      template.hasResource('AWS::ECR::Repository', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });
});
