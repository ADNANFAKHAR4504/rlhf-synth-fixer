The ideal response would be a complete and valid CloudFormation YAML template named serverless-infrastructure.yaml that ticks every box in the prompt.

Here’s what it should look like:

A Lambda function running Node.js 14.x, with an IAM execution role that only allows logging to CloudWatch and read/write access to the DynamoDB table.

An API Gateway endpoint with a specific GET method path integrated with the Lambda function, including CORS enabled for any origin and a 500 response mapping for Lambda errors.

A DynamoDB table with a partition key called id, 5 read/write capacity units, and server-side encryption enabled.

An S3 bucket for logging with SSE-S3 encryption, versioning turned on, and proper bucket policies if needed.

CloudWatch log groups for both the Lambda and API Gateway, ensuring that monitoring is covered.

Environment=Production tags applied to every resource.

This version should be clean, well-structured, and deploy successfully in AWS without modification.
