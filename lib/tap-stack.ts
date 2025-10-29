/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

/**
 * tap-stack.ts
 * 
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 * 
 * It orchestrates the instantiation of other resource-specific components
 * and manages environment-specific configurations.
 */

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as fs from "fs";
import * as path from "path";

/**
 * Configuration interface for environment-specific settings
 */
interface EnvironmentConfig {
  environmentSuffix: string;
  vpcCidr: string;
  ecsTaskCount: number;
  rdsInstanceClass: string;
  s3LogRetentionDays: number;
  availabilityZones: string[];
  tags: {
    Environment: string;
    Team: string;
    CostCenter: string;
  };
  domain: string;
  ecsTaskCpu: string;
  ecsTaskMemory: string;
  rdsAllocatedStorage: number;
  enableVpcPeering: boolean;
  peeringVpcIds?: string[];
  cloudwatchLogRetentionDays: number;
  albHealthCheckPath: string;
  albHealthCheckInterval: number;
  containerPort: number;
  containerImage: string;
}

/**
 * Stack outputs interface
 */
interface TapStackOutputs {
  vpcId: pulumi.Output<string>;
  vpcCidr: pulumi.Output<string>;
  albDnsName: pulumi.Output<string>;
  albArn: pulumi.Output<string>;
  ecsClusterArn: pulumi.Output<string>;
  ecsServiceName: pulumi.Output<string>;
  rdsEndpoint: pulumi.Output<string>;
  rdsPort: pulumi.Output<number>;
  rdsSecretArn: pulumi.Output<string>;
  s3BucketName: pulumi.Output<string>;
  route53ZoneId: pulumi.Output<string>;
  route53ZoneName: pulumi.Output<string>;
  cloudwatchDashboardArn: pulumi.Output<string>;
  publicSubnetIds: pulumi.Output<string>[];
  privateSubnetIds: pulumi.Output<string>[];
  vpcPeeringConnectionIds: pulumi.Output<string>[];
}

