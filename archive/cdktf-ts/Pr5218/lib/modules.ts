import * as aws from '@cdktf/provider-aws';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { Fn } from 'cdktf';
import { Construct } from 'constructs';

export interface NetworkingModuleConfig {
  vpcCidr: string;
  environment: string;
  projectName: string;
}

export class NetworkingModule extends Construct {
  public readonly vpc: aws.vpc.Vpc;
  public readonly publicSubnets: aws.subnet.Subnet[];
  public readonly privateSubnets: aws.subnet.Subnet[];
  public readonly dbSubnetGroup: aws.dbSubnetGroup.DbSubnetGroup;
  public readonly internetGateway: aws.internetGateway.InternetGateway;
  public readonly natGateways: aws.natGateway.NatGateway[];

  constructor(scope: Construct, id: string, config: NetworkingModuleConfig) {
    super(scope, id);

    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // Create VPC with DNS support
    this.vpc = new aws.vpc.Vpc(this, 'vpc', {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${config.projectName}-${config.environment}-vpc`,
        Environment: config.environment,
      },
    });

    // Internet Gateway
    this.internetGateway = new aws.internetGateway.InternetGateway(
      this,
      'igw',
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `${config.projectName}-${config.environment}-igw`,
        },
      }
    );

    // Create public and private subnets across multiple AZs
    this.publicSubnets = [];
    this.privateSubnets = [];
    this.natGateways = [];

    for (let i = 0; i < 3; i++) {
      const publicSubnet = new aws.subnet.Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i * 2}.0/24`,
        availabilityZone: Fn.element(azs.names, i),
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${config.projectName}-${config.environment}-public-${i + 1}`,
          Type: 'Public',
        },
      });

      const privateSubnet = new aws.subnet.Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i * 2 + 1}.0/24`,
        availabilityZone: Fn.element(azs.names, i),
        tags: {
          Name: `${config.projectName}-${config.environment}-private-${i + 1}`,
          Type: 'Private',
        },
      });

      // Create EIP for NAT Gateway
      const eip = new aws.eip.Eip(this, `nat-eip-${i}`, {
        domain: 'vpc',
        tags: {
          Name: `${config.projectName}-${config.environment}-nat-eip-${i + 1}`,
        },
      });

      // Create NAT Gateway
      const natGateway = new aws.natGateway.NatGateway(
        this,
        `nat-gateway-${i}`,
        {
          allocationId: eip.id,
          subnetId: publicSubnet.id,
          tags: {
            Name: `${config.projectName}-${config.environment}-nat-${i + 1}`,
          },
        }
      );

      this.publicSubnets.push(publicSubnet);
      this.privateSubnets.push(privateSubnet);
      this.natGateways.push(natGateway);
    }

