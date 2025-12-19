Design a serverless application infrastructure in AWS using CDK for Terraform with Java with the following requirements. 

The solution should follow a modular structure, with each resource defined as a component under a constructs directory. 
The application will run in the us-east-1 region and must include Lambda functions using the Node.js 20.x runtime, Amazon API Gateway, DynamoDB with pay-per-request billing, S3 with versioning enabled for deployment packages, and CloudWatch for monitoring. 
API Gateway should have logging configured, and all error notifications from Lambda logs should be routed through SNS. 
Every resource should be tagged with Name, Environment, and Owner, and resource names should be prefixed with SrvlessDemo_ for consistency. 
IAM roles must follow least privilege principles with no wildcard permissions, and all Lambda functions should have a timeout of 10 seconds or less. 
The design should emphasize clean separation of components, reusable constructs, and compliance with the stated constraints.