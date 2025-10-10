Create a CDK project that allows deployment to multiple environments, such as staging and production, without code changes. The project should be able to fulfill the following requirements:
Creating AWS Lambda functions with versioning strategy, API Gateway, and DynamoDB tables.
Establishing an IAM role with the least privilege permissions for each Lambda function.
Support incorporating a custom domain for the API Gateway with HTTPS support, this should however be optional and we can fallback to the default domain if not provided.
Enabling DynamoDB auto-scaling with provisioned throughputs and budget constraints, and setting CloudWatch alarms for Lambda monitoring.
Implementing AWS Cognito for API Gateway authorization
Configuring everything to facilitate easy rollback and potential scaling.
All costs associated with the deployment should be tagged and categorized by department within AWS Billing.
Use environment variables to manage Lambda configurations without hardcoding values.
Each environment should have its own distinct set of resources to prevent cross-environment data leakage.
Logging for Lambda functions must be enabled, sending logs to CloudWatch logs group.
Deployment rollback strategy must be in place to handle failed deployments.
Implement VPC peering for Lambda functions that need access to private resources.
Configure API Gateway stages with usage plans and rate limiting policies.
The main stack should be named TapStack in a file called tap-stack.ts
Please also minimise additional documentation and generate only the Typescript under bin/ and lib/ make the code clean and modular.