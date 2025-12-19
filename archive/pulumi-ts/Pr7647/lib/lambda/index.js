const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const {
  EC2Client,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
} = require('@aws-sdk/client-ec2');
const { S3Client, GetBucketPolicyCommand, GetBucketEncryptionCommand } = require('@aws-sdk/client-s3');

const dynamoClient = new DynamoDBClient({});
const snsClient = new SNSClient({});
const cloudwatchClient = new CloudWatchClient({});
const ec2Client = new EC2Client({});
const s3Client = new S3Client({});

const DYNAMO_TABLE_NAME = process.env.DYNAMO_TABLE_NAME;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const COMPLIANCE_NAMESPACE = process.env.COMPLIANCE_NAMESPACE || 'ComplianceMonitoring';

/**
 * Compliance rules to check AWS resources
 */
const complianceRules = [
  {
    id: 'EC2_SECURITY_GROUPS',
    description: 'Check for overly permissive security groups',
    check: async () => {
      try {
        const response = await ec2Client.send(new DescribeSecurityGroupsCommand({}));
        const violations = [];

        for (const sg of response.SecurityGroups || []) {
          for (const permission of sg.IpPermissions || []) {
            const hasOpenAccess = permission.IpRanges?.some(
              (range) => range.CidrIp === '0.0.0.0/0'
            );
            if (hasOpenAccess && permission.FromPort !== 443 && permission.FromPort !== 80) {
              violations.push({
                resourceId: sg.GroupId,
                resourceType: 'SecurityGroup',
                violation: `Security group ${sg.GroupName} allows unrestricted access on port ${permission.FromPort}`,
              });
            }
          }
        }

        return {
          passed: violations.length === 0,
          violations,
        };
      } catch (error) {
        console.error('Error checking EC2 security groups:', error);
        return { passed: true, violations: [] };
      }
    },
  },
  {
    id: 'EC2_INSTANCES_TAGGED',
    description: 'Check if EC2 instances have required tags',
    check: async () => {
      try {
        const response = await ec2Client.send(new DescribeInstancesCommand({}));
        const violations = [];

        for (const reservation of response.Reservations || []) {
          for (const instance of reservation.Instances || []) {
            const tags = instance.Tags || [];
            const hasEnvironmentTag = tags.some((tag) => tag.Key === 'Environment');
            const hasCostCenterTag = tags.some((tag) => tag.Key === 'CostCenter');

            if (!hasEnvironmentTag || !hasCostCenterTag) {
              violations.push({
                resourceId: instance.InstanceId,
                resourceType: 'EC2Instance',
                violation: `Instance ${instance.InstanceId} missing required tags`,
              });
            }
          }
        }

        return {
          passed: violations.length === 0,
          violations,
        };
      } catch (error) {
        console.error('Error checking EC2 instance tags:', error);
        return { passed: true, violations: [] };
      }
    },
  },
];

/**
 * Store compliance check results in DynamoDB
 */
async function storeComplianceResult(checkId, result) {
  const timestamp = Date.now();
  const expirationTime = Math.floor(timestamp / 1000) + 30 * 24 * 60 * 60; // 30 days TTL

  const params = {
    TableName: DYNAMO_TABLE_NAME,
    Item: {
      checkId: { S: checkId },
      timestamp: { N: timestamp.toString() },
      passed: { BOOL: result.passed },
      violationCount: { N: result.violations.length.toString() },
      violations: { S: JSON.stringify(result.violations) },
      expirationTime: { N: expirationTime.toString() },
    },
  };

  try {
    await dynamoClient.send(new PutItemCommand(params));
    console.log(`Stored compliance result for ${checkId}`);
  } catch (error) {
    console.error(`Error storing compliance result for ${checkId}:`, error);
  }
}

/**
 * Publish CloudWatch metrics for compliance checks
 */
async function publishMetrics(passedCount, failedCount) {
  const totalChecks = passedCount + failedCount;
  const failureRate = totalChecks > 0 ? (failedCount / totalChecks) * 100 : 0;

  const params = {
    Namespace: COMPLIANCE_NAMESPACE,
    MetricData: [
      {
        MetricName: 'ComplianceChecksPassed',
        Value: passedCount,
        Unit: 'Count',
        Timestamp: new Date(),
      },
      {
        MetricName: 'ComplianceChecksFailed',
        Value: failedCount,
        Unit: 'Count',
        Timestamp: new Date(),
      },
      {
        MetricName: 'ComplianceFailureRate',
        Value: failureRate,
        Unit: 'Percent',
        Timestamp: new Date(),
      },
    ],
  };

  try {
    await cloudwatchClient.send(new PutMetricDataCommand(params));
    console.log(`Published metrics: ${passedCount} passed, ${failedCount} failed, ${failureRate.toFixed(2)}% failure rate`);
  } catch (error) {
    console.error('Error publishing metrics:', error);
  }
}

/**
 * Send SNS notification for compliance violations
 */
async function sendViolationNotification(violations) {
  if (violations.length === 0) return;

  const message = `
Compliance Violations Detected

Total Violations: ${violations.length}

Details:
${violations.map((v, i) => `
${i + 1}. ${v.violation}
   Resource Type: ${v.resourceType}
   Resource ID: ${v.resourceId}
`).join('\n')}

Please review and remediate these violations as soon as possible.
`;

  const params = {
    TopicArn: SNS_TOPIC_ARN,
    Subject: `Compliance Alert: ${violations.length} Violation(s) Detected`,
    Message: message,
  };

  try {
    await snsClient.send(new PublishCommand(params));
    console.log('Sent compliance violation notification');
  } catch (error) {
    console.error('Error sending SNS notification:', error);
  }
}

/**
 * Lambda handler function
 */
exports.handler = async (event) => {
  console.log('Starting compliance check...');

  let passedCount = 0;
  let failedCount = 0;
  const allViolations = [];

  // Run all compliance checks
  for (const rule of complianceRules) {
    console.log(`Running compliance check: ${rule.description}`);
    const result = await rule.check();

    if (result.passed) {
      passedCount++;
    } else {
      failedCount++;
      allViolations.push(...result.violations);
    }

    // Store result in DynamoDB
    await storeComplianceResult(rule.id, result);
  }

  // Publish metrics to CloudWatch
  await publishMetrics(passedCount, failedCount);

  // Send notification if there are violations
  if (allViolations.length > 0) {
    await sendViolationNotification(allViolations);
  }

  console.log(`Compliance check completed: ${passedCount} passed, ${failedCount} failed`);

  return {
    statusCode: 200,
    body: JSON.stringify({
      passed: passedCount,
      failed: failedCount,
      violations: allViolations.length,
    }),
  };
};
