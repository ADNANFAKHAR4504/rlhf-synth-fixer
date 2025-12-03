/**
 * AWS Inspector v2 Security Assessment Infrastructure
 *
 * This Pulumi stack creates a comprehensive security assessment infrastructure using AWS Inspector v2.
 * It includes automated scanning, notification, reporting, and monitoring capabilities.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackArgs {
  /**
   * Tags to apply to all resources
   */
  tags?: Record<string, string>;

  /**
   * Email address for security notifications
   * @default security@company.com
   */
  securityEmail?: string;

  /**
   * CloudWatch Logs retention period in days
   * @default 7
   */
  logRetentionDays?: number;
}

/**
 * TapStack creates AWS Inspector v2 infrastructure with automated security assessments
 */
export class TapStack extends pulumi.ComponentResource {
  /**
   * S3 bucket for compliance reporting
   */
  public readonly complianceBucket: aws.s3.BucketV2;

  /**
   * SNS topic for security findings
   */
  public readonly findingsTopic: aws.sns.Topic;

  /**
   * Lambda function for processing findings
   */
  public readonly findingsProcessor: aws.lambda.Function;

  /**
   * CloudWatch dashboard for security metrics
   */
  public readonly securityDashboard: aws.cloudwatch.Dashboard;

  /**
   * EventBridge rule for Inspector findings
   */
  public readonly findingsRule: aws.cloudwatch.EventRule;

  /**
   * EC2 instance profile for Inspector scanning
   */
  public readonly ec2InstanceProfile: aws.iam.InstanceProfile;

