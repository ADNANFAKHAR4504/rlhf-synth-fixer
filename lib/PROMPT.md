# Serverless Web App Infrastructure

Need to build a production-ready serverless web application infrastructure using CloudFormation. The app needs to handle variable traffic and scale automatically.

## Core Architecture

**API Gateway connected to Lambda functions**
- HTTP endpoints that trigger Lambda on request
- Enable detailed CloudWatch logging for debugging
- Lambda integration permissions configured

**Lambda functions that access DynamoDB and S3**
- Business logic that reads from and writes to DynamoDB table
- Functions write static content to S3 bucket
- IAM roles scoped to exactly what's needed - S3 read/write, DynamoDB access, CloudWatch logs
- Support environment variables for dev, staging, prod deployments

**S3 bucket for static content**
- Encrypted with SSE-S3
- Lambda functions write files here
- Block all public access - secure by default

**DynamoDB table for persistent storage**
- On-demand capacity since traffic is unpredictable
- Lambda functions read and write data here

**CloudWatch monitoring integrated with Lambda**
- Alarms watch Lambda error rates and duration
- Notifications sent when thresholds breach

## Template Design

The CloudFormation template should:
- Use parameters for environment-specific config like env name and memory size
- Output key resources like API Gateway URL and DynamoDB table name
- Include all IAM roles and policies inline

## Constraints

- No wildcard IAM policies - everything must be scoped
- Follow AWS security best practices
- Single stack deployment - no nested stacks
- Must pass CloudFormation validation

Should be production-grade and deployable as-is.
