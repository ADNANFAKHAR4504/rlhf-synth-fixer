import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as pulumi from '@pulumi/pulumi';
import * as random from '@pulumi/random';

// Configuration
const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || 'dev';

// Get region dynamically
const currentRegion = aws.getRegionOutput();
const region = currentRegion.name;

// Common tags for all resources
const commonTags = {
  Environment: environmentSuffix,
  Application: 'payment-processing',
  CostCenter: 'fintech-ops',
  ManagedBy: 'pulumi',
};

// KMS Key for RDS encryption
const rdsKmsKey = new aws.kms.Key(`payment-rds-key-${environmentSuffix}`, {
  description: `KMS key for RDS Aurora encryption - ${environmentSuffix}`,
  enableKeyRotation: true,
  tags: commonTags,
});

void new aws.kms.Alias(`payment-rds-key-alias-${environmentSuffix}`, {
  name: `alias/payment-rds-${environmentSuffix}`,
  targetKeyId: rdsKmsKey.keyId,
});

// VPC with 3 public and 3 private subnets
// Note: Using None NAT strategy due to EIP account limits in test environment
const vpc = new awsx.ec2.Vpc(`payment-vpc-${environmentSuffix}`, {
  cidrBlock: '10.0.0.0/16',
  numberOfAvailabilityZones: 3,
  natGateways: {
    strategy: awsx.ec2.NatGatewayStrategy.None,
  },
  subnetSpecs: [
    {
      type: awsx.ec2.SubnetType.Public,
      cidrMask: 24,
    },
    {
      type: awsx.ec2.SubnetType.Private,
      cidrMask: 24,
    },
  ],
  tags: commonTags,
});

// S3 bucket for VPC Flow Logs
const flowLogsBucket = new aws.s3.Bucket(
  `payment-flowlogs-${environmentSuffix}`,
  {
    bucket: region.apply(r => `payment-flowlogs-${environmentSuffix}-${r}`),
    tags: commonTags,
  }
);

void new aws.s3.BucketVersioning(
  `payment-flowlogs-versioning-${environmentSuffix}`,
  {
    bucket: flowLogsBucket.id,
    versioningConfiguration: {
      status: 'Enabled',
    },
  }
);

void new aws.s3.BucketServerSideEncryptionConfiguration(
  `payment-flowlogs-encryption-${environmentSuffix}`,
  {
    bucket: flowLogsBucket.id,
    rules: [
      {
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: 'AES256',
        },
      },
    ],
  }
);

const flowLogsBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
  `payment-flowlogs-block-${environmentSuffix}`,
  {
    bucket: flowLogsBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  }
);

// Lifecycle policy for Flow Logs bucket
void new aws.s3.BucketLifecycleConfiguration(
  `payment-flowlogs-lifecycle-${environmentSuffix}`,
  {
    bucket: flowLogsBucket.id,
    rules: [
      {
        id: 'transition-to-glacier',
        status: 'Enabled',
        transitions: [
          {
            days: 90,
            storageClass: 'GLACIER',
          },
        ],
      },
    ],
  }
);

// Bucket policy for VPC Flow Logs
const flowLogsBucketPolicy = new aws.s3.BucketPolicy(
  `payment-flowlogs-policy-${environmentSuffix}`,
  {
    bucket: flowLogsBucket.id,
    policy: pulumi
      .all([flowLogsBucket.arn, aws.getCallerIdentity()])
      .apply(([bucketArn, _identity]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'AWSLogDeliveryWrite',
              Effect: 'Allow',
              Principal: {
                Service: 'delivery.logs.amazonaws.com',
              },
              Action: 's3:PutObject',
              Resource: `${bucketArn}/*`,
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
              Resource: bucketArn,
            },
          ],
        })
      ),
  },
  { dependsOn: [flowLogsBucketPublicAccessBlock] }
);

// VPC Flow Logs
void new aws.ec2.FlowLog(
  `payment-vpc-flowlog-${environmentSuffix}`,
  {
    vpcId: vpc.vpcId,
    trafficType: 'ALL',
    logDestinationType: 's3',
    logDestination: flowLogsBucket.arn,
    tags: commonTags,
  },
  { dependsOn: [flowLogsBucketPolicy] }
);

// Security Groups
const albSecurityGroup = new aws.ec2.SecurityGroup(
  `payment-alb-sg-${environmentSuffix}`,
  {
    vpcId: vpc.vpcId,
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
    tags: { ...commonTags, Name: `payment-alb-sg-${environmentSuffix}` },
  }
);

