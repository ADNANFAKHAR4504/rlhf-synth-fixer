# Infrastructure Compliance Analysis System - Implementation

## File: lib/tap-stack.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface TapStackArgs {
  environmentSuffix: string;
  approvedAmiIds?: string[];
}

interface ComplianceViolation {
  resourceId: string;
  resourceType: string;
  violationType: string;
  severity: "critical" | "high" | "medium" | "low";
  details: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly violationsReport: pulumi.Output<string>;
  public readonly snsTopic: aws.sns.Topic;
  public readonly violationCount: pulumi.Output<number>;

  constructor(name: string, args: TapStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:infrastructure:TapStack", name, {}, opts);

    const config = new pulumi.Config();
    const approvedAmis = args.approvedAmiIds || config.getObject<string[]>("approvedAmis") || [];
    const requiredTags = ["Environment", "Owner", "CostCenter"];

    // Create SNS Topic for critical violation alerts
    this.snsTopic = new aws.sns.Topic(`compliance-alerts-${args.environmentSuffix}`, {
      name: `compliance-alerts-${args.environmentSuffix}`,
      displayName: "Infrastructure Compliance Alerts",
      tags: {
        Name: `compliance-alerts-${args.environmentSuffix}`,
        Purpose: "ComplianceNotifications",
      },
    }, { parent: this });

    // Collect all violations
    const violations = pulumi.all([
      this.checkEc2TagCompliance(requiredTags, args.environmentSuffix),
      this.checkS3BucketCompliance(args.environmentSuffix),
      this.checkEc2AmiCompliance(approvedAmis, args.environmentSuffix),
      this.checkSecurityGroupCompliance(args.environmentSuffix),
      this.checkIamRoleCompliance(args.environmentSuffix),
    ]).apply(([ec2TagViolations, s3Violations, amiViolations, sgViolations, iamViolations]) => {
      return [
        ...ec2TagViolations,
        ...s3Violations,
        ...amiViolations,
        ...sgViolations,
        ...iamViolations,
      ];
    });

    // Generate CloudWatch metrics for violations
    violations.apply(async (allViolations) => {
      await this.publishCloudWatchMetrics(allViolations, args.environmentSuffix);
    });

    // Send SNS notifications for critical violations
    violations.apply(async (allViolations) => {
      const criticalViolations = allViolations.filter(v => v.severity === "critical");
      if (criticalViolations.length > 0) {
        await this.sendCriticalAlerts(criticalViolations, args.environmentSuffix);
      }
    });

    // Export violations as JSON report
    this.violationsReport = violations.apply(v => JSON.stringify(v, null, 2));
    this.violationCount = violations.apply(v => v.length);

    this.registerOutputs({
      violationsReport: this.violationsReport,
      snsTopicArn: this.snsTopic.arn,
      violationCount: this.violationCount,
    });
  }

  private checkEc2TagCompliance(
    requiredTags: string[],
    environmentSuffix: string
  ): pulumi.Output<ComplianceViolation[]> {
    return pulumi.output(aws.ec2.getInstances({
      filters: [{ name: "instance-state-name", values: ["running", "stopped"] }],
    })).apply(async (instances) => {
      const violations: ComplianceViolation[] = [];

      for (const instanceId of instances.ids) {
        const instance = await aws.ec2.getInstance({ instanceId });
        const tags = instance.tags || {};
        const missingTags = requiredTags.filter(tag => !tags[tag]);

        if (missingTags.length > 0) {
          violations.push({
            resourceId: instanceId,
            resourceType: "EC2Instance",
            violationType: "MissingRequiredTags",
            severity: "medium",
            details: `Missing tags: ${missingTags.join(", ")}`,
          });
        }
      }

      return violations;
    });
  }

  private checkS3BucketCompliance(environmentSuffix: string): pulumi.Output<ComplianceViolation[]> {
    return pulumi.output(aws.s3.getBuckets({})).apply(async (buckets) => {
      const violations: ComplianceViolation[] = [];

      for (const bucketName of buckets.names) {
        // Check encryption
        try {
          await aws.s3.getBucketEncryption({ bucket: bucketName });
        } catch (error) {
          violations.push({
            resourceId: bucketName,
            resourceType: "S3Bucket",
            violationType: "EncryptionNotEnabled",
            severity: "critical",
            details: "S3 bucket does not have encryption enabled",
          });
        }

        // Check versioning
        const versioning = await aws.s3.getBucketVersioning({ bucket: bucketName });
        if (versioning.status !== "Enabled") {
          violations.push({
            resourceId: bucketName,
            resourceType: "S3Bucket",
            violationType: "VersioningNotEnabled",
            severity: "medium",
            details: "S3 bucket versioning is not enabled",
          });
        }
      }

      return violations;
    });
  }

