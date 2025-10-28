# Media Processing Pipeline for Japanese Streaming Service

Hey team,

We've been asked to build out a high-performance media processing pipeline for a Japanese streaming service that needs to handle real-time content processing. The business is expanding their operations and needs a robust infrastructure that can handle video transcoding, thumbnail generation, and content delivery at scale while meeting Japanese market compliance requirements.

The service will receive video uploads from content creators, process them in multiple formats and resolutions, generate thumbnails and preview clips, and make the content available for streaming. We need this to be fast, reliable, and compliant with data sovereignty and privacy regulations for the Japanese market.

## What we need to build

Create a complete media processing pipeline using **CloudFormation with JSON** that handles end-to-end video processing workflows for a streaming platform.

### Core Requirements

1. **Media Ingestion and Storage**
   - S3 bucket for raw video uploads with versioning enabled
   - S3 bucket for processed media outputs with lifecycle policies
   - S3 bucket for thumbnails and preview clips
   - Organized folder structure for different stages of processing

2. **Media Processing Pipeline**
   - AWS MediaConvert for video transcoding to multiple formats (HLS, DASH, MP4)
   - Lambda functions for orchestrating the processing workflow
   - EventBridge rules for triggering processing on new uploads
   - Support for multiple output resolutions (1080p, 720p, 480p, 360p)
   - Automatic thumbnail generation at multiple timestamps

3. **Workflow Coordination**
   - Step Functions state machine for complex processing workflows
   - DynamoDB table for tracking job status and metadata
   - SNS topics for job completion notifications
   - SQS queues for handling processing failures and retries

4. **Monitoring and Logging**
   - CloudWatch Logs for all Lambda functions and services
   - CloudWatch alarms for processing failures and latency
   - CloudWatch dashboards for monitoring pipeline health
   - X-Ray tracing for debugging processing workflows

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **AWS MediaConvert** for video transcoding
- Use **S3** for storage with appropriate bucket policies
- Use **Lambda** for orchestration and custom processing logic
- Use **DynamoDB** for metadata and job tracking
- Use **EventBridge** for event-driven architecture
- Use **Step Functions** for complex workflow orchestration
- Use **SNS** and **SQS** for messaging and notifications
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environmentSuffix
- Deploy to **eu-south-2** region

### Security and Compliance Requirements

- Implement encryption at rest for all S3 buckets using AWS KMS
- Enable encryption in transit using TLS/SSL
- Follow principle of least privilege for all IAM roles and policies
- Enable S3 bucket logging and versioning
- Implement bucket policies to restrict public access
- Enable CloudTrail logging for audit compliance
- Tag all resources with appropriate metadata
- Ensure data residency requirements for Japanese market

### Performance Requirements

- Processing should start within 30 seconds of upload completion
- Support concurrent processing of multiple videos
- Implement retry logic for failed processing jobs
- Use provisioned concurrency for time-critical Lambda functions
- Optimize S3 transfer acceleration for large file uploads

### Constraints

- All resources must be deployed in eu-south-2 region
- All resources must be fully destroyable (no Retain deletion policies)
- Infrastructure should support multiple environments using environmentSuffix
- Secrets should use AWS Secrets Manager or Systems Manager Parameter Store
- No hardcoded credentials or sensitive data in templates
- MediaConvert jobs should use on-demand pricing tier
- Lambda functions should have appropriate timeout and memory settings

## Success Criteria

- Functionality: Pipeline processes videos end-to-end from upload to delivery
- Performance: Processing starts within 30 seconds, completes based on video size
- Reliability: Failed jobs are retried automatically, errors are logged
- Security: All data encrypted, IAM follows least privilege, no public access
- Compliance: Audit logging enabled, data residency enforced, resources tagged
- Resource Naming: All resources include environmentSuffix parameter
- Monitoring: CloudWatch dashboards show pipeline health, alarms configured
- Code Quality: Valid JSON CloudFormation, well-structured, documented

## What to deliver

- Complete CloudFormation JSON template implementation
- S3 buckets for raw uploads, processed media, and thumbnails
- MediaConvert job templates for different output formats
- Lambda functions for workflow orchestration
- DynamoDB table for job tracking and metadata
- EventBridge rules for event-driven processing
- Step Functions state machine for complex workflows
- SNS topics and SQS queues for messaging
- IAM roles and policies following least privilege
- CloudWatch alarms and dashboards for monitoring
- Comprehensive documentation and deployment instructions
- Unit tests for all components
- Integration tests validating end-to-end workflows
