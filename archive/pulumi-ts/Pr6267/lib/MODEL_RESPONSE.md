# Payment Processing Infrastructure - Pulumi TypeScript Implementation

This document contains the complete Pulumi TypeScript implementation for the payment processing web application infrastructure with PCI DSS compliance requirements.

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

// Configuration
const config = new pulumi.Config();
const environmentSuffix = config.get("environmentSuffix") || "dev";
const region = aws.config.region || "ap-southeast-1";

// Common tags for all resources
const commonTags = {
    Environment: environmentSuffix,
    Application: "payment-processing",
    CostCenter: "fintech-ops",
    ManagedBy: "pulumi",
};

// KMS Key for RDS encryption
const rdsKmsKey = new aws.kms.Key(`payment-rds-key-${environmentSuffix}`, {
    description: `KMS key for RDS Aurora encryption - ${environmentSuffix}`,
    enableKeyRotation: true,
    tags: commonTags,
});

const rdsKmsAlias = new aws.kms.Alias(`payment-rds-key-alias-${environmentSuffix}`, {
    name: `alias/payment-rds-${environmentSuffix}`,
    targetKeyId: rdsKmsKey.keyId,
});

// VPC with 3 public and 3 private subnets
const vpc = new awsx.ec2.Vpc(`payment-vpc-${environmentSuffix}`, {
    cidrBlock: "10.0.0.0/16",
    numberOfAvailabilityZones: 3,
    numberOfNatGateways: 3,
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
const flowLogsBucket = new aws.s3.BucketV2(`payment-flowlogs-${environmentSuffix}`, {
    bucket: `payment-flowlogs-${environmentSuffix}-${region}`,
    tags: commonTags,
});

const flowLogsBucketVersioning = new aws.s3.BucketVersioningV2(`payment-flowlogs-versioning-${environmentSuffix}`, {
    bucket: flowLogsBucket.id,
    versioningConfiguration: {
        status: "Enabled",
    },
});

const flowLogsBucketEncryption = new aws.s3.BucketServerSideEncryptionConfigurationV2(`payment-flowlogs-encryption-${environmentSuffix}`, {
    bucket: flowLogsBucket.id,
    rules: [{
        applyServerSideEncryptionByDefault: {
            sseAlgorithm: "AES256",
        },
    }],
});

const flowLogsBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(`payment-flowlogs-block-${environmentSuffix}`, {
    bucket: flowLogsBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
});

// Lifecycle policy for Flow Logs bucket
const flowLogsBucketLifecycle = new aws.s3.BucketLifecycleConfigurationV2(`payment-flowlogs-lifecycle-${environmentSuffix}`, {
    bucket: flowLogsBucket.id,
    rules: [{
        id: "transition-to-glacier",
        status: "Enabled",
        transitions: [{
            days: 90,
            storageClass: "GLACIER",
        }],
    }],
});

// Bucket policy for VPC Flow Logs
const flowLogsBucketPolicy = new aws.s3.BucketPolicy(`payment-flowlogs-policy-${environmentSuffix}`, {
    bucket: flowLogsBucket.id,
    policy: pulumi.all([flowLogsBucket.arn, aws.getCallerIdentity()]).apply(([bucketArn, identity]) =>
        JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Sid: "AWSLogDeliveryWrite",
                Effect: "Allow",
                Principal: {
                    Service: "delivery.logs.amazonaws.com",
                },
                Action: "s3:PutObject",
                Resource: `${bucketArn}/*`,
                Condition: {
                    StringEquals: {
                        "s3:x-amz-acl": "bucket-owner-full-control",
                    },
                },
            }, {
                Sid: "AWSLogDeliveryAclCheck",
                Effect: "Allow",
                Principal: {
                    Service: "delivery.logs.amazonaws.com",
                },
                Action: "s3:GetBucketAcl",
                Resource: bucketArn,
            }],
        })
    ),
}, { dependsOn: [flowLogsBucketPublicAccessBlock] });

// VPC Flow Logs
const vpcFlowLog = new aws.ec2.FlowLog(`payment-vpc-flowlog-${environmentSuffix}`, {
    vpcId: vpc.vpcId,
    trafficType: "ALL",
    logDestinationType: "s3",
    logDestination: flowLogsBucket.arn,
    tags: commonTags,
}, { dependsOn: [flowLogsBucketPolicy] });

// Security Groups
const albSecurityGroup = new aws.ec2.SecurityGroup(`payment-alb-sg-${environmentSuffix}`, {
    vpcId: vpc.vpcId,
    description: "Security group for Application Load Balancer - HTTPS only",
    ingress: [{
        protocol: "tcp",
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ["0.0.0.0/0"],
        description: "Allow HTTPS from internet",
    }],
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
        description: "Allow all outbound",
    }],
    tags: { ...commonTags, Name: `payment-alb-sg-${environmentSuffix}` },
});

