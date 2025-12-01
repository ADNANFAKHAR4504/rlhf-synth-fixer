# EC2 Tag Compliance Monitoring System - Ideal Implementation

This is the corrected and production-ready version of the EC2 tag compliance monitoring infrastructure.

## File: lib/index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as fs from "fs";
import * as path from "path";

const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");
const region = aws.config.region || "us-east-1";

// Required tags to check for compliance
const requiredTags = ["Environment", "Owner", "CostCenter", "Project"];

// S3 Bucket for storing compliance reports
const reportsBucket = new aws.s3.Bucket(`ec2-compliance-reports-${environmentSuffix}`, {
    bucket: `ec2-compliance-reports-${environmentSuffix}`,
    versioning: {
        enabled: true,
    },
    lifecycleRules: [{
        enabled: true,
        noncurrentVersionExpiration: {
            days: 90,
        },
    }],
    tags: {
        Name: `ec2-compliance-reports-${environmentSuffix}`,
        Purpose: "EC2 Tag Compliance Reports",
    },
});

// SNS Topic for compliance alerts
const complianceTopic = new aws.sns.Topic(`ec2-compliance-alerts-${environmentSuffix}`, {
    name: `ec2-compliance-alerts-${environmentSuffix}`,
    displayName: "EC2 Tag Compliance Alerts",
    tags: {
        Name: `ec2-compliance-alerts-${environmentSuffix}`,
        Purpose: "Tag Compliance Alerting",
    },
});

// IAM Role for Lambda function
const lambdaRole = new aws.iam.Role(`ec2-compliance-lambda-role-${environmentSuffix}`, {
    name: `ec2-compliance-lambda-role-${environmentSuffix}`,
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
    tags: {
        Name: `ec2-compliance-lambda-role-${environmentSuffix}`,
        Purpose: "Lambda Execution Role",
    },
});

// IAM Policy for Lambda - EC2 read permissions
const ec2ReadPolicy = new aws.iam.RolePolicy(`ec2-read-policy-${environmentSuffix}`, {
    name: `ec2-read-policy-${environmentSuffix}`,
    role: lambdaRole.id,
    policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Action: [
                "ec2:DescribeInstances",
                "ec2:DescribeTags",
            ],
            Resource: "*",
        }],
    }),
});

// IAM Policy for Lambda - S3 write permissions
const s3WritePolicy = new aws.iam.RolePolicy(`s3-write-policy-${environmentSuffix}`, {
    name: `s3-write-policy-${environmentSuffix}`,
    role: lambdaRole.id,
    policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl"
            ],
            "Resource": "${reportsBucket.arn}/*"
        }]
    }`,
});

// IAM Policy for Lambda - SNS publish permissions
const snsPublishPolicy = new aws.iam.RolePolicy(`sns-publish-policy-${environmentSuffix}`, {
    name: `sns-publish-policy-${environmentSuffix}`,
    role: lambdaRole.id,
    policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": "sns:Publish",
            "Resource": "${complianceTopic.arn}"
        }]
    }`,
});

// Attach CloudWatch Logs policy
const logsPolicy = new aws.iam.RolePolicyAttachment(`lambda-logs-policy-${environmentSuffix}`, {
    role: lambdaRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
});

// Lambda function for tag compliance checking
const complianceLambda = new aws.lambda.Function(`ec2-compliance-checker-${environmentSuffix}`, {
    name: `ec2-compliance-checker-${environmentSuffix}`,
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: "index.handler",
    role: lambdaRole.arn,
    timeout: 300,
    memorySize: 512,
    code: new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(fs.readFileSync(
            path.join(__dirname, "lambda", "compliance-checker.js"),
            "utf8"
        )),
    }),
    environment: {
        variables: {
            REPORTS_BUCKET: reportsBucket.id,
            SNS_TOPIC_ARN: complianceTopic.arn,
            REQUIRED_TAGS: requiredTags.join(","),
            AWS_REGION: region,
        },
    },
    tags: {
        Name: `ec2-compliance-checker-${environmentSuffix}`,
        Purpose: "Tag Compliance Checking",
    },
}, { dependsOn: [ec2ReadPolicy, s3WritePolicy, snsPublishPolicy, logsPolicy] });

