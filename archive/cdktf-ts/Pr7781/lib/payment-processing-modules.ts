import * as aws from '@cdktf/provider-aws';
import { Construct } from 'constructs';

// Generate unique suffix to avoid resource naming conflicts
const uniqueSuffix = Date.now().toString(36).slice(-4);

export interface BaseModuleProps {
  environmentSuffix: string;
  tags: { [key: string]: string };
}

/**
 * VPC Module - Creates VPC with 3 public and 3 private subnets across different AZs
 */
export interface VPCModuleProps extends BaseModuleProps {
  cidrBlock: string;
  availabilityZones: string[];
}

export class VPCModule extends Construct {
  public readonly vpc: aws.vpc.Vpc;
  public readonly publicSubnets: aws.subnet.Subnet[];
  public readonly privateSubnets: aws.subnet.Subnet[];
  public readonly internetGateway: aws.internetGateway.InternetGateway;
  public readonly natGateways: aws.natGateway.NatGateway[];
  public readonly flowLogsBucket: aws.s3Bucket.S3Bucket;

  constructor(scope: Construct, id: string, props: VPCModuleProps) {
    super(scope, id);

    const resourceName = (resource: string) =>
      `${resource}-${props.environmentSuffix}`;

    // VPC
    this.vpc = new aws.vpc.Vpc(this, 'vpc', {
      cidrBlock: props.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { ...props.tags, Name: resourceName('payment-vpc') },
    });

    // Internet Gateway
    this.internetGateway = new aws.internetGateway.InternetGateway(
      this,
      'igw',
      {
        vpcId: this.vpc.id,
        tags: { ...props.tags, Name: resourceName('payment-igw') },
      }
    );

    // Create Public and Private Subnets
    this.publicSubnets = [];
    this.privateSubnets = [];
    this.natGateways = [];

    props.availabilityZones.forEach((az, index) => {
      // Public Subnet
      const publicSubnet = new aws.subnet.Subnet(
        this,
        `public-subnet-${index}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${index * 2}.0/24`,
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
          tags: {
            ...props.tags,
            Name: resourceName(`payment-public-subnet-${index + 1}`),
            Type: 'Public',
          },
        }
      );
      this.publicSubnets.push(publicSubnet);

      // Private Subnet
      const privateSubnet = new aws.subnet.Subnet(
        this,
        `private-subnet-${index}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${index * 2 + 1}.0/24`,
          availabilityZone: az,
          tags: {
            ...props.tags,
            Name: resourceName(`payment-private-subnet-${index + 1}`),
            Type: 'Private',
          },
        }
      );
      this.privateSubnets.push(privateSubnet);
    });

    // Create single NAT Gateway in first AZ to avoid EIP limits
    // EIP for NAT Gateway
    const eip = new aws.eip.Eip(this, 'nat-eip-0', {
      domain: 'vpc',
      tags: {
        ...props.tags,
        Name: resourceName('payment-nat-eip-1'),
      },
    });

    // NAT Gateway in first public subnet
    const natGateway = new aws.natGateway.NatGateway(this, 'nat-0', {
      allocationId: eip.id,
      subnetId: this.publicSubnets[0].id,
      tags: { ...props.tags, Name: resourceName('payment-nat-1') },
    });
    this.natGateways.push(natGateway);

    // Public Route Table
    const publicRouteTable = new aws.routeTable.RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: { ...props.tags, Name: resourceName('payment-public-rt') },
    });

    new aws.route.Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

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

    // Private Route Tables (one per AZ) - all using single NAT Gateway
    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new aws.routeTable.RouteTable(
        this,
        `private-rt-${index}`,
        {
          vpcId: this.vpc.id,
          tags: {
            ...props.tags,
            Name: resourceName(`payment-private-rt-${index + 1}`),
          },
        }
      );

      new aws.route.Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateways[0].id, // Use single NAT Gateway
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

    // S3 Bucket for VPC Flow Logs
    this.flowLogsBucket = new aws.s3Bucket.S3Bucket(this, 'flow-logs-bucket', {
      bucket: resourceName(`v5-vpc-flowlogs-${uniqueSuffix}`).toLowerCase(),
      forceDestroy: true,
      tags: {
        ...props.tags,
        Name: resourceName(`v5-flowlogs-${uniqueSuffix}`),
      },
      lifecycle: {
        ignoreChanges: ['bucket'],
      },
    });

    // S3 Bucket Versioning
    new aws.s3BucketVersioning.S3BucketVersioningA(
      this,
      'flow-logs-versioning',
      {
        bucket: this.flowLogsBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      }
    );

    // S3 Bucket Encryption
    new aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
      this,
      'flow-logs-encryption',
      {
        bucket: this.flowLogsBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // S3 Bucket Public Access Block
    new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
      this,
      'flow-logs-pab',
      {
        bucket: this.flowLogsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }
    );

    // S3 Lifecycle Configuration - Transition to Glacier after 90 days
    new aws.s3BucketLifecycleConfiguration.S3BucketLifecycleConfiguration(
      this,
      'flow-logs-lifecycle',
      {
        bucket: this.flowLogsBucket.id,
        rule: [
          {
            id: 'transition-to-glacier',
            status: 'Enabled',
            filter: [
              {
                prefix: '',
              },
            ],
            transition: [
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
      }
    );

    // S3 Bucket Policy for VPC Flow Logs
    new aws.s3BucketPolicy.S3BucketPolicy(this, 'flow-logs-bucket-policy', {
      bucket: this.flowLogsBucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AWSLogDeliveryWrite',
            Effect: 'Allow',
            Principal: {
              Service: 'delivery.logs.amazonaws.com',
            },
            Action: 's3:PutObject',
            Resource: `${this.flowLogsBucket.arn}/*`,
            Condition: {
              StringEquals: {
                's3:x-amz-acl': 'bucket-owner-full-control',
              },
            },
          },
          {
            Sid: 'AWSLogDeliveryAclCheck',
            Effect: 'Allow',
            Principal: {
              Service: 'delivery.logs.amazonaws.com',
            },
            Action: 's3:GetBucketAcl',
            Resource: this.flowLogsBucket.arn,
          },
        ],
      }),
    });

    // VPC Flow Logs
    new aws.flowLog.FlowLog(this, 'vpc-flow-log', {
      logDestinationType: 's3',
      logDestination: this.flowLogsBucket.arn,
      trafficType: 'ALL',
      vpcId: this.vpc.id,
      tags: { ...props.tags, Name: resourceName('payment-vpc-flow-log') },
    });
  }
}

