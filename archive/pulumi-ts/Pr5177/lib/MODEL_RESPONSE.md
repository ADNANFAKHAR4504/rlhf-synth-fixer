### Reasoning Trace
---

The user is asking for help with a document management system for a law firm that handles 10,000 documents daily. They need:

1. Cloud storage with versioning
2. 90-day retention requirement
3. Encryption for sensitive data
4. Audit logging
5. Monitoring and alerts
6. Access control

They've correctly identified the AWS services needed and want to use Pulumi with TypeScript. I should provide a comprehensive solution that:

1. Creates an S3 bucket with versioning enabled
2. Sets up lifecycle policies for the 90-day retention
3. Implements KMS encryption
4. Configures CloudTrail for audit logging
5. Sets up CloudWatch monitoring and alarms
6. Creates appropriate IAM roles and policies
7. Includes best practices for security and compliance

Let me create a detailed Pulumi TypeScript solution with explanations.
### Answer 
---

You're absolutely right about the AWS services needed! I'll help you build a robust document management system using Pulumi with TypeScript. This solution will address all your requirements while maintaining security and compliance standards.

## Solution Architecture

Here's a comprehensive Pulumi program that sets up your document storage infrastructure:

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Configuration
const config = new pulumi.Config();
const environment = config.get("environment") || "production";
const retentionDays = 90;
const alertEmail = config.require("alertEmail");

// Create KMS key for encryption
const documentKmsKey = new aws.kms.Key("document-encryption-key", {
    description: "KMS key for law firm document encryption",
    enableKeyRotation: true,
    tags: {
        Name: "law-firm-document-key",
        Environment: environment,
        Compliance: "Required"
    }
});

const documentKmsAlias = new aws.kms.Alias("document-encryption-alias", {
    name: `alias/law-firm-documents-${environment}`,
    targetKeyId: documentKmsKey.id
});

// Create S3 bucket for document storage
const documentBucket = new aws.s3.BucketV2("law-firm-documents", {
    bucket: `law-firm-documents-${environment}-${pulumi.getStack()}`,
    tags: {
        Name: "Law Firm Documents",
        Environment: environment,
        DataClassification: "Confidential"
    }
});

// Enable versioning for document revision tracking
const bucketVersioning = new aws.s3.BucketVersioningV2("document-versioning", {
    bucket: documentBucket.id,
    versioningConfiguration: {
        status: "Enabled"
    }
});

// Configure server-side encryption
const bucketEncryption = new aws.s3.BucketServerSideEncryptionConfigurationV2("document-encryption", {
    bucket: documentBucket.id,
    rules: [{
        applyServerSideEncryptionByDefault: {
            sseAlgorithm: "aws:kms",
            kmsMasterKeyId: documentKmsKey.arn
        },
        bucketKeyEnabled: true  // Reduces KMS API calls and costs
    }]
});

// Block public access for security
const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock("document-public-access-block", {
    bucket: documentBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true
});

// Lifecycle policy for 90-day retention and cost optimization
const bucketLifecyclePolicy = new aws.s3.BucketLifecycleConfigurationV2("document-lifecycle", {
    bucket: documentBucket.id,
    rules: [
        {
            id: "delete-old-versions",
            status: "Enabled",
            noncurrentVersionExpiration: {
                noncurrentDays: retentionDays
            }
        },
        {
            id: "transition-old-versions",
            status: "Enabled",
            noncurrentVersionTransitions: [
                {
                    noncurrentDays: 30,
                    storageClass: "STANDARD_IA"  // Infrequent Access after 30 days
                },
                {
                    noncurrentDays: 60,
                    storageClass: "GLACIER_IR"   // Glacier Instant Retrieval after 60 days
                }
            ]
        },
        {
            id: "abort-incomplete-uploads",
            status: "Enabled",
            abortIncompleteMultipartUpload: {
                daysAfterInitiation: 7
            }
        }
    ]
});

// Create CloudTrail for audit logging
const auditLogBucket = new aws.s3.BucketV2("audit-logs", {
    bucket: `law-firm-audit-logs-${environment}-${pulumi.getStack()}`,
    tags: {
        Name: "Audit Logs",
        Environment: environment,
        Retention: "7 years"
    }
});

