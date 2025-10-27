import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';

const sfn = new SFNClient({});

export const handler = async (event: any) => {
  const stateMachineArn = process.env.STATE_MACHINE_ARN!;
  const environment = process.env.ENVIRONMENT || 'dev';

  try {
    // Start the recovery state machine execution
    const startExecutionCommand = new StartExecutionCommand({
      stateMachineArn,
      name: `recovery-${Date.now()}`,
      input: JSON.stringify({
        triggerTime: new Date().toISOString(),
        triggerSource: event.source || 'cloudwatch-alarm',
        environment,
        ...event
      })
    });

    const response = await sfn.send(startExecutionCommand);

    console.log('Recovery state machine started:', response.executionArn);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Recovery process initiated',
        executionArn: response.executionArn,
        startDate: response.startDate
      })
    };
  } catch (error) {
    console.error('Failed to start recovery state machine:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to start recovery process',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
