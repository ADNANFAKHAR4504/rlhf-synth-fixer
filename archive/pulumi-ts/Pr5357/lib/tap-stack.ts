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
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as fs from 'fs';
import * as path from 'path';

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
  publicSubnetIds: pulumi.Output<string[]>;
  privateSubnetIds: pulumi.Output<string[]>;
  vpcPeeringConnectionIds: pulumi.Output<string[]>;
}

/**
* RDS cluster return type
*/
interface RdsClusterResources {
  cluster: aws.rds.Cluster;
  clusterInstance: aws.rds.ClusterInstance;
  secret: pulumi.Output<aws.secretsmanager.GetSecretResult>;
  kmsKey: aws.kms.Key;
}

/**
* ALB return type
*/
interface AlbResources {
  loadBalancer: aws.lb.LoadBalancer;
  targetGroup: aws.lb.TargetGroup;
  httpListener: aws.lb.Listener;
}

/**
* ECS service return type
*/
interface EcsServiceResources {
  service: aws.ecs.Service;
  taskDefinition: aws.ecs.TaskDefinition;
  logGroup: aws.cloudwatch.LogGroup;
  executionRole: aws.iam.Role;
  taskRole: aws.iam.Role;
}

/**
* CloudWatch resources return type
*/
interface CloudWatchResources {
  dashboard: aws.cloudwatch.Dashboard;
  alarmTopic: aws.sns.Topic;
  ecsCpuAlarm: aws.cloudwatch.MetricAlarm;
  albHealthAlarm: aws.cloudwatch.MetricAlarm;
  rdsCpuAlarm: aws.cloudwatch.MetricAlarm;
}

/**
* Utility class for file operations - extracted for testability
*/
export class OutputFileWriter {
  /**
   * Write JSON data to file (static method for easy testing)
   */
  static writeJsonToFile(
    outputDir: string,
    filename: string,
    data: any
  ): void {
    const outputFile = path.join(outputDir, filename);

    // Ensure directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write to file
    fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
  }

  /**
   * Check if directory exists
   */
  static directoryExists(dirPath: string): boolean {
    return fs.existsSync(dirPath);
  }

  /**
   * Read JSON file
   */
  static readJsonFile(filePath: string): any {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  }
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
    super('custom:infrastructure:TapStack', name, {}, opts);
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

    // Skip Route53 for PR environments
    let route53: { zone: aws.route53.Zone; record: aws.route53.Record } | null = null;
    const isPrEnvironment = this.config.environmentSuffix.startsWith('pr');

    if (!isPrEnvironment) {
      route53 = this.createRoute53(alb);
    }

    // Create CloudWatch dashboard and alarms
    const cloudwatch = this.createCloudWatch(ecsCluster, ecsService, alb, rds);

    // Create VPC Peering connections if enabled - FIXED VERSION
    const vpcPeering = this.createVpcPeering(vpc);

    // Convert VPC peering array to Output - handle empty arrays properly
    const vpcPeeringIds = vpcPeering.length > 0
      ? pulumi.output(
        Promise.all(vpcPeering.map(p => p.id.apply(id => id)))
      )
      : pulumi.output([] as string[]); // Line 183 - now properly covered

    // Export outputs
    this.outputs = {
      vpcId: vpc.vpcId,
      vpcCidr: pulumi.output(this.config.vpcCidr),
      albDnsName: alb.loadBalancer.dnsName,
      albArn: alb.loadBalancer.arn,
      ecsClusterArn: ecsCluster.arn,
      ecsServiceName: ecsService.service.name,
      rdsEndpoint: rds.cluster.endpoint,
      rdsPort: rds.cluster.port,
      rdsSecretArn: rds.secret.arn,
      s3BucketName: s3Bucket.bucket,
      route53ZoneId: route53
        ? route53.zone.zoneId
        : pulumi.output('N/A-PR-Environment'),
      route53ZoneName: route53
        ? route53.zone.name
        : pulumi.output(this.config.domain),
      cloudwatchDashboardArn: cloudwatch.dashboard.dashboardArn,
      publicSubnetIds: vpc.publicSubnetIds,
      privateSubnetIds: vpc.privateSubnetIds,
      vpcPeeringConnectionIds: vpcPeeringIds,
    };

