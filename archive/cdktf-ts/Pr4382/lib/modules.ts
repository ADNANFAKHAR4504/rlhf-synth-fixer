import { Alb } from '@cdktf/provider-aws/lib/alb';
import { AlbListener } from '@cdktf/provider-aws/lib/alb-listener';
import { AlbTargetGroup } from '@cdktf/provider-aws/lib/alb-target-group';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { ElasticacheReplicationGroup } from '@cdktf/provider-aws/lib/elasticache-replication-group';
import { ElasticacheSubnetGroup } from '@cdktf/provider-aws/lib/elasticache-subnet-group';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RdsCluster } from '@cdktf/provider-aws/lib/rds-cluster';
import { RdsClusterInstance } from '@cdktf/provider-aws/lib/rds-cluster-instance';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Construct } from 'constructs';

// Network Module
interface NetworkModuleProps {
  environmentSuffix: string;
  awsRegion: string;
}

export class NetworkModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnetIds: string[];
  public readonly privateSubnetIds: string[];
  public readonly ecsSecurityGroupId: string;
  public readonly dbSecurityGroupId: string;
  public readonly cacheSecurityGroupId: string;
  public readonly albSecurityGroupId: string;

  constructor(scope: Construct, id: string, props: NetworkModuleProps) {
    super(scope, id);

    const { environmentSuffix, awsRegion } = props;

    // VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `assessment-vpc-${environmentSuffix}`,
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `assessment-igw-${environmentSuffix}`,
      },
    });

    // Public Subnets
    const publicSubnet1 = new Subnet(this, 'public-subnet-1', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `${awsRegion}a`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `assessment-public-1-${environmentSuffix}`,
      },
    });

    const publicSubnet2 = new Subnet(this, 'public-subnet-2', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: `${awsRegion}b`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `assessment-public-2-${environmentSuffix}`,
      },
    });

    this.publicSubnetIds = [publicSubnet1.id, publicSubnet2.id];

    // Private Subnets
    const privateSubnet1 = new Subnet(this, 'private-subnet-1', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.10.0/24',
      availabilityZone: `${awsRegion}a`,
      tags: {
        Name: `assessment-private-1-${environmentSuffix}`,
      },
    });

    const privateSubnet2 = new Subnet(this, 'private-subnet-2', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.11.0/24',
      availabilityZone: `${awsRegion}b`,
      tags: {
        Name: `assessment-private-2-${environmentSuffix}`,
      },
    });

    this.privateSubnetIds = [privateSubnet1.id, privateSubnet2.id];

    // Public Route Table
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `assessment-public-rt-${environmentSuffix}`,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    new RouteTableAssociation(this, 'public-rta-1', {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, 'public-rta-2', {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id,
    });

    // Security Group for ALB
    const albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      name: `assessment-alb-sg-${environmentSuffix}`,
      description: 'Security group for Application Load Balancer',
      vpcId: this.vpc.id,
      tags: {
        Name: `assessment-alb-sg-${environmentSuffix}`,
      },
    });

    new SecurityGroupRule(this, 'alb-ingress-http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
      description: 'Allow HTTP inbound',
    });

    new SecurityGroupRule(this, 'alb-ingress-https', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
      description: 'Allow HTTPS inbound',
    });

    new SecurityGroupRule(this, 'alb-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
      description: 'Allow all outbound',
    });

    this.albSecurityGroupId = albSecurityGroup.id;

    // Security Group for ECS
    const ecsSecurityGroup = new SecurityGroup(this, 'ecs-sg', {
      name: `assessment-ecs-sg-${environmentSuffix}`,
      description: 'Security group for ECS Fargate tasks',
      vpcId: this.vpc.id,
      tags: {
        Name: `assessment-ecs-sg-${environmentSuffix}`,
      },
    });

    new SecurityGroupRule(this, 'ecs-ingress-alb', {
      type: 'ingress',
      fromPort: 8080,
      toPort: 8080,
      protocol: 'tcp',
      sourceSecurityGroupId: albSecurityGroup.id,
      securityGroupId: ecsSecurityGroup.id,
      description: 'Allow traffic from ALB',
    });

    new SecurityGroupRule(this, 'ecs-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: ecsSecurityGroup.id,
      description: 'Allow all outbound',
    });

    this.ecsSecurityGroupId = ecsSecurityGroup.id;

    // Security Group for RDS
    const dbSecurityGroup = new SecurityGroup(this, 'db-sg', {
      name: `assessment-db-sg-${environmentSuffix}`,
      description: 'Security group for RDS Aurora',
      vpcId: this.vpc.id,
      tags: {
        Name: `assessment-db-sg-${environmentSuffix}`,
      },
    });

    new SecurityGroupRule(this, 'db-ingress-ecs', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: ecsSecurityGroup.id,
      securityGroupId: dbSecurityGroup.id,
      description: 'Allow PostgreSQL from ECS',
    });

    new SecurityGroupRule(this, 'db-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: dbSecurityGroup.id,
      description: 'Allow all outbound',
    });

    this.dbSecurityGroupId = dbSecurityGroup.id;

    // Security Group for ElastiCache
    const cacheSecurityGroup = new SecurityGroup(this, 'cache-sg', {
      name: `assessment-cache-sg-${environmentSuffix}`,
      description: 'Security group for ElastiCache Redis',
      vpcId: this.vpc.id,
      tags: {
        Name: `assessment-cache-sg-${environmentSuffix}`,
      },
    });

    new SecurityGroupRule(this, 'cache-ingress-ecs', {
      type: 'ingress',
      fromPort: 6379,
      toPort: 6379,
      protocol: 'tcp',
      sourceSecurityGroupId: ecsSecurityGroup.id,
      securityGroupId: cacheSecurityGroup.id,
      description: 'Allow Redis from ECS',
    });

    new SecurityGroupRule(this, 'cache-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: cacheSecurityGroup.id,
      description: 'Allow all outbound',
    });

    this.cacheSecurityGroupId = cacheSecurityGroup.id;
  }
}

