Hey team,

We need to build a serverless fraud detection system for a fintech startup that handles customer transaction data in real-time. The business has asked us to create this using Pulumi with Python. They need the system to handle variable workloads efficiently while maintaining strict data privacy and processing speed requirements.

The startup is experiencing rapid growth and needs a scalable solution that can process transactions as they come in, analyze them for fraud patterns, and generate comprehensive reports. The architecture should be fully serverless to minimize operational overhead and costs while maximizing scalability.

The system needs to be deployed in the us-east-2 region and should integrate multiple AWS services to create a cohesive fraud detection pipeline. We need to ensure that all components work together seamlessly while maintaining high security standards.

## What we need to build

Create a serverless fraud detection system using **Pulumi with Python** for processing customer transactions in real-time, analyzing fraud patterns, and generating automated reports.

### Core Requirements

1. API Gateway Configuration
   - Create a REST API with two endpoints: POST /transactions for submission and GET /transactions/{id} for retrieval
   - Implement request throttling at 1000 requests per second
   - Ensure HTTPS endpoints for secure communication

2. Transaction Processing
   - Deploy a Lambda function for transaction processing that validates incoming data
   - Store validated transactions in DynamoDB
   - Use Python 3.11 runtime with reserved concurrent executions of at least 100
   - Maximum timeout of 5 minutes (300 seconds)
   - Configure VPC connectivity for secure processing

3. Data Storage
   - Set up a DynamoDB table named 'transactions'
   - Partition key: 'transactionId' (string)
   - Sort key: 'timestamp' (number)
   - Use on-demand billing mode (PAY_PER_REQUEST)
   - Enable DynamoDB streams for audit logging and change data capture

4. Fraud Analysis
   - Configure a second Lambda function triggered by DynamoDB streams
   - Analyze transactions for fraud patterns in real-time
   - Same runtime and concurrency settings as transaction processor

5. Report Generation
   - Implement a third Lambda function that generates daily fraud reports
   - Store reports in S3 bucket with server-side encryption enabled
   - Configure appropriate lifecycle policies for report retention

6. S3 Storage
   - Create an S3 bucket for storing fraud analysis reports
   - Enable server-side encryption
   - Configure appropriate lifecycle policies

7. IAM Security
   - Set up appropriate IAM roles and policies for all Lambda functions
   - Follow least privilege access principles
   - Ensure each function has only the permissions it needs

8. Monitoring and Logging
   - Configure CloudWatch log groups for each Lambda function
   - Set 7-day retention for all logs
   - Add CloudWatch alarms for Lambda errors exceeding 1% error rate

9. Stack Outputs
   - Export the API Gateway endpoint URL
   - Export the S3 bucket name

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use AWS Lambda for serverless compute
- Use API Gateway for REST API endpoints
- Use DynamoDB for transaction storage with streams enabled
- Use S3 for report storage
- Use CloudWatch for logging and monitoring
- Use IAM for access control
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {resource-type}-{purpose}-{environmentSuffix}
- Deploy to **us-east-2** region

### Constraints

- Lambda functions must have reserved concurrent executions of at least 100
- DynamoDB tables must use on-demand billing mode (PAY_PER_REQUEST)
- All Lambda functions must use Python 3.11 runtime
- API Gateway must implement request throttling at 1000 requests per second
- Lambda functions must have a maximum timeout of 5 minutes (300 seconds)
- DynamoDB streams must be enabled for audit logging
- All resources must be tagged with 'Environment' and 'CostCenter' tags
- Lambda functions must have VPC connectivity for secure processing
- S3 bucket must have server-side encryption
- IAM policies must follow least privilege access
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

## Success Criteria

- **Functionality**: API endpoints accessible via HTTPS, automated transaction processing, real-time fraud analysis, daily report generation
- **Performance**: System handles variable workloads efficiently with 1000 req/s throttling
- **Reliability**: Reserved concurrency ensures consistent performance, DynamoDB streams provide audit trail
- **Security**: VPC connectivity for Lambda, encrypted S3 storage, least privilege IAM policies, all resources properly tagged
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: Clean Python code, well-tested, documented

## What to deliver

- Complete Pulumi Python implementation with all AWS resources
- API Gateway REST API with POST /transactions and GET /transactions/{id} endpoints
- Three Lambda functions: transaction processor, fraud analyzer, report generator
- DynamoDB table with streams enabled
- S3 bucket with encryption
- IAM roles and policies
- CloudWatch log groups and alarms
- Lambda function code for all three functions
- Unit tests for all components
- Documentation and deployment instructions
- Stack outputs for API Gateway URL and S3 bucket name
