import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface EcsStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  ecsSecurityGroup: ec2.SecurityGroup;
  albSecurityGroup: ec2.SecurityGroup;
  fileSystem: efs.FileSystem;
  accessPoint: efs.AccessPoint;
  dbSecret: secretsmanager.Secret;
}

export class EcsStack extends Construct {
  public readonly cluster: ecs.Cluster;
  public readonly service: ecs.FargateService;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id);

    // Create ECS Cluster
    this.cluster = new ecs.Cluster(this, 'HealthcareCluster', {
      clusterName: `healthcare-cluster-${props.environmentSuffix}`,
      vpc: props.vpc,
      containerInsights: true,
    });

    // Create Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      'HealthcareAlb',
      {
        loadBalancerName: `healthcare-alb-${props.environmentSuffix}`,
        vpc: props.vpc,
        internetFacing: true,
        securityGroup: props.albSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    // Create Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'HealthcareTg', {
      targetGroupName: `healthcare-tg-${props.environmentSuffix}`,
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
    });

    // Add listener
    this.loadBalancer.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Create Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      'HealthcareTask',
      {
        family: `healthcare-task-${props.environmentSuffix}`,
        cpu: 512,
        memoryLimitMiB: 1024,
      }
    );

    // Add EFS volume to task definition
    taskDefinition.addVolume({
      name: 'efs-storage',
      efsVolumeConfiguration: {
        fileSystemId: props.fileSystem.fileSystemId,
        transitEncryption: 'ENABLED',
        authorizationConfig: {
          accessPointId: props.accessPoint.accessPointId,
          iam: 'ENABLED',
        },
      },
    });

    // Grant EFS permissions to task role
    props.fileSystem.grant(
      taskDefinition.taskRole,
      'elasticfilesystem:ClientMount',
      'elasticfilesystem:ClientWrite'
    );

    // Create CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'HealthcareLogGroup', {
      logGroupName: `/ecs/healthcare-${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add container to task definition
    const container = taskDefinition.addContainer('HealthcareContainer', {
      containerName: `healthcare-app-${props.environmentSuffix}`,
      image: ecs.ContainerImage.fromRegistry('nginx:latest'), // Placeholder image
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: 'healthcare',
        logGroup: logGroup,
      }),
      secrets: {
        DB_HOST: ecs.Secret.fromSecretsManager(props.dbSecret, 'host'),
        DB_PORT: ecs.Secret.fromSecretsManager(props.dbSecret, 'port'),
        DB_NAME: ecs.Secret.fromSecretsManager(props.dbSecret, 'dbname'),
        DB_USERNAME: ecs.Secret.fromSecretsManager(props.dbSecret, 'username'),
        DB_PASSWORD: ecs.Secret.fromSecretsManager(props.dbSecret, 'password'),
      },
      environment: {
        ENVIRONMENT: props.environmentSuffix,
      },
    });

    // Mount EFS volume
    container.addMountPoints({
      containerPath: '/mnt/efs',
      sourceVolume: 'efs-storage',
      readOnly: false,
    });

    // Add port mapping
    container.addPortMappings({
      containerPort: 8080,
      protocol: ecs.Protocol.TCP,
    });

    // Grant secret read permissions
    props.dbSecret.grantRead(taskDefinition.taskRole);

    // Create Fargate Service in private subnets
    this.service = new ecs.FargateService(this, 'HealthcareService', {
      serviceName: `healthcare-service-${props.environmentSuffix}`,
      cluster: this.cluster,
      taskDefinition: taskDefinition,
      desiredCount: 2,
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
      securityGroups: [props.ecsSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, // Private subnets with NAT
      },
      assignPublicIp: false, // No public IP - private subnet only
    });

    // Attach service to target group
    this.service.attachToApplicationTargetGroup(targetGroup);

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDns', {
      value: this.loadBalancer.loadBalancerDnsName,
      exportName: `healthcare-alb-dns-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: this.cluster.clusterName,
      exportName: `healthcare-cluster-name-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ServiceName', {
      value: this.service.serviceName,
      exportName: `healthcare-service-name-${props.environmentSuffix}`,
    });
  }
}
