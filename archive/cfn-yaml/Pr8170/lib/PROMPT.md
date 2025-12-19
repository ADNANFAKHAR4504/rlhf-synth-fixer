# PROMPT

You are an expert AWS Solutions Architect specializing in CloudFormation. Your task is to generate a complete and well-commented CloudFormation YAML template to deploy a serverless web application. This template must ensure consistency, adhere to best practices for deployment and security, and be reusable for different environments.

The infrastructure will be deployed in the `us-west-2` AWS region within a single AWS account.

Your solution must comply with the following detailed requirements:

1.  **API Gateway Deployment:** Deploy an AWS API Gateway configured to handle incoming HTTP requests for the web application.
2.  **Lambda Function Integration:** Utilize an AWS Lambda function to process all incoming requests routed through API Gateway. This Lambda function should be designed to return a simple 'Hello World' message as its response.
3.  **Comprehensive Logging to S3:** Configure both the AWS API Gateway and the AWS Lambda function to store *all* their generated logs in a dedicated AWS S3 Bucket. This includes API Gateway access logs and all Lambda execution logs. Detail the necessary mechanisms (e.g., CloudWatch Logs subscription filters, Kinesis Firehose, S3 bucket policies) to achieve this consolidated logging in S3.
4.  **Least Privilege IAM Roles:** Define AWS IAM roles with policies that strictly observe the principle of least privilege. Specifically, grant the necessary permissions for:
    * The Lambda function to write its execution logs to AWS CloudWatch Logs.
    * Both API Gateway and Lambda (via its logging mechanism) to write their respective logs to the designated S3 bucket.
5.  **Mandatory Resource Tagging:** Ensure that *all* AWS resources created by this CloudFormation stack are consistently tagged. Every resource must have a tag with the key `Environment` and its value explicitly set to `Production`. Additionally, include parameters for other common tags like `ProjectName` and `CostCenter` to facilitate reusability and management.

**Expected Output:**

Provide a CloudFormation YAML file named `serverless-infra.yaml`. This file must successfully deploy the described serverless infrastructure, demonstrating adherence to all specified requirements, including comprehensive logging to S3, least privilege IAM roles, and consistent tagging. The template should be structured to allow for easy modification of tags and other minor configurations for deployment into different environments. Ensure the design inherently supports on-demand scalability for all deployed resources.