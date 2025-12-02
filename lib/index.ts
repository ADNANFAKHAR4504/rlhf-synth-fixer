import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Configuration management - no hardcoded values
const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');
const environment = config.get('environment') || 'dev';
const region = config.get('awsRegion') || 'us-east-1';
const containerPort = config.getNumber('containerPort') || 3000;
const desiredCount = config.getNumber('desiredCount') || 2;

// Standard tags for all resources
const commonTags = {
  Environment: environment,
  Project: 'ecs-optimization',
  ManagedBy: 'Pulumi',
  Team: 'platform-engineering',
};

// Create VPC and networking
const vpc = new aws.ec2.Vpc(`ecs-vpc-${environmentSuffix}`, {
  cidrBlock: '10.0.0.0/16',
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: { ...commonTags, Name: `ecs-vpc-${environmentSuffix}` },
});

const subnet1 = new aws.ec2.Subnet(`ecs-subnet-1-${environmentSuffix}`, {
  vpcId: vpc.id,
  cidrBlock: '10.0.1.0/24',
  availabilityZone: `${region}a`,
  mapPublicIpOnLaunch: true,
  tags: { ...commonTags, Name: `ecs-subnet-1-${environmentSuffix}` },
});

const subnet2 = new aws.ec2.Subnet(`ecs-subnet-2-${environmentSuffix}`, {
  vpcId: vpc.id,
  cidrBlock: '10.0.2.0/24',
  availabilityZone: `${region}b`,
  mapPublicIpOnLaunch: true,
  tags: { ...commonTags, Name: `ecs-subnet-2-${environmentSuffix}` },
});

const igw = new aws.ec2.InternetGateway(`ecs-igw-${environmentSuffix}`, {
  vpcId: vpc.id,
  tags: { ...commonTags, Name: `ecs-igw-${environmentSuffix}` },
});

const routeTable = new aws.ec2.RouteTable(`ecs-rt-${environmentSuffix}`, {
  vpcId: vpc.id,
  routes: [
    {
      cidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    },
  ],
  tags: { ...commonTags, Name: `ecs-rt-${environmentSuffix}` },
});

new aws.ec2.RouteTableAssociation(`ecs-rta-1-${environmentSuffix}`, {
  subnetId: subnet1.id,
  routeTableId: routeTable.id,
});

new aws.ec2.RouteTableAssociation(`ecs-rta-2-${environmentSuffix}`, {
  subnetId: subnet2.id,
  routeTableId: routeTable.id,
});

// Security groups - cleaned up, no unused rules
const albSg = new aws.ec2.SecurityGroup(`alb-sg-${environmentSuffix}`, {
  vpcId: vpc.id,
  description: 'Security group for Application Load Balancer',
  ingress: [
    {
      protocol: 'tcp',
      fromPort: 80,
      toPort: 80,
      cidrBlocks: ['0.0.0.0/0'],
      description: 'HTTP from internet',
    },
    {
      protocol: 'tcp',
      fromPort: 443,
      toPort: 443,
      cidrBlocks: ['0.0.0.0/0'],
      description: 'HTTPS from internet',
    },
  ],
  egress: [
    {
      protocol: '-1',
      fromPort: 0,
      toPort: 0,
      cidrBlocks: ['0.0.0.0/0'],
      description: 'All outbound traffic',
    },
  ],
  tags: { ...commonTags, Name: `alb-sg-${environmentSuffix}` },
});

const ecsSg = new aws.ec2.SecurityGroup(`ecs-sg-${environmentSuffix}`, {
  vpcId: vpc.id,
  description: 'Security group for ECS tasks',
  ingress: [
    {
      protocol: 'tcp',
      fromPort: containerPort,
      toPort: containerPort,
      securityGroups: [albSg.id],
      description: 'Container port from ALB',
    },
  ],
  egress: [
    {
      protocol: '-1',
      fromPort: 0,
      toPort: 0,
      cidrBlocks: ['0.0.0.0/0'],
      description: 'All outbound traffic',
    },
  ],
  tags: { ...commonTags, Name: `ecs-sg-${environmentSuffix}` },
});

// CloudWatch log group with retention policy
const logGroup = new aws.cloudwatch.LogGroup(`ecs-logs-${environmentSuffix}`, {
  name: `/ecs/app-${environmentSuffix}`,
  retentionInDays: environment === 'production' ? 30 : 7,
  tags: commonTags,
});

// ECS Cluster
const cluster = new aws.ecs.Cluster(`app-cluster-${environmentSuffix}`, {
  name: `app-cluster-${environmentSuffix}`,
  settings: [
    {
      name: 'containerInsights',
      value: 'enabled',
    },
  ],
  tags: commonTags,
});

// IAM role for ECS task execution - no hardcoded ARN
const executionRole = new aws.iam.Role(
  `ecs-execution-role-${environmentSuffix}`,
  {
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'ecs-tasks.amazonaws.com',
          },
        },
      ],
    }),
    tags: commonTags,
  }
);

