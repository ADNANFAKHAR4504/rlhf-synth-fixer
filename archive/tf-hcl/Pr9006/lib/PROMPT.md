We're moving this serverless stack into Terraform HCL instead of CloudFormation. Everything goes into us-east-1, single file: main.tf or tap_stack.tf.

The setup should cover:

Front-end: S3 bucket with website hosting enabled serves the static content directly to users.

API layer: API Gateway acts as the entry point and routes all backend requests to Lambda functions. Cognito user pools authenticate users and secure these API endpoints so only authorized requests reach the Lambda layer.

Backend: Lambda functions process the API requests and read from or write to DynamoDB for data persistence. The functions need environment variables so we can swap configs between dev, staging, and prod.

Data: DynamoDB stores all application data using on-demand capacity mode.

Security: IAM roles grant Lambda functions permission to access DynamoDB tables and write logs to CloudWatch. Keep policies inline in the code with least privilege, no external JSON files.

Logging: Lambda functions write execution logs to CloudWatch Logs, organized by environment: dev, staging, prod.

All resources need Name, Environment, and Owner tags.

The output is one Terraform file with everything in it - valid, deployable with terraform apply, no extra explanations.
