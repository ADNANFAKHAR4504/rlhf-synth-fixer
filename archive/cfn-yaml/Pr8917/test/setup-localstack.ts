import { PutParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

/**
 * Setup script for LocalStack testing
 * Creates required SSM parameters before CloudFormation deployment
 */

const region = process.env.AWS_REGION || 'us-west-2';
const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';

// LocalStack SSM client configuration
const ssmClient = new SSMClient({
  region,
  endpoint,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
});

async function setupSSMParameters() {
  console.log('Setting up SSM parameters for LocalStack...');

  try {
    // Create the database password parameter
    const putCommand = new PutParameterCommand({
      Name: '/myapp/database/password',
      Value: 'TestPassword123!',
      Type: 'SecureString',
      Description: 'Database password for LocalStack testing',
      Overwrite: true,
    });

    await ssmClient.send(putCommand);
    console.log('✅ Created SSM parameter: /myapp/database/password');
  } catch (error) {
    console.error('❌ Failed to create SSM parameter:', error);
    throw error;
  }
}

// Run setup if executed directly
if (require.main === module) {
  setupSSMParameters()
    .then(() => {
      console.log('✅ LocalStack setup complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ LocalStack setup failed:', error);
      process.exit(1);
    });
}

export { setupSSMParameters };
