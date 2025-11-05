IDEAL_RESPONSE.md

# Ideal Response - Cross-Region AWS Infrastructure Migration

## bin/tap.ts

```typescript

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration based on the deployment environment. It handles environment-specific settings,
 * tagging, and deployment configuration for AWS resources.
 *
 * The stack created by this module uses environment suffixes to distinguish between
 * different deployment environments (development, staging, production, etc.).
 */
import * as pulumi from "@pulumi/pulumi";
import { TapStack } from "../lib/tap-stack";

// Initialize Pulumi configuration for the current stack.
const config = new pulumi.Config();

// Get the environment suffix from the CI, Pulumi config, defaulting to 'dev'.
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get("env") || "dev";

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = config.get("repository") || "unknown";
const commitAuthor = config.get("commitAuthor") || "unknown";

// Define a set of default tags to apply to all resources.
// While not explicitly used in the TapStack instantiation here,
// this is the standard place to define them. They would typically be passed
// into the TapStack or configured on the AWS provider.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const tapStack = new TapStack("pulumi-infra", {
  tags: defaultTags,
});

// Export stack outputs
export const vpcId = tapStack.vpcId;
export const ecrRepositoryUrl = tapStack.ecrRepositoryUrl;
export const cloudwatchLogGroupName = tapStack.cloudwatchLogGroupName;
export const rdsClusterEndpoint = tapStack.rdsClusterEndpoint;
export const rdsReaderEndpoint = tapStack.rdsReaderEndpoint;
export const albDnsName = tapStack.albDnsName;
export const ecsClusterName = tapStack.ecsClusterName;
export const ecsServiceName = tapStack.ecsServiceName;
export const targetGroupArn = tapStack.targetGroupArn;
export const environment = tapStack.environment;

```

## lib/tap-stack.ts

