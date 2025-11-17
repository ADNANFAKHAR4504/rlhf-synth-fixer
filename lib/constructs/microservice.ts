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
  environment: { [key: string]: string };
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

    // Create CloudWatch Log Group
    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: `/ecs/${props.serviceName}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create Task Execution Role
    const executionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy'
        ),
      ],
    });

    // Add permissions to pull from ECR
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

    // Add permissions to access secrets
    executionRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: Object.values(props.secrets).map(secret => secret.secretArn),
      })
    );

    // Create Task Role
    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Add App Mesh permissions
    taskRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AWSAppMeshEnvoyAccess')
    );

    // Add CloudWatch Logs permissions
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

    // Create Fargate Task Definition
    this.taskDefinition = new ecs.FargateTaskDefinition(
      this,
      'TaskDefinition',
      {
        family: props.serviceName,
        cpu: props.cpu,
        memoryLimitMiB: props.memory,
        executionRole: executionRole,
        taskRole: taskRole,
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

    // Add main application container
    const appContainer = this.taskDefinition.addContainer(props.serviceName, {
      containerName: props.serviceName,
      image: ecs.ContainerImage.fromEcrRepository(
        props.repository,
        props.image.split(':')[1] || 'latest'
      ),
      cpu: props.cpu - 256, // Reserve 256 CPU units for Envoy
      memoryLimitMiB: props.memory - 512, // Reserve 512 MiB for Envoy
      environment: {
        ...props.environment,
        PORT: props.port.toString(),
        AWS_REGION: cdk.Stack.of(this).region,
        APPMESH_VIRTUAL_NODE_NAME: `mesh/${props.virtualNode.mesh.meshName}/virtualNode/${props.virtualNode.virtualNodeName}`,
      },
      secrets: {
        DATABASE_URL: ecs.Secret.fromSecretsManager(props.secrets.databaseUrl),
        API_KEY: ecs.Secret.fromSecretsManager(props.secrets.apiKey),
      },
      logging: new ecs.AwsLogDriver({
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
      portMappings: [
        {
          containerPort: props.port,
          protocol: ecs.Protocol.TCP,
        },
      ],
    });

    // Add Envoy sidecar container
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
      logging: new ecs.AwsLogDriver({
        logGroup: new logs.LogGroup(this, 'EnvoyLogGroup', {
          logGroupName: `/ecs/${props.serviceName}/envoy`,
          retention: logs.RetentionDays.ONE_WEEK,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
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

    // Container dependency
    appContainer.addContainerDependencies({
      container: envoyContainer,
      condition: ecs.ContainerDependencyCondition.HEALTHY,
    });

    // Create Fargate Service
    this.service = new ecs.FargateService(this, 'Service', {
      serviceName: props.serviceName,
      cluster: props.cluster,
      taskDefinition: this.taskDefinition,
      desiredCount: props.desiredCount,
      assignPublicIp: false,
      securityGroups: [props.securityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      healthCheckGracePeriod: cdk.Duration.seconds(60),
      enableECSManagedTags: true,
      propagateTags: ecs.PropagatedTagSource.SERVICE,
      enableExecuteCommand: true,
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE_SPOT',
          weight: 2,
        },
        {
          capacityProvider: 'FARGATE',
          weight: 1,
        },
      ],
    });

    // Configure Auto Scaling
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

    // Add CloudWatch Alarms
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
