You are an expert in AWS Cloud Development Kit (CDK) and TypeScript. Your task is to generate a TypeScript file that defines a complete AWS CDK stack, meeting the following requirements and constraints. **All provided configuration data must remain unchanged.** Where resource names require a suffix, ensure a String suffix is appended.

**Problem Statement:**  
You are tasked with creating a robust serverless infrastructure using AWS CloudFormation with TypeScript and AWS CDK. The goal is to set up a system that includes a RESTful API, storage, and compute capabilities, following best practices for security and reliability. Your solution must meet the following requirements:

1. Use AWS Lambda for serverless computations and ensure the function has environment variables set up for sensitive data.
2. Integrate the Lambda function with an API Gateway to handle RESTful API requests.
3. Utilize DynamoDB to store and manage data for the application.
4. Deploy the entire stack in the `us-east-1` AWS region.
5. Ensure least privilege access through properly configured IAM roles for all components.
6. Implement CloudWatch logging for both the Lambda function and the API Gateway.
7. Configure a dead-letter queue for the Lambda function to manage failed processing attempts.
8. Employ AWS X-Ray for tracing to monitor the interactions within the infrastructure.
9. Utilize AWS Systems Manager Parameter Store for managing configuration parameters.
10. Include an S3 bucket to store logs related to API requests.
11. Use CloudFormation stack outputs to provide the endpoint URL of the deployed API.
12. Integrate with CloudFormation through the AWS CDK using TypeScript to implement these specifications.

**Environment:**  
The infrastructure will be deployed in AWS’ us-east-1 region. It utilizes AWS Lambda for compute, API Gateway for HTTP endpoints, and DynamoDB for data storage. The environment must follow AWS best practices for security and monitoring.

**Constraints:**  
- Use AWS Lambda for serverless compute.
- Integrate with an API Gateway for RESTful requests.
- Implement DynamoDB as the primary database.
- Ensure the infrastructure is deployed in the us-east-1 region.
- Use IAM roles appropriately to limit access to services.
- Define environment variables for sensitive data in Lambda functions.
- Set up CloudWatch logging for Lambda and API Gateway.
- Implement a dead-letter queue for failed invocations in Lambda.
- Enable tracing for monitoring with AWS X-Ray.
- Leverage parameter store for configuration management.
- Create an S3 bucket to store API logs.
- Use a CloudFormation stack output to provide the endpoint URL.
- **Ensure a String suffix is appended to resource names where needed.**

**Instructions:**  
- Generate a single, complete TypeScript file for the AWS CDK stack, strictly adhering to the above requirements and constraints.
- Do not change or reinterpret any provided data or configuration details.
- Explicitly append a String suffix to resource names wherever required.
- All AWS resources must be fully deployable and verifiable by AWS solution tests.

---

**Expected Output:**  
A deployable TypeScript file containing the AWS CDK stack definition that implements all the above requirements and constraints.

```
