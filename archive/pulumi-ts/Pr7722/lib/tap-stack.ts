import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

/**
 * Configuration options for the TapStack component.
 */
export interface TapStackArgs {
  /**
   * Environment suffix to append to resource names (e.g., 'dev', 'staging', 'prod').
   */
  environmentSuffix: string;

  /**
   * Tags to apply to all resources.
   */
  tags: Record<string, string>;

  /**
   * Cost center for billing purposes.
   */
  costCenter?: string;
}

/**
 * TapStack is a Pulumi ComponentResource that encapsulates the ECS optimization infrastructure.
 *
 * This component creates a complete ECS infrastructure including:
 * - VPC with public subnets
 * - Application Load Balancer
 * - ECS Cluster with EC2 capacity provider
 * - Auto Scaling for both EC2 instances and ECS services
 * - CloudWatch alarms for monitoring
 */
export class TapStack extends pulumi.ComponentResource {
  // Exported outputs
  public readonly vpcId: pulumi.Output<string>;
  public readonly clusterId: pulumi.Output<string>;
  public readonly clusterName: pulumi.Output<string>;
  public readonly clusterArn: pulumi.Output<string>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly albArn: pulumi.Output<string>;
  public readonly targetGroupArn: pulumi.Output<string>;
  public readonly serviceArn: pulumi.Output<string>;
  public readonly taskDefinitionArn: pulumi.Output<string>;
  public readonly launchTemplateId: pulumi.Output<string>;
  public readonly autoScalingGroupName: pulumi.Output<string>;
  public readonly capacityProviderName: pulumi.Output<string>;
  public readonly lowCpuAlarmArn: pulumi.Output<string>;
  public readonly instanceType: string;

  constructor(
    name: string,
    args: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:infrastructure:TapStack', name, {}, opts);

    const { environmentSuffix, tags } = args;
    const envSuffix = `-${environmentSuffix}`;

    // Determine instance type based on environment
    this.instanceType = environmentSuffix === 'prod' ? 'm5.large' : 't3.medium';

    // Common tags for all resources
    const commonTags = { ...tags };

    // Create VPC for ECS cluster
    const vpc = new aws.ec2.Vpc(
      `ecs-vpc${envSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...commonTags,
          Name: `ecs-vpc${envSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `ecs-igw${envSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...commonTags,
          Name: `ecs-igw${envSuffix}`,
        },
      },
      { parent: this }
    );

    // Create public subnets
    const publicSubnet1 = new aws.ec2.Subnet(
      `ecs-public-subnet-1${envSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: 'us-east-1a',
        mapPublicIpOnLaunch: true,
        tags: {
          ...commonTags,
          Name: `ecs-public-subnet-1${envSuffix}`,
        },
      },
      { parent: this }
    );

    const publicSubnet2 = new aws.ec2.Subnet(
      `ecs-public-subnet-2${envSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: 'us-east-1b',
        mapPublicIpOnLaunch: true,
        tags: {
          ...commonTags,
          Name: `ecs-public-subnet-2${envSuffix}`,
        },
      },
      { parent: this }
    );

    // Create route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `ecs-public-rt${envSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...commonTags,
          Name: `ecs-public-rt${envSuffix}`,
        },
      },
      { parent: this }
    );

    // Create route to Internet Gateway
    new aws.ec2.Route(
      `ecs-public-route${envSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this }
    );

    // Associate route table with subnets
    new aws.ec2.RouteTableAssociation(
      `ecs-rt-assoc-1${envSuffix}`,
      {
        subnetId: publicSubnet1.id,
        routeTableId: publicRouteTable.id,
      },
      { parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `ecs-rt-assoc-2${envSuffix}`,
      {
        subnetId: publicSubnet2.id,
        routeTableId: publicRouteTable.id,
      },
      { parent: this }
    );

    // Create security group for ALB
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `alb-sg${envSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP traffic',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          ...commonTags,
          Name: `alb-sg${envSuffix}`,
        },
      },
      { parent: this }
    );