// Secrets Module
interface SecretsModuleProps {
  environmentSuffix: string;
}

export class SecretsModule extends Construct {
  public readonly dbSecretArn: string;
  public readonly dbUsername: string;
  public readonly dbPassword: string;

  constructor(scope: Construct, id: string, props: SecretsModuleProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Generate a random password for the database
    this.dbUsername = 'dbadmin';
    this.dbPassword = this.generateSecurePassword();

    // Create database secret
    const dbSecret = new SecretsmanagerSecret(this, 'db-secret', {
      name: `assessment-db-credentials-${environmentSuffix}`,
      description: 'Database credentials for student assessment system',
      tags: {
        Name: `assessment-db-credentials-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Store the credentials in the secret
    new SecretsmanagerSecretVersion(this, 'db-secret-version', {
      secretId: dbSecret.id,
      secretString: JSON.stringify({
        username: this.dbUsername,
        password: this.dbPassword,
        engine: 'postgres',
        host: 'will-be-updated',
        port: 5432,
        dbname: 'assessments',
      }),
    });

    this.dbSecretArn = dbSecret.arn;
  }

  private generateSecurePassword(): string {
    const length = 32;
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    // AWS RDS doesn't allow: / @ " (space) - using only safe special chars
    const special = '!#$%^&*()-_=+[]{}|;:,.<>?';
    const allChars = uppercase + lowercase + numbers + special;

    let password = '';
    // Ensure at least one character from each set
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += special.charAt(Math.floor(Math.random() * special.length));

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }
}

// RDS Module
interface RdsModuleProps {
  environmentSuffix: string;
  vpcId: string;
  privateSubnetIds: string[];
  dbSecurityGroupId: string;
  dbUsername: string;
  dbPassword: string;
}

export class RdsModule extends Construct {
  public readonly clusterEndpoint: string;
  public readonly clusterId: string;

  constructor(scope: Construct, id: string, props: RdsModuleProps) {
    super(scope, id);

    const {
      environmentSuffix,
      privateSubnetIds,
      dbSecurityGroupId,
      dbUsername,
      dbPassword,
    } = props;

    // DB Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `assessment-db-subnet-${environmentSuffix}`,
      subnetIds: privateSubnetIds,
      tags: {
        Name: `assessment-db-subnet-${environmentSuffix}`,
      },
    });

    // Aurora Serverless v2 Cluster
    const cluster = new RdsCluster(this, 'aurora-cluster', {
      clusterIdentifier: `assessment-db-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineMode: 'provisioned',
      engineVersion: '15.3',
      databaseName: 'assessments',
      masterUsername: dbUsername,
      masterPassword: dbPassword,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [dbSecurityGroupId],
      storageEncrypted: true,
      backupRetentionPeriod: 7,
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'mon:04:00-mon:05:00',
      skipFinalSnapshot: true,
      serverlessv2ScalingConfiguration: {
        minCapacity: 0.5,
        maxCapacity: 1.0,
      },
      tags: {
        Name: `assessment-db-${environmentSuffix}`,
      },
    });

    // Aurora Serverless v2 Instance
    new RdsClusterInstance(this, 'aurora-instance', {
      identifier: `assessment-db-instance-${environmentSuffix}`,
      clusterIdentifier: cluster.id,
      instanceClass: 'db.serverless',
      engine: 'aurora-postgresql',
      engineVersion: '15.3',
      tags: {
        Name: `assessment-db-instance-${environmentSuffix}`,
      },
    });

    this.clusterEndpoint = cluster.endpoint;
    this.clusterId = cluster.id;
  }
}

// Cache Module
interface CacheModuleProps {
  environmentSuffix: string;
  vpcId: string;
  privateSubnetIds: string[];
  cacheSecurityGroupId: string;
}

export class CacheModule extends Construct {
  public readonly primaryEndpoint: string;
  public readonly clusterId: string;