  private checkEc2AmiCompliance(
    approvedAmis: string[],
    environmentSuffix: string
  ): pulumi.Output<ComplianceViolation[]> {
    if (approvedAmis.length === 0) {
      return pulumi.output([]);
    }

    return pulumi.output(aws.ec2.getInstances({
      filters: [{ name: "instance-state-name", values: ["running", "stopped"] }],
    })).apply(async (instances) => {
      const violations: ComplianceViolation[] = [];

      for (const instanceId of instances.ids) {
        const instance = await aws.ec2.getInstance({ instanceId });

        if (!approvedAmis.includes(instance.ami)) {
          violations.push({
            resourceId: instanceId,
            resourceType: "EC2Instance",
            violationType: "UnapprovedAMI",
            severity: "high",
            details: `Instance using unapproved AMI: ${instance.ami}`,
          });
        }
      }

      return violations;
    });
  }

  private checkSecurityGroupCompliance(environmentSuffix: string): pulumi.Output<ComplianceViolation[]> {
    return pulumi.output(aws.ec2.getSecurityGroups({})).apply(async (sgs) => {
      const violations: ComplianceViolation[] = [];

      for (const sg of sgs.ids) {
        const securityGroup = await aws.ec2.getSecurityGroup({ id: sg });

        // Check for open SSH (port 22)
        const openSsh = securityGroup.ingress?.some(rule =>
          (rule.fromPort === 22 || rule.toPort === 22) &&
          (rule.cidrBlocks?.includes("0.0.0.0/0") || rule.ipv6CidrBlocks?.includes("::/0"))
        );

        if (openSsh) {
          violations.push({
            resourceId: sg,
            resourceType: "SecurityGroup",
            violationType: "OpenSSHPort",
            severity: "critical",
            details: `Security group ${securityGroup.name} allows SSH from 0.0.0.0/0`,
          });
        }

        // Check for open RDP (port 3389)
        const openRdp = securityGroup.ingress?.some(rule =>
          (rule.fromPort === 3389 || rule.toPort === 3389) &&
          (rule.cidrBlocks?.includes("0.0.0.0/0") || rule.ipv6CidrBlocks?.includes("::/0"))
        );

        if (openRdp) {
          violations.push({
            resourceId: sg,
            resourceType: "SecurityGroup",
            violationType: "OpenRDPPort",
            severity: "critical",
            details: `Security group ${securityGroup.name} allows RDP from 0.0.0.0/0`,
          });
        }
      }

      return violations;
    });
  }

  private checkIamRoleCompliance(environmentSuffix: string): pulumi.Output<ComplianceViolation[]> {
    return pulumi.output(aws.iam.getRoles({})).apply(async (roles) => {
      const violations: ComplianceViolation[] = [];

      for (const roleName of roles.names) {
        const role = await aws.iam.getRole({ name: roleName });

        // Check attached policies
        const attachedPolicies = await aws.iam.getRolePolicyAttachments({ role: roleName });

        for (const policyArn of attachedPolicies.policyArns) {
          const policy = await aws.iam.getPolicy({ arn: policyArn });
          const policyVersion = await aws.iam.getPolicyVersion({
            arn: policyArn,
            versionId: policy.defaultVersionId,
          });

          const policyDocument = JSON.parse(decodeURIComponent(policyVersion.policyDocument));

          // Check for wildcard permissions
          const hasWildcards = policyDocument.Statement?.some((stmt: any) =>
            stmt.Effect === "Allow" &&
            (stmt.Action === "*" ||
             (Array.isArray(stmt.Action) && stmt.Action.includes("*")) ||
             stmt.Resource === "*" ||
             (Array.isArray(stmt.Resource) && stmt.Resource.includes("*")))
          );

          if (hasWildcards) {
            violations.push({
              resourceId: roleName,
              resourceType: "IAMRole",
              violationType: "WildcardPermissions",
              severity: "high",
              details: `IAM role has wildcard permissions in policy ${policy.name}`,
            });
            break; // Only report once per role
          }
        }

        // Check inline policies
        const inlinePolicies = await aws.iam.getRolePolicy({ role: roleName }).catch(() => null);
        if (inlinePolicies) {
          const policyDocument = JSON.parse(decodeURIComponent(inlinePolicies.policy));

          const hasWildcards = policyDocument.Statement?.some((stmt: any) =>
            stmt.Effect === "Allow" &&
            (stmt.Action === "*" ||
             (Array.isArray(stmt.Action) && stmt.Action.includes("*")) ||
             stmt.Resource === "*" ||
             (Array.isArray(stmt.Resource) && stmt.Resource.includes("*")))
          );

          if (hasWildcards) {
            violations.push({
              resourceId: roleName,
              resourceType: "IAMRole",
              violationType: "WildcardPermissions",
              severity: "high",
              details: "IAM role has wildcard permissions in inline policy",
            });
          }
        }
      }

      return violations;
    });
  }

