const { EC2Client, DescribeInstancesCommand, DescribeSecurityGroupsCommand } = require('@aws-sdk/client-ec2');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const {
  CloudWatchClient,
  PutMetricDataCommand,
} = require('@aws-sdk/client-cloudwatch');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

// SDK clients auto-detect region from Lambda environment
const ec2Client = new EC2Client({});
const s3Client = new S3Client({});
const cloudwatchClient = new CloudWatchClient({});
const snsClient = new SNSClient({});

const REQUIRED_TAGS = process.env.REQUIRED_TAGS.split(',');
const BUCKET_NAME = process.env.BUCKET_NAME;
const TOPIC_ARN = process.env.TOPIC_ARN;

exports.handler = async (event) => {
  console.log('Starting compliance scan...');

  try {
    // Fetch all EC2 instances
    const instances = await getAllInstances();
    console.log(`Found ${instances.length} EC2 instances`);

    if (instances.length === 0) {
      console.log('No EC2 instances found to scan');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No instances to scan' }),
      };
    }

    // Check compliance for each instance
    const results = await Promise.all(
      instances.map(async (instance) => await checkInstanceCompliance(instance))
    );

    const compliantCount = results.filter((r) => r.compliant).length;
    const nonCompliantCount = results.length - compliantCount;
    const compliancePercentage = (compliantCount / results.length) * 100;

    console.log(
      `Compliance: ${compliantCount}/${results.length} (${compliancePercentage.toFixed(2)}%)`
    );

    // Store results in S3
    const timestamp = new Date().toISOString();
    const scanResult = {
      timestamp,
      totalInstances: results.length,
      compliantInstances: compliantCount,
      nonCompliantInstances: nonCompliantCount,
      compliancePercentage: compliancePercentage.toFixed(2),
      results,
    };

    await storeResults(scanResult, timestamp);

    // Publish CloudWatch metrics
    await publishMetrics(compliantCount, nonCompliantCount, compliancePercentage);

    // Send alert if there are non-compliant instances
    if (nonCompliantCount > 0) {
      await sendAlert(scanResult);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Compliance scan completed',
        compliancePercentage: compliancePercentage.toFixed(2),
        compliantInstances: compliantCount,
        nonCompliantInstances: nonCompliantCount,
      }),
    };
  } catch (error) {
    console.error('Error during compliance scan:', error);
    throw error;
  }
};

async function getAllInstances() {
  const instances = [];
  let nextToken = undefined;

  do {
    const command = new DescribeInstancesCommand({
      NextToken: nextToken,
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

async function checkInstanceCompliance(instance) {
  const instanceId = instance.InstanceId;
  const tags = instance.Tags || [];
  const tagMap = {};
  const violations = [];

  tags.forEach((tag) => {
    tagMap[tag.Key] = tag.Value;
  });

  // Check for missing tags
  const missingTags = [];
  for (const requiredTag of REQUIRED_TAGS) {
    if (!tagMap[requiredTag]) {
      missingTags.push(requiredTag);
    }
  }

  if (missingTags.length > 0) {
    violations.push(`Missing required tags: ${missingTags.join(', ')}`);
  }

  // Check security groups for overly permissive rules
  const securityGroupIds = instance.SecurityGroups?.map(sg => sg.GroupId) || [];
  if (securityGroupIds.length > 0) {
    try {
      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: securityGroupIds,
      });
      const sgResponse = await ec2Client.send(sgCommand);

      for (const sg of sgResponse.SecurityGroups || []) {
        for (const rule of sg.IpPermissions || []) {
          // Check for 0.0.0.0/0 (open to world)
          const hasOpenAccess = rule.IpRanges?.some(
            range => range.CidrIp === '0.0.0.0/0'
          );

          if (hasOpenAccess) {
            const fromPort = rule.FromPort !== undefined ? rule.FromPort : 'all';
            const toPort = rule.ToPort !== undefined ? rule.ToPort : 'all';
            violations.push(
              `Security group ${sg.GroupId} has overly permissive rule: 0.0.0.0/0 on ports ${fromPort}-${toPort}`
            );
          }
        }
      }
    } catch (error) {
      console.error(`Error checking security groups for ${instanceId}:`, error);
    }
  }

  return {
    instanceId,
    compliant: violations.length === 0,
    missingTags,
    securityGroupViolations: violations.filter(v => v.includes('Security group')),
    allViolations: violations,
    existingTags: tagMap,
  };
}

async function storeResults(scanResult, timestamp) {
  const key = `scans/${timestamp.split('T')[0]}/${timestamp}.json`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: JSON.stringify(scanResult, null, 2),
    ContentType: 'application/json',
  });

  await s3Client.send(command);
  console.log(`Stored results to s3://${BUCKET_NAME}/${key}`);
}

async function publishMetrics(
  compliantCount,
  nonCompliantCount,
  compliancePercentage
) {
  const command = new PutMetricDataCommand({
    Namespace: 'EC2Compliance',
    MetricData: [
      {
        MetricName: 'CompliancePercentage',
        Value: compliancePercentage,
        Unit: 'Percent',
        Timestamp: new Date(),
      },
      {
        MetricName: 'CompliantInstances',
        Value: compliantCount,
        Unit: 'Count',
        Timestamp: new Date(),
      },
      {
        MetricName: 'NonCompliantInstances',
        Value: nonCompliantCount,
        Unit: 'Count',
        Timestamp: new Date(),
      },
    ],
  });

  await cloudwatchClient.send(command);
  console.log('Published CloudWatch metrics');
}

async function sendAlert(scanResult) {
  const nonCompliantInstances = scanResult.results
    .filter((r) => !r.compliant)
    .map((r) => {
      const violations = r.allViolations || [`Missing tags: ${r.missingTags.join(', ')}`];
      return `  - ${r.instanceId}:\n    ${violations.join('\n    ')}`;
    })
    .join('\n');

  const message = `EC2 Compliance Alert

Compliance scan completed at ${scanResult.timestamp}

Summary:
- Total Instances: ${scanResult.totalInstances}
- Compliant: ${scanResult.compliantInstances}
- Non-Compliant: ${scanResult.nonCompliantInstances}
- Compliance Rate: ${scanResult.compliancePercentage}%

Non-Compliant Instances:
${nonCompliantInstances}

Please review and remediate the violations.`;

  const command = new PublishCommand({
    TopicArn: TOPIC_ARN,
    Subject: `EC2 Compliance Alert - ${scanResult.nonCompliantInstances} Non-Compliant Instances`,
    Message: message,
  });

  await snsClient.send(command);
  console.log('Sent SNS alert');
}