  constructor(scope: Construct, id: string, props: CacheModuleProps) {
    super(scope, id);

    const { environmentSuffix, privateSubnetIds, cacheSecurityGroupId } = props;

    // Cache Subnet Group
    const cacheSubnetGroup = new ElasticacheSubnetGroup(
      this,
      'cache-subnet-group',
      {
        name: `assessment-cache-subnet-${environmentSuffix}`,
        subnetIds: privateSubnetIds,
        tags: {
          Name: `assessment-cache-subnet-${environmentSuffix}`,
        },
      }
    );

    // ElastiCache Redis Replication Group
    const replicationGroup = new ElasticacheReplicationGroup(
      this,
      'redis-cluster',
      {
        replicationGroupId: `assessment-cache-${environmentSuffix}`,
        description: 'Redis cluster for assessment caching',
        engine: 'redis',
        engineVersion: '7.0',
        nodeType: 'cache.t4g.micro',
        numCacheClusters: 2,
        port: 6379,
        parameterGroupName: 'default.redis7',
        subnetGroupName: cacheSubnetGroup.name,
        securityGroupIds: [cacheSecurityGroupId],
        atRestEncryptionEnabled: 'true',
        transitEncryptionEnabled: true,
        automaticFailoverEnabled: true,
        multiAzEnabled: true,
        snapshotRetentionLimit: 5,
        snapshotWindow: '03:00-05:00',
        maintenanceWindow: 'mon:05:00-mon:07:00',
        tags: {
          Name: `assessment-cache-${environmentSuffix}`,
        },
      }
    );

    this.primaryEndpoint = replicationGroup.primaryEndpointAddress;
    this.clusterId = replicationGroup.id;
  }
}

// ECS Module
interface EcsModuleProps {
  environmentSuffix: string;
  vpcId: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
  ecsSecurityGroupId: string;
  dbEndpoint: string;
  cacheEndpoint: string;
  secretArn: string;
  awsRegion: string;
}

export class EcsModule extends Construct {
  public readonly clusterName: string;
  public readonly serviceName: string;
  public readonly albDnsName: string;

