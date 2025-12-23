# Serverless Application Deployment Challenge

## Objective

Design and deploy a secure serverless web application using AWS CloudFormation. Define and provision Lambda, API Gateway, and S3 resources.

## Requirements

Your CloudFormation template must meet the following criteria:

### 1. Lambda Function Setup
- Runtime must be set to python3.11.
- The function will be triggered by API Gateway upon receiving HTTP requests.
- The Lambda should have an IAM execution role with permissions to write logs to CloudWatch Logs.

### 2. API Gateway Integration
- Define an HTTP-based API Gateway that invokes the Lambda function.
- Configure supported HTTP methods such as GET, POST, PUT, and DELETE.

### 3. S3 Bucket Configuration
- Create an S3 bucket to store Lambda function assets.
- Ensure the bucket has encryption at rest enabled using AES256.
- Enable versioning on the bucket.
- Block all public access to the bucket.

### 4. Security and Permissions
- Ensure least privilege is enforced in the Lambda execution role.
- Apply best practices for securing API Gateway endpoints.
- The IAM role should only have permissions for CloudWatch Logs actions on Lambda log groups.

### 5. Deployment
- Define resources in a CloudFormation YAML template.
- Validate the template using cfn-lint.
- Template should be deployable to LocalStack for local testing.

## Expected Outcome

- A valid and deployable CloudFormation YAML template.
- All components including Lambda, API Gateway, S3, and IAM Role are correctly defined and linked.
- Template passes cfn-lint validation without errors.
- The serverless stack is deployable following security best practices.
- All Python Lambda code should be inline within the YAML template.
