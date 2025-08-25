## CDKTF Serverless Web Application Infrastructure

Create a CDK for Terraform (CDKTF) project using TypeScript to deploy a highly scalable serverless web application infrastructure on AWS. The implementation includes proper Lambda function code packaging using ZIP files and follows AWS best practices for security, scalability, and maintainability.

### Environment and Context
- Region: `us-east-1`
- Project Name: IaC AWS Nova Model Breaking
- Resource Naming Convention: Use prefix `prod-service-` for all resources (for example, `prod-service-lambda`, `prod-service-table`).
- Architecture Type: Fully serverless infrastructure using AWS-managed services.

### Requirements

#### Compute Layer AWS Lambda
- Deploy Lambda functions to handle backend logic and processing with ZIP file deployment packages.
- Configure log retention and enable detailed monitoring (CloudWatch).
- Set appropriate IAM roles with least privilege for Lambda execution.
- Lambda functions should use `lambda-handler.handler` as the entry point.
- Package Lambda code using ZIP files (no external archive providers needed).

#### API Layer API Gateway
- Deploy API Gateway to expose HTTP endpoints and route requests to Lambda.
- Configure stages, logging, throttling, and security settings.
- Ensure low latency and scalability for handling large request volumes.
- Support endpoints for user management, session handling, and health checks.

#### Data Layer DynamoDB
- Deploy DynamoDB tables for application data storage with proper TTL configuration.
- Configure on-demand capacity for performance and cost optimization.
- Apply encryption at rest, point-in-time recovery, and security best practices.
- Ensure data persistence validation can be performed post-deployment.

#### Storage Layer S3
- Deploy S3 bucket for Lambda deployment packages.
- Configure appropriate security settings and access policies.

#### Scalability and Performance
- Design infrastructure to scale automatically with minimal latency.
- Ensure inter-service communication is secure, efficient, and serverless-native.
- Implement proper resource dependencies and lifecycle management.

#### Security and Monitoring
- CloudWatch log groups for comprehensive logging and monitoring.
- IAM roles and policies following principle of least privilege.
- Proper resource tagging and output values for operational management.

### Implementation Details
- **No Archive Provider**: Implementation does not use external archive providers like `@cdktf/provider-archive`
- **ZIP File Management**: Lambda deployment packages are managed as static ZIP files
- **Handler Configuration**: All Lambda functions use `lambda-handler.handler` as the entry point
- **Environment Variables**: Lambda functions receive DynamoDB table names through environment variables

### Expected Output
A CDKTF implementation that:

- Deploys AWS Lambda, API Gateway, DynamoDB, and S3 as a scalable serverless stack.
- Includes CloudWatch monitoring, secure IAM roles, and performance-optimized resources.
- Successfully passes `cdktf synth`, TypeScript compilation, and unit/integration tests.
- Validates deployment via successful API calls and DynamoDB data persistence.
- Uses ZIP file deployment packages for Lambda functions without external archive dependencies.
