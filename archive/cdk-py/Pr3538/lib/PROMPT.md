I want to create a demo environment setup in AWS using CDK with Python. Everything should be deployed in us-east-1. I’d like Service Catalog to act as the entry point so standardized demo stacks can be provisioned. The provisioning itself should lean on CloudFormation, but I also want Lambda functions running Java 17 to handle any custom logic in that process.  

For keeping track of environments, DynamoDB should hold an inventory of what’s been provisioned. Branding assets can live in S3 buckets. User management for demo participants should be handled with Cognito, and the overall environment setup process should be orchestrated with Step Functions. EventBridge needs to be in place to schedule automatic cleanups of expired demos.  

For observability, add CloudWatch to track usage metrics and send provisioning notifications through SNS. Make sure IAM roles are scoped for time-limited access so these environments are secure by default.  

Can you generate the CDK Python code that pulls this whole demo environment architecture together? 
