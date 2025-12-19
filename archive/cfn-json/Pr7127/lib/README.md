# Multi-Environment Data Analytics Platform - CloudFormation Implementation

This repository contains CloudFormation templates (JSON format) for deploying a complete multi-environment data analytics platform across AWS accounts using StackSets.

## Architecture Overview

The infrastructure is organized into modular components:

- **Master Template** (`template.json`): Orchestrates deployment via CloudFormation StackSets
- **VPC Nested Stack** (`vpc-stack.json`): Provisions network infrastructure with 3 AZs
- **Security Nested Stack** (`security-stack.json`): Manages IAM roles and policies
- **Application Nested Stack** (`app-stack.json`): Deploys S3, Lambda, DynamoDB, CloudWatch
- **Custom Resources**: Lambda-backed validation for bucket policies
- **CloudFormation Macro**: Automatic tag injection based on account ID
- **Service Catalog**: Self-service provisioning for developers

## Prerequisites

1. **AWS Organizations Setup**
   - Management account with StackSets enabled
   - Cross-account IAM roles configured
   - Target accounts for development, staging, production

2. **AWS CLI Configuration**
   - AWS CLI 2.x installed
   - Credentials configured with AdministratorAccess
   - Appropriate IAM permissions for StackSets

3. **S3 Bucket for Templates**
   - Create S3 bucket to host nested stack templates
   - Upload all JSON templates to this bucket
   - Enable versioning on the bucket

4. **Parameter Store Setup**
   - Create environment-specific parameters before deployment
   - Path format: `/analytics/{environment}/*`

## Deployment Instructions

### Step 1: Deploy CloudFormation Macro (One-Time Setup)

The macro must be deployed before using it in other templates:

