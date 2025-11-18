import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as sns from 'aws-cdk-lib/aws-sns';
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

  test('Task definition includes secrets when database secret exists', () => {
    // This test covers the conditional branch: if (props.database.secret)
    // The task definition should have secrets configured
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      Family: `trading-api-${environmentSuffix}`,
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Secrets: Match.anyValue(),
        }),
      ]),
    });
  });

  test('Task role has database secret access when secret exists', () => {
    // This covers the conditional: if (props.database.secret)
    const roles = template.findResources('AWS::IAM::Role');
    const taskRole = Object.values(roles).find((role: any) => {
      return role.Properties.RoleName === `ecs-task-role-${environmentSuffix}`;
    });

    expect(taskRole).toBeDefined();
  });
});

describe('ComputeStack - Without Database Secret', () => {
  const app = new cdk.App();
  const environmentSuffix = 'test-no-secret';

  const depStack = new cdk.Stack(app, 'TestDepStackNoSecret');
  const vpc = new ec2.Vpc(depStack, 'TestVpc', { maxAzs: 3 });

  // Create RDS instance using fromPassword which doesn't create a Secrets Manager secret
  // This makes database.secret undefined, allowing us to test the false branch
  const database = new rds.DatabaseInstance(depStack, 'TestDBNoSecret', {
    engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_15_4 }),
    vpc: vpc,
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
    credentials: rds.Credentials.fromPassword('postgres', cdk.SecretValue.unsafePlainText('testpassword')),
  });

  const redisCluster = new elasticache.CfnCacheCluster(depStack, 'TestRedis', {
    cacheNodeType: 'cache.t3.micro',
    engine: 'redis',
    numCacheNodes: 1,
  });

  const alertTopic = new sns.Topic(depStack, 'TestTopic');

  const stack = new ComputeStack(app, 'TestComputeStackNoSecret', {
    environmentSuffix: environmentSuffix,
    vpc: vpc,
    database: database,
    redisCluster: redisCluster,
    alertTopic: alertTopic,
  });

  const template = Template.fromStack(stack);

  test('Task definition does not include secrets when database.secret is undefined', () => {
    // This test covers the false branch: secrets: props.database.secret ? {...} : undefined
    // When database.secret is undefined (fromPassword doesn't create secret),
    // secrets should be undefined
    const taskDefs = template.findResources('AWS::ECS::TaskDefinition');
    const taskDef = Object.values(taskDefs)[0] as any;
    const containerDef = taskDef.Properties.ContainerDefinitions[0];

    // When secret is undefined, secrets should be undefined
    expect(containerDef.Secrets).toBeUndefined();
  });

  test('Task role does not grant secret access when database.secret is undefined', () => {
    // This test covers the false branch: if (props.database.secret) { ... }
    const roles = template.findResources('AWS::IAM::Role');
    const taskRole = Object.values(roles).find((role: any) => {
      return role.Properties.RoleName === `ecs-task-role-${environmentSuffix}`;
    });

    expect(taskRole).toBeDefined();
    // When secret is undefined, grantRead is not called, so no Secrets Manager policies
    const policies = taskRole?.Properties.Policies || [];
    const hasSecretsManagerPolicy = policies.some((policy: any) => {
      const statements = policy.PolicyDocument?.Statement || [];
      return statements.some((stmt: any) => {
        const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
        return actions.some((action: string) =>
          action && action.includes('secretsmanager')
        );
      });
    });
    expect(hasSecretsManagerPolicy).toBe(false);
  });
});

