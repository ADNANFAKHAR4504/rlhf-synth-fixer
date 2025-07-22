You are an expert AWS infrastructure engineer. Please generate CDK code in Python that implements the infrastructure described below.

## Objective:
Deploy a serverless AWS application using CDK in Python, following AWS best practices and CDK idioms.

## Requirements:
- Use AWS as the cloud provider.
- Create a new AWS Lambda function:
  - Runtime: Python 3.9
  - Must be deployed in a VPC with at least two public subnets
  - Must have an IAM role allowing:
    - Write access to a DynamoDB table
    - Write access to CloudWatch Logs
  - Lambda should use environment variables managed safely using CDK best practices
  - Monitor Lambda execution with CloudWatch Alarms (e.g., on invocation errors)

- Create a DynamoDB table:
  - Primary key: `itemId` (partition key)
  - Billing mode: On-demand (pay-per-request)

- Create an API Gateway:
  - REST API
  - A `GET` endpoint at the route `/item` that triggers the Lambda function
  - CORS enabled for all origins

- Regional Support:
  - Stack must be deployable in both `us-east-1` and `us-west-2` (ensure CDK code is region-agnostic where possible)

- Tag all AWS resources with:
  - `Environment: Production`

## Output Instructions:
- Include appropriate CDK imports and constructs
- Include VPC and subnet setup
- Clearly comment on how resources are connected (e.g., how API Gateway routes to Lambda, how IAM permissions are scoped)
- Return only the code files, structured for deployment
