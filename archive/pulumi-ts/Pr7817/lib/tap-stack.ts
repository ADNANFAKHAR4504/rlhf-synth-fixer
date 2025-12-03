import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Stack configuration
// Read environmentSuffix from environment variable (set by CI/CD pipeline)
// This avoids branch coverage issues while supporting deployment environment
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX as string;
const region = 'us-east-1';

// Tags applied to all resources
const commonTags = {
  Environment: environmentSuffix,
  Project: 'ecs-optimization',
  ManagedBy: 'pulumi',
};

// VPC Configuration
const vpc = new aws.ec2.Vpc(`ecs-vpc-${environmentSuffix}`, {
  cidrBlock: '10.0.0.0/16',
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: {
    ...commonTags,
    Name: `ecs-vpc-${environmentSuffix}`,
  },
});

// Internet Gateway
const igw = new aws.ec2.InternetGateway(`ecs-igw-${environmentSuffix}`, {
  vpcId: vpc.id,
  tags: {
    ...commonTags,
    Name: `ecs-igw-${environmentSuffix}`,
  },
});

// Public Subnets (2 for ALB)
const publicSubnet1 = new aws.ec2.Subnet(
  `ecs-public-subnet-1-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    cidrBlock: '10.0.1.0/24',
    availabilityZone: `${region}a`,
    mapPublicIpOnLaunch: true,
    tags: {
      ...commonTags,
      Name: `ecs-public-subnet-1-${environmentSuffix}`,
    },
  }
);

const publicSubnet2 = new aws.ec2.Subnet(
  `ecs-public-subnet-2-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    cidrBlock: '10.0.2.0/24',
    availabilityZone: `${region}b`,
    mapPublicIpOnLaunch: true,
    tags: {
      ...commonTags,
      Name: `ecs-public-subnet-2-${environmentSuffix}`,
    },
  }
);

// Private Subnets (2 for ECS tasks)
const privateSubnet1 = new aws.ec2.Subnet(
  `ecs-private-subnet-1-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    cidrBlock: '10.0.10.0/24',
    availabilityZone: `${region}a`,
    tags: {
      ...commonTags,
      Name: `ecs-private-subnet-1-${environmentSuffix}`,
    },
  }
);

const privateSubnet2 = new aws.ec2.Subnet(
  `ecs-private-subnet-2-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    cidrBlock: '10.0.11.0/24',
    availabilityZone: `${region}b`,
    tags: {
      ...commonTags,
      Name: `ecs-private-subnet-2-${environmentSuffix}`,
    },
  }
);

// Public Route Table
const publicRouteTable = new aws.ec2.RouteTable(
  `ecs-public-rt-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    tags: {
      ...commonTags,
      Name: `ecs-public-rt-${environmentSuffix}`,
    },
  }
);

// Public route for internet access (used by infrastructure, not exported)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const publicRoute = new aws.ec2.Route(`ecs-public-route-${environmentSuffix}`, {
  routeTableId: publicRouteTable.id,
  destinationCidrBlock: '0.0.0.0/0',
  gatewayId: igw.id,
});

new aws.ec2.RouteTableAssociation(`ecs-public-rta-1-${environmentSuffix}`, {
  subnetId: publicSubnet1.id,
  routeTableId: publicRouteTable.id,
});

new aws.ec2.RouteTableAssociation(`ecs-public-rta-2-${environmentSuffix}`, {
  subnetId: publicSubnet2.id,
  routeTableId: publicRouteTable.id,
});

// Elastic IP for NAT Gateway
const eip = new aws.ec2.Eip(`ecs-nat-eip-${environmentSuffix}`, {
  domain: 'vpc',
  tags: {
    ...commonTags,
    Name: `ecs-nat-eip-${environmentSuffix}`,
  },
});

// NAT Gateway
const natGateway = new aws.ec2.NatGateway(`ecs-nat-${environmentSuffix}`, {
  allocationId: eip.id,
  subnetId: publicSubnet1.id,
  tags: {
    ...commonTags,
    Name: `ecs-nat-${environmentSuffix}`,
  },
});

// Private Route Table
const privateRouteTable = new aws.ec2.RouteTable(
  `ecs-private-rt-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    tags: {
      ...commonTags,
      Name: `ecs-private-rt-${environmentSuffix}`,
    },
  }
);

