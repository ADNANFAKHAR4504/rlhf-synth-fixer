/* eslint-disable import/no-extraneous-dependencies */
import {
  S3Client,
  GetObjectTaggingCommand,
  PutObjectTaggingCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
/* eslint-enable import/no-extraneous-dependencies */

const s3Client = new S3Client({});
const snsClient = new SNSClient({});

interface RequiredTags {
  [key: string]: string | string[];
}

interface KMSKeyMapping {
  [key: string]: string | undefined;
}

interface RemediationResult {
  bucket: string;
  key: string;
  actions: string[];
  status: 'SUCCESS' | 'FAILED';
  error?: string;
}

interface LambdaEvent {
  bucket?: string;
  key?: string;
  detail?: {
    bucket?: {
      name?: string;
    };
    object?: {
      key?: string;
    };
  };
}

const REQUIRED_TAGS: RequiredTags = {
  DataClassification: ['PII', 'FINANCIAL', 'OPERATIONAL', 'PUBLIC'],
  Compliance: 'PCI-DSS',
  Environment: process.env.ENVIRONMENT || 'dev',
  'iac-rlhf-amazon': 'true',
};

const KMS_KEY_MAPPING: KMSKeyMapping = {
  PII: process.env.PII_KMS_KEY_ID,
  FINANCIAL: process.env.FINANCIAL_KMS_KEY_ID,
  OPERATIONAL: process.env.OPERATIONAL_KMS_KEY_ID,
};

export const handler = async (
  event: LambdaEvent
): Promise<{ statusCode: number; body: string }> => {
  console.log(
    'S3 Remediation Lambda triggered',
    JSON.stringify(event, null, 2)
  );

  try {
    // Parse the event to extract bucket and key
    let bucketName = event.bucket || event.detail?.bucket?.name;
    let objectKey = event.key || event.detail?.object?.key;

    if (!bucketName || !objectKey) {
      // If specific object not provided, scan recent uploads
      bucketName = process.env.MONITORED_BUCKET;
      if (!bucketName) {
        throw new Error(
          'No bucket specified and MONITORED_BUCKET env var not set'
        );
      }
      const objects = await listRecentObjects(bucketName);

      const remediationResults: RemediationResult[] = [];
      for (const obj of objects) {
        const result = await remediateObject(bucketName, obj.Key!);
        remediationResults.push(result);
      }

      await sendNotification(remediationResults);

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Remediation complete',
          processed: remediationResults.length,
          results: remediationResults,
        }),
      };
    } else {
      // Process single object
      const result = await remediateObject(bucketName, objectKey);
      await sendNotification([result]);

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Remediation complete',
          processed: 1,
          results: [result],
        }),
      };
    }
  } catch (error) {
    console.error('Remediation failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};

async function listRecentObjects(
  bucketName: string,
  maxObjects: number = 100
): Promise<{ Key?: string }[]> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: maxObjects,
    });
    const response = await s3Client.send(command);
    return response.Contents || [];
  } catch (error) {
    console.error('Failed to list objects:', error);
    return [];
  }
}

