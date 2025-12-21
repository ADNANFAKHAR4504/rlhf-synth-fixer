# Infrastructure Provisioning Requirements

## Overview
Create a CDK TypeScript stack that provisions basic AWS infrastructure including S3 storage, Lambda processing, and IAM roles with LocalStack compatibility.

## Requirements

### Core Components
1. **S3 Bucket** - For application data storage
   - Encryption enabled (S3-managed)
   - Block public access
   - Versioning (except LocalStack)
   - Auto-delete objects in LocalStack

2. **Lambda Function** - For data processing
   - Node.js 18.x runtime
   - Inline code with basic event processing
   - Environment variables for bucket name and LocalStack detection

3. **IAM Role** - For Lambda execution
   - Basic execution role
   - S3 read/write permissions via bucket grants

### LocalStack Compatibility
- Detect LocalStack environment via environment variables
- Use DESTROY removal policy for LocalStack resources
- Handle bucket naming differences between LocalStack and AWS

### Outputs
- Bucket name
- Lambda function ARN  
- IAM role ARN

## Technical Specifications
- **Platform**: AWS CDK v2
- **Language**: TypeScript
- **Stack Name**: TapStack
- **Environment**: Support both AWS and LocalStack
- **Testing**: Unit tests required
