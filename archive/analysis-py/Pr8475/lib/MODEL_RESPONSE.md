# AWS Infrastructure Compliance Scanner

This implementation creates a Pulumi TypeScript program that scans existing AWS infrastructure and generates compliance reports.

## File: lib/tap-stack.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVolumesCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  DescribeFlowLogsCommand,
} from "@aws-sdk/client-ec2";
import {
  SSMClient,
  DescribeInstanceInformationCommand,
} from "@aws-sdk/client-ssm";
import {
  CloudWatchClient,
  PutMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";

// Configuration
const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");
const awsRegion = config.get("awsRegion") || "us-east-1";

// Approved AMIs list (configurable)
const approvedAmis = config.getObject<string[]>("approvedAmis") || [
  "ami-0c55b159cbfafe1f0", // Example Amazon Linux 2
  "ami-0574da719dca65348", // Example Ubuntu 20.04
];

// Required tags
const requiredTags = ["Environment", "Owner", "CostCenter"];

interface ComplianceViolation {
  resourceId: string;
  resourceType: string;
  violationType: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  details: string;
  timestamp: string;
}

interface ComplianceReport {
  scanTimestamp: string;
  region: string;
  environmentSuffix: string;
  summary: {
    totalResourcesScanned: number;
    totalViolations: number;
    violationsByType: Record<string, number>;
    complianceRate: number;
  };
  violations: ComplianceViolation[];
}

class ComplianceScanner {
  private ec2Client: EC2Client;
  private ssmClient: SSMClient;
  private cloudWatchClient: CloudWatchClient;
  private violations: ComplianceViolation[] = [];
  private region: string;
  private environmentSuffix: string;

  constructor(region: string, environmentSuffix: string) {
    this.region = region;
    this.environmentSuffix = environmentSuffix;
    this.ec2Client = new EC2Client({ region });
    this.ssmClient = new SSMClient({ region });
    this.cloudWatchClient = new CloudWatchClient({ region });
  }

  // 1. Check for unencrypted EBS volumes
  async checkEbsEncryption(): Promise<void> {
    try {
      const instancesResponse = await this.ec2Client.send(
        new DescribeInstancesCommand({})
      );

      const instances =
        instancesResponse.Reservations?.flatMap((r) => r.Instances || []) || [];

      for (const instance of instances) {
        if (!instance.InstanceId) continue;

        const volumeIds =
          instance.BlockDeviceMappings?.map((bdm) => bdm.Ebs?.VolumeId).filter(
            Boolean
          ) || [];

        if (volumeIds.length === 0) continue;

        const volumesResponse = await this.ec2Client.send(
          new DescribeVolumesCommand({
            VolumeIds: volumeIds as string[],
          })
        );

        const unencryptedVolumes =
          volumesResponse.Volumes?.filter((v) => !v.Encrypted) || [];

        for (const volume of unencryptedVolumes) {
          this.violations.push({
            resourceId: instance.InstanceId,
            resourceType: "EC2::Instance",
            violationType: "UnencryptedEBSVolume",
            severity: "HIGH",
            details: `Instance has unencrypted EBS volume: ${volume.VolumeId}`,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error("Error checking EBS encryption:", error);
    }
  }

  // 2. Check security groups for unrestricted inbound rules
  async checkSecurityGroups(): Promise<void> {
    try {
      const instancesResponse = await this.ec2Client.send(
        new DescribeInstancesCommand({})
      );

      const instances =
        instancesResponse.Reservations?.flatMap((r) => r.Instances || []) || [];

      const sgIds = new Set<string>();
      instances.forEach((instance) => {
        instance.SecurityGroups?.forEach((sg) => {
          if (sg.GroupId) sgIds.add(sg.GroupId);
        });
      });

      if (sgIds.size === 0) return;

      const sgResponse = await this.ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: Array.from(sgIds),
        })
      );

      const sensitivePorts = [22, 3389, 3306];

      for (const sg of sgResponse.SecurityGroups || []) {
        for (const rule of sg.IpPermissions || []) {
          const fromPort = rule.FromPort || 0;
          const toPort = rule.ToPort || 0;

          const hasUnrestrictedIpv4 = rule.IpRanges?.some(
            (r) => r.CidrIp === "0.0.0.0/0"
          );
          const hasUnrestrictedIpv6 = rule.Ipv6Ranges?.some(
            (r) => r.CidrIpv6 === "::/0"
          );

          if (hasUnrestrictedIpv4 || hasUnrestrictedIpv6) {
            for (const port of sensitivePorts) {
              if (port >= fromPort && port <= toPort) {
                this.violations.push({
                  resourceId: sg.GroupId || "unknown",
                  resourceType: "EC2::SecurityGroup",
                  violationType: "UnrestrictedInboundRule",
                  severity: "HIGH",
                  details: `Security group ${sg.GroupName} allows unrestricted access (0.0.0.0/0) on port ${port}`,
                  timestamp: new Date().toISOString(),
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking security groups:", error);
    }
  }

  // 3. Check required tags
  async checkRequiredTags(): Promise<void> {
    try {
      const instancesResponse = await this.ec2Client.send(
        new DescribeInstancesCommand({})
      );

      const instances =
        instancesResponse.Reservations?.flatMap((r) => r.Instances || []) || [];

      for (const instance of instances) {
        if (!instance.InstanceId) continue;

        const instanceTags = new Set(
          instance.Tags?.map((t) => t.Key || "") || []
        );
        const missingTags = requiredTags.filter((t) => !instanceTags.has(t));

        if (missingTags.length > 0) {
          this.violations.push({
            resourceId: instance.InstanceId,
            resourceType: "EC2::Instance",
            violationType: "MissingRequiredTags",
            severity: "MEDIUM",
            details: `Instance missing required tags: ${missingTags.join(", ")}`,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error("Error checking required tags:", error);
    }
  }

  // 4. Check for approved AMIs
  async checkApprovedAmis(): Promise<void> {
    try {
      const instancesResponse = await this.ec2Client.send(
        new DescribeInstancesCommand({})
      );

      const instances =
        instancesResponse.Reservations?.flatMap((r) => r.Instances || []) || [];

      for (const instance of instances) {
        if (!instance.InstanceId || !instance.ImageId) continue;

        if (!approvedAmis.includes(instance.ImageId)) {
          this.violations.push({
            resourceId: instance.InstanceId,
            resourceType: "EC2::Instance",
            violationType: "UnapprovedAMI",
            severity: "MEDIUM",
            details: `Instance using unapproved AMI: ${instance.ImageId}`,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error("Error checking approved AMIs:", error);
    }
  }

  // 5. Check SSM agent status
  async checkSsmAgentStatus(): Promise<void> {
    try {
      const instancesResponse = await this.ec2Client.send(
        new DescribeInstancesCommand({})
      );

      const instances =
        instancesResponse.Reservations?.flatMap((r) => r.Instances || []) || [];
      const instanceIds = instances
        .map((i) => i.InstanceId)
        .filter(Boolean) as string[];

      if (instanceIds.length === 0) return;

      const ssmResponse = await this.ssmClient.send(
        new DescribeInstanceInformationCommand({})
      );

      const managedInstanceIds = new Set(
        ssmResponse.InstanceInformationList?.map((i) => i.InstanceId) || []
      );

      for (const instanceId of instanceIds) {
        if (!managedInstanceIds.has(instanceId)) {
          this.violations.push({
            resourceId: instanceId,
            resourceType: "EC2::Instance",
            violationType: "SSMAgentNotConnected",
            severity: "MEDIUM",
            details: `Instance does not have SSM agent connected`,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error("Error checking SSM agent status:", error);
    }
  }

  // 6. Check VPC flow logs
  async checkVpcFlowLogs(): Promise<void> {
    try {
      const vpcsResponse = await this.ec2Client.send(
        new DescribeVpcsCommand({})
      );

      const vpcs = vpcsResponse.Vpcs || [];

      for (const vpc of vpcs) {
        if (!vpc.VpcId) continue;

        const flowLogsResponse = await this.ec2Client.send(
          new DescribeFlowLogsCommand({
            Filter: [
              {
                Name: "resource-id",
                Values: [vpc.VpcId],
              },
            ],
          })
        );

        const hasFlowLogs = (flowLogsResponse.FlowLogs?.length || 0) > 0;

        if (!hasFlowLogs) {
          this.violations.push({
            resourceId: vpc.VpcId,
            resourceType: "EC2::VPC",
            violationType: "FlowLogsDisabled",
            severity: "MEDIUM",
            details: `VPC does not have flow logs enabled`,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error("Error checking VPC flow logs:", error);
    }
  }

  // 7. Generate compliance report
  async generateReport(): Promise<ComplianceReport> {
    const totalResourcesScanned = await this.getTotalResourcesScanned();

    const violationsByType: Record<string, number> = {};
    for (const violation of this.violations) {
      violationsByType[violation.violationType] =
        (violationsByType[violation.violationType] || 0) + 1;
    }

    const complianceRate =
      totalResourcesScanned > 0
        ? ((totalResourcesScanned - this.violations.length) /
            totalResourcesScanned) *
          100
        : 100;

    return {
      scanTimestamp: new Date().toISOString(),
      region: this.region,
      environmentSuffix: this.environmentSuffix,
      summary: {
        totalResourcesScanned,
        totalViolations: this.violations.length,
        violationsByType,
        complianceRate: Math.round(complianceRate * 100) / 100,
      },
      violations: this.violations,
    };
  }

  private async getTotalResourcesScanned(): Promise<number> {
    try {
      const instancesResponse = await this.ec2Client.send(
        new DescribeInstancesCommand({})
      );
      const instances =
        instancesResponse.Reservations?.flatMap((r) => r.Instances || []) || [];

      const vpcsResponse = await this.ec2Client.send(
        new DescribeVpcsCommand({})
      );
      const vpcs = vpcsResponse.Vpcs || [];

      return instances.length + vpcs.length;
    } catch (error) {
      console.error("Error getting total resources:", error);
      return 0;
    }
  }

  // 8. Export CloudWatch metrics
  async exportMetrics(report: ComplianceReport): Promise<void> {
    try {
      await this.cloudWatchClient.send(
        new PutMetricDataCommand({
          Namespace: `ComplianceScanner/${this.environmentSuffix}`,
          MetricData: [
            {
              MetricName: "TotalResourcesScanned",
              Value: report.summary.totalResourcesScanned,
              Unit: "Count",
              Timestamp: new Date(),
            },
            {
              MetricName: "TotalViolations",
              Value: report.summary.totalViolations,
              Unit: "Count",
              Timestamp: new Date(),
            },
            {
              MetricName: "ComplianceRate",
              Value: report.summary.complianceRate,
              Unit: "Percent",
              Timestamp: new Date(),
            },
          ],
        })
      );

      console.log("CloudWatch metrics exported successfully");
    } catch (error) {
      console.error("Error exporting CloudWatch metrics:", error);
    }
  }

  async runAllChecks(): Promise<ComplianceReport> {
    console.log("Starting compliance scan...");

    await this.checkEbsEncryption();
    await this.checkSecurityGroups();
    await this.checkRequiredTags();
    await this.checkApprovedAmis();
    await this.checkSsmAgentStatus();
    await this.checkVpcFlowLogs();

    const report = await this.generateReport();
    await this.exportMetrics(report);

    return report;
  }
}

// Main stack
export class ComplianceScannerStack {
  constructor() {
    // Create S3 bucket for compliance reports
    const reportBucket = new aws.s3.BucketV2(
      `compliance-reports-${environmentSuffix}`,
      {
        bucket: `compliance-reports-${environmentSuffix}`,
        tags: {
          Name: `compliance-reports-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      }
    );

    // Enable versioning
    new aws.s3.BucketVersioningV2(
      `compliance-reports-versioning-${environmentSuffix}`,
      {
        bucket: reportBucket.id,
        versioningConfiguration: {
          status: "Enabled",
        },
      }
    );

    // Block public access
    new aws.s3.BucketPublicAccessBlock(
      `compliance-reports-public-access-${environmentSuffix}`,
      {
        bucket: reportBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }
    );

    // Create Lambda execution role
    const lambdaRole = new aws.iam.Role(
      `compliance-scanner-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: {
                Service: "lambda.amazonaws.com",
              },
              Action: "sts:AssumeRole",
            },
          ],
        }),
        tags: {
          Name: `compliance-scanner-role-${environmentSuffix}`,
        },
      }
    );

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      `compliance-scanner-lambda-basic-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
      }
    );

    // Create custom policy for compliance scanning
    const compliancePolicy = new aws.iam.Policy(
      `compliance-scanner-policy-${environmentSuffix}`,
      {
        policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: [
                "ec2:DescribeInstances",
                "ec2:DescribeVolumes",
                "ec2:DescribeSecurityGroups",
                "ec2:DescribeVpcs",
                "ec2:DescribeFlowLogs",
                "ssm:DescribeInstanceInformation",
                "cloudwatch:PutMetricData",
              ],
              Resource: "*",
            },
            {
              Effect: "Allow",
              Action: ["s3:PutObject", "s3:PutObjectAcl"],
              Resource: pulumi.interpolate`${reportBucket.arn}/*`,
            },
          ],
        }),
        tags: {
          Name: `compliance-scanner-policy-${environmentSuffix}`,
        },
      }
    );

    // Attach custom policy
    new aws.iam.RolePolicyAttachment(
      `compliance-scanner-custom-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn: compliancePolicy.arn,
      }
    );

    // Lambda function for scheduled scanning
    const scannerLambda = new aws.lambda.Function(
      `compliance-scanner-${environmentSuffix}`,
      {
        runtime: aws.lambda.Runtime.NodeJS18dX,
        handler: "index.handler",
        role: lambdaRole.arn,
        timeout: 300,
        memorySize: 512,
        environment: {
          variables: {
            ENVIRONMENT_SUFFIX: environmentSuffix,
            AWS_REGION_NAME: awsRegion,
            REPORT_BUCKET: reportBucket.id,
            APPROVED_AMIS: JSON.stringify(approvedAmis),
          },
        },
        code: new pulumi.asset.AssetArchive({
          "index.js": new pulumi.asset.StringAsset(`
            const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
            ${this.getLambdaCode()}
          `),
        }),
        tags: {
          Name: `compliance-scanner-${environmentSuffix}`,
        },
      }
    );

    // EventBridge rule for daily scanning
    const scheduledRule = new aws.cloudwatch.EventRule(
      `compliance-scan-schedule-${environmentSuffix}`,
      {
        scheduleExpression: "rate(1 day)",
        description: "Trigger compliance scanner daily",
        tags: {
          Name: `compliance-scan-schedule-${environmentSuffix}`,
        },
      }
    );

    // Allow EventBridge to invoke Lambda
    new aws.lambda.Permission(
      `compliance-scanner-eventbridge-${environmentSuffix}`,
      {
        action: "lambda:InvokeFunction",
        function: scannerLambda.name,
        principal: "events.amazonaws.com",
        sourceArn: scheduledRule.arn,
      }
    );

    // EventBridge target
    new aws.cloudwatch.EventTarget(
      `compliance-scanner-target-${environmentSuffix}`,
      {
        rule: scheduledRule.name,
        arn: scannerLambda.arn,
      }
    );

    // Export outputs
    pulumi.export("reportBucketName", reportBucket.id);
    pulumi.export("scannerLambdaArn", scannerLambda.arn);
    pulumi.export("scheduledRuleName", scheduledRule.name);
  }

  private getLambdaCode(): string {
    return `
      exports.handler = async (event) => {
        const scanner = new ComplianceScanner(
          process.env.AWS_REGION_NAME,
          process.env.ENVIRONMENT_SUFFIX
        );

        const report = await scanner.runAllChecks();

        // Upload report to S3
        const s3Client = new S3Client({ region: process.env.AWS_REGION_NAME });
        const reportKey = \`compliance-reports/\${new Date().toISOString()}.json\`;

        await s3Client.send(new PutObjectCommand({
          Bucket: process.env.REPORT_BUCKET,
          Key: reportKey,
          Body: JSON.stringify(report, null, 2),
          ContentType: 'application/json'
        }));

        console.log('Compliance report generated:', report.summary);

        return {
          statusCode: 200,
          body: JSON.stringify({
            message: 'Compliance scan completed',
            summary: report.summary,
            reportLocation: \`s3://\${process.env.REPORT_BUCKET}/\${reportKey}\`
          })
        };
      };
    `;
  }
}

// Instantiate the stack
const stack = new ComplianceScannerStack();
```

## File: lib/README.md

```markdown
# AWS Infrastructure Compliance Scanner

A Pulumi TypeScript application that scans existing AWS infrastructure and generates compliance reports.

## Features

- **EBS Encryption Check**: Identifies unencrypted EBS volumes
- **Security Group Analysis**: Detects unrestricted inbound rules on sensitive ports
- **Tag Compliance**: Verifies required tags (Environment, Owner, CostCenter)
- **AMI Approval**: Validates instances use approved AMIs
- **SSM Agent Status**: Checks SSM agent connectivity
- **VPC Flow Logs**: Ensures flow logs are enabled
- **Automated Reports**: Generates JSON reports stored in S3
- **CloudWatch Metrics**: Exports compliance metrics for monitoring

## Prerequisites

- Node.js 18+
- Pulumi CLI
- AWS credentials configured
- AWS account with resources to scan

## Configuration

Create a `Pulumi.dev.yaml` configuration file:

```yaml
config:
  tap:environmentSuffix: "dev-12345"
  tap:awsRegion: "us-east-1"
  tap:approvedAmis:
    - "ami-0c55b159cbfafe1f0"
    - "ami-0574da719dca65348"
```

## Deployment

```bash
# Install dependencies
npm install

# Deploy the stack
pulumi up

# The scanner will run daily automatically via EventBridge
```

## Manual Scan

Invoke the Lambda function manually:

```bash
aws lambda invoke \
  --function-name compliance-scanner-<environmentSuffix> \
  --region us-east-1 \
  output.json
```

## Report Format

Reports are stored in S3 as JSON:

```json
{
  "scanTimestamp": "2025-12-03T18:30:00Z",
  "region": "us-east-1",
  "environmentSuffix": "dev-12345",
  "summary": {
    "totalResourcesScanned": 50,
    "totalViolations": 12,
    "violationsByType": {
      "UnencryptedEBSVolume": 3,
      "UnrestrictedInboundRule": 5,
      "MissingRequiredTags": 4
    },
    "complianceRate": 76.0
  },
  "violations": [...]
}
```

## CloudWatch Metrics

View metrics in CloudWatch under namespace: `ComplianceScanner/<environmentSuffix>`

- `TotalResourcesScanned`
- `TotalViolations`
- `ComplianceRate` (percentage)

## IAM Permissions

The Lambda function requires:
- EC2 read permissions (DescribeInstances, DescribeVolumes, etc.)
- SSM read permissions (DescribeInstanceInformation)
- CloudWatch write permissions (PutMetricData)
- S3 write permissions (PutObject)

## Cleanup

```bash
pulumi destroy
```

## Testing

```bash
npm test
```
```

## File: package.json

```json
{
  "name": "compliance-scanner",
  "version": "1.0.0",
  "description": "AWS Infrastructure Compliance Scanner",
  "main": "index.js",
  "scripts": {
    "test": "jest"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.100.0",
    "@pulumi/aws": "^6.15.0",
    "@aws-sdk/client-ec2": "^3.470.0",
    "@aws-sdk/client-ssm": "^3.470.0",
    "@aws-sdk/client-cloudwatch": "^3.470.0",
    "@aws-sdk/client-s3": "^3.470.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0"
  }
}
```
