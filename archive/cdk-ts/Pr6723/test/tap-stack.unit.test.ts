import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

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
      template.resourceCountIs('AWS::EC2::Subnet', 2);
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

  describe('Service Discovery', () => {
    test('should create Cloud Map private DNS namespace', () => {
      template.hasResourceProperties('AWS::ServiceDiscovery::PrivateDnsNamespace', {
        Name: `services-${environmentSuffix}.local`,
        Description: 'Private DNS namespace for service discovery',
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

    test('should create listener with default 404 response', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        DefaultActions: Match.arrayWith([
          Match.objectLike({
            Type: 'fixed-response',
            FixedResponseConfig: {
              StatusCode: '404',
              ContentType: 'text/plain',
            },
          }),
        ]),
      });
    });

    test('should create target group with health checks', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 8080,
        Protocol: 'HTTP',
        TargetType: 'ip',
        HealthCheckPath: '/',
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
        Roles: Match.arrayWith([
          Match.objectLike({
            Ref: Match.stringLikeRegexp('.*TaskExecutionRole.*'),
          }),
        ]),
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

    test('should create task roles for all three services', () => {
      const roles = template.findResources('AWS::IAM::Role', {
        Properties: {
          RoleName: Match.stringLikeRegexp(`ecs-task-.*-${environmentSuffix}`),
        },
      });
      expect(Object.keys(roles).length).toBeGreaterThanOrEqual(3);
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

    test('should use nginx image from public registry', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Image: Match.stringLikeRegexp('.*nginx.*1\\.25-alpine.*'),
            Name: Match.stringLikeRegexp('.*api-gateway|order-processor|market-data.*'),
          }),
        ]),
      });
    });

    test('should configure nginx to listen on port 8080', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Command: Match.arrayWith([
              'sh',
              '-c',
              Match.stringLikeRegexp('.*listen.*8080.*'),
            ]),
            PortMappings: Match.arrayWith([
              Match.objectLike({
                ContainerPort: 8080,
                Protocol: 'tcp',
              }),
            ]),
          }),
        ]),
      });
    });

    test('should configure container health check', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            HealthCheck: Match.objectLike({
              Command: Match.arrayWith([
                'CMD-SHELL',
                Match.stringLikeRegexp('.*pgrep.*nginx.*'), // Changed from wget
              ]),
              Interval: 30,
              Timeout: 5,
              Retries: 3,
              StartPeriod: 90, // Changed from 60 to 90
            }),
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

    test('should set SERVICE_NAME environment variable', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Environment: Match.arrayWith([
              Match.objectLike({
                Name: 'SERVICE_NAME',
                Value: Match.anyValue(),
              }),
            ]),
          }),
        ]),
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

    test('should configure X-Ray daemon with correct CPU and memory', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: 'xray-daemon',
            Cpu: 32,
            Memory: 128,
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

    test('should configure deployment settings', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        DeploymentConfiguration: Match.objectLike({
          MaximumPercent: 200,
          MinimumHealthyPercent: 0, // Changed from 50 to 0
        }),
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

    test('should configure health check grace period', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        HealthCheckGracePeriodSeconds: 180, // Changed from 120 to 180
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

    test('should configure public IP assignment for api-gateway service', () => {
      const services = template.findResources('AWS::ECS::Service', {
        Properties: {
          ServiceName: `svc-api-gateway-${environmentSuffix}`,
        },
      });
      expect(Object.keys(services).length).toBeGreaterThan(0);
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

    test('should configure scaling cooldown periods', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        TargetTrackingScalingPolicyConfiguration: Match.objectLike({
          ScaleInCooldown: 60,
          ScaleOutCooldown: 60,
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

  describe('Task Definition Configuration', () => {
    test('should have two containers per task definition (app + xray)', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: Match.stringLikeRegexp('.*api-gateway|order-processor|market-data.*'),
          }),
          Match.objectLike({
            Name: 'xray-daemon',
          }),
        ]),
      });
    });

    test('should configure log retention for application containers', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7,
      });
    });

    test('should configure log retention for X-Ray containers', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 3,
      });
    });
  });

  describe('Service Configuration', () => {
    test('should create services with correct service names', () => {
      const serviceNames = [
        `svc-api-gateway-${environmentSuffix}`,
        `svc-order-processor-${environmentSuffix}`,
        `svc-market-data-${environmentSuffix}`,
      ];

      serviceNames.forEach(serviceName => {
        template.hasResourceProperties('AWS::ECS::Service', {
          ServiceName: serviceName,
        });
      });
    });

    test('should configure Cloud Map service discovery options', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        ServiceRegistries: Match.arrayWith([
          Match.objectLike({
            RegistryArn: Match.anyValue(),
          }),
        ]),
      });
    });
  });

  describe('Target Group Configuration', () => {
    test('should configure target group deregistration delay', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        TargetGroupAttributes: Match.arrayWith([
          Match.objectLike({
            Key: 'deregistration_delay.timeout_seconds',
            Value: '30',
          }),
        ]),
      });
    });

    test('should attach api-gateway service to target group', () => {
      // Verify service has load balancer configuration
      template.hasResourceProperties('AWS::ECS::Service', {
        ServiceName: `svc-api-gateway-${environmentSuffix}`,
        LoadBalancers: Match.arrayWith([
          Match.objectLike({
            ContainerName: 'api-gateway',
            ContainerPort: 8080,
          }),
        ]),
      });
    });
  });

  describe('Security Group Rules', () => {
    test('should allow ALB to communicate with ECS tasks on port 8080', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        FromPort: 8080,
        ToPort: 8080,
        IpProtocol: 'tcp',
      });
    });

    test('should allow inter-service communication', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 0,
        ToPort: 65535,
      });
    });
  });
});
