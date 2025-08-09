# Secure AWS Environment with Pulumi & TypeScript

I'll create a comprehensive Pulumi TypeScript project that implements all the security requirements you've specified. Let me break this down into the required file structure with proper modularization and security hardening.

## Project Structure

```
├── Pulumi.yaml
├── Pulumi.dev.yaml
├── Pulumi.prod.yaml
├── tap-stack.ts
├── secureS3Bucket.ts
└── package.json
```

## File Contents

### `Pulumi.yaml`

```yaml
name: secure-aws-environment
runtime: nodejs
description: Production-ready secure AWS environment with S3, IAM, and CloudWatch
config:
  aws:region:
    description: AWS region to deploy resources
    default: us-east-1
  environmentSuffix:
    description: Environment suffix for resource naming (development/production)
    default: development
```

### `Pulumi.dev.yaml`

```yaml
config:
  aws:region: us-east-1
  secure-aws-environment:environmentSuffix: development
```

### `Pulumi.prod.yaml`

```yaml
config:
  aws:region: us-east-1
  secure-aws-environment:environmentSuffix: production
```

### `secureS3Bucket.ts`

```typescript
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export interface SecureS3BucketArgs {
    bucketName: string;
    environment: string;
    tags?: { [key: string]: string };
}

export class SecureS3Bucket extends pulumi.ComponentResource {
    public readonly bucket: aws.s3.Bucket;
    public readonly bucketVersioning: aws.s3.BucketVersioningV2;
    public readonly bucketEncryption: aws.s3.BucketServerSideEncryptionConfigurationV2;
    public readonly bucketPublicAccessBlock: aws.s3.BucketPublicAccessBlock;

    constructor(name: string, args: SecureS3BucketArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:aws:SecureS3Bucket", name, {}, opts);

        // Mandatory tags with user-provided tags
        const defaultTags = {
            Department: "Security",
            Project: "PulumiIaCProject",
            Environment: args.environment,
            ...args.tags
        };

        // Create S3 bucket with proper naming convention
        this.bucket = new aws.s3.Bucket(`${args.bucketName}-${args.environment}`, {
            bucket: `${args.bucketName}-${args.environment}`,
            tags: defaultTags,
        }, { parent: this });

        // Enable versioning (mandatory security requirement)
        this.bucketVersioning = new aws.s3.BucketVersioningV2(`${args.bucketName}-${args.environment}-versioning`, {
            bucket: this.bucket.id,
            versioningConfiguration: {
                status: "Enabled",
            },
        }, { parent: this });

        // Enable server-side encryption with AES256 (mandatory security requirement)
        this.bucketEncryption = new aws.s3.BucketServerSideEncryptionConfigurationV2(`${args.bucketName}-${args.environment}-encryption`, {
            bucket: this.bucket.id,
            serverSideEncryptionConfiguration: {
                rules: [{
                    applyServerSideEncryptionByDefault: {
                        sseAlgorithm: "AES256",
                    },
                    bucketKeyEnabled: true,
                }],
            },
        }, { parent: this });

        // Block all public access (mandatory security requirement)
        this.bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(`${args.bucketName}-${args.environment}-public-access-block`, {
            bucket: this.bucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        }, { parent: this });

        // Register outputs
        this.registerOutputs({
            bucketId: this.bucket.id,
            bucketArn: this.bucket.arn,
            bucketName: this.bucket.bucket,
        });
    }

    public getBucketArn(): pulumi.Output<string> {
        return this.bucket.arn;
    }

    public getBucketName(): pulumi.Output<string> {
        return this.bucket.bucket;
    }
}

// Helper function for creating secure S3 buckets
export function createSecureS3Bucket(
    name: string, 
    bucketName: string, 
    environment: string, 
    additionalTags?: { [key: string]: string }
): SecureS3Bucket {
    return new SecureS3Bucket(name, {
        bucketName,
        environment,
        tags: additionalTags,
    });
}
```

### `tap-stack.ts`

