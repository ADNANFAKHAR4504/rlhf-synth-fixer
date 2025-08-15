Write a CDK for Terraform (CDKTF) program that generates Terraform HCL in a single file to deploy a serverless infrastructure for an e-commerce application in AWS us-east-1.
The generated Terraform configuration must include:

API Gateway (regional deployment, not edge-optimized)

Multiple AWS Lambda functions (Python 3.8 runtime, encrypted environment variables)

DynamoDB table with auto-scaling enabled (read/write capacity: min 5, max 500)

S3 bucket for static hosting (KMS encryption, versioning enabled)

IAM roles & policies for least-privilege access

CloudWatch logs with 90-day retention

Cost allocation tags (e.g., Environment, Owner) applied to all resources
Additional constraints:

Use Terraform v0.15.0 or later

All resources must be deployed in us-east-1

Lambda environment variables must be securely encrypted

Ensure secure integrations between services
Output: A single CDKTF source file that, when synthesized, produces valid Terraform HCL meeting all above requirements.