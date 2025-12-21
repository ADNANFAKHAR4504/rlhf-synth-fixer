# Infrastructure as Code Challenge: TAP Stack

## Objective
Create a CDK TypeScript stack that provisions basic AWS resources for a data processing application.

## Requirements

### Core Infrastructure
1. **S3 Bucket** - For storing application data
   - Should have appropriate encryption and access controls
   - Different configuration for LocalStack vs AWS

2. **Lambda Function** - For data processing
   - Node.js 18.x runtime
   - Environment variables for bucket name and LocalStack detection
   - Basic processing logic with logging

3. **IAM Role** - For Lambda execution permissions
   - Basic Lambda execution role
   - S3 read/write permissions

### Technical Requirements
1. **LocalStack Compatibility**
   - Detect LocalStack environment automatically
   - Use appropriate configurations for local development
   - Different removal policies and naming strategies

2. **Stack Naming**
   - Use PascalCase naming convention (TapStack)
   - Support environment suffix via CDK context

3. **Outputs**
   - Bucket name
   - Lambda function ARN
   - IAM role ARN

### Testing
- Unit tests for the stack construction
- Coverage for LocalStack detection logic
- Verification of resource creation

## Constraints
- Must work with both AWS and LocalStack
- Follow AWS CDK best practices
- Include proper error handling and logging
