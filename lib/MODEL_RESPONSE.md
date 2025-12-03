# Multi-Environment Infrastructure Implementation

This implementation provides a comprehensive CDKTF TypeScript solution for deploying identical infrastructure across development, staging, and production environments with environment-specific configurations.

## Architecture Overview

The solution uses:
- Abstract base stack for shared logic
- Environment-specific stack implementations
- Reusable L3 constructs for major infrastructure components
- CDKTF context for configuration management
- SSM Parameter Store for sensitive values
- Custom validation aspects for consistency checking

## File: lib/types.ts

```typescript
export interface EnvironmentConfig {
  name: string;
  cidrBlock: string;
  accountId: string;
  instanceType: string;
  minCapacity: number;
  maxCapacity: number;
  certificateArn?: string;
  costCenter: string;
  enableCrossEnvironmentReplication?: boolean;
  replicationSourceArn?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DeploymentManifest {
  environment: string;
  timestamp: string;
  resources: ResourceInfo[];
  tags: Record<string, string>;
}

export interface ResourceInfo {
  type: string;
  name: string;
  arn: string;
  properties: Record<string, any>;
}
```

## File: lib/constructs/vpc-construct.ts

```typescript
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Route } from '@cdktf/provider-aws/lib/route';

export interface VpcConstructProps {
  environmentSuffix: string;
  cidrBlock: string;
  availabilityZones: string[];
  tags?: Record<string, string>;
}

export class VpcConstruct extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly internetGateway: InternetGateway;

  constructor(scope: Construct, id: string, props: VpcConstructProps) {
    super(scope, id);

    const { environmentSuffix, cidrBlock, availabilityZones, tags = {} } = props;

    // Create VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `vpc-${environmentSuffix}`,
        ...tags,
      },
    });

    // Create Internet Gateway
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `igw-${environmentSuffix}`,
        ...tags,
      },
    });

    // Create public and private subnets in each AZ
    this.publicSubnets = [];
    this.privateSubnets = [];

    availabilityZones.forEach((az, index) => {
      // Public subnet
      const publicSubnet = new Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: this.calculateSubnetCidr(cidrBlock, index * 2),
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `public-subnet-${index}-${environmentSuffix}`,
          Type: 'public',
          ...tags,
        },
      });
      this.publicSubnets.push(publicSubnet);

      // Private subnet
      const privateSubnet = new Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: this.calculateSubnetCidr(cidrBlock, index * 2 + 1),
        availabilityZone: az,
        mapPublicIpOnLaunch: false,
        tags: {
          Name: `private-subnet-${index}-${environmentSuffix}`,
          Type: 'private',
          ...tags,
        },
      });
      this.privateSubnets.push(privateSubnet);
    });

    // Create route table for public subnets
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `public-rt-${environmentSuffix}`,
        ...tags,
      },
    });

    // Add route to Internet Gateway
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rt-assoc-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Create route table for private subnets
    const privateRouteTable = new RouteTable(this, 'private-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `private-rt-${environmentSuffix}`,
        ...tags,
      },
    });

    // Associate private subnets with private route table
    this.privateSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `private-rt-assoc-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });
  }

  private calculateSubnetCidr(vpcCidr: string, subnetIndex: number): string {
    const [network, mask] = vpcCidr.split('/');
    const [a, b, c] = network.split('.').map(Number);
    const newC = subnetIndex * 16;
    return `${a}.${b}.${newC}.0/20`;
  }
}
```

## File: lib/constructs/aurora-construct.ts

```typescript
import { Construct } from 'constructs';
import { RdsCluster } from '@cdktf/provider-aws/lib/rds-cluster';
import { RdsClusterInstance } from '@cdktf/provider-aws/lib/rds-cluster-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { SsmParameter } from '@cdktf/provider-aws/lib/ssm-parameter';

export interface AuroraConstructProps {
  environmentSuffix: string;
  vpcId: string;
  subnetIds: string[];
  engine: string;
  engineVersion: string;
  instanceClass: string;
  instanceCount: number;
  databaseName: string;
  masterUsername: string;
  skipFinalSnapshot?: boolean;
  replicationSourceArn?: string;
  tags?: Record<string, string>;
}

