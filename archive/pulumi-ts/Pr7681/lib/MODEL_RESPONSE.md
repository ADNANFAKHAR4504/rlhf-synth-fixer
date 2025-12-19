# IAM Policy Compliance Analyzer - Implementation

This implementation creates an IAM policy compliance analyzer using Pulumi with TypeScript. The solution scans existing IAM roles and policies, identifies security compliance issues, and generates detailed reports.

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as path from "path";

const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");
const region = aws.config.region || "us-east-1";

// S3 bucket for storing compliance reports
const reportsBucket = new aws.s3.Bucket(`iam-compliance-reports-${environmentSuffix}`, {
    bucket: `iam-compliance-reports-${environmentSuffix}`,
    forceDestroy: true,
    serverSideEncryptionConfiguration: {
        rule: {
            applyServerSideEncryptionByDefault: {
                sseAlgorithm: "AES256",
            },
        },
    },
    versioning: {
        enabled: true,
    },
    tags: {
        Name: `iam-compliance-reports-${environmentSuffix}`,
        Environment: environmentSuffix,
        Purpose: "IAM Compliance Reports",
    },
});

// Block public access to the reports bucket
new aws.s3.BucketPublicAccessBlock(`iam-compliance-reports-public-access-block-${environmentSuffix}`, {
    bucket: reportsBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
});

