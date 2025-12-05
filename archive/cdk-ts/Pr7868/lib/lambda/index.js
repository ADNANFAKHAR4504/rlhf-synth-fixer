const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');
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
    const results = instances.map((instance) =>
      checkInstanceCompliance(instance)
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

function checkInstanceCompliance(instance) {
  const instanceId = instance.InstanceId;
  const tags = instance.Tags || [];
  const tagMap = {};

  tags.forEach((tag) => {
    tagMap[tag.Key] = tag.Value;
  });

  const missingTags = [];
  for (const requiredTag of REQUIRED_TAGS) {
    if (!tagMap[requiredTag]) {
      missingTags.push(requiredTag);
    }
  }

  return {
    instanceId,
    compliant: missingTags.length === 0,
    missingTags,
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
    .map((r) => `  - ${r.instanceId}: Missing tags [${r.missingTags.join(', ')}]`)
    .join('\\n');

  const message = `EC2 Compliance Alert

Compliance scan completed at ${scanResult.timestamp}

Summary:
- Total Instances: ${scanResult.totalInstances}
- Compliant: ${scanResult.compliantInstances}
- Non-Compliant: ${scanResult.nonCompliantInstances}
- Compliance Rate: ${scanResult.compliancePercentage}%

Non-Compliant Instances:
${nonCompliantInstances}

Please review and remediate the missing tags.`;

  const command = new PublishCommand({
    TopicArn: TOPIC_ARN,
    Subject: `EC2 Compliance Alert - ${scanResult.nonCompliantInstances} Non-Compliant Instances`,
    Message: message,
  });

  await snsClient.send(command);
  console.log('Sent SNS alert');
}
