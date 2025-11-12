import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';
import { Construct } from 'constructs';

export interface ComputeStackProps {
  environmentSuffix: string;
  region: string;
  vpc: ec2.IVpc;
  albSecurityGroup: ec2.ISecurityGroup;
  ecsSecurityGroup: ec2.ISecurityGroup;
}

export class ComputeStack extends Construct {
  public readonly cluster: ecs.Cluster;
  public readonly service: ecs.FargateService;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id);

    const {
      environmentSuffix,
      region,
      vpc,
      albSecurityGroup,
      ecsSecurityGroup,
    } = props;

    // ECS Cluster
    this.cluster = new ecs.Cluster(this, 'ECSCluster', {
      clusterName: `TapStack${environmentSuffix}Cluster${region}`,
      vpc,
      containerInsights: true,
    });

    // Cloud Map namespace for service discovery
    const namespace = this.cluster.addDefaultCloudMapNamespace({
      name: `tapstack${environmentSuffix.toLowerCase()}.local`,
      vpc,
    });

    // Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      'TaskDefinition',
      {
        family: `TapStack${environmentSuffix}Task`,
        cpu: 512,
        memoryLimitMiB: 1024,
        runtimePlatform: {
          cpuArchitecture: ecs.CpuArchitecture.X86_64,
          operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
        },
      }
    );

    // Log Group
    const logGroup = new logs.LogGroup(this, 'ContainerLogGroup', {
      logGroupName: `/ecs/TapStack${environmentSuffix}${region}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Container Definition
    const container = taskDefinition.addContainer('AppContainer', {
      containerName: 'app',
      image: ecs.ContainerImage.fromRegistry('nginx:alpine'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'app',
        logGroup,
      }),
      healthCheck: {
        command: [
          'CMD-SHELL',
          'wget --quiet --tries=1 --spider http://localhost:80/ || exit 1',
        ],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
      environment: {
        REGION: region,
        ENVIRONMENT_SUFFIX: environmentSuffix,
      },
    });

    container.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP,
    });

    // Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      loadBalancerName: `TapStack${environmentSuffix}ALB${region}`,
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      targetGroupName: `TapStack${environmentSuffix}TG${region}`,
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    // Listener
    this.loadBalancer.addListener('HTTPListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Fargate Service
    this.service = new ecs.FargateService(this, 'FargateService', {
      serviceName: `TapStack${environmentSuffix}Service${region}`,
      cluster: this.cluster,
      taskDefinition,
      desiredCount: 2,
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
      securityGroups: [ecsSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      cloudMapOptions: {
        name: 'app',
        cloudMapNamespace: namespace,
        dnsRecordType: servicediscovery.DnsRecordType.A,
        dnsTtl: cdk.Duration.seconds(60),
      },
      circuitBreaker: {
        enable: true,
        rollback: true,
      },
      enableExecuteCommand: true,
    });

    // Attach to target group
    this.service.attachToApplicationTargetGroup(targetGroup);

    // Auto Scaling
    const scaling = this.service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    scaling.scaleOnCpuUtilization('CPUScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: this.loadBalancer.loadBalancerDnsName,
      description: 'ALB DNS Name',
      exportName: `TapStack${environmentSuffix}LoadBalancerDNS${region}`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerArn', {
      value: this.loadBalancer.loadBalancerArn,
      description: 'ALB ARN',
      exportName: `TapStack${environmentSuffix}LoadBalancerArn${region}`,
    });

    new cdk.CfnOutput(this, 'ServiceName', {
      value: this.service.serviceName,
      description: 'ECS Service Name',
      exportName: `TapStack${environmentSuffix}ServiceName${region}`,
    });

    new cdk.CfnOutput(this, 'ClusterArn', {
      value: this.cluster.clusterArn,
      description: 'ECS Cluster ARN',
      exportName: `TapStack${environmentSuffix}ClusterArn${region}`,
    });
  }
}