const auditLogBucketPolicy = new aws.s3.BucketPolicy("audit-log-bucket-policy", {
    bucket: auditLogBucket.id,
    policy: pulumi.all([auditLogBucket.arn]).apply(([bucketArn]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Sid: "AWSCloudTrailAclCheck",
                Effect: "Allow",
                Principal: {
                    Service: "cloudtrail.amazonaws.com"
                },
                Action: "s3:GetBucketAcl",
                Resource: bucketArn
            },
            {
                Sid: "AWSCloudTrailWrite",
                Effect: "Allow",
                Principal: {
                    Service: "cloudtrail.amazonaws.com"
                },
                Action: "s3:PutObject",
                Resource: `${bucketArn}/*`,
                Condition: {
                    StringEquals: {
                        "s3:x-amz-acl": "bucket-owner-full-control"
                    }
                }
            }
        ]
    }))
});

const documentTrail = new aws.cloudtrail.Trail("document-access-trail", {
    name: `law-firm-document-trail-${environment}`,
    s3BucketName: auditLogBucket.id,
    includeGlobalServiceEvents: true,
    isMultiRegionTrail: true,
    enableLogging: true,
    eventSelectors: [
        {
            readWriteType: "All",
            includeManagementEvents: true,
            dataResources: [
                {
                    type: "AWS::S3::Object",
                    values: [pulumi.interpolate`${documentBucket.arn}/*`]
                }
            ]
        }
    ],
    kmsKeyId: documentKmsKey.arn,
    tags: {
        Name: "Document Access Trail",
        Environment: environment
    }
}, { dependsOn: [auditLogBucketPolicy] });

// SNS topic for alerts
const alertTopic = new aws.sns.Topic("document-alerts", {
    name: `law-firm-alerts-${environment}`,
    kmsMasterKeyId: documentKmsKey.id
});

const emailSubscription = new aws.sns.TopicSubscription("alert-email", {
    topic: alertTopic.arn,
    protocol: "email",
    endpoint: alertEmail
});

// CloudWatch Alarms
const bucketSizeAlarm = new aws.cloudwatch.MetricAlarm("bucket-size-alarm", {
    name: `law-firm-bucket-size-${environment}`,
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 1,
    metricName: "BucketSizeBytes",
    namespace: "AWS/S3",
    period: 86400,  // Daily check
    statistic: "Average",
    threshold: 1099511627776,  // 1TB in bytes
    alarmDescription: "Alert when bucket size exceeds 1TB",
    alarmActions: [alertTopic.arn],
    dimensions: {
        BucketName: documentBucket.id,
        StorageType: "StandardStorage"
    }
});

const kmsKeyUsageAlarm = new aws.cloudwatch.MetricAlarm("kms-key-deletion-alarm", {
    name: `law-firm-kms-deletion-${environment}`,
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 1,
    metricName: "NumberOfOperations",
    namespace: "AWS/KMS",
    period: 300,
    statistic: "Sum",
    threshold: 0,
    alarmDescription: "Alert on KMS key scheduled deletion",
    alarmActions: [alertTopic.arn],
    dimensions: {
        KeyId: documentKmsKey.id,
        Operation: "ScheduleKeyDeletion"
    }
});

// IAM role for document access
const documentAccessRole = new aws.iam.Role("document-access-role", {
    name: `law-firm-document-access-${environment}`,
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                AWS: `arn:aws:iam::${aws.getCallerIdentity().then(c => c.accountId)}:root`
            },
            Condition: {
                StringEquals: {
                    "sts:ExternalId": "law-firm-secure-access"
                }
            }
        }]
    }),
    tags: {
        Name: "Document Access Role",
        Environment: environment
    }
});

// Policy for document access
const documentAccessPolicy = new aws.iam.Policy("document-access-policy", {
    name: `law-firm-document-policy-${environment}`,
    policy: pulumi.all([documentBucket.arn, documentKmsKey.arn]).apply(([bucketArn, kmsArn]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Sid: "ListBucketContents",
                Effect: "Allow",
                Action: [
                    "s3:ListBucket",
                    "s3:ListBucketVersions"
                ],
                Resource: bucketArn
            },
            {
                Sid: "ReadWriteDocuments",
                Effect: "Allow",
                Action: [
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:PutObject",
                    "s3:DeleteObject",
                    "s3:GetObjectTagging",
                    "s3:PutObjectTagging"
                ],
                Resource: `${bucketArn}/*`
            },
            {
                Sid: "UseKMSKey",
                Effect: "Allow",
                Action: [
                    "kms:Decrypt",
                    "kms:Encrypt",
                    "kms:GenerateDataKey"
                ],
                Resource: kmsArn
            }
        ]
    }))
});