const ecsSecurityGroup = new aws.ec2.SecurityGroup(
  `payment-ecs-sg-${environmentSuffix}`,
  {
    vpcId: vpc.vpcId,
    description: 'Security group for ECS tasks',
    ingress: [
      {
        protocol: 'tcp',
        fromPort: 8080,
        toPort: 8080,
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
    tags: { ...commonTags, Name: `payment-ecs-sg-${environmentSuffix}` },
  }
);

const rdsSecurityGroup = new aws.ec2.SecurityGroup(
  `payment-rds-sg-${environmentSuffix}`,
  {
    vpcId: vpc.vpcId,
    description: 'Security group for RDS Aurora cluster',
    ingress: [
      {
        protocol: 'tcp',
        fromPort: 3306,
        toPort: 3306,
        securityGroups: [ecsSecurityGroup.id],
        description: 'Allow MySQL from ECS tasks only',
      },
    ],
    egress: [],
    tags: { ...commonTags, Name: `payment-rds-sg-${environmentSuffix}` },
  }
);

// CloudWatch Log Groups
const ecsLogGroup = new aws.cloudwatch.LogGroup(
  `payment-ecs-logs-${environmentSuffix}`,
  {
    name: `/ecs/payment-service-${environmentSuffix}`,
    retentionInDays: 2557, // 7 years
    tags: commonTags,
  }
);

void new aws.cloudwatch.LogGroup(`payment-rds-slowquery-${environmentSuffix}`, {
  name: `/aws/rds/cluster/payment-aurora-${environmentSuffix}/slowquery`,
  retentionInDays: 2557, // 7 years
  tags: commonTags,
});

// IAM Role for ECS Task Execution
const ecsTaskExecutionRole = new aws.iam.Role(
  `payment-ecs-exec-role-${environmentSuffix}`,
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
    tags: commonTags,
  }
);

void new aws.iam.RolePolicyAttachment(
  `payment-ecs-exec-policy-${environmentSuffix}`,
  {
    role: ecsTaskExecutionRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
  }
);

void new aws.iam.RolePolicy(
  `payment-ecs-exec-custom-policy-${environmentSuffix}`,
  {
    role: ecsTaskExecutionRole.id,
    policy: region.apply(r =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['secretsmanager:GetSecretValue'],
            Resource: `arn:aws:secretsmanager:${r}:*:secret:payment/*`,
          },
        ],
      })
    ),
  }
);

// IAM Role for ECS Task
const ecsTaskRole = new aws.iam.Role(
  `payment-ecs-task-role-${environmentSuffix}`,
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
    tags: commonTags,
  }
);

void new aws.iam.RolePolicy(`payment-ecs-task-policy-${environmentSuffix}`, {
  role: ecsTaskRole.id,
  policy: pulumi.all([flowLogsBucket.arn, region]).apply(([bucketArn, r]) =>
    JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['s3:GetObject', 's3:PutObject'],
          Resource: `${bucketArn}/*`,
        },
        {
          Effect: 'Allow',
          Action: ['secretsmanager:GetSecretValue'],
          Resource: `arn:aws:secretsmanager:${r}:*:secret:payment/*`,
        },
      ],
    })
  ),
});

// RDS Subnet Group
const rdsSubnetGroup = new aws.rds.SubnetGroup(
  `payment-rds-subnet-${environmentSuffix}`,
  {
    subnetIds: vpc.privateSubnetIds,
    tags: commonTags,
  }
);

// RDS Aurora Cluster Parameter Group
const rdsClusterParameterGroup = new aws.rds.ClusterParameterGroup(
  `payment-aurora-params-${environmentSuffix}`,
  {
    family: 'aurora-mysql8.0',
    parameters: [
      {
        name: 'slow_query_log',
        value: '1',
      },
      {
        name: 'log_output',
        value: 'FILE',
      },
    ],
    tags: commonTags,
  }
);

// Generate a random password for RDS
const rdsPassword = new random.RandomPassword(
  `payment-rds-password-${environmentSuffix}`,
  {
    length: 32,
    special: true,
    overrideSpecial: '!#$%&*()-_=+[]{}<>:?',
  }
);

// RDS Aurora MySQL Cluster
const rdsCluster = new aws.rds.Cluster(`payment-aurora-${environmentSuffix}`, {
  clusterIdentifier: `payment-aurora-${environmentSuffix}`,
  engine: 'aurora-mysql',
  engineVersion: '8.0.mysql_aurora.3.04.0',
  masterUsername: 'admin',
  masterPassword: rdsPassword.result,
  dbSubnetGroupName: rdsSubnetGroup.name,
  vpcSecurityGroupIds: [rdsSecurityGroup.id],
  storageEncrypted: true,
  kmsKeyId: rdsKmsKey.arn,
  backupRetentionPeriod: 35,
  preferredBackupWindow: '03:00-04:00',
  preferredMaintenanceWindow: 'mon:04:00-mon:05:00',
  enabledCloudwatchLogsExports: ['slowquery'],
  dbClusterParameterGroupName: rdsClusterParameterGroup.name,
  skipFinalSnapshot: true,
  tags: commonTags,
});

