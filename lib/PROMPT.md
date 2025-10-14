You are an expert AWS Infrastructure Engineer. Create infrastructure using CloudFormation with JSON format.

Design and implement a HIPAA-compliant healthcare data processing infrastructure that handles patient data securely and maintains comprehensive audit logs.

## Requirements

Create a CloudFormation template in JSON format with the following components:

1. S3 bucket for patient data storage with:
   - Server-side encryption (SSE-S3)
   - Versioning enabled
   - Block public access enabled
   - Lifecycle policies for data retention
   - Bucket logging enabled

2. KMS key for encryption management:
   - Customer managed CMK
   - Key rotation enabled
   - Appropriate key policy

3. Lambda function for data processing:
   - Process patient data from S3
   - Use Node.js 20.x runtime
   - Environment variables from SSM parameters
   - VPC integration for secure networking

4. CloudWatch Logs with:
   - Log groups for Lambda execution
   - Retention period of 14 days
   - Log encryption

5. CloudTrail for API audit logging:
   - Multi-region trail
   - S3 bucket for trail logs
   - Log file validation enabled
   - CloudWatch Logs integration

6. VPC with secure networking:
   - Private subnets in 2 availability zones
   - VPC endpoints for S3 and CloudWatch
   - Security groups with restrictive rules

7. IAM roles and policies:
   - Lambda execution role with least privilege
   - S3 bucket policies restricting access
   - CloudTrail role for logging

8. SNS topic for alerting:
   - Encryption enabled
   - Notification for processing errors

9. DynamoDB table for audit trail:
   - Point-in-time recovery enabled
   - Encryption at rest
   - On-demand billing

10. SSM parameters for secure configuration storage

ALL resource names MUST include the environmentSuffix parameter using the pattern: {resource-type}-${EnvironmentSuffix}

Region: us-east-1

Provide the complete CloudFormation template as a single JSON code block.