    // Create security group for ECS instances
    const ecsSecurityGroup = new aws.ec2.SecurityGroup(
      `ecs-sg${envSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for ECS instances',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 0,
            toPort: 65535,
            securityGroups: [albSecurityGroup.id],
            description: 'Allow traffic from ALB',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          ...commonTags,
          Name: `ecs-sg${envSuffix}`,
        },
      },
      { parent: this }
    );

    // Create IAM role for ECS instances
    const ecsInstanceRole = new aws.iam.Role(
      `ecs-instance-role${envSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: commonTags,
      },
      { parent: this }
    );

    // Attach ECS policy to instance role
    new aws.iam.RolePolicyAttachment(
      `ecs-instance-policy${envSuffix}`,
      {
        role: ecsInstanceRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role',
      },
      { parent: this }
    );

    // Create instance profile
    const ecsInstanceProfile = new aws.iam.InstanceProfile(
      `ecs-instance-profile${envSuffix}`,
      {
        role: ecsInstanceRole.name,
        tags: commonTags,
      },
      { parent: this }
    );

    // Create IAM role for ECS tasks
    const ecsTaskRole = new aws.iam.Role(
      `ecs-task-role${envSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: commonTags,
      },
      { parent: this }
    );

    // Create IAM role for ECS task execution
    const ecsTaskExecutionRole = new aws.iam.Role(
      `ecs-task-execution-role${envSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: commonTags,
      },
      { parent: this }
    );