// IAM role for the Lambda scanner function
const lambdaRole = new aws.iam.Role(`iam-scanner-role-${environmentSuffix}`, {
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
        Name: `iam-scanner-role-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// Attach basic Lambda execution policy
new aws.iam.RolePolicyAttachment(`iam-scanner-basic-execution-${environmentSuffix}`, {
    role: lambdaRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
});

// Custom policy for IAM scanning and S3/CloudWatch access
const scannerPolicy = new aws.iam.Policy(`iam-scanner-policy-${environmentSuffix}`, {
    policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Action: [
                    "iam:ListRoles",
                    "iam:GetRole",
                    "iam:ListAttachedRolePolicies",
                    "iam:ListRolePolicies",
                    "iam:GetRolePolicy",
                    "iam:GetPolicy",
                    "iam:GetPolicyVersion",
                    "iam:ListPolicyVersions",
                    "iam:TagRole",
                    "iam:UntagRole",
                ],
                Resource: "*",
            },
            {
                Effect: "Allow",
                Action: [
                    "s3:PutObject",
                    "s3:GetObject",
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
    tags: {
        Name: `iam-scanner-policy-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

new aws.iam.RolePolicyAttachment(`iam-scanner-policy-attachment-${environmentSuffix}`, {
    role: lambdaRole.name,
    policyArn: scannerPolicy.arn,
});

// Lambda function for IAM scanning
const scannerLambda = new aws.lambda.Function(`iam-scanner-lambda-${environmentSuffix}`, {
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: "index.handler",
    role: lambdaRole.arn,
    timeout: 300,
    memorySize: 512,
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./lambda"),
    }),
    environment: {
        variables: {
            REPORTS_BUCKET: reportsBucket.bucket,
            ENVIRONMENT_SUFFIX: environmentSuffix,
            AWS_REGION: region,
        },
    },
    tags: {
        Name: `iam-scanner-lambda-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

// EventBridge rule to trigger scanner daily
const scannerSchedule = new aws.cloudwatch.EventRule(`iam-scanner-schedule-${environmentSuffix}`, {
    scheduleExpression: "rate(1 day)",
    description: "Triggers IAM compliance scanner daily",
    tags: {
        Name: `iam-scanner-schedule-${environmentSuffix}`,
        Environment: environmentSuffix,
    },
});

new aws.cloudwatch.EventTarget(`iam-scanner-target-${environmentSuffix}`, {
    rule: scannerSchedule.name,
    arn: scannerLambda.arn,
});

new aws.lambda.Permission(`iam-scanner-eventbridge-permission-${environmentSuffix}`, {
    action: "lambda:InvokeFunction",
    function: scannerLambda.name,
    principal: "events.amazonaws.com",
    sourceArn: scannerSchedule.arn,
});

// CloudWatch dashboard for compliance metrics
const dashboard = new aws.cloudwatch.Dashboard(`iam-compliance-dashboard-${environmentSuffix}`, {
    dashboardName: `iam-compliance-dashboard-${environmentSuffix}`,
    dashboardBody: pulumi.interpolate`{
        "widgets": [
            {
                "type": "metric",
                "properties": {
                    "metrics": [
                        ["IAMCompliance", "TotalRolesScanned", {"stat": "Sum"}],
                        [".", "WildcardPermissionsFound", {"stat": "Sum"}],
                        [".", "UnusedRoles", {"stat": "Sum"}],
                        [".", "InlinePolicies", {"stat": "Sum"}],
                        [".", "CrossAccountAccess", {"stat": "Sum"}]
                    ],
                    "view": "timeSeries",
                    "stacked": false,
                    "region": "${region}",
                    "title": "IAM Compliance Metrics",
                    "period": 300
                }
            },
            {
                "type": "metric",
                "properties": {
                    "metrics": [
                        ["IAMCompliance", "CompliantRoles", {"stat": "Sum"}],
                        [".", "NonCompliantRoles", {"stat": "Sum"}],
                        [".", "NeedsReviewRoles", {"stat": "Sum"}]
                    ],
                    "view": "pie",
                    "region": "${region}",
                    "title": "Compliance Status Distribution",
                    "period": 300
                }
            }
        ]
    }`,
});

// Exports
export const reportsBucketName = reportsBucket.bucket;
export const scannerLambdaArn = scannerLambda.arn;
export const dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=${region}#dashboards:name=${dashboard.dashboardName}`;
export const complianceNamespace = "IAMCompliance";
```

## File: lambda/index.ts

```typescript
import { IAMClient, ListRolesCommand, GetRoleCommand, ListAttachedRolePoliciesCommand, ListRolePoliciesCommand, GetRolePolicyCommand, GetPolicyCommand, GetPolicyVersionCommand, TagRoleCommand, UntagRoleCommand } from "@aws-sdk/client-iam";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";

const iamClient = new IAMClient({});
const s3Client = new S3Client({});
const cloudwatchClient = new CloudWatchClient({});

const REPORTS_BUCKET = process.env.REPORTS_BUCKET!;
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX!;
const SENSITIVE_SERVICES = ["s3", "dynamodb", "rds"];

interface ComplianceIssue {
    roleName: string;
    issueType: string;
    severity: "HIGH" | "MEDIUM" | "LOW";
    description: string;
    recommendation: string;
}

interface ComplianceReport {
    timestamp: string;
    accountId: string;
    totalRolesScanned: number;
    issues: ComplianceIssue[];
    summary: {
        compliant: number;
        nonCompliant: number;
        needsReview: number;
        wildcardPermissions: number;
        unusedRoles: number;
        inlinePolicies: number;
        crossAccountAccess: number;
    };
}

export const handler = async (event: any): Promise<any> => {
    console.log("Starting IAM compliance scan...");

    const report: ComplianceReport = {
        timestamp: new Date().toISOString(),
        accountId: "",
        totalRolesScanned: 0,
        issues: [],
        summary: {
            compliant: 0,
            nonCompliant: 0,
            needsReview: 0,
            wildcardPermissions: 0,
            unusedRoles: 0,
            inlinePolicies: 0,
            crossAccountAccess: 0,
        },
    };

    try {
        // List all IAM roles
        const roles = await listAllRoles();
        report.totalRolesScanned = roles.length;
        console.log(`Found ${roles.length} roles to scan`);

        // Analyze each role
        for (const role of roles) {
            const roleIssues = await analyzeRole(role);
            report.issues.push(...roleIssues);

            // Update summary counts
            if (roleIssues.length === 0) {
                report.summary.compliant++;
                await tagRole(role.RoleName!, "compliant");
            } else if (roleIssues.some(i => i.severity === "HIGH")) {
                report.summary.nonCompliant++;
                await tagRole(role.RoleName!, "non-compliant");
            } else {
                report.summary.needsReview++;
                await tagRole(role.RoleName!, "needs-review");
            }
        }

        // Calculate summary metrics
        report.summary.wildcardPermissions = report.issues.filter(i => i.issueType === "WILDCARD_PERMISSION").length;
        report.summary.unusedRoles = report.issues.filter(i => i.issueType === "UNUSED_ROLE").length;
        report.summary.inlinePolicies = report.issues.filter(i => i.issueType === "INLINE_POLICY").length;
        report.summary.crossAccountAccess = report.issues.filter(i => i.issueType === "CROSS_ACCOUNT_ACCESS").length;

        // Store report in S3
        await storeReport(report);

        // Send metrics to CloudWatch
        await sendMetrics(report);

        console.log("Compliance scan completed successfully");
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Compliance scan completed",
                summary: report.summary,
            }),
        };
    } catch (error) {
        console.error("Error during compliance scan:", error);
        throw error;
    }
};