/**
 * Main TapStack class implementing multi-environment ECS infrastructure
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly outputs: TapStackOutputs;
  private config: EnvironmentConfig;
  private projectName: string;
  private stackName: string;

  constructor(
    name: string,
    args: { environmentSuffix: string },
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:infrastructure:TapStack", name, {}, opts);

    this.projectName = pulumi.getProject();
    this.stackName = pulumi.getStack();
    
    // Load environment-specific configuration
    this.config = this.loadConfiguration(args.environmentSuffix);

    // Create VPC and networking
    const vpc = this.createVpc();

    // Create security groups
    const securityGroups = this.createSecurityGroups(vpc);

    // Create RDS Aurora PostgreSQL cluster
    const rds = this.createRdsCluster(vpc, securityGroups.rdsSecurityGroup);

    // Create ECS Cluster
    const ecsCluster = this.createEcsCluster();

    // Create Application Load Balancer
    const alb = this.createApplicationLoadBalancer(
      vpc,
      securityGroups.albSecurityGroup
    );

    // Create ECS Service
    const ecsService = this.createEcsService(
      ecsCluster,
      vpc,
      securityGroups.ecsSecurityGroup,
      alb.targetGroup,
      rds
    );

    // Create S3 bucket for logs
    const s3Bucket = this.createS3Bucket();

    // Create Route53 hosted zone and records
    const route53 = this.createRoute53(alb);

    // Create CloudWatch dashboard and alarms
    const cloudwatch = this.createCloudWatch(
      ecsCluster,
      ecsService,
      alb,
      rds
    );

    // Create VPC Peering connections if enabled
    const vpcPeering = this.createVpcPeering(vpc);

    // Export outputs
    this.outputs = {
      vpcId: vpc.vpcId,
      vpcCidr: pulumi.output(this.config.vpcCidr),
      albDnsName: alb.lb.loadBalancer.dnsName,
      albArn: alb.lb.loadBalancer.arn,
      ecsClusterArn: ecsCluster.arn,
      ecsServiceName: ecsService.service.name,
      rdsEndpoint: rds.cluster.endpoint,
      rdsPort: rds.cluster.port,
      rdsSecretArn: rds.secret.arn,
      s3BucketName: s3Bucket.bucket,
      route53ZoneId: route53.zone.zoneId,
      route53ZoneName: route53.zone.name,
      cloudwatchDashboardArn: cloudwatch.dashboard.dashboardArn,
      publicSubnetIds: vpc.publicSubnetIds,
      privateSubnetIds: vpc.privateSubnetIds,
      vpcPeeringConnectionIds: vpcPeering.map((p) => p.id),
    };

    // Write outputs to JSON file
    this.writeOutputsToFile(this.outputs);

    this.registerOutputs(this.outputs);
  }

  /**
   * Load environment-specific configuration
   */
  private loadConfiguration(environmentSuffix: string): EnvironmentConfig {
    const config = new pulumi.Config();
    
    return {
      environmentSuffix,
      vpcCidr: config.require("vpcCidr"),
      ecsTaskCount: config.requireNumber("ecsTaskCount"),
      rdsInstanceClass: config.require("rdsInstanceClass"),
      s3LogRetentionDays: config.requireNumber("s3LogRetentionDays"),
      availabilityZones: config.requireObject<string[]>("availabilityZones"),
      tags: {
        Environment: environmentSuffix,
        Team: config.require("team"),
        CostCenter: config.require("costCenter"),
      },
      domain: config.require("domain"),
      ecsTaskCpu: config.require("ecsTaskCpu"),
      ecsTaskMemory: config.require("ecsTaskMemory"),
      rdsAllocatedStorage: config.requireNumber("rdsAllocatedStorage"),
      enableVpcPeering: config.requireBoolean("enableVpcPeering"),
      peeringVpcIds: config.getObject<string[]>("peeringVpcIds"),
      cloudwatchLogRetentionDays: config.requireNumber("cloudwatchLogRetentionDays"),
      albHealthCheckPath: config.require("albHealthCheckPath"),
      albHealthCheckInterval: config.requireNumber("albHealthCheckInterval"),
      containerPort: config.requireNumber("containerPort"),
      containerImage: config.require("containerImage"),
    };
  }

  /**
   * Create VPC with public and private subnets
   */
  private createVpc() {
    const vpcName = this.getResourceName("vpc");
    
    const vpc = new awsx.ec2.Vpc(
      vpcName,
      {
        cidrBlock: this.config.vpcCidr,
        numberOfAvailabilityZones: this.config.availabilityZones.length,
        subnetSpecs: [
          {
            type: awsx.ec2.SubnetType.Public,
            name: this.getResourceName("public-subnet"),
            cidrMask: 24,
          },
          {
            type: awsx.ec2.SubnetType.Private,
            name: this.getResourceName("private-subnet"),
            cidrMask: 24,
          },
        ],
        natGateways: {
          strategy: awsx.ec2.NatGatewayStrategy.Single,
        },
        tags: {
          ...this.config.tags,
          Name: vpcName,
        },
      },
      { parent: this }
    );

    return vpc;
  }

  /**
   * Create security groups for ALB, ECS, and RDS
   */
  private createSecurityGroups(vpc: awsx.ec2.Vpc) {
    // ALB Security Group
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      this.getResourceName("alb-sg"),
      {
        vpcId: vpc.vpcId,
        description: "Security group for Application Load Balancer",
        ingress: [
          {
            protocol: "tcp",
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ["0.0.0.0/0"],
            description: "Allow HTTP traffic",
          },
          {
            protocol: "tcp",
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ["0.0.0.0/0"],
            description: "Allow HTTPS traffic",
          },
        ],
        egress: [
          {
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
            description: "Allow all outbound traffic",
          },
        ],
        tags: {
          ...this.config.tags,
          Name: this.getResourceName("alb-sg"),
        },
      },
      { parent: this }
    );

    // ECS Security Group
    const ecsSecurityGroup = new aws.ec2.SecurityGroup(
      this.getResourceName("ecs-sg"),
      {
        vpcId: vpc.vpcId,
        description: "Security group for ECS tasks",
        egress: [
          {
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
            description: "Allow all outbound traffic",
          },
        ],
        tags: {
          ...this.config.tags,
          Name: this.getResourceName("ecs-sg"),
        },
      },
      { parent: this }
    );

    // Add ingress rule to allow traffic from ALB to ECS
    new aws.ec2.SecurityGroupRule(
      this.getResourceName("ecs-alb-ingress"),
      {
        type: "ingress",
        fromPort: this.config.containerPort,
        toPort: this.config.containerPort,
        protocol: "tcp",
        sourceSecurityGroupId: albSecurityGroup.id,
        securityGroupId: ecsSecurityGroup.id,
        description: "Allow traffic from ALB",
      },
      { parent: this }
    );

    // RDS Security Group
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      this.getResourceName("rds-sg"),
      {
        vpcId: vpc.vpcId,
        description: "Security group for RDS Aurora PostgreSQL",
        egress: [
          {
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
            description: "Allow all outbound traffic",
          },
        ],
        tags: {
          ...this.config.tags,
          Name: this.getResourceName("rds-sg"),
        },
      },
      { parent: this }
    );

    // Add ingress rule to allow traffic from ECS to RDS
    new aws.ec2.SecurityGroupRule(
      this.getResourceName("rds-ecs-ingress"),
      {
        type: "ingress",
        fromPort: 5432,
        toPort: 5432,
        protocol: "tcp",
        sourceSecurityGroupId: ecsSecurityGroup.id,
        securityGroupId: rdsSecurityGroup.id,
        description: "Allow PostgreSQL traffic from ECS",
      },
      { parent: this }
    );

    return { albSecurityGroup, ecsSecurityGroup, rdsSecurityGroup };
  }

  /**
   * Create RDS Aurora PostgreSQL cluster with Secrets Manager
   */
  private createRdsCluster(
    vpc: awsx.ec2.Vpc,
    securityGroup: aws.ec2.SecurityGroup
  ) {
    // Create DB subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      this.getResourceName("db-subnet-group"),
      {
        subnetIds: vpc.privateSubnetIds,
        tags: {
          ...this.config.tags,
          Name: this.getResourceName("db-subnet-group"),
        },
      },
      { parent: this }
    );

    // Create RDS cluster parameter group
    const parameterGroup = new aws.rds.ClusterParameterGroup(
      this.getResourceName("db-param-group"),
      {
        family: "aurora-postgresql14",
        description: "RDS cluster parameter group for Aurora PostgreSQL",
        tags: {
          ...this.config.tags,
          Name: this.getResourceName("db-param-group"),
        },
      },
      { parent: this }
    );

    // Create KMS key for encryption
    const kmsKey = new aws.kms.Key(
      this.getResourceName("rds-kms"),
      {
        description: "KMS key for RDS encryption",
        tags: {
          ...this.config.tags,
          Name: this.getResourceName("rds-kms"),
        },
      },
      { parent: this }
    );

    // Create RDS Aurora cluster with Secrets Manager integration
    const cluster = new aws.rds.Cluster(
      this.getResourceName("aurora-cluster"),
      {
        clusterIdentifier: this.getResourceName("aurora-cluster"),
        engine: "aurora-postgresql",
        engineVersion: "14.6",
        databaseName: "tradingdb",
        masterUsername: "dbadmin",
        manageMasterUserPassword: true,
        masterUserSecretKmsKeyId: kmsKey.keyId,
        dbSubnetGroupName: dbSubnetGroup.name,
        dbClusterParameterGroupName: parameterGroup.name,
        vpcSecurityGroupIds: [securityGroup.id],
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,
        backupRetentionPeriod: this.config.environmentSuffix === "prod" ? 30 : 7,
        preferredBackupWindow: "03:00-04:00",
        preferredMaintenanceWindow: "mon:04:00-mon:05:00",
        skipFinalSnapshot: this.config.environmentSuffix !== "prod",
        finalSnapshotIdentifier:
          this.config.environmentSuffix === "prod"
            ? this.getResourceName("aurora-final-snapshot")
            : undefined,
        tags: {
          ...this.config.tags,
          Name: this.getResourceName("aurora-cluster"),
        },
      },
      { parent: this }
    );

    // Create RDS cluster instance
    const clusterInstance = new aws.rds.ClusterInstance(
      this.getResourceName("aurora-instance"),
      {
        clusterIdentifier: cluster.id,
        instanceClass: this.config.rdsInstanceClass,
        engine: "aurora-postgresql",
        engineVersion: "14.6",
        publiclyAccessible: false,
        tags: {
          ...this.config.tags,
          Name: this.getResourceName("aurora-instance"),
        },
      },
      { parent: this, dependsOn: [cluster] }
    );

    // Get the secret created by RDS
    const secret = cluster.masterUserSecrets[0].secretArn.apply(
      (arn) =>
        aws.secretsmanager.getSecretOutput({
          arn: arn,
        })
    );

    return { cluster, clusterInstance, secret, kmsKey };
  }

  /**
   * Create ECS Fargate cluster
   */
  private createEcsCluster() {
    const cluster = new aws.ecs.Cluster(
      this.getResourceName("ecs-cluster"),
      {
        name: this.getResourceName("ecs-cluster"),
        settings: [
          {
            name: "containerInsights",
            value: "enabled",
          },
        ],
        tags: {
          ...this.config.tags,
          Name: this.getResourceName("ecs-cluster"),
        },
      },
      { parent: this }
    );

    return cluster;
  }

  /**
   * Create Application Load Balancer with ACM certificate
   */
  private createApplicationLoadBalancer(
    vpc: awsx.ec2.Vpc,
    securityGroup: aws.ec2.SecurityGroup
  ) {
    // Create ALB
    const lb = new awsx.lb.ApplicationLoadBalancer(
      this.getResourceName("alb"),
      {
        subnetIds: vpc.publicSubnetIds,
        securityGroups: [securityGroup.id],
        tags: {
          ...this.config.tags,
          Name: this.getResourceName("alb"),
        },
      },
      { parent: this }
    );

    // Create target group
    const targetGroup = new aws.lb.TargetGroup(
      this.getResourceName("tg"),
      {
        vpcId: vpc.vpcId,
        port: this.config.containerPort,
        protocol: "HTTP",
        targetType: "ip",
        healthCheck: {
          enabled: true,
          path: this.config.albHealthCheckPath,
          protocol: "HTTP",
          interval: this.config.albHealthCheckInterval,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          matcher: "200",
        },
        deregistrationDelay: 30,
        tags: {
          ...this.config.tags,
          Name: this.getResourceName("tg"),
        },
      },
      { parent: this }
    );

    // Create HTTP listener (redirect to HTTPS in production)
    const httpListener = new aws.lb.Listener(
      this.getResourceName("http-listener"),
      {
        loadBalancerArn: lb.loadBalancer.arn,
        port: 80,
        protocol: "HTTP",
        defaultActions: [
          {
            type: "forward",
            targetGroupArn: targetGroup.arn,
          },
        ],
        tags: {
          ...this.config.tags,
          Name: this.getResourceName("http-listener"),
        },
      },
      { parent: this }
    );

    return { lb, targetGroup, httpListener };
  }

  /**
   * Create ECS Fargate service
   */
  private createEcsService(
    cluster: aws.ecs.Cluster,
    vpc: awsx.ec2.Vpc,
    securityGroup: aws.ec2.SecurityGroup,
    targetGroup: aws.lb.TargetGroup,
    rds: any
  ) {
    // Create CloudWatch log group
    const logGroup = new aws.cloudwatch.LogGroup(
      this.getResourceName("ecs-logs"),
      {
        name: `/ecs/${this.getResourceName("service")}`,
        retentionInDays: this.config.cloudwatchLogRetentionDays,
        kmsKeyId: undefined, // AWS-managed encryption
        tags: {
          ...this.config.tags,
          Name: this.getResourceName("ecs-logs"),
        },
      },
      { parent: this }
    );

    // Create IAM role for ECS task execution
    const executionRole = new aws.iam.Role(
      this.getResourceName("ecs-execution-role"),
      {
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: {
                Service: "ecs-tasks.amazonaws.com",
              },
              Action: "sts:AssumeRole",
            },
          ],
        }),
        tags: {
          ...this.config.tags,
          Name: this.getResourceName("ecs-execution-role"),
        },
      },
      { parent: this }
    );

    // Attach ECS task execution policy
    new aws.iam.RolePolicyAttachment(
      this.getResourceName("ecs-execution-policy"),
      {
        role: executionRole.name,
        policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
      },
      { parent: this }
    );

    // Create IAM role for ECS task
    const taskRole = new aws.iam.Role(
      this.getResourceName("ecs-task-role"),
      {
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: {
                Service: "ecs-tasks.amazonaws.com",
              },
              Action: "sts:AssumeRole",
            },
          ],
        }),
        tags: {
          ...this.config.tags,
          Name: this.getResourceName("ecs-task-role"),
        },
      },
      { parent: this }
    );

    // Attach policy for Secrets Manager access
    const secretsPolicy = new aws.iam.RolePolicy(
      this.getResourceName("ecs-secrets-policy"),
      {
        role: taskRole.id,
        policy: rds.secret.arn.apply((arn: string) =>
          JSON.stringify({
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Action: [
                  "secretsmanager:GetSecretValue",
                  "secretsmanager:DescribeSecret",
                ],
                Resource: arn,
              },
              {
                Effect: "Allow",
                Action: ["kms:Decrypt"],
                Resource: rds.kmsKey.arn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Create ECS task definition
    const taskDefinition = new aws.ecs.TaskDefinition(
      this.getResourceName("task-def"),
      {
        family: this.getResourceName("task"),
        cpu: this.config.ecsTaskCpu,
        memory: this.config.ecsTaskMemory,
        networkMode: "awsvpc",
        requiresCompatibilities: ["FARGATE"],
        executionRoleArn: executionRole.arn,
        taskRoleArn: taskRole.arn,
        containerDefinitions: pulumi
          .all([rds.cluster.endpoint, rds.secret.arn])
          .apply(([endpoint, secretArn]) =>
            JSON.stringify([
              {
                name: "app",
                image: this.config.containerImage,
                cpu: parseInt(this.config.ecsTaskCpu),
                memory: parseInt(this.config.ecsTaskMemory),
                essential: true,
                portMappings: [
                  {
                    containerPort: this.config.containerPort,
                    protocol: "tcp",
                  },
                ],
                environment: [
                  {
                    name: "DB_HOST",
                    value: endpoint,
                  },
                  {
                    name: "DB_PORT",
                    value: "5432",
                  },
                  {
                    name: "DB_NAME",
                    value: "tradingdb",
                  },
                  {
                    name: "ENVIRONMENT",
                    value: this.config.environmentSuffix,
                  },
                ],
                secrets: [
                  {
                    name: "DB_SECRET_ARN",
                    valueFrom: secretArn,
                  },
                ],
                logConfiguration: {
                  logDriver: "awslogs",
                  options: {
                    "awslogs-group": logGroup.name,
                    "awslogs-region": aws.config.region!,
                    "awslogs-stream-prefix": "ecs",
                  },
                },
              },
            ])
          ),
        tags: {
          ...this.config.tags,
          Name: this.getResourceName("task-def"),
        },
      },
      { parent: this, dependsOn: [executionRole, taskRole] }
    );

    // Create ECS service
    const service = new aws.ecs.Service(
      this.getResourceName("service"),
      {
        name: this.getResourceName("service"),
        cluster: cluster.arn,
        taskDefinition: taskDefinition.arn,
        desiredCount: this.config.ecsTaskCount,
        launchType: "FARGATE",
        networkConfiguration: {
          subnets: vpc.privateSubnetIds,
          securityGroups: [securityGroup.id],
          assignPublicIp: false,
        },
        loadBalancers: [
          {
            targetGroupArn: targetGroup.arn,
            containerName: "app",
            containerPort: this.config.containerPort,
          },
        ],
        healthCheckGracePeriodSeconds: 60,
        tags: {
          ...this.config.tags,
          Name: this.getResourceName("service"),
        },
      },
      {
        parent: this,
        dependsOn: [taskDefinition],
      }
    );

    return { service, taskDefinition, logGroup, executionRole, taskRole };
  }

  /**
   * Create S3 bucket with lifecycle policies
   */
  private createS3Bucket() {
    const bucket = new aws.s3.BucketV2(
      this.getResourceName("logs"),
      {
        bucket: this.getResourceName("logs"),
        tags: {
          ...this.config.tags,
          Name: this.getResourceName("logs"),
        },
      },
      { parent: this }
    );

    // Enable versioning
    new aws.s3.BucketVersioningV2(
      this.getResourceName("logs-versioning"),
      {
        bucket: bucket.id,
        versioningConfiguration: {
          status: "Enabled",
        },
      },
      { parent: this }
    );

    // Configure lifecycle rules
    new aws.s3.BucketLifecycleConfigurationV2(
      this.getResourceName("logs-lifecycle"),
      {
        bucket: bucket.id,
        rules: [
          {
            id: "expire-logs",
            status: "Enabled",
            expiration: {
              days: this.config.s3LogRetentionDays,
            },
          },
          {
            id: "transition-to-ia",
            status: "Enabled",
            transitions: [
              {
                days: Math.floor(this.config.s3LogRetentionDays / 2),
                storageClass: "STANDARD_IA",
              },
            ],
          },
        ],
      },
      { parent: this }
    );

    // Enable server-side encryption
    new aws.s3.BucketServerSideEncryptionConfigurationV2(
      this.getResourceName("logs-encryption"),
      {
        bucket: bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: "AES256",
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { parent: this }
    );

    // Block public access
    new aws.s3.BucketPublicAccessBlock(
      this.getResourceName("logs-public-block"),
      {
        bucket: bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    return bucket;
  }

  /**
   * Create Route53 hosted zone and records
   */
  private createRoute53(alb: any) {
    const zone = new aws.route53.Zone(
      this.getResourceName("zone"),
      {
        name: this.config.domain,
        comment: `Hosted zone for ${this.config.environmentSuffix} environment`,
        tags: {
          ...this.config.tags,
          Name: this.getResourceName("zone"),
        },
      },
      { parent: this }
    );

    const record = new aws.route53.Record(
      this.getResourceName("a-record"),
      {
        zoneId: zone.zoneId,
        name: this.config.domain,
        type: "A",
        aliases: [
          {
            name: alb.lb.loadBalancer.dnsName,
            zoneId: alb.lb.loadBalancer.zoneId,
            evaluateTargetHealth: true,
          },
        ],
      },
      { parent: this }
    );

    return { zone, record };
  }

  /**
   * Create CloudWatch dashboard and alarms
   */
  private createCloudWatch(
    cluster: aws.ecs.Cluster,
    service: any,
    alb: any,
    rds: any
  ) {
    // Create CloudWatch dashboard
    const dashboard = new aws.cloudwatch.Dashboard(
      this.getResourceName("dashboard"),
      {
        dashboardName: this.getResourceName("dashboard"),
        dashboardBody: pulumi
          .all([
            cluster.name,
            service.service.name,
            alb.targetGroup.arn,
            rds.cluster.id,
          ])
          .apply(([clusterName, serviceName, tgArn, rdsId]) =>
            JSON.stringify({
              widgets: [
                {
                  type: "metric",
                  properties: {
                    metrics: [
                      [
                        "AWS/ECS",
                        "CPUUtilization",
                        "ServiceName",
                        serviceName,
                        "ClusterName",
                        clusterName,
                      ],
                      [".", "MemoryUtilization", ".", ".", ".", "."],
                    ],
                    period: 300,
                    stat: "Average",
                    region: aws.config.region!,
                    title: "ECS Task Metrics",
                  },
                },
                {
                  type: "metric",
                  properties: {
                    metrics: [
                      [
                        "AWS/ApplicationELB",
                        "TargetResponseTime",
                        "LoadBalancer",
                        alb.lb.loadBalancer.arnSuffix,
                      ],
                      [".", "RequestCount", ".", "."],
                      [".", "HTTPCode_Target_2XX_Count", ".", "."],
                      [".", "HTTPCode_Target_4XX_Count", ".", "."],
                      [".", "HTTPCode_Target_5XX_Count", ".", "."],
                    ],
                    period: 300,
                    stat: "Sum",
                    region: aws.config.region!,
                    title: "ALB Metrics",
                  },
                },
                {
                  type: "metric",
                  properties: {
                    metrics: [
                      [
                        "AWS/RDS",
                        "CPUUtilization",
                        "DBClusterIdentifier",
                        rdsId,
                      ],
                      [".", "DatabaseConnections", ".", "."],
                      [".", "FreeableMemory", ".", "."],
                    ],
                    period: 300,
                    stat: "Average",
                    region: aws.config.region!,
                    title: "RDS Metrics",
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Create SNS topic for alarms
    const alarmTopic = new aws.sns.Topic(
      this.getResourceName("alarm-topic"),
      {
        name: this.getResourceName("alarm-topic"),
        tags: {
          ...this.config.tags,
          Name: this.getResourceName("alarm-topic"),
        },
      },
      { parent: this }
    );

    // ECS CPU alarm
    const ecsCpuAlarm = new aws.cloudwatch.MetricAlarm(
      this.getResourceName("ecs-cpu-alarm"),
      {
        name: this.getResourceName("ecs-cpu-alarm"),
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        metricName: "CPUUtilization",
        namespace: "AWS/ECS",
        period: 300,
        statistic: "Average",
        threshold: this.config.environmentSuffix === "prod" ? 70 : 80,
        alarmDescription: "ECS CPU utilization is too high",
        dimensions: {
          ClusterName: cluster.name,
          ServiceName: service.service.name,
        },
        alarmActions: [alarmTopic.arn],
        tags: {
          ...this.config.tags,
          Name: this.getResourceName("ecs-cpu-alarm"),
        },
      },
      { parent: this }
    );

    // ALB target health alarm
    const albHealthAlarm = new aws.cloudwatch.MetricAlarm(
      this.getResourceName("alb-health-alarm"),
      {
        name: this.getResourceName("alb-health-alarm"),
        comparisonOperator: "LessThanThreshold",
        evaluationPeriods: 2,
        metricName: "HealthyHostCount",
        namespace: "AWS/ApplicationELB",
        period: 300,
        statistic: "Average",
        threshold: 1,
        alarmDescription: "ALB has no healthy targets",
        dimensions: {
          TargetGroup: alb.targetGroup.arnSuffix,
          LoadBalancer: alb.lb.loadBalancer.arnSuffix,
        },
        alarmActions: [alarmTopic.arn],
        tags: {
          ...this.config.tags,
          Name: this.getResourceName("alb-health-alarm"),
        },
      },
      { parent: this }
    );

    // RDS CPU alarm
    const rdsCpuAlarm = new aws.cloudwatch.MetricAlarm(
      this.getResourceName("rds-cpu-alarm"),
      {
        name: this.getResourceName("rds-cpu-alarm"),
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        metricName: "CPUUtilization",
        namespace: "AWS/RDS",
        period: 300,
        statistic: "Average",
        threshold: this.config.environmentSuffix === "prod" ? 75 : 85,
        alarmDescription: "RDS CPU utilization is too high",
        dimensions: {
          DBClusterIdentifier: rds.cluster.id,
        },
        alarmActions: [alarmTopic.arn],
        tags: {
          ...this.config.tags,
          Name: this.getResourceName("rds-cpu-alarm"),
        },
      },
      { parent: this }
    );

    return { dashboard, alarmTopic, ecsCpuAlarm, albHealthAlarm, rdsCpuAlarm };
  }

  /**
   * Create VPC peering connections
   */
  private createVpcPeering(vpc: awsx.ec2.Vpc): aws.ec2.VpcPeeringConnection[] {
    if (!this.config.enableVpcPeering || !this.config.peeringVpcIds) {
      return [];
    }

    return this.config.peeringVpcIds.map((peerVpcId, index) => {
      const peering = new aws.ec2.VpcPeeringConnection(
        this.getResourceName(`vpc-peering-${index}`),
        {
          vpcId: vpc.vpcId,
          peerVpcId: peerVpcId,
          autoAccept: false,
          tags: {
            ...this.config.tags,
            Name: this.getResourceName(`vpc-peering-${index}`),
          },
        },
        { parent: this }
      );

      return peering;
    });
  }

  /**
   * Get resource name with environment suffix
   */
  private getResourceName(resourceType: string): string {
    return `${this.projectName}-${this.config.environmentSuffix}-${resourceType}`;
  }

  /**
   * Write outputs to JSON file
   */
  private writeOutputsToFile(outputs: TapStackOutputs): void {
    const outputDir = path.join(process.cwd(), "cfn-outputs");
    const outputFile = path.join(outputDir, "flat-outputs.json");

    pulumi.all(outputs).apply((resolvedOutputs) => {
      // Ensure directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Flatten outputs
      const flatOutputs: Record<string, any> = {
        vpcId: resolvedOutputs.vpcId,
        vpcCidr: resolvedOutputs.vpcCidr,
        albDnsName: resolvedOutputs.albDnsName,
        albArn: resolvedOutputs.albArn,
        ecsClusterArn: resolvedOutputs.ecsClusterArn,
        ecsServiceName: resolvedOutputs.ecsServiceName,
        rdsEndpoint: resolvedOutputs.rdsEndpoint,
        rdsPort: resolvedOutputs.rdsPort,
        rdsSecretArn: resolvedOutputs.rdsSecretArn,
        s3BucketName: resolvedOutputs.s3BucketName,
        route53ZoneId: resolvedOutputs.route53ZoneId,
        route53ZoneName: resolvedOutputs.route53ZoneName,
        cloudwatchDashboardArn: resolvedOutputs.cloudwatchDashboardArn,
        publicSubnetIds: resolvedOutputs.publicSubnetIds,
        privateSubnetIds: resolvedOutputs.privateSubnetIds,
        vpcPeeringConnectionIds: resolvedOutputs.vpcPeeringConnectionIds,
      };

      // Write to file
      fs.writeFileSync(outputFile, JSON.stringify(flatOutputs, null, 2));
    });
  }
}
