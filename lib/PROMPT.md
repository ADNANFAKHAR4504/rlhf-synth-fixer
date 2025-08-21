# Task: Serverless Infrastructure CloudFormation YAML

## Problem Statement
You are tasked with setting up a highly resilient serverless application using AWS CloudFormation. This application will consist of an API Gateway linked to an AWS Lambda function, which will interact with a DynamoDB table. Your infrastructure setup should address the following requirements:

1. The Lambda function must use a supported AWS Lambda runtime and manage its dependencies correctly.
2. Set up a RESTful API using API Gateway that supports multiple HTTP methods and adheres to REST principles. Enable CORS to allow cross-origin requests.
3. The API should securely pass sensitive information to the Lambda function using environment variables.
4. Configure a DynamoDB table with on-demand billing mode to handle unpredictable workloads efficiently without capacity planning.
5. Implement IAM roles and policies granting the Lambda function the minimum necessary permissions to interact with the DynamoDB table.
6. Set up CloudWatch logging to monitor and troubleshoot the Lambda function execution for operational insights.
7. Define stage variables in API Gateway to differentiate between deployment stages (e.g., development, production).
8. Ensure that the deployment is resilient to the failure of a single AZ by designing with cross-availability zone redundancy.
9. Utilize an S3 bucket for storing the API Gateway access logs for security analysis and auditing purposes.
10. Implement Lambda versioning and aliases to safely promote changes from development to production.
11. Use AWS SAM to simplify CloudFormation template development for serverless applications.
12. Integrate with AWS X-Ray to trace and analyze requests as they travel through the API Gateway and Lambda functions.

## Environment
The infrastructure should be deployed in the us-west-2 region, following the naming convention 'projectName-environment-resourceType', where 'projectName' and 'environment' are customizable.

## Expected Output
Create a YAML CloudFormation template named 'serverless-infrastructure.yml' that defines the described architecture. The included configurations should pass all constraints and requirements outlined.

## Constraints
1. Ensure the Lambda function uses a runtime compatible with AWS Lambda (e.g., Node.js, Python).
2. The API Gateway must be configured with a RESTful API and support CORS.
3. Utilize AWS Lambda environment variables for sensitive information instead of hardcoding them.
4. The DynamoDB table must have read and write capacity set to on-demand.
5. Include IAM roles and policies necessary for the Lambda function to access DynamoDB securely.
6. Configure CloudWatch Logs to capture logs from the Lambda function executions.
7. Define API Gateway stage variables for different deployment stages (e.g., dev, prod).
8. Ensure the architecture is resilient to the failure of any single AZ (Across Availability Zone design).
9. Specify an S3 bucket to store API Gateway access logs.
10. Implement Lambda Versioning and Aliases for safe updates.
11. Use AWS SAM (Serverless Application Model) for deployment with CloudFormation.
12. Integrate with AWS X-Ray for tracing requests across the API Gateway and Lambda functions.

## Platform and Language
- Platform: CloudFormation (using AWS SAM)
- Language: YAML
- Deployment Region: us-west-2