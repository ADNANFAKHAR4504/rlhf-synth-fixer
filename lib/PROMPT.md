You are tasked with deploying a serverless infrastructure using AWS CloudFormation. Your deployment must include these components:

Lambda Function:

Deploy an AWS Lambda function in the us-east-1 region.

The Lambda must handle HTTP requests routed through an Amazon API Gateway (REST or HTTP API as preferred).

IAM Role and Permissions:

The Lambda function should have an IAM execution role with least privilege.

Permissions must include only what is necessary to:

Write logs to CloudWatch.

Read/write objects to a designated S3 bucket for processed data.

(Optional: Include additional permissions only if strictly required by Lambda runtime or integration.)

Logging:

All Lambda invocations (requests and responses) must be logged in Amazon CloudWatch.

Ensure a CloudWatch Log Group and appropriate log permissions.

S3 Bucket for Processed Data:

Automate the creation of an S3 bucket (unique name, e.g., with random/resource suffix).

All objects in this bucket must be encrypted using a customer-managed AWS KMS key.

The Lambda function uses this bucket for any data handling.

CloudWatch Monitoring:

Requests to the Lambda function must be tracked in CloudWatch (using metrics/alarms if desired).

Outputs:

The stack must produce these outputs, clearly labeled:

The API Gateway invocation URL (for testing/consuming the API).

The Lambda function’s Amazon Resource Name (ARN).

The S3 bucket name.

Constraints:

Provide the full working YAML template.

No manual configuration should be required after stack deployment.

All encryption, permissions, and logging must be automated by the template.

The CloudFormation stack outputs must be readily verifiable immediately after deployment.

Expected Output:
A single, production-grade CloudFormation YAML file fully meeting the above requirements and constraints, designed for direct deployment in the us-east-1 AWS region. Place explanations or comments inline as YAML comments—not in the main output document.
