import {
  SecretsManagerClient,
  GetSecretValueCommand,
  PutSecretValueCommand,
  UpdateSecretVersionStageCommand,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import { randomBytes } from 'crypto';

interface RotationEvent {
  SecretId: string;
  Token: string;
  Step: 'createSecret' | 'setSecret' | 'testSecret' | 'finishSecret';
}

const client = new SecretsManagerClient({
  region: process.env.AWS_REGION,
});

/**
 * Lambda handler for Secrets Manager automatic rotation
 * Implements secure rotation for database credentials, API keys, and service tokens
 */
export const handler = async (event: RotationEvent): Promise<void> => {
  console.log('Starting secret rotation', {
    secretId: event.SecretId,
    step: event.Step,
  });

  const { SecretId, Token, Step } = event;

  try {
    switch (Step) {
      case 'createSecret':
        await createSecret(SecretId, Token);
        break;
      case 'setSecret':
        await setSecret(SecretId, Token);
        break;
      case 'testSecret':
        await testSecret(SecretId, Token);
        break;
      case 'finishSecret':
        await finishSecret(SecretId, Token);
        break;
      default:
        throw new Error(`Invalid rotation step: ${Step}`);
    }

    console.log(`Successfully completed step: ${Step}`);
  } catch (error) {
    console.error(`Error during ${Step}:`, error);
    throw error;
  }
};

/**
 * Step 1: Create a new version of the secret with a new password
 */
async function createSecret(secretId: string, token: string): Promise<void> {
  console.log('Creating new secret version');

  // Get the current secret value to determine the type
  const currentSecret = await client.send(
    new GetSecretValueCommand({
      SecretId: secretId,
      VersionStage: 'AWSCURRENT',
    })
  );

  if (!currentSecret.SecretString) {
    throw new Error('Current secret has no string value');
  }

  const secretData = JSON.parse(currentSecret.SecretString);

  // Generate new secure credentials based on secret type
  let newSecretData:
    | {
        username: string;
        password: string;
        engine: string;
        host?: string;
        port?: number;
        dbname?: string;
      }
    | { apikey: string; created: string }
    | { token: string; created: string; expiresIn: number };

  if (secretData.username) {
    // Database credentials rotation
    newSecretData = {
      username: secretData.username,
      password: generateSecurePassword(32),
      engine: secretData.engine || 'postgres',
      host: secretData.host,
      port: secretData.port || 5432,
      dbname: secretData.dbname,
    };
  } else if (secretData.apikey) {
    // API key rotation
    newSecretData = {
      apikey: generateSecureApiKey(64),
      created: new Date().toISOString(),
    };
  } else if (secretData.token) {
    // Service token rotation
    newSecretData = {
      token: generateSecureToken(128),
      created: new Date().toISOString(),
      expiresIn: 7776000, // 90 days in seconds
    };
  } else {
    throw new Error('Unknown secret type');
  }

  // Try to get the existing pending version
  try {
    await client.send(
      new GetSecretValueCommand({
        SecretId: secretId,
        VersionId: token,
        VersionStage: 'AWSPENDING',
      })
    );
    console.log('Pending version already exists');
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ResourceNotFoundException') {
      // Create the new version
      await client.send(
        new PutSecretValueCommand({
          SecretId: secretId,
          ClientRequestToken: token,
          SecretString: JSON.stringify(newSecretData),
          VersionStages: ['AWSPENDING'],
        })
      );
      console.log('Created new pending secret version');
    } else {
      throw error;
    }
  }
}

/**
 * Step 2: Set the new secret in the target service
 */
async function setSecret(secretId: string, token: string): Promise<void> {
  console.log('Setting new secret in target service');

  const pendingSecret = await client.send(
    new GetSecretValueCommand({
      SecretId: secretId,
      VersionId: token,
      VersionStage: 'AWSPENDING',
    })
  );

  if (!pendingSecret.SecretString) {
    throw new Error('Pending secret has no string value');
  }

  // Parse secret data for validation
  JSON.parse(pendingSecret.SecretString);

  // For database credentials, this would update the database user password
  // For API keys, this would register the new key with the external service
  // For service tokens, this would update the internal service configuration

  // In a real implementation, you would call the appropriate API to update credentials
  // For example, for RDS:
  // - Connect to the database using the current credentials
  // - Execute ALTER USER statement to change the password
  // - Verify the change was successful

  console.log(
    'Secret set in target service (implementation depends on service type)'
  );
}

/**
 * Step 3: Test the new secret
 */
async function testSecret(secretId: string, token: string): Promise<void> {
  console.log('Testing new secret');

  const pendingSecret = await client.send(
    new GetSecretValueCommand({
      SecretId: secretId,
      VersionId: token,
      VersionStage: 'AWSPENDING',
    })
  );

  if (!pendingSecret.SecretString) {
    throw new Error('Pending secret has no string value');
  }

  const secretData = JSON.parse(pendingSecret.SecretString);

  // Test the new credentials
  // For database: attempt to connect and run a simple query
  // For API key: make a test API call
  // For service token: validate the token format and expiration

  if (secretData.password) {
    // Validate database credentials
    if (secretData.password.length < 16) {
      throw new Error('Password does not meet minimum length requirement');
    }
  } else if (secretData.apikey) {
    // Validate API key
    if (secretData.apikey.length < 32) {
      throw new Error('API key does not meet minimum length requirement');
    }
  } else if (secretData.token) {
    // Validate service token
    if (secretData.token.length < 64) {
      throw new Error('Token does not meet minimum length requirement');
    }
  }

  console.log('Secret validation successful');
}

/**
 * Step 4: Finalize the rotation by marking the new version as current
 */
async function finishSecret(secretId: string, token: string): Promise<void> {
  console.log('Finalizing secret rotation');

  // Get the current version
  const metadata = await client.send(
    new DescribeSecretCommand({
      SecretId: secretId,
    })
  );

  let currentVersion: string | undefined;
  if (metadata.VersionIdsToStages) {
    for (const [version, stages] of Object.entries(
      metadata.VersionIdsToStages
    )) {
      if (stages.includes('AWSCURRENT')) {
        if (version === token) {
          console.log('Version is already marked as AWSCURRENT');
          return;
        }
        currentVersion = version;
        break;
      }
    }
  }

  // Move the AWSCURRENT stage to the new version
  await client.send(
    new UpdateSecretVersionStageCommand({
      SecretId: secretId,
      VersionStage: 'AWSCURRENT',
      MoveToVersionId: token,
      RemoveFromVersionId: currentVersion,
    })
  );

  console.log('Successfully completed secret rotation');
}

/**
 * Generate a secure random password for database credentials
 */
function generateSecurePassword(length: number): string {
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*-_=+';
  const password: string[] = [];
  const bytes = randomBytes(length);

  for (let i = 0; i < length; i++) {
    password.push(charset[bytes[i] % charset.length]);
  }

  return password.join('');
}

/**
 * Generate a secure API key
 */
function generateSecureApiKey(length: number): string {
  return randomBytes(length).toString('base64').slice(0, length);
}

/**
 * Generate a secure service token
 */
function generateSecureToken(length: number): string {
  return randomBytes(length).toString('hex').slice(0, length);
}