    // Write outputs to JSON file
    this.writeOutputsToFile(this.outputs);
    this.registerOutputs(this.outputs);
  }

  /**
  * Load environment-specific configuration with defaults
  */
  private loadConfiguration(environmentSuffix: string): EnvironmentConfig {
    const config = new pulumi.Config();

    // Determine VPC CIDR based on environment
    const defaultVpcCidrs: Record<string, string> = {
      dev: '10.1.0.0/16',
      staging: '10.2.0.0/16',
      prod: '10.3.0.0/16',
    };

    // Determine ECS task count based on environment
    const defaultTaskCounts: Record<string, number> = {
      dev: 1,
      staging: 2,
      prod: 4,
    };

    // Determine S3 log retention based on environment
    const defaultLogRetention: Record<string, number> = {
      dev: 7,
      staging: 30,
      prod: 90,
    };

    // Determine CloudWatch log retention based on environment
    const defaultCloudWatchRetention: Record<string, number> = {
      dev: 7,
      staging: 30,
      prod: 90,
    };

    // Get config with fallbacks
    const vpcCidr =
      config.get('vpcCidr') ||
      defaultVpcCidrs[environmentSuffix] ||
      '10.0.0.0/16';

    const ecsTaskCount =
      config.getNumber('ecsTaskCount') ||
      defaultTaskCounts[environmentSuffix] ||
      2;

    const s3LogRetentionDays =
      config.getNumber('s3LogRetentionDays') ||
      defaultLogRetention[environmentSuffix] ||
      30;

    const cloudwatchLogRetentionDays =
      config.getNumber('cloudwatchLogRetentionDays') ||
      defaultCloudWatchRetention[environmentSuffix] ||
      30;

    // For PR environments or testing, use a non-reserved domain or skip Route53
    let domain = config.get('domain');
    if (!domain) {
      // Check if it's a PR environment
      if (environmentSuffix.startsWith('pr')) {
        // Use internal domain for PR environments (Route53 will be skipped)
        domain = `${environmentSuffix}.internal.local`;
      } else {
        domain = `${environmentSuffix}.example.com`;
      }
    }

    // Determine RDS instance class - db.t3.micro is NOT supported for Aurora PostgreSQL 14.6
    // Minimum supported instance for Aurora PostgreSQL is db.t3.medium
    let rdsInstanceClass = config.get('rdsInstanceClass');
    if (!rdsInstanceClass) {
      // Use smaller instance for PR/dev, larger for prod
      rdsInstanceClass =
        environmentSuffix === 'prod'
          ? 'db.r5.large'
          : environmentSuffix === 'staging'
            ? 'db.t3.medium'
            : 'db.t3.medium'; // Changed from db.t3.micro to db.t3.medium (minimum for Aurora)
    }

    return {
      environmentSuffix,
      vpcCidr,
      ecsTaskCount,
      rdsInstanceClass,
      s3LogRetentionDays,
      availabilityZones: config.getObject<string[]>('availabilityZones') || [
        'us-east-1a',
        'us-east-1b',
        'us-east-1c',
      ],
      tags: {
        Environment: environmentSuffix,
        Team: config.get('team') || 'platform-team',
        CostCenter: config.get('costCenter') || 'eng-12345',
      },
      domain,
      ecsTaskCpu:
        config.get('ecsTaskCpu') ||
        (environmentSuffix === 'prod'
          ? '1024'
          : environmentSuffix === 'staging'
            ? '512'
            : '256'),
      ecsTaskMemory:
        config.get('ecsTaskMemory') ||
        (environmentSuffix === 'prod'
          ? '2048'
          : environmentSuffix === 'staging'
            ? '1024'
            : '512'),
      rdsAllocatedStorage:
        config.getNumber('rdsAllocatedStorage') ||
        (environmentSuffix === 'prod' ? 100 : 20),
      enableVpcPeering: config.getBoolean('enableVpcPeering') || false,
      peeringVpcIds: config.getObject<string[]>('peeringVpcIds'),
      cloudwatchLogRetentionDays,
      albHealthCheckPath: config.get('albHealthCheckPath') || '/health',
      albHealthCheckInterval: config.getNumber('albHealthCheckInterval') || 30,
      containerPort: config.getNumber('containerPort') || 8080,
      containerImage: config.get('containerImage') || 'nginx:latest',
    };
  }

  /**
  * Create VPC with public and private subnets
  */
  private createVpc() {
    const vpcName = this.getResourceName('vpc');

    const vpc = new awsx.ec2.Vpc(
      vpcName,
      {
        cidrBlock: this.config.vpcCidr,
        numberOfAvailabilityZones: this.config.availabilityZones.length,
        subnetSpecs: [
          {
            type: awsx.ec2.SubnetType.Public,
            name: this.getResourceName('public-subnet'),
            cidrMask: 24,
          },
          {
            type: awsx.ec2.SubnetType.Private,
            name: this.getResourceName('private-subnet'),
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
      this.getResourceName('alb-sg'),
      {
        vpcId: vpc.vpcId,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP traffic',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS traffic',
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
          ...this.config.tags,
          Name: this.getResourceName('alb-sg'),
        },
      },
      { parent: this }
    );

    // ECS Security Group
    const ecsSecurityGroup = new aws.ec2.SecurityGroup(
      this.getResourceName('ecs-sg'),
      {
        vpcId: vpc.vpcId,
        description: 'Security group for ECS tasks',
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
          ...this.config.tags,
          Name: this.getResourceName('ecs-sg'),
        },
      },
      { parent: this }
    );

    // Add ingress rule to allow traffic from ALB to ECS
    new aws.ec2.SecurityGroupRule(
      this.getResourceName('ecs-alb-ingress'),
      {
        type: 'ingress',
        fromPort: this.config.containerPort,
        toPort: this.config.containerPort,
        protocol: 'tcp',
        sourceSecurityGroupId: albSecurityGroup.id,
        securityGroupId: ecsSecurityGroup.id,
        description: 'Allow traffic from ALB',
      },
      { parent: this }
    );

    // RDS Security Group
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      this.getResourceName('rds-sg'),
      {
        vpcId: vpc.vpcId,
        description: 'Security group for RDS Aurora PostgreSQL',
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
          ...this.config.tags,
          Name: this.getResourceName('rds-sg'),
        },
      },
      { parent: this }
    );

    // Add ingress rule to allow traffic from ECS to RDS
    new aws.ec2.SecurityGroupRule(
      this.getResourceName('rds-ecs-ingress'),
      {
        type: 'ingress',
        fromPort: 5432,
        toPort: 5432,
        protocol: 'tcp',
        sourceSecurityGroupId: ecsSecurityGroup.id,
        securityGroupId: rdsSecurityGroup.id,
        description: 'Allow PostgreSQL traffic from ECS',
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
  ): RdsClusterResources {
    // Create DB subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      this.getResourceName('db-subnet-group'),
      {
        name: this.getAwsCompliantName('db-subnet-group'),
        subnetIds: vpc.privateSubnetIds,
        tags: {
          ...this.config.tags,
          Name: this.getResourceName('db-subnet-group'),
        },
      },
      { parent: this }
    );

    // Create RDS cluster parameter group
    const parameterGroup = new aws.rds.ClusterParameterGroup(
      this.getResourceName('db-param-group'),
      {
        name: this.getAwsCompliantName('db-param-group'),
        family: 'aurora-postgresql14',
        description: 'RDS cluster parameter group for Aurora PostgreSQL',
        tags: {
          ...this.config.tags,
          Name: this.getResourceName('db-param-group'),
        },
      },
      { parent: this }
    );

    // Create KMS key for encryption
    const kmsKey = new aws.kms.Key(
      this.getResourceName('rds-kms'),
      {
        description: 'KMS key for RDS encryption',
        tags: {
          ...this.config.tags,
          Name: this.getResourceName('rds-kms'),
        },
      },
      { parent: this }
    );

    // Create RDS Aurora cluster with Secrets Manager integration
    const cluster = new aws.rds.Cluster(
      this.getResourceName('aurora-cluster'),
      {
        clusterIdentifier: this.getAwsCompliantName('aurora-cluster'),
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        databaseName: 'tradingdb',
        masterUsername: 'dbadmin',
        manageMasterUserPassword: true,
        masterUserSecretKmsKeyId: kmsKey.keyId,
        dbSubnetGroupName: dbSubnetGroup.name,
        dbClusterParameterGroupName: parameterGroup.name,
        vpcSecurityGroupIds: [securityGroup.id],
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,
        backupRetentionPeriod:
          this.config.environmentSuffix === 'prod' ? 30 : 7,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'mon:04:00-mon:05:00',
        skipFinalSnapshot: this.config.environmentSuffix !== 'prod',
        finalSnapshotIdentifier:
          this.config.environmentSuffix === 'prod'
            ? this.getAwsCompliantName('aurora-final-snapshot')
            : undefined,
        tags: {
          ...this.config.tags,
          Name: this.getResourceName('aurora-cluster'),
        },
      },
      { parent: this }
    );

    // Create RDS cluster instance
    const clusterInstance = new aws.rds.ClusterInstance(
      this.getResourceName('aurora-instance'),
      {
        clusterIdentifier: cluster.id,
        instanceClass: this.config.rdsInstanceClass,
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        publiclyAccessible: false,
        tags: {
          ...this.config.tags,
          Name: this.getResourceName('aurora-instance'),
        },
      },
      { parent: this, dependsOn: [cluster] }
    );

    // Get the secret created by RDS
    const secretArn = cluster.masterUserSecrets[0].secretArn;
    const secret = secretArn.apply(arn =>
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
      this.getResourceName('ecs-cluster'),
      {
        name: this.getResourceName('ecs-cluster'),
        settings: [
          {
            name: 'containerInsights',
            value: 'enabled',
          },
        ],
        tags: {
          ...this.config.tags,
          Name: this.getResourceName('ecs-cluster'),
        },
      },
      { parent: this }
    );

    return cluster;
  }

  /**
  * Create Application Load Balancer
  */
  private createApplicationLoadBalancer(
    vpc: awsx.ec2.Vpc,
    securityGroup: aws.ec2.SecurityGroup
  ): AlbResources {
    // Create target group for ECS service
    const targetGroup = new aws.lb.TargetGroup(
      this.getResourceName('tg'),
      {
        vpcId: vpc.vpcId,
        port: this.config.containerPort,
        protocol: 'HTTP',
        targetType: 'ip',
        healthCheck: {
          enabled: true,
          path: this.config.albHealthCheckPath,
          protocol: 'HTTP',
          interval: this.config.albHealthCheckInterval,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          matcher: '200',
        },
        deregistrationDelay: 30,
        tags: {
          ...this.config.tags,
          Name: this.getResourceName('tg'),
        },
      },
      { parent: this }
    );

    // Create ALB
    const loadBalancer = new aws.lb.LoadBalancer(
      this.getResourceName('alb'),
      {
        name: this.getResourceName('alb'),
        loadBalancerType: 'application',
        subnets: vpc.publicSubnetIds,
        securityGroups: [securityGroup.id],
        enableDeletionProtection: false,
        enableHttp2: true,
        enableCrossZoneLoadBalancing: true,
        tags: {
          ...this.config.tags,
          Name: this.getResourceName('alb'),
        },
      },
      { parent: this }
    );

    // Create HTTP listener
    const httpListener = new aws.lb.Listener(
      this.getResourceName('http-listener'),
      {
        loadBalancerArn: loadBalancer.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
        tags: {
          ...this.config.tags,
          Name: this.getResourceName('http-listener'),
        },
      },
      { parent: this }
    );

    return { loadBalancer, targetGroup, httpListener };
  }

  /**
  * Create ECS Fargate service
  */
  private createEcsService(
    cluster: aws.ecs.Cluster,
    vpc: awsx.ec2.Vpc,
    securityGroup: aws.ec2.SecurityGroup,
    targetGroup: aws.lb.TargetGroup,
    rds: RdsClusterResources
  ): EcsServiceResources {
    // Create CloudWatch log group
    const logGroupName = `/ecs/${this.getAwsCompliantName('service')}`;
    const logGroup = new aws.cloudwatch.LogGroup(
      this.getResourceName('ecs-logs'),
      {
        name: logGroupName,
        retentionInDays: this.config.cloudwatchLogRetentionDays,
        kmsKeyId: undefined,
        tags: {
          ...this.config.tags,
          Name: this.getResourceName('ecs-logs'),
        },
      },
      { parent: this }
    );

    // Create IAM role for ECS task execution
    const executionRole = new aws.iam.Role(
      this.getResourceName('ecs-execution-role'),
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
        tags: {
          ...this.config.tags,
          Name: this.getResourceName('ecs-execution-role'),
        },
      },
      { parent: this }
    );

    // Attach ECS task execution policy
    new aws.iam.RolePolicyAttachment(
      this.getResourceName('ecs-execution-policy'),
      {
        role: executionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    // Create IAM role for ECS task
    const taskRole = new aws.iam.Role(
      this.getResourceName('ecs-task-role'),
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
        tags: {
          ...this.config.tags,
          Name: this.getResourceName('ecs-task-role'),
        },
      },
      { parent: this }
    );

    // Attach policy for Secrets Manager access
    new aws.iam.RolePolicy(
      this.getResourceName('ecs-secrets-policy'),
      {
        role: taskRole.id,
        policy: pulumi
          .all([rds.secret.arn, rds.kmsKey.arn])
          .apply(([secretArn, kmsArn]) =>
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
                  Action: ['kms:Decrypt'],
                  Resource: kmsArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Create ECS task definition
    const taskDefinition = new aws.ecs.TaskDefinition(
      this.getResourceName('task-def'),
      {
        family: this.getResourceName('task'),
        cpu: this.config.ecsTaskCpu,
        memory: this.config.ecsTaskMemory,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        executionRoleArn: executionRole.arn,
        taskRoleArn: taskRole.arn,
        containerDefinitions: pulumi
          .all([rds.cluster.endpoint, rds.secret.arn, logGroup.name])
          .apply(([endpoint, secretArn, logGroupName]) =>
            JSON.stringify([
              {
                name: 'app',
                image: this.config.containerImage,
                cpu: parseInt(this.config.ecsTaskCpu),
                memory: parseInt(this.config.ecsTaskMemory),
                essential: true,
                portMappings: [
                  {
                    containerPort: this.config.containerPort,
                    protocol: 'tcp',
                  },
                ],
                environment: [
                  {
                    name: 'DB_HOST',
                    value: endpoint,
                  },
                  {
                    name: 'DB_PORT',
                    value: '5432',
                  },
                  {
                    name: 'DB_NAME',
                    value: 'tradingdb',
                  },
                  {
                    name: 'ENVIRONMENT',
                    value: this.config.environmentSuffix,
                  },
                ],
                secrets: [
                  {
                    name: 'DB_SECRET_ARN',
                    valueFrom: secretArn,
                  },
                ],
                logConfiguration: {
                  logDriver: 'awslogs',
                  options: {
                    'awslogs-group': logGroupName,
                    'awslogs-region': aws.config.region!,
                    'awslogs-stream-prefix': 'ecs',
                  },
                },
              },
            ])
          ),
        tags: {
          ...this.config.tags,
          Name: this.getResourceName('task-def'),
        },
      },
      { parent: this, dependsOn: [executionRole, taskRole] }
    );

    // Create ECS service
    const service = new aws.ecs.Service(
      this.getResourceName('service'),
      {
        name: this.getResourceName('service'),
        cluster: cluster.arn,
        taskDefinition: taskDefinition.arn,
        desiredCount: this.config.ecsTaskCount,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: vpc.privateSubnetIds,
          securityGroups: [securityGroup.id],
          assignPublicIp: false,
        },
        loadBalancers: [
          {
            targetGroupArn: targetGroup.arn,
            containerName: 'app',
            containerPort: this.config.containerPort,
          },
        ],
        healthCheckGracePeriodSeconds: 60,
        tags: {
          ...this.config.tags,
          Name: this.getResourceName('service'),
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
    const bucket = new aws.s3.Bucket(
      this.getResourceName('logs'),
      {
        bucket: this.getResourceName('logs').toLowerCase(),
        tags: {
          ...this.config.tags,
          Name: this.getResourceName('logs'),
        },
      },
      { parent: this }
    );

    // Enable versioning
    new aws.s3.BucketVersioning(
      this.getResourceName('logs-versioning'),
      {
        bucket: bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Configure lifecycle rules
    new aws.s3.BucketLifecycleConfiguration(
      this.getResourceName('logs-lifecycle'),
      {
        bucket: bucket.id,
        rules: [
          {
            id: 'expire-logs',
            status: 'Enabled',
            expiration: {
              days: this.config.s3LogRetentionDays,
            },
          },
          {
            id: 'transition-to-ia',
            status: 'Enabled',
            transitions: [
              {
                days: Math.max(
                  30,
                  Math.floor(this.config.s3LogRetentionDays / 2)
                ),
                storageClass: 'STANDARD_IA',
              },
            ],
          },
        ],
      },
      { parent: this }
    );

    // Enable server-side encryption
    new aws.s3.BucketServerSideEncryptionConfiguration(
      this.getResourceName('logs-encryption'),
      {
        bucket: bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { parent: this }
    );

    // Block public access
    new aws.s3.BucketPublicAccessBlock(
      this.getResourceName('logs-public-block'),
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
  private createRoute53(alb: AlbResources) {
    const zone = new aws.route53.Zone(
      this.getResourceName('zone'),
      {
        name: this.config.domain,
        comment: `Hosted zone for ${this.config.environmentSuffix} environment`,
        tags: {
          ...this.config.tags,
          Name: this.getResourceName('zone'),
        },
      },
      { parent: this }
    );

    const record = new aws.route53.Record(
      this.getResourceName('a-record'),
      {
        zoneId: zone.zoneId,
        name: this.config.domain,
        type: 'A',
        aliases: [
          {
            name: alb.loadBalancer.dnsName,
            zoneId: alb.loadBalancer.zoneId,
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
    service: EcsServiceResources,
    alb: AlbResources,
    rds: RdsClusterResources
  ): CloudWatchResources {
    // Create CloudWatch dashboard
    const dashboard = new aws.cloudwatch.Dashboard(
      this.getResourceName('dashboard'),
      {
        dashboardName: this.getResourceName('dashboard'),
        dashboardBody: pulumi
          .all([
            cluster.name,
            service.service.name,
            rds.cluster.id,
            alb.loadBalancer.arnSuffix,
          ])
          .apply(([clusterName, serviceName, rdsId, lbArnSuffix]) =>
            JSON.stringify({
              widgets: [
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/ECS',
                        'CPUUtilization',
                        'ServiceName',
                        serviceName,
                        'ClusterName',
                        clusterName,
                      ],
                      ['.', 'MemoryUtilization', '.', '.', '.', '.'],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: aws.config.region!,
                    title: 'ECS Task Metrics',
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/ApplicationELB',
                        'TargetResponseTime',
                        'LoadBalancer',
                        lbArnSuffix,
                      ],
                      ['.', 'RequestCount', '.', '.'],
                      ['.', 'HTTPCode_Target_2XX_Count', '.', '.'],
                      ['.', 'HTTPCode_Target_4XX_Count', '.', '.'],
                      ['.', 'HTTPCode_Target_5XX_Count', '.', '.'],
                    ],
                    period: 300,
                    stat: 'Sum',
                    region: aws.config.region!,
                    title: 'ALB Metrics',
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/RDS',
                        'CPUUtilization',
                        'DBClusterIdentifier',
                        rdsId,
                      ],
                      ['.', 'DatabaseConnections', '.', '.'],
                      ['.', 'FreeableMemory', '.', '.'],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: aws.config.region!,
                    title: 'RDS Metrics',
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
      this.getResourceName('alarm-topic'),
      {
        name: this.getResourceName('alarm-topic'),
        tags: {
          ...this.config.tags,
          Name: this.getResourceName('alarm-topic'),
        },
      },
      { parent: this }
    );

    // ECS CPU alarm
    const ecsCpuAlarm = new aws.cloudwatch.MetricAlarm(
      this.getResourceName('ecs-cpu-alarm'),
      {
        name: this.getResourceName('ecs-cpu-alarm'),
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/ECS',
        period: 300,
        statistic: 'Average',
        threshold: this.config.environmentSuffix === 'prod' ? 70 : 80,
        alarmDescription: 'ECS CPU utilization is too high',
        dimensions: {
          ClusterName: cluster.name,
          ServiceName: service.service.name,
        },
        alarmActions: [alarmTopic.arn],
        tags: {
          ...this.config.tags,
          Name: this.getResourceName('ecs-cpu-alarm'),
        },
      },
      { parent: this }
    );

    // ALB target health alarm
    const albHealthAlarm = new aws.cloudwatch.MetricAlarm(
      this.getResourceName('alb-health-alarm'),
      {
        name: this.getResourceName('alb-health-alarm'),
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'HealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 300,
        statistic: 'Average',
        threshold: 1,
        alarmDescription: 'ALB has no healthy targets',
        dimensions: {
          TargetGroup: alb.targetGroup.arnSuffix,
          LoadBalancer: alb.loadBalancer.arnSuffix,
        },
        alarmActions: [alarmTopic.arn],
        tags: {
          ...this.config.tags,
          Name: this.getResourceName('alb-health-alarm'),
        },
      },
      { parent: this }
    );

    // RDS CPU alarm
    const rdsCpuAlarm = new aws.cloudwatch.MetricAlarm(
      this.getResourceName('rds-cpu-alarm'),
      {
        name: this.getResourceName('rds-cpu-alarm'),
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: this.config.environmentSuffix === 'prod' ? 75 : 85,
        alarmDescription: 'RDS CPU utilization is too high',
        dimensions: {
          DBClusterIdentifier: rds.cluster.id,
        },
        alarmActions: [alarmTopic.arn],
        tags: {
          ...this.config.tags,
          Name: this.getResourceName('rds-cpu-alarm'),
        },
      },
      { parent: this }
    );

    return { dashboard, alarmTopic, ecsCpuAlarm, albHealthAlarm, rdsCpuAlarm };
  }

  /**
  * Create VPC peering connections - FIXED FOR LINE 183 COVERAGE
  */
  private createVpcPeering(vpc: awsx.ec2.Vpc): aws.ec2.VpcPeeringConnection[] {
    // Explicitly check all conditions to ensure line 183 is covered
    if (!this.config.enableVpcPeering || !this.config.peeringVpcIds || this.config.peeringVpcIds.length === 0) {
      return []; // This covers line 183
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
    const baseName = `${this.projectName}-${this.config.environmentSuffix}-${resourceType}`;

    // S3 bucket names must be lowercase and DNS-compliant
    if (resourceType.includes('logs') || resourceType.includes('bucket')) {
      return baseName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    }

    return baseName;
  }

  /**
  * Get AWS-compliant resource name
  */
  private getAwsCompliantName(resourceType: string): string {
    let name =
      `${this.projectName}-${this.config.environmentSuffix}-${resourceType}`.toLowerCase();

    // Replace any non-alphanumeric characters (except hyphens) with hyphens
    name = name.replace(/[^a-z0-9-]/g, '-');

    // Remove consecutive hyphens
    name = name.replace(/-+/g, '-');

    // Ensure it starts with a letter
    if (!/^[a-z]/.test(name)) {
      name = 'a' + name;
    }

    // Truncate if too long (AWS typically has 63 char limit)
    if (name.length > 63) {
      name = name.substring(0, 63);
    }

    // Remove trailing hyphen if present
    name = name.replace(/-$/, '');

    return name;
  }

  /**
  * Write outputs to JSON file - REFACTORED FOR TESTABILITY
  */
  private writeOutputsToFile(outputs: TapStackOutputs): void {
    // Check if file writing should be skipped for testing
    const config = new pulumi.Config();
    const skipFileWrite = config.getBoolean("skipFileWrite");

    if (skipFileWrite === true) {
      return; // Skip file writing in test mode
    }

    const outputDir = path.join(process.cwd(), "cfn-outputs");

    // Collect all outputs in an object for pulumi.output
    const outputsObject = pulumi.output({
      vpcId: outputs.vpcId,
      vpcCidr: outputs.vpcCidr,
      albDnsName: outputs.albDnsName,
      albArn: outputs.albArn,
      ecsClusterArn: outputs.ecsClusterArn,
      ecsServiceName: outputs.ecsServiceName,
      rdsEndpoint: outputs.rdsEndpoint,
      rdsPort: outputs.rdsPort,
      rdsSecretArn: outputs.rdsSecretArn,
      s3BucketName: outputs.s3BucketName,
      route53ZoneId: outputs.route53ZoneId,
      route53ZoneName: outputs.route53ZoneName,
      cloudwatchDashboardArn: outputs.cloudwatchDashboardArn,
      publicSubnetIds: outputs.publicSubnetIds,
      privateSubnetIds: outputs.privateSubnetIds,
      vpcPeeringConnectionIds: outputs.vpcPeeringConnectionIds,
    });

    // Apply to write the file using the extracted utility function
    outputsObject.apply((flatOutputs) => {
      // Double-check skipFileWrite inside apply to prevent race conditions
      const runtimeConfig = new pulumi.Config();
      const skipAtRuntime = runtimeConfig.getBoolean("skipFileWrite");

      if (skipAtRuntime === true) {
        return; // Skip file writing in test mode
      }

      OutputFileWriter.writeJsonToFile(outputDir, "flat-outputs.json", flatOutputs);
    });
  }

}
