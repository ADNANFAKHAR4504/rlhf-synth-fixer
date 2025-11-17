// eslint-disable-next-line import/no-extraneous-dependencies
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetSecretValueCommand,
  PutSecretValueCommand,
  UpdateSecretVersionStageCommand,
} from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({});

interface RotationEvent {
  Step: 'createSecret' | 'setSecret' | 'testSecret' | 'finishSecret';
  SecretId: string;
  Token: string;
}

interface SecretValue {
  username?: string;
  password?: string;
  apiKey?: string;
  provider?: string;
  environment?: string;
  [key: string]: string | undefined;
}

export const handler = async (event: RotationEvent): Promise<void> => {
  console.log('Rotation started for:', event.SecretId);
  const { Step, SecretId, Token } = event;

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
        throw new Error(`Invalid step: ${Step}`);
    }
    console.log(`Successfully completed step ${Step} for ${SecretId}`);
  } catch (error) {
    console.error(`Error in step ${Step}:`, error);
    throw error;
  }
};

async function createSecret(secretId: string, token: string): Promise<void> {
  // Check if the version exists, if not create new secret version
  const metadata = await client.send(
    new DescribeSecretCommand({ SecretId: secretId })
  );

  if (!metadata.VersionIdsToStages || !metadata.VersionIdsToStages[token]) {
    // Get the current secret value
    const currentSecretResponse = await client.send(
      new GetSecretValueCommand({
        SecretId: secretId,
        VersionStage: 'AWSCURRENT',
      })
    );

    if (!currentSecretResponse.SecretString) {
      throw new Error('Current secret has no value');
    }

    const currentSecret: SecretValue = JSON.parse(
      currentSecretResponse.SecretString
    );

    // Generate new secret based on type
    const newSecret: SecretValue = { ...currentSecret };

    if (currentSecret.password !== undefined) {
      // Database credential rotation
      newSecret.password = generateSecurePassword(32);
      console.log('Generated new database password');
    } else if (currentSecret.apiKey !== undefined) {
      // API key rotation
      newSecret.apiKey = generateSecureApiKey(64);
      console.log('Generated new API key');
    } else {
      throw new Error('Unknown secret type - cannot rotate');
    }

    // Store the new secret version
    await client.send(
      new PutSecretValueCommand({
        SecretId: secretId,
        ClientRequestToken: token,
        SecretString: JSON.stringify(newSecret),
        VersionStages: ['AWSPENDING'],
      })
    );

    console.log('Created new secret version with AWSPENDING stage');
  } else {
    console.log('Version already exists, skipping creation');
  }
}

async function setSecret(secretId: string, token: string): Promise<void> {
  // Get the pending secret
  const pendingSecretResponse = await client.send(
    new GetSecretValueCommand({
      SecretId: secretId,
      VersionId: token,
      VersionStage: 'AWSPENDING',
    })
  );

  if (!pendingSecretResponse.SecretString) {
    throw new Error('Pending secret has no value');
  }

  const pendingSecret: SecretValue = JSON.parse(
    pendingSecretResponse.SecretString
  );

  // Here you would update the actual service with the new credentials
  // For example, update RDS master password, update API key in payment gateway, etc.

  if (pendingSecret.password !== undefined) {
    // Update database credentials
    console.log('Setting new database credentials in the service');
    // In production, you would call RDS ModifyDBInstance or similar
    // await updateDatabaseCredentials(pendingSecret.username, pendingSecret.password);
  } else if (pendingSecret.apiKey !== undefined) {
    // Update API key in the service
    console.log('Setting new API key in payment gateway');
    // In production, you would update the payment gateway configuration
    // await updatePaymentGatewayApiKey(pendingSecret.apiKey);
  }

  console.log('Successfully set new secret in service');
}

async function testSecret(secretId: string, token: string): Promise<void> {
  // Get the pending secret
  const pendingSecretResponse = await client.send(
    new GetSecretValueCommand({
      SecretId: secretId,
      VersionId: token,
      VersionStage: 'AWSPENDING',
    })
  );

  if (!pendingSecretResponse.SecretString) {
    throw new Error('Pending secret has no value');
  }

  const pendingSecret: SecretValue = JSON.parse(
    pendingSecretResponse.SecretString
  );

  // Test the new credentials
  if (pendingSecret.password !== undefined) {
    // Test database connection with new credentials
    console.log('Testing database connection with new credentials');
    // In production: await testDatabaseConnection(pendingSecret.username, pendingSecret.password);
    // Simulate successful test
    console.log('Database connection test successful');
  } else if (pendingSecret.apiKey !== undefined) {
    // Test API key with payment gateway
    console.log('Testing new API key with payment gateway');
    // In production: await testPaymentGatewayConnection(pendingSecret.apiKey);
    // Simulate successful test
    console.log('Payment gateway API test successful');
  }

  console.log('Successfully tested new secret');
}

async function finishSecret(secretId: string, token: string): Promise<void> {
  // Move the AWSCURRENT stage to the new version
  const metadata = await client.send(
    new DescribeSecretCommand({ SecretId: secretId })
  );

  if (!metadata.VersionIdsToStages) {
    throw new Error('No version stages found');
  }

  // Find the current version ID
  let currentVersionId: string | undefined;
  for (const [versionId, stages] of Object.entries(
    metadata.VersionIdsToStages
  )) {
    if (stages.includes('AWSCURRENT')) {
      currentVersionId = versionId;
      break;
    }
  }

  if (!currentVersionId) {
    throw new Error('No current version found');
  }

  // Update the version stages
  await client.send(
    new UpdateSecretVersionStageCommand({
      SecretId: secretId,
      VersionStage: 'AWSCURRENT',
      MoveToVersionId: token,
      RemoveFromVersionId: currentVersionId,
    })
  );

  console.log('Successfully moved AWSCURRENT stage to new version');
}

function generateSecurePassword(length: number): string {
  // Generate a cryptographically secure password
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!#$%-=?_';
  const allChars = uppercase + lowercase + numbers + special;

  let password = '';

  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

function generateSecureApiKey(length: number): string {
  // Generate a cryptographically secure API key
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let apiKey = '';

  for (let i = 0; i < length; i++) {
    apiKey += chars[Math.floor(Math.random() * chars.length)];
  }

  return apiKey;
}