// RDS Aurora Instances (Multi-AZ)
void new aws.rds.ClusterInstance(
  `payment-aurora-instance-1-${environmentSuffix}`,
  {
    identifier: `payment-aurora-instance-1-${environmentSuffix}`,
    clusterIdentifier: rdsCluster.id,
    instanceClass: 'db.r6g.large',
    engine: 'aurora-mysql',
    engineVersion: '8.0.mysql_aurora.3.04.0',
    tags: commonTags,
  }
);

void new aws.rds.ClusterInstance(
  `payment-aurora-instance-2-${environmentSuffix}`,
  {
    identifier: `payment-aurora-instance-2-${environmentSuffix}`,
    clusterIdentifier: rdsCluster.id,
    instanceClass: 'db.r6g.large',
    engine: 'aurora-mysql',
    engineVersion: '8.0.mysql_aurora.3.04.0',
    tags: commonTags,
  }
);

// ECS Cluster
const ecsCluster = new aws.ecs.Cluster(`payment-cluster-${environmentSuffix}`, {
  name: `payment-cluster-${environmentSuffix}`,
  settings: [
    {
      name: 'containerInsights',
      value: 'enabled',
    },
  ],
  tags: commonTags,
});

// Application Load Balancer
const alb = new aws.lb.LoadBalancer(`payment-alb-${environmentSuffix}`, {
  name: `payment-alb-${environmentSuffix}`,
  internal: false,
  loadBalancerType: 'application',
  securityGroups: [albSecurityGroup.id],
  subnets: vpc.publicSubnetIds,
  enableDeletionProtection: false,
  tags: commonTags,
});

// Target Group for ECS
const targetGroup = new aws.lb.TargetGroup(`payment-tg-${environmentSuffix}`, {
  name: `payment-tg-${environmentSuffix}`,
  port: 8080,
  protocol: 'HTTP',
  targetType: 'ip',
  vpcId: vpc.vpcId,
  healthCheck: {
    enabled: true,
    path: '/',
    protocol: 'HTTP',
    matcher: '200-399',
    interval: 30,
    timeout: 5,
    healthyThreshold: 2,
    unhealthyThreshold: 3,
  },
  deregistrationDelay: 30,
  tags: commonTags,
});

// ALB HTTP Listener (QA environment - production should use HTTPS with real ACM certificate)
const httpListener = new aws.lb.Listener(
  `payment-alb-listener-${environmentSuffix}`,
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
  }
);

// ECS Task Definition
const taskDefinition = new aws.ecs.TaskDefinition(
  `payment-task-${environmentSuffix}`,
  {
    family: `payment-service-${environmentSuffix}`,
    cpu: '1024',
    memory: '2048',
    networkMode: 'awsvpc',
    requiresCompatibilities: ['FARGATE'],
    executionRoleArn: ecsTaskExecutionRole.arn,
    taskRoleArn: ecsTaskRole.arn,
    containerDefinitions: pulumi
      .all([ecsLogGroup.name, rdsCluster.endpoint, region])
      .apply(([logGroupName, dbEndpoint, r]) =>
        JSON.stringify([
          {
            name: 'payment-service',
            image: 'nginx:latest', // Replace with actual payment service image
            cpu: 1024,
            memory: 2048,
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
                value: 'payments',
              },
              {
                name: 'ENVIRONMENT',
                value: environmentSuffix,
              },
            ],
            secrets: [
              {
                name: 'DB_PASSWORD',
                valueFrom: `arn:aws:secretsmanager:${r}:*:secret:payment/db-password`,
              },
            ],
            logConfiguration: {
              logDriver: 'awslogs',
              options: {
                'awslogs-group': logGroupName,
                'awslogs-region': r,
                'awslogs-stream-prefix': 'payment-service',
              },
            },
          },
        ])
      ),
    tags: commonTags,
  }
);

// ECS Service
// Note: Using public subnets with public IP due to NAT Gateway EIP limits
const ecsService = new aws.ecs.Service(
  `payment-service-${environmentSuffix}`,
  {
    name: `payment-service-${environmentSuffix}`,
    cluster: ecsCluster.arn,
    taskDefinition: taskDefinition.arn,
    desiredCount: 2,
    launchType: 'FARGATE',
    networkConfiguration: {
      assignPublicIp: true,
      subnets: vpc.publicSubnetIds,
      securityGroups: [ecsSecurityGroup.id],
    },
    loadBalancers: [
      {
        targetGroupArn: targetGroup.arn,
        containerName: 'payment-service',
        containerPort: 8080,
      },
    ],
    healthCheckGracePeriodSeconds: 60,
    tags: commonTags,
  },
  { dependsOn: [httpListener] }
);

// Exports
export const albDnsName = alb.dnsName;
export const rdsClusterEndpoint = rdsCluster.endpoint;
export const rdsClusterReadEndpoint = rdsCluster.readerEndpoint;
export const flowLogsBucketName = flowLogsBucket.bucket;
export const vpcId = vpc.vpcId;
export const ecsClusterName = ecsCluster.name;
export const ecsServiceName = ecsService.name;
export const rdsPasswordSecret = pulumi.secret(rdsPassword.result);