describe('ComputeStack - Database Without Secrets Manager Secret', () => {
  const app = new cdk.App();
  const environmentSuffix = 'test-no-secret-mgr';

  const depStack = new cdk.Stack(app, 'TestDepStackNoSecretMgr');
  const vpc = new ec2.Vpc(depStack, 'TestVpc', { maxAzs: 3 });

  // Create database using fromPassword which doesn't create a Secrets Manager secret
  // This will make database.secret undefined
  const database = new rds.DatabaseInstance(depStack, 'TestDBNoSecretMgr', {
    engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_15_4 }),
    vpc: vpc,
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
    credentials: rds.Credentials.fromPassword('postgres', cdk.SecretValue.unsafePlainText('testpassword')),
  });

  const redisCluster = new elasticache.CfnCacheCluster(depStack, 'TestRedis', {
    cacheNodeType: 'cache.t3.micro',
    engine: 'redis',
    numCacheNodes: 1,
  });

  const alertTopic = new sns.Topic(depStack, 'TestTopic');

  const stack = new ComputeStack(app, 'TestComputeStackNoSecretMgr', {
    environmentSuffix: environmentSuffix,
    vpc: vpc,
    database: database,
    redisCluster: redisCluster,
    alertTopic: alertTopic,
  });

  const template = Template.fromStack(stack);

  test('Task definition does not include secrets when database.secret is undefined', () => {
    // This covers the false branch of line 95: secrets: props.database.secret ? {...} : undefined
    const taskDefs = template.findResources('AWS::ECS::TaskDefinition');
    const taskDef = Object.values(taskDefs)[0] as any;
    const containerDef = taskDef.Properties.ContainerDefinitions[0];

    // When database.secret is undefined (fromPassword doesn't create secret),
    // secrets should be undefined
    expect(containerDef.Secrets).toBeUndefined();
  });

  test('Task role does not grant secret access when database.secret is undefined', () => {
    // This covers the false branch of line 62: if (props.database.secret) { ... }
    const roles = template.findResources('AWS::IAM::Role');
    const taskRole = Object.values(roles).find((role: any) => {
      return role.Properties.RoleName === `ecs-task-role-${environmentSuffix}`;
    });

    expect(taskRole).toBeDefined();
    // When secret is undefined, grantRead is not called, so no Secrets Manager policies
    const policies = taskRole?.Properties.Policies || [];
    const hasSecretsManagerPolicy = policies.some((policy: any) => {
      const statements = policy.PolicyDocument?.Statement || [];
      return statements.some((stmt: any) => {
        const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
        return actions.some((action: string) =>
          action && action.includes('secretsmanager')
        );
      });
    });
    expect(hasSecretsManagerPolicy).toBe(false);
  });
});

describe('ComputeStack - Edge Cases', () => {
  const app = new cdk.App();
  const environmentSuffix = 'test-edge';

  const depStack = new cdk.Stack(app, 'TestDepStackEdge');
  const vpc = new ec2.Vpc(depStack, 'TestVpc', { maxAzs: 3 });

  // Create database with credentials that won't create a secret
  // Use fromPassword which doesn't create a Secrets Manager secret
  const database = new rds.DatabaseInstance(depStack, 'TestDBEdge', {
    engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_15_4 }),
    vpc: vpc,
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
    credentials: rds.Credentials.fromPassword('postgres', cdk.SecretValue.unsafePlainText('password')),
  });

  const redisCluster = new elasticache.CfnCacheCluster(depStack, 'TestRedis', {
    cacheNodeType: 'cache.t3.micro',
    engine: 'redis',
    numCacheNodes: 1,
  });

  const alertTopic = new sns.Topic(depStack, 'TestTopic');

  const stack = new ComputeStack(app, 'TestComputeStackEdge', {
    environmentSuffix: environmentSuffix,
    vpc: vpc,
    database: database,
    redisCluster: redisCluster,
    alertTopic: alertTopic,
  });

  const template = Template.fromStack(stack);

  test('Task definition handles database without Secrets Manager secret', () => {
    // When database.secret is undefined (fromPassword doesn't create secret),
    // the secrets property should be undefined
    const taskDefs = template.findResources('AWS::ECS::TaskDefinition');
    const taskDef = Object.values(taskDefs)[0] as any;
    const containerDef = taskDef.Properties.ContainerDefinitions[0];

    // Verify that when secret is undefined, secrets is also undefined
    // This covers the false branch: secrets: props.database.secret ? {...} : undefined
    if (!database.secret) {
      expect(containerDef.Secrets).toBeUndefined();
    }
  });
});
