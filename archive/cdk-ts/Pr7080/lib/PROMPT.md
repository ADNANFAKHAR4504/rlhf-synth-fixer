Hi team,

We need a compact, human-readable brief for a CDK TypeScript stack that produces a secure serverless API. Please implement the stack exactly as specified below.

What to build
- A REST API backed by a Lambda function.
- The Lambda must read configuration from environment variables and should write application data into DynamoDB.
- Use SSM Parameter Store for managed configuration values.
- Provide CloudWatch logging for both Lambda and API Gateway.
- Use an S3 bucket for any API-related logs.
- Configure an SQS dead-letter queue for the Lambda to capture failed messages.
- Enable AWS X-Ray for tracing across Lambda and API Gateway.
- Ensure all IAM roles follow least-privilege.

Hard constraints (do not change)
- Deploy the stack to region us-east-1.
- Use Lambda for compute and API Gateway for REST endpoints.
- Use DynamoDB as the primary datastore.
- Store configuration in SSM Parameter Store where appropriate.
- Append a string suffix to resource names where uniqueness or suffixing is required.
- Export the API endpoint URL as a CloudFormation output.

Implementation notes
- Use AWS CDK (TypeScript) and standard CDK constructs.
- Keep the code deployable and compatible with the current CI/CD pipeline.
- Do not alter provided configuration values; only append suffixes where required.

Deliverable
- One TypeScript CDK stack file that implements the above.

If anything is unclear, ask here. Otherwise, please proceed.