  constructor(scope: Construct, id: string, props: EcsModuleProps) {
    super(scope, id);

    const {
      environmentSuffix,
      vpcId,
      publicSubnetIds,
      privateSubnetIds,
      ecsSecurityGroupId,
      dbEndpoint,
      cacheEndpoint,
      secretArn,
      awsRegion,
    } = props;

    // ECS Cluster
    const cluster = new EcsCluster(this, 'ecs-cluster', {
      name: `assessment-cluster-${environmentSuffix}`,
      tags: {
        Name: `assessment-cluster-${environmentSuffix}`,
      },
    });

    this.clusterName = cluster.name;

    // IAM Role for ECS Task Execution
    const executionRole = new IamRole(this, 'ecs-execution-role', {
      name: `assessment-ecs-execution-${environmentSuffix}`,
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
        Name: `assessment-ecs-execution-${environmentSuffix}`,
      },
    });

    new IamRolePolicyAttachment(this, 'ecs-execution-policy', {
      role: executionRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    });

    // Additional policy for Secrets Manager
    const secretsPolicy = new IamPolicy(this, 'secrets-policy', {
      name: `assessment-secrets-policy-${environmentSuffix}`,
      policy: JSON.stringify({
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
            Resource: '*',
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'secrets-policy-attachment', {
      role: executionRole.name,
      policyArn: secretsPolicy.arn,
    });

    // IAM Role for ECS Task
    const taskRole = new IamRole(this, 'ecs-task-role', {
      name: `assessment-ecs-task-${environmentSuffix}`,
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
        Name: `assessment-ecs-task-${environmentSuffix}`,
      },
    });

    // CloudWatch Logs for ECS
    const logGroup = new CloudwatchLogGroup(this, 'ecs-log-group', {
      name: `/ecs/assessment-${environmentSuffix}`,
      retentionInDays: 30,
      tags: {
        Name: `assessment-ecs-logs-${environmentSuffix}`,
      },
    });

    // ECS Task Definition
    const taskDefinition = new EcsTaskDefinition(this, 'ecs-task-def', {
      family: `assessment-task-${environmentSuffix}`,
      requiresCompatibilities: ['FARGATE'],
      networkMode: 'awsvpc',
      cpu: '256',
      memory: '512',
      executionRoleArn: executionRole.arn,
      taskRoleArn: taskRole.arn,
      containerDefinitions: JSON.stringify([
        {
          name: 'assessment-app',
          image: 'nginx:latest', // Placeholder - replace with actual app image
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
              name: 'CACHE_ENDPOINT',
              value: cacheEndpoint,
            },
            {
              name: 'AWS_REGION',
              value: awsRegion,
            },
          ],
          secrets: [
            {
              name: 'DB_PASSWORD',
              valueFrom: `${secretArn}:password::`,
            },
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': logGroup.name,
              'awslogs-region': awsRegion,
              'awslogs-stream-prefix': 'ecs',
            },
          },
        },
      ]),
      tags: {
        Name: `assessment-task-${environmentSuffix}`,
      },
    });

    // Application Load Balancer
    const albSecurityGroup = new SecurityGroup(this, 'alb-sg-module', {
      name: `assessment-alb-sg-module-${environmentSuffix}`,
      description: 'Security group for ALB',
      vpcId: vpcId,
      tags: {
        Name: `assessment-alb-sg-module-${environmentSuffix}`,
      },
    });

