// microservices.ts
import * as cdk from 'aws-cdk-lib';
import * as appmesh from 'aws-cdk-lib/aws-appmesh';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface MicroserviceConstructProps {
  cluster: ecs.Cluster;
  vpc: ec2.Vpc;
  serviceName: string;
  repository: ecr.Repository;
  image: string;
  cpu: number;
  memory: number;
  port: number;
  desiredCount: number;
  secrets: { [key: string]: secretsmanager.Secret };
  securityGroup: ec2.SecurityGroup;
  virtualNode: appmesh.VirtualNode;
  environment?: { [key: string]: string };
  healthCheckPath: string;
}

export class MicroserviceConstruct extends Construct {
  public readonly service: ecs.FargateService;
  public readonly taskDefinition: ecs.FargateTaskDefinition;
  public readonly logGroup: logs.LogGroup;
  public readonly cpuAlarm: cdk.aws_cloudwatch.Alarm;
  public readonly memoryAlarm: cdk.aws_cloudwatch.Alarm;

  constructor(scope: Construct, id: string, props: MicroserviceConstructProps) {
    super(scope, id);

    const stackName = cdk.Stack.of(this).stackName;

    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: `/ecs/${stackName}/${props.serviceName}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const executionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy'
        ),
      ],
    });

    executionRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'ecr:GetAuthorizationToken',
          'ecr:BatchCheckLayerAvailability',
          'ecr:GetDownloadUrlForLayer',
          'ecr:BatchGetImage',
        ],
        resources: ['*'],
      })
    );

    executionRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: Object.values(props.secrets).map(secret => secret.secretArn),
      })
    );

    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    taskRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AWSAppMeshEnvoyAccess')
    );

    taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: [this.logGroup.logGroupArn],
      })
    );

    this.taskDefinition = new ecs.FargateTaskDefinition(
      this,
      'TaskDefinition',
      {
        family: props.serviceName,
        cpu: props.cpu,
        memoryLimitMiB: props.memory,
        executionRole,
        taskRole,
        proxyConfiguration: new ecs.AppMeshProxyConfiguration({
          containerName: 'envoy',
          properties: {
            appPorts: [props.port],
            proxyEgressPort: 15001,
            proxyIngressPort: 15000,
            ignoredUID: 1337,
            egressIgnoredIPs: ['169.254.170.2', '169.254.169.254'],
          },
        }),
      }
    );

    const imageTag = props.image.includes(':')
      ? props.image.split(':')[1]
      : 'latest';
    const appContainer = this.taskDefinition.addContainer(props.serviceName, {
      containerName: props.serviceName,
      image: ecs.ContainerImage.fromEcrRepository(props.repository, imageTag),
      cpu: Math.max(128, props.cpu - 256),
      memoryLimitMiB: Math.max(256, props.memory - 512),
      environment: {
        ...(props.environment || {}),
        PORT: props.port.toString(),
        AWS_REGION: cdk.Stack.of(this).region,
        APPMESH_VIRTUAL_NODE_NAME: `mesh/${props.virtualNode.mesh.meshName}/virtualNode/${props.virtualNode.virtualNodeName}`,
      },
      secrets: {
        DATABASE_URL: ecs.Secret.fromSecretsManager(props.secrets.databaseUrl),
        API_KEY: ecs.Secret.fromSecretsManager(props.secrets.apiKey),
      },
      logging: ecs.LogDriver.awsLogs({
        logGroup: this.logGroup,
        streamPrefix: props.serviceName,
      }),
      healthCheck: {
        command: [
          'CMD-SHELL',
          `curl -f http://localhost:${props.port}${props.healthCheckPath} || exit 1`,
        ],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        startPeriod: cdk.Duration.seconds(60),
        retries: 3,
      },
      portMappings: [{ containerPort: props.port, protocol: ecs.Protocol.TCP }],
    });

    const envoyLogGroup = new logs.LogGroup(this, 'EnvoyLogGroup', {
      logGroupName: `/ecs/${stackName}/${props.serviceName}/envoy`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const envoyContainer = this.taskDefinition.addContainer('envoy', {
      containerName: 'envoy',
      image: ecs.ContainerImage.fromRegistry(
        'public.ecr.aws/appmesh/aws-appmesh-envoy:v1.27.0.0-prod'
      ),
      cpu: 256,
      memoryLimitMiB: 512,
      environment: {
        APPMESH_VIRTUAL_NODE_NAME: `mesh/${props.virtualNode.mesh.meshName}/virtualNode/${props.virtualNode.virtualNodeName}`,
        AWS_REGION: cdk.Stack.of(this).region,
        ENABLE_ENVOY_STATS_TAGS: '1',
        ENABLE_ENVOY_DOG_STATSD: '1',
      },
      user: '1337',
      logging: ecs.LogDriver.awsLogs({
        logGroup: envoyLogGroup,
        streamPrefix: 'envoy',
      }),
      healthCheck: {
        command: [
          'CMD-SHELL',
          'curl -s http://localhost:9901/server_info | grep state | grep -q LIVE',
        ],
        interval: cdk.Duration.seconds(5),
        timeout: cdk.Duration.seconds(2),
        startPeriod: cdk.Duration.seconds(10),
        retries: 3,
      },
    });

    appContainer.addContainerDependencies({
      container: envoyContainer,
      condition: ecs.ContainerDependencyCondition.HEALTHY,
    });

    this.service = new ecs.FargateService(this, 'Service', {
      serviceName: props.serviceName,
      cluster: props.cluster,
      taskDefinition: this.taskDefinition,
      desiredCount: props.desiredCount,
      assignPublicIp: false,
      securityGroups: [props.securityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      healthCheckGracePeriod: cdk.Duration.seconds(60),
      enableECSManagedTags: true,
      propagateTags: ecs.PropagatedTagSource.SERVICE,
      enableExecuteCommand: true,
      capacityProviderStrategies: [
        { capacityProvider: 'FARGATE_SPOT', weight: 2 },
        { capacityProvider: 'FARGATE', weight: 1 },
      ],
    });

    const autoScalingTarget = this.service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    autoScalingTarget.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    autoScalingTarget.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 75,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    this.cpuAlarm = this.service
      .metricCpuUtilization()
      .createAlarm(this, 'CpuAlarm', {
        threshold: 80,
        evaluationPeriods: 2,
        treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `High CPU utilization for ${props.serviceName}`,
      });

    this.memoryAlarm = this.service
      .metricMemoryUtilization()
      .createAlarm(this, 'MemoryAlarm', {
        threshold: 85,
        evaluationPeriods: 2,
        treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `High memory utilization for ${props.serviceName}`,
      });
  }
}