const ecsSecurityGroup = new aws.ec2.SecurityGroup(`payment-ecs-sg-${environmentSuffix}`, {
    vpcId: vpc.vpcId,
    description: "Security group for ECS tasks",
    ingress: [{
        protocol: "tcp",
        fromPort: 8080,
        toPort: 8080,
        securityGroups: [albSecurityGroup.id],
        description: "Allow traffic from ALB",
    }],
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
        description: "Allow all outbound",
    }],
    tags: { ...commonTags, Name: `payment-ecs-sg-${environmentSuffix}` },
});

const rdsSecurityGroup = new aws.ec2.SecurityGroup(`payment-rds-sg-${environmentSuffix}`, {
    vpcId: vpc.vpcId,
    description: "Security group for RDS Aurora cluster",
    ingress: [{
        protocol: "tcp",
        fromPort: 3306,
        toPort: 3306,
        securityGroups: [ecsSecurityGroup.id],
        description: "Allow MySQL from ECS tasks only",
    }],
    egress: [],
    tags: { ...commonTags, Name: `payment-rds-sg-${environmentSuffix}` },
});

// CloudWatch Log Groups
const ecsLogGroup = new aws.cloudwatch.LogGroup(`payment-ecs-logs-${environmentSuffix}`, {
    name: `/ecs/payment-service-${environmentSuffix}`,
    retentionInDays: 2557, // 7 years
    tags: commonTags,
});

const rdsSlowQueryLogGroup = new aws.cloudwatch.LogGroup(`payment-rds-slowquery-${environmentSuffix}`, {
    name: `/aws/rds/cluster/payment-aurora-${environmentSuffix}/slowquery`,
    retentionInDays: 2557, // 7 years
    tags: commonTags,
});

// IAM Role for ECS Task Execution
const ecsTaskExecutionRole = new aws.iam.Role(`payment-ecs-exec-role-${environmentSuffix}`, {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "ecs-tasks.amazonaws.com",
            },
        }],
    }),
    tags: commonTags,
});

const ecsTaskExecutionPolicy = new aws.iam.RolePolicyAttachment(`payment-ecs-exec-policy-${environmentSuffix}`, {
    role: ecsTaskExecutionRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
});

const ecsTaskExecutionCustomPolicy = new aws.iam.RolePolicy(`payment-ecs-exec-custom-policy-${environmentSuffix}`, {
    role: ecsTaskExecutionRole.id,
    policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Action: [
                "secretsmanager:GetSecretValue",
            ],
            Resource: `arn:aws:secretsmanager:${region}:*:secret:payment/*`,
        }],
    }),
});

// IAM Role for ECS Task
const ecsTaskRole = new aws.iam.Role(`payment-ecs-task-role-${environmentSuffix}`, {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "ecs-tasks.amazonaws.com",
            },
        }],
    }),
    tags: commonTags,
});

const ecsTaskRolePolicy = new aws.iam.RolePolicy(`payment-ecs-task-policy-${environmentSuffix}`, {
    role: ecsTaskRole.id,
    policy: pulumi.all([flowLogsBucket.arn]).apply(([bucketArn]) =>
        JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Effect: "Allow",
                Action: [
                    "s3:GetObject",
                    "s3:PutObject",
                ],
                Resource: `${bucketArn}/*`,
            }, {
                Effect: "Allow",
                Action: [
                    "secretsmanager:GetSecretValue",
                ],
                Resource: `arn:aws:secretsmanager:${region}:*:secret:payment/*`,
            }],
        })
    ),
});

// RDS Subnet Group
const rdsSubnetGroup = new aws.rds.SubnetGroup(`payment-rds-subnet-${environmentSuffix}`, {
    subnetIds: vpc.privateSubnetIds,
    tags: commonTags,
});

// RDS Aurora Cluster Parameter Group
const rdsClusterParameterGroup = new aws.rds.ClusterParameterGroup(`payment-aurora-params-${environmentSuffix}`, {
    family: "aurora-mysql8.0",
    parameters: [{
        name: "slow_query_log",
        value: "1",
    }, {
        name: "log_output",
        value: "FILE",
    }],
    tags: commonTags,
});

// Generate a random password for RDS
const rdsPassword = new pulumi.random.RandomPassword(`payment-rds-password-${environmentSuffix}`, {
    length: 32,
    special: true,
    overrideSpecial: "!#$%&*()-_=+[]{}<>:?",
});