new aws.iam.RolePolicyAttachment(`ecs-execution-policy-${environmentSuffix}`, {
  role: executionRole.name,
  policyArn:
    'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
});

// Task definition with proper resource reservations
const taskDefinition = new aws.ecs.TaskDefinition(
  `app-task-${environmentSuffix}`,
  {
    family: `app-task-${environmentSuffix}`,
    cpu: '256',
    memory: '512',
    networkMode: 'awsvpc',
    requiresCompatibilities: ['FARGATE'],
    executionRoleArn: executionRole.arn,
    containerDefinitions: pulumi.interpolate`[{
        "name": "app",
        "image": "nginx:latest",
        "cpu": 256,
        "memory": 512,
        "memoryReservation": 256,
        "essential": true,
        "portMappings": [{
            "containerPort": ${containerPort},
            "protocol": "tcp"
        }],
        "logConfiguration": {
            "logDriver": "awslogs",
            "options": {
                "awslogs-group": "${logGroup.name}",
                "awslogs-region": "${region}",
                "awslogs-stream-prefix": "app"
            }
        },
        "environment": [{
            "name": "ENVIRONMENT",
            "value": "${environment}"
        }]
    }]`,
    tags: commonTags,
  },
  { dependsOn: [logGroup, executionRole] }
);

// ALB with optimized health checks
const alb = new aws.lb.LoadBalancer(
  `app-alb-${environmentSuffix}`,
  {
    internal: false,
    loadBalancerType: 'application',
    securityGroups: [albSg.id],
    subnets: [subnet1.id, subnet2.id],
    enableDeletionProtection: false,
    tags: commonTags,
  },
  { dependsOn: [igw] }
);

const targetGroup = new aws.lb.TargetGroup(`app-tg-${environmentSuffix}`, {
  port: containerPort,
  protocol: 'HTTP',
  vpcId: vpc.id,
  targetType: 'ip',
  deregistrationDelay: 30,
  healthCheck: {
    enabled: true,
    interval: 30,
    timeout: 5,
    healthyThreshold: 2,
    unhealthyThreshold: 3,
    path: '/health',
    matcher: '200-299',
  },
  tags: commonTags,
});

const listener = new aws.lb.Listener(`app-listener-${environmentSuffix}`, {
  loadBalancerArn: alb.arn,
  port: 80,
  defaultActions: [
    {
      type: 'forward',
      targetGroupArn: targetGroup.arn,
    },
  ],
});

// Reusable function for creating ECS services - consolidation
function createECSService(
  name: string,
  cluster: aws.ecs.Cluster,
  taskDef: aws.ecs.TaskDefinition,
  tg: aws.lb.TargetGroup,
  subnets: pulumi.Input<string>[],
  sg: aws.ec2.SecurityGroup,
  count: number
): aws.ecs.Service {
  return new aws.ecs.Service(
    name,
    {
      cluster: cluster.arn,
      taskDefinition: taskDef.arn,
      desiredCount: count,
      launchType: 'FARGATE',
      networkConfiguration: {
        subnets: subnets,
        securityGroups: [sg.id],
        assignPublicIp: true,
      },
      loadBalancers: [
        {
          targetGroupArn: tg.arn,
          containerName: 'app',
          containerPort: containerPort,
        },
      ],
      // Optimized placement strategy - binpack for cost efficiency
      orderedPlacementStrategies: [
        {
          type: 'binpack',
          field: 'memory',
        },
      ],
      tags: commonTags,
    },
    { dependsOn: [listener] }
  );
}

// Create service using reusable component
const service = createECSService(
  `app-service-${environmentSuffix}`,
  cluster,
  taskDefinition,
  targetGroup,
  [subnet1.id, subnet2.id],
  ecsSg,
  desiredCount
);

// CPU-based auto-scaling instead of request count
const target = new aws.appautoscaling.Target(
  `app-target-${environmentSuffix}`,
  {
    maxCapacity: 10,
    minCapacity: desiredCount,
    resourceId: pulumi.interpolate`service/${cluster.name}/${service.name}`,
    scalableDimension: 'ecs:service:DesiredCount',
    serviceNamespace: 'ecs',
  }
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const scalingPolicy = new aws.appautoscaling.Policy(
  `app-policy-${environmentSuffix}`,
  {
    policyType: 'TargetTrackingScaling',
    resourceId: target.resourceId,
    scalableDimension: target.scalableDimension,
    serviceNamespace: target.serviceNamespace,
    targetTrackingScalingPolicyConfiguration: {
      predefinedMetricSpecification: {
        predefinedMetricType: 'ECSServiceAverageCPUUtilization',
      },
      targetValue: 70,
      scaleInCooldown: 300,
      scaleOutCooldown: 60,
    },
  }
);

// Exports
export const albDnsName = alb.dnsName;
export const clusterName = cluster.name;
export const logGroupName = logGroup.name;
export const serviceName = service.name;
