You are an expert Prompt Engineer with 10 years of experience, Your task is to create prompts for AI so that the AI will generate a response (IAC code).
Help me write a prompt for creating IAC in CDKTF PYTHON, Please make sure that the provided data should remain intact and it should not change in anyway:

Problem statement constraints:
All resources must be created within the us-east-1 region. | Lambda function must have IAM roles with least privilege access.

Problem statement Environment:
"Create a stack file with CDKTF PYTHON to deploy a serverless application that responds to S3 bucket events. The application will consist of the following components:

1. An S3 bucket to store images.
2. An AWS Lambda function triggered by events in the S3 bucket. This function should generate a thumbnail of the uploaded image and store it back in another directory within the same bucket.
3. Appropriate IAM roles and policies that adhere to the principle of least privilege, granting only necessary permissions to the Lambda function.

### Requirements

- All resources must be created within the us-east-1 region.
- The Lambda function execution role must have policies to get objects from, put objects to, log to CloudWatch, and access IAM permissions needed for its operations.

### Expected output

The expected result is a YAML file named `serverless_template.yaml`. The template must define all necessary resources and configurations. It should pass validation with the AWS CloudFormation Linter and deploy successfully in the specified AWS region, handling S3 events as described."

Problem Statement:
The target environment is an AWS cloud infrastructure in the us-east-1 region, where all components of a serverless application should be deployed.
