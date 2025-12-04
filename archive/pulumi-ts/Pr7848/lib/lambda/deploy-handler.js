// This is a standalone version of the Lambda function for reference
// The actual code is embedded in the Pulumi program above

const { CodePipelineClient, PutJobSuccessResultCommand, PutJobFailureResultCommand } = require('@aws-sdk/client-codepipeline');
const codepipeline = new CodePipelineClient({});

exports.handler = async (event) => {
    console.log('Deployment notification received:', JSON.stringify(event, null, 2));

    const jobId = event['CodePipeline.job']?.id;

    try {
        // Log deployment event
        console.log('Processing deployment for job:', jobId);
        console.log('Environment:', process.env.ENVIRONMENT);
        console.log('Deployment stage completed successfully');

        // Perform any deployment actions here
        // For example:
        // - Trigger ECS deployment
        // - Update configuration
        // - Send notifications to other systems

        // If this is a CodePipeline job, report success
        if (jobId) {
            const command = new PutJobSuccessResultCommand({
                jobId: jobId
            });
            await codepipeline.send(command);

            console.log('CodePipeline job marked as successful');
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Deployment notification processed',
                environment: process.env.ENVIRONMENT
            })
        };
    } catch (error) {
        console.error('Deployment error:', error);

        // If this is a CodePipeline job, report failure
        if (jobId) {
            const command = new PutJobFailureResultCommand({
                jobId: jobId,
                failureDetails: {
                    message: error.message,
                    type: 'JobFailed'
                }
            });
            await codepipeline.send(command);
        }

        throw error;
    }
};
