Hey team,

We need to build a scalable media processing pipeline for a streaming platform that handles live video content transcoding and processing. I've been asked to create this infrastructure using **CloudFormation with JSON** for deployment in the ap-southeast-1 region.

The business is launching a streaming video platform and needs a robust pipeline that can ingest live video streams, transcode them into multiple quality formats (1080p, 720p, 480p, 360p), store the processed content, and deliver it to users with low latency. The system needs to handle variable load with automatic scaling and provide monitoring for stream health and processing metrics.

This infrastructure will support our streaming service that processes live video content from content creators, transcodes it into adaptive bitrate formats, stores the segments in durable storage, and serves them through a content delivery mechanism. The pipeline must be cost-effective, secure, and fully automated.

## What we need to build

Create a streaming media processing pipeline using **CloudFormation with JSON** for a video streaming platform that processes and transcodes live video content.

### Core Requirements

1. **Video Ingestion and Processing**
   - S3 buckets for video input (raw uploads) and output (processed content) with versioning enabled
   - Lambda function triggered by S3 uploads to initiate transcoding workflow
   - MediaConvert jobs to transcode videos into multiple formats and bitrates
   - Step Functions state machine to orchestrate the transcoding workflow
   - SQS queues for decoupling and handling failed processing jobs with DLQ

2. **Data Pipeline Components**
   - DynamoDB table to track video processing status, metadata, and job information
   - EventBridge rules to trigger workflows based on upload events
   - SNS topics for notification on successful/failed transcoding jobs
   - CloudWatch Logs for comprehensive logging of all processing steps

3. **Content Delivery and Storage**
   - S3 bucket for transcoded video segments with appropriate lifecycle policies
   - CloudFront distribution for low-latency content delivery (optional but recommended)
   - S3 bucket policies and CORS configuration for secure access

4. **Monitoring and Observability**
   - CloudWatch alarms for failed transcoding jobs and processing errors
   - CloudWatch dashboard for monitoring pipeline health and throughput
   - CloudWatch Logs with retention policies for cost optimization
   - Metrics for tracking processing time, success rate, and queue depth

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **S3** for video storage (input, output, and intermediate files)
- Use **AWS MediaConvert** for video transcoding with multiple quality presets
- Use **Lambda** for workflow orchestration and event processing
- Use **Step Functions** for managing the transcoding state machine
- Use **DynamoDB** for tracking job status and video metadata
- Use **SQS** with dead-letter queues for reliable message processing
- Use **EventBridge** for event-driven architecture
- Use **SNS** for notifications on job completion
- Use **CloudWatch** for monitoring, logging, and alarms
- Resource names must include a **string suffix** (environmentSuffix parameter) for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy to **ap-southeast-1** region

### Security and Compliance

- All S3 buckets must have encryption at rest enabled (SSE-S3 or SSE-KMS)
- S3 buckets must block all public access unless explicitly required for CloudFront
- Enable S3 bucket versioning for data protection
- IAM roles must follow least privilege principle with specific resource permissions
- Lambda functions must have execution roles with minimal required permissions
- MediaConvert must use IAM service role with appropriate permissions
- Enable CloudWatch Logs encryption where supported
- All resources must be tagged with appropriate metadata (Environment, Application, ManagedBy)
- No hardcoded credentials or secrets in the template

### Resource Management

- All resources must be destroyable (no Retain deletion policies)
- Use DeletionPolicy: Delete for all resources to ensure clean teardown
- S3 buckets should be created with RemovalPolicy that allows deletion
- CloudWatch Log Groups should have retention periods (7-14 days for cost optimization)
- DynamoDB tables should use PAY_PER_REQUEST billing mode for cost efficiency
- Lambda functions should have appropriate memory and timeout configurations

## Success Criteria

- **Functionality**: Complete video transcoding pipeline from upload to delivery
- **Scalability**: Handles multiple concurrent video processing jobs
- **Reliability**: Failed jobs are retried and moved to DLQ after exhaustion
- **Security**: All data encrypted at rest, IAM roles follow least privilege
- **Monitoring**: CloudWatch dashboards and alarms provide visibility into pipeline health
- **Resource Naming**: All resources include environmentSuffix parameter for uniqueness
- **Code Quality**: Valid JSON CloudFormation template, well-structured, properly documented
- **Cost Optimization**: Uses serverless services, appropriate retention policies, pay-per-use billing

## What to deliver

- Complete CloudFormation JSON template implementing the streaming media processing pipeline
- S3 buckets for video input, output, and processed content storage
- MediaConvert transcoding jobs with multiple quality presets
- Lambda functions for workflow orchestration
- Step Functions state machine for managing transcoding workflow
- DynamoDB table for job tracking and metadata
- SQS queues with dead-letter queues for reliable processing
- EventBridge rules for event-driven workflow triggers
- SNS topics for job completion notifications
- CloudWatch Logs, alarms, and dashboard for monitoring
- IAM roles and policies with least privilege permissions
- Unit tests validating CloudFormation template structure
- Integration tests validating deployed resources and workflows
- Documentation with deployment instructions

## Additional Considerations

- MediaConvert job templates should include presets for multiple resolutions (1080p, 720p, 480p, 360p)
- Step Functions state machine should handle success, failure, and retry logic
- Lambda functions should use Node.js 18.x or Python 3.11 runtime
- SQS queue visibility timeout should be longer than Lambda timeout
- DynamoDB table should have appropriate indexes for querying by status and timestamp
- CloudWatch Log retention should balance cost and compliance requirements (7-14 days recommended)
- Consider using S3 Intelligent-Tiering or lifecycle policies to optimize storage costs
- EventBridge rules should have specific event patterns to avoid unnecessary Lambda invocations
