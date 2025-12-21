# TAP Infrastructure Stack

## Objective
Create a comprehensive AWS CDK TypeScript infrastructure stack for a TAP (Test Automation Platform) application that includes:

- S3 bucket for data storage
- Lambda function for processing
- IAM roles and permissions
- LocalStack compatibility for development

## Requirements

### Core Infrastructure
1. **S3 Bucket**: For storing application data with proper encryption and versioning
2. **Lambda Function**: For processing events with environment variables
3. **IAM Role**: For Lambda execution with appropriate permissions
4. **Outputs**: Export key resource identifiers

### LocalStack Compatibility
- Detect LocalStack environment automatically
- Use appropriate configurations for local development
- Handle bucket naming differences between AWS and LocalStack
- Set proper removal policies for development vs production

### Security
- Enable S3 encryption
- Block public access on S3 bucket
- Use least privilege IAM policies
- Follow AWS security best practices

### Configuration
- Support environment suffixes
- Proper resource naming conventions
- Environment-specific settings
