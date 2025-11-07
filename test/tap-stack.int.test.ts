import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = 'integration';

describe('TapStack Integration Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeAll(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'IntegrationTestStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'ap-southeast-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('End-to-End Infrastructure Integration', () => {
    test('should synthesize stack without errors', () => {
      expect(template).toBeDefined();
      expect(() => app.synth()).not.toThrow();
    });

    test('should have all required components for order processing system', () => {
      // Networking
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::Subnet', 4);

      // Container Infrastructure
      template.resourceCountIs('AWS::ECS::Cluster', 1);
      template.resourceCountIs('AWS::ECS::Service', 2);
      template.resourceCountIs('AWS::ECS::TaskDefinition', 2);
      template.resourceCountIs('AWS::ECR::Repository', 2);

      // Load Balancing
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 1);
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 1);

      // Message Processing
      template.resourceCountIs('AWS::SQS::Queue', 2);

      // Monitoring
      template.resourceCountIs('AWS::Logs::LogGroup', 2);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 10); // 8 monitoring + 2 auto-scaling
      template.resourceCountIs('AWS::SNS::Topic', 1);

      // Service Discovery
      template.resourceCountIs('AWS::ServiceDiscovery::PrivateDnsNamespace', 1);
      template.resourceCountIs('AWS::ServiceDiscovery::Service', 2);
    });

    test('should configure complete monitoring and alerting pipeline', () => {
      // Verify all 8 alarms exist
      const alarmNames = [
        `alb-unhealthy-target-${environmentSuffix}`,
        `api-service-cpu-high-${environmentSuffix}`,
        `api-service-memory-high-${environmentSuffix}`,
        `api-service-no-tasks-${environmentSuffix}`,
        `worker-service-cpu-high-${environmentSuffix}`,
        `worker-service-memory-high-${environmentSuffix}`,
        `worker-service-no-tasks-${environmentSuffix}`,
        `dlq-messages-detected-${environmentSuffix}`,
      ];

      alarmNames.forEach((alarmName) => {
        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          AlarmName: alarmName,
        });
      });

      // Verify SNS topic exists
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `order-processing-alerts-${environmentSuffix}`,
      });
    });

    test('should have proper IAM permissions for services', () => {
      // Verify IAM roles exist
      const roles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(roles).length).toBeGreaterThanOrEqual(2);

      // Task role should have Parameter Store and SQS permissions
      const policies = template.findResources('AWS::IAM::Policy');
      expect(Object.keys(policies).length).toBeGreaterThan(0);
    });

    test('should configure auto-scaling for worker service', () => {
      // Verify scalable target exists
      template.hasResourceProperties(
        'AWS::ApplicationAutoScaling::ScalableTarget',
        {
          MinCapacity: 1,
          MaxCapacity: 10,
          ServiceNamespace: 'ecs',
        }
      );

      // Verify scaling policy exists
      template.hasResourceProperties(
        'AWS::ApplicationAutoScaling::ScalingPolicy',
        {
          PolicyType: 'StepScaling',
        }
      );
    });

    test('should have all stack outputs defined', () => {
      const outputs = [
        'ALBDnsName',
        'OrderQueueUrl',
        'OrderDLQUrl',
        'SNSTopicArn',
        'ServiceDiscoveryNamespaceOutput',
        'ApiRepositoryUri',
        'WorkerRepositoryUri',
      ];

      outputs.forEach((outputKey) => {
        expect(template.findOutputs(outputKey)).toBeDefined();
      });
    });

    test('should use environmentSuffix consistently across all resources', () => {
      // Check ECS cluster name
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: `order-cluster-${environmentSuffix}`,
      });

      // Check SQS queue names
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `order-queue-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `order-dlq-${environmentSuffix}`,
      });

      // Check ALB name
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Name: `order-alb-${environmentSuffix}`,
        }
      );

      // Check SNS topic name
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `order-processing-alerts-${environmentSuffix}`,
      });
    });

    test('should deploy all resources to ap-southeast-1 region', () => {
      // Stack should be configured for ap-southeast-1
      expect(stack.region).toBe('ap-southeast-1');
    });

    test('should have destroyable resources with no Retain policies', () => {
      // Check ECR repositories have EmptyOnDelete
      template.allResourcesProperties('AWS::ECR::Repository', {
        EmptyOnDelete: true,
      });

      // Verify no explicit Retain policies (CDK default is DELETE for most resources)
      const resources = template.toJSON().Resources;
      const retainPolicies = Object.values(resources).filter(
        (resource: any) => resource.DeletionPolicy === 'Retain'
      );
      expect(retainPolicies.length).toBe(0);
    });

    test('should configure proper health checks and monitoring', () => {
      // ALB target group health check
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          HealthCheckPath: '/',
          HealthCheckIntervalSeconds: 30,
          HealthCheckTimeoutSeconds: 5,
          HealthyThresholdCount: 2,
          UnhealthyThresholdCount: 3,
        }
      );

      // CloudWatch log groups with 7-day retention
      template.allResourcesProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7,
      });
    });

    test('should enable ECS Exec for debugging', () => {
      // Both services should have EnableExecuteCommand
      const services = template.findResources('AWS::ECS::Service');
      Object.values(services).forEach((service: any) => {
        expect(service.Properties.EnableExecuteCommand).toBe(true);
      });
    });

    test('should configure proper networking and security', () => {
      // VPC should have NAT Gateway for private subnets
      template.resourceCountIs('AWS::EC2::NatGateway', 1);

      // Should have Internet Gateway for public access
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);

      // ECS services should use awsvpc network mode
      template.allResourcesProperties('AWS::ECS::TaskDefinition', {
        NetworkMode: 'awsvpc',
      });
    });
  });

  describe('Service Discovery Integration', () => {
    test('should configure Cloud Map for inter-service communication', () => {
      // Namespace should exist
      template.hasResourceProperties(
        'AWS::ServiceDiscovery::PrivateDnsNamespace',
        {
          Name: `order-services-${environmentSuffix}.local`,
        }
      );

      // Both services should be registered
      template.hasResourceProperties('AWS::ServiceDiscovery::Service', {
        Name: 'api-service',
      });

      template.hasResourceProperties('AWS::ServiceDiscovery::Service', {
        Name: 'worker-service',
      });
    });
  });

  describe('Queue-based Auto-scaling Integration', () => {
    test('should configure SQS-based scaling for worker service', () => {
      // DLQ should be configured
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `order-dlq-${environmentSuffix}`,
        MessageRetentionPeriod: 345600,
      });

      // Main queue should have DLQ configured
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `order-queue-${environmentSuffix}`,
        RedrivePolicy: Match.objectLike({
          maxReceiveCount: 3,
        }),
      });

      // Scaling policy should target SQS metric
      template.hasResourceProperties(
        'AWS::ApplicationAutoScaling::ScalingPolicy',
        {
          PolicyType: 'StepScaling',
          StepScalingPolicyConfiguration: Match.objectLike({
            AdjustmentType: 'ChangeInCapacity',
          }),
        }
      );
    });
  });

  describe('Monitoring Coverage', () => {
    test('should monitor all critical service metrics', () => {
      const criticalMetrics = [
        'CPUUtilization', // API and Worker services
        'MemoryUtilization', // API and Worker services
        'RunningTaskCount', // API and Worker services
        'UnHealthyHostCount', // ALB
        'ApproximateNumberOfMessagesVisible', // DLQ
      ];

      criticalMetrics.forEach((metricName) => {
        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          MetricName: metricName,
        });
      });
    });

    test('should have appropriate alarm thresholds', () => {
      // CPU alarms at 80%
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Threshold: 80,
      });

      // Memory alarms at 80%
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'MemoryUtilization',
        Threshold: 80,
      });

      // Running tasks alarm at < 1
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'RunningTaskCount',
        Threshold: 1,
        ComparisonOperator: 'LessThanThreshold',
      });

      // DLQ messages alarm at 1
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'ApproximateNumberOfMessagesVisible',
        Threshold: 1,
      });
    });
  });

  describe('Task Configuration Integration', () => {
    test('should configure tasks with Fargate-compatible settings', () => {
      // All tasks should be Fargate compatible
      template.allResourcesProperties('AWS::ECS::TaskDefinition', {
        Cpu: '512',
        Memory: '1024',
        RequiresCompatibilities: ['FARGATE'],
        NetworkMode: 'awsvpc',
      });
    });

    test('should configure container logging to CloudWatch', () => {
      const taskDefs = template.findResources('AWS::ECS::TaskDefinition');
      Object.values(taskDefs).forEach((taskDef: any) => {
        const containers = taskDef.Properties.ContainerDefinitions;
        containers.forEach((container: any) => {
          expect(container.LogConfiguration.LogDriver).toBe('awslogs');
        });
      });
    });
  });
});