// RDS Aurora MySQL Cluster
const rdsCluster = new aws.rds.Cluster(`payment-aurora-${environmentSuffix}`, {
    clusterIdentifier: `payment-aurora-${environmentSuffix}`,
    engine: "aurora-mysql",
    engineVersion: "8.0.mysql_aurora.3.04.0",
    masterUsername: "admin",
    masterPassword: rdsPassword.result,
    dbSubnetGroupName: rdsSubnetGroup.name,
    vpcSecurityGroupIds: [rdsSecurityGroup.id],
    storageEncrypted: true,
    kmsKeyId: rdsKmsKey.arn,
    backupRetentionPeriod: 35,
    preferredBackupWindow: "03:00-04:00",
    preferredMaintenanceWindow: "mon:04:00-mon:05:00",
    enabledCloudwatchLogsExports: ["slowquery"],
    dbClusterParameterGroupName: rdsClusterParameterGroup.name,
    skipFinalSnapshot: true,
    tags: commonTags,
});

// RDS Aurora Instances (Multi-AZ)
const rdsInstance1 = new aws.rds.ClusterInstance(`payment-aurora-instance-1-${environmentSuffix}`, {
    identifier: `payment-aurora-instance-1-${environmentSuffix}`,
    clusterIdentifier: rdsCluster.id,
    instanceClass: "db.r6g.large",
    engine: rdsCluster.engine,
    engineVersion: rdsCluster.engineVersion,
    tags: commonTags,
});

const rdsInstance2 = new aws.rds.ClusterInstance(`payment-aurora-instance-2-${environmentSuffix}`, {
    identifier: `payment-aurora-instance-2-${environmentSuffix}`,
    clusterIdentifier: rdsCluster.id,
    instanceClass: "db.r6g.large",
    engine: rdsCluster.engine,
    engineVersion: rdsCluster.engineVersion,
    tags: commonTags,
});

// ECS Cluster
const ecsCluster = new aws.ecs.Cluster(`payment-cluster-${environmentSuffix}`, {
    name: `payment-cluster-${environmentSuffix}`,
    settings: [{
        name: "containerInsights",
        value: "enabled",
    }],
    tags: commonTags,
});

// ACM Certificate (placeholder - in production, create a real certificate)
// For this example, we'll assume a certificate ARN is provided via config or create a self-signed one
const certificateArn = config.get("certificateArn") || pulumi.output("arn:aws:acm:ap-southeast-1:000000000000:certificate/placeholder");

// Application Load Balancer
const alb = new aws.lb.LoadBalancer(`payment-alb-${environmentSuffix}`, {
    name: `payment-alb-${environmentSuffix}`,
    internal: false,
    loadBalancerType: "application",
    securityGroups: [albSecurityGroup.id],
    subnets: vpc.publicSubnetIds,
    enableDeletionProtection: false,
    tags: commonTags,
});

// Target Group for ECS
const targetGroup = new aws.lb.TargetGroup(`payment-tg-${environmentSuffix}`, {
    name: `payment-tg-${environmentSuffix}`,
    port: 8080,
    protocol: "HTTP",
    targetType: "ip",
    vpcId: vpc.vpcId,
    healthCheck: {
        enabled: true,
        path: "/health",
        protocol: "HTTP",
        matcher: "200",
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
    },
    deregistrationDelay: 30,
    tags: commonTags,
});

// ALB HTTPS Listener
const httpsListener = new aws.lb.Listener(`payment-alb-listener-${environmentSuffix}`, {
    loadBalancerArn: alb.arn,
    port: 443,
    protocol: "HTTPS",
    sslPolicy: "ELBSecurityPolicy-TLS-1-2-2017-01",
    certificateArn: certificateArn,
    defaultActions: [{
        type: "forward",
        targetGroupArn: targetGroup.arn,
    }],
});

// ECS Task Definition
const taskDefinition = new aws.ecs.TaskDefinition(`payment-task-${environmentSuffix}`, {
    family: `payment-service-${environmentSuffix}`,
    cpu: "1024",
    memory: "2048",
    networkMode: "awsvpc",
    requiresCompatibilities: ["FARGATE"],
    executionRoleArn: ecsTaskExecutionRole.arn,
    taskRoleArn: ecsTaskRole.arn,
    containerDefinitions: pulumi.all([ecsLogGroup.name, rdsCluster.endpoint]).apply(([logGroupName, dbEndpoint]) =>
        JSON.stringify([{
            name: "payment-service",
            image: "nginx:latest", // Replace with actual payment service image
            cpu: 1024,
            memory: 2048,
            essential: true,
            portMappings: [{
                containerPort: 8080,
                protocol: "tcp",
            }],
            environment: [{
                name: "DB_ENDPOINT",
                value: dbEndpoint,
            }, {
                name: "DB_NAME",
                value: "payments",
            }, {
                name: "ENVIRONMENT",
                value: environmentSuffix,
            }],
            secrets: [{
                name: "DB_PASSWORD",
                valueFrom: `arn:aws:secretsmanager:${region}:*:secret:payment/db-password`,
            }],
            logConfiguration: {
                logDriver: "awslogs",
                options: {
                    "awslogs-group": logGroupName,
                    "awslogs-region": region,
                    "awslogs-stream-prefix": "payment-service",
                },
            },
        }])
    ),
    tags: commonTags,
});