async function listAllRoles(): Promise<any[]> {
    const roles: any[] = [];
    let marker: string | undefined;

    do {
        const response = await iamClient.send(new ListRolesCommand({
            Marker: marker,
            MaxItems: 100,
        }));

        if (response.Roles) {
            roles.push(...response.Roles);
        }

        marker = response.Marker;
    } while (marker);

    return roles;
}

async function analyzeRole(role: any): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];
    const roleName = role.RoleName;

    // Check 1: Unused role (last used > 90 days ago)
    if (role.RoleLastUsed?.LastUsedDate) {
        const lastUsed = new Date(role.RoleLastUsed.LastUsedDate);
        const daysSinceLastUse = (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceLastUse > 90) {
            issues.push({
                roleName,
                issueType: "UNUSED_ROLE",
                severity: "MEDIUM",
                description: `Role has not been used in ${Math.floor(daysSinceLastUse)} days`,
                recommendation: "Consider removing this role if it's no longer needed",
            });
        }
    }

    // Check 2: Cross-account access
    const assumeRolePolicy = JSON.parse(decodeURIComponent(role.AssumeRolePolicyDocument));
    for (const statement of assumeRolePolicy.Statement || []) {
        if (statement.Principal?.AWS) {
            const principals = Array.isArray(statement.Principal.AWS)
                ? statement.Principal.AWS
                : [statement.Principal.AWS];

            for (const principal of principals) {
                if (principal.includes(":root") || principal.includes("arn:aws:iam::")) {
                    issues.push({
                        roleName,
                        issueType: "CROSS_ACCOUNT_ACCESS",
                        severity: "HIGH",
                        description: `Role allows cross-account access from: ${principal}`,
                        recommendation: "Verify that this cross-account access is intentional and necessary",
                    });
                }
            }
        }
    }

    // Check 3: Attached managed policies
    const attachedPolicies = await iamClient.send(new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
    }));

    if (attachedPolicies.AttachedPolicies) {
        for (const policy of attachedPolicies.AttachedPolicies) {
            const policyIssues = await analyzePolicyForWildcards(policy.PolicyArn!, roleName);
            issues.push(...policyIssues);
        }
    }

    // Check 4: Inline policies
    const inlinePolicies = await iamClient.send(new ListRolePoliciesCommand({
        RoleName: roleName,
    }));

    if (inlinePolicies.PolicyNames && inlinePolicies.PolicyNames.length > 0) {
        for (const policyName of inlinePolicies.PolicyNames) {
            issues.push({
                roleName,
                issueType: "INLINE_POLICY",
                severity: "MEDIUM",
                description: `Role has inline policy: ${policyName}`,
                recommendation: "Convert inline policies to managed policies for better governance",
            });

            // Also check inline policy for wildcards
            const inlinePolicy = await iamClient.send(new GetRolePolicyCommand({
                RoleName: roleName,
                PolicyName: policyName,
            }));

            if (inlinePolicy.PolicyDocument) {
                const policyDoc = JSON.parse(decodeURIComponent(inlinePolicy.PolicyDocument));
                const wildcardIssues = checkPolicyForWildcards(policyDoc, roleName, policyName);
                issues.push(...wildcardIssues);
            }
        }
    }

    return issues;
}