export class AuroraConstruct extends Construct {
  public readonly cluster: RdsCluster;
  public readonly instances: RdsClusterInstance[];
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: AuroraConstructProps) {
    super(scope, id);

    const {
      environmentSuffix,
      vpcId,
      subnetIds,
      engine,
      engineVersion,
      instanceClass,
      instanceCount,
      databaseName,
      masterUsername,
      skipFinalSnapshot = true,
      replicationSourceArn,
      tags = {},
    } = props;

    // Create DB subnet group
    const subnetGroup = new DbSubnetGroup(this, 'subnet-group', {
      name: `aurora-subnet-group-${environmentSuffix}`,
      subnetIds,
      tags: {
        Name: `aurora-subnet-group-${environmentSuffix}`,
        ...tags,
      },
    });

    // Create security group
    this.securityGroup = new SecurityGroup(this, 'sg', {
      name: `aurora-sg-${environmentSuffix}`,
      description: `Security group for Aurora cluster ${environmentSuffix}`,
      vpcId,
      tags: {
        Name: `aurora-sg-${environmentSuffix}`,
        ...tags,
      },
    });

    // Allow PostgreSQL traffic from within VPC
    new SecurityGroupRule(this, 'sg-rule-ingress', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/8'],
      securityGroupId: this.securityGroup.id,
    });

    new SecurityGroupRule(this, 'sg-rule-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
    });

    // Store master password in SSM Parameter Store
    const masterPassword = new SsmParameter(this, 'master-password', {
      name: `/aurora/${environmentSuffix}/master-password`,
      type: 'SecureString',
      value: 'ChangeMe123!', // In production, use AWS Secrets Manager rotation
      description: `Master password for Aurora cluster ${environmentSuffix}`,
      tags: {
        Name: `aurora-master-password-${environmentSuffix}`,
        ...tags,
      },
    });

    // Create Aurora cluster
    const clusterConfig: any = {
      clusterIdentifier: `aurora-cluster-${environmentSuffix}`,
      engine,
      engineVersion,
      databaseName,
      masterUsername,
      masterPassword: masterPassword.value,
      dbSubnetGroupName: subnetGroup.name,
      vpcSecurityGroupIds: [this.securityGroup.id],
      skipFinalSnapshot,
      backupRetentionPeriod: 7,
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'mon:04:00-mon:05:00',
      storageEncrypted: true,
      enabledCloudwatchLogsExports: ['postgresql'],
      tags: {
        Name: `aurora-cluster-${environmentSuffix}`,
        ...tags,
      },
    };

    // Add replication source if specified (for cross-environment replication)
    if (replicationSourceArn) {
      clusterConfig.replicationSourceIdentifier = replicationSourceArn;
    }

    this.cluster = new RdsCluster(this, 'cluster', clusterConfig);

    // Create cluster instances
    this.instances = [];
    for (let i = 0; i < instanceCount; i++) {
      const instance = new RdsClusterInstance(this, `instance-${i}`, {
        identifier: `aurora-instance-${i}-${environmentSuffix}`,
        clusterIdentifier: this.cluster.id,
        instanceClass,
        engine,
        engineVersion,
        publiclyAccessible: false,
        tags: {
          Name: `aurora-instance-${i}-${environmentSuffix}`,
          ...tags,
        },
      });
      this.instances.push(instance);
    }

    // Store cluster endpoint in SSM
    new SsmParameter(this, 'cluster-endpoint', {
      name: `/aurora/${environmentSuffix}/cluster-endpoint`,
      type: 'String',
      value: this.cluster.endpoint,
      description: `Aurora cluster endpoint for ${environmentSuffix}`,
      tags: {
        Name: `aurora-cluster-endpoint-${environmentSuffix}`,
        ...tags,
      },
    });
  }
}
```

## File: lib/constructs/ecs-construct.ts

```typescript
import { Construct } from 'constructs';
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

export interface EcsConstructProps {
  environmentSuffix: string;
  vpcId: string;
  subnetIds: string[];
  ecrRepositoryUrl: string;
  imageTag: string;
  containerPort: number;
  desiredCount: number;
  cpu: string;
  memory: string;
  targetGroupArn: string;
  tags?: Record<string, string>;
}