```typescript
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { SecureS3Bucket } from "./secureS3Bucket";

// Read configuration
const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");

// Validate environment suffix
if (!["development", "production"].includes(environmentSuffix)) {
    throw new Error("environmentSuffix must be either 'development' or 'production'");
}

// Common tags for all resources
const commonTags = {
    Department: "Security",
    Project: "PulumiIaCProject",
    Environment: environmentSuffix,
    ManagedBy: "Pulumi",
};

// Part 1: Create Secure S3 Buckets for both environments
const appDataBucket = new SecureS3Bucket(`app-data-secure-bucket`, {
    bucketName: "app-data",
    environment: environmentSuffix,
    tags: commonTags,
});

// Part 2: IAM Role with Least Privilege Access
const applicationRole = new aws.iam.Role(`app-reader-role-${environmentSuffix}`, {
    name: `app-reader-role-${environmentSuffix}`,
    path: "/applications/",
    description: `Read-only access to the application data bucket for the ${environmentSuffix} environment`,
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "ec2.amazonaws.com",
            },
        }],
    }),
    tags: commonTags,
});

// IAM Policy with Least Privilege - scoped to specific bucket ARN
const applicationPolicy = new aws.iam.RolePolicy(`app-reader-policy-${environmentSuffix}`, {
    name: `app-reader-policy-${environmentSuffix}`,
    role: applicationRole.id,
    policy: pulumi.all([appDataBucket.getBucketArn()]).apply(([bucketArn]) => 
        JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Action: [
                        "s3:GetObject",
                        "s3:ListBucket"
                    ],
                    Resource: [
                        bucketArn,
                        `${bucketArn}/*`
                    ]
                }
            ]
        })
    ),
});

// Part 3: CloudWatch Auditing Setup (only for production environment)
let cloudWatchResources: any = {};

if (environmentSuffix === "production") {
    // CloudWatch Log Group for audit logging
    const auditLogGroup = new aws.cloudwatch.LogGroup(`audit-log-group-${environmentSuffix}`, {
        name: `/aws/events/s3-audit-${environmentSuffix}`,
        retentionInDays: 30,
        tags: commonTags,
    });

    // CloudWatch Metric Alarm for S3 bucket monitoring
    const s3MetricAlarm = new aws.cloudwatch.MetricAlarm(`s3-objects-alarm-${environmentSuffix}`, {
        name: `s3-objects-alarm-${environmentSuffix}`,
        description: `Monitor number of objects in ${environmentSuffix} S3 bucket`,
        metricName: "NumberOfObjects",
        namespace: "AWS/S3",
        statistic: "Average",
        period: 86400, // 24 hours
        evaluationPeriods: 1,
        threshold: 1000,
        comparisonOperator: "GreaterThanThreshold",
        dimensions: {
            BucketName: appDataBucket.getBucketName(),
            StorageType: "AllStorageTypes",
        },
        tags: commonTags,
    });

    // EventBridge Rule to capture alarm state changes
    const alarmStateChangeRule = new aws.cloudwatch.EventRule(`alarm-state-change-rule-${environmentSuffix}`, {
        name: `alarm-state-change-rule-${environmentSuffix}`,
        description: "Capture CloudWatch alarm state changes for auditing",
        eventPattern: JSON.stringify({
            source: ["aws.cloudwatch"],
            "detail-type": ["CloudWatch Alarm State Change"],
            detail: {
                "alarm-name": [s3MetricAlarm.name],
                state: {
                    value: ["ALARM", "OK", "INSUFFICIENT_DATA"]
                }
            }
        }),
        tags: commonTags,
    });

    // EventBridge Target - Send events to CloudWatch Logs
    const eventBridgeLogTarget = new aws.cloudwatch.EventTarget(`alarm-log-target-${environmentSuffix}`, {
        rule: alarmStateChangeRule.name,
        targetId: `alarm-log-target-${environmentSuffix}`,
        arn: auditLogGroup.arn,
    });

    // IAM Role for EventBridge to write to CloudWatch Logs
    const eventBridgeLogRole = new aws.iam.Role(`eventbridge-log-role-${environmentSuffix}`, {
        name: `eventbridge-log-role-${environmentSuffix}`,
        path: "/service-role/",
        description: "Allow EventBridge to write to CloudWatch Logs",
        assumeRolePolicy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Action: "sts:AssumeRole",
                Effect: "Allow",
                Principal: {
                    Service: "events.amazonaws.com",
                },
            }],
        }),
        tags: commonTags,
    });

    // IAM Policy for EventBridge to write to CloudWatch Logs
    const eventBridgeLogPolicy = new aws.iam.RolePolicy(`eventbridge-log-policy-${environmentSuffix}`, {
        name: `eventbridge-log-policy-${environmentSuffix}`,
        role: eventBridgeLogRole.id,
        policy: pulumi.all([auditLogGroup.arn]).apply(([logGroupArn]) =>
            JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Action: [
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    Resource: `${logGroupArn}:*`
                }]
            })
        ),
    });

    cloudWatchResources = {
        auditLogGroup,
        s3MetricAlarm,
        alarmStateChangeRule,
        eventBridgeLogTarget,
        eventBridgeLogRole,
        eventBridgeLogPolicy,
    };
}

// Exports
export const bucketName = appDataBucket.getBucketName();
export const bucketArn = appDataBucket.getBucketArn();
export const iamRoleArn = applicationRole.arn;
export const iamRoleName = applicationRole.name;
export const environment = environmentSuffix;

// Conditional exports for production environment
if (environmentSuffix === "production") {
    export const auditLogGroupName = cloudWatchResources.auditLogGroup.name;
    export const metricAlarmName = cloudWatchResources.s3MetricAlarm.name;
    export const eventRuleName = cloudWatchResources.alarmStateChangeRule.name;
}
```

### `package.json`

```json
{
    "name": "secure-aws-environment",
    "version": "1.0.0",
    "description": "Production-ready secure AWS environment with Pulumi",
    "main": "tap-stack.ts",
    "scripts": {
        "build": "tsc",
        "dev:preview": "pulumi preview --stack dev",
        "dev:up": "pulumi up --stack dev",
        "prod:preview": "pulumi preview --stack prod",
        "prod:up": "pulumi up --stack prod"
    },
    "devDependencies": {
        "@types/node": "^18.0.0",
        "typescript": "^4.9.0"
    },
    "dependencies": {
        "@pulumi/aws": "^6.0.0",
        "@pulumi/pulumi": "^3.0.0"
    }
}
```

## Key Security Features Implemented

### ✅ **Mandatory Constraints Checklist**

1. **S3 Encryption**: All S3 buckets use AES256 algorithm for server-side encryption
2. **S3 Versioning**: Versioning is enabled on all S3 buckets to protect against accidental deletion
3. **IAM Role Metadata**: All IAM roles have defined paths (`/applications/`, `/service-role/`) and descriptive purposes
4. **CloudWatch Logging**: EventBridge rule captures alarm state changes and logs them to CloudWatch Log Group
5. **Least Privilege**: IAM policies are scoped to specific actions (`s3:GetObject`, `s3:ListBucket`) and specific bucket ARNs
6. **Tagging & Naming**: All resources follow the `<resource>-<environment>` naming convention and include mandatory tags

### 🔒 **Security Hardening Features**

- **Public Access Blocking**: All S3 buckets explicitly block public access
- **Environment Isolation**: Development and production resources are completely isolated
- **Audit Trail**: Production environment includes comprehensive CloudWatch monitoring and logging
- **Resource Scoping**: IAM policies are narrowly scoped to specific bucket ARNs per environment
- **Modular Design**: Reusable `SecureS3Bucket` component ensures consistent security configurations

### 🚀 **Usage Instructions**

```bash
# Initialize the project
pulumi stack init dev
pulumi stack init prod

# Deploy to development
pulumi up --stack dev

# Deploy to production  
pulumi up --stack prod
```

This implementation provides a production-ready, security-hardened AWS environment that follows Infrastructure as Code best practices with comprehensive auditing and least-privilege access controls.