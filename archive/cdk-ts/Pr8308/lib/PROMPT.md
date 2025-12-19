# PROMPT

## Overview

You are an expert AWS Solutions Architect with deep expertise in Infrastructure as Code (IaC) using AWS CDK (TypeScript). Your task is to design and implement a secure serverless infrastructure for processing user data.

## Global Requirements

- **Region**: The entire infrastructure must be deployed in the **us-east-1** AWS region
- **Naming Convention**: All resources must follow company naming conventions, starting with the prefix **Corp**
- **Security**: IAM roles must be utilized for resource permissions rather than inline policies

## Architecture Requirements

Your AWS CDK TypeScript project must comply with the following detailed requirements:

### 1. S3 Bucket for User Data

- **Bucket Name**: Create an S3 bucket named `CorpUserDataBucket`
- **Versioning**: Ensure versioning is enabled on this S3 bucket for data recovery and integrity

### 2. AWS Lambda Function

- **Purpose**: Define an AWS Lambda function responsible for processing incoming user data
- **Runtime**: Use Node.js 14.x as the Lambda runtime
- **Functionality**: Deploy a sample function that logs input data (the actual processing logic can be minimal for this infrastructure definition)
- **IAM Permissions**: The Lambda function must have an IAM role (not inline policies) that grants it the appropriate permissions to:
  - Write data to the `CorpUserDataBucket` S3 bucket
  - Write logs to CloudWatch

### 3. API Gateway with IP Whitelisting

- **Integration**: Set up an API Gateway to trigger the Lambda function from HTTP requests
- **Lambda Integration**: Ensure the API Gateway is properly integrated with the Lambda function
- **Security (Critical)**: Secure the API Gateway with IP Whitelisting by:
  - Configuring the API Gateway (e.g., using a Resource Policy) to allow access only from specified IP ranges
  - Defining a parameter in your CDK stack to accept these allowed IP CIDR blocks

## Success Criteria

The solution should demonstrate:

1. Proper CDK TypeScript implementation
2. All resources following Corp naming convention
3. S3 bucket with versioning enabled
4. Lambda function with appropriate IAM role
5. API Gateway with Lambda integration
6. IP whitelisting security implementation
7. Deployment to us-east-1 region

