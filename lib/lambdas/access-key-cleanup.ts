// eslint-disable-next-line import/no-extraneous-dependencies
import { IAM, SNS } from 'aws-sdk';

const iam = new IAM();
const sns = new SNS();

interface AccessKeyInfo {
  userName: string;
  accessKeyId: string;
  createdDate: Date;
  lastUsedDate?: Date;
  ageInDays: number;
  lastUsedDays?: number;
}

export const handler = async (): Promise<void> => {
  const maxKeyAgeDays = parseInt(process.env.MAX_KEY_AGE_DAYS || '90');
  const snsTopicArn = process.env.SNS_TOPIC_ARN!;

  const now = new Date();
  const keysToDelete: AccessKeyInfo[] = [];
  const keysToWarn: AccessKeyInfo[] = [];

  try {
    // List all IAM users
    const usersResponse = await iam.listUsers().promise();

    for (const user of usersResponse.Users) {
      // List access keys for each user
      const keysResponse = await iam
        .listAccessKeys({
          UserName: user.UserName!,
        })
        .promise();

      for (const keyMetadata of keysResponse.AccessKeyMetadata) {
        const createdDate = keyMetadata.CreateDate!;
        const ageInDays = Math.floor(
          (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Get last used information
        const lastUsedResponse = await iam
          .getAccessKeyLastUsed({
            AccessKeyId: keyMetadata.AccessKeyId!,
          })
          .promise();

        const lastUsedDate = lastUsedResponse.AccessKeyLastUsed?.LastUsedDate;
        const lastUsedDays = lastUsedDate
          ? Math.floor(
              (now.getTime() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24)
            )
          : undefined;

        const keyInfo: AccessKeyInfo = {
          userName: user.UserName!,
          accessKeyId: keyMetadata.AccessKeyId!,
          createdDate,
          lastUsedDate,
          ageInDays,
          lastUsedDays,
        };

        // If key is old and hasn't been used recently
        if (ageInDays > maxKeyAgeDays) {
          if (!lastUsedDate || lastUsedDays! > maxKeyAgeDays) {
            keysToDelete.push(keyInfo);
          } else {
            keysToWarn.push(keyInfo);
          }
        }
      }
    }

    // Send warnings for old but recently used keys
    if (keysToWarn.length > 0) {
      await sns
        .publish({
          TopicArn: snsTopicArn,
          Subject: 'Warning: Old Access Keys Still In Use',
          Message: JSON.stringify(
            {
              severity: 'WARNING',
              message: `Found ${keysToWarn.length} access keys older than ${maxKeyAgeDays} days that are still being used`,
              keys: keysToWarn.map(k => ({
                userName: k.userName,
                accessKeyId: k.accessKeyId,
                ageInDays: k.ageInDays,
                lastUsedDays: k.lastUsedDays,
              })),
            },
            null,
            2
          ),
        })
        .promise();
    }

    // Delete old unused keys
    for (const keyInfo of keysToDelete) {
      await iam
        .deleteAccessKey({
          UserName: keyInfo.userName,
          AccessKeyId: keyInfo.accessKeyId,
        })
        .promise();
    }

    if (keysToDelete.length > 0) {
      await sns
        .publish({
          TopicArn: snsTopicArn,
          Subject: 'Info: Old Access Keys Deleted',
          Message: JSON.stringify(
            {
              severity: 'INFO',
              message: `Deleted ${keysToDelete.length} unused access keys older than ${maxKeyAgeDays} days`,
              keys: keysToDelete.map(k => ({
                userName: k.userName,
                accessKeyId: k.accessKeyId,
                ageInDays: k.ageInDays,
                lastUsedDays: k.lastUsedDays,
              })),
            },
            null,
            2
          ),
        })
        .promise();
    }
  } catch (error) {
    console.error('Error in access key cleanup:', error);

    await sns
      .publish({
        TopicArn: snsTopicArn,
        Subject: 'Error: Access Key Cleanup Failed',
        Message: JSON.stringify(
          {
            severity: 'ERROR',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          null,
          2
        ),
      })
      .promise();

    throw error;
  }
};
