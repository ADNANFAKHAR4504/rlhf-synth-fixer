```yml
Act as an expert DevOps engineer. Generate a production-grade AWS CloudFormation template (YAML) that defines a complete serverless infrastructure in the us-east-1 region.

Requirements:

The infrastructure must use AWS Lambda for running serverless application code.

Provision an Amazon API Gateway (HTTP API) to trigger the Lambda function via HTTP requests.

Enable detailed monitoring and logging using Amazon CloudWatch for both API Gateway and Lambda (i.e., log groups, metrics, and log retention policies).

All resources must be defined within a single CloudFormation stack.

Enforce consistent naming conventions by prefixing all relevant resource names with projectX.

Use parameters for configurable values such as function name, handler, runtime, and memory size.

Include Outputs to expose the API Gateway URL and Lambda function ARN.

Apply serverless best practices, such as:

Minimum privilege IAM role for the Lambda function.

Log retention set to 7 days.

Proper dependencies (DependsOn) where needed.

Ensure the template is clean, readable, and deployable as-is.
```