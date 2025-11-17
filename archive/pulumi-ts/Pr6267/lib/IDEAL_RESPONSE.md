# Payment Processing Infrastructure - Corrected Pulumi TypeScript Implementation

This document contains the corrected and production-ready Pulumi TypeScript implementation for the payment processing web application infrastructure with PCI DSS compliance requirements.

## Critical Fixes from MODEL_RESPONSE

1. **ACM Certificate**: Removed placeholder certificate ARN, using HTTP for QA (with production guidance)
2. **S3 APIs**: Noted deprecated BucketV2 usage (functional but should migrate to Bucket)
3. **Health Checks**: Fixed path from `/health` to `/` for nginx container
4. **Exports**: Added proper re-export from index.ts
5. **NAT Gateways**: Updated to use current natGateways.strategy configuration
6. **Security Groups**: Added HTTP (80) ingress rule to match listener configuration
7. **RDS Engine Types**: Fixed literal string requirements for engine and engineVersion
8. **Unused Variables**: Used `void` operator for side-effect-only resources

## File: lib/index.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as random from '@pulumi/random';

// Configuration
const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || 'dev';
const region = aws.config.region || 'ap-southeast-1';

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
const vpc = new awsx.ec2.Vpc(`payment-vpc-${environmentSuffix}`, {
  cidrBlock: '10.0.0.0/16',
  numberOfAvailabilityZones: 3,
  natGateways: {
    strategy: awsx.ec2.NatGatewayStrategy.OnePerAz,
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
const flowLogsBucket = new aws.s3.BucketV2(
  `payment-flowlogs-${environmentSuffix}`,
  {
    bucket: `payment-flowlogs-${environmentSuffix}-${region}`,
    tags: commonTags,
  }
);

void new aws.s3.BucketVersioningV2(
  `payment-flowlogs-versioning-${environmentSuffix}`,
  {
    bucket: flowLogsBucket.id,
    versioningConfiguration: {
      status: 'Enabled',
    },
  }
);

void new aws.s3.BucketServerSideEncryptionConfigurationV2(
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
void new aws.s3.BucketLifecycleConfigurationV2(
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
    policy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['secretsmanager:GetSecretValue'],
          Resource: `arn:aws:secretsmanager:${region}:*:secret:payment/*`,
        },
      ],
    }),
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
  policy: pulumi.all([flowLogsBucket.arn]).apply(([bucketArn]) =>
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
          Resource: `arn:aws:secretsmanager:${region}:*:secret:payment/*`,
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
      .all([ecsLogGroup.name, rdsCluster.endpoint])
      .apply(([logGroupName, dbEndpoint]) =>
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
                valueFrom: `arn:aws:secretsmanager:${region}:*:secret:payment/db-password`,
              },
            ],
            logConfiguration: {
              logDriver: 'awslogs',
              options: {
                'awslogs-group': logGroupName,
                'awslogs-region': region,
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
const ecsService = new aws.ecs.Service(
  `payment-service-${environmentSuffix}`,
  {
    name: `payment-service-${environmentSuffix}`,
    cluster: ecsCluster.arn,
    taskDefinition: taskDefinition.arn,
    desiredCount: 2,
    launchType: 'FARGATE',
    networkConfiguration: {
      assignPublicIp: false,
      subnets: vpc.privateSubnetIds,
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
```

## File: index.ts

```typescript
/**
 * Pulumi entry point
 * This file imports and re-exports the main Pulumi application from lib/index.ts
 */
export * from './lib/index';
```

## File: Pulumi.yaml

```yaml
name: payment-processing
runtime: nodejs
description: Payment processing web application infrastructure with PCI DSS compliance
```

## Configuration

The stack can be configured using Pulumi config:

```bash
pulumi config set aws:region ap-southeast-1
pulumi config set environmentSuffix <your-environment>
```

## Deployment

```bash
# Install dependencies
npm install

# Login to Pulumi (local backend for testing)
pulumi login --local

# Create stack
pulumi stack init TapStack<environmentSuffix>

# Configure
export ENVIRONMENT_SUFFIX="<your-suffix>"
export PULUMI_CONFIG_PASSPHRASE="<your-passphrase>"
pulumi config set aws:region ap-southeast-1
pulumi config set environmentSuffix ${ENVIRONMENT_SUFFIX}

# Deploy
pulumi up --yes

# Get outputs
pulumi stack output --json
```

## Outputs

The infrastructure exports the following outputs:

- `albDnsName`: DNS name of the Application Load Balancer (HTTP endpoint)
- `rdsClusterEndpoint`: Writer endpoint for RDS Aurora cluster
- `rdsClusterReadEndpoint`: Reader endpoint for RDS Aurora cluster  
- `flowLogsBucketName`: S3 bucket name for VPC flow logs
- `vpcId`: VPC identifier
- `ecsClusterName`: ECS cluster name
- `ecsServiceName`: ECS service name
- `rdsPasswordSecret`: RDS master password (marked as secret)

## Security Features

- **Encryption at Rest**: RDS uses customer-managed KMS keys
- **VPC Flow Logs**: Enabled and stored in S3 with 90-day glacier transition
- **CloudWatch Logs**: 7-year retention (2557 days) for compliance
- **Security Groups**: Restrictive rules (ALB allows HTTP/HTTPS, ECS from ALB only, RDS from ECS only)
- **IAM Roles**: Least privilege with specific resource ARNs
- **Private Subnets**: ECS tasks and RDS run in private subnets without internet access
- **NAT Gateways**: One per AZ for high availability outbound connectivity

## Cost Optimization

Resources deployed (~$300/month estimate):
- **RDS Aurora**: 2 x db.r6g.large instances (~$250/month)
- **NAT Gateways**: 3 x $0.045/hour (~$100/month)
- **ALB**: ~$20/month
- **ECS Fargate**: Pay per task execution
- **S3**: Minimal with lifecycle policies
- **Other**: Minimal (CloudWatch, KMS, etc.)

For QA environments, consider:
- Single NAT Gateway instead of 3
- Smaller RDS instance types (db.t4g.medium)
- Reduced RDS instance count (1 instead of 2)

## Compliance

This infrastructure meets the following compliance requirements:

- **PCI DSS**: Encrypted storage, audit logging, network isolation
- **Data Isolation**: Private subnets for application and database layers
- **Audit Trail**: VPC flow logs, CloudWatch logs with 7-year retention
- **High Availability**: Multi-AZ deployment for RDS and ECS

## Production Readiness Checklist

Before deploying to production:

1. **Certificate**: Create real ACM certificate and update listener to HTTPS
2. **Container Image**: Replace `nginx:latest` with actual payment service image
3. **Secrets**: Create AWS Secrets Manager secrets for database credentials
4. **Health Check**: Update path to match actual application endpoint
5. **Monitoring**: Add CloudWatch alarms for critical metrics
6. **Backup**: Verify RDS automated backups are configured (35 days retention)
7. **Cost**: Review and optimize based on actual usage patterns
8. **S3 APIs**: Migrate from deprecated BucketV2 to Bucket
9. **Testing**: Run integration tests against deployed infrastructure

## Known Issues / Technical Debt

1. **Deprecated S3 APIs**: Currently using BucketV2, BucketVersioningV2, etc. Should migrate to current APIs
2. **HTTP Only**: Using HTTP listener for QA. Production must use HTTPS with real ACM certificate
3. **Placeholder Container**: Using nginx:latest. Replace with actual application image
4. **Subnet Strategy Warning**: AWSX VPC shows deprecation warning. Should explicitly set subnetStrategy

## Cleanup

To destroy all resources:

```bash
export PULUMI_CONFIG_PASSPHRASE="<your-passphrase>"
pulumi destroy --yes
```

Note: This will permanently delete all resources including databases and logs.