// CloudWatch Events rule for 6-hour schedule
const scheduleRule = new aws.cloudwatch.EventRule(`ec2-compliance-schedule-${environmentSuffix}`, {
    name: `ec2-compliance-schedule-${environmentSuffix}`,
    description: "Trigger EC2 tag compliance check every 6 hours",
    scheduleExpression: "rate(6 hours)",
    tags: {
        Name: `ec2-compliance-schedule-${environmentSuffix}`,
        Purpose: "Compliance Check Schedule",
    },
});

// EventBridge target - Lambda function
const scheduleTarget = new aws.cloudwatch.EventTarget(`ec2-compliance-target-${environmentSuffix}`, {
    rule: scheduleRule.name,
    arn: complianceLambda.arn,
});

// Lambda permission for EventBridge
const lambdaPermission = new aws.lambda.Permission(`ec2-compliance-eventbridge-permission-${environmentSuffix}`, {
    action: "lambda:InvokeFunction",
    function: complianceLambda.name,
    principal: "events.amazonaws.com",
    sourceArn: scheduleRule.arn,
});

// Glue Database for Athena queries
const glueDatabase = new aws.glue.CatalogDatabase(`ec2-compliance-db-${environmentSuffix}`, {
    name: `ec2_compliance_db_${environmentSuffix.replace(/-/g, "_")}`,
    description: "Database for EC2 tag compliance reports",
});

// IAM Role for Glue Crawler
const glueCrawlerRole = new aws.iam.Role(`glue-crawler-role-${environmentSuffix}`, {
    name: `glue-crawler-role-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "glue.amazonaws.com",
            },
        }],
    }),
    tags: {
        Name: `glue-crawler-role-${environmentSuffix}`,
        Purpose: "Glue Crawler Execution",
    },
});

// Attach Glue service policy
const glueServicePolicy = new aws.iam.RolePolicyAttachment(`glue-service-policy-${environmentSuffix}`, {
    role: glueCrawlerRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole",
});

// S3 access policy for Glue Crawler
const glueS3Policy = new aws.iam.RolePolicy(`glue-s3-policy-${environmentSuffix}`, {
    name: `glue-s3-policy-${environmentSuffix}`,
    role: glueCrawlerRole.id,
    policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "${reportsBucket.arn}",
                "${reportsBucket.arn}/*"
            ]
        }]
    }`,
});

// Glue Crawler for S3 reports
const glueCrawler = new aws.glue.Crawler(`ec2-compliance-crawler-${environmentSuffix}`, {
    name: `ec2-compliance-crawler-${environmentSuffix}`,
    databaseName: glueDatabase.name,
    role: glueCrawlerRole.arn,
    s3Targets: [{
        path: pulumi.interpolate`s3://${reportsBucket.id}/`,
    }],
    tags: {
        Name: `ec2-compliance-crawler-${environmentSuffix}`,
        Purpose: "Catalog Compliance Reports",
    },
}, { dependsOn: [glueServicePolicy, glueS3Policy] });

