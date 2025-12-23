Hey team,

We need to build a serverless ETL pipeline for processing banking transaction files. The business team has been receiving daily batches of transaction data that need to be processed, validated, and stored for downstream analytics. Currently this is being done manually and it's becoming a bottleneck as transaction volumes grow.

The compliance team requires that all banking data be encrypted at rest and in transit, with proper audit trails for every file processed. We also need to handle failures gracefully since missing or incorrectly processed transactions could lead to serious regulatory issues.

I've been asked to create this infrastructure using **Terraform with HCL** to provision a fully serverless solution on AWS. The architecture should be cost-effective, automatically scalable, and require minimal operational overhead since we're a small team.

## What we need to build

Create a serverless ETL pipeline using **Terraform with HCL** that processes banking transaction files uploaded to S3, transforms the data, and stores it for downstream consumption.

### Core Requirements

1. **File Ingestion**
   - S3 bucket for incoming transaction files (CSV or JSON format)
   - Automatic triggering when new files arrive
   - Support for files up to 100MB in size
   - Encryption at rest using AWS managed keys

2. **Data Processing**
   - Lambda function to process transaction files
   - Extract, transform, and validate transaction records
   - Handle malformed records gracefully with error logging
   - Calculate transaction summaries and aggregations
   - Process files within 5 minutes of arrival

3. **Error Handling and Monitoring**
   - Dead letter queue for failed processing attempts
   - CloudWatch logs for all Lambda executions
   - CloudWatch alarms for processing failures
   - Retry logic for transient failures (up to 3 attempts)
   - Alert via SNS when critical errors occur

4. **Output and Storage**
   - S3 bucket for processed transaction data
   - Organize output by date partition (year/month/day)
   - Store processing metadata and audit logs
   - Maintain processed file inventory

5. **Security and Compliance**
   - All S3 buckets encrypted with AES-256
   - Lambda execution role with least privilege IAM permissions
   - Block public access on all S3 buckets
   - Enable versioning on output buckets
   - VPC endpoints for secure AWS service access (optional enhancement)

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **S3** for file storage (input and output buckets)
- Use **Lambda** for serverless compute (Node.js 18+ or Python 3.11+)
- Use **EventBridge** or **S3 Event Notifications** for triggering
- Use **SQS** for dead letter queue
- Use **CloudWatch** for logging and monitoring
- Use **IAM** for access control and permissions
- Resource names must include **environmentSuffix** variable for uniqueness
- Follow naming convention: `etl-{resource-type}-${var.environmentSuffix}`
- Deploy to **us-east-1** region
- Lambda timeout should be sufficient for file processing (300 seconds recommended)
- Configure appropriate Lambda memory (512MB minimum for file processing)

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (DO NOT use RETAIN policies on S3 buckets)
- Use `force_destroy = true` on S3 buckets to allow clean teardown
- Lambda functions must handle Node.js 18+ AWS SDK v3 (import from @aws-sdk/client-*)
- Include proper error handling and logging in Lambda code
- All IAM roles must follow least privilege principle
- Resource names must include environmentSuffix for multi-environment support

### Constraints

- Serverless only - no EC2 instances or always-on infrastructure
- Cost-optimized - use S3 Intelligent-Tiering for storage cost savings
- No hardcoded values - use Terraform variables for configurability
- Lambda code should be production-ready with comprehensive error handling
- Must handle concurrent file uploads gracefully
- All resources must be created in a single region (no cross-region dependencies)
- Must be fully automated - no manual configuration steps

## Success Criteria

- **Functionality**: Files uploaded to input bucket trigger Lambda processing automatically
- **Performance**: Process 100MB files within 5 minutes with appropriate memory allocation
- **Reliability**: Failed processing attempts route to DLQ with retry logic
- **Security**: All data encrypted at rest, least privilege IAM roles, no public access
- **Monitoring**: CloudWatch logs capture all processing steps and errors
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Destroyability**: Complete infrastructure can be destroyed with `terraform destroy` (no orphaned resources)
- **Code Quality**: Production-ready HCL with proper formatting and documentation

## What to deliver

- Complete Terraform HCL implementation in lib/ directory
- S3 buckets for input, output, and audit logs
- Lambda function code for ETL processing (in lib/lambda/ directory)
- IAM roles and policies with least privilege access
- EventBridge rules or S3 event notifications for triggering
- SQS dead letter queue for failed messages
- CloudWatch log groups and alarms
- Terraform variables file with environmentSuffix support
- Unit tests for Lambda functions
- Integration tests for the ETL pipeline
- README.md with deployment instructions and architecture overview
