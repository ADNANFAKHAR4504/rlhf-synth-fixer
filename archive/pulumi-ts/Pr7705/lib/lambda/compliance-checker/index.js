/**
 * S3 Compliance Checker Lambda Function
 *
 * This Lambda function analyzes S3 buckets for compliance violations:
 * - Versioning enabled
 * - Server-side encryption (AES256 or KMS)
 * - Lifecycle policies for objects older than 90 days
 * - No public access
 * - CloudWatch metrics configuration
 */
const {
  S3Client,
  ListBucketsCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketPolicyCommand,
  GetBucketTaggingCommand,
  PutBucketTaggingCommand,
  GetBucketLocationCommand,
  GetBucketMetricsConfigurationCommand,
} = require('@aws-sdk/client-s3');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const {
  CloudWatchClient,
  PutMetricDataCommand,
} = require('@aws-sdk/client-cloudwatch');
const fs = require('fs').promises;

// SDK clients
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });
const sqsClient = new SQSClient({ region: process.env.AWS_REGION });
const cloudwatchClient = new CloudWatchClient({ region: process.env.AWS_REGION });

// Constants
const LIFECYCLE_THRESHOLD = parseInt(
  process.env.LIFECYCLE_AGE_THRESHOLD || '90'
);
const TARGET_REGION = process.env.AWS_REGION || 'us-east-1';
const MAX_RETRIES = 3;

/**
 * Retry wrapper with exponential backoff
 */
async function withRetry(fn, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (isRetryableError(error) && attempt < retries - 1) {
        const backoff = Math.pow(2, attempt) * 1000;
        await sleep(backoff);
        continue;
      }
      throw error;
    }
  }
}

