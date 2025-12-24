We're moving this serverless stack into Terraform HCL instead of CloudFormation. Everything goes into us-east-1, single file: main.tf or tap_stack.tf.

The setup should cover:

Front-end served out of S3 with website hosting enabled for direct access.
API Gateway as the entry point for the backend, accessible directly.
Lambda functions for backend logic, triggered by API Gateway. They need environment variables so we can swap configs between dev, staging, and prod.
DynamoDB as the data store, on-demand capacity mode.
Cognito user pools securing all public API endpoints.
IAM roles/policies for Lambda - least privilege, only DynamoDB and CloudWatch logs. Keep them inline in the code, no external JSON files.
Logging has to be wired into CloudWatch Logs, broken down by environment: dev, staging, prod.
All resources need Name, Environment, and Owner tags.

The output is one Terraform file with everything in it - valid, deployable with terraform apply, no extra explanations.
