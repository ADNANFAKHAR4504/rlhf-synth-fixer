# Ideal Implementation: AWS Compliance Monitoring System

This document describes the correct architecture and implementation approach for the AWS compliance monitoring system.

## Architecture Overview

The system uses a Lambda-based architecture with the following components:

```
EventBridge Rule (every 12 hours)
         ↓
    Lambda Function
    (Compliance Checks)
         ↓
   AWS Service APIs ← IAM Role with Read Permissions
    (S3, EC2, IAM,
     CloudTrail, VPC)
         ↓
    SNS Topic ← Violation Notifications
         ↓
  CloudWatch Dashboard
  (Metrics & Visualization)
```

## Implementation Details

### 1. IAM Role and Policies

```typescript
// Create IAM role for Lambda
const lambdaRole = new aws.iam.Role("compliance-lambda-role", {
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
    tags: { /* standard tags */ }
});

// Attach policy for CloudWatch Logs
new aws.iam.RolePolicyAttachment("lambda-logs", {
    role: lambdaRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
});

// Create custom policy for compliance checks
const compliancePolicy = new aws.iam.Policy("compliance-policy", {
    policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Action: [
                    "s3:GetEncryptionConfiguration",
                    "s3:ListAllMyBuckets",
                ],
                Resource: "*",
            },
            {
                Effect: "Allow",
                Action: [
                    "ec2:DescribeSecurityGroups",
                    "ec2:DescribeFlowLogs",
                ],
                Resource: "*",
            },
            {
                Effect: "Allow",
                Action: [
                    "iam:GetAccountPasswordPolicy",
                ],
                Resource: "*",
            },
            {
                Effect: "Allow",
                Action: [
                    "cloudtrail:DescribeTrails",
                    "cloudtrail:GetTrailStatus",
                ],
                Resource: "*",
            },
            {
                Effect: "Allow",
                Action: [
                    "sns:Publish",
                ],
                Resource: snsTopicArn,
            },
        ],
    }),
});

new aws.iam.RolePolicyAttachment("compliance-policy-attach", {
    role: lambdaRole.name,
    policyArn: compliancePolicy.arn,
});
```

### 2. Lambda Function Implementation

```typescript
// Lambda code using AWS SDK v3
const lambdaCode = `
const { S3Client, ListBucketsCommand, GetBucketEncryptionCommand } = require('@aws-sdk/client-s3');
const { EC2Client, DescribeSecurityGroupsCommand, DescribeFlowLogsCommand } = require('@aws-sdk/client-ec2');
const { IAMClient, GetAccountPasswordPolicyCommand } = require('@aws-sdk/client-iam');
const { CloudTrailClient, DescribeTrailsCommand, GetTrailStatusCommand } = require('@aws-sdk/client-cloudtrail');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const region = process.env.AWS_REGION;
const snsTopicArn = process.env.SNS_TOPIC_ARN;

exports.handler = async (event) => {
    const violations = [];

    try {
        // Check 1: S3 Bucket Encryption
        const s3Violations = await checkS3Encryption();
        violations.push(...s3Violations);

        // Check 2: EC2 Security Groups
        const sgViolations = await checkSecurityGroups();
        violations.push(...sgViolations);

        // Check 3: IAM Password Policy
        const iamViolations = await checkPasswordPolicy();
        violations.push(...iamViolations);

        // Check 4: CloudTrail Logging
        const cloudTrailViolations = await checkCloudTrail();
        violations.push(...cloudTrailViolations);

        // Check 5: VPC Flow Logs
        const vpcViolations = await checkVPCFlowLogs();
        violations.push(...vpcViolations);

        // Send violations to SNS if any found
        if (violations.length > 0) {
            await sendViolations(violations);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                checksPerformed: 5,
                violationsFound: violations.length,
                violations: violations
            })
        };
    } catch (error) {
        console.error('Error performing compliance checks:', error);
        throw error;
    }
};

async function checkS3Encryption() {
    // Implementation with try-catch and retry logic
}

async function checkSecurityGroups() {
    // Implementation with try-catch and retry logic
}