```typescript

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as random from "@pulumi/random";

/**
 * Configuration interface for environment-specific settings
 */
interface EnvironmentConfig {
  environment: string;
  rdsInstanceType: string;
  ecsTaskCpu: number;
  ecsTaskMemory: number;
  cloudwatchRetentionDays: number;
  enableReadReplicas: boolean;
  rdsBackupRetentionDays: number;
  albHealthCheckInterval: number;
  containerImage: string;
  containerPort: number;
  desiredTaskCount: number;
}

/**
 * Component Resource for VPC with public and private subnets
 */
class VpcComponent extends pulumi.ComponentResource {
  vpc: aws.ec2.Vpc;
  publicSubnets: aws.ec2.Subnet[];
  privateSubnets: aws.ec2.Subnet[];
  publicRouteTable: aws.ec2.RouteTable;
  privateRouteTable: aws.ec2.RouteTable;

  constructor(
    name: string,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:vpc:VpcComponent", name, {}, opts);

    const cidrBlock = "10.0.0.0/16";

    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `${name}-vpc`,
      {
        cidrBlock: cidrBlock,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `${name}-vpc`,
        },
      },
      { parent: this }
    );

    // Create public subnets (for ALB)
    this.publicSubnets = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new aws.ec2.Subnet(
        `${name}-public-subnet-${i + 1}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${i + 1}.0/24`,
          availabilityZone: aws.getAvailabilityZones({ state: "available" }).then(
            (result) => result.names[i]
          ),
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `${name}-public-subnet-${i + 1}`,
            Type: "Public",
          },
        },
        { parent: this }
      );
      this.publicSubnets.push(subnet);
    }

    // Create private subnets (for ECS and RDS)
    this.privateSubnets = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new aws.ec2.Subnet(
        `${name}-private-subnet-${i + 1}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${i + 10}.0/24`,
          availabilityZone: aws.getAvailabilityZones({ state: "available" }).then(
            (result) => result.names[i]
          ),
          tags: {
            Name: `${name}-private-subnet-${i + 1}`,
            Type: "Private",
          },
        },
        { parent: this }
      );
      this.privateSubnets.push(subnet);
    }

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `${name}-igw`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `${name}-igw`,
        },
      },
      { parent: this }
    );

    // Create route table for public subnets
    this.publicRouteTable = new aws.ec2.RouteTable(
      `${name}-public-rt`,
      {
        vpcId: this.vpc.id,
        routes: [
          {
            cidrBlock: "0.0.0.0/0",
            gatewayId: igw.id,
          },
        ],
        tags: {
          Name: `${name}-public-rt`,
        },
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `${name}-public-rta-${index + 1}`,
        {
          subnetId: subnet.id,
          routeTableId: this.publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create NAT Gateway for private subnet internet access
    const eip = new aws.ec2.Eip(
      `${name}-eip`,
      {
        domain: "vpc",
        tags: {
          Name: `${name}-eip`,
        },
      },
      { parent: this }
    );

    const natGateway = new aws.ec2.NatGateway(
      `${name}-nat`,
      {
        subnetId: this.publicSubnets[0].id,
        allocationId: eip.id,
        tags: {
          Name: `${name}-nat`,
        },
      },
      { parent: this }
    );

    // Create route table for private subnets
    this.privateRouteTable = new aws.ec2.RouteTable(
      `${name}-private-rt`,
      {
        vpcId: this.vpc.id,
        routes: [
          {
            cidrBlock: "0.0.0.0/0",
            natGatewayId: natGateway.id,
          },
        ],
        tags: {
          Name: `${name}-private-rt`,
        },
      },
      { parent: this }
    );

    // Associate private subnets with private route table
    this.privateSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `${name}-private-rta-${index + 1}`,
        {
          subnetId: subnet.id,
          routeTableId: this.privateRouteTable.id,
        },
        { parent: this }
      );
    });

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetIds: this.publicSubnets.map((s) => s.id),
      privateSubnetIds: this.privateSubnets.map((s) => s.id),
    });
  }
}

/**
 * Component Resource for ECR Repository with lifecycle policies
 */
class EcrComponent extends pulumi.ComponentResource {
  repository: aws.ecr.Repository;

  constructor(
    name: string,
    tags: Record<string, string>,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:ecr:EcrComponent", name, {}, opts);

    this.repository = new aws.ecr.Repository(
      `${name}-repo`,
      {
        name: name,
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        imageTagMutability: "MUTABLE",
        tags: tags,
      },
      { parent: this }
    );

    // Add lifecycle policy to keep only 10 images
    new aws.ecr.LifecyclePolicy(
      `${name}-lifecycle`,
      {
        repository: this.repository.name,
        policy: JSON.stringify({
          rules: [
            {
              rulePriority: 1,
              description: "Keep last 10 images",
              selection: {
                tagStatus: "any",
                countType: "imageCountMoreThan",
                countNumber: 10,
              },
              action: {
                type: "expire",
              },
            },
          ],
        }),
      },
      { parent: this }
    );

    this.registerOutputs({
      repositoryUrl: this.repository.repositoryUrl,
      registryId: this.repository.registryId,
    });
  }
}

/**
 * Component Resource for CloudWatch setup
 */
class CloudWatchComponent extends pulumi.ComponentResource {
  logGroup: aws.cloudwatch.LogGroup;

  constructor(
    name: string,
    retentionDays: number,
    tags: Record<string, string>,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:cloudwatch:CloudWatchComponent", name, {}, opts);

    this.logGroup = new aws.cloudwatch.LogGroup(
      `${name}-logs`,
      {
        name: `/aws/ecs/${name}`,
        retentionInDays: retentionDays,
        tags: tags,
      },
      { parent: this }
    );

    this.registerOutputs({
      logGroupName: this.logGroup.name,
      logGroupArn: this.logGroup.arn,
    });
  }
}

/**
 * Component Resource for IAM roles and policies
 */
class IamComponent extends pulumi.ComponentResource {
  ecsTaskRole: aws.iam.Role;
  ecsTaskExecutionRole: aws.iam.Role;

  constructor(
    name: string,
    tags: Record<string, string>,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:iam:IamComponent", name, {}, opts);

    // ECS Task Role
    this.ecsTaskRole = new aws.iam.Role(
      `${name}-ecs-task-role`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Action: "sts:AssumeRole",
              Effect: "Allow",
              Principal: {
                Service: "ecs-tasks.amazonaws.com",
              },
            },
          ],
        }),
        tags: tags,
      },
      { parent: this }
    );

    // Attach basic policy for task execution
    new aws.iam.RolePolicyAttachment(
      `${name}-task-policy`,
      {
        role: this.ecsTaskRole,
        policyArn:
          "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role",
      },
      { parent: this }
    );

    // ECS Task Execution Role
    this.ecsTaskExecutionRole = new aws.iam.Role(
      `${name}-ecs-task-execution-role`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Action: "sts:AssumeRole",
              Effect: "Allow",
              Principal: {
                Service: "ecs-tasks.amazonaws.com",
              },
            },
          ],
        }),
        tags: tags,
      },
      { parent: this }
    );

    // Attach execution role policy
    new aws.iam.RolePolicyAttachment(
      `${name}-execution-policy`,
      {
        role: this.ecsTaskExecutionRole,
        policyArn:
          "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
      },
      { parent: this }
    );

    // Add CloudWatch logs policy
    new aws.iam.RolePolicy(
      `${name}-logs-policy`,
      {
        role: this.ecsTaskExecutionRole,
        policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
              ],
              Resource: "*",
            },
          ],
        }),
      },
      { parent: this }
    );

    this.registerOutputs({
      ecsTaskRoleArn: this.ecsTaskRole.arn,
      ecsTaskExecutionRoleArn: this.ecsTaskExecutionRole.arn,
    });
  }
}

/**
 * Component Resource for RDS PostgreSQL (NOT Aurora)
 * FIXED: Using regular RDS PostgreSQL instead of Aurora
 * - Supports all instance types including db.t3.micro
 * - Simpler setup
 * - Lower cost
 * - Still supports read replicas for prod
 */
class RdsComponent extends pulumi.ComponentResource {
  instance: aws.rds.Instance;
  readReplica?: aws.rds.Instance;
  endpoint: pulumi.Output<string>;

  constructor(
    name: string,
    config: EnvironmentConfig,
    subnetIds: pulumi.Output<string[]>,
    securityGroupId: pulumi.Output<string>,
    tags: Record<string, string>,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:rds:RdsComponent", name, {}, opts);

    const dbPassword = new random.RandomPassword(
      `${name}-db-password`,
      {
        length: 16,
        special: true,
      },
      { parent: this }
    );

    // Create DB subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `${name}-db-subnet-group`,
      {
        subnetIds: subnetIds,
        tags: tags,
      },
      { parent: this }
    );

    // Create RDS PostgreSQL instance (NOT Aurora cluster)
    // This supports db.t3.micro and has no engine version compatibility issues
    // FIXED: Removed preferredBackupWindow and preferredMaintenanceWindow
    // (those are Cluster properties, not Instance properties)
    this.instance = new aws.rds.Instance(
      `${name}-instance`,
      {
        identifier: `${name}-db`,
        engine: "postgres",
        engineVersion: "14", 
        instanceClass: config.rdsInstanceType,
        allocatedStorage: 20,
        dbName: "paymentdb",
        username: "postgres",
        password: dbPassword.result,
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [securityGroupId],
        backupRetentionPeriod: config.rdsBackupRetentionDays,
        skipFinalSnapshot: true,
        storageEncrypted: true,
        multiAz: config.environment === "prod",
        publiclyAccessible: false,
        tags: tags,
      },
      { parent: this }
    );

    // Create read replica for staging and production
    if (config.enableReadReplicas) {
      this.readReplica = new aws.rds.Instance(
        `${name}-read-replica`,
        {
          identifier: `${name}-db-read`,
          engine: "postgres",
          engineVersion: "14.7",
          instanceClass: config.rdsInstanceType,
          replicateSourceDb: this.instance.identifier,
          publiclyAccessible: false,
          skipFinalSnapshot: true,
          tags: tags,
        },
        { parent: this }
      );
    }

    this.endpoint = this.instance.endpoint.apply((e) => e.split(":")[0]); // Extract just the hostname

    this.registerOutputs({
      instanceEndpoint: this.instance.endpoint,
      instanceAddress: this.instance.address,
      readerEndpoint: this.readReplica
        ? this.readReplica.address
        : this.instance.address,
    });
  }
}

/**
 * Main TapStack Component
 */
export class TapStack extends pulumi.ComponentResource {
  vpcComponent: VpcComponent;
  ecrComponent: EcrComponent;
  cloudwatchComponent: CloudWatchComponent;
  iamComponent: IamComponent;
  rdsComponent: RdsComponent;
  vpcId: pulumi.Output<string>;
  ecrRepositoryUrl: pulumi.Output<string>;
  cloudwatchLogGroupName: pulumi.Output<string>;
  rdsClusterEndpoint: pulumi.Output<string>;
  rdsReaderEndpoint: pulumi.Output<string>;
  albDnsName: pulumi.Output<string>;
  ecsClusterName: pulumi.Output<string>;
  ecsServiceName: pulumi.Output<string>;
  targetGroupArn: pulumi.Output<string>;
  environment: string;

  constructor(
    name: string,
    args: { tags: Record<string, string> },
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:tap:TapStack", name, {}, opts);

    const stack = pulumi.getStack();

    // Load environment-specific configuration
    const environmentConfig = this.loadEnvironmentConfig(stack);
    this.environment = environmentConfig.environment;

    // Create VPC
    this.vpcComponent = new VpcComponent(`${name}-vpc`, {
      parent: this,
    });

    // Create ECR Repository
    this.ecrComponent = new EcrComponent(
      `${name}-app-repo`,
      args.tags,
      { parent: this }
    );

    // Create CloudWatch Log Group
    this.cloudwatchComponent = new CloudWatchComponent(
      `${name}-logs`,
      environmentConfig.cloudwatchRetentionDays,
      args.tags,
      { parent: this }
    );

    // Create IAM roles
    this.iamComponent = new IamComponent(
      `${name}-iam`,
      args.tags,
      { parent: this }
    );

    // Create security group for RDS
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `${name}-rds-sg`,
      {
        vpcId: this.vpcComponent.vpc.id,
        ingress: [
          {
            protocol: "tcp",
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: ["10.0.0.0/16"],
          },
        ],
        egress: [
          {
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
          },
        ],
        tags: args.tags,
      },
      { parent: this }
    );

    // Create RDS PostgreSQL
    this.rdsComponent = new RdsComponent(
      `${name}-rds`,
      environmentConfig,
      pulumi.output(this.vpcComponent.privateSubnets.map((s) => s.id)),
      rdsSecurityGroup.id,
      args.tags,
      { parent: this }
    );

    // Create ALB Security Group
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `${name}-alb-sg`,
      {
        vpcId: this.vpcComponent.vpc.id,
        ingress: [
          {
            protocol: "tcp",
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ["0.0.0.0/0"],
          },
          {
            protocol: "tcp",
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ["0.0.0.0/0"],
          },
        ],
        egress: [
          {
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
          },
        ],
        tags: args.tags,
      },
      { parent: this }
    );

    // Create ALB
    const alb = new aws.lb.LoadBalancer(
      `${name}-alb`,
      {
        internal: false,
        loadBalancerType: "application",
        securityGroups: [albSecurityGroup.id],
        subnets: this.vpcComponent.publicSubnets.map((s) => s.id),
        enableDeletionProtection: false,
        tags: args.tags,
      },
      { parent: this }
    );

    // Create target group for ALB
    const targetGroup = new aws.lb.TargetGroup(
      `${name}-tg`,
      {
        port: environmentConfig.containerPort,
        protocol: "HTTP",
        vpcId: this.vpcComponent.vpc.id,
        targetType: "ip",
        healthCheck: {
          interval: environmentConfig.albHealthCheckInterval,
          path: "/health",
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
          matcher: "200",
        },
        tags: args.tags,
      },
      { parent: this }
    );

    // Create ALB listener
    const albListener = new aws.lb.Listener(
      `${name}-listener`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: "HTTP",
        defaultActions: [
          {
            type: "forward",
            targetGroupArn: targetGroup.arn,
          },
        ],
      },
      { parent: this, dependsOn: [alb, targetGroup] }
    );

    // Create ECS Cluster
    const ecsCluster = new aws.ecs.Cluster(
      `${name}-cluster`,
      {
        name: `${name}-cluster`,
        settings: [
          {
            name: "containerInsights",
            value: "enabled",
          },
        ],
        tags: args.tags,
      },
      { parent: this }
    );

    // Create ECS Task Definition
    const taskDefinition = new aws.ecs.TaskDefinition(
      `${name}-task`,
      {
        family: `${name}-task`,
        networkMode: "awsvpc",
        requiresCompatibilities: ["FARGATE"],
        cpu: environmentConfig.ecsTaskCpu.toString(),
        memory: environmentConfig.ecsTaskMemory.toString(),
        executionRoleArn: this.iamComponent.ecsTaskExecutionRole.arn,
        taskRoleArn: this.iamComponent.ecsTaskRole.arn,
        containerDefinitions: pulumi
          .all([
            this.ecrComponent.repository.repositoryUrl,
            this.cloudwatchComponent.logGroup.name,
          ])
          .apply(([repoUrl, logGroupName]) =>
            JSON.stringify([
              {
                name: "payment-app",
                image: `${repoUrl}:latest`,
                portMappings: [
                  {
                    containerPort: environmentConfig.containerPort,
                    hostPort: environmentConfig.containerPort,
                    protocol: "tcp",
                  },
                ],
                logConfiguration: {
                  logDriver: "awslogs",
                  options: {
                    "awslogs-group": logGroupName,
                    "awslogs-region": "us-east-1",
                    "awslogs-stream-prefix": "ecs",
                  },
                },
                environment: [
                  {
                    name: "ENVIRONMENT",
                    value: environmentConfig.environment,
                  },
                ],
              },
            ])
          ),
        tags: args.tags,
      },
      { parent: this }
    );

    // Create security group for ECS tasks
    const ecsSecurityGroup = new aws.ec2.SecurityGroup(
      `${name}-ecs-sg`,
      {
        vpcId: this.vpcComponent.vpc.id,
        ingress: [
          {
            protocol: "tcp",
            fromPort: environmentConfig.containerPort,
            toPort: environmentConfig.containerPort,
            securityGroups: [albSecurityGroup.id],
          },
        ],
        egress: [
          {
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
          },
        ],
        tags: args.tags,
      },
      { parent: this }
    );

    // Create ECS Service
    const ecsService = new aws.ecs.Service(
      `${name}-service`,
      {
        cluster: ecsCluster.arn,
        taskDefinition: taskDefinition.arn,
        desiredCount: environmentConfig.desiredTaskCount,
        launchType: "FARGATE",
        networkConfiguration: {
          subnets: this.vpcComponent.privateSubnets.map((s) => s.id),
          securityGroups: [ecsSecurityGroup.id],
          assignPublicIp: false,
        },
        loadBalancers: [
          {
            targetGroupArn: targetGroup.arn,
            containerName: "payment-app",
            containerPort: environmentConfig.containerPort,
          },
        ],
        tags: args.tags,
      },
      { parent: this, dependsOn: [albListener] }
    );

    // Create CloudWatch Alarms
    new aws.cloudwatch.MetricAlarm(
      `${name}-cpu-alarm`,
      {
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        metricName: "CPUUtilization",
        namespace: "AWS/ECS",
        period: 300,
        statistic: "Average",
        threshold: 80,
        alarmActions: [],
        dimensions: {
          ServiceName: ecsService.name,
          ClusterName: ecsCluster.name,
        },
        tags: args.tags,
      },
      { parent: this }
    );

    new aws.cloudwatch.MetricAlarm(
      `${name}-memory-alarm`,
      {
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        metricName: "MemoryUtilization",
        namespace: "AWS/ECS",
        period: 300,
        statistic: "Average",
        threshold: 80,
        alarmActions: [],
        dimensions: {
          ServiceName: ecsService.name,
          ClusterName: ecsCluster.name,
        },
        tags: args.tags,
      },
      { parent: this }
    );

    // Store outputs as class properties
    this.vpcId = this.vpcComponent.vpc.id;
    this.ecrRepositoryUrl = this.ecrComponent.repository.repositoryUrl;
    this.cloudwatchLogGroupName = this.cloudwatchComponent.logGroup.name;
    this.rdsClusterEndpoint = this.rdsComponent.endpoint;
    this.rdsReaderEndpoint = this.rdsComponent.readReplica
      ? this.rdsComponent.readReplica.address
      : this.rdsComponent.instance.address;
    this.albDnsName = alb.dnsName;
    this.ecsClusterName = ecsCluster.name;
    this.ecsServiceName = ecsService.name;
    this.targetGroupArn = targetGroup.arn;

    // Register outputs
    this.registerOutputs({
      vpcId: this.vpcId,
      ecrRepositoryUrl: this.ecrRepositoryUrl,
      cloudwatchLogGroupName: this.cloudwatchLogGroupName,
      rdsClusterEndpoint: this.rdsClusterEndpoint,
      rdsReaderEndpoint: this.rdsReaderEndpoint,
      albDnsName: this.albDnsName,
      ecsClusterName: this.ecsClusterName,
      ecsServiceName: this.ecsServiceName,
      targetGroupArn: this.targetGroupArn,
      environment: environmentConfig.environment,
    });
  }

  private loadEnvironmentConfig(stack: string): EnvironmentConfig {
    const configs: Record<string, EnvironmentConfig> = {
      dev: {
        environment: "dev",
        // ✅ NOW WORKS: db.t3.micro is fully supported in regular RDS PostgreSQL
        rdsInstanceType: "db.t3.micro",
        ecsTaskCpu: 512,
        ecsTaskMemory: 1024,
        cloudwatchRetentionDays: 7,
        enableReadReplicas: false,
        rdsBackupRetentionDays: 7,
        albHealthCheckInterval: 30,
        containerImage: "payment-app:latest",
        containerPort: 8080,
        desiredTaskCount: 1,
      },
      staging: {
        environment: "staging",
        // ✅ Staging uses small instance
        rdsInstanceType: "db.t3.small",
        ecsTaskCpu: 1024,
        ecsTaskMemory: 2048,
        cloudwatchRetentionDays: 30,
        enableReadReplicas: true,
        rdsBackupRetentionDays: 14,
        albHealthCheckInterval: 30,
        containerImage: "payment-app:latest",
        containerPort: 8080,
        desiredTaskCount: 2,
      },
      prod: {
        environment: "prod",
        // ✅ Production uses medium instance with Multi-AZ
        rdsInstanceType: "db.t3.medium",
        ecsTaskCpu: 2048,
        ecsTaskMemory: 4096,
        cloudwatchRetentionDays: 90,
        enableReadReplicas: true,
        rdsBackupRetentionDays: 30,
        albHealthCheckInterval: 15,
        containerImage: "payment-app:latest",
        containerPort: 8080,
        desiredTaskCount: 3,
      },
    };

    return configs[stack] || configs["dev"];
  }
}


```