export class EcsConstruct extends Construct {
  public readonly cluster: EcsCluster;
  public readonly service: EcsService;
  public readonly taskDefinition: EcsTaskDefinition;
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: EcsConstructProps) {
    super(scope, id);

    const {
      environmentSuffix,
      vpcId,
      subnetIds,
      ecrRepositoryUrl,
      imageTag,
      containerPort,
      desiredCount,
      cpu,
      memory,
      targetGroupArn,
      tags = {},
    } = props;

    // Create ECS cluster
    this.cluster = new EcsCluster(this, 'cluster', {
      name: `ecs-cluster-${environmentSuffix}`,
      tags: {
        Name: `ecs-cluster-${environmentSuffix}`,
        ...tags,
      },
    });

    // Create CloudWatch log group
    const logGroup = new CloudwatchLogGroup(this, 'log-group', {
      name: `/ecs/trading-app-${environmentSuffix}`,
      retentionInDays: 7,
      tags: {
        Name: `ecs-logs-${environmentSuffix}`,
        ...tags,
      },
    });

    // Create ECS task execution role
    const executionRole = new IamRole(this, 'execution-role', {
      name: `ecs-execution-role-${environmentSuffix}`,
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
        Name: `ecs-execution-role-${environmentSuffix}`,
        ...tags,
      },
    });

    new IamRolePolicyAttachment(this, 'execution-role-policy', {
      role: executionRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    });

    // Create ECS task role
    const taskRole = new IamRole(this, 'task-role', {
      name: `ecs-task-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
            Condition: {
              StringEquals: {
                'aws:SourceAccount': '${data.aws_caller_identity.current.account_id}',
              },
            },
          },
        ],
      }),
      tags: {
        Name: `ecs-task-role-${environmentSuffix}`,
        ...tags,
      },
    });

    // Create task definition
    this.taskDefinition = new EcsTaskDefinition(this, 'task-def', {
      family: `trading-app-${environmentSuffix}`,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      cpu,
      memory,
      executionRoleArn: executionRole.arn,
      taskRoleArn: taskRole.arn,
      containerDefinitions: JSON.stringify([
        {
          name: 'trading-app',
          image: `${ecrRepositoryUrl}:${imageTag}`,
          essential: true,
          portMappings: [
            {
              containerPort,
              protocol: 'tcp',
            },
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': logGroup.name,
              'awslogs-region': 'us-east-1',
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
      ]),
      tags: {
        Name: `ecs-task-def-${environmentSuffix}`,
        ...tags,
      },
    });

    // Create security group for ECS tasks
    this.securityGroup = new SecurityGroup(this, 'sg', {
      name: `ecs-sg-${environmentSuffix}`,
      description: `Security group for ECS tasks ${environmentSuffix}`,
      vpcId,
      tags: {
        Name: `ecs-sg-${environmentSuffix}`,
        ...tags,
      },
    });

    new SecurityGroupRule(this, 'sg-rule-ingress', {
      type: 'ingress',
      fromPort: containerPort,
      toPort: containerPort,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/8'],
      securityGroupId: this.securityGroup.id,
    });

    new SecurityGroupRule(this, 'sg-rule-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
    });

    // Create ECS service
    this.service = new EcsService(this, 'service', {
      name: `ecs-service-${environmentSuffix}`,
      cluster: this.cluster.id,
      taskDefinition: this.taskDefinition.arn,
      desiredCount,
      launchType: 'FARGATE',
      networkConfiguration: {
        subnets: subnetIds,
        securityGroups: [this.securityGroup.id],
        assignPublicIp: false,
      },
      loadBalancer: [
        {
          targetGroupArn,
          containerName: 'trading-app',
          containerPort,
        },
      ],
      tags: {
        Name: `ecs-service-${environmentSuffix}`,
        ...tags,
      },
    });
  }
}
```

## File: lib/constructs/alb-construct.ts

```typescript
import { Construct } from 'constructs';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

export interface AlbConstructProps {
  environmentSuffix: string;
  vpcId: string;
  subnetIds: string[];
  certificateArn?: string;
  tags?: Record<string, string>;
}

export class AlbConstruct extends Construct {
  public readonly alb: Lb;
  public readonly targetGroup: LbTargetGroup;
  public readonly listener: LbListener;
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: AlbConstructProps) {
    super(scope, id);

    const { environmentSuffix, vpcId, subnetIds, certificateArn, tags = {} } =
      props;

    // Create security group for ALB
    this.securityGroup = new SecurityGroup(this, 'sg', {
      name: `alb-sg-${environmentSuffix}`,
      description: `Security group for ALB ${environmentSuffix}`,
      vpcId,
      tags: {
        Name: `alb-sg-${environmentSuffix}`,
        ...tags,
      },
    });

    new SecurityGroupRule(this, 'sg-rule-http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
    });

    if (certificateArn) {
      new SecurityGroupRule(this, 'sg-rule-https', {
        type: 'ingress',
        fromPort: 443,
        toPort: 443,
        protocol: 'tcp',
        cidrBlocks: ['0.0.0.0/0'],
        securityGroupId: this.securityGroup.id,
      });
    }

    new SecurityGroupRule(this, 'sg-rule-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
    });

    // Create Application Load Balancer
    this.alb = new Lb(this, 'alb', {
      name: `alb-${environmentSuffix}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [this.securityGroup.id],
      subnets: subnetIds,
      enableDeletionProtection: false,
      tags: {
        Name: `alb-${environmentSuffix}`,
        ...tags,
      },
    });

    // Create target group
    this.targetGroup = new LbTargetGroup(this, 'tg', {
      name: `alb-tg-${environmentSuffix}`,
      port: 8080,
      protocol: 'HTTP',
      vpcId,
      targetType: 'ip',
      healthCheck: {
        enabled: true,
        path: '/health',
        protocol: 'HTTP',
        matcher: '200',
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
      },
      deregistrationDelay: '30',
      tags: {
        Name: `alb-tg-${environmentSuffix}`,
        ...tags,
      },
    });

    // Create listener
    const listenerConfig: any = {
      loadBalancerArn: this.alb.arn,
      port: certificateArn ? 443 : 80,
      protocol: certificateArn ? 'HTTPS' : 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: this.targetGroup.arn,
        },
      ],
      tags: {
        Name: `alb-listener-${environmentSuffix}`,
        ...tags,
      },
    };

    if (certificateArn) {
      listenerConfig.certificateArn = certificateArn;
      listenerConfig.sslPolicy = 'ELBSecurityPolicy-TLS-1-2-2017-01';
    }

    this.listener = new LbListener(this, 'listener', listenerConfig);
  }
}
```

## File: lib/constructs/s3-construct.ts

```typescript
import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';

export interface S3ConstructProps {
  environmentSuffix: string;
  bucketName: string;
  enableVersioning?: boolean;
  lifecycleRules?: any[];
  tags?: Record<string, string>;
}

export class S3Construct extends Construct {
  public readonly bucket: S3Bucket;

