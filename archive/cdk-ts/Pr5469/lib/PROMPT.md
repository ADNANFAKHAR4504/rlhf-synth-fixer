Develop and implement a complete CI/CD pipeline using AWS CloudFormation with AWS CDK in TypeScript. The pipeline must automatically build and deploy AWS Lambda functions when code is updated in S3.

Core Infrastructure:

- AWS CodePipeline: Orchestrate workflow with source (S3), build, and deploy stages
- AWS CodeBuild: Execute build operations, run unit tests, package Lambda functions
- AWS CodeDeploy: Handle Lambda deployments with blue/green capabilities
- AWS SNS: Send automated notifications on pipeline status changes

Application Requirements:

- Express.js Lambda function with REST API endpoints:
  - GET /s3/object/:bucket/:key - Retrieve objects from S3
  - PUT /s3/object/:bucket/:key - Upload objects to S3
  - GET /dynamodb/item/:table/:key - Get items from DynamoDB
  - PUT /dynamodb/item/:table/:key - Put items into DynamoDB
- Lambda Runtime: Node.js 20.x, Build Runtime: Node.js 20.x
- Least-privilege IAM roles with read/write permissions for S3 and DynamoDB

Security Requirements:

- Least-privilege IAM with separate roles for CodePipeline, CodeBuild (build/test stages), and deployment
- AWS Systems Manager Parameter Store with KMS encryption for sensitive credentials
- S3 buckets with encryption and proper policies
- Code signing and artifact validation
- Environment variables for sensitive data (no hardcoded secrets)

Monitoring and Rollback:

- CloudWatch logging for all stages, Lambda functions, and API Gateway
- CloudWatch alarms for deployment health and dashboards for pipeline metrics
- Automatic rollback on deployment failures using CloudFormation rollback capabilities
- SNS notifications for status changes

Deployment Requirements:

- Deploy to us-west-2 region
- Use environmentSuffix parameter via CDK context (only required parameter, all other configs need defaults)
- Manual approval step before production deployments
- Resource tagging: Project=FinanceApp, Environment=Dev

CDK Outputs:
Generate detailed stack exports for integration testing:

- API Gateway endpoint URL
- S3 bucket names
- DynamoDB table names
- CodePipeline ARN
- SNS topic ARN
- Lambda function ARNs and versions
- IAM role ARNs
- CloudWatch log group names

Technical Requirements:

- AWS CDK with TypeScript
- Modular constructs within lib/, TapStack in lib/tap-stack.ts
- Unit testing in CodeBuild pipeline
- Properly packaged Lambda functions with dependencies
- Cost-effective serverless resources
- Infrastructure updates without data loss
- Error handling, retries, Parameter Store integration
- AWS Well-Architected Framework principles

Constraints:

- Only environmentSuffix required via CDK context, all other configs need defaults
- Do not modify files outside lib/ or bin/ directories
- Production-ready, deployable with only environmentSuffix parameter

Success Criteria:

- CDK synthesizes without errors
- Pipeline executes end-to-end successfully
- Lambda and API Gateway infrastructure created and integrated
- IAM roles pass least-privilege review
- Rollback works on failure
- CloudWatch captures all activities
- Parameter Store integration verified
- All defaults work with only environmentSuffix provided
- Integration tests can invoke Express endpoints to validate S3 and DynamoDB operations using exported CDK outputs
