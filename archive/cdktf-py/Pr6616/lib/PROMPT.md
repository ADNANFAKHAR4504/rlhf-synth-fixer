# Transaction Processing Pipeline Infrastructure

Hey team,

We've been asked to build infrastructure for a financial analytics company that processes daily transaction reports from partner banks. The business needs a serverless pipeline that can handle file uploads, validate CSV data against schemas, orchestrate multi-stage processing workflows, and maintain compliance audit trails. This needs to scale to handle 10,000 daily uploads with sub-second validation times.

I've been tasked with creating this infrastructure using **CDKTF with Python**. The system needs to be fully serverless, cost-optimized, and handle error scenarios gracefully. The business has been clear that this needs robust error handling and compliance tracking since we're dealing with financial data.

The current state is manual - banks are emailing CSV files and the team is processing them by hand. This doesn't scale and creates compliance risks. We need an automated pipeline that validates on upload, orchestrates processing steps, and notifies downstream systems when files are ready.

## What we need to build

Create a serverless transaction processing pipeline using **CDKTF with Python** for processing financial transaction reports from partner banks.

### Core Requirements

1. **File Upload API**
   - API Gateway REST API with POST endpoint at /upload
   - Accept multipart/form-data for CSV file uploads
   - Request validation for required headers and body schema
   - Access logging to CloudWatch with custom log format
   - Usage plans with 1000 requests per day quota

2. **File Validation**
   - Lambda function to validate CSV files against predefined schema
   - Store valid files in S3 bucket
   - ARM64 architecture with 512MB memory
   - Container image deployment from ECR
   - X-Ray tracing enabled

3. **Processing Orchestration**
   - Step Functions Express workflow triggered on S3 object creation
   - States for validation, processing, and notification
   - Error handling states routing to dead letter queue
   - Retry logic with exponential backoff

4. **Data Transformation**
   - Lambda function reading from S3 and writing to DynamoDB
   - Transform transaction data for analytics
   - ARM64 architecture, 512MB memory, container image
   - X-Ray tracing enabled

5. **Notification System**
   - Lambda function sending processing results to SNS topic
   - Notify downstream consumers when processing completes
   - ARM64 architecture, 512MB memory, container image
   - X-Ray tracing enabled

6. **Data Storage**
   - DynamoDB table for processing status tracking
   - DynamoDB table for transformed transaction data
   - Global secondary index on timestamp for queries
   - On-demand billing mode with point-in-time recovery

7. **Error Handling**
   - SQS dead letter queue for failed processing
   - CloudWatch alarms for Lambda errors exceeding 5% in 5-minute windows
   - Step Functions error states routing failures to DLQ

8. **Security and Access**
   - IAM roles with least privilege for each Lambda function
   - IAM role for Step Functions execution
   - Proper resource-based policies

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **API Gateway** for REST API endpoints
- Use **Lambda** for serverless compute (3 functions total)
- Use **Step Functions** for workflow orchestration
- Use **S3** for file storage
- Use **DynamoDB** for state tracking and data storage
- Use **SNS** for notifications to downstream systems
- Use **SQS** for dead letter queue
- Use **CloudWatch** for logging and alarms
- Use **IAM** for security roles and policies
- Use **ECR** for Lambda container images
- Use **X-Ray** for distributed tracing
- Deploy to **us-east-1** region
- Resource names must include **environment_suffix** for uniqueness
- Follow naming convention: `{resource-type}-{purpose}-${environment_suffix}`
- All resources must be destroyable (no Retain deletion policies)

### Constraints

- Lambda functions must use ARM64 architecture with 512MB memory allocation
- Lambda functions must use container images stored in ECR
- Lambda functions must have X-Ray tracing enabled
- Step Functions must use Express workflows for cost optimization
- DynamoDB tables must use on-demand billing mode
- DynamoDB tables must have point-in-time recovery enabled
- API Gateway must use REST API type with request validation
- API Gateway must implement usage plans with 1000 requests per day quota
- CloudWatch Logs retention set to 7 days
- Step Functions must implement retry logic with exponential backoff
- All resources tagged with Environment, Application, and CostCenter tags
- All Lambda functions have IAM roles with least privilege access
- CloudWatch alarms trigger when Lambda error rate exceeds 5% in 5-minute windows

## Success Criteria

- **Functionality**: Complete serverless pipeline handling file upload, validation, processing, and notification
- **Performance**: Handle 10,000 daily file uploads with sub-second validation response times
- **Reliability**: Error handling with retry logic, dead letter queues, and CloudWatch alarms
- **Security**: Least privilege IAM roles, request validation, proper resource policies
- **Resource Naming**: All resources include environment_suffix for unique identification
- **Compliance**: Audit trails through CloudWatch logging and DynamoDB tracking
- **Code Quality**: Python CDKTF code, well-tested, documented with deployment instructions

## What to deliver

- Complete CDKTF Python implementation
- API Gateway REST API with /upload endpoint
- Three Lambda functions (validation, transformation, notification)
- Step Functions Express workflow with error handling
- S3 bucket for file storage
- Two DynamoDB tables (status tracking, transformed data) with GSI
- SNS topic for notifications
- SQS dead letter queue
- CloudWatch alarms for error monitoring
- IAM roles and policies for all services
- Unit tests for all components
- Integration tests
- Documentation and deployment instructions in README.md