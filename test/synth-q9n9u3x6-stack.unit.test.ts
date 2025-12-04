import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { SynthQ9n9u3x6Stack } from '../lib/synth-q9n9u3x6-stack';

describe('SynthQ9n9u3x6Stack Unit Tests', () => {
  let app: cdk.App;
  let stack: SynthQ9n9u3x6Stack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App({
      context: {
        environmentSuffix: 'test123',
      },
    });
    stack = new SynthQ9n9u3x6Stack(app, 'TestStack', {
      env: { region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  describe('Requirement #1: CPU/Memory Allocation', () => {
    test('task definition has proper CPU and memory (512/1024)', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Cpu: '512',
        Memory: '1024',
      });
    });

    test('task definition uses Fargate compatibility', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        RequiresCompatibilities: ['FARGATE'],
        NetworkMode: 'awsvpc',
      });
    });
  });

  describe('Requirement #2: Auto-Scaling', () => {
    test('scalable target is created with correct min/max capacity', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
        MinCapacity: 1,
        MaxCapacity: 5,
        ServiceNamespace: 'ecs',
      });
    });

    test('CPU-based scaling policy is configured', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingScalingPolicyConfiguration: {
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          TargetValue: 70,
        },
      });
    });
  });

  describe('Requirement #3: Health Checks', () => {
    test('target group has proper health check configuration', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        HealthCheckEnabled: true,
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 5,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3,
        HealthCheckPath: '/health',
      });
    });
  });

  describe('Requirement #4: Container Insights', () => {
    test('ECS cluster has Container Insights enabled', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterSettings: [
          {
            Name: 'containerInsights',
            Value: 'enabled',
          },
        ],
      });
    });
  });

  describe('Requirement #5: Log Retention', () => {
    test('CloudWatch log group has 7-day retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/ecs/api-test123',
        RetentionInDays: 7,
      });
    });

    test('log group has DESTROY removal policy', () => {
      template.hasResource('AWS::Logs::LogGroup', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('Requirement #6: Fargate Spot', () => {
    test('cluster capacity provider associations include FARGATE_SPOT', () => {
      template.hasResourceProperties('AWS::ECS::ClusterCapacityProviderAssociations', {
        CapacityProviders: Match.arrayWith(['FARGATE_SPOT', 'FARGATE']),
        DefaultCapacityProviderStrategy: Match.arrayWith([
          Match.objectLike({
            CapacityProvider: 'FARGATE_SPOT',
            Weight: 1,
          }),
        ]),
      });
    });

    test('service uses FARGATE_SPOT capacity provider', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        CapacityProviderStrategy: Match.arrayWith([
          Match.objectLike({
            CapacityProvider: 'FARGATE_SPOT',
            Weight: 1,
          }),
        ]),
      });
    });
  });

  describe('Requirement #7: Task Execution Role', () => {
    test('task execution role exists with proper trust policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
            }),
          ]),
        },
        RoleName: 'ecs-task-execution-role-test123',
      });
    });

    test('task execution role has ECR and CloudWatch permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp('.*AmazonECSTaskExecutionRolePolicy'),
              ]),
            ]),
          }),
        ]),
      });
    });
  });

  describe('Requirement #8: Tagging Strategy', () => {
    test('stack has proper tags applied', () => {
      const stackTags = (stack as any).tags?.tags || {};
      expect(stackTags['Environment']).toBe('test123');
      expect(stackTags['Service']).toBe('ecs-api');
      expect(stackTags['ManagedBy']).toBe('cdk');
      expect(stackTags['CostCenter']).toBe('development');
    });
  });

  describe('Requirement #9: Circuit Breaker', () => {
    test('ECS service has circuit breaker with rollback enabled', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        DeploymentConfiguration: {
          DeploymentCircuitBreaker: {
            Enable: true,
            Rollback: true,
          },
        },
      });
    });
  });

  describe('Requirement #10: Networking and Service Discovery', () => {
    test('VPC is created', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: 'TestStack/ApiVpc',
          }),
        ]),
      });
    });

    test('Application Load Balancer is created in public subnets', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
        Type: 'application',
      });
    });

    test('Cloud Map namespace is created', () => {
      template.hasResourceProperties('AWS::ServiceDiscovery::PrivateDnsNamespace', {
        Name: 'service-discovery-test123.local',
        Vpc: Match.anyValue(),
      });
    });

    test('service has Cloud Map integration', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        ServiceRegistries: Match.arrayWith([
          Match.objectLike({
            RegistryArn: Match.anyValue(),
          }),
        ]),
      });
    });

    test('ECS service is in private subnets', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        NetworkConfiguration: {
          AwsvpcConfiguration: {
            AssignPublicIp: 'DISABLED',
            Subnets: Match.anyValue(),
          },
        },
      });
    });
  });

  describe('Resource Naming with environmentSuffix', () => {
    test('all resources use environmentSuffix in naming', () => {
      const suffix = 'test123';

      // Check cluster name
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: `ecs-cluster-${suffix}`,
      });

      // Check service name
      template.hasResourceProperties('AWS::ECS::Service', {
        ServiceName: `api-service-${suffix}`,
      });

      // Check log group name
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/ecs/api-${suffix}`,
      });

      // Check task execution role name
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `ecs-task-execution-role-${suffix}`,
      });
    });
  });

  describe('Removal Policies', () => {
    test('log group has DELETE removal policy', () => {
      template.hasResource('AWS::Logs::LogGroup', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('Cloud Map namespace has DELETE removal policy', () => {
      template.hasResource('AWS::ServiceDiscovery::PrivateDnsNamespace', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('Outputs', () => {
    test('stack exports important values', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'Application Load Balancer DNS name',
      });

      template.hasOutput('ServiceDiscoveryDomain', {
        Description: 'Service discovery domain name',
      });

      template.hasOutput('ClusterName', {
        Description: 'ECS Cluster name',
      });

      template.hasOutput('ServiceName', {
        Description: 'ECS Service name',
      });
    });
  });
});