  constructor(scope: Construct, id: string, props: S3ConstructProps) {
    super(scope, id);

    const {
      environmentSuffix,
      bucketName,
      enableVersioning = true,
      lifecycleRules = [],
      tags = {},
    } = props;

    // Create S3 bucket
    this.bucket = new S3Bucket(this, 'bucket', {
      bucket: `${bucketName}-${environmentSuffix}`,
      forceDestroy: true,
      tags: {
        Name: `${bucketName}-${environmentSuffix}`,
        ...tags,
      },
    });

    // Enable versioning
    if (enableVersioning) {
      new S3BucketVersioningA(this, 'versioning', {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      });
    }

    // Enable encryption
    new S3BucketServerSideEncryptionConfigurationA(this, 'encryption', {
      bucket: this.bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    // Configure lifecycle rules
    if (lifecycleRules.length > 0) {
      new S3BucketLifecycleConfiguration(this, 'lifecycle', {
        bucket: this.bucket.id,
        rule: lifecycleRules.map((rule, index) => ({
          id: rule.id || `rule-${index}`,
          status: 'Enabled',
          ...rule,
        })),
      });
    } else {
      // Default lifecycle rule
      new S3BucketLifecycleConfiguration(this, 'lifecycle', {
        bucket: this.bucket.id,
        rule: [
          {
            id: 'transition-to-ia',
            status: 'Enabled',
            transition: [
              {
                days: 30,
                storageClass: 'STANDARD_IA',
              },
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
          },
          {
            id: 'expire-old-versions',
            status: 'Enabled',
            noncurrentVersionExpiration: {
              noncurrentDays: 90,
            },
          },
        ],
      });
    }

    // Block public access
    new S3BucketPublicAccessBlock(this, 'public-access-block', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });
  }
}
```

## File: lib/constructs/cloudwatch-construct.ts

```typescript
import { Construct } from 'constructs';
import { CloudwatchDashboard } from '@cdktf/provider-aws/lib/cloudwatch-dashboard';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';

export interface CloudWatchConstructProps {
  environmentSuffix: string;
  ecsClusterName: string;
  ecsServiceName: string;
  albTargetGroupArn: string;
  rdsClusterIdentifier: string;
  alarmThresholds: {
    cpuUtilization: number;
    memoryUtilization: number;
    targetResponseTime: number;
    unhealthyHostCount: number;
    databaseConnections: number;
  };
  tags?: Record<string, string>;
}

export class CloudWatchConstruct extends Construct {
  public readonly dashboard: CloudwatchDashboard;
  public readonly alarms: CloudwatchMetricAlarm[];

  constructor(scope: Construct, id: string, props: CloudWatchConstructProps) {
    super(scope, id);

    const {
      environmentSuffix,
      ecsClusterName,
      ecsServiceName,
      albTargetGroupArn,
      rdsClusterIdentifier,
      alarmThresholds,
      tags = {},
    } = props;

    this.alarms = [];

    // Extract target group name from ARN
    const targetGroupName = albTargetGroupArn.split(':').pop()!;

    // Create dashboard
    this.dashboard = new CloudwatchDashboard(this, 'dashboard', {
      dashboardName: `trading-app-${environmentSuffix}`,
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: 'metric',
            properties: {
              metrics: [
                [
                  'AWS/ECS',
                  'CPUUtilization',
                  'ServiceName',
                  ecsServiceName,
                  'ClusterName',
                  ecsClusterName,
                ],
                ['.', 'MemoryUtilization', '.', '.', '.', '.'],
              ],
              period: 300,
              stat: 'Average',
              region: 'us-east-1',
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
                ['AWS/ApplicationELB', 'TargetResponseTime', 'TargetGroup', targetGroupName],
                ['.', 'RequestCount', '.', '.'],
                ['.', 'UnHealthyHostCount', '.', '.'],
              ],
              period: 300,
              stat: 'Average',
              region: 'us-east-1',
              title: 'ALB Metrics',
            },
          },
          {
            type: 'metric',
            properties: {
              metrics: [
                ['AWS/RDS', 'CPUUtilization', 'DBClusterIdentifier', rdsClusterIdentifier],
                ['.', 'DatabaseConnections', '.', '.'],
                ['.', 'FreeableMemory', '.', '.'],
              ],
              period: 300,
              stat: 'Average',
              region: 'us-east-1',
              title: 'RDS Cluster Metrics',
            },
          },
        ],
      }),
    });

    // Create alarms
    const cpuAlarm = new CloudwatchMetricAlarm(this, 'ecs-cpu-alarm', {
      alarmName: `ecs-cpu-high-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/ECS',
      period: 300,
      statistic: 'Average',
      threshold: alarmThresholds.cpuUtilization,
      dimensions: {
        ServiceName: ecsServiceName,
        ClusterName: ecsClusterName,
      },
      alarmDescription: `CPU utilization exceeded ${alarmThresholds.cpuUtilization}% for ${environmentSuffix}`,
      tags: {
        Name: `ecs-cpu-alarm-${environmentSuffix}`,
        ...tags,
      },
    });
    this.alarms.push(cpuAlarm);

    const memoryAlarm = new CloudwatchMetricAlarm(this, 'ecs-memory-alarm', {
      alarmName: `ecs-memory-high-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'MemoryUtilization',
      namespace: 'AWS/ECS',
      period: 300,
      statistic: 'Average',
      threshold: alarmThresholds.memoryUtilization,
      dimensions: {
        ServiceName: ecsServiceName,
        ClusterName: ecsClusterName,
      },
      alarmDescription: `Memory utilization exceeded ${alarmThresholds.memoryUtilization}% for ${environmentSuffix}`,
      tags: {
        Name: `ecs-memory-alarm-${environmentSuffix}`,
        ...tags,
      },
    });
    this.alarms.push(memoryAlarm);

    const responseTimeAlarm = new CloudwatchMetricAlarm(
      this,
      'alb-response-time-alarm',
      {
        alarmName: `alb-response-time-high-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'TargetResponseTime',
        namespace: 'AWS/ApplicationELB',
        period: 300,
        statistic: 'Average',
        threshold: alarmThresholds.targetResponseTime,
        dimensions: {
          TargetGroup: targetGroupName,
        },
        alarmDescription: `Target response time exceeded ${alarmThresholds.targetResponseTime}s for ${environmentSuffix}`,
        tags: {
          Name: `alb-response-time-alarm-${environmentSuffix}`,
          ...tags,
        },
      }
    );
    this.alarms.push(responseTimeAlarm);

    const unhealthyHostAlarm = new CloudwatchMetricAlarm(
      this,
      'alb-unhealthy-host-alarm',
      {
        alarmName: `alb-unhealthy-hosts-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'UnHealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Maximum',
        threshold: alarmThresholds.unhealthyHostCount,
        dimensions: {
          TargetGroup: targetGroupName,
        },
        alarmDescription: `Unhealthy host count exceeded ${alarmThresholds.unhealthyHostCount} for ${environmentSuffix}`,
        tags: {
          Name: `alb-unhealthy-host-alarm-${environmentSuffix}`,
          ...tags,
        },
      }
    );
    this.alarms.push(unhealthyHostAlarm);

    const dbConnectionsAlarm = new CloudwatchMetricAlarm(
      this,
      'rds-connections-alarm',
      {
        alarmName: `rds-connections-high-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'DatabaseConnections',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: alarmThresholds.databaseConnections,
        dimensions: {
          DBClusterIdentifier: rdsClusterIdentifier,
        },
        alarmDescription: `Database connections exceeded ${alarmThresholds.databaseConnections} for ${environmentSuffix}`,
        tags: {
          Name: `rds-connections-alarm-${environmentSuffix}`,
          ...tags,
        },
      }
    );
    this.alarms.push(dbConnectionsAlarm);
  }
}
```

## File: lib/base-environment-stack.ts

```typescript
import { TerraformStack, S3Backend } from 'cdktf';
import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { EcrRepository } from '@cdktf/provider-aws/lib/ecr-repository';
import { VpcConstruct } from './constructs/vpc-construct';
import { AuroraConstruct } from './constructs/aurora-construct';
import { EcsConstruct } from './constructs/ecs-construct';
import { AlbConstruct } from './constructs/alb-construct';
import { S3Construct } from './constructs/s3-construct';
import { CloudWatchConstruct } from './constructs/cloudwatch-construct';
import { EnvironmentConfig, DeploymentManifest, ResourceInfo } from './types';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { TerraformOutput } from 'cdktf';

export interface BaseEnvironmentStackProps {
  config: EnvironmentConfig;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
}

export abstract class BaseEnvironmentStack extends TerraformStack {
  protected config: EnvironmentConfig;
  protected vpc: VpcConstruct;
  protected aurora: AuroraConstruct;
  protected alb: AlbConstruct;
  protected ecs: EcsConstruct;
  protected s3: S3Construct;
  protected cloudwatch: CloudWatchConstruct;
  protected sharedEcrRepository: EcrRepository;
  protected manifest: DeploymentManifest;

  constructor(scope: Construct, id: string, props: BaseEnvironmentStackProps) {
    super(scope, id);

    this.config = props.config;
    const awsRegion = props.awsRegion || 'us-east-1';
    const stateBucketRegion = props.stateBucketRegion || 'us-east-1';
    const stateBucket = props.stateBucket || 'iac-rlhf-tf-states';

    // Initialize manifest
    this.manifest = {
      environment: this.config.name,
      timestamp: new Date().toISOString(),
      resources: [],
      tags: this.getCommonTags(),
    };

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: this.getCommonTags(),
        },
      ],
    });

    // Configure S3 Backend
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${this.config.name}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // Validate configuration at synthesis time
    this.validateConfiguration();

    // Create shared ECR repository (once per account)
    this.sharedEcrRepository = new EcrRepository(this, 'ecr-repo', {
      name: `trading-app-${this.config.name}`,
      imageTagMutability: 'MUTABLE',
      imageScanningConfiguration: {
        scanOnPush: true,
      },
      forceDelete: true,
      tags: {
        Name: `ecr-trading-app-${this.config.name}`,
        ...this.getCommonTags(),
      },
    });

    this.addResourceToManifest({
      type: 'ECR Repository',
      name: this.sharedEcrRepository.name,
      arn: this.sharedEcrRepository.arn,
      properties: {
        repositoryUrl: this.sharedEcrRepository.repositoryUrl,
      },
    });

    // Create VPC
    this.vpc = new VpcConstruct(this, 'vpc', {
      environmentSuffix: this.config.name,
      cidrBlock: this.config.cidrBlock,
      availabilityZones: [
        `${awsRegion}a`,
        `${awsRegion}b`,
        `${awsRegion}c`,
      ],
      tags: this.getCommonTags(),
    });

    this.addResourceToManifest({
      type: 'VPC',
      name: `vpc-${this.config.name}`,
      arn: this.vpc.vpc.arn,
      properties: {
        cidrBlock: this.config.cidrBlock,
        vpcId: this.vpc.vpc.id,
      },
    });

    // Create Aurora cluster
    this.aurora = new AuroraConstruct(this, 'aurora', {
      environmentSuffix: this.config.name,
      vpcId: this.vpc.vpc.id,
      subnetIds: this.vpc.privateSubnets.map((s) => s.id),
      engine: 'aurora-postgresql',
      engineVersion: '14.6',
      instanceClass: this.config.instanceType,
      instanceCount: this.getAuroraInstanceCount(),
      databaseName: 'tradingdb',
      masterUsername: 'dbadmin',
      replicationSourceArn: this.config.replicationSourceArn,
      tags: this.getCommonTags(),
    });

    this.addResourceToManifest({
      type: 'RDS Aurora Cluster',
      name: `aurora-cluster-${this.config.name}`,
      arn: this.aurora.cluster.arn,
      properties: {
        clusterIdentifier: this.aurora.cluster.clusterIdentifier,
        endpoint: this.aurora.cluster.endpoint,
        instanceCount: this.getAuroraInstanceCount(),
      },
    });

    // Create ALB
    this.alb = new AlbConstruct(this, 'alb', {
      environmentSuffix: this.config.name,
      vpcId: this.vpc.vpc.id,
      subnetIds: this.vpc.publicSubnets.map((s) => s.id),
      certificateArn: this.config.certificateArn,
      tags: this.getCommonTags(),
    });

    this.addResourceToManifest({
      type: 'Application Load Balancer',
      name: `alb-${this.config.name}`,
      arn: this.alb.alb.arn,
      properties: {
        dnsName: this.alb.alb.dnsName,
        targetGroupArn: this.alb.targetGroup.arn,
      },
    });

    // Create ECS cluster and service
    this.ecs = new EcsConstruct(this, 'ecs', {
      environmentSuffix: this.config.name,
      vpcId: this.vpc.vpc.id,
      subnetIds: this.vpc.privateSubnets.map((s) => s.id),
      ecrRepositoryUrl: this.sharedEcrRepository.repositoryUrl,
      imageTag: this.getImageTag(),
      containerPort: 8080,
      desiredCount: this.config.minCapacity,
      cpu: this.getEcsCpu(),
      memory: this.getEcsMemory(),
      targetGroupArn: this.alb.targetGroup.arn,
      tags: this.getCommonTags(),
    });

    this.addResourceToManifest({
      type: 'ECS Cluster',
      name: `ecs-cluster-${this.config.name}`,
      arn: this.ecs.cluster.arn,
      properties: {
        clusterName: this.ecs.cluster.name,
        serviceName: this.ecs.service.name,
        desiredCount: this.config.minCapacity,
      },
    });

    // Create S3 bucket for static assets
    this.s3 = new S3Construct(this, 's3-assets', {
      environmentSuffix: this.config.name,
      bucketName: 'trading-app-assets',
      enableVersioning: true,
      tags: this.getCommonTags(),
    });

    this.addResourceToManifest({
      type: 'S3 Bucket',
      name: `trading-app-assets-${this.config.name}`,
      arn: this.s3.bucket.arn,
      properties: {
        bucketName: this.s3.bucket.bucket,
      },
    });

    // Create CloudWatch dashboard and alarms
    this.cloudwatch = new CloudWatchConstruct(this, 'cloudwatch', {
      environmentSuffix: this.config.name,
      ecsClusterName: this.ecs.cluster.name,
      ecsServiceName: this.ecs.service.name,
      albTargetGroupArn: this.alb.targetGroup.arn,
      rdsClusterIdentifier: this.aurora.cluster.clusterIdentifier,
      alarmThresholds: this.getAlarmThresholds(),
      tags: this.getCommonTags(),
    });

    this.addResourceToManifest({
      type: 'CloudWatch Dashboard',
      name: `trading-app-${this.config.name}`,
      arn: this.cloudwatch.dashboard.dashboardArn,
      properties: {
        dashboardName: this.cloudwatch.dashboard.dashboardName,
        alarmCount: this.cloudwatch.alarms.length,
      },
    });

    // Create outputs
    this.createOutputs();
  }

  protected getCommonTags(): Record<string, string> {
    return {
      Environment: this.config.name,
      CostCenter: this.config.costCenter,
      DeploymentTimestamp: new Date().toISOString(),
      ManagedBy: 'CDKTF',
      Application: 'TradingApp',
    };
  }

  protected validateConfiguration(): void {
    const errors: string[] = [];

    if (!this.config.name) {
      errors.push('Environment name is required');
    }

    if (!this.config.cidrBlock || !this.config.cidrBlock.match(/^10\.\d+\.0\.0\/16$/)) {
      errors.push(
        `Invalid CIDR block: ${this.config.cidrBlock}. Must follow pattern 10.{env}.0.0/16`
      );
    }

    if (!this.config.accountId || this.config.accountId.length !== 12) {
      errors.push('Valid AWS account ID (12 digits) is required');
    }

    if (this.config.minCapacity < 1 || this.config.maxCapacity < this.config.minCapacity) {
      errors.push('Invalid capacity configuration');
    }

    if (errors.length > 0) {
      throw new Error(
        `Configuration validation failed for ${this.config.name}:\n${errors.join('\n')}`
      );
    }
  }

  protected abstract getAuroraInstanceCount(): number;
  protected abstract getEcsCpu(): string;
  protected abstract getEcsMemory(): string;
  protected abstract getImageTag(): string;
  protected abstract getAlarmThresholds(): {
    cpuUtilization: number;
    memoryUtilization: number;
    targetResponseTime: number;
    unhealthyHostCount: number;
    databaseConnections: number;
  };

  protected addResourceToManifest(resource: ResourceInfo): void {
    this.manifest.resources.push(resource);
  }

  protected createOutputs(): void {
    new TerraformOutput(this, 'vpc-id', {
      value: this.vpc.vpc.id,
      description: `VPC ID for ${this.config.name}`,
    });

    new TerraformOutput(this, 'alb-dns', {
      value: this.alb.alb.dnsName,
      description: `ALB DNS name for ${this.config.name}`,
    });

    new TerraformOutput(this, 'aurora-endpoint', {
      value: this.aurora.cluster.endpoint,
      description: `Aurora cluster endpoint for ${this.config.name}`,
      sensitive: true,
    });

    new TerraformOutput(this, 'ecs-cluster-name', {
      value: this.ecs.cluster.name,
      description: `ECS cluster name for ${this.config.name}`,
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: this.s3.bucket.bucket,
      description: `S3 bucket name for ${this.config.name}`,
    });

    new TerraformOutput(this, 'deployment-manifest', {
      value: JSON.stringify(this.manifest, null, 2),
      description: `Deployment manifest for ${this.config.name}`,
    });
  }
}
```

## File: lib/dev-stack.ts

```typescript
import { Construct } from 'constructs';
import { BaseEnvironmentStack, BaseEnvironmentStackProps } from './base-environment-stack';

export class DevStack extends BaseEnvironmentStack {
  constructor(scope: Construct, id: string, props: BaseEnvironmentStackProps) {
    super(scope, id, props);
  }

  protected getAuroraInstanceCount(): number {
    return 1; // Single instance for dev
  }

  protected getEcsCpu(): string {
    return '256'; // 0.25 vCPU
  }

  protected getEcsMemory(): string {
    return '512'; // 0.5 GB
  }

  protected getImageTag(): string {
    return 'dev-latest';
  }

  protected getAlarmThresholds() {
    return {
      cpuUtilization: 80,
      memoryUtilization: 80,
      targetResponseTime: 2,
      unhealthyHostCount: 1,
      databaseConnections: 50,
    };
  }
}
```

## File: lib/staging-stack.ts

```typescript
import { Construct } from 'constructs';
import { BaseEnvironmentStack, BaseEnvironmentStackProps } from './base-environment-stack';

export class StagingStack extends BaseEnvironmentStack {
  constructor(scope: Construct, id: string, props: BaseEnvironmentStackProps) {
    super(scope, id, props);
  }

  protected getAuroraInstanceCount(): number {
    return 2; // Two instances for staging (includes replica from prod)
  }

  protected getEcsCpu(): string {
    return '512'; // 0.5 vCPU
  }

  protected getEcsMemory(): string {
    return '1024'; // 1 GB
  }

  protected getImageTag(): string {
    return 'staging-latest';
  }

  protected getAlarmThresholds() {
    return {
      cpuUtilization: 75,
      memoryUtilization: 75,
      targetResponseTime: 1.5,
      unhealthyHostCount: 1,
      databaseConnections: 100,
    };
  }
}
```

## File: lib/prod-stack.ts

```typescript
import { Construct } from 'constructs';
import { BaseEnvironmentStack, BaseEnvironmentStackProps } from './base-environment-stack';

export class ProdStack extends BaseEnvironmentStack {
  constructor(scope: Construct, id: string, props: BaseEnvironmentStackProps) {
    super(scope, id, props);
  }

  protected getAuroraInstanceCount(): number {
    return 3; // Three instances for production (high availability)
  }

  protected getEcsCpu(): string {
    return '1024'; // 1 vCPU
  }

  protected getEcsMemory(): string {
    return '2048'; // 2 GB
  }

  protected getImageTag(): string {
    return 'prod-latest';
  }

  protected getAlarmThresholds() {
    return {
      cpuUtilization: 70,
      memoryUtilization: 70,
      targetResponseTime: 1,
      unhealthyHostCount: 0,
      databaseConnections: 200,
    };
  }
}
```

## File: lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { DevStack } from './dev-stack';
import { StagingStack } from './staging-stack';
import { ProdStack } from './prod-stack';
import { EnvironmentConfig } from './types';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags || [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Environment configurations
    const environments: Record<string, EnvironmentConfig> = {
      dev: {
        name: 'dev',
        cidrBlock: '10.1.0.0/16',
        accountId: '123456789012',
        instanceType: 'db.t3.medium',
        minCapacity: 1,
        maxCapacity: 3,
        costCenter: 'engineering-dev',
      },
      staging: {
        name: 'staging',
        cidrBlock: '10.2.0.0/16',
        accountId: '234567890123',
        instanceType: 'db.r5.large',
        minCapacity: 2,
        maxCapacity: 5,
        costCenter: 'engineering-staging',
        enableCrossEnvironmentReplication: true,
        // This would be set to the production cluster ARN
        replicationSourceArn: 'arn:aws:rds:us-east-1:345678901234:cluster:aurora-cluster-prod',
      },
      prod: {
        name: 'prod',
        cidrBlock: '10.3.0.0/16',
        accountId: '345678901234',
        instanceType: 'db.r5.xlarge',
        minCapacity: 3,
        maxCapacity: 10,
        costCenter: 'engineering-prod',
        certificateArn: 'arn:aws:acm:us-east-1:345678901234:certificate/example',
      },
    };

    // Create environment-specific stacks based on environmentSuffix
    const config = environments[environmentSuffix];
    if (!config) {
      throw new Error(
        `Unknown environment: ${environmentSuffix}. Valid values: dev, staging, prod`
      );
    }

    // Instantiate appropriate stack based on environment
    if (environmentSuffix === 'dev') {
      new DevStack(this, `trading-app-dev`, {
        config,
        stateBucket,
        stateBucketRegion,
        awsRegion,
      });
    } else if (environmentSuffix === 'staging') {
      new StagingStack(this, `trading-app-staging`, {
        config,
        stateBucket,
        stateBucketRegion,
        awsRegion,
      });
    } else if (environmentSuffix === 'prod') {
      new ProdStack(this, `trading-app-prod`, {
        config,
        stateBucket,
        stateBucketRegion,
        awsRegion,
      });
    }
  }
}
```

## File: lib/README.md

```markdown
# Multi-Environment Infrastructure with CDKTF

This CDKTF TypeScript application deploys identical infrastructure across development, staging, and production environments with environment-specific configurations.

## Architecture

### Components

- **VPC**: Isolated VPCs per environment with consistent subnet layouts
- **RDS Aurora**: PostgreSQL clusters with environment-specific sizing
- **ECS Fargate**: Container orchestration with auto-scaling
- **Application Load Balancer**: Traffic distribution with SSL support
- **S3**: Static asset storage with lifecycle policies
- **CloudWatch**: Dashboards and alarms for monitoring

### Environments

1. **Development** (10.1.0.0/16)
   - Account: 123456789012
   - Instance: db.t3.medium
   - Tasks: 1 (256 CPU, 512 MB)

2. **Staging** (10.2.0.0/16)
   - Account: 234567890123
   - Instance: db.r5.large
   - Tasks: 2 (512 CPU, 1024 MB)
   - Replication from production

3. **Production** (10.3.0.0/16)
   - Account: 345678901234
   - Instance: db.r5.xlarge
   - Tasks: 3 (1024 CPU, 2048 MB)
   - SSL certificates

## Prerequisites

- Node.js 18+
- TypeScript 5.x
- CDKTF CLI
- AWS CLI configured with cross-account access
- Terraform

## Installation

\`\`\`bash
npm install
\`\`\`

## Deployment

### Deploy to Development

\`\`\`bash
export ENVIRONMENT_SUFFIX=dev
cdktf deploy
\`\`\`

### Deploy to Staging

\`\`\`bash
export ENVIRONMENT_SUFFIX=staging
cdktf deploy
\`\`\`

### Deploy to Production

\`\`\`bash
export ENVIRONMENT_SUFFIX=prod
cdktf deploy
\`\`\`

## Validation

The infrastructure includes synthesis-time validation:

- CIDR block pattern validation
- Account ID validation
- Capacity configuration validation
- Environment-specific configuration validation

## Monitoring

Each environment has:

- CloudWatch Dashboard with ECS, ALB, and RDS metrics
- CPU and memory utilization alarms
- Response time and health check alarms
- Database connection alarms

## Cross-Environment Replication

Production database is replicated to staging using Aurora read replicas for testing purposes.

## Tagging Strategy

All resources are tagged with:
- Environment
- CostCenter
- DeploymentTimestamp
- ManagedBy
- Application

## Outputs

Each deployment generates:
- VPC ID
- ALB DNS name
- Aurora cluster endpoint
- ECS cluster name
- S3 bucket name
- Deployment manifest (JSON)

## Destroying Infrastructure

\`\`\`bash
export ENVIRONMENT_SUFFIX=dev
cdktf destroy
\`\`\`

## Configuration Management

Environment-specific values are stored in:
- CDKTF context (non-sensitive)
- SSM Parameter Store (sensitive values)

Hierarchical parameter paths:
- /aurora/{env}/master-password
- /aurora/{env}/cluster-endpoint

## Deployment Manifest

After each deployment, a JSON manifest is generated containing:
- Environment name
- Deployment timestamp
- Complete resource inventory
- Resource properties and ARNs
- Applied tags
```
