import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Configuration
const config = new pulumi.Config();
// Extract environment suffix from stack name (e.g., TapStackpr7718 -> pr7718)
const stackName = pulumi.getStack();
/* istanbul ignore next */
const environmentSuffix =
  config.get('environmentSuffix') || stackName.replace('TapStack', '');
const containerPort = 3000;
const cpu = 2048; // BASELINE - will be optimized by optimize.py to 512
const memory = 4096; // BASELINE - will be optimized by optimize.py to 1024

// Common tags for all resources
const commonTags = {
  Environment: environmentSuffix,
  Team: 'platform',
  CostCenter: 'engineering',
  ManagedBy: 'pulumi',
};

// ECR Repository for container images
const ecrRepository = new aws.ecr.Repository(`app-repo-${environmentSuffix}`, {
  name: `app-repo-${environmentSuffix}`,
  imageTagMutability: 'MUTABLE',
  imageScanningConfiguration: {
    scanOnPush: true,
  },
  tags: commonTags,
});

// CloudWatch Log Group with 7-day retention
const logGroup = new aws.cloudwatch.LogGroup(`ecs-logs-${environmentSuffix}`, {
  name: `/ecs/fargate-app-${environmentSuffix}`,
  retentionInDays: 14, // BASELINE - will be optimized by optimize.py to 7 days
  tags: commonTags,
});

// IAM Role for ECS Task Execution (minimal permissions)
const taskExecutionRole = new aws.iam.Role(
  `ecs-task-execution-${environmentSuffix}`,
  {
    name: `ecs-task-execution-${environmentSuffix}`,
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
      Service: 'ecs-tasks.amazonaws.com',
    }),
    tags: commonTags,
  }
);

// Attach minimal required policies for ECS task execution
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _ecrReadOnlyPolicy = new aws.iam.RolePolicyAttachment(
  `ecr-read-${environmentSuffix}`,
  {
    role: taskExecutionRole.name,
    policyArn: 'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
  }
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _logsPolicy = new aws.iam.RolePolicyAttachment(
  `logs-policy-${environmentSuffix}`,
  {
    role: taskExecutionRole.name,
    policyArn: 'arn:aws:iam::aws:policy/CloudWatchLogsFullAccess',
  }
);

// IAM Role for ECS Task (application permissions)
const taskRole = new aws.iam.Role(`ecs-task-${environmentSuffix}`, {
  name: `ecs-task-${environmentSuffix}`,
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
    Service: 'ecs-tasks.amazonaws.com',
  }),
  tags: commonTags,
});

// Get default VPC and subnets
const defaultVpc = pulumi.output(aws.ec2.getVpc({ default: true }));
const defaultVpcId = defaultVpc.apply(vpc => vpc.id);

const defaultSubnets = defaultVpcId.apply(vpcId =>
  aws.ec2.getSubnets({
    filters: [
      {
        name: 'vpc-id',
        values: [vpcId],
      },
    ],
  })
);

