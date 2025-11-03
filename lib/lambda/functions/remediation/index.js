const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const ec2 = new AWS.EC2();
const sns = new AWS.SNS();

const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

exports.handler = async (event) => {
  console.log('Processing Security Hub finding for remediation:', JSON.stringify(event, null, 2));

  try {
    const findings = event.detail.findings || [];
    const remediatedResources = [];

    for (const finding of findings) {
      const resourceType = finding.Resources[0].Type;
      const resourceId = finding.Resources[0].Id;

      console.log(`Processing ${resourceType}: ${resourceId}`);

      if (resourceType === 'AwsS3Bucket') {
        // Remediate unencrypted S3 bucket
        const bucketName = resourceId.split(':').pop();

        try {
          await s3.putBucketEncryption({
            Bucket: bucketName,
            ServerSideEncryptionConfiguration: {
              Rules: [{
                ApplyServerSideEncryptionByDefault: {
                  SSEAlgorithm: 'AES256',
                },
              }],
            },
          }).promise();

          remediatedResources.push(`S3 bucket ${bucketName} - encryption enabled`);
        } catch (error) {
          console.error(`Failed to remediate bucket ${bucketName}:`, error);
        }
      } else if (resourceType === 'AwsEc2Instance') {
        // Remediate EC2 instance tags
        const instanceId = resourceId.split('/').pop();

        try {
          await ec2.createTags({
            Resources: [instanceId],
            Tags: [
              { Key: 'ComplianceRemediated', Value: 'true' },
              { Key: 'RemediationDate', Value: new Date().toISOString() },
            ],
          }).promise();

          remediatedResources.push(`EC2 instance ${instanceId} - compliance tags added`);
        } catch (error) {
          console.error(`Failed to remediate instance ${instanceId}:`, error);
        }
      }
    }

    // Send notification
    if (remediatedResources.length > 0) {
      await sns.publish({
        TopicArn: SNS_TOPIC_ARN,
        Subject: 'Automated Compliance Remediation Completed',
        Message: `The following resources were automatically remediated:\n\n${remediatedResources.join('\n')}`,
      }).promise();
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