async function checkPasswordPolicy() {
    // Implementation with try-catch and retry logic
}

async function checkCloudTrail() {
    // Implementation with try-catch and retry logic
}

async function checkVPCFlowLogs() {
    // Implementation with try-catch and retry logic
}

async function sendViolations(violations) {
    // Implementation with try-catch
}
`;

const lambdaFunction = new aws.lambda.Function("compliance-checker", {
    runtime: aws.lambda.Runtime.NodeJS20dX,
    code: new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(lambdaCode),
    }),
    handler: "index.handler",
    role: lambdaRole.arn,
    timeout: 300,
    memorySize: 512,
    environment: {
        variables: {
            SNS_TOPIC_ARN: snsTopic.arn,
        },
    },
    tags: { /* standard tags */ }
});
```

### 3. EventBridge Schedule

```typescript
const eventRule = new aws.cloudwatch.EventRule("compliance-schedule", {
    scheduleExpression: "rate(12 hours)",
    description: "Trigger compliance checks every 12 hours",
    tags: { /* standard tags */ }
});

const eventTarget = new aws.cloudwatch.EventTarget("compliance-target", {
    rule: eventRule.name,
    arn: lambdaFunction.arn,
});

// CRITICAL: Grant EventBridge permission to invoke Lambda
const lambdaPermission = new aws.lambda.Permission("eventbridge-invoke", {
    action: "lambda:InvokeFunction",
    function: lambdaFunction.name,
    principal: "events.amazonaws.com",
    sourceArn: eventRule.arn,
});
```

### 4. SNS Topic

```typescript
const snsTopic = new aws.sns.Topic("compliance-violations", {
    displayName: "Compliance Violations",
    tags: { /* standard tags */ }
});
```

### 5. CloudWatch Dashboard

```typescript
const dashboard = new aws.cloudwatch.Dashboard("compliance-dashboard", {
    dashboardName: "compliance-monitoring",
    dashboardBody: JSON.stringify({
        widgets: [
            {
                type: "metric",
                properties: {
                    metrics: [
                        ["AWS/Lambda", "Invocations", { stat: "Sum", label: "Checks Performed" }],
                        [".", "Errors", { stat: "Sum", label: "Errors" }],
                        [".", "Duration", { stat: "Average", label: "Avg Duration (ms)" }],
                    ],
                    period: 300,
                    stat: "Average",
                    region: "us-east-1",
                    title: "Compliance Check Performance"
                }
            },
            // Additional widgets for each compliance category
        ]
    }),
});
```

### 6. Outputs

```typescript
export const lambdaFunctionArn = lambdaFunction.arn;
export const lambdaFunctionName = lambdaFunction.name;
export const snsTopicArn = snsTopic.arn;
export const dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=${dashboard.dashboardName}`;
export const iamRoleArn = lambdaRole.arn;
```

## Key Success Factors

1. **Complete IAM Permissions**: Lambda role must have all required read permissions for the 5 compliance checks plus SNS publish and CloudWatch Logs write permissions.

2. **AWS SDK v3 Usage**: Use modular imports from AWS SDK v3 for better performance and smaller package size.

3. **Proper Error Handling**: Each compliance check wrapped in try-catch, allowing other checks to proceed if one fails.

4. **EventBridge Permission**: Lambda resource policy must explicitly grant events.amazonaws.com permission to invoke the function.

5. **Environment Variables**: Pass SNS topic ARN to Lambda via environment variables for runtime configuration.

6. **Correct Specifications**: Lambda timeout (300s), memory (512 MB), runtime (nodejs20.x), schedule (rate(12 hours)).

7. **All Required Outputs**: Export all 5 outputs as specified: Lambda ARN, Lambda name, SNS ARN, dashboard URL, IAM role ARN.

8. **Consistent Tagging**: All resources tagged with Environment, Project, and ManagedBy.

## Testing Strategy

1. **Unit Tests**: Mock AWS SDK clients, test each compliance check function individually
2. **Integration Tests**: Deploy stack, invoke Lambda, verify it runs without errors
3. **Coverage Goal**: 100% code coverage for all Lambda functions and infrastructure code
