import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import { ComputeStack } from '../lib/compute-stack';

describe('ComputeStack', () => {
  const app = new cdk.App();
  const environmentSuffix = 'test123';

  // Create dependencies for testing
  const depStack = new cdk.Stack(app, 'TestDepStack');
  const vpc = new ec2.Vpc(depStack, 'TestVpc', { maxAzs: 3 });

  // Create mock RDS instance
  const database = new rds.DatabaseInstance(depStack, 'TestDB', {
    engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_15_4 }),
    vpc: vpc,
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
  });

  // Create mock Redis cluster
  const redisCluster = new elasticache.CfnCacheCluster(depStack, 'TestRedis', {
    cacheNodeType: 'cache.t3.micro',
    engine: 'redis',
    numCacheNodes: 1,
  });

  const alertTopic = new sns.Topic(depStack, 'TestTopic');

  const stack = new ComputeStack(app, 'TestComputeStack', {
    environmentSuffix: environmentSuffix,
    vpc: vpc,
    database: database,
    redisCluster: redisCluster,
    alertTopic: alertTopic,
  });

  const template = Template.fromStack(stack);

  test('ECS cluster created with correct name', () => {
    template.hasResourceProperties('AWS::ECS::Cluster', {
      ClusterName: `trading-cluster-${environmentSuffix}`,
      ClusterSettings: Match.arrayWith([
        Match.objectLike({
          Name: 'containerInsights',
          Value: 'enabled',
        }),
      ]),
    });
  });

  test('ECS task execution role created with environmentSuffix', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: `ecs-task-exec-role-${environmentSuffix}`,
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

  test('ECS task role created with environmentSuffix', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: `ecs-task-role-${environmentSuffix}`,
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

  test('ECS task definition created with correct family name', () => {
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      Family: `trading-api-${environmentSuffix}`,
      RequiresCompatibilities: ['FARGATE'],
      Cpu: '512',
      Memory: '1024',
      NetworkMode: 'awsvpc',
    });
  });

  test('Container definition includes environment variables', () => {
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: 'trading-api',
          Image: 'nginxdemos/hello',
          Environment: Match.arrayWith([
            Match.objectLike({
              Name: 'ENVIRONMENT',
              Value: environmentSuffix,
            }),
          ]),
          PortMappings: Match.arrayWith([
            Match.objectLike({
              ContainerPort: 80,
              Protocol: 'tcp',
            }),
          ]),
        }),
      ]),
    });
  });

  test('CloudWatch log group created with correct name and retention', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: `/ecs/trading-api-${environmentSuffix}`,
      RetentionInDays: 30,
    });
  });

  test('Application Load Balancer created with correct name', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      Name: `trading-alb-${environmentSuffix}`,
      Scheme: 'internet-facing',
      Type: 'application',
    });
  });

  test('ALB target group created with health check configuration', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      Name: `trading-tg-${environmentSuffix}`,
      Port: 80,
      Protocol: 'HTTP',
      TargetType: 'ip',
      HealthCheckPath: '/health',
      HealthCheckIntervalSeconds: 30,
      HealthCheckTimeoutSeconds: 5,
      HealthyThresholdCount: 2,
      UnhealthyThresholdCount: 3,
    });
  });

  test('ALB listener created on port 80', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 80,
      Protocol: 'HTTP',
    });
  });

  test('Fargate service created with correct configuration', () => {
    template.hasResourceProperties('AWS::ECS::Service', {
      ServiceName: `trading-service-${environmentSuffix}`,
      DesiredCount: 2,
      LaunchType: 'FARGATE',
    });
  });

  test('Auto scaling target created for ECS service', () => {
    template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
      MinCapacity: 2,
      MaxCapacity: 10,
      ServiceNamespace: 'ecs',
    });
  });

  test('CPU-based auto scaling policy created', () => {
    template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
      PolicyType: 'TargetTrackingScaling',
      TargetTrackingScalingPolicyConfiguration: Match.objectLike({
        TargetValue: 70,
        PredefinedMetricSpecification: Match.objectLike({
          PredefinedMetricType: 'ECSServiceAverageCPUUtilization',
        }),
      }),
    });
  });

  test('Memory-based auto scaling policy created', () => {
    template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
      PolicyType: 'TargetTrackingScaling',
      TargetTrackingScalingPolicyConfiguration: Match.objectLike({
        TargetValue: 80,
        PredefinedMetricSpecification: Match.objectLike({
          PredefinedMetricType: 'ECSServiceAverageMemoryUtilization',
        }),
      }),
    });
  });

  test('ALB security group created with environmentSuffix', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for ALB',
      GroupName: `alb-sg-${environmentSuffix}`,
    });
  });

  test('ECS security group created with environmentSuffix', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for ECS tasks',
      GroupName: `ecs-sg-${environmentSuffix}`,
    });
  });

  test('Security group allows HTTP traffic on port 80', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      IpProtocol: 'tcp',
      FromPort: 80,
      ToPort: 80,
    });
  });

  test('CloudWatch alarm created for unhealthy hosts', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      MetricName: 'UnHealthyHostCount',
      Namespace: 'AWS/ApplicationELB',
      Threshold: 1,
      EvaluationPeriods: 2,
      DatapointsToAlarm: 2,
    });
  });

  test('ALB DNS name output exported with environmentSuffix', () => {
    template.hasOutput('ALBDnsName', {
      Export: {
        Name: `ALBDnsName-${environmentSuffix}`,
      },
    });
  });

  test('Service name output exported with environmentSuffix', () => {
    template.hasOutput('ServiceName', {
      Export: {
        Name: `ServiceName-${environmentSuffix}`,
      },
    });
  });

  test('Task definition has secrets for database credentials', () => {
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Secrets: Match.anyValue(),
        }),
      ]),
    });
  });

  test('Exactly one ECS cluster created', () => {
    template.resourceCountIs('AWS::ECS::Cluster', 1);
  });

  test('Exactly one ALB created', () => {
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
  });

  test('Exactly one Fargate service created', () => {
    template.resourceCountIs('AWS::ECS::Service', 1);
  });
});
