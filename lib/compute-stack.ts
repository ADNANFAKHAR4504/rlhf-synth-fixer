import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface ComputeStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  ecsSecurityGroup: ec2.SecurityGroup;
  loadBalancerSecurityGroup: ec2.SecurityGroup;
  fileSystem: efs.FileSystem;
  databaseSecret: secretsmanager.Secret;
  applicationSecret: secretsmanager.Secret;
  redisEndpoint: string;
  kinesisStream: kinesis.Stream;
}

export class ComputeStack extends Construct {
  public readonly cluster: ecs.Cluster;
  public readonly service: ecs.FargateService;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly targetGroup: elbv2.ApplicationTargetGroup;
  public readonly vpcLink: apigateway.VpcLink;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id);

    // Create ECS cluster
    this.cluster = new ecs.Cluster(this, 'PaymentCluster', {
      vpc: props.vpc,
      clusterName: `payment-cluster-${props.environmentSuffix}`,
      containerInsights: true,
      enableFargateCapacityProviders: true,
    });

    // Create Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'PaymentALB', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: props.loadBalancerSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      dropInvalidHeaderFields: true,
      http2Enabled: true,
    });

    // Create target group
    this.targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'PaymentTargetGroup',
      {
        vpc: props.vpc,
        port: 8080,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: '/health',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
        deregistrationDelay: cdk.Duration.seconds(30),
      }
    );

    // Add listener
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const listener = this.loadBalancer.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [this.targetGroup],
    });

    // Create CloudWatch log group
    const logGroup = new logs.LogGroup(this, 'PaymentServiceLogs', {
      logGroupName: `/ecs/payment-service-${props.environmentSuffix}`,
      retention: logs.RetentionDays.THREE_MONTHS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create task execution role
    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy'
        ),
      ],
    });

    // Grant secrets access to execution role
    props.databaseSecret.grantRead(taskExecutionRole);
    props.applicationSecret.grantRead(taskExecutionRole);

    // Create task role
    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Grant permissions to task role
    props.kinesisStream.grantWrite(taskRole);
    props.databaseSecret.grantRead(taskRole);
    props.applicationSecret.grantRead(taskRole);

    // Add X-Ray permissions
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'xray:PutTraceSegments',
          'xray:PutTelemetryRecords',
          'xray:GetSamplingRules',
          'xray:GetSamplingTargets',
          'xray:GetSamplingStatisticSummaries',
        ],
        resources: ['*'],
      })
    );

    // Create task definition
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      'PaymentTaskDef',
      {
        memoryLimitMiB: 2048,
        cpu: 1024,
        executionRole: taskExecutionRole,
        taskRole: taskRole,
        volumes: [
          {
            name: 'efs-storage',
            efsVolumeConfiguration: {
              fileSystemId: props.fileSystem.fileSystemId,
              transitEncryption: 'ENABLED',
            },
          },
        ],
      }
    );

    // Add main container
    const container = taskDefinition.addContainer('PaymentContainer', {
      image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'payment-service',
        logGroup: logGroup,
      }),
      environment: {
        REDIS_ENDPOINT: props.redisEndpoint,
        KINESIS_STREAM_NAME: props.kinesisStream.streamName,
        AWS_REGION: cdk.Stack.of(this).region,
      },
      secrets: {
        DB_HOST: ecs.Secret.fromSecretsManager(props.databaseSecret, 'host'),
        DB_USERNAME: ecs.Secret.fromSecretsManager(
          props.databaseSecret,
          'username'
        ),
        DB_PASSWORD: ecs.Secret.fromSecretsManager(
          props.databaseSecret,
          'password'
        ),
        APP_SECRET: ecs.Secret.fromSecretsManager(
          props.applicationSecret,
          'jwtSecret'
        ),
      },
    });

    container.addPortMappings({
      containerPort: 8080,
      protocol: ecs.Protocol.TCP,
    });

    container.addMountPoints({
      containerPath: '/mnt/efs',
      sourceVolume: 'efs-storage',
      readOnly: false,
    });

    // Add X-Ray sidecar container
    taskDefinition.addContainer('XRayContainer', {
      image: ecs.ContainerImage.fromRegistry(
        'public.ecr.aws/xray/aws-xray-daemon:latest'
      ),
      cpu: 32,
      memoryReservationMiB: 256,
      portMappings: [
        {
          containerPort: 2000,
          protocol: ecs.Protocol.UDP,
        },
      ],
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'xray',
        logGroup: logGroup,
      }),
    });

    // Create Fargate service
    this.service = new ecs.FargateService(this, 'PaymentService', {
      cluster: this.cluster,
      taskDefinition: taskDefinition,
      desiredCount: 3,
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      securityGroups: [props.ecsSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      enableExecuteCommand: true,
      circuitBreaker: {
        rollback: true,
      },
      enableECSManagedTags: true,
      propagateTags: ecs.PropagatedTagSource.SERVICE,
    });

    // Attach service to target group
    this.service.attachToApplicationTargetGroup(this.targetGroup);

    // Grant EFS access to ECS task
    props.fileSystem.grantRootAccess(taskRole);

    // Configure auto-scaling
    const scaling = this.service.autoScaleTaskCount({
      minCapacity: 3,
      maxCapacity: 10,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Create VPC Link for API Gateway
    const vpcLinkSecurityGroup = new ec2.SecurityGroup(
      this,
      'VpcLinkSecurityGroup',
      {
        vpc: props.vpc,
        description: 'Security group for VPC Link',
        allowAllOutbound: true,
      }
    );

    this.vpcLink = new apigateway.VpcLink(this, 'VpcLink', {
      vpcLinkName: `payment-vpc-link-${props.environmentSuffix}`,
      targets: [this.loadBalancer],
      vpcLinkSecurityGroups: [vpcLinkSecurityGroup],
    });

    // Tags for compliance
    cdk.Tags.of(this.cluster).add('PCICompliant', 'true');
    cdk.Tags.of(this.service).add('PCICompliant', 'true');
    cdk.Tags.of(this.service).add('Environment', props.environmentSuffix);
  }
}