async function analyzePolicyForWildcards(policyArn: string, roleName: string): Promise<ComplianceIssue[]> {
    try {
        const policy = await iamClient.send(new GetPolicyCommand({
            PolicyArn: policyArn,
        }));

        if (!policy.Policy?.DefaultVersionId) {
            return [];
        }

        const policyVersion = await iamClient.send(new GetPolicyVersionCommand({
            PolicyArn: policyArn,
            VersionId: policy.Policy.DefaultVersionId,
        }));

        if (!policyVersion.PolicyVersion?.Document) {
            return [];
        }

        const policyDoc = JSON.parse(decodeURIComponent(policyVersion.PolicyVersion.Document));
        return checkPolicyForWildcards(policyDoc, roleName, policyArn);
    } catch (error) {
        console.error(`Error analyzing policy ${policyArn}:`, error);
        return [];
    }
}

function checkPolicyForWildcards(policyDoc: any, roleName: string, policyIdentifier: string): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];

    for (const statement of policyDoc.Statement || []) {
        if (statement.Effect !== "Allow") continue;

        const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];

        for (const action of actions) {
            if (typeof action !== "string") continue;

            for (const service of SENSITIVE_SERVICES) {
                if (action === `${service}:*` || action === "*") {
                    issues.push({
                        roleName,
                        issueType: "WILDCARD_PERMISSION",
                        severity: "HIGH",
                        description: `Policy ${policyIdentifier} grants wildcard permissions on ${service}: ${action}`,
                        recommendation: `Replace wildcard with specific actions for ${service}`,
                    });
                }
            }
        }
    }

    return issues;
}

async function tagRole(roleName: string, complianceStatus: string): Promise<void> {
    try {
        // Remove existing compliance tags
        await iamClient.send(new UntagRoleCommand({
            RoleName: roleName,
            TagKeys: ["ComplianceStatus"],
        })).catch(() => {});

        // Add new compliance tag
        await iamClient.send(new TagRoleCommand({
            RoleName: roleName,
            Tags: [
                {
                    Key: "ComplianceStatus",
                    Value: complianceStatus,
                },
                {
                    Key: "LastScanned",
                    Value: new Date().toISOString(),
                },
            ],
        }));
    } catch (error) {
        console.error(`Error tagging role ${roleName}:`, error);
    }
}

async function storeReport(report: ComplianceReport): Promise<void> {
    const key = `compliance-reports/${new Date().toISOString().split('T')[0]}/report-${Date.now()}.json`;

    await s3Client.send(new PutObjectCommand({
        Bucket: REPORTS_BUCKET,
        Key: key,
        Body: JSON.stringify(report, null, 2),
        ContentType: "application/json",
        ServerSideEncryption: "AES256",
    }));

    console.log(`Report stored in S3: ${key}`);
}

