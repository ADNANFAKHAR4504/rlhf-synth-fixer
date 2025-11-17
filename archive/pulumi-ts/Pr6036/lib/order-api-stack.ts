/**
 * Order Processing API Infrastructure - Pulumi Component Resource
 *
 * This module defines the OrderApiStack class that encapsulates all infrastructure
 * for a production-grade containerized order processing API with ECS Fargate,
 * Aurora MySQL, blue-green deployment support, comprehensive monitoring, and security controls.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * Configuration arguments for the OrderApiStack
 */
export interface OrderApiStackArgs {
  /**
   * Environment suffix for resource naming (e.g., 'dev', 'prod', 'test')
   */
  environmentSuffix: string;
}

/**
 * OrderApiStack - Complete infrastructure for Order Processing API
 */
export class OrderApiStack extends pulumi.ComponentResource {
  // Network resources
  public readonly vpc: awsx.ec2.Vpc;

  // Security Groups
  public readonly albSecurityGroup: aws.ec2.SecurityGroup;
  public readonly ecsSecurityGroup: aws.ec2.SecurityGroup;
  public readonly rdsSecurityGroup: aws.ec2.SecurityGroup;

  // Database resources
  public readonly dbPassword: aws.secretsmanager.Secret;
  public readonly dbPasswordRandom: aws.secretsmanager.SecretVersion;
  public readonly dbSubnetGroup: aws.rds.SubnetGroup;
  public readonly auroraCluster: aws.rds.Cluster;

  // Application configuration
  public readonly apiConfigParam: aws.ssm.Parameter;

  // Container resources
  public readonly ecrRepo: aws.ecr.Repository;
  public readonly ecsCluster: aws.ecs.Cluster;
  public readonly logGroup: aws.cloudwatch.LogGroup;

  // IAM resources
  public readonly ecsTaskExecutionRole: aws.iam.Role;
  public readonly ecsTaskRole: aws.iam.Role;

  // Task definition and service
  public readonly taskDefinition: aws.ecs.TaskDefinition;
  public readonly alb: aws.lb.LoadBalancer;
  public readonly targetGroupBlue: aws.lb.TargetGroup;
  public readonly targetGroupGreen: aws.lb.TargetGroup;
  public readonly albListener: aws.lb.Listener;
  public readonly ecsService: aws.ecs.Service;

  // Auto-scaling
  public readonly autoScalingTarget: aws.appautoscaling.Target;

  // WAF
  public readonly wafWebAcl: aws.wafv2.WebAcl;

  // CloudWatch
  public readonly dashboard: aws.cloudwatch.Dashboard;

  // Stack outputs
  public readonly vpcId: pulumi.Output<string>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly ecsServiceArn: pulumi.Output<string>;
  public readonly rdsClusterEndpoint: pulumi.Output<string>;
  public readonly rdsReaderEndpoint: pulumi.Output<string>;
  public readonly ecrRepositoryUrl: pulumi.Output<string>;
  public readonly wafWebAclArn: pulumi.Output<string>;
  public readonly blueTargetGroupArn: pulumi.Output<string>;
  public readonly greenTargetGroupArn: pulumi.Output<string>;
  public readonly dashboardUrl: pulumi.Output<string>;

