const { EC2Client, CreateTagsCommand } = require('@aws-sdk/client-ec2');
const { S3Client, PutBucketTaggingCommand, GetBucketTaggingCommand } = require('@aws-sdk/client-s3');
const { RDSClient, AddTagsToResourceCommand, ListTagsForResourceCommand } = require('@aws-sdk/client-rds');

const ec2Client = new EC2Client({ region: process.env.AWS_REGION });
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const rdsClient = new RDSClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  try {
    console.log('Config compliance change event:', JSON.stringify(event, null, 2));

    const detail = event.detail;
    const resourceType = detail.resourceType;
    const resourceId = detail.resourceId;
    const complianceType = detail.newEvaluationResult.complianceType;

    if (complianceType !== 'NON_COMPLIANT') {
      console.log('Resource is compliant, no tagging needed');
      return { statusCode: 200 };
    }

    const tags = [
      {
        Key: 'ComplianceStatus',
        Value: 'NonCompliant'
      },
      {
        Key: 'ComplianceCheckDate',
        Value: new Date().toISOString()
      }
    ];

    // Tag based on resource type
    if (resourceType === 'AWS::S3::Bucket') {
      console.log(`Tagging S3 bucket: ${resourceId}`);

      // Get existing tags
      let existingTags = [];
      try {
        const getTagsResponse = await s3Client.send(new GetBucketTaggingCommand({ Bucket: resourceId }));
        existingTags = getTagsResponse.TagSet || [];
      } catch (err) {
        console.log('No existing tags or error getting tags');
      }

      // Merge tags
      const mergedTags = [...existingTags, ...tags];

      await s3Client.send(new PutBucketTaggingCommand({
        Bucket: resourceId,
        Tagging: { TagSet: mergedTags }
      }));

    } else if (resourceType === 'AWS::RDS::DBInstance') {
      console.log(`Tagging RDS instance: ${resourceId}`);

      await rdsClient.send(new AddTagsToResourceCommand({
        ResourceName: resourceId,
        Tags: tags.map(t => ({ Key: t.Key, Value: t.Value }))
      }));

    } else if (resourceType.startsWith('AWS::EC2::')) {
      console.log(`Tagging EC2 resource: ${resourceId}`);

      await ec2Client.send(new CreateTagsCommand({
        Resources: [resourceId],
        Tags: tags
      }));
    }

    console.log(`Successfully tagged ${resourceType}: ${resourceId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Resource tagged successfully' })
    };
  } catch (error) {
    console.error('Error tagging resource:', error);
    throw error;
  }
};
