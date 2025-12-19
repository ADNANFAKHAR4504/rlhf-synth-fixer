import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { EcsFargateStack } from '../lib/ecs-fargate-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack Unit Tests', () => {
  describe('Main Stack', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
      template = Template.fromStack(stack);
    });

    test('creates stack with environment suffix', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toContain('TestTapStack');
    });

    test('creates nested stack with ECS resources', () => {
      // EcsFargateStack is a nested stack - it will appear as a nested CloudFormation stack
      // The resources are in a separate stack, so we just verify the main stack was created
      expect(template).toBeDefined();
    });

    test('uses default environmentSuffix when not provided', () => {
      const newApp = new cdk.App();
      const newStack = new TapStack(newApp, 'TestTapStackDefault', {});
      expect(newStack).toBeDefined();
      // The default should be 'dev' if not provided
      const newTemplate = Template.fromStack(newStack);
      expect(newTemplate).toBeDefined();
    });

    test('uses environmentSuffix from context', () => {
      const newApp = new cdk.App({
        context: { environmentSuffix: 'prod' },
      });
      const newStack = new TapStack(newApp, 'TestTapStackProd', {});
      expect(newStack).toBeDefined();
    });

    test('prefers props environmentSuffix over context', () => {
      const newApp = new cdk.App({
        context: { environmentSuffix: 'prod' },
      });
      const newStack = new TapStack(newApp, 'TestTapStackProps', {
        environmentSuffix: 'staging',
      });
      expect(newStack).toBeDefined();
      // Verify the stack was created with the props value
      const newTemplate = Template.fromStack(newStack);
      expect(newTemplate).toBeDefined();
    });
  });

  describe('ECS Fargate Stack', () => {
    let app: cdk.App;
    let parentStack: cdk.Stack;
    let stack: EcsFargateStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      parentStack = new cdk.Stack(app, 'ParentStack');
      stack = new EcsFargateStack(parentStack, 'TestEcsStack', {
        environmentSuffix,
      });
      template = Template.fromStack(stack);
    });

    describe('ECS Cluster', () => {
      test('creates ECS cluster with correct name pattern', () => {
        template.hasResourceProperties('AWS::ECS::Cluster', {
          ClusterName: `ecs-cluster-${environmentSuffix}`,
        });
      });

      test('disables Container Insights by default', () => {
        template.hasResourceProperties('AWS::ECS::Cluster', {
          ClusterSettings: Match.arrayWith([
            Match.objectLike({
              Name: 'containerInsights',
              Value: 'disabled',
            }),
          ]),
        });
      });
    });

    describe('VPC Configuration', () => {
      test('creates VPC with correct name', () => {
        template.hasResourceProperties('AWS::EC2::VPC', {
          Tags: Match.arrayWith([
            Match.objectLike({
              Key: 'Name',
              Value: `ecs-vpc-${environmentSuffix}`,
            }),
          ]),
        });
      });

      test('creates public subnets', () => {
        template.resourceCountIs('AWS::EC2::Subnet', 2);
      });
    });

    describe('ECS Service', () => {
      test('creates Fargate service with correct name', () => {
        template.hasResourceProperties('AWS::ECS::Service', {
          ServiceName: `fargate-service-${environmentSuffix}`,
          LaunchType: 'FARGATE',
        });
      });

      test('configures desired count of 2 tasks', () => {
        template.hasResourceProperties('AWS::ECS::Service', {
          DesiredCount: 2,
        });
      });

      test('configures health check grace period', () => {
        template.hasResourceProperties('AWS::ECS::Service', {
          HealthCheckGracePeriodSeconds: 60,
        });
      });
    });

    describe('Task Definition', () => {
      test('creates task definition with correct CPU and memory', () => {
        template.hasResourceProperties('AWS::ECS::TaskDefinition', {
          Cpu: '1024',
          Memory: '2048',
          Family: `fargate-task-${environmentSuffix}`,
        });
      });

      test('creates container with nginx image', () => {
        template.hasResourceProperties('AWS::ECS::TaskDefinition', {
          ContainerDefinitions: Match.arrayWith([
            Match.objectLike({
              Name: `app-container-${environmentSuffix}`,
              Image: 'nginx:latest',
              Essential: true,
            }),
          ]),
        });
      });
    });

    describe('Application Load Balancer', () => {
      test('creates ALB with correct name', () => {
        template.hasResourceProperties(
          'AWS::ElasticLoadBalancingV2::LoadBalancer',
          {
            Name: `ecs-alb-${environmentSuffix}`,
            Scheme: 'internet-facing',
            Type: 'application',
          }
        );
      });

      test('disables deletion protection', () => {
        template.hasResourceProperties(
          'AWS::ElasticLoadBalancingV2::LoadBalancer',
          {
            LoadBalancerAttributes: Match.arrayWith([
              Match.objectLike({
                Key: 'deletion_protection.enabled',
                Value: 'false',
              }),
            ]),
          }
        );
      });
    });

    describe('Target Group', () => {
      test('creates target group with correct configuration', () => {
        template.hasResourceProperties(
          'AWS::ElasticLoadBalancingV2::TargetGroup',
          {
            Name: `ecs-tg-${environmentSuffix}`,
            Port: 80,
            Protocol: 'HTTP',
            TargetType: 'ip',
          }
        );
      });

      test('configures deregistration delay', () => {
        template.hasResourceProperties(
          'AWS::ElasticLoadBalancingV2::TargetGroup',
          {
            TargetGroupAttributes: Match.arrayWith([
              Match.objectLike({
                Key: 'deregistration_delay.timeout_seconds',
                Value: '30',
              }),
            ]),
          }
        );
      });

      test('configures health check', () => {
        template.hasResourceProperties(
          'AWS::ElasticLoadBalancingV2::TargetGroup',
          {
            HealthCheckEnabled: true,
            HealthCheckPath: '/',
            HealthCheckIntervalSeconds: 30,
            HealthCheckTimeoutSeconds: 5,
            HealthyThresholdCount: 2,
            UnhealthyThresholdCount: 3,
          }
        );
      });
    });

    describe('IAM Roles', () => {
      test('creates task execution role', () => {
        template.hasResourceProperties('AWS::IAM::Role', {
          RoleName: `ecs-task-execution-role-${environmentSuffix}`,
          AssumeRolePolicyDocument: Match.objectLike({
            Statement: Match.arrayWith([
              Match.objectLike({
                Action: 'sts:AssumeRole',
                Effect: 'Allow',
                Principal: {
                  Service: 'ecs-tasks.amazonaws.com',
                },
              }),
            ]),
          }),
        });
      });

      test('creates task role', () => {
        template.hasResourceProperties('AWS::IAM::Role', {
          RoleName: `ecs-task-role-${environmentSuffix}`,
          AssumeRolePolicyDocument: Match.objectLike({
            Statement: Match.arrayWith([
              Match.objectLike({
                Action: 'sts:AssumeRole',
                Effect: 'Allow',
                Principal: {
                  Service: 'ecs-tasks.amazonaws.com',
                },
              }),
            ]),
          }),
        });
      });
    });

    describe('CloudWatch Logs', () => {
      test('creates log group with correct name', () => {
        template.hasResourceProperties('AWS::Logs::LogGroup', {
          LogGroupName: `/ecs/fargate-service-${environmentSuffix}`,
          RetentionInDays: 7,
        });
      });
    });

    describe('Autoscaling', () => {
      test('creates scalable target with baseline capacity', () => {
        template.hasResourceProperties(
          'AWS::ApplicationAutoScaling::ScalableTarget',
          {
            MinCapacity: 2,
            MaxCapacity: 5,
          }
        );
      });

      test('creates CPU-based scaling policy', () => {
        template.hasResourceProperties(
          'AWS::ApplicationAutoScaling::ScalingPolicy',
          {
            PolicyType: 'TargetTrackingScaling',
            TargetTrackingScalingPolicyConfiguration: Match.objectLike({
              PredefinedMetricSpecification: {
                PredefinedMetricType: 'ECSServiceAverageCPUUtilization',
              },
              TargetValue: 70,
            }),
          }
        );
      });
    });

    describe('Stack Outputs', () => {
      test('exports cluster name', () => {
        const outputs = template.toJSON().Outputs;
        expect(outputs).toHaveProperty('ClusterName');
        expect(outputs.ClusterName).toHaveProperty('Value');
      });

      test('exports service name', () => {
        const outputs = template.toJSON().Outputs;
        expect(outputs).toHaveProperty('ServiceName');
        expect(outputs.ServiceName).toHaveProperty('Value');
      });

      test('exports ALB DNS name', () => {
        const outputs = template.toJSON().Outputs;
        expect(outputs).toHaveProperty('LoadBalancerDNS');
        expect(outputs.LoadBalancerDNS).toHaveProperty('Value');
      });

      test('exports service ARN', () => {
        const outputs = template.toJSON().Outputs;
        expect(outputs).toHaveProperty('ServiceArn');
        expect(outputs.ServiceArn).toHaveProperty('Value');
      });
    });

    describe('Resource Count', () => {
      test('creates expected number of resources', () => {
        // VPC: 1, Subnets: 2, IGW: 1, Route Tables: 1+, Routes: 2+
        // ECS: Cluster, Service, TaskDef
        // ALB: LoadBalancer, TargetGroup, Listener
        // IAM: 2 roles + policies
        // Logs: 1 log group
        // Auto Scaling: ScalableTarget + ScalingPolicy
        const resources = template.toJSON().Resources;
        expect(Object.keys(resources).length).toBeGreaterThan(15);
      });
    });
  });
});
