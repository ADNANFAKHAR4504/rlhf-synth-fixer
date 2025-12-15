# Ideal Response: Secure Financial Data Processing Pipeline

This document describes the ideal CloudFormation YAML template for a secure financial data processing pipeline with complete network isolation, customer-managed encryption, and comprehensive audit logging.

## Template Structure

The ideal template should include the following components:

### 1. VPC and Networking (Private Only)
- **VPC**: Single VPC with CIDR 10.0.0.0/16, DNS support enabled
- **Private Subnets**: Three private subnets across different availability zones (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
- **Route Table**: Single route table for all private subnets (no routes to internet)
- **VPC Endpoints**: Gateway endpoints for S3 and DynamoDB to enable access without internet
- **Security Group**: Security group allowing only internal VPC traffic (CIDR 10.0.0.0/16)

### 2. KMS Customer-Managed Key
- **KMS Key**: Customer-managed key with proper key policy allowing account root access
- **KMS Alias**: Alias for easy reference (alias/tapstack-financial-data-key)
- **Key Policy**: Should allow account root full access, with proper service permissions

### 3. S3 Buckets (Input and Output)
- **Input Bucket**: 
  - KMS encryption using customer-managed key
  - Versioning enabled
  - Lifecycle policy for non-current version expiration (365 days)
  - Public access block configuration (all blocks enabled)
  
- **Output Bucket**:
  - KMS encryption using customer-managed key
  - Versioning enabled
  - Lifecycle policy for non-current version expiration (365 days)
  - Public access block configuration (all blocks enabled)

### 4. DynamoDB Table
- **Table Name**: tap-transaction-metadata
- **Key Schema**: Composite key (transactionId as HASH, timestamp as RANGE)
- **Billing Mode**: PAY_PER_REQUEST (on-demand)
- **Encryption**: KMS encryption at rest using customer-managed key
- **Tags**: Environment, Project, ManagedBy tags

### 5. Lambda Function
- **Function Name**: StackName-data-processor
- **Runtime**: Python 3.11
- **Handler**: index.handler
- **VPC Configuration**: Deployed in all three private subnets with security group
- **Environment Variables**: OUTPUT_BUCKET_NAME, METADATA_TABLE_NAME
- **Code**: Inline Python code that:
  - Processes S3 events from input bucket
  - Copies objects to output bucket
  - Writes metadata to DynamoDB table
- **Timeout**: 60 seconds
- **Memory**: 256 MB

### 6. S3 Bucket Notification
- **Custom Resource**: Lambda function to configure S3 bucket notifications (breaks circular dependency)
- **Notification Config**: Triggers Lambda on s3:ObjectCreated:* events
- **Permission**: Lambda permission for S3 to invoke the function

### 7. IAM Roles and Policies
- **Lambda Execution Role**:
  - Assume role policy for Lambda service
  - VPC access managed policy
  - Inline policy with least privilege:
    - CloudWatch Logs permissions (CreateLogGroup, CreateLogStream, PutLogEvents)
    - S3 permissions (GetObject, PutObject) on input and output buckets only
    - DynamoDB permissions (PutItem, UpdateItem) on metadata table only
    - KMS permissions (Encrypt, Decrypt, GenerateDataKey) on customer key only
    - Explicit deny for dangerous actions (DeleteBucket, PutBucketPolicy, DisableKey, ScheduleKeyDeletion, DeleteTable)

- **S3 Notification Config Role**:
  - Assume role policy for Lambda service
  - Basic execution role managed policy
  - Inline policy for S3 bucket notification configuration

### 8. CloudWatch Logs
- **Log Group**: /aws/lambda/FunctionName
- **Retention**: 3653 days (approximately 10 years, exceeding 7-year requirement)
- **Tags**: Environment, Project, ManagedBy tags

### 9. CloudWatch Alarms
- **Lambda Error Alarm**: 
  - Monitors Lambda Errors metric
  - Threshold: 1 error
  - Period: 60 seconds
  - Evaluation periods: 1
  
- **Unauthorized Access Alarm**:
  - Metric filter on log group for "AccessDenied" pattern
  - Custom namespace: TapSecurity
  - Threshold: 1 occurrence
  - Period: 300 seconds

### 10. Outputs
The template should output:
- VpcId
- InputBucketName
- OutputBucketName
- TransactionMetadataTableName
- DataProcessorFunctionName
- DataKmsKeyArn

## Key Security Features

1. **Complete Network Isolation**: No internet gateways, no NAT gateways, only VPC endpoints
2. **Customer-Managed Encryption**: All data encrypted with customer-managed KMS keys
3. **Least Privilege IAM**: Minimal permissions with explicit denies for dangerous operations
4. **Comprehensive Logging**: 7+ year log retention for audit compliance
5. **Monitoring**: Alarms for errors and unauthorized access attempts
6. **Versioning and Lifecycle**: S3 versioning with lifecycle policies for compliance

## Implementation Notes

- The template uses a Custom Resource Lambda to configure S3 bucket notifications, avoiding circular dependencies
- All resources are properly tagged for cost tracking and resource management
- The Lambda function code is inline for simplicity, but could be externalized for production
- Security groups only allow internal VPC traffic (no inbound rules needed for Lambda)
- VPC endpoints use Gateway endpoints (not Interface endpoints) for cost efficiency with S3 and DynamoDB