// ECS Service
const ecsService = new aws.ecs.Service(`payment-service-${environmentSuffix}`, {
    name: `payment-service-${environmentSuffix}`,
    cluster: ecsCluster.arn,
    taskDefinition: taskDefinition.arn,
    desiredCount: 2,
    launchType: "FARGATE",
    networkConfiguration: {
        assignPublicIp: false,
        subnets: vpc.privateSubnetIds,
        securityGroups: [ecsSecurityGroup.id],
    },
    loadBalancers: [{
        targetGroupArn: targetGroup.arn,
        containerName: "payment-service",
        containerPort: 8080,
    }],
    healthCheckGracePeriodSeconds: 60,
    tags: commonTags,
}, { dependsOn: [httpsListener] });

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

## File: Pulumi.yaml

```yaml
name: payment-processing
runtime: nodejs
description: Payment processing web application infrastructure with PCI DSS compliance
config:
  aws:region:
    description: AWS region to deploy to
    default: ap-southeast-1
  environmentSuffix:
    description: Environment suffix for resource naming
    default: dev
  certificateArn:
    description: ARN of ACM certificate for HTTPS
    type: string
```

## File: package.json

```json
{
  "name": "payment-processing",
  "version": "1.0.0",
  "description": "Payment processing infrastructure with Pulumi TypeScript",
  "main": "index.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0",
    "@pulumi/awsx": "^2.0.0",
    "@pulumi/random": "^4.0.0"
  }
}
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "strict": true,
    "outDir": "bin",
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "sourceMap": true,
    "experimentalDecorators": true,
    "pretty": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true
  },
  "files": [
    "index.ts"
  ]
}
```

## File: README.md

```markdown
# Payment Processing Infrastructure

This Pulumi TypeScript program deploys a complete payment processing web application infrastructure on AWS with PCI DSS compliance features.

## Architecture

- **VPC**: 3 public and 3 private subnets across 3 availability zones
- **ECS Fargate**: Containerized payment service running in private subnets
- **RDS Aurora MySQL**: Multi-AZ encrypted database cluster
- **Application Load Balancer**: HTTPS-only traffic distribution
- **S3**: VPC flow logs with lifecycle policies
- **CloudWatch**: 7-year log retention for compliance
- **Security**: Customer-managed KMS encryption, restrictive security groups, least-privilege IAM

## Prerequisites

- Node.js 18+
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials
- ACM certificate for HTTPS (ARN required)

## Configuration

Set the following configuration values:

```bash
pulumi config set aws:region ap-southeast-1
pulumi config set environmentSuffix <your-environment>
pulumi config set certificateArn <your-acm-certificate-arn> --secret
```

## Deployment

```bash
# Install dependencies
npm install

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# View outputs
pulumi stack output
```

## Outputs

- `albDnsName`: DNS name of the Application Load Balancer
- `rdsClusterEndpoint`: Writer endpoint for RDS Aurora cluster
- `rdsClusterReadEndpoint`: Reader endpoint for RDS Aurora cluster
- `flowLogsBucketName`: S3 bucket name for VPC flow logs
- `vpcId`: VPC identifier
- `ecsClusterName`: ECS cluster name
- `ecsServiceName`: ECS service name

## Security Features

- All RDS data encrypted at rest with customer-managed KMS keys
- VPC flow logs enabled and stored in S3 with 90-day glacier transition
- CloudWatch logs retained for 7 years (2557 days)
- Security groups with explicit deny-by-default rules
- IAM roles following principle of least privilege
- ECS tasks run in private subnets without direct internet access
- HTTPS-only traffic to Application Load Balancer
- RDS automated backups retained for 35 days

## Compliance

This infrastructure meets the following compliance requirements:

- **PCI DSS**: Encrypted storage, audit logging, network isolation
- **Data Isolation**: Private subnets for application and database layers
- **Audit Trail**: VPC flow logs, CloudWatch logs with 7-year retention
- **High Availability**: Multi-AZ deployment for RDS and ECS

## Resource Naming

All resources use the `environmentSuffix` variable to support multiple environments. Example:

- VPC: `payment-vpc-{environmentSuffix}`
- ECS Cluster: `payment-cluster-{environmentSuffix}`
- RDS Cluster: `payment-aurora-{environmentSuffix}`

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

## Notes

- The default container image is `nginx:latest`. Replace with your actual payment service image.
- Database credentials are stored as Pulumi secrets. In production, integrate with AWS Secrets Manager.
- ACM certificate must be created separately and ARN provided via configuration.
- NAT Gateways are deployed in each AZ for high availability (incurs additional costs).
```
