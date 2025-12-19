# MODEL_RESPONSE - Initial Implementation

This file contains the initial code generation for the AWS Resource Tagging Compliance Audit system.

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as fs from "fs";
import * as path from "path";

const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");

// S3 bucket for storing compliance reports
const reportsBucket = new aws.s3.Bucket(`tagging-audit-reports-${environmentSuffix}`, {
    bucket: `tagging-audit-reports-${environmentSuffix}`,
    acl: "private",
});

// IAM role for Lambda
const lambdaRole = new aws.iam.Role(`tagging-audit-role-${environmentSuffix}`, {
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
    policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Action: [
                    "ec2:DescribeInstances",
                    "rds:DescribeDBInstances",
                    "s3:ListAllMyBuckets",
                    "s3:GetBucketTagging",
                    "tag:GetResources",
                    "pricing:GetProducts",
                ],
                Resource: "*",
            },
            {
                Effect: "Allow",
                Action: [
                    "s3:PutObject",
                ],
                Resource: pulumi.interpolate`${reportsBucket.arn}/*`,
            },
            {
                Effect: "Allow",
                Action: [
                    "cloudwatch:PutMetricData",
                ],
                Resource: "*",
            },
        ],
    }),
});

// Lambda function code
const lambdaCode = `
const AWS = require('aws-sdk');

const REQUIRED_TAGS = ['Environment', 'CostCenter', 'Owner', 'Project'];
const REPORT_BUCKET = process.env.REPORT_BUCKET;

exports.handler = async (event) => {
    const ec2 = new AWS.EC2();
    const rds = new AWS.RDS();
    const s3 = new AWS.S3();
    const cloudwatch = new AWS.CloudWatch();
    const pricing = new AWS.Pricing({ region: 'us-east-1' });

    const results = {
        ec2: [],
        rds: [],
        s3: [],
        summary: {},
    };

    try {
        // Scan EC2 instances
        const ec2Response = await ec2.describeInstances().promise();
        for (const reservation of ec2Response.Reservations) {
            for (const instance of reservation.Instances) {
                const tags = instance.Tags || [];
                const tagKeys = tags.map(t => t.Key);
                const missingTags = REQUIRED_TAGS.filter(rt => !tagKeys.includes(rt));

                if (missingTags.length > 0) {
                    results.ec2.push({
                        resourceId: instance.InstanceId,
                        missingTags: missingTags,
                        compliant: false,
                    });
                } else {
                    results.ec2.push({
                        resourceId: instance.InstanceId,
                        missingTags: [],
                        compliant: true,
                    });
                }
            }
        }

        // Scan RDS instances
        const rdsResponse = await rds.describeDBInstances().promise();
        for (const db of rdsResponse.DBInstances) {
            const tags = db.TagList || [];
            const tagKeys = tags.map(t => t.Key);
            const missingTags = REQUIRED_TAGS.filter(rt => !tagKeys.includes(rt));

            if (missingTags.length > 0) {
                results.rds.push({
                    resourceId: db.DBInstanceIdentifier,
                    missingTags: missingTags,
                    compliant: false,
                });
            } else {
                results.rds.push({
                    resourceId: db.DBInstanceIdentifier,
                    missingTags: [],
                    compliant: true,
                });
            }
        }

        // Scan S3 buckets
        const bucketsResponse = await s3.listBuckets().promise();
        for (const bucket of bucketsResponse.Buckets) {
            try {
                const tagsResponse = await s3.getBucketTagging({ Bucket: bucket.Name }).promise();
                const tagKeys = tagsResponse.TagSet.map(t => t.Key);
                const missingTags = REQUIRED_TAGS.filter(rt => !tagKeys.includes(rt));

                if (missingTags.length > 0) {
                    results.s3.push({
                        resourceId: bucket.Name,
                        missingTags: missingTags,
                        compliant: false,
                    });
                } else {
                    results.s3.push({
                        resourceId: bucket.Name,
                        missingTags: [],
                        compliant: true,
                    });
                }
            } catch (error) {
                // Bucket has no tags
                results.s3.push({
                    resourceId: bucket.Name,
                    missingTags: REQUIRED_TAGS,
                    compliant: false,
                });
            }
        }

        // Calculate summary statistics
        const totalEc2 = results.ec2.length;
        const compliantEc2 = results.ec2.filter(r => r.compliant).length;
        const totalRds = results.rds.length;
        const compliantRds = results.rds.filter(r => r.compliant).length;
        const totalS3 = results.s3.length;
        const compliantS3 = results.s3.filter(r => r.compliant).length;

        results.summary = {
            ec2: {
                total: totalEc2,
                compliant: compliantEc2,
                percentage: totalEc2 > 0 ? (compliantEc2 / totalEc2 * 100).toFixed(2) : 0,
            },
            rds: {
                total: totalRds,
                compliant: compliantRds,
                percentage: totalRds > 0 ? (compliantRds / totalRds * 100).toFixed(2) : 0,
            },
            s3: {
                total: totalS3,
                compliant: compliantS3,
                percentage: totalS3 > 0 ? (compliantS3 / totalS3 * 100).toFixed(2) : 0,
            },
        };

        // Publish CloudWatch metrics
        await cloudwatch.putMetricData({
            Namespace: 'TaggingCompliance',
            MetricData: [
                {
                    MetricName: 'EC2CompliancePercentage',
                    Value: parseFloat(results.summary.ec2.percentage),
                    Unit: 'Percent',
                },
                {
                    MetricName: 'RDSCompliancePercentage',
                    Value: parseFloat(results.summary.rds.percentage),
                    Unit: 'Percent',
                },
                {
                    MetricName: 'S3CompliancePercentage',
                    Value: parseFloat(results.summary.s3.percentage),
                    Unit: 'Percent',
                },
            ],
        }).promise();

        // Save report to S3
        const timestamp = new Date().toISOString();
        const reportKey = \`compliance-reports/\${timestamp}.json\`;

        await s3.putObject({
            Bucket: REPORT_BUCKET,
            Key: reportKey,
            Body: JSON.stringify(results, null, 2),
            ContentType: 'application/json',
        }).promise();

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
    runtime: aws.lambda.Runtime.NodeJS18dX,
    role: lambdaRole.arn,
    handler: "index.handler",
    code: new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(lambdaCode),
    }),
    timeout: 900,
    environment: {
        variables: {
            REPORT_BUCKET: reportsBucket.bucket,
        },
    },
});

// EventBridge rule for weekly execution
const weeklyRule = new aws.cloudwatch.EventRule(`tagging-audit-schedule-${environmentSuffix}`, {
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
export const auditLambdaArn = auditLambda.arn;
export const weeklyRuleName = weeklyRule.name;
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
    "test": "jest"
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
    "ts-jest": "^29.0.0"
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
    "forceConsistentCasingInFileNames": true
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

## Notes

This implementation provides the core functionality for the tagging compliance audit system:

1. Creates S3 bucket for storing compliance reports
2. Sets up Lambda function with IAM role and necessary permissions
3. Implements audit logic to scan EC2, RDS, and S3 resources
4. Calculates compliance percentages by service type
5. Publishes metrics to CloudWatch
6. Stores JSON reports in S3
7. Configures EventBridge rule for weekly execution

The Lambda function scans all three resource types, identifies missing tags, calculates compliance metrics, and generates comprehensive reports.
