import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'ap-southeast-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with 2 AZs', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `order-vpc-${environmentSuffix}`,
          }),
        ]),
      });
    });

    test('should have public and private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
    });

    test('should have 1 NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });
  });

  describe('ECR Repositories', () => {
    test('should create API service ECR repository', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: `api-service-${environmentSuffix}`,
        EmptyOnDelete: true,
      });
    });

    test('should create Worker service ECR repository', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: `worker-service-${environmentSuffix}`,
        EmptyOnDelete: true,
      });
    });

    test('should have destroyable ECR repositories', () => {
      template.allResourcesProperties('AWS::ECR::Repository', {
        EmptyOnDelete: true,
      });
    });
  });

  describe('ECS Cluster', () => {
    test('should create ECS cluster with correct name', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: `order-cluster-${environmentSuffix}`,
      });
    });

    // Updated: Remove Fargate capacity provider test since it's not enabled to avoid deletion issues
    test('should not have explicit Fargate capacity providers to avoid deletion issues', () => {
      // Verify that we don't have ClusterCapacityProviderAssociations resource
      template.resourceCountIs('AWS::ECS::ClusterCapacityProviderAssociations', 0);
    });
  });

  describe('Service Discovery', () => {
    test('should create private DNS namespace', () => {
      template.hasResourceProperties('AWS::ServiceDiscovery::PrivateDnsNamespace', {
        Name: `order-services-${environmentSuffix}.local`,
      });
    });

    test('should have description for namespace', () => {
      template.hasResourceProperties('AWS::ServiceDiscovery::PrivateDnsNamespace', {
        Description: 'Service discovery namespace for order processing services',
      });
    });
  });

  describe('SQS Queues', () => {
    test('should create order queue with 4-day retention', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `order-queue-${environmentSuffix}`,
        MessageRetentionPeriod: 345600, // 4 days in seconds
      });
    });

    test('should create DLQ with 4-day retention', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `order-dlq-${environmentSuffix}`,
        MessageRetentionPeriod: 345600,
      });
    });

    test('should configure dead letter queue for order queue', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `order-queue-${environmentSuffix}`,
        RedrivePolicy: Match.objectLike({
          maxReceiveCount: 3,
        }),
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should create API service log group with /ecs/ prefix', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/ecs/api-service-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });

    test('should create Worker service log group with /ecs/ prefix', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/ecs/worker-service-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });

    test('should have exactly 7-day retention for all log groups', () => {
      template.allResourcesProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7,
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create task execution and task roles for ECS', () => {
      // Verify IAM roles exist (at least 2 for task execution and task role)
      const roles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(roles).length).toBeGreaterThanOrEqual(2);
    });

    test('should create task role with Parameter Store access', () => {
      // Verify IAM policy exists with SSM actions
      const policies = template.findResources('AWS::IAM::Policy');
      const hasParameterStoreAccess = Object.values(policies).some((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some((statement: any) => {
          const actions = statement.Action || [];
          return (
            actions.includes('ssm:GetParameter') ||
            actions.includes('ssm:GetParameters') ||
            actions.includes('ssm:GetParametersByPath')
          );
        });
      });
      expect(hasParameterStoreAccess).toBe(true);
    });

    test('should grant SQS permissions to task role', () => {
      // Verify IAM policy exists with SQS actions
      const policies = template.findResources('AWS::IAM::Policy');
      const hasSqsAccess = Object.values(policies).some((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some((statement: any) => {
          const actions = statement.Action || [];
          return (
            actions.includes('sqs:ReceiveMessage') ||
            actions.includes('sqs:ChangeMessageVisibility') ||
            actions.includes('sqs:GetQueueUrl')
          );
        });
      });
      expect(hasSqsAccess).toBe(true);
    });
  });

  describe('Task Definitions', () => {
    test('should create API task definition with 512 CPU and 1024 memory', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Family: `api-service-${environmentSuffix}`,
        Cpu: '512',
        Memory: '1024',
        NetworkMode: 'awsvpc',
        RequiresCompatibilities: ['FARGATE'],
      });
    });

    test('should create Worker task definition with 512 CPU and 1024 memory', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Family: `worker-service-${environmentSuffix}`,
        Cpu: '512',
        Memory: '1024',
        NetworkMode: 'awsvpc',
        RequiresCompatibilities: ['FARGATE'],
      });
    });

    // Updated: Changed port from 8080 to 80 for nginx
    test('should configure API container with correct image and logging', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Family: `api-service-${environmentSuffix}`,
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: 'api-container',
            Image: 'public.ecr.aws/docker/library/nginx:latest', // Updated to match nginx image
            PortMappings: [
              {
                ContainerPort: 80, // Updated from 8080 to 80
                Protocol: 'tcp',
              },
            ],
            LogConfiguration: Match.objectLike({
              LogDriver: 'awslogs',
            }),
          }),
        ]),
      });
    });

    test('should configure Worker container with correct image and logging', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Family: `worker-service-${environmentSuffix}`,
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: 'worker-container',
            Image: 'public.ecr.aws/docker/library/alpine:latest', // Updated to match alpine image
            LogConfiguration: Match.objectLike({
              LogDriver: 'awslogs',
            }),
            // Added command check for worker container
            Command: ['/bin/sh', '-c', 'while true; do echo "Worker running..."; sleep 30; done'],
          }),
        ]),
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('should create internet-facing ALB', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: `order-alb-${environmentSuffix}`,
        Scheme: 'internet-facing',
        Type: 'application',
      });
    });

    test('should have ALB listener on port 80', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });

    // Updated: Changed port from 8080 to 80
    test('should create target group for API service', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Name: `api-tg-${environmentSuffix}`,
        Port: 80, // Updated from 8080 to 80
        Protocol: 'HTTP',
        TargetType: 'ip',
      });
    });

    // Updated: Changed health check path from /health to /
    test('should configure health check for API target group', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Name: `api-tg-${environmentSuffix}`,
        HealthCheckPath: '/', // Updated from '/health' to '/'
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 5,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3,
      });
    });

    test('should configure path-based routing for /api/*', () => {
      // Verify listener rule with correct priority exists
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::ListenerRule', {
        Priority: 10,
      });
    });
  });

  describe('ECS Services', () => {
    test('should create API service with desired count 2', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        ServiceName: `api-service-${environmentSuffix}`,
        DesiredCount: 2,
      });
    });

    test('should create Worker service with desired count 1', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        ServiceName: `worker-service-${environmentSuffix}`,
        DesiredCount: 1,
      });
    });

    test('should enable ECS Exec for API service', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        ServiceName: `api-service-${environmentSuffix}`,
        EnableExecuteCommand: true,
      });
    });

    test('should enable ECS Exec for Worker service', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        ServiceName: `worker-service-${environmentSuffix}`,
        EnableExecuteCommand: true,
      });
    });

    test('should configure service discovery for API service', () => {
      template.hasResourceProperties('AWS::ServiceDiscovery::Service', {
        Name: 'api-service',
        DnsConfig: Match.objectLike({
          DnsRecords: [
            {
              Type: 'A',
              TTL: 60,
            },
          ],
        }),
      });
    });

    test('should configure service discovery for Worker service', () => {
      template.hasResourceProperties('AWS::ServiceDiscovery::Service', {
        Name: 'worker-service',
        DnsConfig: Match.objectLike({
          DnsRecords: [
            {
              Type: 'A',
              TTL: 60,
            },
          ],
        }),
      });
    });

    // Added: Test for deployment configuration settings
    test('should configure deployment settings for API service', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        ServiceName: `api-service-${environmentSuffix}`,
        DeploymentConfiguration: Match.objectLike({
          MaximumPercent: 200,
          MinimumHealthyPercent: 50,
          DeploymentCircuitBreaker: Match.objectLike({
            Enable: true,
            Rollback: true,
          }),
        }),
      });
    });

    test('should configure deployment settings for Worker service', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        ServiceName: `worker-service-${environmentSuffix}`,
        DeploymentConfiguration: Match.objectLike({
          MaximumPercent: 200,
          MinimumHealthyPercent: 0, // Allow worker to scale down to 0
          DeploymentCircuitBreaker: Match.objectLike({
            Enable: true,
            Rollback: true,
          }),
        }),
      });
    });
  });

  describe('Auto-scaling', () => {
    test('should create auto-scaling target for Worker service', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
        MinCapacity: 1,
        MaxCapacity: 10,
        ServiceNamespace: 'ecs',
      });
    });

    test('should create step scaling policy based on SQS metric', () => {
      // Check for scale-down policy
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        PolicyType: 'StepScaling',
        StepScalingPolicyConfiguration: Match.objectLike({
          AdjustmentType: 'ChangeInCapacity',
          StepAdjustments: [
            Match.objectLike({
              MetricIntervalUpperBound: 0,
              ScalingAdjustment: -1,
            }),
          ],
        }),
      });

      // Check for scale-up policy
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        PolicyType: 'StepScaling',
        StepScalingPolicyConfiguration: Match.objectLike({
          AdjustmentType: 'ChangeInCapacity',
          StepAdjustments: [
            Match.objectLike({
              MetricIntervalLowerBound: 0,
              ScalingAdjustment: 1,
            }),
          ],
        }),
      });
    });
  });

  describe('SNS Topic for Alerting', () => {
    test('should create SNS topic with correct name', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `order-processing-alerts-${environmentSuffix}`,
        DisplayName: 'Order Processing System Alerts',
      });
    });
  });

  describe('CloudWatch Alarms - ALB', () => {
    test('should create alarm for unhealthy ALB targets', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `alb-unhealthy-target-${environmentSuffix}`,
        AlarmDescription: 'Alert when any ALB target becomes unhealthy',
        MetricName: 'UnHealthyHostCount',
        Namespace: 'AWS/ApplicationELB',
        Statistic: 'Average',
        Threshold: 1,
        EvaluationPeriods: 2,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        TreatMissingData: 'notBreaching',
      });
    });
  });

  describe('CloudWatch Alarms - API Service', () => {
    test('should create alarm for API service high CPU', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `api-service-cpu-high-${environmentSuffix}`,
        AlarmDescription: 'Alert when API service CPU utilization exceeds 80%',
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/ECS',
        Statistic: 'Average',
        Threshold: 80,
        EvaluationPeriods: 2,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('should create alarm for API service high memory', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `api-service-memory-high-${environmentSuffix}`,
        AlarmDescription: 'Alert when API service memory utilization exceeds 80%',
        MetricName: 'MemoryUtilization',
        Namespace: 'AWS/ECS',
        Statistic: 'Average',
        Threshold: 80,
        EvaluationPeriods: 2,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('should create alarm for API service no running tasks', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `api-service-no-tasks-${environmentSuffix}`,
        AlarmDescription: 'Alert when no tasks are running for API service',
        MetricName: 'RunningTaskCount',
        Namespace: 'AWS/ECS',
        Threshold: 1,
        ComparisonOperator: 'LessThanThreshold',
        TreatMissingData: 'breaching',
      });
    });
  });

  describe('CloudWatch Alarms - Worker Service', () => {
    test('should create alarm for Worker service high CPU', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `worker-service-cpu-high-${environmentSuffix}`,
        AlarmDescription: 'Alert when Worker service CPU utilization exceeds 80%',
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/ECS',
        Statistic: 'Average',
        Threshold: 80,
        EvaluationPeriods: 2,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('should create alarm for Worker service high memory', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `worker-service-memory-high-${environmentSuffix}`,
        AlarmDescription: 'Alert when Worker service memory utilization exceeds 80%',
        MetricName: 'MemoryUtilization',
        Namespace: 'AWS/ECS',
        Statistic: 'Average',
        Threshold: 80,
        EvaluationPeriods: 2,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('should create alarm for Worker service no running tasks', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `worker-service-no-tasks-${environmentSuffix}`,
        AlarmDescription: 'Alert when no tasks are running for Worker service',
        MetricName: 'RunningTaskCount',
        Namespace: 'AWS/ECS',
        Threshold: 1,
        ComparisonOperator: 'LessThanThreshold',
        TreatMissingData: 'breaching',
      });
    });
  });

  describe('CloudWatch Alarms - SQS DLQ', () => {
    test('should create alarm for DLQ messages', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `dlq-messages-detected-${environmentSuffix}`,
        AlarmDescription: 'Alert when messages land in dead letter queue',
        MetricName: 'ApproximateNumberOfMessagesVisible',
        Namespace: 'AWS/SQS',
        Statistic: 'Sum',
        Threshold: 1,
        EvaluationPeriods: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });
  });

  describe('CloudWatch Alarms - SNS Actions', () => {
    test('should configure all alarms to publish to SNS topic', () => {
      const alarms = [
        `alb-unhealthy-target-${environmentSuffix}`,
        `api-service-cpu-high-${environmentSuffix}`,
        `api-service-memory-high-${environmentSuffix}`,
        `api-service-no-tasks-${environmentSuffix}`,
        `worker-service-cpu-high-${environmentSuffix}`,
        `worker-service-memory-high-${environmentSuffix}`,
        `worker-service-no-tasks-${environmentSuffix}`,
        `dlq-messages-detected-${environmentSuffix}`,
      ];

      alarms.forEach((alarmName) => {
        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          AlarmName: alarmName,
          AlarmActions: Match.arrayWith([
            Match.objectLike({
              Ref: Match.stringLikeRegexp('AlertTopic'),
            }),
          ]),
        });
      });
    });

    test('should have at least 8 CloudWatch alarms for monitoring', () => {
      // 8 explicit alarms + 2 auto-scaling alarms = 10 total
      const alarms = [
        `alb-unhealthy-target-${environmentSuffix}`,
        `api-service-cpu-high-${environmentSuffix}`,
        `api-service-memory-high-${environmentSuffix}`,
        `api-service-no-tasks-${environmentSuffix}`,
        `worker-service-cpu-high-${environmentSuffix}`,
        `worker-service-memory-high-${environmentSuffix}`,
        `worker-service-no-tasks-${environmentSuffix}`,
        `dlq-messages-detected-${environmentSuffix}`,
      ];

      // Verify all 8 explicit monitoring alarms exist
      alarms.forEach((alarmName) => {
        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          AlarmName: alarmName,
        });
      });

      // Total includes auto-scaling alarms
      template.resourceCountIs('AWS::CloudWatch::Alarm', 10);
    });
  });

  describe('Stack Outputs', () => {
    test('should output ALB DNS name', () => {
      template.hasOutput('ALBDnsName', {
        Description: 'Application Load Balancer DNS name',
        Export: {
          Name: `alb-dns-${environmentSuffix}`,
        },
      });
    });

    test('should output Order Queue URL', () => {
      template.hasOutput('OrderQueueUrl', {
        Description: 'Order Queue URL',
        Export: {
          Name: `order-queue-url-${environmentSuffix}`,
        },
      });
    });

    test('should output Order DLQ URL', () => {
      template.hasOutput('OrderDLQUrl', {
        Description: 'Order Dead Letter Queue URL',
        Export: {
          Name: `order-dlq-url-${environmentSuffix}`,
        },
      });
    });

    test('should output SNS Topic ARN', () => {
      template.hasOutput('SNSTopicArn', {
        Description: 'SNS Topic ARN for alerts',
        Export: {
          Name: `alert-topic-arn-${environmentSuffix}`,
        },
      });
    });

    test('should output Service Discovery Namespace', () => {
      template.hasOutput('ServiceDiscoveryNamespaceOutput', {
        Description: 'Service Discovery Namespace',
        Export: {
          Name: `namespace-${environmentSuffix}`,
        },
      });
    });

    test('should output API Repository URI', () => {
      template.hasOutput('ApiRepositoryUri', {
        Description: 'API Service ECR Repository URI',
        Export: {
          Name: `api-repo-uri-${environmentSuffix}`,
        },
      });
    });

    test('should output Worker Repository URI', () => {
      template.hasOutput('WorkerRepositoryUri', {
        Description: 'Worker Service ECR Repository URI',
        Export: {
          Name: `worker-repo-uri-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Resource Counts', () => {
    test('should have expected number of major resources', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::ECS::Cluster', 1);
      template.resourceCountIs('AWS::ECS::Service', 2);
      template.resourceCountIs('AWS::ECS::TaskDefinition', 2);
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 1);
      template.resourceCountIs('AWS::SQS::Queue', 2);
      template.resourceCountIs('AWS::Logs::LogGroup', 2);
      template.resourceCountIs('AWS::ECR::Repository', 2);
      template.resourceCountIs('AWS::SNS::Topic', 1);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 10); // 8 monitoring + 2 auto-scaling
      template.resourceCountIs('AWS::ServiceDiscovery::PrivateDnsNamespace', 1);
      template.resourceCountIs('AWS::ServiceDiscovery::Service', 2);
      // Updated: No ClusterCapacityProviderAssociations expected
      template.resourceCountIs('AWS::ECS::ClusterCapacityProviderAssociations', 0);
    });
  });
});
