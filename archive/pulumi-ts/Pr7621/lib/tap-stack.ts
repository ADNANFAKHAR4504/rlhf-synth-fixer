/**
 * tap-stack.ts
 *
 * Infrastructure Compliance Analyzer for EC2 Instances
 *
 * This stack implements an automated compliance monitoring system that scans all EC2 instances
 * every 6 hours and validates them against defined policies:
 * - EBS volume encryption validation
 * - AMI whitelisting enforcement
 * - Required tag enforcement (Owner, Environment, CostCenter)
 *
 * The system provides structured logging to CloudWatch, SNS alerts for violations,
 * S3 exports for long-term retention, and a CloudWatch dashboard for visualization.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for the Infrastructure Compliance Analyzer.
 *
 * This component creates all necessary resources for automated EC2 compliance scanning:
 * - Lambda function for compliance validation
 * - EventBridge rule for scheduling (every 6 hours)
 * - IAM roles with least-privilege permissions
 * - CloudWatch Logs for structured logging (7-day retention)
 * - SNS topic for violation alerts
 * - S3 bucket for compliance data exports
 * - CloudWatch Dashboard for metrics visualization
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly lambdaFunctionArn: pulumi.Output<string>;
  public readonly snsTopic: pulumi.Output<string>;
  public readonly complianceBucket: pulumi.Output<string>;
  public readonly dashboardName: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // ============================================================================
    // 1. S3 Bucket for Compliance Data Exports
    // ============================================================================

    const complianceBucket = new aws.s3.Bucket(
      `compliance-data-${environmentSuffix}`,
      {
        bucket: `compliance-data-${environmentSuffix}-342597974367`,
        forceDestroy: true, // Allows bucket destruction even with objects
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        lifecycleRules: [
          {
            enabled: true,
            id: 'archive-old-compliance-data',
            transitions: [
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
            expiration: {
              days: 365,
            },
          },
        ],
        tags: {
          ...tags,
          Name: `compliance-data-${environmentSuffix}-342597974367`,
        },
      },
      { parent: this }
    );

    // ============================================================================
    // 2. SNS Topic for Compliance Violation Alerts
    // ============================================================================

    const snsTopic = new aws.sns.Topic(
      `compliance-alerts-${environmentSuffix}`,
      {
        name: `compliance-alerts-${environmentSuffix}`,
        displayName: `EC2 Compliance Alerts (${environmentSuffix})`,
        tags: {
          ...tags,
          Name: `compliance-alerts-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // ============================================================================
    // 3. CloudWatch Log Group for Lambda Logs
    // ============================================================================

    const logGroup = new aws.cloudwatch.LogGroup(
      `compliance-scanner-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/compliance-scanner-${environmentSuffix}`,
        retentionInDays: 7, // 7-day retention for cost optimization
        tags: {
          ...tags,
          Name: `compliance-scanner-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // ============================================================================
    // 4. IAM Role for Lambda Function (Least Privilege)
    // ============================================================================

    const lambdaRole = new aws.iam.Role(
      `compliance-scanner-role-${environmentSuffix}`,
      {
        name: `compliance-scanner-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
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

    // IAM Policy for EC2 Read Permissions
    const ec2Policy = new aws.iam.RolePolicy(
      `compliance-scanner-ec2-policy-${environmentSuffix}`,
      {
        name: 'EC2ReadPermissions',
        role: lambdaRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'ec2:DescribeInstances',
                'ec2:DescribeVolumes',
                'ec2:DescribeImages',
              ],
              Resource: '*', // EC2 describe actions don't support resource-level permissions
            },
          ],
        }),
      },
      { parent: lambdaRole }
    );

    // IAM Policy for CloudWatch Logs
    const logsPolicy = new aws.iam.RolePolicy(
      `compliance-scanner-logs-policy-${environmentSuffix}`,
      {
        name: 'CloudWatchLogsPermissions',
        role: lambdaRole.id,
        policy: logGroup.arn.apply(arn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                Resource: `${arn}:*`,
              },
            ],
          })
        ),
      },
      { parent: lambdaRole }
    );

    // IAM Policy for SNS Publish
    const snsPolicy = new aws.iam.RolePolicy(
      `compliance-scanner-sns-policy-${environmentSuffix}`,
      {
        name: 'SNSPublishPermissions',
        role: lambdaRole.id,
        policy: snsTopic.arn.apply(arn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: 'sns:Publish',
                Resource: arn,
              },
            ],
          })
        ),
      },
      { parent: lambdaRole }
    );

    // IAM Policy for S3 PutObject
    const s3Policy = new aws.iam.RolePolicy(
      `compliance-scanner-s3-policy-${environmentSuffix}`,
      {
        name: 'S3ExportPermissions',
        role: lambdaRole.id,
        policy: complianceBucket.arn.apply(arn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: 's3:PutObject',
                Resource: `${arn}/*`,
              },
            ],
          })
        ),
      },
      { parent: lambdaRole }
    );

    // ============================================================================
    // 5. Lambda Function for Compliance Scanning
    // ============================================================================

    const lambdaFunction = new aws.lambda.Function(
      `compliance-scanner-${environmentSuffix}`,
      {
        name: `compliance-scanner-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS18dX,
        handler: 'index.handler',
        role: lambdaRole.arn,
        timeout: 300, // 5 minutes
        memorySize: 512, // 512 MB
        environment: {
          variables: {
            SNS_TOPIC_ARN: snsTopic.arn,
            S3_BUCKET_NAME: complianceBucket.bucket,
            ENVIRONMENT_SUFFIX: environmentSuffix,
            // Approved AMI whitelist (comma-separated)
            APPROVED_AMIS: 'ami-0c55b159cbfafe1f0,ami-0abcdef1234567890',
            // Required tags (comma-separated)
            REQUIRED_TAGS: 'Owner,Environment,CostCenter',
          },
        },
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(getLambdaCode()),
        }),
        tags: {
          ...tags,
          Name: `compliance-scanner-${environmentSuffix}`,
        },
      },
      {
        parent: this,
        dependsOn: [ec2Policy, logsPolicy, snsPolicy, s3Policy],
      }
    );

    // ============================================================================
    // 6. EventBridge Rule for Scheduled Execution (Every 6 Hours)
    // ============================================================================

    const eventRule = new aws.cloudwatch.EventRule(
      `compliance-scanner-schedule-${environmentSuffix}`,
      {
        name: `compliance-scanner-schedule-${environmentSuffix}`,
        description: 'Trigger compliance scanner every 6 hours',
        scheduleExpression: 'rate(6 hours)',
        tags: {
          ...tags,
          Name: `compliance-scanner-schedule-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.cloudwatch.EventTarget(
      `compliance-scanner-target-${environmentSuffix}`,
      {
        rule: eventRule.name,
        arn: lambdaFunction.arn,
        targetId: 'ComplianceScannerLambda',
      },
      { parent: eventRule }
    );

    // Grant EventBridge permission to invoke Lambda
    new aws.lambda.Permission(
      `compliance-scanner-eventbridge-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: lambdaFunction.name,
        principal: 'events.amazonaws.com',
        sourceArn: eventRule.arn,
      },
      { parent: lambdaFunction }
    );

    // ============================================================================
    // 7. CloudWatch Dashboard for Compliance Metrics
    // ============================================================================

    const dashboard = new aws.cloudwatch.Dashboard(
      `compliance-dashboard-${environmentSuffix}`,
      {
        dashboardName: `EC2-Compliance-Dashboard-${environmentSuffix}`,
        dashboardBody: lambdaFunction.name.apply(funcName =>
          JSON.stringify({
            widgets: [
              {
                type: 'metric',
                x: 0,
                y: 0,
                width: 12,
                height: 6,
                properties: {
                  metrics: [
                    [
                      'AWS/Lambda',
                      'Invocations',
                      { stat: 'Sum', label: 'Scanner Invocations' },
                    ],
                    ['.', 'Errors', { stat: 'Sum', label: 'Scanner Errors' }],
                    [
                      '.',
                      'Duration',
                      { stat: 'Average', label: 'Avg Duration (ms)' },
                    ],
                  ],
                  view: 'timeSeries',
                  stacked: false,
                  region: 'us-east-1',
                  title: 'Compliance Scanner Metrics',
                  period: 300,
                  yAxis: {
                    left: {
                      label: 'Count',
                    },
                  },
                },
              },
              {
                type: 'log',
                x: 0,
                y: 6,
                width: 24,
                height: 6,
                properties: {
                  query: `SOURCE '/aws/lambda/${funcName}'\n| fields @timestamp, @message\n| filter @message like /COMPLIANCE_VIOLATION/\n| sort @timestamp desc\n| limit 20`,
                  region: 'us-east-1',
                  title: 'Recent Compliance Violations',
                },
              },
              {
                type: 'log',
                x: 0,
                y: 12,
                width: 12,
                height: 6,
                properties: {
                  query: `SOURCE '/aws/lambda/${funcName}'\n| fields @message\n| filter @message like /COMPLIANCE_SUMMARY/\n| stats count() by violationType\n| sort count() desc`,
                  region: 'us-east-1',
                  title: 'Violations by Type',
                },
              },
              {
                type: 'log',
                x: 12,
                y: 12,
                width: 12,
                height: 6,
                properties: {
                  query: `SOURCE '/aws/lambda/${funcName}'\n| fields @message\n| filter @message like /COMPLIANCE_SUMMARY/\n| parse @message /compliant=(?<compliant>\\d+)/\n| parse @message /nonCompliant=(?<nonCompliant>\\d+)/\n| stats latest(compliant) as Compliant, latest(nonCompliant) as NonCompliant`,
                  region: 'us-east-1',
                  title: 'Compliance Status',
                },
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // ============================================================================
    // Register Outputs
    // ============================================================================

    this.lambdaFunctionArn = lambdaFunction.arn;
    this.snsTopic = snsTopic.arn;
    this.complianceBucket = complianceBucket.bucket;
    this.dashboardName = dashboard.dashboardName;

    this.registerOutputs({
      lambdaFunctionArn: this.lambdaFunctionArn,
      snsTopic: this.snsTopic,
      complianceBucket: this.complianceBucket,
      dashboardName: this.dashboardName,
    });
  }
}

/**
 * Returns the Lambda function code as a string.
 * This function implements the compliance scanning logic using AWS SDK v3.
 */
