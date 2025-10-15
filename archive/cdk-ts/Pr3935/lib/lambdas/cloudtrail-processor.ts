import { S3Event } from 'aws-lambda';
// eslint-disable-next-line import/no-extraneous-dependencies
import { S3, SNS } from 'aws-sdk';
import * as zlib from 'zlib';

const s3 = new S3();
const sns = new SNS();

interface CloudTrailRecord {
  eventTime: string;
  eventName: string;
  awsRegion: string;
  userIdentity: {
    type: string;
    principalId?: string;
    arn?: string;
    accountId?: string;
    userName?: string;
  };
  errorCode?: string;
  errorMessage?: string;
}

const SUSPICIOUS_EVENTS = [
  'DeleteTrail',
  'StopLogging',
  'DeleteFlowLogs',
  'DeleteDetector',
  'DisableEbsEncryptionByDefault',
  'DeleteDBInstance',
  'ModifyDBInstance',
  'CreateAccessKey',
  'CreateUser',
  'AttachUserPolicy',
  'PutBucketPolicy',
  'PutBucketAcl',
  'CreateNetworkAclEntry',
  'AuthorizeSecurityGroupIngress',
];

export const handler = async (event: S3Event): Promise<void> => {
  const snsTopicArn = process.env.SNS_TOPIC_ARN!;

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    try {
      // Get the CloudTrail log file from S3
      const obj = await s3.getObject({ Bucket: bucket, Key: key }).promise();

      // Decompress the log file
      const unzipped = await new Promise<Buffer>((resolve, reject) => {
        zlib.gunzip(obj.Body as Buffer, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      const logData = JSON.parse(unzipped.toString());
      const records: CloudTrailRecord[] = logData.Records;

      for (const logRecord of records) {
        // Check for root account usage
        if (logRecord.userIdentity.type === 'Root') {
          await sns
            .publish({
              TopicArn: snsTopicArn,
              Subject: 'CRITICAL: Root Account Usage Detected',
              Message: JSON.stringify(
                {
                  severity: 'CRITICAL',
                  eventTime: logRecord.eventTime,
                  eventName: logRecord.eventName,
                  region: logRecord.awsRegion,
                  userIdentity: logRecord.userIdentity,
                },
                null,
                2
              ),
            })
            .promise();
        }

        // Check for suspicious events
        if (SUSPICIOUS_EVENTS.includes(logRecord.eventName)) {
          await sns
            .publish({
              TopicArn: snsTopicArn,
              Subject: `Security Alert: Suspicious Activity - ${logRecord.eventName}`,
              Message: JSON.stringify(
                {
                  severity: 'HIGH',
                  eventTime: logRecord.eventTime,
                  eventName: logRecord.eventName,
                  region: logRecord.awsRegion,
                  userIdentity: logRecord.userIdentity,
                  errorCode: logRecord.errorCode,
                },
                null,
                2
              ),
            })
            .promise();
        }

        // Check for repeated failed authentication attempts
        if (
          logRecord.errorCode === 'UnauthorizedOperation' ||
          logRecord.errorCode === 'AccessDenied'
        ) {
          // In production, you'd want to aggregate these and only alert on patterns
          console.log(
            `Failed authentication attempt: ${JSON.stringify(logRecord)}`
          );
        }
      }
    } catch (error) {
      console.error(`Error processing CloudTrail log ${key}:`, error);

      await sns
        .publish({
          TopicArn: snsTopicArn,
          Subject: 'Error: CloudTrail Log Processing Failed',
          Message: JSON.stringify(
            {
              severity: 'ERROR',
              bucket,
              key,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            null,
            2
          ),
        })
        .promise();
    }
  }
};
