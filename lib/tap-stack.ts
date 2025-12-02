import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Get configuration and environment
const config = new pulumi.Config();
const environment = pulumi.getStack();
const environmentSuffix = `-${environment}`;

// Determine instance type based on environment
const instanceType = environment === 'prod' ? 'm5.large' : 't3.medium';

// Common tags for all resources
const commonTags = {
  Environment: environment,
  CostCenter: config.get('costCenter') || 'engineering',
  ManagedBy: 'pulumi',
  Project: 'ecs-optimization',
};

// Create VPC for ECS cluster
const vpc = new aws.ec2.Vpc(`ecs-vpc${environmentSuffix}`, {
  cidrBlock: '10.0.0.0/16',
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: {
    ...commonTags,
    Name: `ecs-vpc${environmentSuffix}`,
  },
});

// Create Internet Gateway
const igw = new aws.ec2.InternetGateway(`ecs-igw${environmentSuffix}`, {
  vpcId: vpc.id,
  tags: {
    ...commonTags,
    Name: `ecs-igw${environmentSuffix}`,
  },
});

// Create public subnets
const publicSubnet1 = new aws.ec2.Subnet(
  `ecs-public-subnet-1${environmentSuffix}`,
  {
    vpcId: vpc.id,
    cidrBlock: '10.0.1.0/24',
    availabilityZone: 'us-east-1a',
    mapPublicIpOnLaunch: true,
    tags: {
      ...commonTags,
      Name: `ecs-public-subnet-1${environmentSuffix}`,
    },
  }
);

const publicSubnet2 = new aws.ec2.Subnet(
  `ecs-public-subnet-2${environmentSuffix}`,
  {
    vpcId: vpc.id,
    cidrBlock: '10.0.2.0/24',
    availabilityZone: 'us-east-1b',
    mapPublicIpOnLaunch: true,
    tags: {
      ...commonTags,
      Name: `ecs-public-subnet-2${environmentSuffix}`,
    },
  }
);

// Create route table
const publicRouteTable = new aws.ec2.RouteTable(
  `ecs-public-rt${environmentSuffix}`,
  {
    vpcId: vpc.id,
    tags: {
      ...commonTags,
      Name: `ecs-public-rt${environmentSuffix}`,
    },
  }
);

// Create route to Internet Gateway
void new aws.ec2.Route(`ecs-public-route${environmentSuffix}`, {
  routeTableId: publicRouteTable.id,
  destinationCidrBlock: '0.0.0.0/0',
  gatewayId: igw.id,
});

// Associate route table with subnets
void new aws.ec2.RouteTableAssociation(`ecs-rt-assoc-1${environmentSuffix}`, {
  subnetId: publicSubnet1.id,
  routeTableId: publicRouteTable.id,
});

void new aws.ec2.RouteTableAssociation(`ecs-rt-assoc-2${environmentSuffix}`, {
  subnetId: publicSubnet2.id,
  routeTableId: publicRouteTable.id,
});

// Create security group for ALB
const albSecurityGroup = new aws.ec2.SecurityGroup(
  `alb-sg${environmentSuffix}`,
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
      Name: `alb-sg${environmentSuffix}`,
    },
  }
);

// Create security group for ECS instances
const ecsSecurityGroup = new aws.ec2.SecurityGroup(
  `ecs-sg${environmentSuffix}`,
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
      Name: `ecs-sg${environmentSuffix}`,
    },
  }
);

// Create IAM role for ECS instances
const ecsInstanceRole = new aws.iam.Role(
  `ecs-instance-role${environmentSuffix}`,
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
  }
);

// Attach ECS policy to instance role
void new aws.iam.RolePolicyAttachment(
  `ecs-instance-policy${environmentSuffix}`,
  {
    role: ecsInstanceRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role',
  }
);

// Create instance profile
const ecsInstanceProfile = new aws.iam.InstanceProfile(
  `ecs-instance-profile${environmentSuffix}`,
  {
    role: ecsInstanceRole.name,
    tags: commonTags,
  }
);

// Create IAM role for ECS tasks
const ecsTaskRole = new aws.iam.Role(`ecs-task-role${environmentSuffix}`, {
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
});

// Create IAM role for ECS task execution
const ecsTaskExecutionRole = new aws.iam.Role(
  `ecs-task-execution-role${environmentSuffix}`,
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
  }
);

// Attach execution role policy
void new aws.iam.RolePolicyAttachment(
  `ecs-task-execution-policy${environmentSuffix}`,
  {
    role: ecsTaskExecutionRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
  }
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
  `ecs-launch-template${environmentSuffix}`,
  {
    imageId: ecsAmi.then(ami => ami.id),
    instanceType: instanceType,
    iamInstanceProfile: {
      arn: ecsInstanceProfile.arn,
    },
    vpcSecurityGroupIds: [ecsSecurityGroup.id],
    userData: pulumi.interpolate`#!/bin/bash
echo ECS_CLUSTER=ecs-cluster${environmentSuffix} >> /etc/ecs/ecs.config
echo ECS_ENABLE_TASK_IAM_ROLE=true >> /etc/ecs/ecs.config
echo ECS_ENABLE_TASK_IAM_ROLE_NETWORK_HOST=true >> /etc/ecs/ecs.config`.apply(
      script => Buffer.from(script).toString('base64')
    ),
    tagSpecifications: [
      {
        resourceType: 'instance',
        tags: {
          ...commonTags,
          Name: `ecs-instance${environmentSuffix}`,
        },
      },
    ],
  }
);