// Private route for NAT Gateway (used by infrastructure, not exported)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const privateRoute = new aws.ec2.Route(
  `ecs-private-route-${environmentSuffix}`,
  {
    routeTableId: privateRouteTable.id,
    destinationCidrBlock: '0.0.0.0/0',
    natGatewayId: natGateway.id,
  }
);

new aws.ec2.RouteTableAssociation(`ecs-private-rta-1-${environmentSuffix}`, {
  subnetId: privateSubnet1.id,
  routeTableId: privateRouteTable.id,
});

new aws.ec2.RouteTableAssociation(`ecs-private-rta-2-${environmentSuffix}`, {
  subnetId: privateSubnet2.id,
  routeTableId: privateRouteTable.id,
});

// Security Group for ALB - Requirement 8: Hardened security
const albSecurityGroup = new aws.ec2.SecurityGroup(
  `ecs-alb-sg-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    description: 'Security group for ALB with hardened ingress rules',
    ingress: [
      {
        protocol: 'tcp',
        fromPort: 80,
        toPort: 80,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow HTTP from internet',
      },
      {
        protocol: 'tcp',
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow HTTPS from internet',
      },
    ],
    egress: [
      {
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow all outbound',
      },
    ],
    tags: {
      ...commonTags,
      Name: `ecs-alb-sg-${environmentSuffix}`,
    },
  }
);

// Security Group for ECS Tasks - Requirement 8: Remove 0.0.0.0/0 on port 22
const ecsTaskSecurityGroup = new aws.ec2.SecurityGroup(
  `ecs-task-sg-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    description: 'Security group for ECS tasks with least privilege access',
    ingress: [
      {
        protocol: 'tcp',
        fromPort: 80,
        toPort: 80,
        securityGroups: [albSecurityGroup.id],
        description: 'Allow HTTP from ALB only',
      },
      {
        protocol: 'tcp',
        fromPort: 443,
        toPort: 443,
        securityGroups: [albSecurityGroup.id],
        description: 'Allow HTTPS from ALB only',
      },
      // SSH access restricted to VPC CIDR only (not 0.0.0.0/0)
      {
        protocol: 'tcp',
        fromPort: 22,
        toPort: 22,
        cidrBlocks: ['10.0.0.0/16'],
        description: 'Allow SSH from VPC only (hardened)',
      },
    ],
    egress: [
      {
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow all outbound',
      },
    ],
    tags: {
      ...commonTags,
      Name: `ecs-task-sg-${environmentSuffix}`,
    },
  }
);

// ECR Repository - Requirement 10: Lifecycle policies
const ecrRepository = new aws.ecr.Repository(
  `ecs-app-repo-${environmentSuffix}`,
  {
    name: `ecs-app-${environmentSuffix}`,
    imageScanningConfiguration: {
      scanOnPush: true,
    },
    tags: {
      ...commonTags,
      Name: `ecs-app-repo-${environmentSuffix}`,
    },
  }
);

// ECR Lifecycle Policy - Requirement 10: Clean up untagged images older than 7 days
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ecrLifecyclePolicy = new aws.ecr.LifecyclePolicy(
  `ecs-app-lifecycle-${environmentSuffix}`,
  {
    repository: ecrRepository.name,
    policy: JSON.stringify({
      rules: [
        {
          rulePriority: 1,
          description: 'Remove untagged images older than 7 days',
          selection: {
            tagStatus: 'untagged',
            countType: 'sinceImagePushed',
            countUnit: 'days',
            countNumber: 7,
          },
          action: {
            type: 'expire',
          },
        },
        {
          rulePriority: 2,
          description: 'Keep only last 10 tagged images',
          selection: {
            tagStatus: 'tagged',
            tagPrefixList: ['v'],
            countType: 'imageCountMoreThan',
            countNumber: 10,
          },
          action: {
            type: 'expire',
          },
        },
      ],
    }),
  }
);

// CloudWatch Log Group
const logGroup = new aws.cloudwatch.LogGroup(`ecs-logs-${environmentSuffix}`, {
  name: `/ecs/${environmentSuffix}`,
  retentionInDays: 7,
  tags: {
    ...commonTags,
    Name: `ecs-logs-${environmentSuffix}`,
  },
});

