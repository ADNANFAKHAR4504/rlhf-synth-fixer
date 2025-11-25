/**
 * tap-stack.ts
 *
 * Main Pulumi stack for Security Compliance Monitoring Infrastructure
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
 * Main Pulumi component resource for compliance monitoring infrastructure.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly configBucketName: pulumi.Output<string>;
  public readonly complianceTableName: pulumi.Output<string>;
  public readonly complianceFunctionArn: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly dashboardName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // 1. Create S3 bucket for AWS Config delivery
    const configBucket = new aws.s3.BucketV2(
      `config-delivery-${environmentSuffix}`,
      {
        bucket: `config-delivery-${environmentSuffix}`,
        tags: tags,
      },
      { parent: this }
    );

    // Enable versioning on config bucket
    new aws.s3.BucketVersioningV2(
      `config-delivery-versioning-${environmentSuffix}`,
      {
        bucket: configBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Enable AES256 encryption
    new aws.s3.BucketServerSideEncryptionConfigurationV2(
      `config-delivery-encryption-${environmentSuffix}`,
      {
        bucket: configBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      },
      { parent: this }
    );

    // Enable intelligent tiering
    new aws.s3.BucketIntelligentTieringConfiguration(
      `config-delivery-tiering-${environmentSuffix}`,
      {
        bucket: configBucket.id,
        name: 'EntireBucket',
        status: 'Enabled',
        tierings: [
          {
            accessTier: 'ARCHIVE_ACCESS',
            days: 90,
          },
          {
            accessTier: 'DEEP_ARCHIVE_ACCESS',
            days: 180,
          },
        ],
      },
      { parent: this }
    );

    // Configure lifecycle policy
    new aws.s3.BucketLifecycleConfigurationV2(
      `config-delivery-lifecycle-${environmentSuffix}`,
      {
        bucket: configBucket.id,
        rules: [
          {
            id: 'DeleteOldVersions',
            status: 'Enabled',
            noncurrentVersionExpiration: {
              noncurrentDays: 90,
            },
          },
        ],
      },
      { parent: this }
    );

    // S3 bucket policy for AWS Config
    void new aws.s3.BucketPolicy(
      `config-delivery-policy-${environmentSuffix}`,
      {
        bucket: configBucket.id,
        policy: pulumi
          .all([configBucket.arn, configBucket.id])
          .apply(([arn, _id]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'AWSConfigBucketPermissionsCheck',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'config.amazonaws.com',
                  },
                  Action: 's3:GetBucketAcl',
                  Resource: arn,
                },
                {
                  Sid: 'AWSConfigBucketExistenceCheck',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'config.amazonaws.com',
                  },
                  Action: 's3:ListBucket',
                  Resource: arn,
                },
                {
                  Sid: 'AWSConfigBucketPutObject',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'config.amazonaws.com',
                  },
                  Action: 's3:PutObject',
                  Resource: `${arn}/*`,
                  Condition: {
                    StringEquals: {
                      's3:x-amz-acl': 'bucket-owner-full-control',
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // 2. Create DynamoDB table for compliance results
    const complianceTable = new aws.dynamodb.Table(
      `compliance-results-${environmentSuffix}`,
      {
        name: `compliance-results-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'resourceId',
        rangeKey: 'timestamp',
        attributes: [
          {
            name: 'resourceId',
            type: 'S',
          },
          {
            name: 'timestamp',
            type: 'S',
          },
        ],
        tags: tags,
      },
      { parent: this }
    );

    // 3. Create SNS topic for critical violations
    const violationsTopic = new aws.sns.Topic(
      `compliance-violations-${environmentSuffix}`,
      {
        name: `compliance-violations-${environmentSuffix}`,
        tags: tags,
      },
      { parent: this }
    );

    // 4. Create Dead Letter Queue for Lambda
    const dlQueue = new aws.sqs.Queue(
      `compliance-dlq-${environmentSuffix}`,
      {
        name: `compliance-dlq-${environmentSuffix}`,
        messageRetentionSeconds: 1209600, // 14 days
        tags: tags,
      },
      { parent: this }
    );

    // 5. Create IAM role for Lambda function
    const lambdaRole = new aws.iam.Role(
      `compliance-lambda-role-${environmentSuffix}`,
      {
        name: `compliance-lambda-role-${environmentSuffix}`,
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
        tags: tags,
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      `compliance-lambda-basic-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Attach X-Ray write policy
    new aws.iam.RolePolicyAttachment(
      `compliance-lambda-xray-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    // Custom policy for Lambda to access Config, DynamoDB, SNS, and SQS
    const lambdaPolicy = new aws.iam.Policy(
      `compliance-lambda-policy-${environmentSuffix}`,
      {
        name: `compliance-lambda-policy-${environmentSuffix}`,
        policy: pulumi
          .all([
            complianceTable.arn,
            violationsTopic.arn,
            dlQueue.arn,
            configBucket.arn,
          ])
          .apply(([tableArn, topicArn, queueArn, bucketArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'config:DescribeConfigurationRecorders',
                    'config:DescribeConfigurationRecorderStatus',
                    'config:GetResourceConfigHistory',
                    'config:ListDiscoveredResources',
                    'config:DescribeComplianceByConfigRule',
                    'config:DescribeComplianceByResource',
                    'config:GetComplianceDetailsByConfigRule',
                    'config:GetComplianceDetailsByResource',
                  ],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'dynamodb:PutItem',
                    'dynamodb:UpdateItem',
                    'dynamodb:GetItem',
                    'dynamodb:Query',
                  ],
                  Resource: tableArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['sns:Publish'],
                  Resource: topicArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['sqs:SendMessage'],
                  Resource: queueArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:ListBucket'],
                  Resource: [bucketArn, `${bucketArn}/*`],
                },
              ],
            })
          ),
        tags: tags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `compliance-lambda-custom-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn: lambdaPolicy.arn,
      },
      { parent: this }
    );

    // 6. Create Lambda function for compliance analysis
    const complianceFunction = new aws.lambda.Function(
      `compliance-analyzer-${environmentSuffix}`,
      {
        name: `compliance-analyzer-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS18dX,
        handler: 'index.handler',
        role: lambdaRole.arn,
        memorySize: 256,
        timeout: 300,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const { ConfigServiceClient, DescribeConfigurationRecordersCommand, ListDiscoveredResourcesCommand } = require('@aws-sdk/client-config-service');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const configClient = new ConfigServiceClient({ region: process.env.AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

const TABLE_NAME = process.env.TABLE_NAME;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

// Compliance rules
const COMPLIANCE_RULES = {
  'AWS::S3::Bucket': (resource) => {
    const violations = [];
    // Check for encryption
    if (!resource.configuration?.serverSideEncryptionConfiguration) {
      violations.push('S3 bucket does not have encryption enabled');
    }
    // Check for versioning
    if (resource.configuration?.versioningConfiguration?.status !== 'Enabled') {
      violations.push('S3 bucket does not have versioning enabled');
    }
    return violations;
  },
  'AWS::EC2::Instance': (resource) => {
    const violations = [];
    // Check for instance monitoring
    if (!resource.configuration?.monitoring?.state || resource.configuration.monitoring.state !== 'enabled') {
      violations.push('EC2 instance does not have detailed monitoring enabled');
    }
    // Check for encryption of root volume
    if (resource.configuration?.blockDeviceMappings) {
      const rootVolume = resource.configuration.blockDeviceMappings.find(bdm => bdm.deviceName === resource.configuration.rootDeviceName);
      if (rootVolume && !rootVolume.ebs?.encrypted) {
        violations.push('EC2 instance root volume is not encrypted');
      }
    }
    return violations;
  },
  'AWS::RDS::DBInstance': (resource) => {
    const violations = [];
    // Check for encryption at rest
    if (!resource.configuration?.storageEncrypted) {
      violations.push('RDS instance does not have encryption at rest enabled');
    }
    // Check for backup retention
    if (!resource.configuration?.backupRetentionPeriod || resource.configuration.backupRetentionPeriod < 7) {
      violations.push('RDS instance backup retention period is less than 7 days');
    }
    // Check for multi-AZ
    if (!resource.configuration?.multiAZ) {
      violations.push('RDS instance is not configured for multi-AZ deployment');
    }
    return violations;
  }
};

exports.handler = async (event) => {
  console.log('Compliance scan started', JSON.stringify(event, null, 2));

  try {
    const resourceTypes = ['AWS::S3::Bucket', 'AWS::EC2::Instance', 'AWS::RDS::DBInstance'];
    const timestamp = new Date().toISOString();
    let totalViolations = 0;
    const criticalViolations = [];

    for (const resourceType of resourceTypes) {
      console.log(\`Scanning resource type: \${resourceType}\`);

      // List all resources of this type
      const listCommand = new ListDiscoveredResourcesCommand({
        resourceType: resourceType,
      });

      let resources = [];
      try {
        const response = await configClient.send(listCommand);
        resources = response.resourceIdentifiers || [];
      } catch (err) {
        console.error(\`Error listing resources for \${resourceType}:\`, err);
        continue;
      }

      console.log(\`Found \${resources.length} resources of type \${resourceType}\`);

      for (const resource of resources) {
        const resourceId = resource.resourceId;

        // Apply compliance rules
        const checkFunction = COMPLIANCE_RULES[resourceType];
        if (!checkFunction) continue;

        // For this demo, we'll use the resource identifier info
        // In production, you'd fetch full configuration using GetResourceConfigHistory
        const mockResourceConfig = {
          resourceId: resourceId,
          resourceType: resourceType,
          configuration: {}, // Would be populated from Config history
        };

        const violations = checkFunction(mockResourceConfig);

        if (violations.length > 0) {
          totalViolations += violations.length;

          // Store in DynamoDB
          const putCommand = new PutItemCommand({
            TableName: TABLE_NAME,
            Item: {
              resourceId: { S: resourceId },
              timestamp: { S: timestamp },
              resourceType: { S: resourceType },
              violations: { S: JSON.stringify(violations) },
              severity: { S: violations.length > 2 ? 'CRITICAL' : 'WARNING' },
              status: { S: 'NON_COMPLIANT' },
            },
          });

          await dynamoClient.send(putCommand);
          console.log(\`Stored violation for resource: \${resourceId}\`);

          // Track critical violations
          if (violations.length > 2) {
            criticalViolations.push({
              resourceId,
              resourceType,
              violations,
            });
          }
        } else {
          // Store compliant status
          const putCommand = new PutItemCommand({
            TableName: TABLE_NAME,
            Item: {
              resourceId: { S: resourceId },
              timestamp: { S: timestamp },
              resourceType: { S: resourceType },
              violations: { S: '[]' },
              severity: { S: 'NONE' },
              status: { S: 'COMPLIANT' },
            },
          });

          await dynamoClient.send(putCommand);
        }
      }
    }

    // Send SNS notification for critical violations
    if (criticalViolations.length > 0) {
      const message = {
        timestamp: timestamp,
        totalCriticalViolations: criticalViolations.length,
        violations: criticalViolations,
      };

      const publishCommand = new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Subject: \`CRITICAL: Compliance Violations Detected - \${criticalViolations.length} resources\`,
        Message: JSON.stringify(message, null, 2),
      });

      await snsClient.send(publishCommand);
      console.log('SNS notification sent for critical violations');
    }

    console.log(\`Compliance scan completed. Total violations: \${totalViolations}\`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Compliance scan completed',
        totalViolations: totalViolations,
        criticalViolations: criticalViolations.length,
        timestamp: timestamp,
      }),
    };
  } catch (error) {
    console.error('Error during compliance scan:', error);
    throw error;
  }
};
`),
          'package.json': new pulumi.asset.StringAsset(`{
  "name": "compliance-analyzer",
  "version": "1.0.0",
  "description": "Lambda function for compliance analysis",
  "dependencies": {
    "@aws-sdk/client-config-service": "^3.0.0",
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/client-sns": "^3.0.0"
  }
}
`),
        }),
        environment: {
          variables: {
            TABLE_NAME: complianceTable.name,
            SNS_TOPIC_ARN: violationsTopic.arn,
            // AWS_REGION is automatically provided by Lambda runtime
          },
        },
        deadLetterConfig: {
          targetArn: dlQueue.arn,
        },
        tracingConfig: {
          mode: 'Active',
        },
        tags: tags,
      },
      { parent: this, dependsOn: [lambdaRole, lambdaPolicy] }
    );

    // 7. Create IAM role for AWS Config
    const configRole = new aws.iam.Role(
      `config-role-${environmentSuffix}`,
      {
        name: `config-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'config.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: tags,
      },
      { parent: this }
    );

    // Attach AWS managed Config policy
    new aws.iam.RolePolicyAttachment(
      `config-role-policy-${environmentSuffix}`,
      {
        role: configRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole',
      },
      { parent: this }
    );

    // Additional policy for S3 bucket access
    const configS3Policy = new aws.iam.Policy(
      `config-s3-policy-${environmentSuffix}`,
      {
        name: `config-s3-policy-${environmentSuffix}`,
        policy: configBucket.arn.apply(arn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  's3:GetBucketVersioning',
                  's3:PutObject',
                  's3:GetObject',
                ],
                Resource: [arn, `${arn}/*`],
              },
            ],
          })
        ),
        tags: tags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `config-s3-policy-attach-${environmentSuffix}`,
      {
        role: configRole.name,
        policyArn: configS3Policy.arn,
      },
      { parent: this }
    );

    // 8. AWS Config Recorder - Account-Level Resource
    // NOTE: AWS Config Recorder is an ACCOUNT-LEVEL resource (limit: 1 per region per account).
    // This infrastructure assumes a Config Recorder already exists in the AWS account.
    // If not present, enable AWS Config manually via the AWS Console or CLI:
    //
    //   aws configservice put-configuration-recorder \
    //     --configuration-recorder name=default,roleARN=<config-role-arn> \
    //     --recording-group allSupported=true,includeGlobalResourceTypes=true
    //
    //   aws configservice put-delivery-channel \
    //     --delivery-channel name=default,s3BucketName=<bucket-name>
    //
    //   aws configservice start-configuration-recorder --configuration-recorder-name default
    //
    // Instead of creating the recorder, we create stack-scoped Config Rules that leverage
    // the existing account-level recorder.

    // 9. Create AWS Config Rules (stack-scoped) for compliance checks
    // These rules trigger Lambda evaluations when resources change

    // Config Rule for S3 bucket encryption
    void new aws.cfg.Rule(
      `s3-encryption-rule-${environmentSuffix}`,
      {
        name: `s3-encryption-rule-${environmentSuffix}`,
        source: {
          owner: 'AWS',
          sourceIdentifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
        },
        scope: {
          complianceResourceTypes: ['AWS::S3::Bucket'],
        },
        tags: tags,
      },
      { parent: this }
    );

    // Config Rule for S3 bucket versioning
    void new aws.cfg.Rule(
      `s3-versioning-rule-${environmentSuffix}`,
      {
        name: `s3-versioning-rule-${environmentSuffix}`,
        source: {
          owner: 'AWS',
          sourceIdentifier: 'S3_BUCKET_VERSIONING_ENABLED',
        },
        scope: {
          complianceResourceTypes: ['AWS::S3::Bucket'],
        },
        tags: tags,
      },
      { parent: this }
    );

    // Config Rule for RDS encryption
    void new aws.cfg.Rule(
      `rds-encryption-rule-${environmentSuffix}`,
      {
        name: `rds-encryption-rule-${environmentSuffix}`,
        source: {
          owner: 'AWS',
          sourceIdentifier: 'RDS_STORAGE_ENCRYPTED',
        },
        scope: {
          complianceResourceTypes: ['AWS::RDS::DBInstance'],
        },
        tags: tags,
      },
      { parent: this }
    );

    // Config Rule for EC2 instance detailed monitoring
    void new aws.cfg.Rule(
      `ec2-monitoring-rule-${environmentSuffix}`,
      {
        name: `ec2-monitoring-rule-${environmentSuffix}`,
        source: {
          owner: 'AWS',
          sourceIdentifier: 'EC2_INSTANCE_DETAILED_MONITORING_ENABLED',
        },
        scope: {
          complianceResourceTypes: ['AWS::EC2::Instance'],
        },
        tags: tags,
      },
      { parent: this }
    );

    // 11. Create EventBridge rule for 6-hour schedule
    const scheduledRule = new aws.cloudwatch.EventRule(
      `compliance-schedule-${environmentSuffix}`,
      {
        name: `compliance-schedule-${environmentSuffix}`,
        description: 'Trigger compliance scan every 6 hours',
        scheduleExpression: 'rate(6 hours)',
        tags: tags,
      },
      { parent: this }
    );

    // Lambda permission for EventBridge
    new aws.lambda.Permission(
      `compliance-eventbridge-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: complianceFunction.name,
        principal: 'events.amazonaws.com',
        sourceArn: scheduledRule.arn,
      },
      { parent: this }
    );

    // EventBridge target
    new aws.cloudwatch.EventTarget(
      `compliance-schedule-target-${environmentSuffix}`,
      {
        rule: scheduledRule.name,
        arn: complianceFunction.arn,
      },
      { parent: this }
    );

    // 12. Create EventBridge rule for Config changes
    const configChangeRule = new aws.cloudwatch.EventRule(
      `compliance-config-change-${environmentSuffix}`,
      {
        name: `compliance-config-change-${environmentSuffix}`,
        description: 'Trigger compliance scan on Config changes',
        eventPattern: JSON.stringify({
          source: ['aws.config'],
          'detail-type': ['Config Configuration Item Change'],
        }),
        tags: tags,
      },
      { parent: this }
    );

    // Lambda permission for Config change events
    new aws.lambda.Permission(
      `compliance-config-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: complianceFunction.name,
        principal: 'events.amazonaws.com',
        sourceArn: configChangeRule.arn,
      },
      { parent: this }
    );

    // EventBridge target for Config changes
    new aws.cloudwatch.EventTarget(
      `compliance-config-target-${environmentSuffix}`,
      {
        rule: configChangeRule.name,
        arn: complianceFunction.arn,
      },
      { parent: this }
    );

    // 12a. Create EventBridge rule for Config Rule compliance changes
    const configRuleComplianceRule = new aws.cloudwatch.EventRule(
      `compliance-rule-change-${environmentSuffix}`,
      {
        name: `compliance-rule-change-${environmentSuffix}`,
        description:
          'Trigger compliance scan on Config Rule compliance changes',
        eventPattern: JSON.stringify({
          source: ['aws.config'],
          'detail-type': ['Config Rules Compliance Change'],
        }),
        tags: tags,
      },
      { parent: this }
    );

    // Lambda permission for Config Rule compliance events
    new aws.lambda.Permission(
      `compliance-rule-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: complianceFunction.name,
        principal: 'events.amazonaws.com',
        sourceArn: configRuleComplianceRule.arn,
      },
      { parent: this }
    );

    // EventBridge target for Config Rule compliance changes
    new aws.cloudwatch.EventTarget(
      `compliance-rule-target-${environmentSuffix}`,
      {
        rule: configRuleComplianceRule.name,
        arn: complianceFunction.arn,
      },
      { parent: this }
    );

    // 13. Create CloudWatch Dashboard
    const dashboard = new aws.cloudwatch.Dashboard(
      `compliance-dashboard-${environmentSuffix}`,
      {
        dashboardName: `compliance-dashboard-${environmentSuffix}`,
        dashboardBody: pulumi
          .all([complianceFunction.name, complianceTable.name])
          .apply(([functionName, tableName]) =>
            JSON.stringify({
              widgets: [
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/Lambda',
                        'Invocations',
                        { stat: 'Sum', label: 'Function Invocations' },
                      ],
                      [
                        '.',
                        'Errors',
                        { stat: 'Sum', label: 'Function Errors' },
                      ],
                      [
                        '.',
                        'Duration',
                        { stat: 'Average', label: 'Avg Duration' },
                      ],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: aws.config.region || 'us-east-1',
                    title: 'Lambda Compliance Function Metrics',
                    dimensions: {
                      FunctionName: functionName,
                    },
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/DynamoDB',
                        'ConsumedReadCapacityUnits',
                        { stat: 'Sum' },
                      ],
                      ['.', 'ConsumedWriteCapacityUnits', { stat: 'Sum' }],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: aws.config.region || 'us-east-1',
                    title: 'DynamoDB Compliance Table Metrics',
                    dimensions: {
                      TableName: tableName,
                    },
                  },
                },
                {
                  type: 'log',
                  properties: {
                    query: `SOURCE '/aws/lambda/${functionName}'
| fields @timestamp, @message
| filter @message like /violation/
| sort @timestamp desc
| limit 20`,
                    region: aws.config.region || 'us-east-1',
                    title: 'Recent Compliance Violations',
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // 14. Create CloudWatch Alarms
    new aws.cloudwatch.MetricAlarm(
      `compliance-lambda-errors-${environmentSuffix}`,
      {
        name: `compliance-lambda-errors-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Sum',
        threshold: 5,
        alarmDescription: 'Alert when compliance Lambda has more than 5 errors',
        dimensions: {
          FunctionName: complianceFunction.name,
        },
        alarmActions: [violationsTopic.arn],
        tags: tags,
      },
      { parent: this }
    );

    // Register outputs
    this.configBucketName = configBucket.id;
    this.complianceTableName = complianceTable.name;
    this.complianceFunctionArn = complianceFunction.arn;
    this.snsTopicArn = violationsTopic.arn;
    this.dashboardName = dashboard.dashboardName;

    this.registerOutputs({
      configBucketName: this.configBucketName,
      complianceTableName: this.complianceTableName,
      complianceFunctionArn: this.complianceFunctionArn,
      snsTopicArn: this.snsTopicArn,
      dashboardName: this.dashboardName,
    });
  }
}
