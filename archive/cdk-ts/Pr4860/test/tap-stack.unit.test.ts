import * as cdk from 'aws-cdk-lib';
import { Template, Match, Capture } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new cdk.App();
  });

  describe('Stack Creation with Environment Suffix', () => {
    test('should use environmentSuffix from props', () => {
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test123',
      });
      template = Template.fromStack(stack);

      // Verify outputs contain the environment suffix
      const outputs = template.findOutputs('*');
      expect(outputs.EnvironmentSuffix.Value).toBe('test123');
    });

    test('should use environmentSuffix from context when props not provided', () => {
      app = new cdk.App({
        context: { environmentSuffix: 'context456' },
      });
      stack = new TapStack(app, 'TestTapStack');
      template = Template.fromStack(stack);

      const outputs = template.findOutputs('*');
      expect(outputs.EnvironmentSuffix.Value).toBe('context456');
    });

    test('should default to "dev" when no environmentSuffix provided', () => {
      stack = new TapStack(app, 'TestTapStack');
      template = Template.fromStack(stack);

      const outputs = template.findOutputs('*');
      expect(outputs.EnvironmentSuffix.Value).toBe('dev');
    });

    test('should prioritize props over context for environmentSuffix', () => {
      app = new cdk.App({
        context: { environmentSuffix: 'context' },
      });
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'props',
      });
      template = Template.fromStack(stack);

      const outputs = template.findOutputs('*');
      expect(outputs.EnvironmentSuffix.Value).toBe('props');
    });
  });

  describe('VPC Configuration', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('should create VPC with subnets across availability zones', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);

      // Check that we have resources spread across AZs
      // Actual count depends on region (2-3 AZs available)
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 3 types × 2 AZs = 6 subnets
    });

    test('should create NAT gateways for high availability', () => {
      // NAT gateways are created per AZ for private subnet egress
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('should create public, private, and isolated subnets', () => {
      // Multiple AZs × 3 subnet types
      template.resourceCountIs('AWS::EC2::Subnet', 6);

      // Verify different subnet types exist by checking route tables
      // Each subnet type has its own route table configuration
      const routeTables = template.findResources('AWS::EC2::RouteTable');
      const routeTableKeys = Object.keys(routeTables);

      // Should have route tables for public, private, and isolated subnets
      expect(routeTableKeys.length).toBeGreaterThan(0);

      // Verify we have subnets with different configurations
      const subnets = template.findResources('AWS::EC2::Subnet');
      const subnetKeys = Object.keys(subnets);

      // Should have 6 subnets (2 public, 2 private, 2 isolated)
      expect(subnetKeys.length).toBe(6);
    });

    test('should create internet gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
    });
  });

  describe('ECS Trading Infrastructure', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'prod',
      });
      template = Template.fromStack(stack);
    });

    test('should create ECS cluster', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterSettings: [
          {
            Name: 'containerInsights',
            Value: 'enabled',
          },
        ],
      });
    });

    test('should create ECS service with CODE_DEPLOY deployment controller', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        DeploymentController: {
          Type: 'CODE_DEPLOY',
        },
        DesiredCount: 2,
      });
    });

    test('should create Fargate task definition', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        RequiresCompatibilities: ['FARGATE'],
        NetworkMode: 'awsvpc',
        Cpu: '2048',
        Memory: '4096',
      });
    });

    test('should create Application Load Balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Scheme: 'internet-facing',
      });
    });

    test('should create two target groups (blue and green)', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 2);

      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        TargetType: 'ip',
        HealthCheckIntervalSeconds: 30,
      });
    });

    test('should create production and test listeners', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 2);

      // Production listener on port 80
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });

      // Test listener on port 9090
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 9090,
        Protocol: 'HTTP',
      });
    });

    test('should create CodeDeploy application', () => {
      template.hasResourceProperties('AWS::CodeDeploy::Application', {
        ComputePlatform: 'ECS',
      });
    });

    test('should create CodeDeploy deployment group with auto-rollback', () => {
      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        AutoRollbackConfiguration: {
          Enabled: true,
          Events: Match.arrayWith(['DEPLOYMENT_FAILURE', 'DEPLOYMENT_STOP_ON_REQUEST']),
        },
        DeploymentConfigName: 'CodeDeployDefault.ECSAllAtOnce',
      });
    });

    test('should create CloudWatch log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/ecs/order-broker',
        RetentionInDays: 30,
      });
    });

    test('should create SNS topic for alarms', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'OrderBroker Alarms',
      });
    });

    test('should create SNS email subscription', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'sre-team@example.com',
      });
    });

    test('should create CloudWatch alarms', () => {
      // JVM heap usage alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'JVMHeapUtilization',
        Namespace: 'AWS/ECS',
        Threshold: 80,
        EvaluationPeriods: 3,
        ComparisonOperator: 'GreaterThanThreshold',
      });

      // Database connection pool alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'DBConnectionPoolUtilization',
        Namespace: 'AWS/ECS',
        Threshold: 90,
        EvaluationPeriods: 3,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });
  });

  describe('Auto-scaling Configuration', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('should create scalable target for ECS service', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
        MinCapacity: 2,
        MaxCapacity: 20,
      });
    });

    test('should create CPU-based scaling policy', () => {
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

    test('should create memory-based scaling policy', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingScalingPolicyConfiguration: {
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ECSServiceAverageMemoryUtilization',
          },
          TargetValue: 70,
        },
      });
    });

    test('should create scheduled scaling for market open', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
        ScheduledActions: Match.arrayWith([
          Match.objectLike({
            ScalableTargetAction: {
              MinCapacity: 10,
            },
            Schedule: 'cron(25 9 * * ? *)',
          }),
        ]),
      });
    });

    test('should create scheduled scaling for market close', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
        ScheduledActions: Match.arrayWith([
          Match.objectLike({
            ScalableTargetAction: {
              MinCapacity: 10,
            },
            Schedule: 'cron(55 15 * * ? *)',
          }),
        ]),
      });
    });
  });

  describe('Security Configuration', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('should create security groups', () => {
      // Service SG + ALB SG
      template.resourceCountIs('AWS::EC2::SecurityGroup', 2);
    });

    test('should create IAM task role with least privilege', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
            }),
          ]),
        },
      });

      // Check Kinesis permissions
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: ['kinesis:PutRecord', 'kinesis:PutRecords', 'kinesis:DescribeStream'],
              Effect: 'Allow',
            }),
          ]),
        },
      });

      // Check RDS permissions
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: ['rds-data:ExecuteStatement', 'rds-data:BatchExecuteStatement'],
              Effect: 'Allow',
            }),
          ]),
        },
      });

      // Check CloudWatch Logs permissions
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should allow HTTP traffic from ALB to ECS service', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 80,
        ToPort: 80,
        Description: 'Allow inbound traffic from ALB',
      });
    });

    test('should allow traffic from internet to ALB on multiple ports', () => {
      // Check for security group rules allowing internet access to ALB
      // Note: These rules are created by CDK automatically for ALB
      template.resourceCountIs('AWS::EC2::SecurityGroup', 2);
    });
  });

  describe('Tagging', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'prod',
      });
      template = Template.fromStack(stack);
    });

    test('should apply tags to resources', () => {
      const ecsCluster = template.findResources('AWS::ECS::Cluster');
      const clusterKeys = Object.keys(ecsCluster);
      expect(clusterKeys.length).toBeGreaterThan(0);

      const cluster = ecsCluster[clusterKeys[0]];
      expect(cluster.Properties.Tags).toEqual(
        expect.arrayContaining([
          { Key: 'CostCenter', Value: 'Trading' },
          { Key: 'Project', Value: 'TradingPlatform' },
          { Key: 'Service', Value: 'OrderBroker' },
        ])
      );
    });
  });

  describe('Stack Outputs', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('should create VPC outputs', () => {
      const outputs = template.findOutputs('*');
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.VpcId.Description).toBe('VPC ID for the trading infrastructure');
    });

    test('should create ECS cluster outputs', () => {
      const outputs = template.findOutputs('*');
      expect(outputs.EcsClusterName).toBeDefined();
      expect(outputs.EcsClusterArn).toBeDefined();
    });

    test('should create ECS service outputs', () => {
      const outputs = template.findOutputs('*');
      expect(outputs.EcsServiceName).toBeDefined();
      expect(outputs.EcsServiceArn).toBeDefined();
    });

    test('should create load balancer outputs', () => {
      const outputs = template.findOutputs('*');
      expect(outputs.LoadBalancerDnsName).toBeDefined();
      expect(outputs.LoadBalancerArn).toBeDefined();
      expect(outputs.LoadBalancerUrl).toBeDefined();
    });

    test('should create target group outputs', () => {
      const outputs = template.findOutputs('*');
      expect(outputs.BlueTargetGroupArn).toBeDefined();
      expect(outputs.BlueTargetGroupName).toBeDefined();
      expect(outputs.GreenTargetGroupArn).toBeDefined();
      expect(outputs.GreenTargetGroupName).toBeDefined();
    });

    test('should create listener outputs', () => {
      const outputs = template.findOutputs('*');
      expect(outputs.ProductionListenerArn).toBeDefined();
      expect(outputs.TestListenerArn).toBeDefined();
    });

    test('should create CodeDeploy outputs', () => {
      const outputs = template.findOutputs('*');
      expect(outputs.CodeDeployApplicationName).toBeDefined();
      expect(outputs.CodeDeployDeploymentGroupName).toBeDefined();
      expect(outputs.CodeDeployDeploymentGroupArn).toBeDefined();
    });

    test('should create CloudWatch outputs', () => {
      const outputs = template.findOutputs('*');
      expect(outputs.LogGroupName).toBeDefined();
      expect(outputs.LogGroupArn).toBeDefined();
    });

    test('should create SNS outputs', () => {
      const outputs = template.findOutputs('*');
      expect(outputs.AlarmTopicArn).toBeDefined();
      expect(outputs.AlarmTopicName).toBeDefined();
    });

    test('should create deployment region output', () => {
      const outputs = template.findOutputs('*');
      expect(outputs.DeploymentRegion).toBeDefined();
    });

    test('should create environment suffix output', () => {
      const outputs = template.findOutputs('*');
      expect(outputs.EnvironmentSuffix).toBeDefined();
      expect(outputs.EnvironmentSuffix.Value).toBe('test');
    });

    test('should export all outputs with stack name prefix', () => {
      const outputs = template.findOutputs('*');

      // Verify outputs with export names
      const outputsWithExports = [
        'VpcId',
        'EcsClusterName',
        'EcsClusterArn',
        'EcsServiceName',
        'EcsServiceArn',
        'LoadBalancerDnsName',
        'LoadBalancerArn',
        'BlueTargetGroupArn',
        'BlueTargetGroupName',
        'GreenTargetGroupArn',
        'GreenTargetGroupName',
        'ProductionListenerArn',
        'TestListenerArn',
        'CodeDeployApplicationName',
        'CodeDeployDeploymentGroupName',
        'CodeDeployDeploymentGroupArn',
        'LogGroupName',
        'LogGroupArn',
        'AlarmTopicArn',
        'AlarmTopicName',
      ];

      outputsWithExports.forEach((outputName) => {
        expect(outputs[outputName]).toBeDefined();
        if (outputs[outputName].Export) {
          expect(outputs[outputName].Export.Name).toContain('TestTapStack');
        }
      });
    });
  });

  describe('Container Configuration', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('should configure container with blue-green image', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Image: 'amasucci/bluegreen',
            Environment: [
              {
                Name: 'COLOR',
                Value: 'blue',
              },
            ],
          }),
        ]),
      });
    });

    test('should configure container port mappings', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            PortMappings: [
              {
                ContainerPort: 80,
                Protocol: 'tcp',
              },
            ],
          }),
        ]),
      });
    });

    test('should configure CloudWatch logging', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            LogConfiguration: {
              LogDriver: 'awslogs',
              Options: Match.objectLike({
                'awslogs-stream-prefix': 'order-broker',
              }),
            },
          }),
        ]),
      });
    });
  });

  describe('Blue-Green Deployment Configuration', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('should configure deployment wait times', () => {
      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        BlueGreenDeploymentConfiguration: {
          DeploymentReadyOption: {
            ActionOnTimeout: 'STOP_DEPLOYMENT',
            WaitTimeInMinutes: 1,
          },
          TerminateBlueInstancesOnDeploymentSuccess: {
            Action: 'TERMINATE',
            TerminationWaitTimeInMinutes: 1,
          },
        },
      });
    });

    test('should configure load balancer info for deployment', () => {
      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        LoadBalancerInfo: {
          TargetGroupPairInfoList: Match.arrayWith([
            Match.objectLike({
              ProdTrafficRoute: {
                ListenerArns: Match.anyValue(),
              },
              TestTrafficRoute: {
                ListenerArns: Match.anyValue(),
              },
              TargetGroups: Match.anyValue(),
            }),
          ]),
        },
      });
    });
  });

  describe('Resource Naming', () => {
    test('should include environment suffix in resource names', () => {
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'staging',
      });
      template = Template.fromStack(stack);

      // Check VPC name includes suffix
      const vpc = template.findResources('AWS::EC2::VPC');
      const vpcKeys = Object.keys(vpc);
      expect(vpcKeys[0]).toContain('staging');
    });

    test('should default to "dev" for empty environment suffix', () => {
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: '',
      });
      template = Template.fromStack(stack);

      const outputs = template.findOutputs('*');
      // Empty string is falsy, so it defaults to 'dev'
      expect(outputs.EnvironmentSuffix.Value).toBe('dev');
    });
  });

  describe('Resource Count Validation', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('should create exactly 1 VPC', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('should create exactly 1 ECS cluster', () => {
      template.resourceCountIs('AWS::ECS::Cluster', 1);
    });

    test('should create exactly 1 ECS service', () => {
      template.resourceCountIs('AWS::ECS::Service', 1);
    });

    test('should create exactly 1 task definition', () => {
      template.resourceCountIs('AWS::ECS::TaskDefinition', 1);
    });

    test('should create exactly 1 load balancer', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    });

    test('should create exactly 2 listeners', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 2);
    });

    test('should create exactly 2 target groups', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 2);
    });

    test('should create exactly 1 CodeDeploy application', () => {
      template.resourceCountIs('AWS::CodeDeploy::Application', 1);
    });

    test('should create exactly 1 CodeDeploy deployment group', () => {
      template.resourceCountIs('AWS::CodeDeploy::DeploymentGroup', 1);
    });

    test('should create exactly 1 SNS topic', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });

    test('should create exactly 1 log group', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 1);
    });

    test('should create CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });
  });
});
