/**
 * EC2 Start Lambda Function
 *
 * This Lambda function starts EC2 instances tagged with Environment=development
 * or Environment=staging. It's triggered by CloudWatch Events at 8 AM EST on weekdays.
 */
const { EC2Client, DescribeInstancesCommand, StartInstancesCommand } = require('@aws-sdk/client-ec2');

const ec2Client = new EC2Client({ region: process.env.AWS_REGION });

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

    // Start the instances
    const startCommand = new StartInstancesCommand({
      InstanceIds: instanceIds,
    });

    const startResponse = await ec2Client.send(startCommand);

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