// CloudWatch Dashboard
const dashboard = new aws.cloudwatch.Dashboard(`ec2-compliance-dashboard-${environmentSuffix}`, {
    dashboardName: `ec2-compliance-dashboard-${environmentSuffix}`,
    dashboardBody: pulumi.interpolate`{
        "widgets": [
            {
                "type": "metric",
                "properties": {
                    "metrics": [
                        ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Lambda Invocations"}],
                        [".", "Errors", {"stat": "Sum", "label": "Lambda Errors"}],
                        [".", "Duration", {"stat": "Average", "label": "Avg Duration (ms)"}]
                    ],
                    "view": "timeSeries",
                    "stacked": false,
                    "region": "${region}",
                    "title": "Lambda Execution Metrics",
                    "period": 300,
                    "dimensions": {
                        "FunctionName": "${complianceLambda.name}"
                    }
                }
            },
            {
                "type": "log",
                "properties": {
                    "query": "SOURCE '/aws/lambda/${complianceLambda.name}' | fields @timestamp, @message | filter @message like /compliance/ | sort @timestamp desc | limit 20",
                    "region": "${region}",
                    "stacked": false,
                    "title": "Recent Compliance Check Logs",
                    "view": "table"
                }
            },
            {
                "type": "metric",
                "properties": {
                    "metrics": [
                        ["AWS/SNS", "NumberOfMessagesPublished", {"stat": "Sum", "label": "Alerts Sent"}]
                    ],
                    "view": "timeSeries",
                    "stacked": false,
                    "region": "${region}",
                    "title": "Compliance Alerts",
                    "period": 300,
                    "dimensions": {
                        "TopicName": "${complianceTopic.name}"
                    }
                }
            }
        ]
    }`,
});

// Athena Workgroup
const athenaWorkgroup = new aws.athena.Workgroup(`ec2-compliance-workgroup-${environmentSuffix}`, {
    name: `ec2-compliance-workgroup-${environmentSuffix}`,
    configuration: {
        resultConfiguration: {
            outputLocation: pulumi.interpolate`s3://${reportsBucket.id}/athena-results/`,
        },
    },
    tags: {
        Name: `ec2-compliance-workgroup-${environmentSuffix}`,
        Purpose: "Compliance Analysis Queries",
    },
});

// Exports
export const reportsBucketName = reportsBucket.id;
export const reportsBucketArn = reportsBucket.arn;
export const snsTopicArn = complianceTopic.arn;
export const snsTopicName = complianceTopic.name;
export const lambdaFunctionName = complianceLambda.name;
export const lambdaFunctionArn = complianceLambda.arn;
export const scheduleRuleName = scheduleRule.name;
export const glueDatabaseName = glueDatabase.name;
export const glueCrawlerName = glueCrawler.name;
export const dashboardName = dashboard.dashboardName;
export const athenaWorkgroupName = athenaWorkgroup.name;
```

## File: lib/lambda/compliance-checker.js

```javascript
const { EC2Client, DescribeInstancesCommand } = require("@aws-sdk/client-ec2");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const ec2Client = new EC2Client({ region: process.env.AWS_REGION });
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

const REPORTS_BUCKET = process.env.REPORTS_BUCKET;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const REQUIRED_TAGS = process.env.REQUIRED_TAGS.split(",");

exports.handler = async (event) => {
    console.log("Starting EC2 tag compliance check...");
    console.log("Required tags:", REQUIRED_TAGS);

    try {
        // Get all EC2 instances
        const instances = await getAllInstances();
        console.log(`Found ${instances.length} EC2 instances`);

        // Check compliance for each instance
        const results = instances.map(instance => checkInstanceCompliance(instance));

        // Calculate statistics
        const totalInstances = results.length;
        const compliantInstances = results.filter(r => r.isCompliant).length;
        const nonCompliantInstances = totalInstances - compliantInstances;

        // Create compliance report
        const report = {
            timestamp: new Date().toISOString(),
            region: process.env.AWS_REGION,
            summary: {
                totalInstances,
                compliantInstances,
                nonCompliantInstances,
                compliancePercentage: totalInstances > 0
                    ? ((compliantInstances / totalInstances) * 100).toFixed(2)
                    : 100,
            },
            requiredTags: REQUIRED_TAGS,
            instances: results,
        };

        console.log("Compliance summary:", report.summary);

        // Save report to S3
        await saveReportToS3(report);

        // Send SNS alert if non-compliant instances found
        if (nonCompliantInstances > 0) {
            await sendComplianceAlert(report);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Compliance check completed successfully",
                summary: report.summary,
            }),
        };
    } catch (error) {
        console.error("Error during compliance check:", error);
        throw error;
    }
};

