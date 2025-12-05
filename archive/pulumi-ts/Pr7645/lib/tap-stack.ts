/**
 * tap-stack.ts
 *
 * Optimized ECS Fargate deployment with proper configuration management,
 * resource naming, cost allocation tags, and health checks.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * Environment suffix for identifying the deployment (e.g., 'dev', 'prod').
   */
  environmentSuffix: string;

  /**
   * Container memory in MB (default: "512")
   */
  containerMemory?: string;

  /**
   * Container CPU units (default: "256")
   */
  containerCpu?: string;

  /**
   * Default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * ECS Fargate Stack with optimized configuration
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly serviceArn: pulumi.Output<string>;
  public readonly clusterName: pulumi.Output<string>;
  public readonly logGroupName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix;
    const containerMemory = args.containerMemory || '512';
    const containerCpu = args.containerCpu || '256';

    // Common tags for cost allocation
    const commonTags = {
      Environment: environmentSuffix,
      Team: 'platform',
      Project: 'ecs-optimization',
      ...args.tags,
    };

    // VPC and Networking
    const vpc = new aws.ec2.Vpc(
      `app-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...commonTags,
          Name: `app-vpc-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const subnet1 = new aws.ec2.Subnet(
      `subnet-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: 'us-east-1a',
        mapPublicIpOnLaunch: true,
        tags: {
          ...commonTags,
          Name: `subnet-1-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const subnet2 = new aws.ec2.Subnet(
      `subnet-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: 'us-east-1b',
        mapPublicIpOnLaunch: true,
        tags: {
          ...commonTags,
          Name: `subnet-2-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const igw = new aws.ec2.InternetGateway(
      `igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...commonTags,
          Name: `igw-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const routeTable = new aws.ec2.RouteTable(
      `route-table-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: igw.id,
          },
        ],
        tags: {
          ...commonTags,
          Name: `route-table-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `rta-1-${environmentSuffix}`,
      {
        subnetId: subnet1.id,
        routeTableId: routeTable.id,
      },
      { parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `rta-2-${environmentSuffix}`,
      {
        subnetId: subnet2.id,
        routeTableId: routeTable.id,
      },
      { parent: this }
    );

    // Security Group for ALB
    const albSg = new aws.ec2.SecurityGroup(
      `alb-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
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
        tags: {
          ...commonTags,
          Name: `alb-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Security Group for ECS
    const ecsSg = new aws.ec2.SecurityGroup(
      `ecs-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for ECS tasks',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [albSg.id],
            description: 'Allow HTTP from ALB',
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
          Name: `ecs-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `app-alb-${environmentSuffix}`,
      {
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSg.id],
        subnets: [subnet1.id, subnet2.id],
        tags: {
          ...commonTags,
          Name: `app-alb-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Single Target Group with Health Check Configuration
    const targetGroup = new aws.lb.TargetGroup(
      `app-tg-${environmentSuffix}`,
      {
        port: 80,
        protocol: 'HTTP',
        vpcId: vpc.id,
        targetType: 'ip',
        healthCheck: {
          enabled: true,
          path: '/',
          protocol: 'HTTP',
          port: '80',
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          timeout: 5,
          interval: 30,
          matcher: '200-299',
        },
        tags: {
          ...commonTags,
          Name: `app-tg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const listener = new aws.lb.Listener(
      `listener-${environmentSuffix}`,
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
        tags: {
          ...commonTags,
          Name: `listener-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Single IAM Role - Task Execution Role
    const taskExecutionRole = new aws.iam.Role(
      `task-execution-role-${environmentSuffix}`,
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
        tags: {
          ...commonTags,
          Name: `task-execution-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `task-execution-policy-${environmentSuffix}`,
      {
        role: taskExecutionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    // CloudWatch Log Group with 7-day retention
    const logGroup = new aws.cloudwatch.LogGroup(
      `app-logs-${environmentSuffix}`,
      {
        name: `/ecs/app-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          ...commonTags,
          Name: `app-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // ECS Cluster
    const cluster = new aws.ecs.Cluster(
      `app-cluster-${environmentSuffix}`,
      {
        tags: {
          ...commonTags,
          Name: `app-cluster-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Task Definition
    const taskDefinition = new aws.ecs.TaskDefinition(
      `app-task-${environmentSuffix}`,
      {
        family: `app-${environmentSuffix}`,
        cpu: containerCpu,
        memory: containerMemory,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        executionRoleArn: taskExecutionRole.arn,
        containerDefinitions: pulumi.interpolate`[{
        "name": "app",
        "image": "nginx:latest",
        "memory": ${parseInt(containerMemory)},
        "cpu": ${parseInt(containerCpu)},
        "essential": true,
        "portMappings": [{
          "containerPort": 80,
          "protocol": "tcp"
        }],
        "logConfiguration": {
          "logDriver": "awslogs",
          "options": {
            "awslogs-group": "${logGroup.name}",
            "awslogs-region": "us-east-1",
            "awslogs-stream-prefix": "ecs"
          }
        }
      }]`,
        tags: {
          ...commonTags,
          Name: `app-task-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // ECS Service
    const service = new aws.ecs.Service(
      `app-service-${environmentSuffix}`,
      {
        cluster: cluster.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        taskDefinition: taskDefinition.arn,
        networkConfiguration: {
          assignPublicIp: true,
          subnets: [subnet1.id, subnet2.id],
          securityGroups: [ecsSg.id],
        },
        loadBalancers: [
          {
            targetGroupArn: targetGroup.arn,
            containerName: 'app',
            containerPort: 80,
          },
        ],
        tags: {
          ...commonTags,
          Name: `app-service-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [listener] }
    );

    // Set outputs
    this.albDnsName = alb.dnsName;
    this.serviceArn = service.id;
    this.clusterName = cluster.name;
    this.logGroupName = logGroup.name;

    // Register outputs
    this.registerOutputs({
      albDnsName: this.albDnsName,
      serviceArn: this.serviceArn,
      clusterName: this.clusterName,
      logGroupName: this.logGroupName,
    });
  }
}