  private async publishCloudWatchMetrics(
    violations: ComplianceViolation[],
    environmentSuffix: string
  ): Promise<void> {
    const cloudwatch = new aws.sdk.CloudWatch({ region: aws.config.region });

    // Group violations by type
    const violationsByType = violations.reduce((acc, v) => {
      acc[v.violationType] = (acc[v.violationType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Publish metrics
    const metricData = Object.entries(violationsByType).map(([type, count]) => ({
      MetricName: type,
      Value: count,
      Unit: "Count",
      Timestamp: new Date(),
      Dimensions: [
        { Name: "Environment", Value: environmentSuffix },
      ],
    }));

    if (metricData.length > 0) {
      await cloudwatch.putMetricData({
        Namespace: `ComplianceMonitoring-${environmentSuffix}`,
        MetricData: metricData,
      }).promise();
    }

    // Publish total violation count
    await cloudwatch.putMetricData({
      Namespace: `ComplianceMonitoring-${environmentSuffix}`,
      MetricData: [{
        MetricName: "TotalViolations",
        Value: violations.length,
        Unit: "Count",
        Timestamp: new Date(),
        Dimensions: [
          { Name: "Environment", Value: environmentSuffix },
        ],
      }],
    }).promise();
  }

  private async sendCriticalAlerts(
    criticalViolations: ComplianceViolation[],
    environmentSuffix: string
  ): Promise<void> {
    const sns = new aws.sdk.SNS({ region: aws.config.region });

    const message = {
      subject: `Critical Compliance Violations Detected - ${environmentSuffix}`,
      violations: criticalViolations,
      timestamp: new Date().toISOString(),
      totalCount: criticalViolations.length,
    };

    await this.snsTopic.arn.apply(async (topicArn) => {
      await sns.publish({
        TopicArn: topicArn,
        Subject: message.subject,
        Message: JSON.stringify(message, null, 2),
      }).promise();
    });
  }
}
```

## File: bin/tap.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import { TapStack } from "../lib/tap-stack";

const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");
const approvedAmiIds = config.getObject<string[]>("approvedAmiIds");

const stack = new TapStack("tap-stack", {
  environmentSuffix,
  approvedAmiIds,
});

export const violationsReport = stack.violationsReport;
export const snsTopicArn = stack.snsTopic.arn;
export const violationCount = stack.violationCount;
```

## File: Pulumi.yaml

```yaml
name: tap
runtime: nodejs
description: Infrastructure compliance analysis and validation system
config:
  aws:region:
    description: AWS region for deployment
    default: us-east-1
  tap:environmentSuffix:
    description: Environment suffix for resource naming
  tap:approvedAmiIds:
    description: List of approved AMI IDs
    type: array
    default: []
```

## File: package.json

```json
{
  "name": "tap-compliance-analysis",
  "version": "1.0.0",
  "description": "Infrastructure compliance analysis system",
  "main": "bin/tap.js",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:int": "jest --testPathPattern=int"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  }
}
```

## File: lib/README.md

```markdown
# Infrastructure Compliance Analysis System

## Overview

This Pulumi TypeScript program analyzes deployed AWS infrastructure and validates compliance against security policies. It performs eight different compliance checks and generates reports with CloudWatch metrics and SNS notifications for critical violations.

## Features

1. **EC2 Tag Validation**: Verifies all instances have required tags (Environment, Owner, CostCenter)
2. **S3 Security Compliance**: Checks encryption and versioning configuration
3. **AMI Compliance**: Validates instances use approved AMI IDs
4. **Security Group Analysis**: Detects open SSH/RDP ports from 0.0.0.0/0
5. **IAM Role Validation**: Identifies wildcard permissions
6. **CloudWatch Metrics**: Publishes violation counts by type
7. **JSON Reports**: Exports detailed violation data
8. **SNS Alerts**: Sends notifications for critical violations

## Configuration

Set the following Pulumi config values:

```bash
pulumi config set aws:region us-east-1
pulumi config set tap:environmentSuffix dev123
pulumi config set tap:approvedAmiIds '["ami-0abcdef123456789", "ami-0987654321fedcba"]'
```

## Deployment

```bash
npm install
pulumi up
```

## Outputs

- `violationsReport`: JSON report of all violations
- `snsTopicArn`: SNS topic ARN for alerts
- `violationCount`: Total number of violations found

## Compliance Checks

### Critical Severity
- S3 buckets without encryption
- Security groups with open SSH (port 22) from 0.0.0.0/0
- Security groups with open RDP (port 3389) from 0.0.0.0/0

### High Severity
- EC2 instances using unapproved AMIs
- IAM roles with wildcard permissions

### Medium Severity
- EC2 instances missing required tags
- S3 buckets without versioning

## CloudWatch Metrics

Metrics are published to namespace: `ComplianceMonitoring-{environmentSuffix}`

Metric names:
- MissingRequiredTags
- EncryptionNotEnabled
- VersioningNotEnabled
- UnapprovedAMI
- OpenSSHPort
- OpenRDPPort
- WildcardPermissions
- TotalViolations

## Testing

```bash
npm test              # Run all tests
npm run test:unit     # Run unit tests only
npm run test:int      # Run integration tests only
```
```