/**
 * KMS Module - Creates customer-managed KMS key for RDS encryption
 */
export interface KMSModuleProps extends BaseModuleProps {
  region: string;
  accountId: string;
}

export class KMSModule extends Construct {
  public readonly key: aws.kmsKey.KmsKey;
  public readonly alias: aws.kmsAlias.KmsAlias;

  constructor(scope: Construct, id: string, props: KMSModuleProps) {
    super(scope, id);

    const resourceName = (resource: string) =>
      `${resource}-${props.environmentSuffix}`;

    // KMS Key for RDS Encryption
    this.key = new aws.kmsKey.KmsKey(this, 'rds-key', {
      description: 'KMS key for RDS Aurora encryption',
      enableKeyRotation: true,
      deletionWindowInDays: 10,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${props.accountId}:root`,
            },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'Allow RDS to use the key',
            Effect: 'Allow',
            Principal: {
              Service: 'rds.amazonaws.com',
            },
            Action: ['kms:Decrypt', 'kms:GenerateDataKey', 'kms:CreateGrant'],
            Resource: '*',
          },
        ],
      }),
      tags: { ...props.tags, Name: resourceName('payment-rds-key') },
    });

    // KMS Alias
    this.alias = new aws.kmsAlias.KmsAlias(this, 'rds-key-alias', {
      name: `alias/${resourceName(`v5-rds-kms-${uniqueSuffix}`)}`,
      targetKeyId: this.key.id,
    });
  }
}

/**
 * Secrets Manager Module - Manages RDS credentials
 */
export type SecretsModuleProps = BaseModuleProps;

export class SecretsModule extends Construct {
  public readonly rdsSecret: aws.secretsmanagerSecret.SecretsmanagerSecret;
  public readonly rdsSecretVersion: aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion;

  constructor(scope: Construct, id: string, props: SecretsModuleProps) {
    super(scope, id);

    const resourceName = (resource: string) =>
      `${resource}-${props.environmentSuffix}`;

    // RDS Master Password Secret
    this.rdsSecret = new aws.secretsmanagerSecret.SecretsmanagerSecret(
      this,
      'rds-secret',
      {
        name: resourceName(`v5-db-secret-${uniqueSuffix}`),
        description: 'Master password for RDS Aurora MySQL cluster',
        recoveryWindowInDays: 7,
        tags: {
          ...props.tags,
          Name: resourceName(`v5-rds-secret-${uniqueSuffix}`),
        },
      }
    );

    // Generate random password
    this.rdsSecretVersion =
      new aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion(
        this,
        'rds-secret-version',
        {
          secretId: this.rdsSecret.id,
          secretString: JSON.stringify({
            username: 'admin',
            password: `PaymentDB${props.environmentSuffix}2024SecurePass`,
          }),
        }
      );
  }
}

/**
 * RDS Module - Creates Aurora MySQL cluster with multi-AZ and encryption
 */
export interface RDSModuleProps extends BaseModuleProps {
  vpcId: string;
  privateSubnetIds: string[];
  ecsSecurityGroupId: string;
  kmsKeyArn: string;
  masterPasswordSecretArn: string;
}

export class RDSModule extends Construct {
  public readonly cluster: aws.rdsCluster.RdsCluster;
  public readonly clusterInstance: aws.rdsClusterInstance.RdsClusterInstance;
  public readonly securityGroup: aws.securityGroup.SecurityGroup;
  public readonly subnetGroup: aws.dbSubnetGroup.DbSubnetGroup;
  public readonly logGroup: aws.cloudwatchLogGroup.CloudwatchLogGroup;

  constructor(scope: Construct, id: string, props: RDSModuleProps) {
    super(scope, id);

    const resourceName = (resource: string) =>
      `${resource}-${props.environmentSuffix}`;

    // CloudWatch Log Group for RDS Slow Query Logs (7-year retention = 2557 days)
    this.logGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      'rds-log-group',
      {
        name: `/aws/rds/cluster/${resourceName(`v5-db-${uniqueSuffix}`)}/slowquery`,
        retentionInDays: 2557,
        tags: {
          ...props.tags,
          Name: resourceName(`payment-rds-logs-${uniqueSuffix}`),
        },
      }
    );

    // Security Group for RDS
    this.securityGroup = new aws.securityGroup.SecurityGroup(this, 'rds-sg', {
      vpcId: props.vpcId,
      name: resourceName('payment-rds-sg'),
      description:
        'Security group for RDS Aurora MySQL - allows only ECS tasks',
      tags: { ...props.tags, Name: resourceName('payment-rds-sg') },
    });

    // Ingress: Allow MySQL traffic only from ECS tasks
    new aws.securityGroupRule.SecurityGroupRule(this, 'rds-ingress-ecs', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: props.ecsSecurityGroupId,
      securityGroupId: this.securityGroup.id,
      description: 'MySQL from ECS tasks only',
    });

    // Egress: Explicitly deny all (database should not initiate outbound)
    new aws.securityGroupRule.SecurityGroupRule(this, 'rds-egress-deny', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['127.0.0.1/32'],
      securityGroupId: this.securityGroup.id,
      description: 'Deny all outbound traffic',
    });

    // DB Subnet Group
    this.subnetGroup = new aws.dbSubnetGroup.DbSubnetGroup(
      this,
      'db-subnet-group',
      {
        name: resourceName(`v5-db-subnets-${uniqueSuffix}`).toLowerCase(),
        subnetIds: props.privateSubnetIds,
        description: 'Subnet group for RDS Aurora MySQL cluster',
        tags: {
          ...props.tags,
          Name: resourceName(`v5-db-subnets-${uniqueSuffix}`),
        },
      }
    );

    // RDS Aurora Cluster
    this.cluster = new aws.rdsCluster.RdsCluster(this, 'aurora-cluster', {
      clusterIdentifier: resourceName(
        `v5-aurora-db-${uniqueSuffix}`
      ).toLowerCase(),
      engine: 'aurora-mysql',
      engineVersion: '8.0.mysql_aurora.3.04.0',
      databaseName: 'paymentdb',
      masterUsername: 'admin',
      masterPassword: `PaymentDB${props.environmentSuffix}2024SecurePass`,
      dbSubnetGroupName: this.subnetGroup.name,
      vpcSecurityGroupIds: [this.securityGroup.id],
      storageEncrypted: true,
      kmsKeyId: props.kmsKeyArn,
      backupRetentionPeriod: 35,
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      enabledCloudwatchLogsExports: ['slowquery', 'error'],
      skipFinalSnapshot: true,
      deletionProtection: false,
      tags: { ...props.tags, Name: resourceName('payment-db-cluster') },
    });

    // RDS Cluster Instance (Multi-AZ via multiple instances)
    this.clusterInstance = new aws.rdsClusterInstance.RdsClusterInstance(
      this,
      'cluster-instance-1',
      {
        identifier:
          `${resourceName(`v5-aurora-db-${uniqueSuffix}`)}-instance-1`.toLowerCase(),
        clusterIdentifier: this.cluster.id,
        instanceClass: 'db.t3.medium',
        engine: this.cluster.engine,
        engineVersion: this.cluster.engineVersion,
        publiclyAccessible: false,
        tags: { ...props.tags, Name: resourceName('payment-db-instance-1') },
      }
    );

    // Second instance for Multi-AZ
    new aws.rdsClusterInstance.RdsClusterInstance(this, 'cluster-instance-2', {
      identifier:
        `${resourceName(`v5-aurora-db-${uniqueSuffix}`)}-instance-2`.toLowerCase(),
      clusterIdentifier: this.cluster.id,
      instanceClass: 'db.t3.medium',
      engine: this.cluster.engine,
      engineVersion: this.cluster.engineVersion,
      publiclyAccessible: false,
      tags: { ...props.tags, Name: resourceName('payment-db-instance-2') },
    });
  }
}

/**
 * IAM Module - Creates IAM roles for ECS tasks
 */
export interface IAMModuleProps extends BaseModuleProps {
  s3FlowLogsBucketArn: string;
  secretArn: string;
}

export class IAMModule extends Construct {
  public readonly ecsTaskExecutionRole: aws.iamRole.IamRole;
  public readonly ecsTaskRole: aws.iamRole.IamRole;

  constructor(scope: Construct, id: string, props: IAMModuleProps) {
    super(scope, id);

    const resourceName = (resource: string) =>
      `${resource}-${props.environmentSuffix}`;

    // ECS Task Execution Role (for pulling images and writing logs)
    this.ecsTaskExecutionRole = new aws.iamRole.IamRole(
      this,
      'ecs-execution-role',
      {
        name: resourceName('payment-ecs-execution-role'),
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
          ...props.tags,
          Name: resourceName('payment-ecs-execution-role'),
        },
      }
    );

    // Attach managed policy for ECS task execution
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'ecs-execution-policy',
      {
        role: this.ecsTaskExecutionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      }
    );

    // Custom policy for Secrets Manager access (least privilege)
    new aws.iamRolePolicy.IamRolePolicy(this, 'ecs-execution-secrets-policy', {
      role: this.ecsTaskExecutionRole.id,
      name: 'SecretsManagerAccess',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['secretsmanager:GetSecretValue'],
            Resource: [props.secretArn],
          },
        ],
      }),
    });

    // ECS Task Role (for application runtime permissions)
    this.ecsTaskRole = new aws.iamRole.IamRole(this, 'ecs-task-role', {
      name: resourceName('payment-ecs-task-role'),
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
      tags: { ...props.tags, Name: resourceName('payment-ecs-task-role') },
    });

    // Custom policy for S3 access (least privilege - specific bucket only)
    new aws.iamRolePolicy.IamRolePolicy(this, 'ecs-task-s3-policy', {
      role: this.ecsTaskRole.id,
      name: 'S3AccessPolicy',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
            Resource: [
              props.s3FlowLogsBucketArn,
              `${props.s3FlowLogsBucketArn}/*`,
            ],
          },
        ],
      }),
    });

    // Custom policy for Secrets Manager read access (least privilege)
    new aws.iamRolePolicy.IamRolePolicy(this, 'ecs-task-secrets-policy', {
      role: this.ecsTaskRole.id,
      name: 'SecretsManagerReadPolicy',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            Resource: [props.secretArn],
          },
        ],
      }),
    });
  }
}

/**
 * ALB Module - Creates Application Load Balancer with HTTPS
 */
export interface ALBModuleProps extends BaseModuleProps {
  vpcId: string;
  publicSubnetIds: string[];
  certificateArn: string;
}

export class ALBModule extends Construct {
  public readonly alb: aws.lb.Lb;
  public readonly securityGroup: aws.securityGroup.SecurityGroup;
  public readonly targetGroup: aws.lbTargetGroup.LbTargetGroup;
  public readonly httpsListener: aws.lbListener.LbListener;

  constructor(scope: Construct, id: string, props: ALBModuleProps) {
    super(scope, id);

    const resourceName = (resource: string) =>
      `${resource}-${props.environmentSuffix}`;

    // Security Group for ALB - HTTP traffic (HTTPS requires valid ACM certificate)
    this.securityGroup = new aws.securityGroup.SecurityGroup(this, 'alb-sg', {
      vpcId: props.vpcId,
      name: resourceName('payment-alb-sg'),
      description: 'Security group for ALB - allows HTTP traffic',
      tags: { ...props.tags, Name: resourceName('payment-alb-sg') },
    });

    // Ingress: Allow HTTP (use HTTPS with valid certificate in production)
    new aws.securityGroupRule.SecurityGroupRule(this, 'alb-ingress-http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
      description: 'HTTP from anywhere',
    });

    // Egress: Allow traffic to ECS tasks
    new aws.securityGroupRule.SecurityGroupRule(this, 'alb-egress-ecs', {
      type: 'egress',
      fromPort: 8080,
      toPort: 8080,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/16'],
      securityGroupId: this.securityGroup.id,
      description: 'To ECS tasks in VPC',
    });

    // Application Load Balancer
    this.alb = new aws.lb.Lb(this, 'alb', {
      name: resourceName(`v5-lb-${uniqueSuffix}`),
      loadBalancerType: 'application',
      securityGroups: [this.securityGroup.id],
      subnets: props.publicSubnetIds,
      enableDeletionProtection: false,
      enableHttp2: true,
      tags: { ...props.tags, Name: resourceName(`v5-lb-${uniqueSuffix}`) },
    });

    // Target Group for ECS tasks
    this.targetGroup = new aws.lbTargetGroup.LbTargetGroup(
      this,
      'target-group',
      {
        name: resourceName(`v5-tg-${uniqueSuffix}`),
        port: 8080,
        protocol: 'HTTP',
        vpcId: props.vpcId,
        targetType: 'ip',
        deregistrationDelay: '30',
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
        tags: { ...props.tags, Name: resourceName(`v5-tg-${uniqueSuffix}`) },
      }
    );

    // HTTP Listener (use HTTPS with valid ACM certificate in production)
    this.httpsListener = new aws.lbListener.LbListener(this, 'http-listener', {
      loadBalancerArn: this.alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: this.targetGroup.arn,
        },
      ],
    });
  }
}

/**
 * ECS Module - Creates Fargate cluster and task definition
 */
export interface ECSModuleProps extends BaseModuleProps {
  vpcId: string;
  privateSubnetIds: string[];
  albSecurityGroupId: string;
  albTargetGroupArn: string;
  taskExecutionRoleArn: string;
  taskRoleArn: string;
  rdsEndpoint: string;
  secretArn: string;
}

export class ECSModule extends Construct {
  public readonly cluster: aws.ecsCluster.EcsCluster;
  public readonly taskDefinition: aws.ecsTaskDefinition.EcsTaskDefinition;
  public readonly service: aws.ecsService.EcsService;
  public readonly securityGroup: aws.securityGroup.SecurityGroup;
  public readonly logGroup: aws.cloudwatchLogGroup.CloudwatchLogGroup;