    new SecurityGroupRule(this, 'alb-http-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
    });

    new SecurityGroupRule(this, 'alb-egress-rule', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
    });

    const alb = new Alb(this, 'alb', {
      name: `assessment-alb-${environmentSuffix}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSecurityGroup.id],
      subnets: publicSubnetIds,
      enableDeletionProtection: false,
      tags: {
        Name: `assessment-alb-${environmentSuffix}`,
      },
    });

    this.albDnsName = alb.dnsName;

    // Target Group
    const targetGroup = new AlbTargetGroup(this, 'target-group', {
      name: `assessment-tg-${environmentSuffix}`,
      port: 8080,
      protocol: 'HTTP',
      vpcId: vpcId,
      targetType: 'ip',
      healthCheck: {
        enabled: true,
        path: '/health',
        protocol: 'HTTP',
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30,
      },
      tags: {
        Name: `assessment-tg-${environmentSuffix}`,
      },
    });

    // ALB Listener
    new AlbListener(this, 'alb-listener', {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
    });

    // ECS Service
    const service = new EcsService(this, 'ecs-service', {
      name: `assessment-service-${environmentSuffix}`,
      cluster: cluster.id,
      taskDefinition: taskDefinition.arn,
      desiredCount: 2,
      launchType: 'FARGATE',
      networkConfiguration: {
        subnets: privateSubnetIds,
        securityGroups: [ecsSecurityGroupId],
        assignPublicIp: false,
      },
      loadBalancer: [
        {
          targetGroupArn: targetGroup.arn,
          containerName: 'assessment-app',
          containerPort: 8080,
        },
      ],
      tags: {
        Name: `assessment-service-${environmentSuffix}`,
      },
    });

    this.serviceName = service.name;
  }
}

// Monitoring Module
interface MonitoringModuleProps {
  environmentSuffix: string;
  ecsClusterName: string;
  dbClusterId: string;
  cacheClusterId: string;
}

export class MonitoringModule extends Construct {
  public readonly logGroupName: string;

  constructor(scope: Construct, id: string, props: MonitoringModuleProps) {
    super(scope, id);

    const { environmentSuffix, ecsClusterName, dbClusterId, cacheClusterId } =
      props;

    // CloudWatch Log Group
    const logGroup = new CloudwatchLogGroup(this, 'monitoring-log-group', {
      name: `/aws/assessment/${environmentSuffix}`,
      retentionInDays: 90,
      tags: {
        Name: `assessment-monitoring-${environmentSuffix}`,
      },
    });

    this.logGroupName = logGroup.name;

    // ECS CPU Utilization Alarm
    new CloudwatchMetricAlarm(this, 'ecs-cpu-alarm', {
      alarmName: `assessment-ecs-cpu-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/ECS',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      dimensions: {
        ClusterName: ecsClusterName,
      },
      alarmDescription: 'Alert when ECS CPU exceeds 80%',
      tags: {
        Name: `assessment-ecs-cpu-alarm-${environmentSuffix}`,
      },
    });

    // RDS CPU Utilization Alarm
    new CloudwatchMetricAlarm(this, 'rds-cpu-alarm', {
      alarmName: `assessment-rds-cpu-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      dimensions: {
        DBClusterIdentifier: dbClusterId,
      },
      alarmDescription: 'Alert when RDS CPU exceeds 80%',
      tags: {
        Name: `assessment-rds-cpu-alarm-${environmentSuffix}`,
      },
    });

    // ElastiCache CPU Utilization Alarm
    new CloudwatchMetricAlarm(this, 'cache-cpu-alarm', {
      alarmName: `assessment-cache-cpu-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/ElastiCache',
      period: 300,
      statistic: 'Average',
      threshold: 75,
      dimensions: {
        ReplicationGroupId: cacheClusterId,
      },
      alarmDescription: 'Alert when ElastiCache CPU exceeds 75%',
      tags: {
        Name: `assessment-cache-cpu-alarm-${environmentSuffix}`,
      },
    });
  }
}
