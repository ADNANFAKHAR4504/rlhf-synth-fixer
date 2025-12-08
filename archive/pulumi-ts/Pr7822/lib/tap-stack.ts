/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of compliance scanning infrastructure
 * and manages environment-specific configurations.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import * as fs from 'fs';
import * as path from 'path';

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

  /**
   * Optional email address for compliance alerts.
   */
  alertEmail?: string;
}

/**
 * Generates IAM policy JSON for the Lambda function.
 * Exported for testability.
 */
export function generateLambdaPolicy(
  bucketId: string,
  topicArn: string,
  awsRegion: string,
  environmentSuffix: string
): string {
  return JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          'ec2:DescribeInstances',
          'ec2:DescribeTags',
          'rds:DescribeDBInstances',
          'rds:ListTagsForResource',
          's3:ListAllMyBuckets',
          's3:GetBucketTagging',
        ],
        Resource: '*',
      },
      {
        Effect: 'Allow',
        Action: ['s3:PutObject', 's3:PutObjectAcl'],
        Resource: `arn:aws:s3:::${bucketId}/*`,
      },
      {
        Effect: 'Allow',
        Action: ['sns:Publish'],
        Resource: topicArn,
      },
      {
        Effect: 'Allow',
        Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        Resource: `arn:aws:logs:${awsRegion}:*:log-group:/aws/lambda/compliance-scanner-${environmentSuffix}:*`,
      },
    ],
  });
}

/**
 * Generates dashboard URLs for CloudWatch console.
 * Exported for testability.
 */
export function generateDashboardUrls(
  awsRegion: string,
  logGroupName: string
): Record<string, string> {
  return {
    cloudwatchLogs: `https://console.aws.amazon.com/cloudwatch/home?region=${awsRegion}#logsV2:log-groups/log-group/${logGroupName}`,
  };
}

/**
 * Creates SNS topic ARNs record.
 * Exported for testability.
 */
export function createSnsTopicArns(arn: string): Record<string, string> {
  return {
    complianceAlerts: arn,
  };
}

/**
 * Creates Lambda function ARNs record.
 * Exported for testability.
 */
export function createLambdaFunctionArns(arn: string): Record<string, string> {
  return {
    complianceScanner: arn,
  };
}

/**
 * Ensures the Lambda code directory exists.
 * Exported for testability.
 */
export function ensureLambdaDirectory(lambdaCodeDir: string): void {
  if (!fs.existsSync(lambdaCodeDir)) {
    fs.mkdirSync(lambdaCodeDir, { recursive: true });
  }
}

/**
 * Creates a policy generator function for use with Pulumi.apply().
 * Exported for testability.
 */