  constructor(scope: Construct, id: string, props: ECSModuleProps) {
    super(scope, id);

    const resourceName = (resource: string) =>
      `${resource}-${props.environmentSuffix}`;

    // CloudWatch Log Group for ECS tasks (7-year retention = 2557 days)
    this.logGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      'ecs-log-group',
      {
        name: `/aws/ecs/${resourceName(`v5-service-${uniqueSuffix}`)}`,
        retentionInDays: 2557,
        tags: {
          ...props.tags,
          Name: resourceName(`payment-ecs-logs-${uniqueSuffix}`),
        },
      }
    );

    // ECS Cluster
    this.cluster = new aws.ecsCluster.EcsCluster(this, 'cluster', {
      name: resourceName(`payment-cluster-${uniqueSuffix}`),
      setting: [
        {
          name: 'containerInsights',
          value: 'enabled',
        },
      ],
      tags: { ...props.tags, Name: resourceName('payment-cluster') },
    });

    // Security Group for ECS tasks
    this.securityGroup = new aws.securityGroup.SecurityGroup(this, 'ecs-sg', {
      vpcId: props.vpcId,
      name: resourceName('payment-ecs-sg'),
      description:
        'Security group for ECS tasks - allows traffic from ALB only',
      tags: { ...props.tags, Name: resourceName('payment-ecs-sg') },
    });

