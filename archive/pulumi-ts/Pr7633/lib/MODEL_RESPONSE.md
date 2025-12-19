# EC2 Tag Compliance Monitoring System

Complete Pulumi TypeScript implementation for automated EC2 tag compliance checking with reporting, alerting, and historical analysis capabilities.

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

## File: Pulumi.yaml

```yaml
name: ec2-compliance-monitoring
runtime: nodejs
description: EC2 tag compliance monitoring with automated reporting and alerting
config:
  environmentSuffix:
    type: string
    description: Environment suffix for unique resource naming
```

## File: lib/README.md

```markdown
# EC2 Tag Compliance Monitoring System

Automated infrastructure quality assurance system for monitoring EC2 tag compliance across AWS accounts.

## Overview

This Pulumi TypeScript project creates a complete monitoring solution that:
- Scans all EC2 instances every 6 hours for tag compliance
- Stores compliance reports in S3 with versioning
- Sends SNS alerts when non-compliant instances are found
- Provides CloudWatch Dashboard for real-time monitoring
- Enables historical analysis via Athena and AWS Glue

## Architecture

### Components

1. **Lambda Function** (`ec2-compliance-checker`)
   - Scans all EC2 instances in the account
   - Validates presence of required tags
   - Generates JSON compliance reports
   - Publishes alerts for non-compliant instances

2. **S3 Bucket** (`ec2-compliance-reports`)
   - Stores compliance reports with versioning
   - Organized by timestamp for easy retrieval
   - 90-day lifecycle policy for old versions

3. **SNS Topic** (`ec2-compliance-alerts`)
   - Sends notifications for non-compliant instances
   - Includes summary and instance details

4. **CloudWatch Events Rule** (`ec2-compliance-schedule`)
   - Triggers Lambda every 6 hours
   - Automated scheduling with EventBridge

5. **CloudWatch Dashboard** (`ec2-compliance-dashboard`)
   - Lambda execution metrics
   - Recent compliance check logs
   - Alert statistics

6. **AWS Glue** (Crawler, Database, Table)
   - Catalogs S3 reports for structured queries
   - Enables SQL-based analysis

7. **Amazon Athena** (Workgroup)
   - Ad-hoc queries on historical compliance data
   - Trend analysis and reporting

## Prerequisites

- AWS account with appropriate permissions
- Pulumi CLI installed
- Node.js 18.x or higher
- AWS credentials configured

## Configuration

Required Pulumi config:
```bash
pulumi config set environmentSuffix <your-suffix>
```

The `environmentSuffix` is used to ensure unique resource names across deployments.

## Deployment

1. Install dependencies:
```bash
npm install
```

2. Set configuration:
```bash
pulumi config set environmentSuffix dev
```

3. Deploy infrastructure:
```bash
pulumi up
```

4. Review and confirm the changes.

## Required Tags

By default, the system checks for these tags:
- Environment
- Owner
- CostCenter
- Project

To customize required tags, modify the `requiredTags` array in `lib/index.ts`.

## Usage

### Manual Invocation

Trigger the compliance check manually:
```bash
aws lambda invoke \
  --function-name ec2-compliance-checker-<environmentSuffix> \
  --region us-east-1 \
  output.json
```

### View Reports

List compliance reports:
```bash
aws s3 ls s3://ec2-compliance-reports-<environmentSuffix>/compliance-reports/
```

Download a report:
```bash
aws s3 cp s3://ec2-compliance-reports-<environmentSuffix>/compliance-reports/<report-name>.json .
```

### Run Glue Crawler

Catalog reports for Athena queries:
```bash
aws glue start-crawler --name ec2-compliance-crawler-<environmentSuffix>
```

### Query with Athena

After running the Glue Crawler, query reports using Athena:
```sql
SELECT
  timestamp,
  summary.totalinstances,
  summary.compliantinstances,
  summary.noncompliantinstances,
  summary.compliancepercentage
FROM ec2_compliance_db_<environmentSuffix>.compliance_reports
ORDER BY timestamp DESC
LIMIT 10;
```

### Subscribe to Alerts

Add email subscription to SNS topic:
```bash
aws sns subscribe \
  --topic-arn <sns-topic-arn> \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Monitoring

Access the CloudWatch Dashboard:
1. Go to AWS Console > CloudWatch > Dashboards
2. Select `ec2-compliance-dashboard-<environmentSuffix>`
3. View Lambda metrics, logs, and alert statistics

## IAM Permissions

The Lambda function uses least-privilege permissions:
- EC2: DescribeInstances, DescribeTags (read-only)
- S3: PutObject (write to specific bucket only)
- SNS: Publish (to specific topic only)
- CloudWatch Logs: Write logs

## Cost Optimization

- Lambda: Minimal cost with 6-hour schedule
- S3: Lifecycle policies clean up old versions
- Athena: Pay-per-query pricing
- Glue Crawler: Run on-demand or scheduled

## Cleanup

To destroy all resources:
```bash
pulumi destroy
```

All resources are configured to be fully destroyable without retain policies.

## Troubleshooting

### Lambda Errors

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/ec2-compliance-checker-<environmentSuffix> --follow
```

### No Alerts Received

1. Confirm SNS subscription is confirmed
2. Check Lambda execution logs for errors
3. Verify IAM permissions for SNS publish

### Athena Queries Failing

1. Run Glue Crawler first to catalog data
2. Verify S3 bucket has reports
3. Check Athena query syntax

## Security Considerations

- All IAM roles follow least-privilege principle
- S3 bucket versioning enabled for audit trail
- Lambda execution logs retained in CloudWatch
- No hardcoded credentials or sensitive data
- Resource naming prevents conflicts across environments