// Security Group for ALB
const albSecurityGroup = new aws.ec2.SecurityGroup(
  `alb-sg-${environmentSuffix}`,
  {
    name: `alb-sg-${environmentSuffix}`,
    vpcId: defaultVpcId,
    description: 'Security group for Application Load Balancer',
    ingress: [
      {
        protocol: 'tcp',
        fromPort: 80,
        toPort: 80,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow HTTP from internet',
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
    tags: commonTags,
  }
);

// Security Group for ECS Tasks
const ecsSecurityGroup = new aws.ec2.SecurityGroup(
  `ecs-sg-${environmentSuffix}`,
  {
    name: `ecs-sg-${environmentSuffix}`,
    vpcId: defaultVpcId,
    description: 'Security group for ECS Fargate tasks',
    ingress: [
      {
        protocol: 'tcp',
        fromPort: containerPort,
        toPort: containerPort,
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
        description: 'Allow all outbound',
      },
    ],
    tags: commonTags,
  }
);

// Application Load Balancer
const alb = new aws.lb.LoadBalancer(`app-alb-${environmentSuffix}`, {
  name: `app-alb-${environmentSuffix}`,
  internal: false,
  loadBalancerType: 'application',
  securityGroups: [albSecurityGroup.id],
  subnets: defaultSubnets.apply(subnets => subnets.ids),
  enableDeletionProtection: false,
  tags: commonTags,
});

// Target Group with corrected health check on port 3000
const targetGroup = new aws.lb.TargetGroup(`app-tg-${environmentSuffix}`, {
  name: `app-tg-${environmentSuffix}`,
  port: containerPort,
  protocol: 'HTTP',
  targetType: 'ip',
  vpcId: defaultVpcId,
  healthCheck: {
    enabled: true,
    path: '/health',
    port: String(containerPort), // Fixed: was 8080, now 3000
    protocol: 'HTTP',
    interval: 30,
    timeout: 5,
    healthyThreshold: 2,
    unhealthyThreshold: 3,
    matcher: '200',
  },
  deregistrationDelay: 30,
  tags: commonTags,
});

// ALB Listener
const albListener = new aws.lb.Listener(`app-listener-${environmentSuffix}`, {
  loadBalancerArn: alb.arn,
  port: 80,
  protocol: 'HTTP',
  defaultActions: [
    {
      type: 'forward',
      targetGroupArn: targetGroup.arn,
    },
  ],
  tags: commonTags,
});

// ECS Cluster
const ecsCluster = new aws.ecs.Cluster(`app-cluster-${environmentSuffix}`, {
  name: `app-cluster-${environmentSuffix}`,
  settings: [
    {
      name: 'containerInsights',
      value: 'enabled',
    },
  ],
  tags: commonTags,
});

// ECS Task Definition with optimized CPU and memory
const taskDefinition = new aws.ecs.TaskDefinition(
  `app-task-${environmentSuffix}`,
  {
    family: `app-task-${environmentSuffix}`,
    networkMode: 'awsvpc',
    requiresCompatibilities: ['FARGATE'],
    cpu: String(cpu),
    memory: String(memory),
    executionRoleArn: taskExecutionRole.arn,
    taskRoleArn: taskRole.arn,
    containerDefinitions: pulumi.interpolate`[{
        "name": "app-container",
        "image": "${ecrRepository.repositoryUrl}:latest",
        "essential": true,
        "portMappings": [{
            "containerPort": ${containerPort},
            "protocol": "tcp"
        }],
        "logConfiguration": {
            "logDriver": "awslogs",
            "options": {
                "awslogs-group": "${logGroup.name}",
                "awslogs-region": "${aws.getRegionOutput().name}",
                "awslogs-stream-prefix": "ecs"
            }
        },
        "environment": [
            {"name": "PORT", "value": "${containerPort}"}
        ]
    }]`,
    tags: commonTags,
  }
);

// ECS Service
const ecsService = new aws.ecs.Service(
  `app-service-${environmentSuffix}`,
  {
    name: `app-service-${environmentSuffix}`,
    cluster: ecsCluster.arn,
    taskDefinition: taskDefinition.arn,
    desiredCount: 3, // BASELINE - will be optimized by optimize.py to 2 tasks
    launchType: 'FARGATE',
    networkConfiguration: {
      assignPublicIp: true,
      subnets: defaultSubnets.apply(subnets => subnets.ids),
      securityGroups: [ecsSecurityGroup.id],
    },
    loadBalancers: [
      {
        targetGroupArn: targetGroup.arn,
        containerName: 'app-container',
        containerPort: containerPort,
      },
    ],
    healthCheckGracePeriodSeconds: 60,
    enableExecuteCommand: true,
    tags: commonTags,
  },
  {
    dependsOn: [albListener],
  }
);

// Auto Scaling Target
const scalingTarget = new aws.appautoscaling.Target(
  `ecs-target-${environmentSuffix}`,
  {
    maxCapacity: 10,
    minCapacity: 2,
    resourceId: pulumi.interpolate`service/${ecsCluster.name}/${ecsService.name}`,
    scalableDimension: 'ecs:service:DesiredCount',
    serviceNamespace: 'ecs',
  }
);

// Auto Scaling Policy - Target Tracking on CPU at 70%
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _scalingPolicy = new aws.appautoscaling.Policy(
  `ecs-scaling-${environmentSuffix}`,
  {
    name: `ecs-cpu-scaling-${environmentSuffix}`,
    policyType: 'TargetTrackingScaling',
    resourceId: scalingTarget.resourceId,
    scalableDimension: scalingTarget.scalableDimension,
    serviceNamespace: scalingTarget.serviceNamespace,
    targetTrackingScalingPolicyConfiguration: {
      targetValue: 70.0,
      predefinedMetricSpecification: {
        predefinedMetricType: 'ECSServiceAverageCPUUtilization',
      },
      scaleInCooldown: 300,
      scaleOutCooldown: 60,
    },
  }
);

// Exports
export const serviceUrl = pulumi.interpolate`http://${alb.dnsName}`;
export const taskDefinitionArn = taskDefinition.arn;
export const ecrRepositoryUrl = ecrRepository.repositoryUrl;
export const clusterName = ecsCluster.name;
export const serviceName = ecsService.name;
