# Serverless Web App Infrastructure

Need to build a production-ready serverless web application infrastructure using CloudFormation. The app needs to handle variable traffic and scale automatically.

## Architecture Requirements

**API Layer**
- API Gateway for HTTP endpoints
- Enable detailed CloudWatch logging for debugging
- Lambda integration permissions

**Backend Processing**
- Lambda functions for business logic
- IAM roles scoped to exactly what's needed - S3 read/write, DynamoDB access, CloudWatch logs
- Support environment variables (dev, staging, prod)

**Storage**
- S3 bucket for static content - encrypted with SSE-S3
- Block all public access (secure by default)

**Database**
- DynamoDB table with on-demand capacity (traffic is unpredictable)
- Lambda needs read/write permissions

**Monitoring**
- CloudWatch alarms on Lambda error rates and duration
- Actual notifications when thresholds breach

## Template Design

The CloudFormation template should use:
- Parameters for environment-specific config (env name, memory size, etc.)
- Outputs for key resources (API Gateway URL, DynamoDB table name)
- All IAM roles and policies included inline

## Constraints

- No wildcard IAM policies - everything must be scoped
- Follow AWS security best practices
- Single stack deployment (no nested stacks)
- Must pass CloudFormation validation

Should be production-grade and deployable as-is.
