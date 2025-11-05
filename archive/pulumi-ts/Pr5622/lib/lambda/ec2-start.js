/**
 * EC2 Start Lambda Function
 *
 * This Lambda function starts EC2 instances tagged with Environment=development
 * or Environment=staging. It's triggered by CloudWatch Events at 8 AM EST on weekdays.
 * Includes retry logic with exponential backoff for transient failures.
 */
const { EC2Client, DescribeInstancesCommand, StartInstancesCommand } = require('@aws-sdk/client-ec2');

const ec2Client = new EC2Client({ region: process.env.AWS_REGION });

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second

/**
 * Sleep utility for retry backoff
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute command with exponential backoff retry
 */
async function retryWithBackoff(command, maxRetries = MAX_RETRIES) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await ec2Client.send(command);
    } catch (error) {
      lastError = error;

      // Don't retry on certain errors
      if (error.name === 'InvalidParameterValue' || error.name === 'UnauthorizedOperation') {
        throw error;
      }

      if (attempt < maxRetries - 1) {
        const delay = INITIAL_DELAY * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1} after ${delay}ms due to:`, error.message);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

exports.handler = async (event) => {
  console.log('EC2 Start Lambda triggered:', JSON.stringify(event, null, 2));

  const targetEnvironments = (process.env.TARGET_ENVIRONMENTS || 'development,staging').split(',');

  try {
    // Find all stopped instances with target environment tags
    const instancesPromises = targetEnvironments.map(async (env) => {
      const describeCommand = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'tag:Environment',
            Values: [env.trim()],
          },
          {
            Name: 'instance-state-name',
            Values: ['stopped'],
          },
        ],
      });

      const response = await retryWithBackoff(describeCommand);
      const instances = [];

      for (const reservation of response.Reservations || []) {
        for (const instance of reservation.Instances || []) {
          instances.push(instance.InstanceId);
        }
      }

      return instances;
    });

    const instanceArrays = await Promise.all(instancesPromises);
    const instanceIds = instanceArrays.flat();

    if (instanceIds.length === 0) {
      console.log('No stopped instances found to start');
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'No stopped instances found to start',
          startedInstances: [],
        }),
      };
    }

    console.log(`Starting ${instanceIds.length} instances:`, instanceIds);

    // Start the instances with retry
    const startCommand = new StartInstancesCommand({
      InstanceIds: instanceIds,
    });

    const startResponse = await retryWithBackoff(startCommand);

    console.log('Start response:', JSON.stringify(startResponse, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully started ${instanceIds.length} instances`,
        startedInstances: instanceIds,
        details: startResponse.StartingInstances,
      }),
    };
  } catch (error) {
    console.error('Error starting instances:', error);
    throw error;
  }
};
