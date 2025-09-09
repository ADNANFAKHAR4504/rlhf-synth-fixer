## Create Terraform Configuration for Serverless AWS Application
Create a Terraform configuration that sets up a serverless application environment with:
Lambda function triggered by S3 object creation (30 second timeout)
S3 bucket with versioning enabled and event triggers
API Gateway with CORS enabled and logging active
DynamoDB table with 5 RCU and 5 WCU provisioned throughput
Proper IAM roles following least privilege principle
Resource tagging for cost allocation
Outputs for S3 bucket name and API Gateway endpoint URL
Deploy to us-west-2 region
Use Terraform best practices and ensure all resources are properly secured and configure. Use an inline lambda and assume the `provider.tf` file will be provided. Place the code in a file named `tap_stack.tf`