async function sendMetrics(report: ComplianceReport): Promise<void> {
    const metrics = [
        { MetricName: "TotalRolesScanned", Value: report.totalRolesScanned },
        { MetricName: "CompliantRoles", Value: report.summary.compliant },
        { MetricName: "NonCompliantRoles", Value: report.summary.nonCompliant },
        { MetricName: "NeedsReviewRoles", Value: report.summary.needsReview },
        { MetricName: "WildcardPermissionsFound", Value: report.summary.wildcardPermissions },
        { MetricName: "UnusedRoles", Value: report.summary.unusedRoles },
        { MetricName: "InlinePolicies", Value: report.summary.inlinePolicies },
        { MetricName: "CrossAccountAccess", Value: report.summary.crossAccountAccess },
    ];

    await cloudwatchClient.send(new PutMetricDataCommand({
        Namespace: "IAMCompliance",
        MetricData: metrics.map(m => ({
            MetricName: m.MetricName,
            Value: m.Value,
            Unit: "Count",
            Timestamp: new Date(),
        })),
    }));

    console.log("Metrics sent to CloudWatch");
}
```

## File: lambda/package.json

```json
{
  "name": "iam-compliance-scanner",
  "version": "1.0.0",
  "description": "Lambda function for IAM compliance scanning",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-iam": "^3.400.0",
    "@aws-sdk/client-s3": "^3.400.0",
    "@aws-sdk/client-cloudwatch": "^3.400.0"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

## File: lambda/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## File: Pulumi.yaml

```yaml
name: iam-compliance-analyzer
runtime: nodejs
description: IAM policy compliance analyzer for AWS
```

## File: package.json

```json
{
  "name": "iam-compliance-analyzer",
  "version": "1.0.0",
  "description": "IAM policy compliance analyzer using Pulumi",
  "main": "index.js",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.90.0",
    "@pulumi/aws": "^6.0.0"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^5.0.0",
    "@types/jest": "^29.0.0",
    "jest": "^29.0.0",
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
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "bin", "lambda/node_modules"]
}
```

## File: README.md

```markdown
# IAM Policy Compliance Analyzer

This Pulumi TypeScript project deploys an automated IAM policy compliance analyzer for AWS. It scans existing IAM roles and policies, identifies security compliance issues, and generates detailed reports.

## Features

- **Comprehensive IAM Scanning**: Scans all IAM roles and their attached policies
- **Wildcard Permission Detection**: Identifies overly permissive policies on S3, DynamoDB, and RDS
- **Unused Role Identification**: Flags roles not used in 90+ days
- **Inline Policy Analysis**: Detects inline policies that should be managed policies
- **Cross-Account Access Validation**: Identifies and validates cross-account access patterns
- **Automated Reporting**: Generates JSON compliance reports stored in S3
- **CloudWatch Integration**: Custom metrics and dashboard for monitoring
- **Automated Tagging**: Tags roles with compliance status

## Prerequisites

- Node.js 18.x or later
- Pulumi CLI installed
- AWS credentials configured
- AWS account with appropriate IAM permissions

## Configuration

Create a Pulumi stack and configure the required parameter:

```bash
pulumi stack init dev
pulumi config set environmentSuffix dev123
pulumi config set aws:region us-east-1
```

## Deployment

1. Install dependencies:
```bash
npm install
cd lambda && npm install && cd ..
```

2. Build Lambda function:
```bash
cd lambda
npm run build
cd ..
```

3. Deploy the stack:
```bash
pulumi up
```

4. Note the outputs:
- `reportsBucketName`: S3 bucket containing compliance reports
- `scannerLambdaArn`: ARN of the scanner Lambda function
- `dashboardUrl`: CloudWatch dashboard URL
- `complianceNamespace`: CloudWatch namespace for metrics

## Manual Invocation

To trigger a scan manually:

```bash
aws lambda invoke --function-name iam-scanner-lambda-<environmentSuffix> output.json
```

## Compliance Report Structure

Reports are stored in S3 with the following structure:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "accountId": "123456789012",
  "totalRolesScanned": 150,
  "issues": [
    {
      "roleName": "MyRole",
      "issueType": "WILDCARD_PERMISSION",
      "severity": "HIGH",
      "description": "Policy grants wildcard permissions on s3",
      "recommendation": "Replace wildcard with specific actions"
    }
  ],
  "summary": {
    "compliant": 100,
    "nonCompliant": 30,
    "needsReview": 20,
    "wildcardPermissions": 15,
    "unusedRoles": 10,
    "inlinePolicies": 20,
    "crossAccountAccess": 5
  }
}
```

## Issue Types

- **WILDCARD_PERMISSION**: Policies with wildcard actions on sensitive services
- **UNUSED_ROLE**: Roles not used in 90+ days
- **INLINE_POLICY**: Inline policies that should be managed policies
- **CROSS_ACCOUNT_ACCESS**: Roles with cross-account access

## Compliance Tags

Roles are automatically tagged with:
- `ComplianceStatus`: compliant | non-compliant | needs-review
- `LastScanned`: ISO timestamp of last scan

## CloudWatch Metrics

Available in the `IAMCompliance` namespace:
- TotalRolesScanned
- CompliantRoles
- NonCompliantRoles
- NeedsReviewRoles
- WildcardPermissionsFound
- UnusedRoles
- InlinePolicies
- CrossAccountAccess

## Cleanup

To remove all resources:

```bash
pulumi destroy
```

## Security Considerations

- Lambda function uses read-only IAM permissions (except for tagging)
- Reports are encrypted at rest in S3
- S3 bucket has public access blocked
- Function uses least privilege IAM policies

## Troubleshooting

- Check Lambda logs in CloudWatch Logs
- Verify IAM permissions for the Lambda execution role
- Ensure Lambda timeout is sufficient for large accounts (configured at 300 seconds)
- Check S3 bucket permissions if report upload fails
```
