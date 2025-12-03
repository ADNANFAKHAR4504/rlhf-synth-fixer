/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for S3 compliance analysis infrastructure.
 * Creates Lambda function to analyze S3 buckets and generate compliance reports.
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
 * Represents the main Pulumi component resource for S3 compliance analysis.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly complianceReportBucket: pulumi.Output<string>;
  public readonly analysisLambdaArn: pulumi.Output<string>;

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
    const tags = args.tags || {};

    // S3 bucket for storing compliance reports
    const complianceReportBucket = new aws.s3.Bucket(
      `s3-compliance-reports-${environmentSuffix}`,
      {
        bucket: `s3-compliance-reports-${environmentSuffix}`,
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
        lifecycleRules: [
          {
            enabled: true,
            id: 'delete-old-reports',
            expiration: {
              days: 90,
            },
          },
        ],
        forceDestroy: true,
        tags: tags,
      },
      { parent: this }
    );

    // IAM role for Lambda function
    const lambdaRole = new aws.iam.Role(
      `s3-analysis-lambda-role-${environmentSuffix}`,
      {
        name: `s3-analysis-lambda-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Effect: 'Allow',
            },
          ],
        }),
        tags: tags,
      },
      { parent: this }
    );

    // IAM policy for Lambda to access S3 and CloudWatch
    const lambdaPolicy = new aws.iam.RolePolicy(
      `s3-analysis-lambda-policy-${environmentSuffix}`,
      {
        name: `s3-analysis-lambda-policy-${environmentSuffix}`,
        role: lambdaRole.id,
        policy: pulumi.all([complianceReportBucket.arn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  's3:ListAllMyBuckets',
                  's3:GetBucketLocation',
                  's3:GetBucketVersioning',
                  's3:GetBucketPolicy',
                  's3:GetBucketPublicAccessBlock',
                  's3:GetBucketAcl',
                  's3:GetBucketPolicyStatus',
                  's3:GetBucketTagging',
                  's3:GetEncryptionConfiguration',
                  's3:GetLifecycleConfiguration',
                  's3:GetBucketLogging',
                ],
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: ['s3:PutObject', 's3:PutObjectAcl'],
                Resource: `${bucketArn}/*`,
              },
              {
                Effect: 'Allow',
                Action: [
                  'cloudwatch:GetMetricStatistics',
                  'cloudwatch:ListMetrics',
                  'cloudwatch:GetMetricData',
                ],
                Resource: '*',
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
              {
                Effect: 'Allow',
                Action: ['s3:PutBucketTagging'],
                Resource: 'arn:aws:s3:::*',
              },
            ],
          })
        ),
      },
      { parent: this, dependsOn: [lambdaRole] }
    );

    // Lambda function code
    const lambdaCode = `
const { S3Client, ListBucketsCommand, GetBucketEncryptionCommand, GetBucketLifecycleConfigurationCommand,
        GetBucketPolicyCommand, GetBucketAclCommand, GetBucketTaggingCommand, PutObjectCommand,
        PutBucketTaggingCommand, GetPublicAccessBlockCommand } = require('@aws-sdk/client-s3');
const { CloudWatchClient, GetMetricStatisticsCommand } = require('@aws-sdk/client-cloudwatch');

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const cloudwatchClient = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' });

const FINANCIAL_RETENTION_DAYS = 7 * 365; // 7 years in days

exports.handler = async (event) => {
  console.log('Starting S3 compliance analysis...');

  const findings = {
    critical: [],
    high: [],
    medium: [],
    low: [],
    summary: {
      totalBuckets: 0,
      compliantBuckets: 0,
      nonCompliantBuckets: 0,
      timestamp: new Date().toISOString(),
    }
  };

  try {
    // List all S3 buckets
    const listBucketsCommand = new ListBucketsCommand({});
    const buckets = await s3Client.send(listBucketsCommand);

    findings.summary.totalBuckets = buckets.Buckets?.length || 0;
    console.log(\`Found \${findings.summary.totalBuckets} buckets to analyze\`);

    // Analyze each bucket
    for (const bucket of buckets.Buckets || []) {
      const bucketName = bucket.Name;
      console.log(\`Analyzing bucket: \${bucketName}\`);

      let bucketCompliant = true;

      // Check encryption
      try {
        await s3Client.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
      } catch (error) {
        if (error.name === 'ServerSideEncryptionConfigurationNotFoundError') {
          findings.critical.push({
            bucket: bucketName,
            issue: 'No server-side encryption configured',
            severity: 'CRITICAL',
            recommendation: 'Enable SSE-S3 or SSE-KMS encryption',
          });
          bucketCompliant = false;
        }
      }

      // Check public access
      try {
        const publicAccessBlock = await s3Client.send(
          new GetPublicAccessBlockCommand({ Bucket: bucketName })
        );

        const config = publicAccessBlock.PublicAccessBlockConfiguration;
        if (!config?.BlockPublicAcls || !config?.BlockPublicPolicy ||
            !config?.IgnorePublicAcls || !config?.RestrictPublicBuckets) {
          findings.high.push({
            bucket: bucketName,
            issue: 'Public access not fully blocked',
            severity: 'HIGH',
            recommendation: 'Enable all Block Public Access settings',
          });
          bucketCompliant = false;
        }
      } catch (error) {
        // If no public access block config, it's a critical issue
        findings.critical.push({
          bucket: bucketName,
          issue: 'No public access block configuration',
          severity: 'CRITICAL',
          recommendation: 'Configure Block Public Access settings',
        });
        bucketCompliant = false;
      }

      // Check bucket policy for overly permissive access
      try {
        const policyResponse = await s3Client.send(
          new GetBucketPolicyCommand({ Bucket: bucketName })
        );

        if (policyResponse.Policy) {
          const policy = JSON.parse(policyResponse.Policy);
          for (const statement of policy.Statement || []) {
            if (statement.Effect === 'Allow' &&
                (statement.Principal === '*' || statement.Principal?.AWS === '*')) {
              findings.high.push({
                bucket: bucketName,
                issue: 'Bucket policy allows public access',
                severity: 'HIGH',
                recommendation: 'Restrict bucket policy to specific principals',
              });
              bucketCompliant = false;
            }
          }
        }
      } catch (error) {
        // No bucket policy is fine
      }

      // Check lifecycle policy for financial data retention
      try {
        const lifecycleResponse = await s3Client.send(
          new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName })
        );

        // Check if bucket appears to contain financial data (by name or tags)
        const isFinancialBucket = bucketName.toLowerCase().includes('financial') ||
                                  bucketName.toLowerCase().includes('invoice') ||
                                  bucketName.toLowerCase().includes('payment');

        if (isFinancialBucket) {
          const hasProperRetention = lifecycleResponse.Rules?.some(rule => {
            const expirationDays = rule.Expiration?.Days;
            return expirationDays && expirationDays >= FINANCIAL_RETENTION_DAYS;
          });

          if (!hasProperRetention) {
            findings.high.push({
              bucket: bucketName,
              issue: 'Financial data retention policy does not meet 7-year requirement',
              severity: 'HIGH',
              recommendation: 'Configure lifecycle policy with minimum 7-year retention',
            });
            bucketCompliant = false;
          }
        }
      } catch (error) {
        // No lifecycle config might be ok for non-financial buckets
      }

      // Check CloudWatch metrics for bucket access in last 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      try {
        const metricsCommand = new GetMetricStatisticsCommand({
          Namespace: 'AWS/S3',
          MetricName: 'NumberOfObjects',
          Dimensions: [
            {
              Name: 'BucketName',
              Value: bucketName,
            },
            {
              Name: 'StorageType',
              Value: 'AllStorageTypes',
            },
          ],
          StartTime: ninetyDaysAgo,
          EndTime: new Date(),
          Period: 86400, // 1 day
          Statistics: ['Average'],
        });

        const metricsResponse = await cloudwatchClient.send(metricsCommand);

        if (!metricsResponse.Datapoints || metricsResponse.Datapoints.length === 0) {
          findings.medium.push({
            bucket: bucketName,
            issue: 'No access metrics in last 90 days - potential unused bucket',
            severity: 'MEDIUM',
            recommendation: 'Review bucket usage and consider archival or deletion',
          });
          bucketCompliant = false;
        }
      } catch (error) {
        console.log(\`Could not fetch metrics for \${bucketName}: \${error.message}\`);
      }

      // Tag the bucket with compliance status
      try {
        const taggingResponse = await s3Client.send(
          new GetBucketTaggingCommand({ Bucket: bucketName })
        );

        const existingTags = taggingResponse.TagSet || [];
        const newTags = existingTags.filter(
          tag => tag.Key !== 'ComplianceStatus' && tag.Key !== 'LastAuditDate'
        );

        newTags.push(
          {
            Key: 'ComplianceStatus',
            Value: bucketCompliant ? 'COMPLIANT' : 'NON_COMPLIANT',
          },
          {
            Key: 'LastAuditDate',
            Value: new Date().toISOString(),
          }
        );

        await s3Client.send(
          new PutBucketTaggingCommand({
            Bucket: bucketName,
            Tagging: { TagSet: newTags },
          })
        );
      } catch (error) {
        console.log(\`Could not tag bucket \${bucketName}: \${error.message}\`);
      }

      if (bucketCompliant) {
        findings.summary.compliantBuckets++;
      } else {
        findings.summary.nonCompliantBuckets++;
      }
    }

    // Generate compliance report
    const report = {
      ...findings,
      metadata: {
        analysisDate: new Date().toISOString(),
        analyzerVersion: '1.0.0',
        region: process.env.AWS_REGION || 'us-east-1',
      },
    };

    // Store report in S3
    const reportKey = \`compliance-reports/s3-compliance-\${Date.now()}.json\`;
    const reportBucket = process.env.REPORT_BUCKET;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: reportBucket,
        Key: reportKey,
        Body: JSON.stringify(report, null, 2),
        ContentType: 'application/json',
      })
    );

    console.log(\`Compliance report saved to s3://\${reportBucket}/\${reportKey}\`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'S3 compliance analysis completed',
        reportLocation: \`s3://\${reportBucket}/\${reportKey}\`,
        summary: findings.summary,
      }),
    };
  } catch (error) {
    console.error('Error during compliance analysis:', error);
    throw error;
  }
};
`;

    // Create Lambda function
    const analysisLambda = new aws.lambda.Function(
      `s3-compliance-analyzer-${environmentSuffix}`,
      {
        name: `s3-compliance-analyzer-${environmentSuffix}`,
        runtime: 'nodejs20.x',
        role: lambdaRole.arn,
        handler: 'index.handler',
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(lambdaCode),
          'package.json': new pulumi.asset.StringAsset(
            JSON.stringify({
              name: 's3-compliance-analyzer',
              version: '1.0.0',
              dependencies: {
                '@aws-sdk/client-s3': '^3.0.0',
                '@aws-sdk/client-cloudwatch': '^3.0.0',
              },
            })
          ),
        }),
        timeout: 900, // 15 minutes
        memorySize: 512,
        environment: {
          variables: {
            REPORT_BUCKET: complianceReportBucket.bucket,
            // AWS_REGION is automatically provided by Lambda runtime
          },
        },
        tags: tags,
      },
      { parent: this, dependsOn: [lambdaRole, lambdaPolicy] }
    );

    // CloudWatch Log Group for Lambda
    const lambdaLogGroup = new aws.cloudwatch.LogGroup(
      `s3-analyzer-logs-${environmentSuffix}`,
      {
        name: pulumi.interpolate`/aws/lambda/${analysisLambda.name}`,
        retentionInDays: 7,
        tags: tags,
      },
      { parent: this }
    );

    // SNS topic for critical compliance violations
    const criticalAlarmTopic = new aws.sns.Topic(
      `s3-compliance-critical-${environmentSuffix}`,
      {
        name: `s3-compliance-critical-${environmentSuffix}`,
        tags: tags,
      },
      { parent: this }
    );

    // CloudWatch metric filter for critical findings
    const criticalFindingsFilter = new aws.cloudwatch.LogMetricFilter(
      `s3-critical-findings-${environmentSuffix}`,
      {
        name: `s3-critical-findings-${environmentSuffix}`,
        logGroupName: lambdaLogGroup.name,
        pattern: '"CRITICAL"',
        metricTransformation: {
          name: `S3CriticalFindings-${environmentSuffix}`,
          namespace: 'S3Compliance',
          value: '1',
          defaultValue: '0',
        },
      },
      { parent: this, dependsOn: [lambdaLogGroup] }
    );

    // CloudWatch alarm for critical compliance violations
    const criticalAlarm = new aws.cloudwatch.MetricAlarm(
      `s3-critical-alarm-${environmentSuffix}`,
      {
        name: `s3-critical-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: `S3CriticalFindings-${environmentSuffix}`,
        namespace: 'S3Compliance',
        period: 300,
        statistic: 'Sum',
        threshold: 0,
        alarmDescription:
          'Alert when critical S3 compliance violations are detected',
        alarmActions: [criticalAlarmTopic.arn],
        treatMissingData: 'notBreaching',
        tags: tags,
      },
      { parent: this, dependsOn: [criticalFindingsFilter] }
    );
    // Suppress unused variable warning - resource is created for infrastructure
    void criticalAlarm;

    // EventBridge rule to trigger analysis daily
    const scheduledRule = new aws.cloudwatch.EventRule(
      `s3-analysis-schedule-${environmentSuffix}`,
      {
        name: `s3-analysis-schedule-${environmentSuffix}`,
        description: 'Trigger S3 compliance analysis daily',
        scheduleExpression: 'rate(1 day)',
        tags: tags,
      },
      { parent: this }
    );

    // EventBridge target
    const scheduleTarget = new aws.cloudwatch.EventTarget(
      `s3-analysis-target-${environmentSuffix}`,
      {
        rule: scheduledRule.name,
        arn: analysisLambda.arn,
      },
      { parent: this, dependsOn: [scheduledRule] }
    );
    // Suppress unused variable warning - resource is created for infrastructure
    void scheduleTarget;

    // Lambda permission for EventBridge
    const eventBridgePermission = new aws.lambda.Permission(
      `s3-analyzer-eventbridge-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: analysisLambda.name,
        principal: 'events.amazonaws.com',
        sourceArn: scheduledRule.arn,
      },
      { parent: this, dependsOn: [analysisLambda, scheduledRule] }
    );
    // Suppress unused variable warning - resource is created for infrastructure
    void eventBridgePermission;

    // Expose outputs
    this.complianceReportBucket = complianceReportBucket.bucket;
    this.analysisLambdaArn = analysisLambda.arn;

    // Register outputs
    this.registerOutputs({
      complianceReportBucket: this.complianceReportBucket,
      analysisLambdaArn: this.analysisLambdaArn,
      snsTopicArn: criticalAlarmTopic.arn,
    });
  }
}
