CDK Infrastructure Creation Prompt (Python, Serverless)
You are tasked with building a serverless infrastructure using AWS CDK with Python. The project structure is as follows:

Project Structure
graphql
Copy
Edit
project-root/
├── tap.py             # CDK app entry point (like app.py)
└── lib/
    └── tap_stack.py   # CDK stack definition file
Environment Requirements
Build a serverless application with the following:

Lambda Function (Python)

Processes HTTP requests triggered by an API Gateway.

Logs each request to:

CloudWatch Logs

An S3 bucket

API Gateway

Serves as the public-facing endpoint.

Forwards incoming requests to the Lambda.

Must have CloudWatch Metrics enabled for performance monitoring.

S3 Bucket

Lambda function writes logs or data to it.

Should be secured and versioned (optional best practice).

CloudWatch Metrics

Enable monitoring for both API Gateway and Lambda.

Should include key performance indicators such as:

Latency

Error rate

Invocation count

Automatic Scaling

Lambda should be configured to scale with traffic load.

Use reserved concurrency or provisioned concurrency (as appropriate).

Tagging

All resources must be tagged for cost allocation, e.g.:

python
Copy
Edit
Tags.of(resource).add("Project", "TAP")
Tags.of(resource).add("Environment", "prod")
Region

Deploy the stack in the us-east-1 AWS region.

CDK Constructs to Use
aws_cdk.aws_lambda

aws_cdk.aws_apigateway

aws_cdk.aws_s3

aws_cdk.aws_logs

aws_cdk.aws_cloudwatch

aws_cdk.Tags

Prompt Summary for Code Generation
Create an AWS CDK Python program with the following:

CDK entry point: tap.py

Stack definition: lib/tap_stack.py

Region: us-east-1

Deploy a Lambda function (Python) triggered by API Gateway (REST)

Lambda logs all requests to CloudWatch and an S3 bucket

Ensure CloudWatch metrics are enabled for both Lambda and API Gateway

Configure the Lambda for automatic scaling under load

Apply resource tags: Project=TAP, Environment=prod

The final code should be error-free, deployable via CDK CLI, and follow AWS best practices"