    // Public route table
    const publicRouteTable = new aws.routeTable.RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.projectName}-${config.environment}-public-rt`,
      },
    });

    new aws.route.Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `public-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        }
      );
    });

    // Private route tables and routes
    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new aws.routeTable.RouteTable(
        this,
        `private-rt-${index}`,
        {
          vpcId: this.vpc.id,
          tags: {
            Name: `${config.projectName}-${config.environment}-private-rt-${index + 1}`,
          },
        }
      );

      new aws.route.Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateways[index].id,
      });

      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `private-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        }
      );
    });

    // DB Subnet Group
    this.dbSubnetGroup = new aws.dbSubnetGroup.DbSubnetGroup(
      this,
      'db-subnet-group',
      {
        name: `${config.projectName}-${config.environment}-db-subnet`,
        subnetIds: this.privateSubnets.map(subnet => subnet.id),
        tags: {
          Name: `${config.projectName}-${config.environment}-db-subnet-group`,
        },
      }
    );
  }
}

export interface DatabaseModuleConfig {
  vpc: aws.vpc.Vpc;
  dbSubnetGroup: aws.dbSubnetGroup.DbSubnetGroup;
  environment: string;
  projectName: string;
  instanceClass: string;
  allocatedStorage: number;
  databaseName: string;
}

export class DatabaseModule extends Construct {
  public readonly rdsInstance: aws.dbInstance.DbInstance;
  public readonly secretsManager: aws.secretsmanagerSecret.SecretsmanagerSecret;
  public readonly securityGroup: aws.securityGroup.SecurityGroup;
  public readonly masterPasswordSsmParameter: string;

  constructor(scope: Construct, id: string, config: DatabaseModuleConfig) {
    super(scope, id);

    // Database security group
    this.securityGroup = new aws.securityGroup.SecurityGroup(this, 'db-sg', {
      name: `${config.projectName}-${config.environment}-db-sg`,
      vpcId: config.vpc.id,
      description: 'Security group for RDS database',
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: {
        Name: `${config.projectName}-${config.environment}-db-sg`,
      },
    });

    // Generate secure password
    const dbPassword = `TempPass${id}123!`;

    // Store credentials in Secrets Manager
    this.secretsManager = new aws.secretsmanagerSecret.SecretsmanagerSecret(
      this,
      'db-secret',
      {
        name: `${config.projectName}-${config.environment}-db-credentials`,
        description: 'RDS database credentials',
        tags: {
          Name: `${config.projectName}-${config.environment}-db-secret`,
        },
      }
    );

    new aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion(
      this,
      'db-secret-version',
      {
        secretId: this.secretsManager.id,
        secretString: JSON.stringify({
          username: 'dbadmin',
          password: dbPassword,
          engine: 'postgres',
          port: 5432,
          dbname: config.databaseName,
        }),
      }
    );

    // RDS Instance
    this.rdsInstance = new aws.dbInstance.DbInstance(this, 'rds', {
      identifier: `${config.projectName}-${config.environment}-db`,
      engine: 'postgres',
      instanceClass: config.instanceClass,
      allocatedStorage: config.allocatedStorage,
      storageType: 'gp3',
      storageEncrypted: true,
      dbName: config.databaseName,
      username: 'dbadmin',
      password: dbPassword,
      dbSubnetGroupName: config.dbSubnetGroup.name,
      vpcSecurityGroupIds: [this.securityGroup.id],
      skipFinalSnapshot: config.environment !== 'production',
      finalSnapshotIdentifier: `${config.projectName}-${config.environment}-final-snapshot-${Date.now()}`,
      backupRetentionPeriod: config.environment === 'production' ? 30 : 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      autoMinorVersionUpgrade: true,
      multiAz: config.environment === 'production',
      enabledCloudwatchLogsExports: ['postgresql'],
      deletionProtection: config.environment === 'production',
      tags: {
        Name: `${config.projectName}-${config.environment}-rds`,
        Environment: config.environment,
      },
    });
  }
}

export interface ContainerServiceModuleConfig {
  vpc: aws.vpc.Vpc;
  privateSubnets: aws.subnet.Subnet[];
  publicSubnets: aws.subnet.Subnet[];
  dbSecurityGroup: aws.securityGroup.SecurityGroup;
  dbSecret: aws.secretsmanagerSecret.SecretsmanagerSecret;
  environment: string;
  projectName: string;
  containerImage: string;
  containerPort: number;
  cpu: number;
  memory: number;
  desiredCount: number;
  minCapacity: number;
  maxCapacity: number;
  certificateArn?: string;
  domainName?: string;
  hostedZoneId?: string;
}

export class ContainerServiceModule extends Construct {
  public readonly cluster: aws.ecsCluster.EcsCluster;
  public readonly taskDefinition: aws.ecsTaskDefinition.EcsTaskDefinition;
  public readonly service: aws.ecsService.EcsService;
  public readonly alb: aws.lb.Lb;
  public readonly targetGroup: aws.lbTargetGroup.LbTargetGroup;
  public readonly albSecurityGroup: aws.securityGroup.SecurityGroup;
  public readonly taskSecurityGroup: aws.securityGroup.SecurityGroup;
  public readonly logGroup: aws.cloudwatchLogGroup.CloudwatchLogGroup;
  public readonly taskRole: aws.iamRole.IamRole;
  public readonly executionRole: aws.iamRole.IamRole;

  constructor(
    scope: Construct,
    id: string,
    config: ContainerServiceModuleConfig
  ) {
    super(scope, id);

    // CloudWatch Log Group
    this.logGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      'log-group',
      {
        name: `/aws/ecs/${config.projectName}-${config.environment}`,
        retentionInDays: config.environment === 'production' ? 30 : 7,
        tags: {
          Name: `${config.projectName}-${config.environment}-logs`,
        },
      }
    );

    // ECS Cluster
    this.cluster = new aws.ecsCluster.EcsCluster(this, 'cluster', {
      name: `${config.projectName}-${config.environment}-cluster`,
      setting: [
        {
          name: 'containerInsights',
          value: 'enabled',
        },
      ],
      tags: {
        Name: `${config.projectName}-${config.environment}-cluster`,
      },
    });

    // Task Execution Role
    this.executionRole = new aws.iamRole.IamRole(this, 'execution-role', {
      name: `${config.projectName}-${config.environment}-task-execution`,
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
    });

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'execution-role-policy',
      {
        role: this.executionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      }
    );

    // Task Role
    this.taskRole = new aws.iamRole.IamRole(this, 'task-role', {
      name: `${config.projectName}-${config.environment}-task`,
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
    });

    // Task Role Policies
    new aws.iamRolePolicy.IamRolePolicy(this, 'task-policy', {
      name: `${config.projectName}-${config.environment}-task-policy`,
      role: this.taskRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            Resource: config.dbSecret.arn,
          },
          {
            Effect: 'Allow',
            Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
            Resource: `${this.logGroup.arn}:*`,
          },
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            Resource: `arn:aws:s3:::${config.projectName}-${config.environment}-*/*`,
          },
        ],
      }),
    });

    // ALB Security Group
    this.albSecurityGroup = new aws.securityGroup.SecurityGroup(
      this,
      'alb-sg',
      {
        name: `${config.projectName}-${config.environment}-alb-sg`,
        vpcId: config.vpc.id,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP from anywhere',
          },
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS from anywhere',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          Name: `${config.projectName}-${config.environment}-alb-sg`,
        },
      }
    );

    // Task Security Group
    this.taskSecurityGroup = new aws.securityGroup.SecurityGroup(
      this,
      'task-sg',
      {
        name: `${config.projectName}-${config.environment}-task-sg`,
        vpcId: config.vpc.id,
        description: 'Security group for ECS tasks',
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          Name: `${config.projectName}-${config.environment}-task-sg`,
        },
      }
    );

    // Allow ALB to communicate with tasks
    new aws.securityGroupRule.SecurityGroupRule(this, 'alb-to-task', {
      type: 'ingress',
      fromPort: config.containerPort,
      toPort: config.containerPort,
      protocol: 'tcp',
      securityGroupId: this.taskSecurityGroup.id,
      sourceSecurityGroupId: this.albSecurityGroup.id,
      description: 'Allow ALB to reach ECS tasks',
    });

    // Allow tasks to communicate with RDS
    new aws.securityGroupRule.SecurityGroupRule(this, 'task-to-db', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      securityGroupId: config.dbSecurityGroup.id,
      sourceSecurityGroupId: this.taskSecurityGroup.id,
      description: 'Allow ECS tasks to reach RDS',
    });

    // Application Load Balancer
    this.alb = new aws.lb.Lb(this, 'alb', {
      name: `${config.projectName}-${config.environment}-alb`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [this.albSecurityGroup.id],
      subnets: config.publicSubnets.map(subnet => subnet.id),
      enableDeletionProtection: config.environment === 'production',
      enableHttp2: true,
      enableCrossZoneLoadBalancing: true,
      accessLogs: {
        bucket: '',
        enabled: false,
      },
      tags: {
        Name: `${config.projectName}-${config.environment}-alb`,
      },
    });

    // Target Group
    this.targetGroup = new aws.lbTargetGroup.LbTargetGroup(this, 'tg', {
      name: `${config.projectName}-${config.environment}-tg`,
      port: config.containerPort,
      protocol: 'HTTP',
      vpcId: config.vpc.id,
      targetType: 'ip',
      healthCheck: {
        enabled: true,
        path: '/health',
        protocol: 'HTTP',
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30,
        matcher: '200',
      },
      deregistrationDelay: '30',
      tags: {
        Name: `${config.projectName}-${config.environment}-tg`,
      },
    });

    // HTTP Listener
    new aws.lbListener.LbListener(this, 'http-listener', {
      loadBalancerArn: this.alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: config.certificateArn
        ? [
            {
              type: 'redirect',
              redirect: {
                port: '443',
                protocol: 'HTTPS',
                statusCode: 'HTTP_301',
              },
            },
          ]
        : [
            {
              type: 'forward',
              targetGroupArn: this.targetGroup.arn,
            },
          ],
    });

    // HTTPS Listener (if certificate provided)
    if (config.certificateArn) {
      new aws.lbListener.LbListener(this, 'https-listener', {
        loadBalancerArn: this.alb.arn,
        port: 443,
        protocol: 'HTTPS',
        sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
        certificateArn: config.certificateArn,
        defaultAction: [
          {
            type: 'forward',
            targetGroupArn: this.targetGroup.arn,
          },
        ],
      });
    }

    // Task Definition
    this.taskDefinition = new aws.ecsTaskDefinition.EcsTaskDefinition(
      this,
      'task-def',
      {
        family: `${config.projectName}-${config.environment}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: config.cpu.toString(),
        memory: config.memory.toString(),
        executionRoleArn: this.executionRole.arn,
        taskRoleArn: this.taskRole.arn,
        containerDefinitions: JSON.stringify([
          {
            name: `${config.projectName}-${config.environment}-container`,
            image: config.containerImage,
            cpu: config.cpu,
            memory: config.memory,
            essential: true,
            portMappings: [
              {
                containerPort: config.containerPort,
                protocol: 'tcp',
              },
            ],
            environment: [
              {
                name: 'PORT',
                value: config.containerPort.toString(),
              },
              {
                name: 'NODE_ENV',
                value: config.environment,
              },
            ],
            secrets: [
              {
                name: 'DB_CONNECTION',
                valueFrom: config.dbSecret.arn,
              },
            ],
            logConfiguration: {
              logDriver: 'awslogs',
              options: {
                'awslogs-group': this.logGroup.name,
                'awslogs-region': 'us-east-1',
                'awslogs-stream-prefix': 'ecs',
              },
            },
            healthCheck: {
              command: [
                'CMD-SHELL',
                `curl -f http://localhost:${config.containerPort}/health || exit 1`,
              ],
              interval: 30,
              timeout: 5,
              retries: 3,
              startPeriod: 60,
            },
          },
        ]),
      }
    );

    // ECS Service
    this.service = new aws.ecsService.EcsService(this, 'service', {
      name: `${config.projectName}-${config.environment}-service`,
      cluster: this.cluster.id,
      taskDefinition: this.taskDefinition.arn,
      desiredCount: config.desiredCount,
      launchType: 'FARGATE',
      networkConfiguration: {
        subnets: config.privateSubnets.map(subnet => subnet.id),
        securityGroups: [this.taskSecurityGroup.id],
        assignPublicIp: false,
      },
      loadBalancer: [
        {
          targetGroupArn: this.targetGroup.arn,
          containerName: `${config.projectName}-${config.environment}-container`,
          containerPort: config.containerPort,
        },
      ],
      healthCheckGracePeriodSeconds: 60,
      deploymentCircuitBreaker: {
        enable: true,
        rollback: true,
      },
      deploymentController: {
        type: 'ECS',
      },
      enableEcsManagedTags: true,
      propagateTags: 'TASK_DEFINITION',
      tags: {
        Name: `${config.projectName}-${config.environment}-service`,
      },
      dependsOn: [this.targetGroup],
    });

    // Auto Scaling
    const scalingTarget = new aws.appautoscalingTarget.AppautoscalingTarget(
      this,
      'scaling-target',
      {
        maxCapacity: config.maxCapacity,
        minCapacity: config.minCapacity,
        resourceId: `service/${this.cluster.name}/${this.service.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        serviceNamespace: 'ecs',
      }
    );

    // CPU Scaling Policy
    new aws.appautoscalingPolicy.AppautoscalingPolicy(this, 'cpu-scaling', {
      name: `${config.projectName}-${config.environment}-cpu-scaling`,
      policyType: 'TargetTrackingScaling',
      resourceId: scalingTarget.resourceId,
      scalableDimension: scalingTarget.scalableDimension,
      serviceNamespace: scalingTarget.serviceNamespace,
      targetTrackingScalingPolicyConfiguration: {
        predefinedMetricSpecification: {
          predefinedMetricType: 'ECSServiceAverageCPUUtilization',
        },
        targetValue: 70,
        scaleInCooldown: 300,
        scaleOutCooldown: 60,
      },
    });

    // Memory Scaling Policy
    new aws.appautoscalingPolicy.AppautoscalingPolicy(this, 'memory-scaling', {
      name: `${config.projectName}-${config.environment}-memory-scaling`,
      policyType: 'TargetTrackingScaling',
      resourceId: scalingTarget.resourceId,
      scalableDimension: scalingTarget.scalableDimension,
      serviceNamespace: scalingTarget.serviceNamespace,
      targetTrackingScalingPolicyConfiguration: {
        predefinedMetricSpecification: {
          predefinedMetricType: 'ECSServiceAverageMemoryUtilization',
        },
        targetValue: 80,
        scaleInCooldown: 300,
        scaleOutCooldown: 60,
      },
    });
  }
}

export interface StaticAssetsModuleConfig {
  environment: string;
  projectName: string;
}

export class StaticAssetsModule extends Construct {
  public readonly bucket: aws.s3Bucket.S3Bucket;
  public readonly bucketPolicy: aws.s3BucketPolicy.S3BucketPolicy;
  public readonly bucketPublicAccessBlock: aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock;

  constructor(scope: Construct, id: string, config: StaticAssetsModuleConfig) {
    super(scope, id);

    // S3 Bucket for static assets
    this.bucket = new aws.s3Bucket.S3Bucket(this, 'static-assets', {
      bucket: `${config.projectName}-${config.environment}-static-assets`,
      tags: {
        Name: `${config.projectName}-${config.environment}-static-assets`,
        Environment: config.environment,
      },
    });

    // Bucket versioning
    new aws.s3BucketVersioning.S3BucketVersioningA(this, 'versioning', {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Bucket encryption
    new aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
      this,
      'encryption',
      {
        bucket: this.bucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      }
    );

    // Public access block
    this.bucketPublicAccessBlock =
      new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
        this,
        'bucket-pab',
        {
          bucket: this.bucket.id,
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
        }
      );

    // Lifecycle policy
    new aws.s3BucketLifecycleConfiguration.S3BucketLifecycleConfiguration(
      this,
      'bucket-lifecycle',
      {
        bucket: this.bucket.id,
        rule: [
          {
            id: 'cleanup-old-versions',
            status: 'Enabled',
            noncurrentVersionExpiration: [
              {
                noncurrentDays: 90,
              },
            ],
          },
        ],
      }
    );

    // CORS configuration
    new aws.s3BucketCorsConfiguration.S3BucketCorsConfiguration(
      this,
      'bucket-cors',
      {
        bucket: this.bucket.id,
        corsRule: [
          {
            allowedHeaders: ['*'],
            allowedMethods: ['GET', 'HEAD'],
            allowedOrigins: ['*'],
            exposeHeaders: ['ETag'],
            maxAgeSeconds: 3000,
          },
        ],
      }
    );
  }
}

export interface MonitoringModuleConfig {
  environment: string;
  projectName: string;
  albArn: string;
  targetGroupArn: string;
  clusterName: string;
  serviceName: string;
  rdsIdentifier: string;
}

export class MonitoringModule extends Construct {
  public readonly dashboard: aws.cloudwatchDashboard.CloudwatchDashboard;
  public readonly alarms: aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm[];

  constructor(scope: Construct, id: string, config: MonitoringModuleConfig) {
    super(scope, id);

    this.alarms = [];

    // SNS Topic for alarms
    const snsTopic = new aws.snsTopic.SnsTopic(this, 'alarm-topic', {
      name: `${config.projectName}-${config.environment}-alarms`,
      displayName: `${config.projectName} ${config.environment} Alarms`,
    });

    // High CPU Alarm for ECS Service
    this.alarms.push(
      new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
        this,
        'high-cpu-alarm',
        {
          alarmName: `${config.projectName}-${config.environment}-high-cpu`,
          alarmDescription: 'Triggers when ECS service CPU exceeds 80%',
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 2,
          metricName: 'CPUUtilization',
          namespace: 'AWS/ECS',
          period: 300,
          statistic: 'Average',
          threshold: 80,
          dimensions: {
            ClusterName: config.clusterName,
            ServiceName: config.serviceName,
          },
          alarmActions: [snsTopic.arn],
          treatMissingData: 'breaching',
        }
      )
    );

    // High Memory Alarm for ECS Service
    this.alarms.push(
      new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
        this,
        'high-memory-alarm',
        {
          alarmName: `${config.projectName}-${config.environment}-high-memory`,
          alarmDescription: 'Triggers when ECS service memory exceeds 80%',
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 2,
          metricName: 'MemoryUtilization',
          namespace: 'AWS/ECS',
          period: 300,
          statistic: 'Average',
          threshold: 80,
          dimensions: {
            ClusterName: config.clusterName,
            ServiceName: config.serviceName,
          },
          alarmActions: [snsTopic.arn],
          treatMissingData: 'breaching',
        }
      )
    );

    // Target Group Unhealthy Hosts Alarm
    this.alarms.push(
      new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
        this,
        'unhealthy-hosts-alarm',
        {
          alarmName: `${config.projectName}-${config.environment}-unhealthy-hosts`,
          alarmDescription: 'Triggers when target group has unhealthy hosts',
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 2,
          metricName: 'UnHealthyHostCount',
          namespace: 'AWS/ApplicationELB',
          period: 60,
          statistic: 'Average',
          threshold: 0,
          dimensions: {
            TargetGroup: config.targetGroupArn.split(':').pop() || '',
            LoadBalancer: config.albArn.split('/').slice(-3).join('/'),
          },
          alarmActions: [snsTopic.arn],
          treatMissingData: 'breaching',
        }
      )
    );

    // RDS CPU Alarm
    this.alarms.push(
      new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
        this,
        'rds-cpu-alarm',
        {
          alarmName: `${config.projectName}-${config.environment}-rds-cpu`,
          alarmDescription: 'Triggers when RDS CPU exceeds 75%',
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 2,
          metricName: 'CPUUtilization',
          namespace: 'AWS/RDS',
          period: 300,
          statistic: 'Average',
          threshold: 75,
          dimensions: {
            DBInstanceIdentifier: config.rdsIdentifier,
          },
          alarmActions: [snsTopic.arn],
        }
      )
    );

    // RDS Storage Space Alarm
    this.alarms.push(
      new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
        this,
        'rds-storage-alarm',
        {
          alarmName: `${config.projectName}-${config.environment}-rds-storage`,
          alarmDescription: 'Triggers when RDS free storage is less than 10GB',
          comparisonOperator: 'LessThanThreshold',
          evaluationPeriods: 1,
          metricName: 'FreeStorageSpace',
          namespace: 'AWS/RDS',
          period: 300,
          statistic: 'Average',
          threshold: 10737418240, // 10GB in bytes
          dimensions: {
            DBInstanceIdentifier: config.rdsIdentifier,
          },
          alarmActions: [snsTopic.arn],
        }
      )
    );

    // CloudWatch Dashboard
    const dashboardBody = {
      widgets: [
        {
          type: 'metric',
          properties: {
            metrics: [
              ['AWS/ECS', 'CPUUtilization', { stat: 'Average' }],
              ['.', 'MemoryUtilization', { stat: 'Average' }],
            ],
            view: 'timeSeries',
            stacked: false,
            region: 'us-east-1',
            title: 'ECS Service Metrics',
            period: 300,
          },
        },
        {
          type: 'metric',
          properties: {
            metrics: [
              ['AWS/ApplicationELB', 'TargetResponseTime', { stat: 'Average' }],
              ['.', 'RequestCount', { stat: 'Sum' }],
              ['.', 'HTTPCode_Target_2XX_Count', { stat: 'Sum' }],
              ['.', 'HTTPCode_Target_4XX_Count', { stat: 'Sum' }],
              ['.', 'HTTPCode_Target_5XX_Count', { stat: 'Sum' }],
            ],
            view: 'timeSeries',
            stacked: false,
            region: 'us-east-1',
            title: 'ALB Metrics',
            period: 300,
          },
        },
        {
          type: 'metric',
          properties: {
            metrics: [
              ['AWS/RDS', 'CPUUtilization', { stat: 'Average' }],
              ['.', 'DatabaseConnections', { stat: 'Average' }],
              ['.', 'FreeStorageSpace', { stat: 'Average' }],
            ],
            view: 'timeSeries',
            stacked: false,
            region: 'us-east-1',
            title: 'RDS Metrics',
            period: 300,
          },
        },
      ],
    };

    this.dashboard = new aws.cloudwatchDashboard.CloudwatchDashboard(
      this,
      'dashboard',
      {
        dashboardName: `${config.projectName}-${config.environment}-dashboard`,
        dashboardBody: JSON.stringify(dashboardBody),
      }
    );
  }
}
