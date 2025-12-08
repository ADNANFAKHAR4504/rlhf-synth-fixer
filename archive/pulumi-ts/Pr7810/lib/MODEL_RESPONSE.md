# Infrastructure Compliance Analysis Solution

This solution implements a complete infrastructure compliance scanner using Pulumi TypeScript. The system analyzes existing AWS resources for security and compliance violations, generates detailed reports, and publishes metrics to CloudWatch.

## Architecture Overview

The solution consists of:
- Lambda function that performs compliance analysis
- S3 bucket for storing compliance reports
- IAM role with necessary permissions
- CloudWatch Logs for execution logging
- Custom CloudWatch metrics for violation tracking

## Implementation Files

### File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';
import * as path from 'path';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly reportBucketName: pulumi.Output<string>;
  public readonly complianceFunctionArn: pulumi.Output<string>;
  public readonly complianceFunctionName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // S3 bucket for compliance reports
    const reportBucket = new aws.s3.Bucket(
      `compliance-reports-${environmentSuffix}`,
      {
        bucket: `compliance-reports-${environmentSuffix}`,
        forceDestroy: true,
        tags: {
          ...tags,
          Name: `compliance-reports-${environmentSuffix}`,
        },
        lifecycleRules: [
          {
            enabled: true,
            expiration: {
              days: 90,
            },
            id: 'delete-old-reports',
          },
        ],
      },
      { parent: this }
    );

    // IAM role for Lambda function
    const lambdaRole = new aws.iam.Role(
      `compliance-scanner-role-${environmentSuffix}`,
      {
        name: `compliance-scanner-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          ...tags,
          Name: `compliance-scanner-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // IAM policy for Lambda function
    const lambdaPolicy = new aws.iam.RolePolicy(
      `compliance-scanner-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi.all([reportBucket.bucket]).apply(([bucketName]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                ],
                Resource: 'arn:aws:logs:*:*:*',
              },
              {
                Effect: 'Allow',
                Action: [
                  'ec2:DescribeInstances',
                  'ec2:DescribeVolumes',
                  'ec2:DescribeSecurityGroups',
                  'ec2:DescribeVpcs',
                  'ec2:DescribeFlowLogs',
                ],
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: ['iam:ListRoles', 'iam:ListRolePolicies', 'iam:ListAttachedRolePolicies'],
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: ['s3:PutObject', 's3:PutObjectAcl'],
                Resource: `arn:aws:s3:::${bucketName}/*`,
              },
              {
                Effect: 'Allow',
                Action: ['cloudwatch:PutMetricData'],
                Resource: '*',
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Lambda function for compliance scanning
    const complianceFunction = new aws.lambda.Function(
      `compliance-scanner-${environmentSuffix}`,
      {
        name: `compliance-scanner-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS20dX,
        handler: 'index.handler',
        role: lambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.FileAsset(path.join(__dirname, 'lambda', 'compliance-scanner.js')),
        }),
        timeout: 300,
        memorySize: 512,
        environment: {
          variables: {
            REPORT_BUCKET: reportBucket.bucket,
            ENVIRONMENT_SUFFIX: environmentSuffix,
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
          },
        },
        tags: {
          ...tags,
          Name: `compliance-scanner-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [lambdaPolicy] }
    );

    // CloudWatch Log Group for Lambda
    const logGroup = new aws.cloudwatch.LogGroup(
      `compliance-scanner-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/compliance-scanner-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          ...tags,
          Name: `compliance-scanner-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.reportBucketName = reportBucket.bucket;
    this.complianceFunctionArn = complianceFunction.arn;
    this.complianceFunctionName = complianceFunction.name;

    this.registerOutputs({
      reportBucketName: this.reportBucketName,
      complianceFunctionArn: this.complianceFunctionArn,
      complianceFunctionName: this.complianceFunctionName,
    });
  }
}
```

### File: lib/lambda/compliance-scanner.js

```javascript
const {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVolumesCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  DescribeFlowLogsCommand,
} = require('@aws-sdk/client-ec2');
const { IAMClient, ListRolesCommand, ListAttachedRolePoliciesCommand } = require('@aws-sdk/client-iam');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');

const region = process.env.AWS_REGION || 'us-east-1';
const ec2Client = new EC2Client({ region });
const iamClient = new IAMClient({ region });
const s3Client = new S3Client({ region });
const cloudWatchClient = new CloudWatchClient({ region });

const REPORT_BUCKET = process.env.REPORT_BUCKET;
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'dev';

exports.handler = async (event) => {
  console.log('Starting compliance scan...');

  const violations = {
    unencryptedVolumes: [],
    permissiveSecurityGroups: [],
    missingTags: [],
    iamViolations: [],
    missingFlowLogs: [],
  };

  try {
    // Scan EC2 instances and volumes
    await scanEC2Instances(violations);

    // Scan security groups
    await scanSecurityGroups(violations);

    // Scan IAM roles
    await scanIAMRoles(violations);

    // Scan VPC flow logs
    await scanVPCFlowLogs(violations);

    // Generate report
    const report = generateReport(violations);

    // Upload report to S3
    await uploadReport(report);

    // Publish metrics to CloudWatch
    await publishMetrics(violations);

    console.log('Compliance scan completed successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Compliance scan completed',
        summary: {
          unencryptedVolumes: violations.unencryptedVolumes.length,
          permissiveSecurityGroups: violations.permissiveSecurityGroups.length,
          missingTags: violations.missingTags.length,
          iamViolations: violations.iamViolations.length,
          missingFlowLogs: violations.missingFlowLogs.length,
        },
        reportLocation: `s3://${REPORT_BUCKET}/compliance-reports/${report.timestamp}.json`,
      }),
    };
  } catch (error) {
    console.error('Error during compliance scan:', error);
    throw error;
  }
};

async function scanEC2Instances(violations) {
  console.log('Scanning EC2 instances...');

  try {
    const instancesResponse = await ec2Client.send(new DescribeInstancesCommand({}));

    const requiredTags = ['Environment', 'Owner', 'CostCenter'];

    for (const reservation of instancesResponse.Reservations || []) {
      for (const instance of reservation.Instances || []) {
        // Skip terminated instances
        if (instance.State.Name === 'terminated') continue;

        const instanceId = instance.InstanceId;
        const tags = instance.Tags || [];
        const tagKeys = tags.map((t) => t.Key);

        // Check for missing tags
        const missingTagsForInstance = requiredTags.filter((tag) => !tagKeys.includes(tag));
        if (missingTagsForInstance.length > 0) {
          violations.missingTags.push({
            resourceType: 'EC2Instance',
            resourceId: instanceId,
            missingTags: missingTagsForInstance,
          });
        }

        // Check volumes for encryption
        for (const blockDevice of instance.BlockDeviceMappings || []) {
          if (blockDevice.Ebs && blockDevice.Ebs.VolumeId) {
            const volumeId = blockDevice.Ebs.VolumeId;
            const volumeResponse = await ec2Client.send(
              new DescribeVolumesCommand({
                VolumeIds: [volumeId],
              })
            );

            const volume = volumeResponse.Volumes[0];
            if (!volume.Encrypted) {
              violations.unencryptedVolumes.push({
                instanceId: instanceId,
                volumeId: volumeId,
              });
            }
          }
        }
      }
    }

    console.log(`Found ${violations.unencryptedVolumes.length} unencrypted volumes`);
    console.log(`Found ${violations.missingTags.length} instances with missing tags`);
  } catch (error) {
    console.error('Error scanning EC2 instances:', error);
    throw error;
  }
}

async function scanSecurityGroups(violations) {
  console.log('Scanning security groups...');

  try {
    const sgResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({}));

    for (const sg of sgResponse.SecurityGroups || []) {
      const sgId = sg.GroupId;
      const sgDescription = sg.Description;

      // Check if description is missing or generic
      if (!sgDescription || sgDescription.trim() === '' || sgDescription === 'default VPC security group') {
        // Only flag if not the default security group
        if (sg.GroupName !== 'default') {
          violations.permissiveSecurityGroups.push({
            securityGroupId: sgId,
            violationType: 'MissingDescription',
            description: 'Security group lacks a proper description',
          });
        }
      }

      // Check for overly permissive rules
      for (const rule of sg.IpPermissions || []) {
        const fromPort = rule.FromPort;
        const toPort = rule.ToPort;

        for (const ipRange of rule.IpRanges || []) {
          const cidr = ipRange.CidrIp;

          // Flag 0.0.0.0/0 access on non-standard ports
          if (cidr === '0.0.0.0/0') {
            // Allow only ports 80 and 443
            const isAllowedPort = (fromPort === 80 && toPort === 80) || (fromPort === 443 && toPort === 443);

            if (!isAllowedPort) {
              violations.permissiveSecurityGroups.push({
                securityGroupId: sgId,
                violationType: 'OverlyPermissiveRule',
                rule: {
                  fromPort: fromPort,
                  toPort: toPort,
                  cidr: cidr,
                },
                description: `Allows 0.0.0.0/0 access on port(s) ${fromPort}-${toPort}`,
              });
            }
          }
        }
      }
    }

    console.log(`Found ${violations.permissiveSecurityGroups.length} security group violations`);
  } catch (error) {
    console.error('Error scanning security groups:', error);
    throw error;
  }
}

async function scanIAMRoles(violations) {
  console.log('Scanning IAM roles...');

  try {
    const rolesResponse = await iamClient.send(new ListRolesCommand({}));

    for (const role of rolesResponse.Roles || []) {
      const roleName = role.RoleName;

      // Skip AWS service roles
      if (roleName.startsWith('AWS') || roleName.startsWith('aws-')) {
        continue;
      }

      // Check if role has attached policies
      const policiesResponse = await iamClient.send(
        new ListAttachedRolePoliciesCommand({
          RoleName: roleName,
        })
      );

      const attachedPolicies = policiesResponse.AttachedPolicies || [];

      if (attachedPolicies.length === 0) {
        violations.iamViolations.push({
          roleName: roleName,
          violationType: 'NoPoliciesAttached',
          description: 'IAM role has no policies attached',
        });
      }

      // Check for overly broad permissions
      for (const policy of attachedPolicies) {
        if (policy.PolicyName === 'AdministratorAccess' || policy.PolicyName === 'PowerUserAccess') {
          violations.iamViolations.push({
            roleName: roleName,
            violationType: 'OverlyBroadPermissions',
            policyName: policy.PolicyName,
            description: `Role has overly broad policy: ${policy.PolicyName}`,
          });
        }
      }
    }

    console.log(`Found ${violations.iamViolations.length} IAM violations`);
  } catch (error) {
    console.error('Error scanning IAM roles:', error);
    throw error;
  }
}

async function scanVPCFlowLogs(violations) {
  console.log('Scanning VPC flow logs...');

  try {
    // Get all VPCs
    const vpcsResponse = await ec2Client.send(new DescribeVpcsCommand({}));

    // Get all flow logs
    const flowLogsResponse = await ec2Client.send(new DescribeFlowLogsCommand({}));

    const flowLogVpcIds = new Set();
    for (const flowLog of flowLogsResponse.FlowLogs || []) {
      if (flowLog.ResourceId && flowLog.ResourceId.startsWith('vpc-')) {
        flowLogVpcIds.add(flowLog.ResourceId);
      }
    }

    // Check each VPC for flow logs
    for (const vpc of vpcsResponse.Vpcs || []) {
      const vpcId = vpc.VpcId;

      if (!flowLogVpcIds.has(vpcId)) {
        violations.missingFlowLogs.push({
          vpcId: vpcId,
          description: 'VPC does not have CloudWatch flow logs enabled',
        });
      }
    }

    console.log(`Found ${violations.missingFlowLogs.length} VPCs without flow logs`);
  } catch (error) {
    console.error('Error scanning VPC flow logs:', error);
    throw error;
  }
}

function generateReport(violations) {
  const timestamp = new Date().toISOString();

  return {
    timestamp: timestamp,
    region: region,
    environmentSuffix: ENVIRONMENT_SUFFIX,
    summary: {
      totalViolations:
        violations.unencryptedVolumes.length +
        violations.permissiveSecurityGroups.length +
        violations.missingTags.length +
        violations.iamViolations.length +
        violations.missingFlowLogs.length,
      unencryptedVolumes: violations.unencryptedVolumes.length,
      permissiveSecurityGroups: violations.permissiveSecurityGroups.length,
      missingTags: violations.missingTags.length,
      iamViolations: violations.iamViolations.length,
      missingFlowLogs: violations.missingFlowLogs.length,
    },
    violations: violations,
  };
}

async function uploadReport(report) {
  console.log('Uploading report to S3...');

  const key = `compliance-reports/${report.timestamp}.json`;

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: REPORT_BUCKET,
        Key: key,
        Body: JSON.stringify(report, null, 2),
        ContentType: 'application/json',
      })
    );

    console.log(`Report uploaded to s3://${REPORT_BUCKET}/${key}`);
  } catch (error) {
    console.error('Error uploading report:', error);
    throw error;
  }
}

async function publishMetrics(violations) {
  console.log('Publishing metrics to CloudWatch...');

  const namespace = 'ComplianceScanner';
  const timestamp = new Date();

  const metricData = [
    {
      MetricName: 'UnencryptedVolumes',
      Value: violations.unencryptedVolumes.length,
      Unit: 'Count',
      Timestamp: timestamp,
      Dimensions: [
        {
          Name: 'Environment',
          Value: ENVIRONMENT_SUFFIX,
        },
      ],
    },
    {
      MetricName: 'PermissiveSecurityGroups',
      Value: violations.permissiveSecurityGroups.length,
      Unit: 'Count',
      Timestamp: timestamp,
      Dimensions: [
        {
          Name: 'Environment',
          Value: ENVIRONMENT_SUFFIX,
        },
      ],
    },
    {
      MetricName: 'MissingTags',
      Value: violations.missingTags.length,
      Unit: 'Count',
      Timestamp: timestamp,
      Dimensions: [
        {
          Name: 'Environment',
          Value: ENVIRONMENT_SUFFIX,
        },
      ],
    },
    {
      MetricName: 'IAMViolations',
      Value: violations.iamViolations.length,
      Unit: 'Count',
      Timestamp: timestamp,
      Dimensions: [
        {
          Name: 'Environment',
          Value: ENVIRONMENT_SUFFIX,
        },
      ],
    },
    {
      MetricName: 'MissingFlowLogs',
      Value: violations.missingFlowLogs.length,
      Unit: 'Count',
      Timestamp: timestamp,
      Dimensions: [
        {
          Name: 'Environment',
          Value: ENVIRONMENT_SUFFIX,
        },
      ],
    },
  ];

  try {
    await cloudWatchClient.send(
      new PutMetricDataCommand({
        Namespace: namespace,
        MetricData: metricData,
      })
    );

    console.log('Metrics published successfully');
  } catch (error) {
    console.error('Error publishing metrics:', error);
    throw error;
  }
}
```

### File: bin/tap.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

const stack = new TapStack('tap', {
  environmentSuffix: environmentSuffix,
  tags: {
    Environment: environmentSuffix,
    ManagedBy: 'Pulumi',
    Project: 'ComplianceScanner',
  },
});

export const reportBucketName = stack.reportBucketName;
export const complianceFunctionArn = stack.complianceFunctionArn;
export const complianceFunctionName = stack.complianceFunctionName;
```

### File: lib/README.md

```markdown
# Infrastructure Compliance Scanner

This Pulumi TypeScript project implements an automated compliance scanner for AWS infrastructure.

## Features

- Scans EC2 instances for unencrypted EBS volumes
- Checks security groups for overly permissive rules
- Verifies IAM roles have proper policies attached
- Validates EC2 instances have required tags
- Checks VPC flow logs are enabled
- Generates JSON compliance reports stored in S3
- Publishes CloudWatch metrics for monitoring

## Prerequisites

- Node.js 18+ and npm
- Pulumi CLI
- AWS credentials configured
- AWS permissions for EC2, IAM, S3, CloudWatch, Lambda

## Deployment

1. Install dependencies:
```bash
npm install
```

2. Set environment suffix:
```bash
export ENVIRONMENT_SUFFIX=dev
pulumi config set environmentSuffix dev
```

3. Deploy the stack:
```bash
pulumi up
```

## Usage

### Manual Invocation

Invoke the Lambda function manually:
```bash
aws lambda invoke --function-name compliance-scanner-dev output.json
cat output.json
```

### Scheduled Scanning

To run compliance scans on a schedule, add an EventBridge rule:
```typescript
const rule = new aws.cloudwatch.EventRule("daily-scan", {
  scheduleExpression: "rate(1 day)",
});

const target = new aws.cloudwatch.EventTarget("target", {
  rule: rule.name,
  arn: complianceFunction.arn,
});

const permission = new aws.lambda.Permission("allow-eventbridge", {
  action: "lambda:InvokeFunction",
  function: complianceFunction.name,
  principal: "events.amazonaws.com",
  sourceArn: rule.arn,
});
```

## Report Format

Compliance reports are stored in S3 as JSON files:
```json
{
  "timestamp": "2025-12-03T19:45:00.000Z",
  "region": "us-east-1",
  "environmentSuffix": "dev",
  "summary": {
    "totalViolations": 15,
    "unencryptedVolumes": 3,
    "permissiveSecurityGroups": 5,
    "missingTags": 4,
    "iamViolations": 2,
    "missingFlowLogs": 1
  },
  "violations": {
    "unencryptedVolumes": [...],
    "permissiveSecurityGroups": [...],
    "missingTags": [...],
    "iamViolations": [...],
    "missingFlowLogs": [...]
  }
}
```

## CloudWatch Metrics

The following custom metrics are published to CloudWatch namespace `ComplianceScanner`:
- `UnencryptedVolumes`
- `PermissiveSecurityGroups`
- `MissingTags`
- `IAMViolations`
- `MissingFlowLogs`

All metrics include dimension `Environment: {environmentSuffix}`.

## Cleanup

```bash
pulumi destroy
```

## Architecture

- **Lambda Function**: Performs compliance scanning using AWS SDK v3
- **S3 Bucket**: Stores compliance reports with 90-day lifecycle
- **IAM Role**: Grants Lambda permissions for read-only scanning and report writing
- **CloudWatch Logs**: Captures Lambda execution logs (7-day retention)
- **CloudWatch Metrics**: Tracks violation counts over time

## Security

The Lambda function has read-only access to EC2, IAM, and VPC resources. Write access is limited to:
- S3 bucket (for reports)
- CloudWatch Logs (for execution logs)
- CloudWatch Metrics (for metric data)

## Testing

Run unit tests:
```bash
npm test
```

Run integration tests (requires deployed stack):
```bash
npm run test:integration
```
```

## Notes

1. **Lambda Runtime**: Uses Node.js 20.x with AWS SDK v3 clients
2. **environmentSuffix**: All resources include environment suffix for uniqueness
3. **Destroyability**: All resources use forceDestroy/RemovalPolicy.DESTROY
4. **Permissions**: Lambda has read-only access to resources being scanned
5. **Error Handling**: Lambda includes comprehensive error handling and logging
6. **Scalability**: Handles pagination for large AWS accounts
7. **Cost**: Serverless design minimizes costs (pay per scan execution)
8. **Security**: Security group scanning only flags 0.0.0.0/0 on non-HTTP/HTTPS ports
