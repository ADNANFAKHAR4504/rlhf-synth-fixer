import * as AWS from 'aws-sdk';

const codepipeline = new AWS.CodePipeline();

interface CodePipelineJobEvent {
  'CodePipeline.job': {
    id: string;
    data: {
      actionConfiguration: {
        configuration: {
          UserParameters: string;
        };
      };
      inputArtifacts: Array<{
        location: {
          s3Location: {
            bucketName: string;
            objectKey: string;
          };
        };
      }>;
    };
  };
}

export const handler = async (event: CodePipelineJobEvent): Promise<void> => {
  const jobId = event['CodePipeline.job'].id;

  try {
    // Extract job data
    const jobData = event['CodePipeline.job'].data;

    // Perform custom validation logic here
    // Example: Check if deployment should proceed based on business rules
    const validationPassed = await performValidationChecks(jobData);

    if (validationPassed) {
      console.log('Validation passed successfully');
      await codepipeline.putJobSuccessResult({ jobId }).promise();
    } else {
      console.error('Validation failed');
      await codepipeline
        .putJobFailureResult({
          jobId,
          failureDetails: {
            message: 'Custom validation failed',
            type: 'JobFailed',
          },
        })
        .promise();
    }
  } catch (error) {
    console.error(`Error during validation: ${error}`);
    await codepipeline
      .putJobFailureResult({
        jobId,
        failureDetails: {
          message: error instanceof Error ? error.message : String(error),
          type: 'JobFailed',
        },
      })
      .promise();
  }
};

async function performValidationChecks(_jobData: unknown): Promise<boolean> {
  /**
   * Implement your custom validation logic here
   */
  // Example validation checks:
  // - Verify artifact integrity
  // - Check deployment window
  // - Validate configuration parameters
  // - Run security scans

  console.log('Performing custom validation checks...');

  // For demo purposes, always return true
  // In real implementation, add your validation logic
  return true;
}
