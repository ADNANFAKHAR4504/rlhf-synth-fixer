/**
 * Main Pulumi stack for Infrastructure QA and Management System
 *
 * Creates AWS resources for compliance monitoring, tagging, and reporting.
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

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
 * Represents the main Pulumi component resource for the Infrastructure QA system.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly reportsBucket: pulumi.Output<string>;
  public readonly reportsBucketArn: pulumi.Output<string>;
  public readonly complianceRoleArn: pulumi.Output<string>;
  public readonly complianceRoleName: pulumi.Output<string>;
  public readonly alertTopicArn: pulumi.Output<string>;
  public readonly alertTopicName: pulumi.Output<string>;
  public readonly dashboardName: pulumi.Output<string>;
  public readonly logGroupName: string;
  public readonly environmentSuffix: string;

  /**
   * Creates a new TapStack component.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    this.environmentSuffix = environmentSuffix;
    this.logGroupName = `/aws/compliance/${environmentSuffix}`;
    const tags = args.tags || {};

    // 1. S3 Bucket for storing compliance reports and inventory data
    const reportsBucket = new aws.s3.Bucket(
      `compliance-reports-${environmentSuffix}`,
      {
        bucket: `compliance-reports-${environmentSuffix}-${Date.now()}`,
        acl: 'private',
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        versioning: {
          enabled: true,
        },
        lifecycleRules: [
          {
            id: 'archive-old-reports',
            enabled: true,
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
          Name: `compliance-reports-${environmentSuffix}`,
          Purpose: 'Compliance reports and resource inventory storage',
        },
      },
      { parent: this }
    );

    // Block public access on reports bucket
    new aws.s3.BucketPublicAccessBlock(
      `compliance-reports-public-access-block-${environmentSuffix}`,
      {
        bucket: reportsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // 2. IAM Role for compliance scanning with necessary permissions
    const complianceRole = new aws.iam.Role(
      `compliance-scanner-role-${environmentSuffix}`,
      {
        name: `compliance-scanner-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: ['lambda.amazonaws.com', 'ec2.amazonaws.com'],
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          ...tags,
          Name: `compliance-scanner-role-${environmentSuffix}`,
          Purpose: 'Service role for compliance scanning operations',
        },
      },
      { parent: this }
    );

    // Attach read-only policy for resource scanning
    new aws.iam.RolePolicyAttachment(
      `compliance-readonly-policy-${environmentSuffix}`,
      {
        role: complianceRole.name,
        policyArn: 'arn:aws:iam::aws:policy/ReadOnlyAccess',
      },
      { parent: this }
    );

    // Custom policy for tagging and S3 write access
    const compliancePolicy = new aws.iam.Policy(
      `compliance-scanner-policy-${environmentSuffix}`,
      {
        name: `compliance-scanner-policy-${environmentSuffix}`,
        description:
          'Policy for compliance scanner to tag resources and write reports',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'tag:GetResources',
                'tag:TagResources',
                'tag:UntagResources',
                'tag:GetTagKeys',
                'tag:GetTagValues',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: [
                's3:PutObject',
                's3:PutObjectAcl',
                's3:GetObject',
                's3:ListBucket',
              ],
              Resource: [
                reportsBucket.arn,
                pulumi.interpolate`${reportsBucket.arn}/*`,
              ],
            },
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: 'arn:aws:logs:*:*:*',
            },
          ],
        }),
        tags: {
          ...tags,
          Name: `compliance-scanner-policy-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `compliance-custom-policy-attachment-${environmentSuffix}`,
      {
        role: complianceRole.name,
        policyArn: compliancePolicy.arn,
      },
      { parent: this }
    );

    // 3. SNS Topic for compliance alerts
    const alertTopic = new aws.sns.Topic(
      `compliance-alerts-${environmentSuffix}`,
      {
        name: `compliance-alerts-${environmentSuffix}`,
        displayName: 'Compliance Violation Alerts',
        tags: {
          ...tags,
          Name: `compliance-alerts-${environmentSuffix}`,
          Purpose: 'Alert on critical compliance violations',
        },
      },
      { parent: this }
    );

    // 4. CloudWatch Log Group for compliance operations
    new aws.cloudwatch.LogGroup(
      `compliance-operations-logs-${environmentSuffix}`,
      {
        name: `/aws/compliance/${environmentSuffix}`,
        retentionInDays: 30,
        tags: {
          ...tags,
          Name: `compliance-operations-logs-${environmentSuffix}`,
          Purpose: 'Logs for compliance scanning operations',
        },
      },
      { parent: this }
    );

    // 5. CloudWatch Dashboard for compliance metrics (optional)
    const dashboard = new aws.cloudwatch.Dashboard(
      `compliance-dashboard-${environmentSuffix}`,
      {
        dashboardName: `compliance-${environmentSuffix}`,
        dashboardBody: JSON.stringify({
          widgets: [
            {
              type: 'metric',
              properties: {
                metrics: [['AWS/S3', 'NumberOfObjects', { stat: 'Average' }]],
                period: 300,
                stat: 'Average',
                region: 'us-east-1',
                title: 'Compliance Reports Generated',
              },
            },
            {
              type: 'log',
              properties: {
                query: `SOURCE '/aws/compliance/${environmentSuffix}' | fields @timestamp, @message | sort @timestamp desc | limit 20`,
                region: 'us-east-1',
                title: 'Recent Compliance Operations',
              },
            },
          ],
        }),
      },
      { parent: this }
    );

    // Export outputs
    this.reportsBucket = reportsBucket.bucket;
    this.reportsBucketArn = reportsBucket.arn;
    this.complianceRoleArn = complianceRole.arn;
    this.complianceRoleName = complianceRole.name;
    this.alertTopicArn = alertTopic.arn;
    this.alertTopicName = alertTopic.name;
    this.dashboardName = dashboard.dashboardName;

    // Register outputs
    this.registerOutputs({
      reportsBucket: this.reportsBucket,
      reportsBucketArn: this.reportsBucketArn,
      complianceRoleArn: this.complianceRoleArn,
      complianceRoleName: this.complianceRoleName,
      alertTopicArn: this.alertTopicArn,
      alertTopicName: this.alertTopicName,
      dashboardName: this.dashboardName,
      logGroupName: this.logGroupName,
      environmentSuffix: this.environmentSuffix,
    });
  }
}
