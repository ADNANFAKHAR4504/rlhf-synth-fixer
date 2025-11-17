// AWS SDK v3 modular imports
const { S3Client, PutBucketEncryptionCommand } = require('@aws-sdk/client-s3');
const { EC2Client, CreateTagsCommand } = require('@aws-sdk/client-ec2');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

// Input validation
if (!process.env.SNS_TOPIC_ARN) {
  throw new Error('SNS_TOPIC_ARN environment variable is required');
}

const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

// Initialize AWS SDK v3 clients
const s3Client = new S3Client({});
const ec2Client = new EC2Client({});
const snsClient = new SNSClient({});

exports.handler = async (event) => {
  console.log('Processing Security Hub finding for remediation:', JSON.stringify(event, null, 2));

  try {
    // Validate event structure
    if (!event || !event.detail || !event.detail.findings) {
      console.warn('Invalid event structure - no findings to process');
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Invalid event structure',
          remediatedCount: 0,
        }),
      };
    }

    const findings = event.detail.findings || [];
    const remediatedResources = [];

    for (const finding of findings) {
      // Validate finding structure
      if (!finding.Resources || finding.Resources.length === 0) {
        console.warn('Finding has no resources, skipping');
        continue;
      }

      const resourceType = finding.Resources[0].Type;
      const resourceId = finding.Resources[0].Id;

      console.log(`Processing ${resourceType}: ${resourceId}`);

      if (resourceType === 'AwsS3Bucket') {
        // Remediate unencrypted S3 bucket
        const bucketName = resourceId.split(':').pop();

        try {
          await s3Client.send(new PutBucketEncryptionCommand({
            Bucket: bucketName,
            ServerSideEncryptionConfiguration: {
              Rules: [{
                ApplyServerSideEncryptionByDefault: {
                  SSEAlgorithm: 'AES256',
                },
              }],
            },
          }));

          remediatedResources.push(`S3 bucket ${bucketName} - encryption enabled`);
        } catch (error) {
          console.error(`Failed to remediate bucket ${bucketName}:`, error);
        }
      } else if (resourceType === 'AwsEc2Instance') {
        // Remediate EC2 instance tags
        const instanceId = resourceId.split('/').pop();

        try {
          await ec2Client.send(new CreateTagsCommand({
            Resources: [instanceId],
            Tags: [
              { Key: 'ComplianceRemediated', Value: 'true' },
              { Key: 'RemediationDate', Value: new Date().toISOString() },
            ],
          }));

          remediatedResources.push(`EC2 instance ${instanceId} - compliance tags added`);
        } catch (error) {
          console.error(`Failed to remediate instance ${instanceId}:`, error);
        }
      }
    }

    // Send notification
    if (remediatedResources.length > 0) {
      await snsClient.send(new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Subject: 'Automated Compliance Remediation Completed',
        Message: `The following resources were automatically remediated:\n\n${remediatedResources.join('\n')}`,
      }));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Remediation completed',
        remediatedCount: remediatedResources.length,
      }),
    };
  } catch (error) {
    console.error('Error during remediation:', error);
    throw error;
  }
};