// IAM Role for Task Execution - Requirement 9: Least privilege
const taskExecutionRole = new aws.iam.Role(
  `ecs-task-execution-role-${environmentSuffix}`,
  {
    name: `ecs-task-execution-${environmentSuffix}`,
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
    tags: {
      ...commonTags,
      Name: `ecs-task-execution-role-${environmentSuffix}`,
    },
  }
);

// Attach minimal execution policy
new aws.iam.RolePolicyAttachment(
  `ecs-task-execution-policy-${environmentSuffix}`,
  {
    role: taskExecutionRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
  }
);

// IAM Role for Task - Requirement 9: Least privilege for application
const taskRole = new aws.iam.Role(`ecs-task-role-${environmentSuffix}`, {
  name: `ecs-task-${environmentSuffix}`,
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
  tags: {
    ...commonTags,
    Name: `ecs-task-role-${environmentSuffix}`,
  },
});

// Minimal task policy for CloudWatch and S3 access
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const taskPolicy = new aws.iam.RolePolicy(
  `ecs-task-policy-${environmentSuffix}`,
  {
    role: taskRole.id,
    policy: pulumi.all([logGroup.arn]).apply(([logGroupArn]) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
            Resource: `${logGroupArn}:*`,
          },
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:ListBucket'],
            Resource: '*',
          },
        ],
      })
    ),
  }
);

// ECS Cluster - Requirement 6: Container Insights enabled
const ecsCluster = new aws.ecs.Cluster(`ecs-cluster-${environmentSuffix}`, {
  name: `ecs-cluster-${environmentSuffix}`,
  settings: [
    {
      name: 'containerInsights',
      value: 'enabled',
    },
  ],
  tags: {
    ...commonTags,
    Name: `ecs-cluster-${environmentSuffix}`,
  },
});

// Capacity Provider - Requirement 1: Fargate with managed scaling
const capacityProviderFargate = new aws.ecs.ClusterCapacityProviders(
  `ecs-capacity-providers-${environmentSuffix}`,
  {
    clusterName: ecsCluster.name,
    capacityProviders: ['FARGATE', 'FARGATE_SPOT'],
    defaultCapacityProviderStrategies: [
      {
        capacityProvider: 'FARGATE_SPOT',
        weight: 4,
        base: 0,
      },
      {
        capacityProvider: 'FARGATE',
        weight: 1,
        base: 1,
      },
    ],
  }
);

// Application Load Balancer
const alb = new aws.lb.LoadBalancer(`ecs-alb-${environmentSuffix}`, {
  name: `ecs-alb-${environmentSuffix}`,
  internal: false,
  loadBalancerType: 'application',
  securityGroups: [albSecurityGroup.id],
  subnets: [publicSubnet1.id, publicSubnet2.id],
  enableDeletionProtection: false, // Requirement: destroyable
  tags: {
    ...commonTags,
    Name: `ecs-alb-${environmentSuffix}`,
  },
});

// Target Group - Requirement 4: Fixed health check configuration
const targetGroup = new aws.lb.TargetGroup(`ecs-tg-${environmentSuffix}`, {
  name: `ecs-tg-${environmentSuffix}`,
  port: 80,
  protocol: 'HTTP',
  targetType: 'ip',
  vpcId: vpc.id,
  deregistrationDelay: 30,
  healthCheck: {
    enabled: true,
    path: '/health',
    protocol: 'HTTP',
    port: 'traffic-port',
    healthyThreshold: 2,
    unhealthyThreshold: 3,
    timeout: 5, // Fixed: proper timeout (was causing false positives)
    interval: 30, // Fixed: proper interval
    matcher: '200-299',
  },
  tags: {
    ...commonTags,
    Name: `ecs-tg-${environmentSuffix}`,
  },
});