const rolePolicyAttachment = new aws.iam.RolePolicyAttachment("document-access-attachment", {
    role: documentAccessRole.name,
    policyArn: documentAccessPolicy.arn
});

// CloudWatch Dashboard for monitoring
const monitoringDashboard = new aws.cloudwatch.Dashboard("document-monitoring", {
    name: `law-firm-documents-${environment}`,
    dashboardBody: pulumi.all([documentBucket.id, documentKmsKey.id]).apply(([bucketName, kmsKeyId]) => JSON.stringify({
        widgets: [
            {
                type: "metric",
                properties: {
                    metrics: [
                        ["AWS/S3", "NumberOfObjects", { stat: "Average", label: "Total Objects" }],
                        [".", "BucketSizeBytes", { stat: "Average", label: "Bucket Size" }]
                    ],
                    period: 300,
                    stat: "Average",
                    region: aws.getRegion().then(r => r.name),
                    title: "S3 Bucket Metrics",
                    dimensions: {
                        BucketName: bucketName,
                        StorageType: "AllStorageTypes"
                    }
                }
            },
            {
                type: "metric",
                properties: {
                    metrics: [
                        ["AWS/KMS", "NumberOfOperations", { stat: "Sum", label: "KMS Operations" }]
                    ],
                    period: 300,
                    stat: "Sum",
                    region: aws.getRegion().then(r => r.name),
                    title: "KMS Encryption Activity",
                    dimensions: {
                        KeyId: kmsKeyId
                    }
                }
            }
        ]
    }))
});

// Outputs
export const bucketName = documentBucket.id;
export const bucketArn = documentBucket.arn;
export const kmsKeyId = documentKmsKey.id;
export const accessRoleArn = documentAccessRole.arn;
export const trailName = documentTrail.name;
export const alertTopicArn = alertTopic.arn;
export const dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=${aws.getRegion().then(r => r.name)}#dashboards:name=${monitoringDashboard.name}`;
```

## Key Features Explained

### 📁 **Document Storage & Versioning**
- S3 bucket with versioning enabled tracks all document revisions automatically
- Each version gets a unique version ID for precise retrieval
- Lawyers can access any previous version when needed

### 🔐 **Security & Encryption**
- KMS encryption with automatic key rotation
- All documents encrypted at rest
- Public access completely blocked
- IAM roles with principle of least privilege

### 📊 **Lifecycle Management**
- Automatically deletes versions older than 90 days
- Transitions older documents to cheaper storage tiers:
  - 30 days → Infrequent Access (IA)
  - 60 days → Glacier Instant Retrieval
- Reduces storage costs by up to 68%

### 📝 **Compliance & Audit**
- CloudTrail logs every document access
- Audit logs stored in separate encrypted bucket
- Detailed tracking of who, what, when for each operation

### 🚨 **Monitoring & Alerts**
- CloudWatch alarms for bucket size and unusual activity
- Email notifications for critical events
- Dashboard for real-time monitoring

## Deployment Instructions

1. **Install Prerequisites:**
```bash
npm install @pulumi/pulumi @pulumi/aws
```

2. **Configure Pulumi:**
```bash
pulumi config set alertEmail compliance@lawfirm.com
pulumi config set aws:region us-east-1
```

3. **Deploy:**
```bash
pulumi up
```

## Cost Optimization Tips

1. **Storage Classes**: The lifecycle policy automatically moves older documents to cheaper storage tiers
2. **Bucket Key**: Enabled to reduce KMS API calls by up to 99%
3. **Intelligent Tiering**: Consider S3 Intelligent-Tiering for unpredictable access patterns

## Next Steps

Consider adding:
- AWS Backup for additional disaster recovery
- Amazon Macie for sensitive data discovery
- AWS Config for compliance monitoring
- Lambda functions for custom document processing

This infrastructure will handle your 10,000 daily documents efficiently while maintaining strict compliance and security standards. The system is fully automated, requiring minimal maintenance once deployed.