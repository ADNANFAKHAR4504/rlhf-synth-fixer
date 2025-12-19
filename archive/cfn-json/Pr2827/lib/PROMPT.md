# AWS CloudFormation Stack Development Challenge

## Objective
Create a comprehensive CloudFormation template in JSON format that deploys a secure, serverless infrastructure in AWS with specified components and configurations.

## Requirements

### Core Infrastructure Components
1. AWS Lambda Function:
   - Runtime: Python 3.8
   - Triggered via API Gateway and CloudWatch Events
   - Environment variables for configuration
   - Region: us-west-2

2. API Gateway:
   - HTTP interface integration with Lambda
   - CORS enabled for '*' origin
   - Resource policy implementation
   - Proper security configurations

3. DynamoDB Table:
   - Provisioned throughput capacity mode
   - Defined partition and sort keys
   - Encryption at rest

### Security & Access Control
1. KMS Configuration:
   - Encryption keys for sensitive data
   - Key policies and rotation settings

2. IAM Roles:
   - Least privilege principle implementation
   - Separate roles for each service
   - Specific permissions for S3 bucket access

3. S3 Bucket:
   - Versioning enabled
   - VPC endpoint configuration
   - Secure access controls

### Monitoring & Notifications
1. CloudWatch Integration:
   - Logs enabled for all services
   - Event rule for 24-hour Lambda trigger
   - Metrics and alarms configuration

2. SNS Topic:
   - Error notification routing
   - Subscription endpoints

## Additional Requirements
- All resources must be properly tagged for cost tracking
- Use CloudFormation intrinsic functions where appropriate
- Template must pass AWS validation tools
- Implement secure cross-service communication
- Include necessary resource dependencies

## Deliverable
A JSON-formatted CloudFormation template that successfully deploys all specified components while adhering to AWS best practices and security standards.

## Evaluation Criteria
1. Template validation success
2. Successful deployment in us-west-2 region
3. Security compliance
4. Resource configuration accuracy
5. Integration completeness