export function createPolicyGenerator(
  awsRegion: string,
  environmentSuffix: string
): (args: [string, string]) => string {
  return ([bucketId, topicArn]: [string, string]) =>
    generateLambdaPolicy(bucketId, topicArn, awsRegion, environmentSuffix);
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component creates compliance scanning infrastructure including:
 * - S3 bucket for compliance reports
 * - SNS topic for alerts
 * - Lambda function for scanning AWS resources
 * - CloudWatch Events for scheduling scans
 */
export class TapStack extends pulumi.ComponentResource {
  // Public outputs
  public readonly dashboardUrls: pulumi.Output<Record<string, string>>;
  public readonly snsTopicArns: pulumi.Output<Record<string, string>>;
  public readonly lambdaFunctionArns: pulumi.Output<Record<string, string>>;
  public readonly reportsBucketName: pulumi.Output<string>;
  public readonly logGroupName: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix =
      args.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';
    const alertEmail = args.alertEmail || 'ops@example.com';
    const awsRegion = process.env.AWS_REGION || 'us-east-1';

    // Required tags to check for compliance
    const requiredTags = ['Environment', 'CostCenter', 'Owner'];

    // S3 bucket for compliance reports
    const reportsBucket = new aws.s3.Bucket(
      `compliance-reports-${environmentSuffix}`,
      {
        versioning: {
          enabled: true,
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        forceDestroy: true,
        tags: {
          Name: `compliance-reports-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // SNS topic for compliance alerts
    const alertTopic = new aws.sns.Topic(
      `compliance-alerts-${environmentSuffix}`,
      {
        displayName: 'Compliance Alerts',
        tags: {
          Name: `compliance-alerts-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // SNS topic subscription for email notifications
    // Note: Email subscription requires manual confirmation via email
    new aws.sns.TopicSubscription(
      `compliance-alert-email-${environmentSuffix}`,
      {
        topic: alertTopic.arn,
        protocol: 'email',
        endpoint: alertEmail,
      },
      { parent: this }
    );

    // CloudWatch Logs group for Lambda
    const logGroup = new aws.cloudwatch.LogGroup(
      `/aws/lambda/compliance-scanner-${environmentSuffix}`,
      {
        retentionInDays: 30,
        tags: {
          Name: `/aws/lambda/compliance-scanner-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // IAM role for Lambda function
    const lambdaRole = new aws.iam.Role(
      `compliance-scanner-role-${environmentSuffix}`,
      {
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
          Name: `compliance-scanner-role-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // IAM policy for Lambda to read AWS resources
    const policyGenerator = createPolicyGenerator(awsRegion, environmentSuffix);
    new aws.iam.RolePolicy(
      `compliance-scanner-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi
          .all([reportsBucket.id, alertTopic.arn])
          .apply(policyGenerator),
      },
      { parent: this }
    );

    // Lambda function code
    const lambdaCode = `const {
    EC2Client,
    DescribeInstancesCommand
} = require("@aws-sdk/client-ec2");
const {
    RDSClient,
    DescribeDBInstancesCommand,
    ListTagsForResourceCommand: RDSListTagsCommand
} = require("@aws-sdk/client-rds");
const {
    S3Client,
    ListBucketsCommand,
    GetBucketTaggingCommand,
    PutObjectCommand
} = require("@aws-sdk/client-s3");
const {
    SNSClient,
    PublishCommand
} = require("@aws-sdk/client-sns");

const ec2Client = new EC2Client({});
const rdsClient = new RDSClient({});
const s3Client = new S3Client({});
const snsClient = new SNSClient({});

exports.handler = async (event) => {
    console.log("Starting compliance scan...");

    const requiredTags = (process.env.REQUIRED_TAGS || "").split(",");
    const snsTopicArn = process.env.SNS_TOPIC_ARN;
    const reportsBucket = process.env.REPORTS_BUCKET;

    const violations = [];
    const timestamp = new Date().toISOString();
    const scanId = \`scan-\${Date.now()}\`;

    try {
        // Scan EC2 instances
        console.log("Scanning EC2 instances...");
        const ec2Response = await ec2Client.send(new DescribeInstancesCommand({}));

        for (const reservation of (ec2Response.Reservations || [])) {
            for (const instance of (reservation.Instances || [])) {
                const tags = instance.Tags || [];
                const tagKeys = tags.map(t => t.Key);
                const missingTags = requiredTags.filter(rt => !tagKeys.includes(rt));

                if (missingTags.length > 0) {
                    violations.push({
                        resource_id: instance.InstanceId,
                        resource_type: "EC2",
                        missing_tags: missingTags,
                        last_modified: instance.LaunchTime ? instance.LaunchTime.toISOString() : timestamp,
                    });
                }
            }
        }

        // Scan RDS instances
        console.log("Scanning RDS instances...");
        const rdsResponse = await rdsClient.send(new DescribeDBInstancesCommand({}));

        for (const dbInstance of (rdsResponse.DBInstances || [])) {
            const dbArn = dbInstance.DBInstanceArn;
            const tagsResponse = await rdsClient.send(
                new RDSListTagsCommand({ ResourceName: dbArn })
            );

            const tags = tagsResponse.TagList || [];
            const tagKeys = tags.map(t => t.Key);
            const missingTags = requiredTags.filter(rt => !tagKeys.includes(rt));

            if (missingTags.length > 0) {
                violations.push({
                    resource_id: dbInstance.DBInstanceIdentifier,
                    resource_type: "RDS",
                    missing_tags: missingTags,
                    last_modified: dbInstance.InstanceCreateTime ?
                        dbInstance.InstanceCreateTime.toISOString() : timestamp,
                });
            }
        }

        // Scan S3 buckets
        console.log("Scanning S3 buckets...");
        const bucketsResponse = await s3Client.send(new ListBucketsCommand({}));

        for (const bucket of (bucketsResponse.Buckets || [])) {
            try {
                const tagsResponse = await s3Client.send(
                    new GetBucketTaggingCommand({ Bucket: bucket.Name })
                );

                const tags = tagsResponse.TagSet || [];
                const tagKeys = tags.map(t => t.Key);
                const missingTags = requiredTags.filter(rt => !tagKeys.includes(rt));

                if (missingTags.length > 0) {
                    violations.push({
                        resource_id: bucket.Name,
                        resource_type: "S3",
                        missing_tags: missingTags,
                        last_modified: bucket.CreationDate ?
                            bucket.CreationDate.toISOString() : timestamp,
                    });
                }
            } catch (error) {
                // Bucket might not have tags - consider it non-compliant
                if (error.name === "NoSuchTagSet") {
                    violations.push({
                        resource_id: bucket.Name,
                        resource_type: "S3",
                        missing_tags: requiredTags,
                        last_modified: bucket.CreationDate ?
                            bucket.CreationDate.toISOString() : timestamp,
                    });
                } else {
                    console.error(\`Error checking bucket \${bucket.Name}: \${error.message}\`);
                }
            }
        }

        // Generate compliance report
        const totalResources = (ec2Response.Reservations?.reduce((acc, r) =>
            acc + (r.Instances?.length || 0), 0) || 0) +
            (rdsResponse.DBInstances?.length || 0) +
            (bucketsResponse.Buckets?.length || 0);

        const report = {
            timestamp,
            scan_id: scanId,
            summary: {
                total_resources: totalResources,
                compliant: totalResources - violations.length,
                non_compliant: violations.length,
            },
            violations,
        };

        // Store report in S3
        console.log("Storing compliance report in S3...");
        const reportKey = \`compliance-reports/\${scanId}.json\`;
        await s3Client.send(new PutObjectCommand({
            Bucket: reportsBucket,
            Key: reportKey,
            Body: JSON.stringify(report, null, 2),
            ContentType: "application/json",
        }));

        // Send SNS alert if violations found
        if (violations.length > 0) {
            console.log(\`Found \${violations.length} non-compliant resources. Sending alert...\`);

            const message = \`Compliance Scan Alert\\n\\n\` +
                \`Scan ID: \${scanId}\\n\` +
                \`Timestamp: \${timestamp}\\n\` +
                \`Total Resources: \${totalResources}\\n\` +
                \`Non-Compliant Resources: \${violations.length}\\n\\n\` +
                \`Summary:\\n\` +
                violations.slice(0, 10).map(v =>
                    \`- \${v.resource_type}: \${v.resource_id} (missing: \${v.missing_tags.join(", ")})\`
                ).join("\\n") +
                (violations.length > 10 ? \`\\n\\n... and \${violations.length - 10} more violations\` : "") +
                \`\\n\\nFull report available in S3: \${reportsBucket}/\${reportKey}\`;

            await snsClient.send(new PublishCommand({
                TopicArn: snsTopicArn,
                Subject: \`Compliance Alert: \${violations.length} Non-Compliant Resources Found\`,
                Message: message,
            }));
        } else {
            console.log("No violations found. All resources are compliant.");
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Compliance scan completed successfully",
                scanId,
                violations: violations.length,
            }),
        };

    } catch (error) {
        console.error("Error during compliance scan:", error);
        throw error;
    }
};`;

    // Create Lambda deployment package directory
    const lambdaCodeDir = './lib/lambda';
    ensureLambdaDirectory(lambdaCodeDir);

    // Write Lambda function code
    fs.writeFileSync(path.join(lambdaCodeDir, 'index.js'), lambdaCode);

    // Create package.json for Lambda dependencies
    const packageJson = {
      name: 'compliance-scanner',
      version: '1.0.0',
      description: 'Lambda function for compliance scanning',
      dependencies: {
        '@aws-sdk/client-ec2': '^3.450.0',
        '@aws-sdk/client-rds': '^3.450.0',
        '@aws-sdk/client-s3': '^3.450.0',
        '@aws-sdk/client-sns': '^3.450.0',
      },
    };

    fs.writeFileSync(
      path.join(lambdaCodeDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Lambda function
    const lambdaFunction = new aws.lambda.Function(
      `compliance-scanner-${environmentSuffix}`,
      {
        runtime: aws.lambda.Runtime.NodeJS18dX,
        role: lambdaRole.arn,
        handler: 'index.handler',
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive(lambdaCodeDir),
        }),
        timeout: 300,
        memorySize: 512,
        environment: {
          variables: {
            REQUIRED_TAGS: requiredTags.join(','),
            SNS_TOPIC_ARN: alertTopic.arn,
            REPORTS_BUCKET: reportsBucket.id,
          },
        },
        loggingConfig: {
          logFormat: 'Text',
          logGroup: logGroup.name,
        },
        tags: {
          Name: `compliance-scanner-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, dependsOn: [logGroup] }
    );

    // CloudWatch Event Rule to trigger Lambda every 6 hours
    const eventRule = new aws.cloudwatch.EventRule(
      `compliance-scan-schedule-${environmentSuffix}`,
      {
        scheduleExpression: 'rate(6 hours)',
        description: 'Trigger compliance scan every 6 hours',
        tags: {
          Name: `compliance-scan-schedule-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Permission for CloudWatch Events to invoke Lambda
    const lambdaPermission = new aws.lambda.Permission(
      `compliance-scanner-invoke-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: lambdaFunction.name,
        principal: 'events.amazonaws.com',
        sourceArn: eventRule.arn,
      },
      { parent: this }
    );

    // CloudWatch Event Target to invoke Lambda
    new aws.cloudwatch.EventTarget(
      `compliance-scan-target-${environmentSuffix}`,
      {
        rule: eventRule.name,
        arn: lambdaFunction.arn,
      },
      { parent: this, dependsOn: [lambdaPermission] }
    );

    // Set outputs
    this.reportsBucketName = reportsBucket.id;
    this.logGroupName = logGroup.name;

    // Dashboard URLs - could be CloudWatch console URLs
    this.dashboardUrls = logGroup.name.apply(name =>
      generateDashboardUrls(awsRegion, name)
    );

    // SNS Topic ARNs
    this.snsTopicArns = alertTopic.arn.apply(arn => createSnsTopicArns(arn));

    // Lambda Function ARNs
    this.lambdaFunctionArns = lambdaFunction.arn.apply(arn =>
      createLambdaFunctionArns(arn)
    );

    // Register the outputs of this component
    this.registerOutputs({
      dashboardUrls: this.dashboardUrls,
      snsTopicArns: this.snsTopicArns,
      lambdaFunctionArns: this.lambdaFunctionArns,
      reportsBucketName: this.reportsBucketName,
      logGroupName: this.logGroupName,
    });
  }
}