async function remediateObject(
  bucketName: string,
  objectKey: string
): Promise<RemediationResult> {
  const result: RemediationResult = {
    bucket: bucketName,
    key: objectKey,
    actions: [],
    status: 'SUCCESS',
  };

  try {
    // Get current object metadata and tags
    const headCommand = new HeadObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });
    const objectMetadata = await s3Client.send(headCommand);

    let currentTags: { [key: string]: string } = {};
    try {
      const tagCommand = new GetObjectTaggingCommand({
        Bucket: bucketName,
        Key: objectKey,
      });
      const tagResponse = await s3Client.send(tagCommand);
      currentTags = Object.fromEntries(
        (tagResponse.TagSet || []).map(tag => [tag.Key, tag.Value])
      );
    } catch (error) {
      console.log('No existing tags found');
    }

    // Check and fix tags
    const tagsToAdd: { Key: string; Value: string }[] = [];
    let dataClassification = currentTags['DataClassification'];

    // Infer data classification if missing
    if (!dataClassification) {
      dataClassification = inferDataClassification(objectKey, bucketName);
      tagsToAdd.push({ Key: 'DataClassification', Value: dataClassification });
      result.actions.push(`Added DataClassification: ${dataClassification}`);
    }

    // Add missing required tags
    for (const [tagKey, tagValue] of Object.entries(REQUIRED_TAGS)) {
      if (tagKey !== 'DataClassification' && !currentTags[tagKey]) {
        if (typeof tagValue === 'string') {
          tagsToAdd.push({ Key: tagKey, Value: tagValue });
          result.actions.push(`Added tag ${tagKey}: ${tagValue}`);
        }
      }
    }

    // Apply tags if needed
    if (tagsToAdd.length > 0) {
      const allTags = [
        ...Object.entries(currentTags).map(([Key, Value]) => ({ Key, Value })),
        ...tagsToAdd,
      ];

      const putTagCommand = new PutObjectTaggingCommand({
        Bucket: bucketName,
        Key: objectKey,
        Tagging: { TagSet: allTags },
      });
      await s3Client.send(putTagCommand);
    }

    // Check and fix encryption
    const currentKmsKey = objectMetadata.SSEKMSKeyId;
    const requiredKmsKey = KMS_KEY_MAPPING[dataClassification];

    if (requiredKmsKey && currentKmsKey !== requiredKmsKey) {
      // Re-encrypt with correct KMS key
      const copyCommand = new CopyObjectCommand({
        CopySource: `${bucketName}/${objectKey}`,
        Bucket: bucketName,
        Key: objectKey,
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: requiredKmsKey,
        MetadataDirective: 'REPLACE',
        TaggingDirective: 'COPY',
      });
      await s3Client.send(copyCommand);

      result.actions.push(
        `Re-encrypted with KMS key for ${dataClassification}`
      );
    }

    console.log(
      `Remediated object: ${bucketName}/${objectKey} - Actions: ${result.actions.join(', ')}`
    );
  } catch (error) {
    console.error(`Failed to remediate ${bucketName}/${objectKey}:`, error);
    result.status = 'FAILED';
    result.error = (error as Error).message;
  }

  return result;
}

function inferDataClassification(
  objectKey: string,
  bucketName: string
): string {
  const keyLower = objectKey.toLowerCase();

  if (/ssn|social|pii|personal|customer/.test(keyLower)) {
    return 'PII';
  } else if (/payment|card|financial|transaction|billing/.test(keyLower)) {
    return 'FINANCIAL';
  } else if (/log|audit|operational|metric/.test(keyLower)) {
    return 'OPERATIONAL';
  } else {
    // Default based on bucket name
    const bucketLower = bucketName.toLowerCase();
    if (bucketLower.includes('pii')) {
      return 'PII';
    } else if (bucketLower.includes('financial')) {
      return 'FINANCIAL';
    } else {
      return 'OPERATIONAL';
    }
  }
}

async function sendNotification(results: RemediationResult[]): Promise<void> {
  try {
    const topicArn = process.env.SNS_TOPIC_ARN;
    if (!topicArn) {
      console.log('No SNS_TOPIC_ARN configured, skipping notification');
      return;
    }

    const criticalIssues = results.filter(r => r.status === 'FAILED');

    const message = {
      timestamp: new Date().toISOString(),
      total_processed: results.length,
      successful: results.filter(r => r.status === 'SUCCESS').length,
      failed: criticalIssues.length,
      critical_issues: criticalIssues.slice(0, 5), // Limit to first 5 failures
    };

    const publishCommand = new PublishCommand({
      TopicArn: topicArn,
      Subject: 'S3 Security Remediation Report',
      Message: JSON.stringify(message, null, 2),
    });

    await snsClient.send(publishCommand);
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}
