/**
 * EC2 Stop Lambda Function
 *
 * This Lambda function stops EC2 instances tagged with Environment=development
 * or Environment=staging. It's triggered by CloudWatch Events at 7 PM EST on weekdays.
 */
const { EC2Client, DescribeInstancesCommand, StopInstancesCommand } = require('@aws-sdk/client-ec2');

const ec2Client = new EC2Client({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  console.log('EC2 Stop Lambda triggered:', JSON.stringify(event, null, 2));

  const targetEnvironments = (process.env.TARGET_ENVIRONMENTS || 'development,staging').split(',');

  try {
    // Find all running instances with target environment tags
    const instancesPromises = targetEnvironments.map(async (env) => {
      const describeCommand = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'tag:Environment',
            Values: [env.trim()],
          },
          {
            Name: 'instance-state-name',
            Values: ['running'],
          },
        ],
      });

      const response = await ec2Client.send(describeCommand);
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
      console.log('No running instances found to stop');
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'No running instances found to stop',
          stoppedInstances: [],
        }),
      };
    }

    console.log(`Stopping ${instanceIds.length} instances:`, instanceIds);

    // Stop the instances
    const stopCommand = new StopInstancesCommand({
      InstanceIds: instanceIds,
    });

    const stopResponse = await ec2Client.send(stopCommand);

    console.log('Stop response:', JSON.stringify(stopResponse, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully stopped ${instanceIds.length} instances`,
        stoppedInstances: instanceIds,
        details: stopResponse.StoppingInstances,
      }),
    };
  } catch (error) {
    console.error('Error stopping instances:', error);
    throw error;
  }
};
