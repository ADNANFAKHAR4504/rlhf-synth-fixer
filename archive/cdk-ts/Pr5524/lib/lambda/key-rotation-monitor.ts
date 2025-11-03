/* eslint-disable import/no-extraneous-dependencies */
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
/* eslint-enable import/no-extraneous-dependencies */

const kmsClient = new KMSClient({});
const snsClient = new SNSClient({});

interface KeyRotationStatus {
  key_id: string;
  alias: string;
  rotation_enabled: boolean;
  next_rotation?: string;
  days_until_rotation?: number;
  warning?: string;
  error?: string;
}

export const handler = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event: any
): Promise<{ statusCode: number; body: string }> => {
  console.log(
    'Key Rotation Monitor Lambda triggered',
    JSON.stringify(event, null, 2)
  );

  try {
    const kmsKeysJson = process.env.KMS_KEYS || '[]';
    const kmsKeys: string[] = JSON.parse(kmsKeysJson);
    const rotationWarningDays = parseInt(
      process.env.ROTATION_WARNING_DAYS || '30',
      10
    );

    const rotationStatus: KeyRotationStatus[] = [];
    const keysNeedingAttention: KeyRotationStatus[] = [];

    for (const keyId of kmsKeys) {
      try {
        // Get key metadata
        const describeCommand = new DescribeKeyCommand({ KeyId: keyId });
        const keyMetadata = await kmsClient.send(describeCommand);
        const keyDetails = keyMetadata.KeyMetadata;

        if (!keyDetails) {
          throw new Error(`No metadata found for key ${keyId}`);
        }

        // Get rotation status
        const rotationCommand = new GetKeyRotationStatusCommand({
          KeyId: keyId,
        });
        const rotationResponse = await kmsClient.send(rotationCommand);
        const rotationEnabled = rotationResponse.KeyRotationEnabled || false;

        // Calculate next rotation date
        const creationDate = keyDetails.CreationDate;
        if (!creationDate) {
          throw new Error(`No creation date for key ${keyId}`);
        }

        let status: KeyRotationStatus;

        if (rotationEnabled) {
          // AWS rotates keys annually (365 days from creation)
          const nextRotation = new Date(creationDate);
          nextRotation.setFullYear(new Date().getFullYear() + 1);

          const now = new Date();
          const daysUntilRotation = Math.floor(
            (nextRotation.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          const keyAlias = await getKeyAlias(keyId);

          status = {
            key_id: keyId,
            alias: keyAlias,
            rotation_enabled: true,
            next_rotation: nextRotation.toISOString(),
            days_until_rotation: daysUntilRotation,
          };

          if (daysUntilRotation <= rotationWarningDays) {
            keysNeedingAttention.push(status);
            console.warn(
              `Key ${keyId} will rotate in ${daysUntilRotation} days`
            );
          }
        } else {
          const keyAlias = await getKeyAlias(keyId);

          status = {
            key_id: keyId,
            alias: keyAlias,
            rotation_enabled: false,
            warning: 'Rotation is disabled!',
          };
          keysNeedingAttention.push(status);
          console.error(`Key ${keyId} does not have rotation enabled!`);
        }

        rotationStatus.push(status);
      } catch (error) {
        console.error(`Failed to check key ${keyId}:`, error);
        rotationStatus.push({
          key_id: keyId,
          alias: 'N/A',
          rotation_enabled: false,
          error: (error as Error).message,
        });
      }
    }

    // Send notifications if needed
    if (keysNeedingAttention.length > 0) {
      await sendRotationNotification(keysNeedingAttention);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        checked_keys: kmsKeys.length,
        keys_needing_attention: keysNeedingAttention.length,
        rotation_status: rotationStatus,
      }),
    };
  } catch (error) {
    console.error('Key rotation monitoring failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};

async function getKeyAlias(keyId: string): Promise<string> {
  try {
    const command = new ListAliasesCommand({ KeyId: keyId });
    const response = await kmsClient.send(command);
    if (response.Aliases && response.Aliases.length > 0) {
      return response.Aliases[0].AliasName || 'N/A';
    }
  } catch (error) {
    console.log(`Could not get alias for key ${keyId}:`, error);
  }
  return 'N/A';
}

async function sendRotationNotification(
  keysNeedingAttention: KeyRotationStatus[]
): Promise<void> {
  try {
    const topicArn = process.env.SNS_TOPIC_ARN;
    if (!topicArn) {
      console.log('No SNS_TOPIC_ARN configured, skipping notification');
      return;
    }

    let message = 'KMS Key Rotation Alert\n\n';
    message += `Keys requiring attention: ${keysNeedingAttention.length}\n\n`;

    for (const key of keysNeedingAttention) {
      message += `Key: ${key.alias || key.key_id}\n`;
      if (key.rotation_enabled && key.days_until_rotation !== undefined) {
        message += `  - Rotating in ${key.days_until_rotation} days\n`;
      } else if (!key.rotation_enabled) {
        message += '  - ROTATION DISABLED (Critical!)\n';
      }
      message += '\n';
    }

    const publishCommand = new PublishCommand({
      TopicArn: topicArn,
      Subject: '⚠️ KMS Key Rotation Alert',
      Message: message,
    });

    await snsClient.send(publishCommand);
    console.log('Rotation notification sent successfully');
  } catch (error) {
    console.error('Failed to send rotation notification:', error);
  }
}