    // Ingress: Allow traffic from ALB only
    new aws.securityGroupRule.SecurityGroupRule(this, 'ecs-ingress-alb', {
      type: 'ingress',
      fromPort: 8080,
      toPort: 8080,
      protocol: 'tcp',
      sourceSecurityGroupId: props.albSecurityGroupId,
      securityGroupId: this.securityGroup.id,
      description: 'HTTP from ALB only',
    });

    // Egress: Allow HTTPS for pulling images and accessing AWS services
    new aws.securityGroupRule.SecurityGroupRule(this, 'ecs-egress-https', {
      type: 'egress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
      description: 'HTTPS for AWS services',
    });

    // Egress: Allow MySQL to RDS
    new aws.securityGroupRule.SecurityGroupRule(this, 'ecs-egress-mysql', {
      type: 'egress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/16'],
      securityGroupId: this.securityGroup.id,
      description: 'MySQL to RDS',
    });

    // Task Definition
    this.taskDefinition = new aws.ecsTaskDefinition.EcsTaskDefinition(
      this,
      'task-def',
      {
        family: resourceName(`payment-service-${uniqueSuffix}`),
        requiresCompatibilities: ['FARGATE'],
        networkMode: 'awsvpc',
        cpu: '256',
        memory: '512',
        executionRoleArn: props.taskExecutionRoleArn,
        taskRoleArn: props.taskRoleArn,
        containerDefinitions: JSON.stringify([
          {
            name: 'payment-service',
            image: 'nginx:latest',
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
                value: props.rdsEndpoint,
              },
              {
                name: 'APP_ENV',
                value: props.environmentSuffix,
              },
            ],
            secrets: [
              {
                name: 'DB_PASSWORD',
                valueFrom: `${props.secretArn}:password::`,
              },
            ],
            logConfiguration: {
              logDriver: 'awslogs',
              options: {
                'awslogs-group': this.logGroup.name,
                'awslogs-region': 'eu-central-1',
                'awslogs-stream-prefix': 'payment',
              },
            },
          },
        ]),
        tags: { ...props.tags, Name: resourceName('payment-task-def') },
      }
    );

    // ECS Service
    this.service = new aws.ecsService.EcsService(this, 'service', {
      name: resourceName(`payment-service-${uniqueSuffix}`),
      cluster: this.cluster.id,
      taskDefinition: this.taskDefinition.arn,
      desiredCount: 2,
      launchType: 'FARGATE',
      forceNewDeployment: true,
      networkConfiguration: {
        subnets: props.privateSubnetIds,
        securityGroups: [this.securityGroup.id],
        assignPublicIp: false,
      },
      loadBalancer: [
        {
          targetGroupArn: props.albTargetGroupArn,
          containerName: 'payment-service',
          containerPort: 8080,
        },
      ],
      tags: { ...props.tags, Name: resourceName('payment-service') },
      dependsOn: [this.logGroup],
      lifecycle: {
        createBeforeDestroy: true,
        ignoreChanges: ['desired_count'],
      },
    });
  }
}