function isRetryableError(error) {
  return ['ThrottlingException', 'RequestTimeout', 'ServiceUnavailable'].includes(
    error.name
  );
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get bucket location
 */
async function getBucketLocation(bucketName) {
  try {
    const command = new GetBucketLocationCommand({ Bucket: bucketName });
    const response = await withRetry(() => s3Client.send(command));
    // LocationConstraint is null for us-east-1
    return response.LocationConstraint || 'us-east-1';
  } catch (error) {
    console.error(
      `Error getting location for bucket ${bucketName}: ${error.message}`
    );
    return null;
  }
}

/**
 * Check if versioning is enabled
 */
async function checkVersioning(bucketName) {
  try {
    const command = new GetBucketVersioningCommand({ Bucket: bucketName });
    const response = await withRetry(() => s3Client.send(command));
    return response.Status === 'Enabled';
  } catch (error) {
    console.error(
      `Error checking versioning for ${bucketName}: ${error.message}`
    );
    return false;
  }
}

/**
 * Check if server-side encryption is configured
 */
async function checkEncryption(bucketName) {
  try {
    const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
    const response = await withRetry(() => s3Client.send(command));
    if (response.ServerSideEncryptionConfiguration?.Rules) {
      const rule = response.ServerSideEncryptionConfiguration.Rules[0];
      const algorithm = rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
      return algorithm === 'AES256' || algorithm === 'aws:kms';
    }
    return false;
  } catch (error) {
    if (error.name === 'ServerSideEncryptionConfigurationNotFoundError') {
      return false;
    }
    console.error(
      `Error checking encryption for ${bucketName}: ${error.message}`
    );
    return false;
  }
}

/**
 * Check if lifecycle policy exists for objects older than threshold
 */
async function checkLifecycle(bucketName) {
  try {
    const command = new GetBucketLifecycleConfigurationCommand({
      Bucket: bucketName,
    });
    const response = await withRetry(() => s3Client.send(command));

    if (response.Rules && response.Rules.length > 0) {
      return response.Rules.some(rule => {
        if (rule.Status !== 'Enabled') return false;

        const hasValidTransition = rule.Transitions?.some(
          t => t.Days && t.Days <= LIFECYCLE_THRESHOLD
        );

        const hasValidExpiration =
          rule.Expiration?.Days && rule.Expiration.Days <= LIFECYCLE_THRESHOLD;

        return hasValidTransition || hasValidExpiration;
      });
    }
    return false;
  } catch (error) {
    if (error.name === 'NoSuchLifecycleConfiguration') {
      return false;
    }
    console.error(
      `Error checking lifecycle for ${bucketName}: ${error.message}`
    );
    return false;
  }
}

/**
 * Check if bucket policy allows public access
 */
async function checkPublicAccess(bucketName) {
  try {
    const command = new GetBucketPolicyCommand({ Bucket: bucketName });
    const response = await withRetry(() => s3Client.send(command));
    if (response.Policy) {
      const policy = JSON.parse(response.Policy);
      // Check for public access (Principal: "*" without conditions)
      const hasPublicAccess = policy.Statement?.some(
        stmt =>
          stmt.Effect === 'Allow' &&
          (stmt.Principal === '*' || stmt.Principal?.AWS === '*') &&
          !stmt.Condition
      );
      return !hasPublicAccess; // Return true if NO public access
    }
    return true; // No policy means no public access
  } catch (error) {
    if (error.name === 'NoSuchBucketPolicy') {
      return true; // No policy means no public access
    }
    console.error(
      `Error checking public access for ${bucketName}: ${error.message}`
    );
    return true; // Assume secure if we can't check
  }
}

/**
 * Check if CloudWatch metrics are configured
 */
async function checkCloudWatchMetrics(bucketName) {
  try {
    const command = new GetBucketMetricsConfigurationCommand({
      Bucket: bucketName,
      Id: 'EntireBucket',
    });
    const response = await withRetry(() => s3Client.send(command));
    return response.MetricsConfiguration !== undefined;
  } catch (error) {
    if (error.name === 'NoSuchConfiguration') {
      return false;
    }
    console.error(
      `Error checking CloudWatch metrics for ${bucketName}: ${error.message}`
    );
    return false;
  }
}

/**
 * Tag bucket with compliance status (idempotent)
 */
async function tagBucketIdempotent(bucketName, compliant) {
  try {
    let existingTags = [];
    try {
      const getCommand = new GetBucketTaggingCommand({ Bucket: bucketName });
      const response = await withRetry(() => s3Client.send(getCommand));
      existingTags = response.TagSet || [];
    } catch (error) {
      if (error.name !== 'NoSuchTagSet') {
        throw error;
      }
    }

    const existingStatus = existingTags.find(t => t.Key === 'compliance-status');
    const newStatus = compliant ? 'passed' : 'failed';

    // Only update if status changed
    if (existingStatus?.Value !== newStatus) {
      const filteredTags = existingTags.filter(
        t => t.Key !== 'compliance-status'
      );
      const newTags = [
        ...filteredTags,
        { Key: 'compliance-status', Value: newStatus },
      ];

      const putCommand = new PutBucketTaggingCommand({
        Bucket: bucketName,
        Tagging: { TagSet: newTags },
      });
      await withRetry(() => s3Client.send(putCommand));
    }
  } catch (error) {
    console.error(`Error tagging bucket ${bucketName}: ${error.message}`);
  }
}

/**
 * List all buckets with pagination support
 */
async function listAllBuckets() {
  const buckets = [];
  let nextToken = undefined;

  do {
    const command = new ListBucketsCommand({ ContinuationToken: nextToken });
    const response = await withRetry(() => s3Client.send(command));

    if (response.Buckets) {
      buckets.push(...response.Buckets);
    }

    nextToken = response.NextContinuationToken;
  } while (nextToken);

  return buckets;
}

/**
 * Publish metrics to CloudWatch
 */
async function publishMetrics(totalBuckets, compliantBuckets) {
  try {
    const command = new PutMetricDataCommand({
      Namespace: 'S3Compliance',
      MetricData: [
        {
          MetricName: 'TotalBuckets',
          Value: totalBuckets,
          Unit: 'Count',
          Timestamp: new Date(),
        },
        {
          MetricName: 'CompliantBuckets',
          Value: compliantBuckets,
          Unit: 'Count',
          Timestamp: new Date(),
        },
        {
          MetricName: 'NonCompliantBuckets',
          Value: totalBuckets - compliantBuckets,
          Unit: 'Count',
          Timestamp: new Date(),
        },
      ],
    });
    await cloudwatchClient.send(command);
  } catch (error) {
    console.error(`Error publishing metrics: ${error.message}`);
  }
}

/**
 * Main handler
 */
exports.handler = async event => {
  console.log('Starting S3 compliance check...');

  try {
    // List all buckets with pagination
    const allBuckets = await listAllBuckets();
    console.log(`Found ${allBuckets.length} total buckets`);

    // Filter by region
    const regionBuckets = [];
    for (const bucket of allBuckets) {
      const location = await getBucketLocation(bucket.Name);
      if (location === TARGET_REGION) {
        regionBuckets.push(bucket);
      }
    }

    console.log(`Analyzing ${regionBuckets.length} buckets in ${TARGET_REGION}`);

    const violations = [];
    let compliantCount = 0;

    // Check each bucket
    for (const bucket of regionBuckets) {
      const bucketName = bucket.Name;
      console.log(`Checking bucket: ${bucketName}`);

      const checks = await Promise.all([
        checkVersioning(bucketName),
        checkEncryption(bucketName),
        checkLifecycle(bucketName),
        checkPublicAccess(bucketName),
        checkCloudWatchMetrics(bucketName),
      ]);

      const [hasVersioning, hasEncryption, hasLifecycle, noPublicAccess, hasMetrics] =
        checks;

      const bucketViolations = [];
      if (!hasVersioning) bucketViolations.push('Versioning not enabled');
      if (!hasEncryption)
        bucketViolations.push('Server-side encryption not configured');
      if (!hasLifecycle)
        bucketViolations.push(
          `Lifecycle policy missing for objects older than ${LIFECYCLE_THRESHOLD} days`
        );
      if (!noPublicAccess)
        bucketViolations.push('Bucket policy allows public access');
      if (!hasMetrics)
        bucketViolations.push('CloudWatch metrics not configured');

      if (bucketViolations.length > 0) {
        violations.push({
          bucketName,
          bucketArn: `arn:aws:s3:::${bucketName}`,
          violations: bucketViolations,
        });

        // Tag non-compliant bucket (idempotent)
        await tagBucketIdempotent(bucketName, false);

        // Send notification for high-severity violations (3+ violations)
        if (bucketViolations.length >= 3) {
          const snsCommand = new PublishCommand({
            TopicArn: process.env.SNS_TOPIC_ARN,
            Subject: `High-Severity S3 Compliance Violation: ${bucketName}`,
            Message: JSON.stringify(
              {
                bucketName,
                violationCount: bucketViolations.length,
                violations: bucketViolations,
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          });
          await withRetry(() => snsClient.send(snsCommand));
        }
      } else {
        compliantCount++;
        await tagBucketIdempotent(bucketName, true);
      }
    }

    // Prepare compliance report
    const report = {
      totalBuckets: regionBuckets.length,
      compliantBuckets: compliantCount,
      nonCompliantBuckets: violations.length,
      violations,
      timestamp: new Date().toISOString(),
    };

    // Write JSON report to local file
    const reportJson = JSON.stringify(report, null, 2);
    await fs.writeFile('/tmp/compliance-report.json', reportJson);

    // Send report to SQS
    const sqsCommand = new SendMessageCommand({
      QueueUrl: process.env.SQS_QUEUE_URL,
      MessageBody: reportJson,
    });
    await withRetry(() => sqsClient.send(sqsCommand));

    // Publish metrics to CloudWatch
    await publishMetrics(regionBuckets.length, compliantCount);

    console.log('Compliance check completed');
    console.log(
      `Total: ${regionBuckets.length}, Compliant: ${compliantCount}, Non-compliant: ${violations.length}`
    );

    return {
      statusCode: 200,
      body: reportJson,
    };
  } catch (error) {
    console.error(`Error during compliance check: ${error.message}`);
    throw error;
  }
};