    // Attach execution role policy
    new aws.iam.RolePolicyAttachment(
      `ecs-task-execution-policy${envSuffix}`,
      {
        role: ecsTaskExecutionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    // Get latest ECS-optimized AMI
    const ecsAmi = aws.ec2.getAmi({
      mostRecent: true,
      owners: ['amazon'],
      filters: [
        {
          name: 'name',
          values: ['amzn2-ami-ecs-hvm-*-x86_64-ebs'],
        },
      ],
    });

    // Create Launch Template for ECS instances
    const launchTemplate = new aws.ec2.LaunchTemplate(
      `ecs-launch-template${envSuffix}`,
      {
        imageId: ecsAmi.then((ami: aws.ec2.GetAmiResult) => ami.id),
        instanceType: this.instanceType,
        iamInstanceProfile: {
          arn: ecsInstanceProfile.arn,
        },
        vpcSecurityGroupIds: [ecsSecurityGroup.id],
        userData: pulumi.interpolate`#!/bin/bash
echo ECS_CLUSTER=ecs-cluster${envSuffix} >> /etc/ecs/ecs.config
echo ECS_ENABLE_TASK_IAM_ROLE=true >> /etc/ecs/ecs.config
echo ECS_ENABLE_TASK_IAM_ROLE_NETWORK_HOST=true >> /etc/ecs/ecs.config`.apply(
          (script: string) => Buffer.from(script).toString('base64')
        ),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              ...commonTags,
              Name: `ecs-instance${envSuffix}`,
            },
          },
        ],
      },
      { parent: this }
    );

    // Create Auto Scaling Group
    // Start with 1 instance to avoid deployment timeouts, will scale up as needed
    const autoScalingGroup = new aws.autoscaling.Group(
      `ecs-asg${envSuffix}`,
      {
        vpcZoneIdentifiers: [publicSubnet1.id, publicSubnet2.id],
        minSize: 1,
        maxSize: 10,
        desiredCapacity: 1,
        healthCheckType: 'EC2',
        healthCheckGracePeriod: 300,
        launchTemplate: {
          id: launchTemplate.id,
          version: '$Latest',
        },
        tags: [
          {
            key: 'Name',
            value: `ecs-asg${envSuffix}`,
            propagateAtLaunch: true,
          },
          {
            key: 'Environment',
            value: environmentSuffix,
            propagateAtLaunch: true,
          },
          {
            key: 'CostCenter',
            value: commonTags.CostCenter || 'engineering',
            propagateAtLaunch: true,
          },
          {
            key: 'AmazonECSManaged',
            value: 'true',
            propagateAtLaunch: true,
          },
        ],
      },
      { parent: this }
    );

    // Create ECS Cluster
    const ecsCluster = new aws.ecs.Cluster(
      `ecs-cluster${envSuffix}`,
      {
        tags: commonTags,
        settings: [
          {
            name: 'containerInsights',
            value: 'enabled',
          },
        ],
      },
      { parent: this }
    );

    // Create Capacity Provider
    // Note: Cannot use 'ecs-', 'aws-', or 'fargate-' prefix per AWS naming rules
    const capacityProvider = new aws.ecs.CapacityProvider(
      `capacity-provider${envSuffix}`,
      {
        autoScalingGroupProvider: {
          autoScalingGroupArn: autoScalingGroup.arn,
          managedScaling: {
            status: 'ENABLED',
            targetCapacity: 80,
            minimumScalingStepSize: 1,
            maximumScalingStepSize: 10,
          },
          managedTerminationProtection: 'DISABLED',
        },
        tags: commonTags,
      },
      { parent: this }
    );

    // Associate Capacity Provider with Cluster
    const clusterCapacityProviders = new aws.ecs.ClusterCapacityProviders(
      `ecs-cluster-capacity-providers${envSuffix}`,
      {
        clusterName: ecsCluster.name,
        capacityProviders: [capacityProvider.name],
        defaultCapacityProviderStrategies: [
          {
            capacityProvider: capacityProvider.name,
            weight: 1,
            base: 1,
          },
        ],
      },
      { parent: this }
    );

    // Create Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `ecs-alb${envSuffix}`,
      {
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: [publicSubnet1.id, publicSubnet2.id],
        enableDeletionProtection: false,
        tags: {
          ...commonTags,
          Name: `ecs-alb${envSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Target Group with health checks
    const targetGroup = new aws.lb.TargetGroup(
      `ecs-tg${envSuffix}`,
      {
        port: 80,
        protocol: 'HTTP',
        vpcId: vpc.id,
        targetType: 'ip',
        healthCheck: {
          enabled: true,
          interval: 30,
          path: '/',
          protocol: 'HTTP',
          healthyThreshold: 2,
          unhealthyThreshold: 2,
          timeout: 5,
          matcher: '200',
        },
        deregistrationDelay: 30,
        tags: {
          ...commonTags,
          Name: `ecs-tg${envSuffix}`,
        },
      },
      { parent: this }
    );

    // Create ALB Listener
    const albListener = new aws.lb.Listener(
      `ecs-alb-listener${envSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
      },
      { parent: this }
    );

    // Create ECS Task Definition
    const taskDefinition = new aws.ecs.TaskDefinition(
      `ecs-task${envSuffix}`,
      {
        family: `ecs-task${envSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['EC2'],
        cpu: '256',
        memory: '512',
        executionRoleArn: ecsTaskExecutionRole.arn,
        taskRoleArn: ecsTaskRole.arn,
        containerDefinitions: pulumi.interpolate`[
      {
        "name": "app${envSuffix}",
        "image": "nginx:latest",
        "cpu": 256,
        "memory": 512,
        "essential": true,
        "portMappings": [
          {
            "containerPort": 80,
            "hostPort": 80,
            "protocol": "tcp"
          }
        ],
        "logConfiguration": {
          "logDriver": "awslogs",
          "options": {
            "awslogs-group": "/ecs/task${envSuffix}",
            "awslogs-region": "us-east-1",
            "awslogs-stream-prefix": "ecs",
            "awslogs-create-group": "true"
          }
        }
      }
    ]`,
        tags: commonTags,
      },
      { parent: this }
    );

    // Create ECS Service with placement constraints
    // Note: assignPublicIp is not supported for EC2 launch type (only for Fargate)
    // Start with 1 task to match ASG capacity
    const ecsService = new aws.ecs.Service(
      `ecs-service${envSuffix}`,
      {
        cluster: ecsCluster.arn,
        taskDefinition: taskDefinition.arn,
        desiredCount: 1,
        launchType: 'EC2',
        networkConfiguration: {
          subnets: [publicSubnet1.id, publicSubnet2.id],
          securityGroups: [ecsSecurityGroup.id],
          // assignPublicIp not supported for EC2 launch type
        },
        loadBalancers: [
          {
            targetGroupArn: targetGroup.arn,
            containerName: `app${envSuffix}`,
            containerPort: 80,
          },
        ],
        placementConstraints: [
          {
            type: 'memberOf',
            expression:
              'attribute:ecs.availability-zone in [us-east-1a, us-east-1b]',
          },
        ],
        tags: commonTags,
      },
      { parent: this, dependsOn: [albListener, clusterCapacityProviders] }
    );

    // Create Auto Scaling Target for ECS Service
    const ecsServiceScalingTarget = new aws.appautoscaling.Target(
      `ecs-service-scaling-target${envSuffix}`,
      {
        maxCapacity: 10,
        minCapacity: 1,
        resourceId: pulumi.interpolate`service/${ecsCluster.name}/${ecsService.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        serviceNamespace: 'ecs',
      },
      { parent: this }
    );

    // Create CPU-based scaling policy
    new aws.appautoscaling.Policy(
      `ecs-cpu-scaling${envSuffix}`,
      {
        policyType: 'TargetTrackingScaling',
        resourceId: ecsServiceScalingTarget.resourceId,
        scalableDimension: ecsServiceScalingTarget.scalableDimension,
        serviceNamespace: ecsServiceScalingTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          targetValue: 70,
          scaleInCooldown: 300,
          scaleOutCooldown: 60,
        },
      },
      { parent: this }
    );

    // Create Memory-based scaling policy
    new aws.appautoscaling.Policy(
      `ecs-memory-scaling${envSuffix}`,
      {
        policyType: 'TargetTrackingScaling',
        resourceId: ecsServiceScalingTarget.resourceId,
        scalableDimension: ecsServiceScalingTarget.scalableDimension,
        serviceNamespace: ecsServiceScalingTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageMemoryUtilization',
          },
          targetValue: 80,
          scaleInCooldown: 300,
          scaleOutCooldown: 60,
        },
      },
      { parent: this }
    );

    // Create CloudWatch Alarm for low CPU utilization
    const lowCpuAlarm = new aws.cloudwatch.MetricAlarm(
      `ecs-low-cpu-alarm${envSuffix}`,
      {
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/ECS',
        period: 300,
        statistic: 'Average',
        threshold: 20,
        alarmDescription:
          'Alert when CPU utilization is below 20% (potential over-provisioning)',
        dimensions: {
          ClusterName: ecsCluster.name,
          ServiceName: ecsService.name,
        },
        tags: commonTags,
      },
      { parent: this }
    );

    // Create Auto Scaling Policy for ASG based on CPU
    new aws.autoscaling.Policy(
      `asg-cpu-scaling${envSuffix}`,
      {
        autoscalingGroupName: autoScalingGroup.name,
        policyType: 'TargetTrackingScaling',
        targetTrackingConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: 'ASGAverageCPUUtilization',
          },
          targetValue: 70,
        },
      },
      { parent: this }
    );

    // Assign output values
    this.vpcId = vpc.id;
    this.clusterId = ecsCluster.id;
    this.clusterName = ecsCluster.name;
    this.clusterArn = ecsCluster.arn;
    this.albDnsName = alb.dnsName;
    this.albArn = alb.arn;
    this.targetGroupArn = targetGroup.arn;
    this.serviceArn = ecsService.id;
    this.taskDefinitionArn = taskDefinition.arn;
    this.launchTemplateId = launchTemplate.id;
    this.autoScalingGroupName = autoScalingGroup.name;
    this.capacityProviderName = capacityProvider.name;
    this.lowCpuAlarmArn = lowCpuAlarm.arn;

    // Register outputs with the component
    this.registerOutputs({
      vpcId: this.vpcId,
      clusterId: this.clusterId,
      clusterName: this.clusterName,
      clusterArn: this.clusterArn,
      albDnsName: this.albDnsName,
      albArn: this.albArn,
      targetGroupArn: this.targetGroupArn,
      serviceArn: this.serviceArn,
      taskDefinitionArn: this.taskDefinitionArn,
      launchTemplateId: this.launchTemplateId,
      autoScalingGroupName: this.autoScalingGroupName,
      capacityProviderName: this.capacityProviderName,
      lowCpuAlarmArn: this.lowCpuAlarmArn,
      instanceType: this.instanceType,
    });
  }
}