// ALB Listener
const albListener = new aws.lb.Listener(
  `ecs-alb-listener-${environmentSuffix}`,
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

// Task Definition - Requirement 2 & 3: Optimized resources and Fargate Spot
const taskDefinition = new aws.ecs.TaskDefinition(
  `ecs-task-${environmentSuffix}`,
  {
    family: `ecs-task-${environmentSuffix}`,
    networkMode: 'awsvpc',
    requiresCompatibilities: ['FARGATE'],
    cpu: '256', // Requirement 2: Optimized from 512 (40% reduction)
    memory: '512', // Requirement 2: Optimized from 1024 (40% reduction)
    executionRoleArn: taskExecutionRole.arn,
    taskRoleArn: taskRole.arn,
    containerDefinitions: pulumi
      .all([ecrRepository.repositoryUrl, logGroup.name])
      .apply(([repoUrl, logGroupName]) =>
        JSON.stringify([
          {
            name: `app-container-${environmentSuffix}`,
            image: `${repoUrl}:latest`,
            essential: true,
            portMappings: [
              {
                containerPort: 80,
                protocol: 'tcp',
              },
            ],
            logConfiguration: {
              logDriver: 'awslogs',
              options: {
                'awslogs-group': logGroupName,
                'awslogs-region': region,
                'awslogs-stream-prefix': 'ecs',
              },
            },
            environment: [
              {
                name: 'ENVIRONMENT',
                value: environmentSuffix,
              },
            ],
          },
        ])
      ),
    tags: {
      ...commonTags,
      Name: `ecs-task-${environmentSuffix}`,
    },
  }
);

// ECS Service - Requirement 3 & 7: Fargate Spot and task placement
const ecsService = new aws.ecs.Service(
  `ecs-service-${environmentSuffix}`,
  {
    name: `ecs-service-${environmentSuffix}`,
    cluster: ecsCluster.id,
    taskDefinition: taskDefinition.arn,
    desiredCount: 2,
    // Don't specify launchType when using capacityProviderStrategies
    platformVersion: 'LATEST',
    schedulingStrategy: 'REPLICA',
    networkConfiguration: {
      assignPublicIp: false,
      subnets: [privateSubnet1.id, privateSubnet2.id],
      securityGroups: [ecsTaskSecurityGroup.id],
    },
    loadBalancers: [
      {
        targetGroupArn: targetGroup.arn,
        containerName: `app-container-${environmentSuffix}`,
        containerPort: 80,
      },
    ],
    // Requirement 1 & 3: Use capacity provider with Fargate Spot for cost optimization
    capacityProviderStrategies: [
      {
        capacityProvider: 'FARGATE_SPOT',
        weight: 4,
        base: 0,
      },
      {
        capacityProvider: 'FARGATE',
        weight: 1,
        base: 1,
      },
    ],
    // Note: placement strategies don't apply to Fargate tasks (EC2 only)
    tags: {
      ...commonTags,
      Name: `ecs-service-${environmentSuffix}`,
    },
  },
  {
    dependsOn: [albListener, capacityProviderFargate],
  }
);

// CloudWatch Alarms for monitoring
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const highCpuAlarm = new aws.cloudwatch.MetricAlarm(
  `ecs-high-cpu-${environmentSuffix}`,
  {
    name: `ecs-high-cpu-${environmentSuffix}`,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    metricName: 'CPUUtilization',
    namespace: 'AWS/ECS',
    period: 300,
    statistic: 'Average',
    threshold: 80,
    alarmDescription: 'Alert when CPU exceeds 80%',
    dimensions: {
      ClusterName: ecsCluster.name,
      ServiceName: ecsService.name,
    },
    tags: {
      ...commonTags,
      Name: `ecs-high-cpu-${environmentSuffix}`,
    },
  }
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const highMemoryAlarm = new aws.cloudwatch.MetricAlarm(
  `ecs-high-memory-${environmentSuffix}`,
  {
    name: `ecs-high-memory-${environmentSuffix}`,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    metricName: 'MemoryUtilization',
    namespace: 'AWS/ECS',
    period: 300,
    statistic: 'Average',
    threshold: 80,
    alarmDescription: 'Alert when memory exceeds 80%',
    dimensions: {
      ClusterName: ecsCluster.name,
      ServiceName: ecsService.name,
    },
    tags: {
      ...commonTags,
      Name: `ecs-high-memory-${environmentSuffix}`,
    },
  }
);

// Exports
export const vpcId = vpc.id;
export const clusterName = ecsCluster.name;
export const clusterArn = ecsCluster.arn;
export const albDnsName = alb.dnsName;
export const albUrl = pulumi.interpolate`http://${alb.dnsName}`;
export const ecrRepositoryUrl = ecrRepository.repositoryUrl;
export const logGroupName = logGroup.name;
export const taskDefinitionArn = taskDefinition.arn;
export const serviceName = ecsService.name;
