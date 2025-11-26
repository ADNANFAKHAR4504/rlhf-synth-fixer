import * as cdk from 'aws-cdk-lib';
import * as applicationautoscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

interface BlueGreenEcsStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  vpcCidr?: string;
  containerImage?: string;
  containerPort?: number;
  ecsAmi?: string;
  instanceType?: string;
  keyName?: string;
  desiredCapacity?: number;
}

export class BlueGreenEcsStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly ecsCluster: ecs.Cluster;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly blueTargetGroup: elbv2.ApplicationTargetGroup;
  public readonly greenTargetGroup: elbv2.ApplicationTargetGroup;
  public readonly blueService: ecs.Ec2Service;
  public readonly greenService: ecs.Ec2Service;
  public readonly snsTopic: sns.Topic;
  public readonly serviceDiscoveryNamespace: servicediscovery.PrivateDnsNamespace;

  constructor(scope: Construct, id: string, props?: BlueGreenEcsStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') || 'dev';
    const vpcCidr = props?.vpcCidr || '10.0.0.0/16';
    const containerImage = props?.containerImage || 'nginx:latest';
    const containerPort = props?.containerPort || 80;
    const ecsAmi = props?.ecsAmi ||
      '/aws/service/ecs/optimized-ami/amazon-linux-2/recommended/image_id';
    const instanceType = props?.instanceType || 't3.medium';
    const desiredCapacity = props?.desiredCapacity || 3;

    // VPC with public and private subnets
    this.vpc = new ec2.Vpc(this, 'VPC', {
      cidr: vpcCidr,
      maxAzs: 3,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      natGateways: 3,
    });

    // Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Application Load Balancer',
    });
    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));
    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443));

    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'ECSSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for ECS tasks',
    });
    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(containerPort)
    );

    const ec2InstanceSecurityGroup = new ec2.SecurityGroup(this, 'EC2InstanceSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for ECS EC2 instances',
    });
    ec2InstanceSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22));

    // Network ACLs
    const networkAcl = new ec2.NetworkAcl(this, 'NetworkAcl', {
      vpc: this.vpc,
    });

    networkAcl.addEntry('InboundHTTP', {
      ruleNumber: 100,
      cidr: ec2.AclCidr.anyIpv4(),
      traffic: ec2.AclTraffic.tcpPort(80),
      ruleAction: ec2.Action.ALLOW,
    });

    networkAcl.addEntry('InboundHTTPS', {
      ruleNumber: 110,
      cidr: ec2.AclCidr.anyIpv4(),
      traffic: ec2.AclTraffic.tcpPort(443),
      ruleAction: ec2.Action.ALLOW,
    });

    networkAcl.addEntry('Inbound8080', {
      ruleNumber: 120,
      cidr: ec2.AclCidr.anyIpv4(),
      traffic: ec2.AclTraffic.tcpPort(8080),
      ruleAction: ec2.Action.ALLOW,
    });

    networkAcl.addEntry('InboundEphemeral', {
      ruleNumber: 130,
      cidr: ec2.AclCidr.anyIpv4(),
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      ruleAction: ec2.Action.ALLOW,
    });

    networkAcl.addEntry('Outbound', {
      ruleNumber: 100,
      cidr: ec2.AclCidr.anyIpv4(),
      traffic: ec2.AclTraffic.allTraffic(),
      ruleAction: ec2.Action.ALLOW,
      direction: ec2.TrafficDirection.EGRESS,
    });

    // ECS Cluster
    this.ecsCluster = new ecs.Cluster(this, 'ECSCluster', {
      vpc: this.vpc,
      clusterName: `ecs-cluster-${environmentSuffix}`,
      containerInsights: true,
    });

    // IAM Roles
    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy'
        ),
      ],
    });

    taskExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'secretsmanager:GetSecretValue',
          'secretsmanager:DescribeSecret',
        ],
        resources: ['*'],
      })
    );

    taskExecutionRole.addToPolicy(
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

    taskExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:CreateLogGroup',
        ],
        resources: ['*'],
      })
    );

    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    const ec2InstanceRole = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonEC2ContainerServiceforEC2Role'
        ),
      ],
    });

    const ec2InstanceProfile = new iam.CfnInstanceProfile(this, 'EC2InstanceProfile', {
      instanceProfileName: `ecs-instance-profile-${environmentSuffix}`,
      roles: [ec2InstanceRole.roleName],
    });

    // Launch Template for EC2 instances
    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      launchTemplateName: `ecs-launch-template-${environmentSuffix}`,
      machineImage: ec2.MachineImage.fromSsmParameter(ecsAmi),
      instanceType: new ec2.InstanceType(instanceType),
      keyName: props?.keyName,
      iamInstanceProfile: ec2InstanceProfile,
      securityGroup: ec2InstanceSecurityGroup,
      userData: ec2.UserData.custom(
        `#!/bin/bash
echo ECS_CLUSTER=ecs-cluster-${environmentSuffix} >> /etc/ecs/ecs.config
yum update -y
echo 'ECS_AVAILABLE_LOGGING_DRIVERS=["json-file","awslogs"]' >> /etc/ecs/ecs.config`
      ),
      monitoring: {
        enabled: true,
      },
    });

    // Auto Scaling Groups for Blue and Green environments
    const blueAsg = new autoscaling.AutoScalingGroup(this, 'BlueASG', {
      autoScalingGroupName: `blue-asg-${environmentSuffix}`,
      launchTemplate: launchTemplate,
      minCapacity: 1,
      maxCapacity: 10,
      desiredCapacity: desiredCapacity,
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Add tags to blue ASG
    cdk.Tags.of(blueAsg).add('Name', `blue-ecs-instance-${environmentSuffix}`);
    cdk.Tags.of(blueAsg).add('Environment', 'blue');

    const greenAsg = new autoscaling.AutoScalingGroup(this, 'GreenASG', {
      autoScalingGroupName: `green-asg-${environmentSuffix}`,
      launchTemplate: launchTemplate,
      minCapacity: 1,
      maxCapacity: 10,
      desiredCapacity: desiredCapacity,
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Add tags to green ASG
    cdk.Tags.of(greenAsg).add('Name', `green-ecs-instance-${environmentSuffix}`);
    cdk.Tags.of(greenAsg).add('Environment', 'green');

    // Capacity Providers
    const blueCapacityProvider = new ecs.CfnCapacityProvider(this, 'BlueCapacityProvider', {
      name: `blue-capacity-provider-${environmentSuffix}`,
      autoScalingGroupProvider: {
        autoScalingGroupArn: blueAsg.autoScalingGroupArn,
        managedScaling: {
          status: 'ENABLED',
          targetCapacity: 80,
          minimumScalingStepSize: 1,
          maximumScalingStepSize: 10,
        },
        managedTerminationProtection: 'ENABLED',
      },
    });

    const greenCapacityProvider = new ecs.CfnCapacityProvider(this, 'GreenCapacityProvider', {
      name: `green-capacity-provider-${environmentSuffix}`,
      autoScalingGroupProvider: {
        autoScalingGroupArn: greenAsg.autoScalingGroupArn,
        managedScaling: {
          status: 'ENABLED',
          targetCapacity: 80,
          minimumScalingStepSize: 1,
          maximumScalingStepSize: 10,
        },
        managedTerminationProtection: 'ENABLED',
      },
    });

    // Add capacity providers to cluster
    const cfnCluster = this.ecsCluster.node.defaultChild as ecs.CfnCluster;
    cfnCluster.capacityProviders = [
      blueCapacityProvider.ref,
      greenCapacityProvider.ref,
    ];
    cfnCluster.defaultCapacityProviderStrategy = [
      {
        capacityProvider: blueCapacityProvider.ref,
        weight: 1,
      },
    ];

    // CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: `/ecs/${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
    });

    // Task Definition
    const taskDefinition = new ecs.TaskDefinition(this, 'TaskDefinition', {
      family: `task-def-${environmentSuffix}`,
      compatibility: ecs.Compatibility.EC2,
      cpu: '1024',
      memoryMiB: '2048',
      networkMode: ecs.NetworkMode.AWS_VPC,
      executionRole: taskExecutionRole,
      taskRole: taskRole,
    });

    taskDefinition.addContainer('Container', {
      containerName: `container-${environmentSuffix}`,
      image: ecs.ContainerImage.fromRegistry(containerImage),
      cpu: 1024,
      memoryLimitMiB: 2048,
      essential: true,
      portMappings: [
        {
          containerPort: containerPort,
          protocol: ecs.Protocol.TCP,
        },
      ],
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'ecs',
        logGroup: logGroup,
      }),
    });

    // Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ApplicationLoadBalancer', {
      loadBalancerName: `alb-${environmentSuffix}`,
      vpc: this.vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
    });

    // Target Groups
    this.blueTargetGroup = new elbv2.ApplicationTargetGroup(this, 'BlueTargetGroup', {
      targetGroupName: `blue-tg-${environmentSuffix}`,
      port: containerPort,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      vpc: this.vpc,
      healthCheck: {
        interval: cdk.Duration.seconds(15),
        path: '/',
        protocol: elbv2.Protocol.HTTP,
        timeout: cdk.Duration.seconds(10),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    this.greenTargetGroup = new elbv2.ApplicationTargetGroup(this, 'GreenTargetGroup', {
      targetGroupName: `green-tg-${environmentSuffix}`,
      port: containerPort,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      vpc: this.vpc,
      healthCheck: {
        interval: cdk.Duration.seconds(15),
        path: '/',
        protocol: elbv2.Protocol.HTTP,
        timeout: cdk.Duration.seconds(10),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    // ALB Listener with path-based routing
    const listener = new elbv2.ApplicationListener(this, 'ALBListener', {
      loadBalancer: this.loadBalancer,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.weightedForward([
        {
          targetGroup: this.blueTargetGroup,
          weight: 100,
        },
        {
          targetGroup: this.greenTargetGroup,
          weight: 0,
        },
      ]),
    });

    // Add path-based routing rules for direct environment access
    listener.addAction('BluePathRule', {
      priority: 1,
      conditions: [
        elbv2.ListenerCondition.pathPatterns(['/blue', '/blue/*']),
      ],
      action: elbv2.ListenerAction.forward([this.blueTargetGroup]),
    });

    listener.addAction('GreenPathRule', {
      priority: 2,
      conditions: [
        elbv2.ListenerCondition.pathPatterns(['/green', '/green/*']),
      ],
      action: elbv2.ListenerAction.forward([this.greenTargetGroup]),
    });

    // Service Discovery Namespace
    this.serviceDiscoveryNamespace = new servicediscovery.PrivateDnsNamespace(this, 'ServiceDiscoveryNamespace', {
      name: `local-${environmentSuffix}`,
      vpc: this.vpc,
    });

    // Service Discovery Services
    const blueServiceDiscoveryService = new servicediscovery.Service(this, 'BlueServiceDiscoveryService', {
      name: 'blue',
      namespace: this.serviceDiscoveryNamespace,
      dnsRecordType: servicediscovery.DnsRecordType.A,
      dnsTtl: cdk.Duration.seconds(60),
      customHealthCheck: {
        failureThreshold: 1,
      },
    });

    const greenServiceDiscoveryService = new servicediscovery.Service(this, 'GreenServiceDiscoveryService', {
      name: 'green',
      namespace: this.serviceDiscoveryNamespace,
      dnsRecordType: servicediscovery.DnsRecordType.A,
      dnsTtl: cdk.Duration.seconds(60),
      customHealthCheck: {
        failureThreshold: 1,
      },
    });

    // ECS Services using CfnService for more control
    const blueServiceCfn = new ecs.CfnService(this, 'BlueECSService', {
      serviceName: `blue-service-${environmentSuffix}`,
      cluster: this.ecsCluster.clusterName,
      taskDefinition: taskDefinition.taskDefinitionArn,
      desiredCount: 3,
      capacityProviderStrategy: [
        {
          capacityProvider: blueCapacityProvider.ref,
          weight: 1,
        },
      ],
      networkConfiguration: {
        awsvpcConfiguration: {
          assignPublicIp: 'DISABLED',
          securityGroups: [ecsSecurityGroup.securityGroupId],
          subnets: this.vpc.selectSubnets({
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          }).subnetIds,
        },
      },
      loadBalancers: [
        {
          targetGroupArn: this.blueTargetGroup.targetGroupArn,
          containerName: `container-${environmentSuffix}`,
          containerPort: containerPort,
        },
      ],
      serviceRegistries: [
        {
          registryArn: blueServiceDiscoveryService.serviceArn,
        },
      ],
      deploymentConfiguration: {
        maximumPercent: 200,
        minimumHealthyPercent: 50,
        deploymentCircuitBreaker: {
          enable: true,
          rollback: true,
        },
      },
      healthCheckGracePeriodSeconds: 60,
    });

    const greenServiceCfn = new ecs.CfnService(this, 'GreenECSService', {
      serviceName: `green-service-${environmentSuffix}`,
      cluster: this.ecsCluster.clusterName,
      taskDefinition: taskDefinition.taskDefinitionArn,
      desiredCount: 3,
      capacityProviderStrategy: [
        {
          capacityProvider: greenCapacityProvider.ref,
          weight: 1,
        },
      ],
      networkConfiguration: {
        awsvpcConfiguration: {
          assignPublicIp: 'DISABLED',
          securityGroups: [ecsSecurityGroup.securityGroupId],
          subnets: this.vpc.selectSubnets({
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          }).subnetIds,
        },
      },
      loadBalancers: [
        {
          targetGroupArn: this.greenTargetGroup.targetGroupArn,
          containerName: `container-${environmentSuffix}`,
          containerPort: containerPort,
        },
      ],
      serviceRegistries: [
        {
          registryArn: greenServiceDiscoveryService.serviceArn,
        },
      ],
      deploymentConfiguration: {
        maximumPercent: 200,
        minimumHealthyPercent: 50,
        deploymentCircuitBreaker: {
          enable: true,
          rollback: true,
        },
      },
      healthCheckGracePeriodSeconds: 60,
    });

    // Create service references for outputs
    this.blueService = blueServiceCfn as any;
    this.greenService = greenServiceCfn as any;

    // Auto Scaling for Services
    const blueServiceScalingTarget = new applicationautoscaling.ScalableTarget(this, 'BlueServiceScalingTarget', {
      serviceNamespace: applicationautoscaling.ServiceNamespace.ECS,
      resourceId: `service/${this.ecsCluster.clusterName}/blue-service-${environmentSuffix}`,
      scalableDimension: 'ecs:service:DesiredCount',
      minCapacity: 3,
      maxCapacity: 10,
    });

    new applicationautoscaling.TargetTrackingScalingPolicy(this, 'BlueServiceScalingPolicyCPU', {
      policyName: `blue-cpu-scaling-${environmentSuffix}`,
      scalingTarget: blueServiceScalingTarget,
      targetValue: 70,
      predefinedMetric: applicationautoscaling.PredefinedMetric.ECS_SERVICE_AVERAGE_CPU_UTILIZATION,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    new applicationautoscaling.TargetTrackingScalingPolicy(this, 'BlueServiceScalingPolicyMemory', {
      policyName: `blue-memory-scaling-${environmentSuffix}`,
      scalingTarget: blueServiceScalingTarget,
      targetValue: 80,
      predefinedMetric: applicationautoscaling.PredefinedMetric.ECS_SERVICE_AVERAGE_MEMORY_UTILIZATION,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    const greenServiceScalingTarget = new applicationautoscaling.ScalableTarget(this, 'GreenServiceScalingTarget', {
      serviceNamespace: applicationautoscaling.ServiceNamespace.ECS,
      resourceId: `service/${this.ecsCluster.clusterName}/green-service-${environmentSuffix}`,
      scalableDimension: 'ecs:service:DesiredCount',
      minCapacity: 3,
      maxCapacity: 10,
    });

    new applicationautoscaling.TargetTrackingScalingPolicy(this, 'GreenServiceScalingPolicyCPU', {
      policyName: `green-cpu-scaling-${environmentSuffix}`,
      scalingTarget: greenServiceScalingTarget,
      targetValue: 70,
      predefinedMetric: applicationautoscaling.PredefinedMetric.ECS_SERVICE_AVERAGE_CPU_UTILIZATION,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    new applicationautoscaling.TargetTrackingScalingPolicy(this, 'GreenServiceScalingPolicyMemory', {
      policyName: `green-memory-scaling-${environmentSuffix}`,
      scalingTarget: greenServiceScalingTarget,
      targetValue: 80,
      predefinedMetric: applicationautoscaling.PredefinedMetric.ECS_SERVICE_AVERAGE_MEMORY_UTILIZATION,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // SNS Topic for alerts
    this.snsTopic = new sns.Topic(this, 'SNSTopic', {
      topicName: `ecs-alerts-${environmentSuffix}`,
      displayName: 'ECS Health Alerts',
    });

    // CloudWatch Alarms
    const blueUnhealthyTargetAlarm = new cloudwatch.Alarm(this, 'BlueUnhealthyTargetAlarm', {
      alarmName: `blue-unhealthy-targets-${environmentSuffix}`,
      alarmDescription: 'Alert when 2 or more tasks fail health checks in blue environment',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'UnHealthyHostCount',
        dimensionsMap: {
          TargetGroup: this.blueTargetGroup.targetGroupFullName,
          LoadBalancer: this.loadBalancer.loadBalancerFullName,
        },
        statistic: 'Average',
        period: cdk.Duration.seconds(60),
      }),
      threshold: 2,
      evaluationPeriods: 10,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      actionsEnabled: true,
    });
    blueUnhealthyTargetAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.snsTopic));

    const greenUnhealthyTargetAlarm = new cloudwatch.Alarm(this, 'GreenUnhealthyTargetAlarm', {
      alarmName: `green-unhealthy-targets-${environmentSuffix}`,
      alarmDescription: 'Alert when 2 or more tasks fail health checks in green environment',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'UnHealthyHostCount',
        dimensionsMap: {
          TargetGroup: this.greenTargetGroup.targetGroupFullName,
          LoadBalancer: this.loadBalancer.loadBalancerFullName,
        },
        statistic: 'Average',
        period: cdk.Duration.seconds(60),
      }),
      threshold: 2,
      evaluationPeriods: 10,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      actionsEnabled: true,
    });
    greenUnhealthyTargetAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(this.snsTopic));

    // Outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: this.vpc.vpcId,
      exportName: `${this.stackName}-VPCId`,
    });

    new cdk.CfnOutput(this, 'ECSClusterName', {
      value: this.ecsCluster.clusterName,
      exportName: `${this.stackName}-ECSCluster`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: this.loadBalancer.loadBalancerDnsName,
      exportName: `${this.stackName}-LoadBalancerDNS`,
    });

    new cdk.CfnOutput(this, 'BlueTargetGroupArn', {
      value: this.blueTargetGroup.targetGroupArn,
      exportName: `${this.stackName}-BlueTargetGroup`,
    });

    new cdk.CfnOutput(this, 'GreenTargetGroupArn', {
      value: this.greenTargetGroup.targetGroupArn,
      exportName: `${this.stackName}-GreenTargetGroup`,
    });

    new cdk.CfnOutput(this, 'BlueServiceName', {
      value: `blue-service-${environmentSuffix}`,
      exportName: `${this.stackName}-BlueService`,
    });

    new cdk.CfnOutput(this, 'GreenServiceName', {
      value: `green-service-${environmentSuffix}`,
      exportName: `${this.stackName}-GreenService`,
    });

    new cdk.CfnOutput(this, 'SNSTopicArn', {
      value: this.snsTopic.topicArn,
      exportName: `${this.stackName}-SNSTopic`,
    });

    new cdk.CfnOutput(this, 'ServiceDiscoveryNamespace', {
      value: this.serviceDiscoveryNamespace.namespaceId,
      exportName: `${this.stackName}-SDNamespace`,
    });
  }
}