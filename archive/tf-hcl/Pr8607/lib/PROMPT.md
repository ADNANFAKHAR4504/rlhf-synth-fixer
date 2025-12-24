# Serverless Infrastructure with Terraform HCL

## Task Requirements

Develop a Terraform program in HCL to deploy a serverless application on AWS. Your application should encompass the following features:

1. **AWS Lambda Function**: Implement an AWS Lambda function using a Python runtime
2. **API Gateway Integration**: Set up an Amazon API Gateway to trigger the Lambda function
3. **Regional Deployment**: Deploy all resources in the AWS 'us-west-2' region
4. **Security Best Practices**: Ensure that IAM roles adhere to security best practices by granting the least privilege necessary for functionality
5. **Terraform HCL**: The solution should use Terraform's HCL syntax
6. **Unit Testing**: Provide unit tests for the Lambda function using the Python 'unittest' module

## Expected Output

Submit a Terraform program in HCL files that define infrastructure meeting the outlined requirements. Tests must pass with 'unittest', and successful deployment should be verified via the AWS Management Console.

## Environment Details

- **Platform**: tf
- **Language**: HCL  
- **Region**: us-west-2
- **Runtime**: Python for Lambda functions
- **Complexity**: Hard

## Constraints

1. Must use HCL as the infrastructure language with Terraform
2. Implement a serverless architecture using AWS Lambda
3. Configure AWS API Gateway to trigger the Lambda function
4. Ensure the Lambda function uses a Python runtime environment
5. Resources should be deployed in the us-west-2 region
6. Apply AWS IAM best practices for the Lambda execution role