  constructor(
    name: string,
    args: TapStackArgs = {},
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:aws:TapStack', name, args, opts);

    const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
    const securityEmail = args.securityEmail || 'security@company.com';
    const logRetentionDays = args.logRetentionDays || 7;

    // Get current AWS account and region
    const current = aws.getCallerIdentity({});
    const region = aws.getRegionOutput({});

    // ============================================================================
    // 1. Enable AWS Inspector v2
    // ============================================================================

    // NOTE: Inspector2 Enabler can take 5-10 minutes to fully enable.
    // If already enabled, this resource may show as 'IN_PROGRESS' but will eventually complete.
    const inspector = new aws.inspector2.Enabler(
      `inspector-enabler-${environmentSuffix}`,
      {
        accountIds: [current.then(c => c.accountId)],
        resourceTypes: ['EC2'],
      },
      {
        parent: this,
        // Inspector enablement can take longer than default timeout
        customTimeouts: {
          create: '15m',
          update: '15m',
          delete: '15m',
        },
        // Ignore changes to prevent re-enabling if already enabled
        ignoreChanges: ['resourceTypes'],
      }
    );

    // ============================================================================
    // 2. Create SNS Topic for security findings
    // ============================================================================

    this.findingsTopic = new aws.sns.Topic(
      `inspector-findings-topic-${environmentSuffix}`,
      {
        displayName: 'AWS Inspector Security Findings',
        tags: args.tags,
      },
      { parent: this }
    );

    // ============================================================================
    // 4. Configure email notifications for critical findings
    // ============================================================================

    const _emailSubscription = new aws.sns.TopicSubscription(
      `inspector-email-subscription-${environmentSuffix}`,
      {
        topic: this.findingsTopic.arn,
        protocol: 'email',
        endpoint: securityEmail,
      },
      { parent: this }
    );

    // ============================================================================
    // 11. Create S3 bucket for compliance reporting
    // ============================================================================

    this.complianceBucket = new aws.s3.BucketV2(
      `inspector-compliance-${environmentSuffix}`,
      {
        tags: args.tags,
        forceDestroy: true, // Enable destroyability
      },
      { parent: this }
    );

    // Enable versioning for compliance bucket
    const _bucketVersioning = new aws.s3.BucketVersioningV2(
      `inspector-compliance-versioning-${environmentSuffix}`,
      {
        bucket: this.complianceBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Enable encryption for compliance bucket
    const _bucketEncryption =
      new aws.s3.BucketServerSideEncryptionConfigurationV2(
        `inspector-compliance-encryption-${environmentSuffix}`,
        {
          bucket: this.complianceBucket.id,
          rules: [
            {
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'AES256',
              },
              bucketKeyEnabled: true,
            },
          ],
        },
        { parent: this }
      );

    // Block public access to compliance bucket
    const _bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `inspector-compliance-public-access-${environmentSuffix}`,
      {
        bucket: this.complianceBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // ============================================================================
    // 9. Create IAM role for Lambda function (least privilege)
    // ============================================================================

    const lambdaRole = new aws.iam.Role(
      `inspector-lambda-role-${environmentSuffix}`,
      {
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
        tags: args.tags,
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    const lambdaBasicExecution = new aws.iam.RolePolicyAttachment(
      `inspector-lambda-basic-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Create inline policy for Lambda to access SNS and S3
    const lambdaPolicy = new aws.iam.RolePolicy(
      `inspector-lambda-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi
          .all([this.findingsTopic.arn, this.complianceBucket.arn])
          .apply(([topicArn, bucketArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['sns:Publish'],
                  Resource: topicArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:PutObject', 's3:PutObjectAcl'],
                  Resource: `${bucketArn}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['inspector2:ListFindings', 'inspector2:GetFindings'],
                  Resource: '*',
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // ============================================================================
    // 6. Create Lambda function to parse Inspector findings
    // ============================================================================

    // Create CloudWatch Log Group for Lambda
    const lambdaLogGroup = new aws.cloudwatch.LogGroup(
      `inspector-lambda-logs-${environmentSuffix}`,
      {
        retentionInDays: logRetentionDays,
        tags: args.tags,
      },
      { parent: this }
    );

    this.findingsProcessor = new aws.lambda.Function(
      `inspector-findings-processor-${environmentSuffix}`,
      {
        runtime: 'nodejs20.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        timeout: 60,
        memorySize: 256,
        environment: {
          variables: {
            SNS_TOPIC_ARN: this.findingsTopic.arn,
            COMPLIANCE_BUCKET: this.complianceBucket.id,
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const snsClient = new SNSClient({});
const s3Client = new S3Client({});

exports.handler = async (event) => {
  console.log('Received Inspector finding event:', JSON.stringify(event, null, 2));

  try {
    // Parse the EventBridge event
    const finding = event.detail;

    // Extract key information
    const severity = finding.severity || 'UNKNOWN';
    const title = finding.title || 'No title';
    const description = finding.description || 'No description';
    const resourceId = finding.resources?.[0]?.id || 'Unknown resource';
    const findingArn = finding.findingArn || 'Unknown ARN';
    const status = finding.status || 'ACTIVE';

    // Format alert message
    const alertMessage = \`
AWS Inspector Security Finding

Severity: \${severity}
Status: \${status}
Title: \${title}

Description: \${description}

Affected Resource: \${resourceId}
Finding ARN: \${findingArn}

Action Required: Please review this security finding and take appropriate action.

Timestamp: \${new Date().toISOString()}
\`;

    // Publish to SNS for immediate notification
    const snsParams = {
      TopicArn: process.env.SNS_TOPIC_ARN,
      Subject: \`[\${severity}] AWS Inspector Finding: \${title}\`,
      Message: alertMessage,
    };

    await snsClient.send(new PublishCommand(snsParams));
    console.log('Published alert to SNS');

    // Export finding summary to S3 for compliance reporting
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const s3Key = \`findings/\${timestamp}-\${severity}.json\`;

    const findingSummary = {
      timestamp: new Date().toISOString(),
      severity,
      status,
      title,
      description,
      resourceId,
      findingArn,
      rawFinding: finding,
    };

    const s3Params = {
      Bucket: process.env.COMPLIANCE_BUCKET,
      Key: s3Key,
      Body: JSON.stringify(findingSummary, null, 2),
      ContentType: 'application/json',
    };

    await s3Client.send(new PutObjectCommand(s3Params));
    console.log(\`Exported finding to S3: \${s3Key}\`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Finding processed successfully' }),
    };
  } catch (error) {
    console.error('Error processing finding:', error);
    throw error;
  }
};
`),
        }),
        tags: args.tags,
      },
      {
        parent: this,
        dependsOn: [lambdaBasicExecution, lambdaPolicy, lambdaLogGroup],
      }
    );

    // ============================================================================
    // 3. Set up EventBridge rules for HIGH and CRITICAL findings
    // ============================================================================

    // Create EventBridge rule for Inspector findings
    this.findingsRule = new aws.cloudwatch.EventRule(
      `inspector-findings-rule-${environmentSuffix}`,
      {
        description: 'Capture AWS Inspector HIGH and CRITICAL findings',
        eventPattern: JSON.stringify({
          source: ['aws.inspector2'],
          'detail-type': ['Inspector2 Finding'],
          detail: {
            severity: ['HIGH', 'CRITICAL'],
          },
        }),
        tags: args.tags,
      },
      { parent: this }
    );

    // Add Lambda as target for EventBridge rule
    const _findingsRuleTarget = new aws.cloudwatch.EventTarget(
      `inspector-findings-target-${environmentSuffix}`,
      {
        rule: this.findingsRule.name,
        arn: this.findingsProcessor.arn,
      },
      { parent: this }
    );

    // Grant EventBridge permission to invoke Lambda
    const _lambdaPermission = new aws.lambda.Permission(
      `inspector-lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: this.findingsProcessor.name,
        principal: 'events.amazonaws.com',
        sourceArn: this.findingsRule.arn,
      },
      { parent: this }
    );

    // ============================================================================
    // 7. Set up CloudWatch Dashboard for security metrics
    // ============================================================================

    this.securityDashboard = new aws.cloudwatch.Dashboard(
      `inspector-dashboard-${environmentSuffix}`,
      {
        dashboardName: `inspector-security-metrics-${environmentSuffix}`,
        dashboardBody: pulumi
          .all([region, this.findingsProcessor.name, lambdaLogGroup.name])
          .apply(([regionOutput, _lambdaName, _logGroupName]) =>
            JSON.stringify({
              widgets: [
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/Lambda',
                        'Invocations',
                        { stat: 'Sum', label: 'Finding Alerts Processed' },
                      ],
                    ],
                    view: 'timeSeries',
                    stacked: false,
                    region: regionOutput.name,
                    title: 'Inspector Findings Processed',
                    period: 300,
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/Lambda',
                        'Errors',
                        { stat: 'Sum', label: 'Processing Errors' },
                      ],
                      [
                        '.',
                        'Duration',
                        { stat: 'Average', label: 'Avg Processing Time' },
                      ],
                    ],
                    view: 'timeSeries',
                    stacked: false,
                    region: regionOutput.name,
                    title: 'Lambda Processing Metrics',
                    period: 300,
                  },
                },
                {
                  type: 'log',
                  properties: {
                    query: `SOURCE '\${logGroupName}'
| fields @timestamp, @message
| filter @message like /Severity/
| parse @message /Severity: (?<severity>\\w+)/
| stats count() by severity
| sort severity`,
                    region: regionOutput.name,
                    title: 'Finding Counts by Severity',
                    stacked: false,
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/SNS',
                        'NumberOfMessagesPublished',
                        { stat: 'Sum', label: 'Notifications Sent' },
                      ],
                    ],
                    view: 'singleValue',
                    region: regionOutput.name,
                    title: 'Total Security Notifications',
                    period: 86400,
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // ============================================================================
    // 5. Create IAM role for EC2 instances with Inspector tags
    // ============================================================================

    const ec2Role = new aws.iam.Role(
      `inspector-ec2-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: args.tags,
      },
      { parent: this }
    );

    // Attach SSM managed instance policy for Inspector agent
    const _ec2SsmPolicy = new aws.iam.RolePolicyAttachment(
      `inspector-ec2-ssm-${environmentSuffix}`,
      {
        role: ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      },
      { parent: this }
    );

    // Create instance profile for EC2
    this.ec2InstanceProfile = new aws.iam.InstanceProfile(
      `inspector-ec2-profile-${environmentSuffix}`,
      {
        role: ec2Role.name,
        tags: args.tags,
      },
      { parent: this }
    );

    // ============================================================================
    // 10. Enable finding aggregation (if Organizations is available)
    // ============================================================================

    // NOTE: OrganizationConfiguration requires AWS Organizations admin permissions.
    // This resource is commented out as it's optional and causes deployment failures
    // in environments without Organizations admin access (403 AccessDeniedException).
    // Enable this if deploying as Organizations admin:
    /*
    const _findingAggregator = new aws.inspector2.OrganizationConfiguration(
      `inspector-org-config-${environmentSuffix}`,
      {
        autoEnable: {
          ec2: true,
          ecr: false,
          lambda: false,
        },
      },
      {
        parent: this,
        ignoreChanges: ['autoEnable'],
      }
    );
    */
    // Placeholder for linting - Organizations config is optional
    const _findingAggregator = null;

    // ============================================================================
    // Mark intentionally unused resources
    // ============================================================================
    void _emailSubscription;
    void _bucketVersioning;
    void _bucketEncryption;
    void _bucketPublicAccessBlock;
    void _findingsRuleTarget;
    void _lambdaPermission;
    void _ec2SsmPolicy;
    void _findingAggregator;

    // ============================================================================
    // Export important values
    // ============================================================================

    this.registerOutputs({
      complianceBucketName: this.complianceBucket.id,
      complianceBucketArn: this.complianceBucket.arn,
      findingsTopicArn: this.findingsTopic.arn,
      findingsProcessorArn: this.findingsProcessor.arn,
      securityDashboardName: this.securityDashboard.dashboardName,
      ec2InstanceProfileArn: this.ec2InstanceProfile.arn,
      inspectorEnabled: inspector.id,
    });
  }
}
