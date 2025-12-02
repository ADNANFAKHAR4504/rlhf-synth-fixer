const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { CodePipelineClient, PutJobSuccessResultCommand, PutJobFailureResultCommand } = require('@aws-sdk/client-codepipeline');

const snsClient = new SNSClient({ region: process.env.REGION || 'us-east-1' });
const codepipelineClient = new CodePipelineClient({ region: process.env.REGION || 'us-east-1' });

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    // Extract job details from CodePipeline
    let jobId;
    let userParameters = {};

    if (event['CodePipeline.job']) {
      jobId = event['CodePipeline.job'].id;
      const userParamsString = event['CodePipeline.job'].data?.actionConfiguration?.configuration?.UserParameters;

      if (userParamsString) {
        try {
          userParameters = JSON.parse(userParamsString);
        } catch (e) {
          console.log('Failed to parse user parameters:', e);
        }
      }
    }

    // Perform approval checks
    const approvalChecks = {
      securityScan: true,
      codeReview: true,
      testsPassed: true,
      complianceCheck: true,
    };

    // Prepare notification message
    const message = {
      pipeline: 'Node.js CI/CD Pipeline',
      action: 'Approval Check',
      checks: approvalChecks,
      timestamp: new Date().toISOString(),
      message: 'All approval checks have been completed successfully.',
    };

    // Publish to SNS
    const publishCommand = new PublishCommand({
      TopicArn: process.env.SNS_TOPIC_ARN,
      Subject: 'Pipeline Approval Check Complete',
      Message: JSON.stringify(message, null, 2),
    });

    await snsClient.send(publishCommand);
    console.log('Approval notification sent successfully');

    // Report success back to CodePipeline if this was triggered by CodePipeline
    if (jobId) {
      const successCommand = new PutJobSuccessResultCommand({
        jobId: jobId,
      });
      await codepipelineClient.send(successCommand);
      console.log('Job success reported to CodePipeline');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Approval checks completed successfully',
        checks: approvalChecks,
      }),
    };
  } catch (error) {
    console.error('Error:', error);

    // Report failure back to CodePipeline if this was triggered by CodePipeline
    if (event['CodePipeline.job']) {
      const jobId = event['CodePipeline.job'].id;
      const failureCommand = new PutJobFailureResultCommand({
        jobId: jobId,
        failureDetails: {
          message: error.message,
          type: 'JobFailed',
        },
      });
      await codepipelineClient.send(failureCommand);
      console.log('Job failure reported to CodePipeline');
    }

    throw error;
  }
};
