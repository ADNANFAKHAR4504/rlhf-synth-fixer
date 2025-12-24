Create a CloudFormation YAML template for a serverless API setup in us-east-1.

I need:
- A Lambda function that handles API requests and sends logs to CloudWatch
- An HTTP API Gateway connected to the Lambda function so HTTP requests trigger Lambda execution
- CloudWatch log groups with 7 day retention for monitoring both the API and Lambda

Put everything in one stack with resource names prefixed with "projectX". The Lambda needs minimal IAM permissions - only basic execution and logging.

Make the function name, handler, runtime, and memory configurable via parameters. Output the API Gateway URL and Lambda ARN so I can use them.
