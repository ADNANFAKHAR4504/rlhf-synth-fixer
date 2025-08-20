I need you to create a serverless application infrastructure using AWS CloudFormation written in YAML. The stack should include:
• An API Gateway in us-east-1, secured with SSL certificates.
• An AWS Lambda function triggered by the API Gateway, configured with:
• 256 MB memory
• 120 seconds timeout
• Logging enabled to CloudWatch Logs (all errors must be captured).
• A DynamoDB table with server-side encryption enabled for secure data storage.
• IAM roles and policies must strictly follow the principle of least privilege for API Gateway, Lambda, and DynamoDB.

The final output should be a valid CloudFormation template file named serverless-setup.yaml, fully deployable without errors, and must pass AWS validation.
