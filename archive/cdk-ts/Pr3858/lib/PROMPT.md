# Document Conversion Service Infrastructure

I need help building a document processing system on AWS. We have a service that handles around 4,600 file uploads per day that need to be converted from various formats to standardized PDFs.

## Requirements

Create AWS infrastructure using CDK with TypeScript in the us-west-1 region that includes:

1. An S3 bucket for users to upload their documents. Configure event notifications on this bucket to automatically trigger processing when new files arrive.

2. Lambda functions using Python 3.10 runtime to handle the actual format conversion work. These functions should have a 15 minute timeout since some document conversions can take time.

3. A Step Functions state machine to orchestrate the conversion workflow. The workflow should support parallel processing so we can handle multiple files simultaneously and keep up with our daily volume.

4. A DynamoDB table to track the status of conversion jobs so we can monitor which files have been processed and which are still pending.

5. An SNS topic to send notifications when conversions complete successfully or fail.

6. CloudWatch metrics and monitoring to track processing performance and catch any issues.

7. An SQS queue for managing the processing queue and ensuring we don't lose any conversion requests.

8. IAM roles and policies so all these services can communicate securely with each other.

## Additional Context

The S3 event notifications should directly trigger the Lambda functions when files are uploaded. The Step Functions workflow should be designed with parallel processing branches to handle high throughput. Make sure Lambda has appropriate retry logic and error handling since file conversions can occasionally fail.

For the DynamoDB table, consider using on-demand billing since our load varies throughout the day. Include a dead letter queue with the SQS setup to catch any failed messages.

Please generate complete infrastructure code with each component properly configured and connected. Each file should be in its own code block so I can easily extract them.