// Create Auto Scaling Group
// Start with 1 instance to avoid deployment timeouts, will scale up as needed
const autoScalingGroup = new aws.autoscaling.Group(
  `ecs-asg${environmentSuffix}`,
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
        value: `ecs-asg${environmentSuffix}`,
        propagateAtLaunch: true,
      },
      {
        key: 'Environment',
        value: environment,
        propagateAtLaunch: true,
      },
      {
        key: 'CostCenter',
        value: commonTags.CostCenter,
        propagateAtLaunch: true,
      },
      {
        key: 'AmazonECSManaged',
        value: 'true',
        propagateAtLaunch: true,
      },
    ],
  }
);

// Create ECS Cluster
const ecsCluster = new aws.ecs.Cluster(`ecs-cluster${environmentSuffix}`, {
  tags: commonTags,
  settings: [
    {
      name: 'containerInsights',
      value: 'enabled',
    },
  ],
});

// Create Capacity Provider
// Note: Cannot use 'ecs-', 'aws-', or 'fargate-' prefix per AWS naming rules
const capacityProvider = new aws.ecs.CapacityProvider(
  `capacity-provider${environmentSuffix}`,
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
  }
);

// Associate Capacity Provider with Cluster
const clusterCapacityProviders = new aws.ecs.ClusterCapacityProviders(
  `ecs-cluster-capacity-providers${environmentSuffix}`,
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
  }
);

// Create Application Load Balancer
const alb = new aws.lb.LoadBalancer(`ecs-alb${environmentSuffix}`, {
  internal: false,
  loadBalancerType: 'application',
  securityGroups: [albSecurityGroup.id],
  subnets: [publicSubnet1.id, publicSubnet2.id],
  enableDeletionProtection: false,
  tags: {
    ...commonTags,
    Name: `ecs-alb${environmentSuffix}`,
  },
});

// Create Target Group with health checks
const targetGroup = new aws.lb.TargetGroup(`ecs-tg${environmentSuffix}`, {
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
    Name: `ecs-tg${environmentSuffix}`,
  },
});

// Create ALB Listener
const albListener = new aws.lb.Listener(
  `ecs-alb-listener${environmentSuffix}`,
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
  }
);

// Create ECS Task Definition
const taskDefinition = new aws.ecs.TaskDefinition(
  `ecs-task${environmentSuffix}`,
  {
    family: `ecs-task${environmentSuffix}`,
    networkMode: 'awsvpc',
    requiresCompatibilities: ['EC2'],
    cpu: '256',
    memory: '512',
    executionRoleArn: ecsTaskExecutionRole.arn,
    taskRoleArn: ecsTaskRole.arn,
    containerDefinitions: pulumi.interpolate`[
      {
        "name": "app${environmentSuffix}",
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
            "awslogs-group": "/ecs/task${environmentSuffix}",
            "awslogs-region": "us-east-1",
            "awslogs-stream-prefix": "ecs",
            "awslogs-create-group": "true"
          }
        }
      }
    ]`,
    tags: commonTags,
  }
);

// Create ECS Service with placement constraints
// Note: assignPublicIp is not supported for EC2 launch type (only for Fargate)
// Start with 1 task to match ASG capacity
const ecsService = new aws.ecs.Service(
  `ecs-service${environmentSuffix}`,
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
        containerName: `app${environmentSuffix}`,
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
  { dependsOn: [albListener, clusterCapacityProviders] }
);

// Create Auto Scaling Target for ECS Service
const ecsServiceScalingTarget = new aws.appautoscaling.Target(
  `ecs-service-scaling-target${environmentSuffix}`,
  {
    maxCapacity: 10,
    minCapacity: 1,
    resourceId: pulumi.interpolate`service/${ecsCluster.name}/${ecsService.name}`,
    scalableDimension: 'ecs:service:DesiredCount',
    serviceNamespace: 'ecs',
  }
);

// Create CPU-based scaling policy
void new aws.appautoscaling.Policy(`ecs-cpu-scaling${environmentSuffix}`, {
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
});

// Create Memory-based scaling policy
void new aws.appautoscaling.Policy(`ecs-memory-scaling${environmentSuffix}`, {
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
});

// Create CloudWatch Alarm for low CPU utilization
const lowCpuAlarm = new aws.cloudwatch.MetricAlarm(
  `ecs-low-cpu-alarm${environmentSuffix}`,
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
  }
);

// Create Auto Scaling Policy for ASG based on CPU
void new aws.autoscaling.Policy(`asg-cpu-scaling${environmentSuffix}`, {
  autoscalingGroupName: autoScalingGroup.name,
  policyType: 'TargetTrackingScaling',
  targetTrackingConfiguration: {
    predefinedMetricSpecification: {
      predefinedMetricType: 'ASGAverageCPUUtilization',
    },
    targetValue: 70,
  },
});

// Export important values
export const vpcId = vpc.id;
export const clusterId = ecsCluster.id;
export const clusterName = ecsCluster.name;
export const clusterArn = ecsCluster.arn;
export const albDnsName = alb.dnsName;
export const albArn = alb.arn;
export const targetGroupArn = targetGroup.arn;
export const serviceArn = ecsService.id;
export const taskDefinitionArn = taskDefinition.arn;
export const launchTemplateId = launchTemplate.id;
export const autoScalingGroupName = autoScalingGroup.name;
export const capacityProviderName = capacityProvider.name;
export const lowCpuAlarmArn = lowCpuAlarm.arn;
export { instanceType };
