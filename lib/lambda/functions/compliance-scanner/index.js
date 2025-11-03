// AWS SDK v3 modular imports
const { EC2Client, DescribeInstancesCommand, DescribeSecurityGroupsCommand } = require('@aws-sdk/client-ec2');
const { S3Client, ListBucketsCommand, GetBucketEncryptionCommand, GetBucketTaggingCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { LambdaClient, ListFunctionsCommand, ListTagsCommand } = require('@aws-sdk/client-lambda');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');

// Input validation
if (!process.env.REQUIRED_TAGS) {
  throw new Error('REQUIRED_TAGS environment variable is required');
}
if (!process.env.COMPLIANCE_BUCKET) {
  throw new Error('COMPLIANCE_BUCKET environment variable is required');
}
if (!process.env.SNS_TOPIC_ARN) {
  throw new Error('SNS_TOPIC_ARN environment variable is required');
}
if (!process.env.METRICS_NAMESPACE) {
  throw new Error('METRICS_NAMESPACE environment variable is required');
}

const REQUIRED_TAGS = process.env.REQUIRED_TAGS.split(',');
const COMPLIANCE_BUCKET = process.env.COMPLIANCE_BUCKET;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const METRICS_NAMESPACE = process.env.METRICS_NAMESPACE;

// Initialize AWS SDK v3 clients
const ec2Client = new EC2Client({});
const s3Client = new S3Client({});
const lambdaClient = new LambdaClient({});
const snsClient = new SNSClient({});
const cloudwatchClient = new CloudWatchClient({});

exports.handler = async (event) => {
  console.log('Starting compliance scan...');

  const violations = {
    unencryptedS3Buckets: [],
    missingTags: [],
    insecureEc2Instances: [],
  };

  try {
    // Scan EC2 instances with pagination
    let nextToken;
    do {
      const ec2Response = await ec2Client.send(new DescribeInstancesCommand({
        NextToken: nextToken,
      }));

      for (const reservation of ec2Response.Reservations || []) {
        for (const instance of reservation.Instances) {
          // Check tags
          const tags = instance.Tags || [];
          const missingTags = REQUIRED_TAGS.filter(
            requiredTag => !tags.some(tag => tag.Key === requiredTag)
          );

          if (missingTags.length > 0) {
            violations.missingTags.push({
              resourceType: 'EC2',
              resourceId: instance.InstanceId,
              missingTags: missingTags,
            });
          }

          // Check security groups
          if (instance.SecurityGroups && instance.SecurityGroups.length > 0) {
            const sgResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
              GroupIds: instance.SecurityGroups.map(sg => sg.GroupId),
            }));

            for (const sg of sgResponse.SecurityGroups || []) {
              const hasOpenIngress = sg.IpPermissions?.some(
                perm => perm.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')
              );

              if (hasOpenIngress) {
                violations.insecureEc2Instances.push({
                  instanceId: instance.InstanceId,
                  securityGroup: sg.GroupId,
                  issue: 'Security group allows ingress from 0.0.0.0/0',
                });
              }
            }
          }
        }
      }

      nextToken = ec2Response.NextToken;
    } while (nextToken);

    // Scan S3 buckets with pagination
    let s3NextToken;
    const allBuckets = [];
    do {
      const bucketsResponse = await s3Client.send(new ListBucketsCommand({
        ContinuationToken: s3NextToken,
      }));

      if (bucketsResponse.Buckets) {
        allBuckets.push(...bucketsResponse.Buckets);
      }

      s3NextToken = bucketsResponse.ContinuationToken;
    } while (s3NextToken);

    for (const bucket of allBuckets) {
      try {
        await s3Client.send(new GetBucketEncryptionCommand({ Bucket: bucket.Name }));
      } catch (error) {
        if (error.name === 'ServerSideEncryptionConfigurationNotFoundError') {
          violations.unencryptedS3Buckets.push(bucket.Name);
        }
      }

      // Check bucket tags
      try {
        const taggingResponse = await s3Client.send(new GetBucketTaggingCommand({ Bucket: bucket.Name }));
        const tags = taggingResponse.TagSet || [];
        const missingTags = REQUIRED_TAGS.filter(
          requiredTag => !tags.some(tag => tag.Key === requiredTag)
        );

        if (missingTags.length > 0) {
          violations.missingTags.push({
            resourceType: 'S3',
            resourceId: bucket.Name,
            missingTags: missingTags,
          });
        }
      } catch (error) {
        console.log(`No tags for bucket ${bucket.Name}`);
      }
    }

    // Scan Lambda functions with pagination
    let lambdaNextToken;
    do {
      const functionsResponse = await lambdaClient.send(new ListFunctionsCommand({
        Marker: lambdaNextToken,
      }));

      for (const func of functionsResponse.Functions || []) {
        const tagsResponse = await lambdaClient.send(new ListTagsCommand({ Resource: func.FunctionArn }));
        const tagKeys = Object.keys(tagsResponse.Tags || {});
        const missingTags = REQUIRED_TAGS.filter(
          requiredTag => !tagKeys.includes(requiredTag)
        );

        if (missingTags.length > 0) {
          violations.missingTags.push({
            resourceType: 'Lambda',
            resourceId: func.FunctionName,
            missingTags: missingTags,
          });
        }
      }

      lambdaNextToken = functionsResponse.NextMarker;
    } while (lambdaNextToken);

    // Store results in S3
    const timestamp = new Date().toISOString();
    const resultKey = `compliance-scans/${timestamp}.json`;
    await s3Client.send(new PutObjectCommand({
      Bucket: COMPLIANCE_BUCKET,
      Key: resultKey,
      Body: JSON.stringify(violations, null, 2),
      ContentType: 'application/json',
    }));

    // Publish CloudWatch metrics
    await cloudwatchClient.send(new PutMetricDataCommand({
      Namespace: METRICS_NAMESPACE,
      MetricData: [
        {
          MetricName: 'UnencryptedS3Buckets',
          Value: violations.unencryptedS3Buckets.length,
          Unit: 'Count',
        },
        {
          MetricName: 'MissingRequiredTags',
          Value: violations.missingTags.length,
          Unit: 'Count',
        },
        {
          MetricName: 'InsecureEC2Instances',
          Value: violations.insecureEc2Instances.length,
          Unit: 'Count',
        },
      ],
    }));

    // Send SNS notification if violations found
    const totalViolations =
      violations.unencryptedS3Buckets.length +
      violations.missingTags.length +
      violations.insecureEc2Instances.length;

    if (totalViolations > 0) {
      await snsClient.send(new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Subject: 'Compliance Violations Detected',
        Message: `Compliance scan completed at ${timestamp}\n\nViolations found:\n` +
          `- Unencrypted S3 buckets: ${violations.unencryptedS3Buckets.length}\n` +
          `- Resources with missing tags: ${violations.missingTags.length}\n` +
          `- Insecure EC2 instances: ${violations.insecureEc2Instances.length}\n\n` +
          `Details stored in s3://${COMPLIANCE_BUCKET}/${resultKey}`,
      }));
    }

    console.log(`Compliance scan completed. Total violations: ${totalViolations}`);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Compliance scan completed',
        violations: totalViolations,
      }),
    };
  } catch (error) {
    console.error('Error during compliance scan:', error);
    throw error;
  }
};
