## Mission Statement

Your mission is to act as an **expert AWS Solutions Architect** and generate a TypeScript-based CloudFormation Infrastructure as Code (IaC) solution for a secure, cost-effective, and scalable serverless environment.

## Instructions 

### 1. Analyze the Requirements
Thoroughly review and understand all the provided requirements, constraints, and naming standards. **Do not alter, omit, or change any provided data.**

### 2. Write the Architecture in CloudFormation TypeScript Format
Propose a CloudFormation-based serverless AWS architecture fulfilling all stated requirements and constraints, using TypeScript.

### 3. Specify AWS Services
Explicitly name and configure each AWS service used for every component, including Lambda, API Gateway, S3, DynamoDB, CloudWatch, SNS, IAM, Secrets Manager, and KMS.

### 4. Emphasize Resource Uniqueness & Security Best Practices
- **Resource Naming**: All resources must strictly follow the `'app-purpose-environment-stringSuffix'` naming convention, with a string suffix appended to guarantee uniqueness and prevent already exists errors.
- **Security**: Apply least privilege IAM roles and policies, use AWS KMS for all encryption, and store secrets in Secrets Manager.
- **Cost Optimization & Compliance**: Ensure Lambda costs remain below $10/month each and use auto-scaling for DynamoDB.

### 5. Output Format
**CloudFormation + TypeScript**

## Task Requirements

You are tasked with designing an **IaC solution** for provisioning a secure, cost-effective, and scalable AWS serverless environment using **CloudFormation and TypeScript** for the **"IaC - AWS Nova Model Breaking"** project.

### Core Requirements

- **Region**: Deploy all resources in `us-west-2` (Oregon)
- **Environment**: Staging
- **Objective**: Build serverless infrastructure supporting multiple microservices, adhering to security, cost, and operational best practices.

## Infrastructure Components Required

### 1. Lambda Functions
- TypeScript code with programmatic configuration
- Memory size: 128MB–512MB
- Environment variables for configuration
- CloudWatch logging and alarm on >1000 invocations/hour

### 2. API Gateway
- HTTPS endpoints for each Lambda function

### 3. S3
- Buckets for static files/assets
- Versioning enabled

### 4. DynamoDB
- Primary data store with auto-scaling
- Max 3 tables

### 5. CloudWatch
- Logging for Lambda invocations
- Alarms as specified

### 6. Secrets & Encryption
- Store sensitive data in AWS Secrets Manager
- Encrypt with centralized AWS KMS key

### 7. IAM
- Least privilege roles/policies for all Lambda functions

### 8. SNS
- Topics for system notifications

### 9. Resource Naming
- All resources follow: `app-purpose-environment-stringSuffix`
- Suffix must be appended to avoid naming collisions

### 10. Deployment & Validation
- Use AWS CLI commands for deployment
- Provide post-deployment script to validate all resources are running as expected

## Solution Requirements

### Architecture Structure
- The solution should be in a **single, deployable TypeScript application**
- Include all configuration, resource definitions, and validation logic

### Compliance Standards
- Adhere to security, cost, and operational best practices
- Enforce naming conventions exactly as specified

### Code Quality
- TypeScript implementation, clean and well-documented
- Proper error handling and validation

## Success Criteria

- **Security**: Least privilege, encryption everywhere, secure secret management
- **Cost Optimization**: Lambda budget adherence, DynamoDB auto-scaling
- **Reliability**: CloudWatch monitoring, alarms, validation scripts
- **Uniqueness**: All resource names have a string suffix to prevent conflicts
- **Operational Excellence**: Automated validation and well-documented code

## Expected Deliverables

- Complete TypeScript CloudFormation stack implementation
- Resource definitions for Lambda, API Gateway, S3, DynamoDB, CloudWatch, SNS, IAM, Secrets Manager, KMS
- Resource naming with a string suffix for uniqueness
- Post-deployment validation script using AWS CLI
- Documentation for deployment and validation

---