function getLambdaCode(): string {
  return `
// Lambda function for EC2 instance compliance scanning
// Uses AWS SDK v3 for Node.js 18.x runtime

const {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVolumesCommand
} = require('@aws-sdk/client-ec2');

const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Initialize AWS SDK v3 clients
const ec2Client = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' });
const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

// Configuration from environment variables
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const APPROVED_AMIS = (process.env.APPROVED_AMIS || '').split(',').filter(Boolean);
const REQUIRED_TAGS = (process.env.REQUIRED_TAGS || 'Owner,Environment,CostCenter').split(',');

/**
 * Lambda handler function
 */
exports.handler = async (event) => {
  console.log(JSON.stringify({ message: 'Starting compliance scan', timestamp: new Date().toISOString() }));

  try {
    // Fetch all EC2 instances
    const instances = await getAllInstances();
    console.log(JSON.stringify({ message: 'Fetched instances', count: instances.length }));

    // Validate compliance for each instance
    const results = await Promise.all(
      instances.map(instance => validateInstanceCompliance(instance))
    );

    // Aggregate results
    const complianceSummary = {
      timestamp: new Date().toISOString(),
      totalInstances: instances.length,
      compliantInstances: results.filter(r => r.compliant).length,
      nonCompliantInstances: results.filter(r => !r.compliant).length,
      violations: results.filter(r => !r.compliant),
    };

    // Log summary
    console.log(JSON.stringify({
      message: 'COMPLIANCE_SUMMARY',
      compliant: complianceSummary.compliantInstances,
      nonCompliant: complianceSummary.nonCompliantInstances,
      totalInstances: complianceSummary.totalInstances
    }));

    // Export to S3
    await exportToS3(complianceSummary);

    // Send SNS alerts for violations
    if (complianceSummary.nonCompliantInstances > 0) {
      await sendViolationAlert(complianceSummary);
    }

    return {
      statusCode: 200,
      body: JSON.stringify(complianceSummary),
    };
  } catch (error) {
    console.error(JSON.stringify({ message: 'Error in compliance scan', error: error.message, stack: error.stack }));
    throw error;
  }
};

/**
 * Fetch all EC2 instances across all pages
 */
async function getAllInstances() {
  const instances = [];
  let nextToken = undefined;

  do {
    const command = new DescribeInstancesCommand({
      MaxResults: 1000,
      NextToken: nextToken,
    });

    const response = await ec2Client.send(command);

    for (const reservation of response.Reservations || []) {
      for (const instance of reservation.Instances || []) {
        // Only check running instances
        if (instance.State.Name === 'running') {
          instances.push(instance);
        }
      }
    }

    nextToken = response.NextToken;
  } while (nextToken);

  return instances;
}

/**
 * Validate compliance for a single instance
 */
async function validateInstanceCompliance(instance) {
  const violations = [];
  const instanceId = instance.InstanceId;

  // 1. Check EBS Volume Encryption
  const volumeIds = instance.BlockDeviceMappings
    ?.map(mapping => mapping.Ebs?.VolumeId)
    .filter(Boolean) || [];

  if (volumeIds.length > 0) {
    const volumesCommand = new DescribeVolumesCommand({
      VolumeIds: volumeIds,
    });

    const volumesResponse = await ec2Client.send(volumesCommand);

    for (const volume of volumesResponse.Volumes || []) {
      if (!volume.Encrypted) {
        violations.push({
          type: 'UNENCRYPTED_VOLUME',
          message: \`Volume \${volume.VolumeId} is not encrypted\`,
          volumeId: volume.VolumeId,
        });

        console.log(JSON.stringify({
          message: 'COMPLIANCE_VIOLATION',
          violationType: 'UNENCRYPTED_VOLUME',
          instanceId,
          volumeId: volume.VolumeId
        }));
      }
    }
  }

  // 2. Check AMI Whitelist
  if (APPROVED_AMIS.length > 0 && !APPROVED_AMIS.includes(instance.ImageId)) {
    violations.push({
      type: 'UNAPPROVED_AMI',
      message: \`Instance launched from unapproved AMI: \${instance.ImageId}\`,
      amiId: instance.ImageId,
    });

    console.log(JSON.stringify({
      message: 'COMPLIANCE_VIOLATION',
      violationType: 'UNAPPROVED_AMI',
      instanceId,
      amiId: instance.ImageId
    }));
  }

  // 3. Check Required Tags
  const instanceTags = instance.Tags || [];
  const tagKeys = instanceTags.map(tag => tag.Key);

  for (const requiredTag of REQUIRED_TAGS) {
    if (!tagKeys.includes(requiredTag)) {
      violations.push({
        type: 'MISSING_TAG',
        message: \`Instance missing required tag: \${requiredTag}\`,
        missingTag: requiredTag,
      });

      console.log(JSON.stringify({
        message: 'COMPLIANCE_VIOLATION',
        violationType: 'MISSING_TAG',
        instanceId,
        missingTag: requiredTag
      }));
    }
  }

  return {
    instanceId,
    compliant: violations.length === 0,
    violations,
    tags: instanceTags,
    amiId: instance.ImageId,
    instanceType: instance.InstanceType,
  };
}

/**
 * Export compliance summary to S3
 */
async function exportToS3(summary) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const key = \`compliance-reports/\${timestamp}.json\`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
    Body: JSON.stringify(summary, null, 2),
    ContentType: 'application/json',
  });

  await s3Client.send(command);
  console.log(JSON.stringify({ message: 'Exported compliance report to S3', key }));
}

/**
 * Send SNS alert for compliance violations
 */
async function sendViolationAlert(summary) {
  const message = \`EC2 Compliance Violations Detected

Summary:
- Total Instances: \${summary.totalInstances}
- Compliant: \${summary.compliantInstances}
- Non-Compliant: \${summary.nonCompliantInstances}

Violations by Type:
\${getViolationBreakdown(summary.violations)}

Timestamp: \${summary.timestamp}

Please review the CloudWatch Dashboard for detailed information.
\`;

  const command = new PublishCommand({
    TopicArn: SNS_TOPIC_ARN,
    Subject: \`[ALERT] EC2 Compliance Violations - \${summary.nonCompliantInstances} instances\`,
    Message: message,
  });

  await snsClient.send(command);
  console.log(JSON.stringify({ message: 'Sent SNS alert for violations' }));
}

/**
 * Get violation breakdown for alert message
 */
function getViolationBreakdown(violations) {
  const breakdown = {};

  for (const violation of violations) {
    for (const v of violation.violations) {
      breakdown[v.type] = (breakdown[v.type] || 0) + 1;
    }
  }

  return Object.entries(breakdown)
    .map(([type, count]) => \`  - \${type}: \${count}\`)
    .join('\\n');
}
`;
}
