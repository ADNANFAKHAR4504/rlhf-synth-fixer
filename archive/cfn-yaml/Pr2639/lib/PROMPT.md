Design a production-ready serverless application CloudFormation template (YAML format) for the us-west-2 region. Name the file serverless-infrastructure.yaml. The template should follow AWS best practices and meet the following requirements:

AWS Lambda

Deploy a Lambda function using Node.js 22.x runtime.

Grant the function permissions (via IAM role with least privilege) to interact with DynamoDB.

Enable CloudWatch logging for monitoring Lambda executions.

Amazon API Gateway

Create an HTTP endpoint integrated with the Lambda function.

Expose a specific resource path that accepts HTTP GET requests.

Enable CORS for requests from any origin.

Configure API Gateway to log to CloudWatch.

Return a 500 error response when Lambda execution fails.

Amazon DynamoDB

Provision a DynamoDB table with a partition key id (string).

Configure with 5 read capacity units and 5 write capacity units.

Enable server-side encryption.

Amazon S3 (Logging)

Create an S3 bucket dedicated for logs.

Enable server-side encryption (SSE-S3).

Turn on versioning to preserve log history.

Security and Monitoring

Ensure all resources use encryption where possible.

Configure CloudWatch monitoring for API Gateway and Lambda.

Tagging

Apply a resource tag to all resources with key: Environment and value: Production.

Ensure the YAML template is valid and deployable with AWS CloudFormation without errors.
