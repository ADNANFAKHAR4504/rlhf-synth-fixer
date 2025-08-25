// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';

const aws_key_id=process.env.AWS_ACCESS_KEY_ID
const aws_key_secret=process.env.AWS_SECRET_ACCESS_KEY

console.log('AWS_SESSION_TOKEN:', process.env.AWS_SESSION_TOKEN || '(not set)');
if (aws_key_id) {
  console.log(`Using AWS Access Key ID starting with: ${aws_key_id.substring(0, aws_key_id.length - 1)}`);
  console.log(`Using AWS Access Key ID ending with: ${aws_key_id.substring(aws_key_id.length - 1, aws_key_id.length)}`);
} else {
  console.log('AWS Access Key ID is not set');
}

if (aws_key_secret) {
  console.log(`Using AWS Secret Access Key starting with: ...${aws_key_secret.substring(0, aws_key_secret.length - 1)}`);
  console.log(`Using AWS Secret Access Key ending with: ...${aws_key_secret.substring(aws_key_secret.length - 1, aws_key_secret.length)}`);
} else {
  console.log('AWS Secret Access Key is not set');
}


// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Turn Around Prompt API Integration Tests', () => {
  describe('Write Integration TESTS', () => {
    test('Dont forget!', async () => {
      expect(false).toBe(true);
    });
  });
});
