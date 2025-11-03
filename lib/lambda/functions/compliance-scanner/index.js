const AWS = require('aws-sdk');
const ec2 = new AWS.EC2();
const s3 = new AWS.S3();
const lambda = new AWS.Lambda();
const sns = new AWS.SNS();
const cloudwatch = new AWS.CloudWatch();

const REQUIRED_TAGS = process.env.REQUIRED_TAGS.split(',');
const COMPLIANCE_BUCKET = process.env.COMPLIANCE_BUCKET;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const METRICS_NAMESPACE = process.env.METRICS_NAMESPACE;

exports.handler = async (event) => {
  console.log('Starting compliance scan...');

  const violations = {
    unencryptedS3Buckets: [],
    missingTags: [],
    insecureEc2Instances: [],
  };

  try {
    // Scan EC2 instances
    const ec2Instances = await ec2.describeInstances().promise();
    for (const reservation of ec2Instances.Reservations) {
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
        const securityGroups = await ec2.describeSecurityGroups({
          GroupIds: instance.SecurityGroups.map(sg => sg.GroupId),
        }).promise();

        for (const sg of securityGroups.SecurityGroups) {
          const hasOpenIngress = sg.IpPermissions.some(
            perm => perm.IpRanges.some(range => range.CidrIp === '0.0.0.0/0')
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

    // Scan S3 buckets
    const buckets = await s3.listBuckets().promise();
    for (const bucket of buckets.Buckets) {
      try {
        await s3.getBucketEncryption({ Bucket: bucket.Name }).promise();
      } catch (error) {
        if (error.code === 'ServerSideEncryptionConfigurationNotFoundError') {
          violations.unencryptedS3Buckets.push(bucket.Name);
        }
      }

      // Check bucket tags
      try {
        const tagging = await s3.getBucketTagging({ Bucket: bucket.Name }).promise();
        const tags = tagging.TagSet || [];
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

    // Scan Lambda functions
    const functions = await lambda.listFunctions().promise();
    for (const func of functions.Functions) {
      const tags = await lambda.listTags({ Resource: func.FunctionArn }).promise();
      const tagKeys = Object.keys(tags.Tags || {});
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

    // Store results in S3
    const timestamp = new Date().toISOString();
    const resultKey = `compliance-scans/${timestamp}.json`;
    await s3.putObject({
      Bucket: COMPLIANCE_BUCKET,
      Key: resultKey,
      Body: JSON.stringify(violations, null, 2),
      ContentType: 'application/json',
    }).promise();

    // Publish CloudWatch metrics
    await cloudwatch.putMetricData({
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
    }).promise();

    // Send SNS notification if violations found
    const totalViolations =
      violations.unencryptedS3Buckets.length +
      violations.missingTags.length +
      violations.insecureEc2Instances.length;

    if (totalViolations > 0) {
      await sns.publish({
        TopicArn: SNS_TOPIC_ARN,
        Subject: 'Compliance Violations Detected',
        Message: `Compliance scan completed at ${timestamp}\n\nViolations found:\n` +
          `- Unencrypted S3 buckets: ${violations.unencryptedS3Buckets.length}\n` +
          `- Resources with missing tags: ${violations.missingTags.length}\n` +
          `- Insecure EC2 instances: ${violations.insecureEc2Instances.length}\n\n` +
          `Details stored in s3://${COMPLIANCE_BUCKET}/${resultKey}`,
      }).promise();
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
