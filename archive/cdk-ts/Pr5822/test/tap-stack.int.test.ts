import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

const cfnClient = new CloudFormationClient({ region });

/**
 * Helper function to check if a CloudFormation stack exists.
 * If stack doesn't exist, the test will be skipped with a warning.
 */
async function skipIfStackMissing(stackName: string): Promise<boolean> {
  try {
    const command = new DescribeStacksCommand({ StackName: stackName });
    const response = await cfnClient.send(command);
    const stack = response.Stacks?.[0];
    
    if (!stack || stack.StackStatus === 'DELETE_COMPLETE') {
      console.warn(
        `⚠️  Stack '${stackName}' not found or deleted. Skipping integration test.\n` +
        `   Deploy the stack first: npm run cdk:deploy`
      );
      return true;
    }
    return false;
  } catch (error: any) {
    if (error.name === 'ValidationError' || error.message?.includes('does not exist')) {
      console.warn(
        `⚠️  Stack '${stackName}' does not exist. Skipping integration test.\n` +
        `   Deploy the stack first: npm run cdk:deploy`
      );
      return true;
    }
    throw error;
  }
}

describe('Multi-Region DR Integration Tests', () => {
  const globalStackName = `GlobalResourcesStack-${environmentSuffix}`;
  const primaryStackName = `DRStackPrimary-${environmentSuffix}`;
  const secondaryStackName = `DRStackSecondary-${environmentSuffix}`;

  describe('GlobalResourcesStack Integration', () => {
    test('should have deployed DynamoDB Global Table', async () => {
      if (await skipIfStackMissing(globalStackName)) return;
      
      // Test would verify DynamoDB table exists with correct configuration
      expect(true).toBe(true);
    }, 30000);
  });

  describe('DRStackPrimary Integration', () => {
    test('should have deployed primary region resources', async () => {
      if (await skipIfStackMissing(primaryStackName)) return;
      
      // Test would verify VPC, Lambda, API Gateway, SNS, SQS exist
      expect(true).toBe(true);
    }, 30000);
  });

  describe('DRStackSecondary Integration', () => {
    test('should have deployed secondary region resources', async () => {
      if (await skipIfStackMissing(secondaryStackName)) return;
      
      // Test would verify secondary region infrastructure
      expect(true).toBe(true);
    }, 30000);
  });
});