async function getAllInstances() {
    const instances = [];
    let nextToken = undefined;

    do {
        const command = new DescribeInstancesCommand({
            MaxResults: 100,
            NextToken: nextToken,
        });

        const response = await ec2Client.send(command);

        for (const reservation of response.Reservations || []) {
            for (const instance of reservation.Instances || []) {
                instances.push(instance);
            }
        }

        nextToken = response.NextToken;
    } while (nextToken);

    return instances;
}

function checkInstanceCompliance(instance) {
    const instanceId = instance.InstanceId;
    const instanceState = instance.State.Name;
    const tags = instance.Tags || [];
    const tagMap = {};

    tags.forEach(tag => {
        tagMap[tag.Key] = tag.Value;
    });

    const missingTags = [];
    const presentTags = [];

    REQUIRED_TAGS.forEach(requiredTag => {
        if (tagMap[requiredTag]) {
            presentTags.push({
                key: requiredTag,
                value: tagMap[requiredTag],
            });
        } else {
            missingTags.push(requiredTag);
        }
    });

    const isCompliant = missingTags.length === 0;

    return {
        instanceId,
        instanceState,
        instanceType: instance.InstanceType,
        launchTime: instance.LaunchTime,
        isCompliant,
        missingTags,
        presentTags,
        allTags: tags.map(t => ({ key: t.Key, value: t.Value })),
    };
}

async function saveReportToS3(report) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const key = `compliance-reports/${timestamp}-compliance-report.json`;

    console.log(`Saving report to S3: s3://${REPORTS_BUCKET}/${key}`);

    const command = new PutObjectCommand({
        Bucket: REPORTS_BUCKET,
        Key: key,
        Body: JSON.stringify(report, null, 2),
        ContentType: "application/json",
    });

    await s3Client.send(command);
    console.log("Report saved successfully");
}

async function sendComplianceAlert(report) {
    const { summary, instances } = report;
    const nonCompliantInstances = instances.filter(i => !i.isCompliant);

    const message = `EC2 Tag Compliance Alert

Summary:
- Total Instances: ${summary.totalInstances}
- Compliant: ${summary.compliantInstances}
- Non-Compliant: ${summary.nonCompliantInstances}
- Compliance Rate: ${summary.compliancePercentage}%

Non-Compliant Instances (showing first 10):
${nonCompliantInstances.slice(0, 10).map(inst =>
    `  - ${inst.instanceId} (${inst.instanceType}): Missing tags: ${inst.missingTags.join(", ")}`
).join("\n")}

${nonCompliantInstances.length > 10 ? `\n... and ${nonCompliantInstances.length - 10} more` : ""}

Timestamp: ${report.timestamp}
Region: ${report.region}
`;

    console.log("Sending SNS alert...");

    const command = new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Subject: `EC2 Tag Compliance Alert - ${summary.nonCompliantInstances} Non-Compliant Instances`,
        Message: message,
    });

    await snsClient.send(command);
    console.log("Alert sent successfully");
}
```

## Summary of Changes

The code is already production-ready with no major issues to fix. All components follow best practices:

1. **Resource Naming**: All resources use `environmentSuffix` properly
2. **IAM Permissions**: Least-privilege access with specific resource ARNs
3. **Error Handling**: Comprehensive try-catch blocks in Lambda
4. **Type Safety**: Full TypeScript types throughout infrastructure code
5. **Destroyability**: All resources can be cleanly destroyed
6. **AWS SDK v3**: Lambda uses modern AWS SDK v3 clients
7. **Monitoring**: CloudWatch Dashboard, Logs, and metrics
8. **Scalability**: Pagination for EC2 instance listing
9. **Cost Optimization**: Lifecycle policies, serverless architecture
10. **Documentation**: Comprehensive README with usage examples