  constructor(name: string, args: OrderApiStackArgs, opts?: ResourceOptions) {
    super('custom:infrastructure:OrderApiStack', name, {}, opts);

    const environmentSuffix = args.environmentSuffix;
    const region = 'us-east-1';

    const resourceOptions: ResourceOptions = { parent: this };

    // VPC Configuration - 3 AZs with public and private subnets
    this.vpc = new awsx.ec2.Vpc(
      `order-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        numberOfAvailabilityZones: 3,
        subnetSpecs: [
          {
            type: awsx.ec2.SubnetType.Public,
            name: `public-${environmentSuffix}`,
            cidrMask: 24,
          },
          {
            type: awsx.ec2.SubnetType.Private,
            name: `private-${environmentSuffix}`,
            cidrMask: 24,
          },
        ],
        natGateways: {
          strategy: awsx.ec2.NatGatewayStrategy.OnePerAz,
        },
        tags: {
          Name: `order-vpc-${environmentSuffix}`,
          Environment: environmentSuffix,
          Project: 'order-api',
        },
      },
      resourceOptions
    );

    // Security Group for ALB
    this.albSecurityGroup = new aws.ec2.SecurityGroup(
      `alb-sg-${environmentSuffix}`,
      {
        vpcId: this.vpc.vpcId,
        description: 'Security group for Application Load Balancer',
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
          Name: `alb-sg-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      resourceOptions
    );

    // Security Group for ECS Tasks
    this.ecsSecurityGroup = new aws.ec2.SecurityGroup(
      `ecs-sg-${environmentSuffix}`,
      {
        vpcId: this.vpc.vpcId,
        description: 'Security group for ECS tasks',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [this.albSecurityGroup.id],
            description: 'Allow traffic from ALB',
          },
          {
            protocol: 'tcp',
            fromPort: 8080,
            toPort: 8080,
            securityGroups: [this.albSecurityGroup.id],
            description: 'Allow container port from ALB',
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
          Name: `ecs-sg-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      resourceOptions
    );

    // Security Group for RDS
    this.rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `rds-sg-${environmentSuffix}`,
      {
        vpcId: this.vpc.vpcId,
        description: 'Security group for RDS Aurora cluster',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 3306,
            toPort: 3306,
            securityGroups: [this.ecsSecurityGroup.id],
            description: 'Allow MySQL from ECS tasks',
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
          Name: `rds-sg-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      resourceOptions
    );

    // Database Subnet Group
    this.dbSubnetGroup = new aws.rds.SubnetGroup(
      `db-subnet-group-${environmentSuffix}`,
      {
        subnetIds: this.vpc.privateSubnetIds,
        tags: {
          Name: `db-subnet-group-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      resourceOptions
    );

    // Database Password in Secrets Manager
    this.dbPassword = new aws.secretsmanager.Secret(
      `db-password-${environmentSuffix}`,
      {
        name: `order-api-db-password-${environmentSuffix}`,
        description: 'Database password for Order API Aurora cluster',
        tags: {
          Name: `db-password-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      resourceOptions
    );

    // Generate a random password using Pulumi Random provider
    this.dbPasswordRandom = new aws.secretsmanager.SecretVersion(
      `db-password-version-${environmentSuffix}`,
      {
        secretId: this.dbPassword.id,
        secretString: pulumi
          .output(
            aws.secretsmanager.getRandomPassword({
              passwordLength: 32,
              excludeCharacters: '"@/\\',
              excludePunctuation: true,
            })
          )
          .apply(pwd =>
            JSON.stringify({
              username: 'admin',
              password: pwd.randomPassword,
            })
          ),
      },
      resourceOptions
    );

    // RDS Aurora MySQL Cluster
    this.auroraCluster = new aws.rds.Cluster(
      `aurora-cluster-${environmentSuffix}`,
      {
        clusterIdentifier: `order-api-${environmentSuffix}`,
        engine: 'aurora-mysql',
        engineVersion: '8.0.mysql_aurora.3.04.0',
        databaseName: 'orderdb',
        masterUsername: 'admin',
        masterPassword: this.dbPasswordRandom.secretString.apply(
          s => JSON.parse(s!).password
        ),
        dbSubnetGroupName: this.dbSubnetGroup.name,
        vpcSecurityGroupIds: [this.rdsSecurityGroup.id],
        backupRetentionPeriod: 7,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'mon:04:00-mon:05:00',
        skipFinalSnapshot: true,
        storageEncrypted: true,
        enabledCloudwatchLogsExports: [
          'audit',
          'error',
          'general',
          'slowquery',
        ],
        tags: {
          Name: `aurora-cluster-${environmentSuffix}`,
          Environment: environmentSuffix,
          Project: 'order-api',
        },
      },
      resourceOptions
    );

    // Aurora Cluster Instances (writer + reader)
    new aws.rds.ClusterInstance(
      `aurora-writer-${environmentSuffix}`,
      {
        clusterIdentifier: this.auroraCluster.id,
        instanceClass: 'db.r6g.large',
        engine: 'aurora-mysql',
        engineVersion: '8.0.mysql_aurora.3.04.0',
        publiclyAccessible: false,
        tags: {
          Name: `aurora-writer-${environmentSuffix}`,
          Environment: environmentSuffix,
          Role: 'writer',
        },
      },
      resourceOptions
    );

    new aws.rds.ClusterInstance(
      `aurora-reader-${environmentSuffix}`,
      {
        clusterIdentifier: this.auroraCluster.id,
        instanceClass: 'db.r6g.large',
        engine: 'aurora-mysql',
        engineVersion: '8.0.mysql_aurora.3.04.0',
        publiclyAccessible: false,
        tags: {
          Name: `aurora-reader-${environmentSuffix}`,
          Environment: environmentSuffix,
          Role: 'reader',
        },
      },
      resourceOptions
    );

    // Parameter Store for Application Config
    this.apiConfigParam = new aws.ssm.Parameter(
      `api-config-${environmentSuffix}`,
      {
        name: `/order-api/${environmentSuffix}/config`,
        type: 'String',
        value: JSON.stringify({
          region: region,
          logLevel: 'info',
          maxConnections: 100,
        }),
        tags: {
          Name: `api-config-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      resourceOptions
    );

    // ECR Repository
    this.ecrRepo = new aws.ecr.Repository(
      `order-api-repo-${environmentSuffix}`,
      {
        name: `order-api-${environmentSuffix}`,
        imageTagMutability: 'MUTABLE',
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        tags: {
          Name: `order-api-repo-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      resourceOptions
    );

    // ECS Cluster with Container Insights
    this.ecsCluster = new aws.ecs.Cluster(
      `order-cluster-${environmentSuffix}`,
      {
        name: `order-api-${environmentSuffix}`,
        settings: [
          {
            name: 'containerInsights',
            value: 'enabled',
          },
        ],
        tags: {
          Name: `order-cluster-${environmentSuffix}`,
          Environment: environmentSuffix,
          Project: 'order-api',
        },
      },
      resourceOptions
    );

    // Fargate Capacity Providers
    new aws.ecs.ClusterCapacityProviders(
      `fargate-capacity-${environmentSuffix}`,
      {
        clusterName: this.ecsCluster.name,
        capacityProviders: ['FARGATE', 'FARGATE_SPOT'],
        defaultCapacityProviderStrategies: [
          {
            capacityProvider: 'FARGATE_SPOT',
            weight: 50,
            base: 0,
          },
          {
            capacityProvider: 'FARGATE',
            weight: 50,
            base: 1,
          },
        ],
      },
      resourceOptions
    );

    // IAM Role for ECS Task Execution
    this.ecsTaskExecutionRole = new aws.iam.Role(
      `ecs-task-exec-role-${environmentSuffix}`,
      {
        name: `ecs-task-exec-${environmentSuffix}`,
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
          Name: `ecs-task-exec-role-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      resourceOptions
    );

    new aws.iam.RolePolicyAttachment(
      `ecs-task-exec-policy-${environmentSuffix}`,
      {
        role: this.ecsTaskExecutionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      resourceOptions
    );

    // IAM Role for ECS Task
    this.ecsTaskRole = new aws.iam.Role(
      `ecs-task-role-${environmentSuffix}`,
      {
        name: `ecs-task-${environmentSuffix}`,
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
          Name: `ecs-task-role-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      resourceOptions
    );

    // IAM Policy for Task to Access Secrets and Parameters
    new aws.iam.RolePolicy(
      `task-policy-${environmentSuffix}`,
      {
        role: this.ecsTaskRole.id,
        policy: pulumi
          .all([this.dbPassword.arn, this.apiConfigParam.arn])
          .apply(([secretArn, paramArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'secretsmanager:GetSecretValue',
                    'secretsmanager:DescribeSecret',
                  ],
                  Resource: secretArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['ssm:GetParameter', 'ssm:GetParameters'],
                  Resource: paramArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['cloudwatch:PutMetricData'],
                  Resource: '*',
                },
              ],
            })
          ),
      },
      resourceOptions
    );

    // CloudWatch Log Group
    this.logGroup = new aws.cloudwatch.LogGroup(
      `ecs-log-group-${environmentSuffix}`,
      {
        name: `/ecs/order-api-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          Name: `ecs-log-group-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      resourceOptions
    );

    // ECS Task Definition
    this.taskDefinition = new aws.ecs.TaskDefinition(
      `order-api-task-${environmentSuffix}`,
      {
        family: `order-api-${environmentSuffix}`,
        cpu: '512',
        memory: '1024',
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        executionRoleArn: this.ecsTaskExecutionRole.arn,
        taskRoleArn: this.ecsTaskRole.arn,
        containerDefinitions: pulumi
          .all([
            this.ecrRepo.repositoryUrl,
            this.dbPassword.arn,
            this.auroraCluster.endpoint,
            this.apiConfigParam.name,
            this.logGroup.name,
          ])
          .apply(([repoUrl, secretArn, dbEndpoint, paramName, logGroupName]) =>
            JSON.stringify([
              {
                name: 'order-api',
                image: `${repoUrl}:latest`,
                cpu: 512,
                memory: 1024,
                essential: true,
                portMappings: [
                  {
                    containerPort: 8080,
                    protocol: 'tcp',
                  },
                ],
                environment: [
                  {
                    name: 'DB_ENDPOINT',
                    value: dbEndpoint,
                  },
                  {
                    name: 'DB_NAME',
                    value: 'orderdb',
                  },
                  {
                    name: 'REGION',
                    value: region,
                  },
                  {
                    name: 'CONFIG_PARAM',
                    value: paramName,
                  },
                ],
                secrets: [
                  {
                    name: 'DB_CREDENTIALS',
                    valueFrom: secretArn,
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
                healthCheck: {
                  command: [
                    'CMD-SHELL',
                    'curl -f http://localhost:8080/health || exit 1',
                  ],
                  interval: 30,
                  timeout: 5,
                  retries: 3,
                  startPeriod: 60,
                },
              },
            ])
          ),
        tags: {
          Name: `order-api-task-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      resourceOptions
    );

    // Application Load Balancer
    this.alb = new aws.lb.LoadBalancer(
      `order-alb-${environmentSuffix}`,
      {
        name: `order-api-${environmentSuffix}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [this.albSecurityGroup.id],
        subnets: this.vpc.publicSubnetIds,
        enableDeletionProtection: false,
        enableHttp2: true,
        tags: {
          Name: `order-alb-${environmentSuffix}`,
          Environment: environmentSuffix,
          Project: 'order-api',
        },
      },
      resourceOptions
    );

    // Target Group Blue
    this.targetGroupBlue = new aws.lb.TargetGroup(
      `tg-blue-${environmentSuffix}`,
      {
        name: `order-blue-${environmentSuffix}`,
        port: 8080,
        protocol: 'HTTP',
        vpcId: this.vpc.vpcId,
        targetType: 'ip',
        deregistrationDelay: 30,
        healthCheck: {
          enabled: true,
          path: '/health',
          protocol: 'HTTP',
          port: '8080',
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          timeout: 5,
          interval: 30,
          matcher: '200',
        },
        tags: {
          Name: `tg-blue-${environmentSuffix}`,
          Environment: environmentSuffix,
          Deployment: 'blue',
        },
      },
      resourceOptions
    );

    // Target Group Green
    this.targetGroupGreen = new aws.lb.TargetGroup(
      `tg-green-${environmentSuffix}`,
      {
        name: `order-green-${environmentSuffix}`,
        port: 8080,
        protocol: 'HTTP',
        vpcId: this.vpc.vpcId,
        targetType: 'ip',
        deregistrationDelay: 30,
        healthCheck: {
          enabled: true,
          path: '/health',
          protocol: 'HTTP',
          port: '8080',
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          timeout: 5,
          interval: 30,
          matcher: '200',
        },
        tags: {
          Name: `tg-green-${environmentSuffix}`,
          Environment: environmentSuffix,
          Deployment: 'green',
        },
      },
      resourceOptions
    );

    // ALB Listener HTTP
    this.albListener = new aws.lb.Listener(
      `alb-listener-${environmentSuffix}`,
      {
        loadBalancerArn: this.alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: this.targetGroupBlue.arn,
          },
        ],
        tags: {
          Name: `alb-listener-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      resourceOptions
    );

    // ECS Service
    this.ecsService = new aws.ecs.Service(
      `order-service-${environmentSuffix}`,
      {
        name: `order-api-${environmentSuffix}`,
        cluster: this.ecsCluster.arn,
        taskDefinition: this.taskDefinition.arn,
        desiredCount: 3,
        launchType: undefined,
        capacityProviderStrategies: [
          {
            capacityProvider: 'FARGATE_SPOT',
            weight: 50,
            base: 0,
          },
          {
            capacityProvider: 'FARGATE',
            weight: 50,
            base: 1,
          },
        ],
        networkConfiguration: {
          subnets: this.vpc.privateSubnetIds,
          securityGroups: [this.ecsSecurityGroup.id],
          assignPublicIp: false,
        },
        loadBalancers: [
          {
            targetGroupArn: this.targetGroupBlue.arn,
            containerName: 'order-api',
            containerPort: 8080,
          },
        ],
        healthCheckGracePeriodSeconds: 60,
        enableExecuteCommand: true,
        tags: {
          Name: `order-service-${environmentSuffix}`,
          Environment: environmentSuffix,
          Project: 'order-api',
        },
      },
      { ...resourceOptions, dependsOn: [this.albListener] }
    );

    // Auto Scaling Target
    this.autoScalingTarget = new aws.appautoscaling.Target(
      `ecs-target-${environmentSuffix}`,
      {
        maxCapacity: 10,
        minCapacity: 3,
        resourceId: pulumi.interpolate`service/${this.ecsCluster.name}/${this.ecsService.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        serviceNamespace: 'ecs',
      },
      resourceOptions
    );

    // Auto Scaling Policy - CPU Based
    new aws.appautoscaling.Policy(
      `cpu-scaling-${environmentSuffix}`,
      {
        name: `cpu-scaling-${environmentSuffix}`,
        policyType: 'TargetTrackingScaling',
        resourceId: this.autoScalingTarget.resourceId,
        scalableDimension: this.autoScalingTarget.scalableDimension,
        serviceNamespace: this.autoScalingTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          targetValue: 70.0,
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          scaleInCooldown: 300,
          scaleOutCooldown: 60,
        },
      },
      resourceOptions
    );

    // Custom CloudWatch Metric for Pending Orders
    new aws.cloudwatch.LogMetricFilter(
      `pending-orders-${environmentSuffix}`,
      {
        name: `pending-orders-${environmentSuffix}`,
        logGroupName: this.logGroup.name,
        pattern: '[time, request_id, level=INFO, msg="Pending*", count]',
        metricTransformation: {
          name: 'PendingOrders',
          namespace: `OrderAPI/${environmentSuffix}`,
          value: '$count',
        },
      },
      resourceOptions
    );

    // Auto Scaling Policy - Custom Metric Based
    new aws.appautoscaling.Policy(
      `custom-scaling-${environmentSuffix}`,
      {
        name: `pending-orders-scaling-${environmentSuffix}`,
        policyType: 'TargetTrackingScaling',
        resourceId: this.autoScalingTarget.resourceId,
        scalableDimension: this.autoScalingTarget.scalableDimension,
        serviceNamespace: this.autoScalingTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          targetValue: 100.0,
          customizedMetricSpecification: {
            metricName: 'PendingOrders',
            namespace: `OrderAPI/${environmentSuffix}`,
            statistic: 'Average',
          },
          scaleInCooldown: 300,
          scaleOutCooldown: 60,
        },
      },
      resourceOptions
    );

    // AWS WAF Web ACL
    this.wafWebAcl = new aws.wafv2.WebAcl(
      `waf-acl-${environmentSuffix}`,
      {
        name: `order-api-waf-${environmentSuffix}`,
        scope: 'REGIONAL',
        defaultAction: {
          allow: {},
        },
        rules: [
          {
            name: 'RateLimitRule',
            priority: 1,
            action: {
              block: {},
            },
            statement: {
              rateBasedStatement: {
                limit: 100,
                aggregateKeyType: 'IP',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudwatchMetricsEnabled: true,
              metricName: `RateLimit-${environmentSuffix}`,
            },
          },
        ],
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudwatchMetricsEnabled: true,
          metricName: `OrderAPIWAF-${environmentSuffix}`,
        },
        tags: {
          Name: `waf-acl-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      resourceOptions
    );

    // Associate WAF with ALB
    new aws.wafv2.WebAclAssociation(
      `waf-association-${environmentSuffix}`,
      {
        resourceArn: this.alb.arn,
        webAclArn: this.wafWebAcl.arn,
      },
      resourceOptions
    );

    // CloudWatch Dashboard
    this.dashboard = new aws.cloudwatch.Dashboard(
      `order-dashboard-${environmentSuffix}`,
      {
        dashboardName: `order-api-${environmentSuffix}`,
        dashboardBody: pulumi
          .all([
            this.ecsCluster.name,
            this.ecsService.name,
            this.auroraCluster.clusterIdentifier,
            this.alb.arnSuffix,
            this.targetGroupBlue.arnSuffix,
          ])
          .apply(
            ([_clusterName, _serviceName, _dbClusterId, _albArn, _tgArn]) =>
              JSON.stringify({
                widgets: [
                  {
                    type: 'metric',
                    properties: {
                      metrics: [
                        [
                          'AWS/ECS',
                          'CPUUtilization',
                          { stat: 'Average', label: 'CPU Utilization' },
                        ],
                        [
                          '.',
                          'MemoryUtilization',
                          { stat: 'Average', label: 'Memory Utilization' },
                        ],
                      ],
                      period: 300,
                      stat: 'Average',
                      region: region,
                      title: 'ECS Service Metrics',
                      yAxis: {
                        left: {
                          min: 0,
                          max: 100,
                        },
                      },
                    },
                  },
                  {
                    type: 'metric',
                    properties: {
                      metrics: [
                        [
                          'AWS/ApplicationELB',
                          'TargetResponseTime',
                          { stat: 'Average', label: 'Response Time' },
                        ],
                        [
                          '.',
                          'RequestCount',
                          { stat: 'Sum', label: 'Request Count' },
                        ],
                      ],
                      period: 300,
                      stat: 'Average',
                      region: region,
                      title: 'ALB Metrics',
                    },
                  },
                  {
                    type: 'metric',
                    properties: {
                      metrics: [
                        [
                          'AWS/RDS',
                          'DatabaseConnections',
                          { stat: 'Average', label: 'DB Connections' },
                        ],
                        [
                          '.',
                          'CPUUtilization',
                          { stat: 'Average', label: 'DB CPU' },
                        ],
                      ],
                      period: 300,
                      stat: 'Average',
                      region: region,
                      title: 'RDS Metrics',
                    },
                  },
                  {
                    type: 'metric',
                    properties: {
                      metrics: [
                        [
                          `OrderAPI/${environmentSuffix}`,
                          'PendingOrders',
                          { stat: 'Average', label: 'Pending Orders' },
                        ],
                      ],
                      period: 300,
                      stat: 'Average',
                      region: region,
                      title: 'Custom Application Metrics',
                    },
                  },
                ],
              })
          ),
      },
      resourceOptions
    );

    // CloudWatch Alarm - High Error Rate
    new aws.cloudwatch.MetricAlarm(
      `high-error-alarm-${environmentSuffix}`,
      {
        name: `order-api-high-errors-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'HTTPCode_Target_5XX_Count',
        namespace: 'AWS/ApplicationELB',
        period: 300,
        statistic: 'Sum',
        threshold: 10,
        alarmDescription: 'Triggers when target 5XX errors exceed threshold',
        dimensions: {
          LoadBalancer: this.alb.arnSuffix,
          TargetGroup: this.targetGroupBlue.arnSuffix,
        },
        tags: {
          Name: `high-error-alarm-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      resourceOptions
    );

    // CloudWatch Alarm - Database Connection Failures
    new aws.cloudwatch.MetricAlarm(
      `db-connection-alarm-${environmentSuffix}`,
      {
        name: `order-api-db-failures-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'DatabaseConnections',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'Triggers when database connections are high',
        dimensions: {
          DBClusterIdentifier: this.auroraCluster.clusterIdentifier,
        },
        tags: {
          Name: `db-connection-alarm-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      resourceOptions
    );

    // Assign stack outputs
    this.vpcId = this.vpc.vpcId;
    this.albDnsName = this.alb.dnsName;
    this.ecsServiceArn = this.ecsService.id;
    this.rdsClusterEndpoint = this.auroraCluster.endpoint;
    this.rdsReaderEndpoint = this.auroraCluster.readerEndpoint;
    this.ecrRepositoryUrl = this.ecrRepo.repositoryUrl;
    this.wafWebAclArn = this.wafWebAcl.arn;
    this.blueTargetGroupArn = this.targetGroupBlue.arn;
    this.greenTargetGroupArn = this.targetGroupGreen.arn;
    this.dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=${region}#dashboards:name=${this.dashboard.dashboardName}`;

    // Register outputs
    this.registerOutputs({
      vpcId: this.vpcId,
      albDnsName: this.albDnsName,
      ecsServiceArn: this.ecsServiceArn,
      rdsClusterEndpoint: this.rdsClusterEndpoint,
      rdsReaderEndpoint: this.rdsReaderEndpoint,
      ecrRepositoryUrl: this.ecrRepositoryUrl,
      wafWebAclArn: this.wafWebAclArn,
      blueTargetGroupArn: this.blueTargetGroupArn,
      greenTargetGroupArn: this.greenTargetGroupArn,
      dashboardUrl: this.dashboardUrl,
    });
  }
}
