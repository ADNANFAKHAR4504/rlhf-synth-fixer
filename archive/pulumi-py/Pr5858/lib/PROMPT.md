# Transaction Processing Pipeline

Hey team,

We need to build a serverless transaction processing pipeline for a fintech startup that processes merchant credit card transactions. They're uploading CSV files with transaction data and need us to validate, store, and monitor these for anomalies with alerts sent out for suspicious activity. I've been asked to create this using Pulumi with Python. The business requirement is pretty strict - all processing must complete within 5 minutes to meet their SLA commitments.

The merchants will be uploading transaction files that need immediate validation and processing. Any anomalies detected need to trigger alerts so their compliance team can review them quickly. Everything needs to be auditable for regulatory requirements, so we're storing all validated transactions with full history.

## What we need to build

Create a serverless transaction processing system using **Pulumi with Python** for a fintech merchant transaction validation and monitoring platform.

### Core Requirements

1. **File Upload Infrastructure**
   - S3 bucket for merchant CSV file uploads
   - Versioning enabled for audit trails
   - 90-day lifecycle policy for cost optimization
   - S3 event notifications for .csv files in /uploads prefix

2. **Transaction Validation**
   - Lambda function triggered by S3 uploads
   - Validates CSV transaction file format
   - Python 3.9 runtime with 512MB memory
   - X-Ray tracing enabled

3. **Data Storage**
   - DynamoDB table for validated transactions
   - Partition key: transaction_id
   - Sort key: timestamp
   - On-demand billing mode
   - DynamoDB Streams enabled with NEW_AND_OLD_IMAGES

4. **Anomaly Detection**
   - Lambda function processing DynamoDB streams
   - Detects suspicious transaction patterns
   - Python 3.9 runtime with 512MB memory
   - X-Ray tracing enabled

5. **Alert System**
   - SNS topic for anomaly notifications
   - Email subscription endpoint configured
   - Integration with anomaly detection Lambda

6. **Merchant API**
   - API Gateway REST API with API key authentication
   - POST /upload endpoint - generates presigned S3 URLs
   - GET /status/{transaction_id} endpoint - checks processing status
   - Lambda function backing both endpoints
   - Python 3.9 runtime with 512MB memory
   - X-Ray tracing enabled

7. **Security and Access Control**
   - IAM roles for all Lambda functions
   - Least privilege policies
   - Proper service-to-service permissions

8. **Monitoring and Logging**
   - CloudWatch Logs for all Lambda functions
   - 7-day retention policy
   - X-Ray distributed tracing

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **S3** for file storage with versioning
- Use **Lambda** for serverless compute (Python 3.9)
- Use **DynamoDB** for transaction data storage
- Use **SNS** for notification alerts
- Use **API Gateway** for REST API endpoints
- Use **IAM** for security and access control
- Use **CloudWatch** for logging and monitoring
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {resource-type}-{purpose}-{environmentSuffix}
- Deploy to **us-east-1** region
- All resources tagged with Environment: production and Project: transaction-processor

### Constraints

- Lambda functions: Python 3.9 runtime, 512MB memory allocation
- Lambda functions: Reserved concurrent executions set to 10
- Lambda functions: X-Ray tracing enabled for debugging
- DynamoDB: On-demand billing mode for cost optimization
- DynamoDB: Streams with NEW_AND_OLD_IMAGES view type
- S3: Versioning enabled with 90-day lifecycle policy
- S3: Events trigger only for .csv files in /uploads prefix
- API Gateway: REST API type with API key authentication
- SNS: Email subscription endpoint for alerts
- CloudWatch: 7-day log retention
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

## Success Criteria

- **Functionality**: All endpoints work correctly, files process within 5 minutes
- **Performance**: Serverless architecture scales automatically
- **Reliability**: Proper error handling and retry logic
- **Security**: Least privilege IAM policies, API key authentication
- **Monitoring**: CloudWatch logs and X-Ray tracing enabled
- **Resource Naming**: All resources include environmentSuffix
- **Cost Optimization**: On-demand billing, lifecycle policies
- **Code Quality**: Python, well-tested, documented

## What to deliver

- Complete Pulumi Python implementation
- S3 bucket with versioning and lifecycle configuration
- Three Lambda functions: validation, anomaly detection, API handler
- DynamoDB table with streams enabled
- SNS topic with subscription
- API Gateway REST API with two endpoints
- IAM roles and policies for all Lambda functions
- CloudWatch log groups with retention policies
- Lambda function code in lambda/ directory
- Unit tests for all components
- Documentation and deployment instructions
