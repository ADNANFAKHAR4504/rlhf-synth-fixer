# Multi-Region Data Analytics Infrastructure

Hey team,

We need to build out a comprehensive data analytics infrastructure that spans multiple AWS regions. The business has strict data residency requirements - we need to process data locally in three regions: US East (us-east-1), Europe West (eu-west-1), and Asia Pacific Southeast (ap-southeast-1). Each region needs to operate independently with its own processing pipeline, but the architecture should be identical across all three.

I've been asked to create this using **CDKTF with Python**. The data science team is dealing with growing volumes of data uploads, and they need a reliable, scalable system that can handle real-time ingestion and processing without data crossing regional boundaries.

Right now, we don't have any automated processing in place - everything is manual, which is error-prone and doesn't scale. We need event-driven architecture where new data uploads automatically trigger processing jobs, with proper error handling and visibility into what's happening across all three regions.

## What we need to build

Create a multi-region data analytics platform using **CDKTF with Python** that processes data independently in three AWS regions with identical infrastructure in each region.

### Core Requirements

1. **Multi-Region Deployment**
   - Deploy identical infrastructure to us-east-1, eu-west-1, and ap-southeast-1
   - Use CDKTF loops or iterations to deploy efficiently across all three regions
   - Each region operates independently with complete isolation
   - No cross-region data transfer or dependencies

2. **Regional VPC Infrastructure**
   - Create isolated VPC in each region with non-overlapping CIDR blocks
   - us-east-1: 10.0.0.0/16
   - eu-west-1: 10.1.0.0/16
   - ap-southeast-1: 10.2.0.0/16
   - Each VPC completely isolated from others

3. **S3 Data Storage**
   - Deploy S3 bucket in each region for raw data storage
   - Enable versioning on all buckets
   - Use SSE-S3 encryption for data at rest
   - Implement lifecycle policy to transition objects to Glacier after 90 days
   - Bucket names must include region code suffix (e.g., analytics-bucket-us-east-1-{environmentSuffix})

4. **Lambda ETL Processing**
   - Create Lambda function in each region for ETL processing
   - Function reads from regional S3 bucket and writes processed data back to S3
   - Use Python 3.11 runtime
   - Configure 1024MB memory allocation
   - Include environment variables for region-specific configuration
   - Lambda code should handle S3 event data and process accordingly

5. **DynamoDB Job Metadata**
   - Create DynamoDB table in each region to track processing job metadata
   - Use on-demand billing mode
   - Enable point-in-time recovery
   - Add global secondary index for querying by timestamp
   - Table stores job status, timestamps, input/output paths

6. **SQS Event Queue**
   - Implement SQS queue in each region for decoupling ingestion from processing
   - Set visibility timeout to 300 seconds
   - Configure dead-letter queue for failed messages
   - Maximum 3 receive attempts before moving to DLQ

7. **EventBridge Automation**
   - Configure EventBridge rule in each region
   - Trigger Lambda function when new objects uploaded to S3
   - Pattern should match S3 object creation events

8. **CloudWatch Monitoring**
   - Create CloudWatch dashboard in each region
   - Monitor Lambda invocations, errors, and duration metrics
   - Track SQS queue depth and DLQ messages
   - Include alarms for error rates exceeding threshold

9. **Error Handling**
   - Configure SQS dead-letter queue after 3 failed processing attempts
   - Lambda functions must include proper error handling and logging
   - Failed jobs tracked in DynamoDB with error details

10. **Stack Outputs**
    - Output S3 bucket names for each region
    - Output Lambda function ARNs for each region
    - Output DynamoDB table names for each region
    - Output SQS queue URLs for each region

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **S3** for data lake storage with lifecycle policies
- Use **Lambda** for ETL processing (Python 3.11, 1024MB memory)
- Use **DynamoDB** for metadata tracking with on-demand billing
- Use **SQS** for event decoupling with dead-letter queues
- Use **EventBridge** for S3 event triggering
- Use **CloudWatch** for monitoring and dashboards
- Use **VPC** for network isolation per region
- Resource names must include **environmentSuffix** for uniqueness
- Resource names must include region code as suffix (e.g., -us-east-1, -eu-west-1, -ap-southeast-1)
- Deploy to exactly three regions: us-east-1, eu-west-1, ap-southeast-1
- Use CDKTF iteration patterns for efficient multi-region deployment

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain policies, no DeletionProtection)
- All resource names must include **environmentSuffix** variable for CI/CD compatibility
- All resource names must include region code suffix for multi-region uniqueness
- Lambda functions must use Python 3.11 runtime (Node.js 18+ has AWS SDK issues)
- DynamoDB tables must use on-demand billing (no provisioned capacity)
- S3 buckets must have versioning enabled
- All IAM roles must follow least-privilege principles with no wildcard permissions
- CloudWatch Logs retention must be exactly 30 days for all log groups
- All resources must be independently deployable and destroyable per region

### Constraints

- Each region must have isolated VPC with non-overlapping CIDR blocks (10.0.0.0/16, 10.1.0.0/16, 10.2.0.0/16)
- All S3 buckets must use SSE-S3 encryption
- Lambda functions must use Python 3.11 runtime with 1024MB memory
- DynamoDB tables must use on-demand billing mode with point-in-time recovery enabled
- All IAM roles must follow least-privilege principles (no wildcard permissions)
- Resource naming pattern: {resource-type}-{region-code}-{environmentSuffix}
- All Lambda functions must have environment variables for region-specific configuration
- CloudWatch Logs retention exactly 30 days
- All resources must be destroyable for testing

## Success Criteria

- **Multi-Region Deployment**: Infrastructure successfully deployed to all three regions (us-east-1, eu-west-1, ap-southeast-1)
- **Functionality**: S3 uploads trigger Lambda processing via EventBridge in each region
- **Data Storage**: S3 buckets created with versioning, encryption, and lifecycle policies
- **Processing**: Lambda functions process data and update DynamoDB metadata
- **Event Handling**: SQS queues properly decouple ingestion from processing
- **Error Handling**: Failed processing attempts moved to DLQ after 3 retries
- **Monitoring**: CloudWatch dashboards display metrics for Lambda, SQS, and errors
- **Isolation**: Each region operates independently with no cross-region dependencies
- **Security**: IAM roles follow least-privilege, encryption enabled, no wildcard permissions
- **Resource Naming**: All resources include environmentSuffix and region code
- **Code Quality**: Clean Python code, well-tested, documented
- **Outputs**: All region-specific resource identifiers available as stack outputs

## What to deliver

- Complete CDKTF Python implementation using iteration for multi-region deployment
- VPC infrastructure with isolated networks per region (10.0.0.0/16, 10.1.0.0/16, 10.2.0.0/16)
- S3 buckets with versioning, SSE-S3 encryption, and Glacier lifecycle policies in all regions
- Lambda ETL functions (Python 3.11, 1024MB) for data processing in all regions
- DynamoDB tables with on-demand billing and global secondary index in all regions
- SQS queues with dead-letter queues (3 retry limit) in all regions
- EventBridge rules for S3 event triggering in all regions
- CloudWatch dashboards and alarms in all regions
- IAM roles with least-privilege permissions
- Stack outputs for all regional resources
- Unit tests for all components
- Documentation and deployment instructions
