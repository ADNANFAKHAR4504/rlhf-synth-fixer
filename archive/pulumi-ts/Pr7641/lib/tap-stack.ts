/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for the Infrastructure Compliance Monitoring System.
 *
 * This stack orchestrates:
 * - Lambda function for EC2 compliance scanning
 * - CloudWatch EventBridge rule for scheduled execution
 * - CloudWatch custom metrics, dashboard, and alarms
 * - SNS topic for violation alerts
 * - IAM roles and policies
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

  /**
   * Compliance threshold percentage (0-100). Default: 80
   */
  complianceThreshold?: number;

  /**
   * Minimum number of required tags per instance. Default: 3
   */
  minRequiredTags?: number;

  /**
   * Email address for compliance alerts.
   */
  alertEmail?: string;
}

/**
 * Main Pulumi component resource for the Infrastructure Compliance Monitoring System.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly lambdaFunctionArn: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly dashboardUrl: pulumi.Output<string>;
  public readonly complianceMetricName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};
    const complianceThreshold = args.complianceThreshold || 80;
    const minRequiredTags = args.minRequiredTags || 3;
    const alertEmail = args.alertEmail || 'compliance-team@example.com';

    // Get current AWS region
    const region = aws.getRegionOutput({}, { parent: this });

    // 1. Create SNS Topic for compliance alerts
    const complianceTopic = new aws.sns.Topic(
      `compliance-alerts-${environmentSuffix}`,
      {
        displayName: `Infrastructure Compliance Alerts (${environmentSuffix})`,
        tags: {
          ...tags,
          Name: `compliance-alerts-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create email subscription to SNS topic
    new aws.sns.TopicSubscription(
      `compliance-email-sub-${environmentSuffix}`,
      {
        topic: complianceTopic.arn,
        protocol: 'email',
        endpoint: alertEmail,
      },
      { parent: this }
    );

    // 2. Create IAM role for Lambda function
    const lambdaRole = new aws.iam.Role(
      `compliance-lambda-role-${environmentSuffix}`,
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
          ...tags,
          Name: `compliance-lambda-role-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    const lambdaBasicPolicy = new aws.iam.RolePolicyAttachment(
      `lambda-basic-policy-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Create inline policy for Lambda with required permissions
    const lambdaPolicy = new aws.iam.RolePolicy(
      `compliance-lambda-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: complianceTopic.arn.apply(topicArn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'ec2:DescribeInstances',
                  'ec2:DescribeVolumes',
                  'ec2:DescribeInstanceAttribute',
                ],
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: ['cloudwatch:PutMetricData'],
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: ['sns:Publish'],
                Resource: topicArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // 3. Lambda function code (inline for deployment simplicity)
    const lambdaCode = `const { EC2Client, DescribeInstancesCommand, DescribeVolumesCommand } = require("@aws-sdk/client-ec2");
const { CloudWatchClient, PutMetricDataCommand } = require("@aws-sdk/client-cloudwatch");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const ec2Client = new EC2Client({});
const cloudwatchClient = new CloudWatchClient({});
const snsClient = new SNSClient({});

const COMPLIANCE_THRESHOLD = parseFloat(process.env.COMPLIANCE_THRESHOLD || "80");
const MIN_REQUIRED_TAGS = parseInt(process.env.MIN_REQUIRED_TAGS || "3");
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

exports.handler = async (event) => {
  console.log("Starting compliance scan...");

  try {
    // Get all EC2 instances
    const instances = await getAllInstances();
    console.log(\`Found \${instances.length} instances to scan\`);

    if (instances.length === 0) {
      console.log("No instances found to scan");
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "No instances to scan" })
      };
    }

    // Analyze compliance for each instance
    const complianceResults = await Promise.all(
      instances.map(instance => analyzeInstanceCompliance(instance))
    );

    // Group by instance type and calculate scores
    const scoresByType = groupComplianceByInstanceType(complianceResults);

    // Publish metrics to CloudWatch
    await publishMetrics(scoresByType);

    // Check for violations and send alerts
    const violations = complianceResults.filter(r => r.violations.length > 0);
    if (violations.length > 0) {
      await sendViolationAlert(violations);
    }

    // Calculate overall compliance score
    const overallScore = calculateOverallScore(complianceResults);
    console.log(\`Overall compliance score: \${overallScore.toFixed(2)}%\`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Compliance scan completed",
        totalInstances: instances.length,
        violationCount: violations.length,
        overallScore: overallScore,
        scoresByType: scoresByType
      })
    };
  } catch (error) {
    console.error("Error during compliance scan:", error);
    throw error;
  }
};

async function getAllInstances() {
  const instances = [];
  let nextToken = undefined;

  do {
    const command = new DescribeInstancesCommand({
      NextToken: nextToken,
      Filters: [
        {
          Name: "instance-state-name",
          Values: ["running", "stopped"]
        }
      ]
    });

    const response = await ec2Client.send(command);

    for (const reservation of response.Reservations || []) {
      for (const instance of reservation.Instances || []) {
        instances.push(instance);
      }
    }

    nextToken = response.NextToken;
  } while (nextToken);

  return instances;
}

async function analyzeInstanceCompliance(instance) {
  const instanceId = instance.InstanceId;
  const instanceType = instance.InstanceType;
  const violations = [];

  // Check 1: Public IP address
  if (instance.PublicIpAddress) {
    violations.push({
      type: "PUBLIC_IP",
      message: \`Instance \${instanceId} has public IP address: \${instance.PublicIpAddress}\`
    });
  }

  // Check 2: Required tags
  const tags = instance.Tags || [];
  if (tags.length < MIN_REQUIRED_TAGS) {
    violations.push({
      type: "MISSING_TAGS",
      message: \`Instance \${instanceId} has only \${tags.length} tags, requires \${MIN_REQUIRED_TAGS}\`
    });
  }

  // Check 3: Unencrypted volumes
  const volumeIds = (instance.BlockDeviceMappings || [])
    .map(bdm => bdm.Ebs?.VolumeId)
    .filter(id => id);

  if (volumeIds.length > 0) {
    const volumesCommand = new DescribeVolumesCommand({
      VolumeIds: volumeIds
    });

    try {
      const volumesResponse = await ec2Client.send(volumesCommand);
      for (const volume of volumesResponse.Volumes || []) {
        if (!volume.Encrypted) {
          violations.push({
            type: "UNENCRYPTED_VOLUME",
            message: \`Instance \${instanceId} has unencrypted volume: \${volume.VolumeId}\`
          });
        }
      }
    } catch (error) {
      console.error(\`Error checking volumes for instance \${instanceId}:\`, error);
    }
  }

  // Calculate compliance score (percentage)
  const totalChecks = 3; // public IP, tags, encryption
  const passedChecks = totalChecks - violations.length;
  const complianceScore = (passedChecks / totalChecks) * 100;

  return {
    instanceId,
    instanceType,
    violations,
    complianceScore,
    isCompliant: violations.length === 0
  };
}

function groupComplianceByInstanceType(results) {
  const grouped = {};

  for (const result of results) {
    const type = result.instanceType;
    if (!grouped[type]) {
      grouped[type] = {
        instanceType: type,
        count: 0,
        totalScore: 0,
        averageScore: 0
      };
    }

    grouped[type].count++;
    grouped[type].totalScore += result.complianceScore;
  }

  // Calculate averages
  for (const type in grouped) {
    grouped[type].averageScore = grouped[type].totalScore / grouped[type].count;
  }

  return grouped;
}

async function publishMetrics(scoresByType) {
  const metricData = [];

  for (const type in scoresByType) {
    const data = scoresByType[type];
    metricData.push({
      MetricName: "ComplianceScore",
      Value: data.averageScore,
      Unit: "Percent",
      Timestamp: new Date(),
      Dimensions: [
        {
          Name: "InstanceType",
          Value: type
        }
      ]
    });
  }

  if (metricData.length > 0) {
    const command = new PutMetricDataCommand({
      Namespace: "InfrastructureCompliance",
      MetricData: metricData
    });

    await cloudwatchClient.send(command);
    console.log(\`Published \${metricData.length} compliance metrics\`);
  }
}

async function sendViolationAlert(violations) {
  const violationSummary = violations.map(v => {
    const violationTypes = v.violations.map(vio => vio.type).join(", ");
    return \`Instance \${v.instanceId} (\${v.instanceType}): \${violationTypes}\`;
  }).join("\\n");

  const message = \`Infrastructure Compliance Violations Detected

Total Violations: \${violations.length}

Details:
\${violationSummary}

Please review and remediate these violations immediately.\`;

  const command = new PublishCommand({
    TopicArn: SNS_TOPIC_ARN,
    Subject: \`[ALERT] \${violations.length} Compliance Violations Detected\`,
    Message: message
  });

  await snsClient.send(command);
  console.log("Violation alert sent to SNS");
}

function calculateOverallScore(results) {
  if (results.length === 0) return 100;

  const totalScore = results.reduce((sum, r) => sum + r.complianceScore, 0);
  return totalScore / results.length;
}`;

    // 4. Create Lambda function
    const complianceFunction = new aws.lambda.Function(
      `compliance-checker-${environmentSuffix}`,
      {
        runtime: aws.lambda.Runtime.NodeJS18dX,
        role: lambdaRole.arn,
        handler: 'index.handler',
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(lambdaCode),
        }),
        timeout: 300, // 5 minutes
        memorySize: 512,
        environment: {
          variables: {
            COMPLIANCE_THRESHOLD: complianceThreshold.toString(),
            MIN_REQUIRED_TAGS: minRequiredTags.toString(),
            SNS_TOPIC_ARN: complianceTopic.arn,
          },
        },
        tags: {
          ...tags,
          Name: `compliance-checker-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, dependsOn: [lambdaPolicy, lambdaBasicPolicy] }
    );

    // 5. Create EventBridge rule for scheduling (every 6 hours)
    const scheduleRule = new aws.cloudwatch.EventRule(
      `compliance-schedule-${environmentSuffix}`,
      {
        description: 'Trigger compliance check every 6 hours',
        scheduleExpression: 'rate(6 hours)',
        tags: {
          ...tags,
          Name: `compliance-schedule-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create EventBridge target
    new aws.cloudwatch.EventTarget(
      `compliance-schedule-target-${environmentSuffix}`,
      {
        rule: scheduleRule.name,
        arn: complianceFunction.arn,
      },
      { parent: this }
    );

    // Grant EventBridge permission to invoke Lambda
    new aws.lambda.Permission(
      `compliance-eventbridge-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: complianceFunction.name,
        principal: 'events.amazonaws.com',
        sourceArn: scheduleRule.arn,
      },
      { parent: this }
    );

    // 6. Create CloudWatch Dashboard
    const dashboardBody = pulumi.all([region.name]).apply(([regionName]) =>
      JSON.stringify({
        widgets: [
          {
            type: 'metric',
            properties: {
              metrics: [
                [
                  'InfrastructureCompliance',
                  'ComplianceScore',
                  { stat: 'Average' },
                ],
              ],
              view: 'timeSeries',
              stacked: false,
              region: regionName,
              title: 'Overall Compliance Score',
              period: 300,
              yAxis: {
                left: {
                  min: 0,
                  max: 100,
                },
              },
            },
          },
          {
            type: 'metric',
            properties: {
              metrics: [
                [
                  'InfrastructureCompliance',
                  'ComplianceScore',
                  { stat: 'Average', label: 'By Instance Type' },
                ],
              ],
              view: 'singleValue',
              region: regionName,
              title: 'Current Compliance Score',
              period: 300,
            },
          },
          {
            type: 'log',
            properties: {
              query: pulumi.interpolate`SOURCE '/aws/lambda/${complianceFunction.name}'\n| fields @timestamp, @message\n| sort @timestamp desc\n| limit 20`,
              region: regionName,
              title: 'Recent Lambda Executions',
            },
          },
        ],
      })
    );

    const complianceDashboard = new aws.cloudwatch.Dashboard(
      `compliance-dashboard-${environmentSuffix}`,
      {
        dashboardName: `infrastructure-compliance-${environmentSuffix}`,
        dashboardBody: dashboardBody,
      },
      { parent: this }
    );

    // 7. Create CloudWatch Alarm for compliance score threshold
    new aws.cloudwatch.MetricAlarm(
      `compliance-alarm-${environmentSuffix}`,
      {
        name: `compliance-score-low-${environmentSuffix}`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 1,
        metricName: 'ComplianceScore',
        namespace: 'InfrastructureCompliance',
        period: 300,
        statistic: 'Average',
        threshold: complianceThreshold,
        treatMissingData: 'notBreaching',
        alarmDescription: `Alert when compliance score drops below ${complianceThreshold}%`,
        alarmActions: [complianceTopic.arn],
        tags: {
          ...tags,
          Name: `compliance-alarm-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Generate dashboard URL
    this.dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=${region.name}#dashboards:name=${complianceDashboard.dashboardName}`;
    this.lambdaFunctionArn = complianceFunction.arn;
    this.snsTopicArn = complianceTopic.arn;
    this.complianceMetricName = pulumi.output(
      'InfrastructureCompliance/ComplianceScore'
    );

    // Register outputs
    this.registerOutputs({
      lambdaFunctionArn: this.lambdaFunctionArn,
      snsTopicArn: this.snsTopicArn,
      dashboardUrl: this.dashboardUrl,
      complianceMetricName: this.complianceMetricName,
      dashboardName: complianceDashboard.dashboardName,
    });
  }
}
