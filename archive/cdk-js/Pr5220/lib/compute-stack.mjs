import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

export class ComputeStack extends Construct {
  constructor(scope, id, props) {
    super(scope, id);

    const environmentSuffix = props.environmentSuffix;
    const vpc = props.vpc;
    const securityGroup = props.securityGroup;
    const dataStream = props.dataStream;
    const fileSystem = props.fileSystem;
    const accessPoint = props.accessPoint;

    // ECS cluster for data processing
    this.cluster = new ecs.Cluster(this, 'ProcessingCluster', {
      clusterName: `healthtech-cluster-${environmentSuffix}`,
      vpc: vpc,
      containerInsights: true,
    });

    // Task execution role
    const executionRole = new iam.Role(this, 'TaskExecutionRole', {
      roleName: `ecs-execution-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // Task role with permissions
    const taskRole = new iam.Role(this, 'TaskRole', {
      roleName: `ecs-task-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Grant Kinesis read permissions
    dataStream.grantRead(taskRole);

    // Grant EFS access
    fileSystem.grant(taskRole, 'elasticfilesystem:ClientMount', 'elasticfilesystem:ClientWrite');

    // CloudWatch Logs
    const logGroup = new logs.LogGroup(this, 'TaskLogGroup', {
      logGroupName: `/ecs/healthtech-processor-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Fargate task definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDefinition', {
      family: `healthtech-processor-${environmentSuffix}`,
      memoryLimitMiB: 2048,
      cpu: 1024,
      executionRole: executionRole,
      taskRole: taskRole,
    });

    // Add EFS volume
    taskDefinition.addVolume({
      name: 'efs-storage',
      efsVolumeConfiguration: {
        fileSystemId: fileSystem.fileSystemId,
        transitEncryption: 'ENABLED',
        authorizationConfig: {
          accessPointId: accessPoint.accessPointId,
          iam: 'ENABLED',
        },
      },
    });

    // Container definition
    const container = taskDefinition.addContainer('processor', {
      containerName: 'data-processor',
      image: ecs.ContainerImage.fromRegistry('amazon/aws-cli:latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'processor',
        logGroup: logGroup,
      }),
      environment: {
        KINESIS_STREAM_NAME: dataStream.streamName,
        AWS_REGION: cdk.Stack.of(this).region,
      },
      healthCheck: {
        command: ['CMD-SHELL', 'echo "healthy"'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    // Mount EFS volume
    container.addMountPoints({
      sourceVolume: 'efs-storage',
      containerPath: '/mnt/efs',
      readOnly: false,
    });

    // Fargate service
    this.service = new ecs.FargateService(this, 'ProcessingService', {
      serviceName: `healthtech-service-${environmentSuffix}`,
      cluster: this.cluster,
      taskDefinition: taskDefinition,
      desiredCount: 2,
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [securityGroup],
    });

    // Auto-scaling configuration
    const scaling = this.service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // CloudWatch alarms
    const cpuAlarm = new cloudwatch.Alarm(this, 'ServiceCPUAlarm', {
      alarmName: `ecs-cpu-utilization-${environmentSuffix}`,
      metric: this.service.metricCpuUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // Tag all resources
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', 'HealthTech-DR');
    cdk.Tags.of(this).add('Compliance', 'HIPAA');
  }
}
