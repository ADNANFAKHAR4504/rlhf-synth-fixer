# IDEAL_RESPONSE - Production-Ready Implementation

This file contains the corrected, production-ready implementation of the AWS Resource Tagging Compliance Audit system.

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as path from "path";

const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");

// S3 bucket for storing compliance reports with forceDestroy
const reportsBucket = new aws.s3.Bucket(`tagging-audit-reports-${environmentSuffix}`, {
    bucket: `tagging-audit-reports-${environmentSuffix}`,
    forceDestroy: true,
    serverSideEncryptionConfiguration: {
        rule: {
            applyServerSideEncryptionByDefault: {
                sseAlgorithm: "AES256",
            },
        },
    },
    tags: {
        Environment: "audit",
        Purpose: "tagging-compliance",
    },
});

// Block public access to S3 bucket
const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(`tagging-audit-reports-block-${environmentSuffix}`, {
    bucket: reportsBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
});

// IAM role for Lambda
const lambdaRole = new aws.iam.Role(`tagging-audit-role-${environmentSuffix}`, {
    name: `tagging-audit-role-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "lambda.amazonaws.com",
            },
        }],
    }),
});

// Attach policies to Lambda role
const lambdaPolicyAttachment = new aws.iam.RolePolicyAttachment(`tagging-audit-policy-${environmentSuffix}`, {
    role: lambdaRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
});

// Custom inline policy for resource scanning
const scannerPolicy = new aws.iam.RolePolicy(`tagging-audit-scanner-policy-${environmentSuffix}`, {
    role: lambdaRole.id,
    policy: pulumi.all([reportsBucket.arn]).apply(([bucketArn]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Action: [
                    "ec2:DescribeInstances",
                    "ec2:DescribeTags",
                    "rds:DescribeDBInstances",
                    "rds:ListTagsForResource",
                    "s3:ListAllMyBuckets",
                    "s3:GetBucketTagging",
                    "s3:GetBucketLocation",
                    "tag:GetResources",
                    "pricing:GetProducts",
                    "cloudformation:DescribeStacks",
                    "cloudformation:DescribeStackResources",
                ],
                Resource: "*",
            },
            {
                Effect: "Allow",
                Action: [
                    "s3:PutObject",
                ],
                Resource: `${bucketArn}/*`,
            },
            {
                Effect: "Allow",
                Action: [
                    "cloudwatch:PutMetricData",
                ],
                Resource: "*",
            },
        ],
    })),
});

// Lambda function code with AWS SDK v3
const lambdaCode = `
const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');
const { RDSClient, DescribeDBInstancesCommand, ListTagsForResourceCommand } = require('@aws-sdk/client-rds');
const { S3Client, ListBucketsCommand, GetBucketTaggingCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const { PricingClient, GetProductsCommand } = require('@aws-sdk/client-pricing');

const REQUIRED_TAGS = ['Environment', 'CostCenter', 'Owner', 'Project'];
const REPORT_BUCKET = process.env.REPORT_BUCKET;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const HIGH_PRIORITY_AGE_DAYS = 90;

// Helper function to suggest tags based on resource naming patterns
function suggestTags(resourceId, resourceType) {
    const suggestions = [];
    const lowerName = resourceId.toLowerCase();

    // Environment suggestions
    if (lowerName.includes('prod') || lowerName.includes('production')) {
        suggestions.push({ key: 'Environment', value: 'production', confidence: 0.9 });
    } else if (lowerName.includes('dev') || lowerName.includes('development')) {
        suggestions.push({ key: 'Environment', value: 'development', confidence: 0.9 });
    } else if (lowerName.includes('staging') || lowerName.includes('stage')) {
        suggestions.push({ key: 'Environment', value: 'staging', confidence: 0.9 });
    } else if (lowerName.includes('test')) {
        suggestions.push({ key: 'Environment', value: 'test', confidence: 0.8 });
    }

    // Project suggestions based on common patterns
    const projectMatch = lowerName.match(/^([a-z0-9-]+)-(prod|dev|staging|test)/);
    if (projectMatch) {
        suggestions.push({ key: 'Project', value: projectMatch[1], confidence: 0.7 });
    }

    return suggestions;
}

// Helper function to calculate resource age
function getResourceAge(launchTime) {
    if (!launchTime) return null;
    const now = new Date();
    const launch = new Date(launchTime);
    const diffMs = now - launch;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Helper function to estimate monthly costs
async function estimateCost(resourceType, resourceDetails, pricingClient) {
    try {
        // Simplified cost estimation logic
        const costMap = {
            'ec2': {
                't2.micro': 8.47,
                't2.small': 16.79,
                't2.medium': 33.58,
                't3.micro': 7.59,
                't3.small': 15.18,
                't3.medium': 30.37,
            },
            'rds': {
                'db.t2.micro': 14.00,
                'db.t2.small': 28.00,
                'db.t3.micro': 12.41,
                'db.t3.small': 24.82,
            },
            's3': 0.023 // per GB
        };

        if (resourceType === 'ec2' && resourceDetails.instanceType) {
            return costMap.ec2[resourceDetails.instanceType] || 50.00;
        } else if (resourceType === 'rds' && resourceDetails.instanceClass) {
            return costMap.rds[resourceDetails.instanceClass] || 100.00;
        } else if (resourceType === 's3') {
            // Estimate 10GB average for S3 buckets
            return 10 * costMap.s3;
        }

        return 0;
    } catch (error) {
        console.error('Cost estimation error:', error);
        return 0;
    }
}

exports.handler = async (event) => {
    const ec2Client = new EC2Client({ region: AWS_REGION });
    const rdsClient = new RDSClient({ region: AWS_REGION });
    const s3Client = new S3Client({ region: AWS_REGION });
    const cloudwatchClient = new CloudWatchClient({ region: AWS_REGION });
    const pricingClient = new PricingClient({ region: 'us-east-1' });

    const results = {
        ec2: [],
        rds: [],
        s3: [],
        summary: {},
        highPriorityCount: 0,
        totalEstimatedMonthlyCost: 0,
    };

    try {
        // Scan EC2 instances
        const ec2Response = await ec2Client.send(new DescribeInstancesCommand({}));
        for (const reservation of (ec2Response.Reservations || [])) {
            for (const instance of (reservation.Instances || [])) {
                const tags = instance.Tags || [];
                const tagKeys = tags.map(t => t.Key);
                const missingTags = REQUIRED_TAGS.filter(rt => !tagKeys.includes(rt));
                const resourceAge = getResourceAge(instance.LaunchTime);
                const isHighPriority = resourceAge && resourceAge > HIGH_PRIORITY_AGE_DAYS && missingTags.length > 0;
                const estimatedCost = await estimateCost('ec2', { instanceType: instance.InstanceType }, pricingClient);

                if (missingTags.length > 0) {
                    results.totalEstimatedMonthlyCost += estimatedCost;
                }

                if (isHighPriority) {
                    results.highPriorityCount++;
                }

                results.ec2.push({
                    resourceId: instance.InstanceId,
                    resourceType: 'EC2 Instance',
                    instanceType: instance.InstanceType,
                    state: instance.State.Name,
                    launchTime: instance.LaunchTime,
                    ageDays: resourceAge,
                    missingTags: missingTags,
                    existingTags: tags.reduce((acc, t) => ({ ...acc, [t.Key]: t.Value }), {}),
                    compliant: missingTags.length === 0,
                    highPriority: isHighPriority,
                    suggestedTags: missingTags.length > 0 ? suggestTags(instance.InstanceId, 'ec2') : [],
                    estimatedMonthlyCost: estimatedCost,
                });
            }
        }

        // Scan RDS instances
        const rdsResponse = await rdsClient.send(new DescribeDBInstancesCommand({}));
        for (const db of (rdsResponse.DBInstances || [])) {
            const dbArn = db.DBInstanceArn;
            let tags = [];

            try {
                const tagsResponse = await rdsClient.send(new ListTagsForResourceCommand({ ResourceName: dbArn }));
                tags = tagsResponse.TagList || [];
            } catch (error) {
                console.warn(\`Failed to fetch tags for RDS instance \${db.DBInstanceIdentifier}:\`, error.message);
            }

            const tagKeys = tags.map(t => t.Key);
            const missingTags = REQUIRED_TAGS.filter(rt => !tagKeys.includes(rt));
            const resourceAge = getResourceAge(db.InstanceCreateTime);
            const isHighPriority = resourceAge && resourceAge > HIGH_PRIORITY_AGE_DAYS && missingTags.length > 0;
            const estimatedCost = await estimateCost('rds', { instanceClass: db.DBInstanceClass }, pricingClient);

            if (missingTags.length > 0) {
                results.totalEstimatedMonthlyCost += estimatedCost;
            }

            if (isHighPriority) {
                results.highPriorityCount++;
            }

            results.rds.push({
                resourceId: db.DBInstanceIdentifier,
                resourceType: 'RDS Instance',
                instanceClass: db.DBInstanceClass,
                engine: db.Engine,
                status: db.DBInstanceStatus,
                createTime: db.InstanceCreateTime,
                ageDays: resourceAge,
                missingTags: missingTags,
                existingTags: tags.reduce((acc, t) => ({ ...acc, [t.Key]: t.Value }), {}),
                compliant: missingTags.length === 0,
                highPriority: isHighPriority,
                suggestedTags: missingTags.length > 0 ? suggestTags(db.DBInstanceIdentifier, 'rds') : [],
                estimatedMonthlyCost: estimatedCost,
            });
        }

        // Scan S3 buckets
        const bucketsResponse = await s3Client.send(new ListBucketsCommand({}));
        for (const bucket of (bucketsResponse.Buckets || [])) {
            let tags = [];

            try {
                const tagsResponse = await s3Client.send(new GetBucketTaggingCommand({ Bucket: bucket.Name }));
                tags = tagsResponse.TagSet || [];
            } catch (error) {
                // Bucket has no tags or access denied
                console.warn(\`Failed to fetch tags for S3 bucket \${bucket.Name}:\`, error.message);
            }

            const tagKeys = tags.map(t => t.Key);
            const missingTags = REQUIRED_TAGS.filter(rt => !tagKeys.includes(rt));
            const resourceAge = getResourceAge(bucket.CreationDate);
            const isHighPriority = resourceAge && resourceAge > HIGH_PRIORITY_AGE_DAYS && missingTags.length > 0;
            const estimatedCost = await estimateCost('s3', {}, pricingClient);

            if (missingTags.length > 0) {
                results.totalEstimatedMonthlyCost += estimatedCost;
            }

            if (isHighPriority) {
                results.highPriorityCount++;
            }

            results.s3.push({
                resourceId: bucket.Name,
                resourceType: 'S3 Bucket',
                creationDate: bucket.CreationDate,
                ageDays: resourceAge,
                missingTags: missingTags,
                existingTags: tags.reduce((acc, t) => ({ ...acc, [t.Key]: t.Value }), {}),
                compliant: missingTags.length === 0,
                highPriority: isHighPriority,
                suggestedTags: missingTags.length > 0 ? suggestTags(bucket.Name, 's3') : [],
                estimatedMonthlyCost: estimatedCost,
            });
        }

        // Calculate summary statistics
        const totalEc2 = results.ec2.length;
        const compliantEc2 = results.ec2.filter(r => r.compliant).length;
        const totalRds = results.rds.length;
        const compliantRds = results.rds.filter(r => r.compliant).length;
        const totalS3 = results.s3.length;
        const compliantS3 = results.s3.filter(r => r.compliant).length;

        const totalResources = totalEc2 + totalRds + totalS3;
        const totalCompliant = compliantEc2 + compliantRds + compliantS3;

        results.summary = {
            ec2: {
                total: totalEc2,
                compliant: compliantEc2,
                nonCompliant: totalEc2 - compliantEc2,
                percentage: totalEc2 > 0 ? parseFloat((compliantEc2 / totalEc2 * 100).toFixed(2)) : 0,
            },
            rds: {
                total: totalRds,
                compliant: compliantRds,
                nonCompliant: totalRds - compliantRds,
                percentage: totalRds > 0 ? parseFloat((compliantRds / totalRds * 100).toFixed(2)) : 0,
            },
            s3: {
                total: totalS3,
                compliant: compliantS3,
                nonCompliant: totalS3 - compliantS3,
                percentage: totalS3 > 0 ? parseFloat((compliantS3 / totalS3 * 100).toFixed(2)) : 0,
            },
            overall: {
                total: totalResources,
                compliant: totalCompliant,
                nonCompliant: totalResources - totalCompliant,
                percentage: totalResources > 0 ? parseFloat((totalCompliant / totalResources * 100).toFixed(2)) : 0,
            },
            highPriorityCount: results.highPriorityCount,
            estimatedMonthlyCost: parseFloat(results.totalEstimatedMonthlyCost.toFixed(2)),
        };

        // Publish CloudWatch metrics
        const metricData = [
            {
                MetricName: 'EC2CompliancePercentage',
                Value: results.summary.ec2.percentage,
                Unit: 'Percent',
                Timestamp: new Date(),
            },
            {
                MetricName: 'RDSCompliancePercentage',
                Value: results.summary.rds.percentage,
                Unit: 'Percent',
                Timestamp: new Date(),
            },
            {
                MetricName: 'S3CompliancePercentage',
                Value: results.summary.s3.percentage,
                Unit: 'Percent',
                Timestamp: new Date(),
            },
            {
                MetricName: 'OverallCompliancePercentage',
                Value: results.summary.overall.percentage,
                Unit: 'Percent',
                Timestamp: new Date(),
            },
            {
                MetricName: 'HighPriorityResourceCount',
                Value: results.highPriorityCount,
                Unit: 'Count',
                Timestamp: new Date(),
            },
            {
                MetricName: 'EstimatedMonthlyCost',
                Value: results.totalEstimatedMonthlyCost,
                Unit: 'None',
                Timestamp: new Date(),
            },
        ];

        await cloudwatchClient.send(new PutMetricDataCommand({
            Namespace: 'TaggingCompliance',
            MetricData: metricData,
        }));

        // Save report to S3
        const timestamp = new Date().toISOString();
        const reportKey = \`compliance-reports/\${timestamp}.json\`;

        await s3Client.send(new PutObjectCommand({
            Bucket: REPORT_BUCKET,
            Key: reportKey,
            Body: JSON.stringify(results, null, 2),
            ContentType: 'application/json',
        }));

        console.log('Compliance audit completed successfully');
        console.log('Summary:', JSON.stringify(results.summary, null, 2));

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Compliance audit completed',
                reportLocation: \`s3://\${REPORT_BUCKET}/\${reportKey}\`,
                summary: results.summary,
            }),
        };

    } catch (error) {
        console.error('Error during compliance audit:', error);
        throw error;
    }
};
`;

// Lambda function
const auditLambda = new aws.lambda.Function(`tagging-audit-${environmentSuffix}`, {
    name: `tagging-audit-${environmentSuffix}`,
    runtime: aws.lambda.Runtime.NodeJS18dX,
    role: lambdaRole.arn,
    handler: "index.handler",
    code: new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(lambdaCode),
        "package.json": new pulumi.asset.StringAsset(JSON.stringify({
            dependencies: {
                "@aws-sdk/client-ec2": "^3.0.0",
                "@aws-sdk/client-rds": "^3.0.0",
                "@aws-sdk/client-s3": "^3.0.0",
                "@aws-sdk/client-cloudwatch": "^3.0.0",
                "@aws-sdk/client-pricing": "^3.0.0",
            }
        })),
    }),
    timeout: 900,
    memorySize: 512,
    environment: {
        variables: {
            REPORT_BUCKET: reportsBucket.bucket,
            AWS_REGION: "us-east-1",
        },
    },
}, { dependsOn: [lambdaPolicyAttachment, scannerPolicy] });

// CloudWatch Log Group with retention
const logGroup = new aws.cloudwatch.LogGroup(`/aws/lambda/tagging-audit-${environmentSuffix}`, {
    name: `/aws/lambda/tagging-audit-${environmentSuffix}`,
    retentionInDays: 7,
});

// EventBridge rule for weekly execution
const weeklyRule = new aws.cloudwatch.EventRule(`tagging-audit-schedule-${environmentSuffix}`, {
    name: `tagging-audit-schedule-${environmentSuffix}`,
    description: "Trigger tagging compliance audit weekly",
    scheduleExpression: "rate(7 days)",
});

// EventBridge target
const eventTarget = new aws.cloudwatch.EventTarget(`tagging-audit-target-${environmentSuffix}`, {
    rule: weeklyRule.name,
    arn: auditLambda.arn,
});

// Lambda permission for EventBridge
const lambdaPermission = new aws.lambda.Permission(`tagging-audit-permission-${environmentSuffix}`, {
    action: "lambda:InvokeFunction",
    function: auditLambda.name,
    principal: "events.amazonaws.com",
    sourceArn: weeklyRule.arn,
});

// Exports
export const reportBucketName = reportsBucket.bucket;
export const reportBucketArn = reportsBucket.arn;
export const auditLambdaArn = auditLambda.arn;
export const auditLambdaName = auditLambda.name;
export const weeklyRuleName = weeklyRule.name;
export const logGroupName = logGroup.name;
```

## File: package.json

```json
{
  "name": "tagging-audit",
  "version": "1.0.0",
  "description": "AWS Resource Tagging Compliance Audit",
  "main": "index.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint . --ext .ts"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0"
  }
}
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./bin",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "bin"]
}
```

## File: Pulumi.yaml

```yaml
name: tagging-audit
runtime: nodejs
description: AWS Resource Tagging Compliance Audit System
config:
  environmentSuffix:
    description: Environment suffix for resource naming
    type: string
```

## File: README.md

```markdown
# AWS Resource Tagging Compliance Audit

Automated system for scanning AWS resources and validating tagging compliance.

## Features

- Scans EC2, RDS, and S3 resources for required tags
- Generates compliance reports with missing tag details
- Provides intelligent tag suggestions based on resource names
- Flags high-priority resources (90+ days old without tags)
- Calculates estimated monthly costs for non-compliant resources
- Publishes CloudWatch metrics for trend tracking
- Runs automatically on weekly schedule via EventBridge

## Required Tags

- Environment
- CostCenter
- Owner
- Project

## Deployment

\`\`\`bash
# Install dependencies
npm install

# Set environment suffix
pulumi config set environmentSuffix <your-suffix>

# Deploy
pulumi up
\`\`\`

## Manual Execution

\`\`\`bash
aws lambda invoke --function-name tagging-audit-<environmentSuffix> output.json
\`\`\`

## Reports

Compliance reports are stored in S3 bucket: \`tagging-audit-reports-<environmentSuffix>\`

## CloudWatch Metrics

Metrics available in namespace \`TaggingCompliance\`:
- EC2CompliancePercentage
- RDSCompliancePercentage
- S3CompliancePercentage
- OverallCompliancePercentage
- HighPriorityResourceCount
- EstimatedMonthlyCost
\`\`\`
