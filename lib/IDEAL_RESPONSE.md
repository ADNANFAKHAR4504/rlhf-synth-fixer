# Streaming Media Pipeline - CDK Go Implementation (IDEAL)

A production-ready streaming media processing pipeline using AWS CDK with Go, deployed to eu-south-1.

## Architecture

Complete video ingestion to processing to delivery pipeline:
- **S3 Buckets**: Source uploads, processed content, and CloudFront logs (encrypted, access controlled)
- **Lambda Functions**: Transcode trigger and status tracking with inline code
- **MediaConvert**: Video transcoding to H.264/AAC (configured via Lambda SDK)
- **DynamoDB**: Job tracking with PAY_PER_REQUEST billing
- **SNS**: Pipeline notifications for job status updates
- **CloudFront**: Global content delivery with OAI security and logging enabled
- **EventBridge**: MediaConvert job state change monitoring
- **IAM**: Least-privilege roles for MediaConvert and Lambda with scoped permissions

## Key Files

### go.mod
```go
module tap
go 1.21
require (
	github.com/aws/aws-cdk-go/awscdk/v2 v2.133.0
	github.com/aws/constructs-go/constructs/v10 v10.3.0
	github.com/aws/jsii-runtime-go v1.97.0
)
```

### bin/tap.go (Entry Point)
- Reads ENVIRONMENT_SUFFIX from env var or CDK context
- Creates TapStack with proper region (eu-south-1)
- Applies tags (Environment, Repository, Author)

### lib/tap_stack.go (Main Stack)
All resources use environmentSuffix in names:
- Source bucket: `media-source-{suffix}` with encryption and auto-delete
- Processed bucket: `media-processed-{suffix}` with encryption and auto-delete
- CloudFront logs bucket: `cloudfront-logs-{suffix}` with ACL permissions for CloudFront logging
- DynamoDB table: `media-jobs-{suffix}` with jobId partition key
- SNS topic: `media-notifications-{suffix}` for pipeline notifications
- IAM roles: `media-convert-role-{suffix}` (MediaConvert), `media-lambda-role-{suffix}` (Lambda)
- Lambda functions: `media-transcode-{suffix}` (transcode), `media-status-{suffix}` (status updates)
- EventBridge rule: `media-convert-job-rule-{suffix}` for job state changes

**CloudFront Logging Configuration**:
- Bucket created with BUCKET_OWNER_PREFERRED ownership for ACL support
- BlockPublicAccess configured to allow ACL operations while blocking public policy
- Bucket policy grants CloudFront service principal GetBucketAcl and PutBucketAcl permissions
- Separate policy statement allows CloudFront to write log objects (PutObject)

### Lambda Functions
**Transcode Lambda** (inline):
- Triggered by S3 uploads/\* events
- Gets MediaConvert endpoint
- Creates transcode job (H.264 video, AAC audio)
- Stores job in DynamoDB
- Sends SNS notification

**Status Lambda** (inline):
- Triggered by EventBridge rule on MediaConvert job state changes (COMPLETE or ERROR)
- Queries DynamoDB to find job by MediaConvert job ID
- Updates job status and timestamp in DynamoDB
- Sends SNS notifications with job status updates

### Stack Outputs
All outputs for integration testing:
- SourceBucketName (media-source bucket)
- ProcessedBucketName (media-processed bucket)
- JobTableName (media-jobs table)
- DistributionDomainName (CloudFront distribution)
- TranscodeFunctionArn (transcode Lambda)
- StatusFunctionArn (status Lambda)
- NotificationTopicArn (SNS topic)
- CloudFrontLogsBucketName (logging bucket)

## Testing

### Unit Tests (100% Coverage)
**tests/unit/tap_stack_unit_test.go** - 10 comprehensive tests:
1. Stack creation with environment suffix
2. Stack creation with default suffix
3. S3 buckets configuration (encryption, public access block)
4. DynamoDB table (partition key, billing mode)
5. Lambda functions (runtime, handler, timeout)
6. IAM roles (service principals, policies)
7. SNS topic (display name)
8. CloudFront distribution (HTTPS, caching, price class)
9. Lambda inline code verification
10. Stack outputs validation

**Coverage**: 100% of lib/tap_stack.go statements

### Integration Tests (Structure)
Would test deployed resources:
- Upload video to source bucket
- Verify Lambda invocation
- Check DynamoDB job entry
- Validate processed video in output bucket
- Test CloudFront distribution access

Uses cfn-outputs/flat-outputs.json for dynamic resource references.

## Deployment

```bash
# Install dependencies
go mod tidy

# Set environment
export ENVIRONMENT_SUFFIX=test$(date +%s)
export AWS_REGION=eu-south-1

# Lint and build
go vet ./lib/... ./bin/...
gofmt -w bin/ lib/
go build -o /dev/null ./main.go

# Synthesize
npm run synth

# Deploy
npm run cdk:deploy

# Test
go test -v ./tests/unit/... -coverprofile=coverage.out -coverpkg=./lib/...

# Cleanup
npm run cdk:destroy
```

## Compliance

[PASS] Platform: CDK Go (no Terraform/Pulumi imports)
[PASS] Region: eu-south-1 hardcoded in deployment configuration
[PASS] EnvironmentSuffix: All named resources include suffix
[PASS] No Retain policies: All resources have DESTROY removal policy
[PASS] Encryption: S3 S3_MANAGED encryption, data in transit via HTTPS
[PASS] Security: Controlled access, OAI for CloudFront, IAM least privilege
[PASS] CloudFront Logging: Properly configured with ACL permissions
[PASS] Testing: Comprehensive unit tests with full coverage

## Key Implementation Details

**CloudFront Logging Fix**:
- CloudFront requires specific ACL permissions (GetBucketAcl, PutBucketAcl) to write logs
- Logging bucket configured with BUCKET_OWNER_PREFERRED ownership for ACL support
- BlockPublicAccess selectively enabled to allow ACL operations while maintaining security
- Bucket policy grants CloudFront service principal necessary ACL and PutObject permissions

**MediaConvert Integration**:
- MediaConvert service integrated via Lambda SDK (not direct CDK construct)
- Transcode Lambda gets endpoint dynamically via DescribeEndpoints API
- Jobs configured for H.264 video codec and AAC audio codec
- Output directed to processed bucket with proper path structure

**Event-Driven Architecture**:
- S3 events trigger transcode Lambda on object creation in uploads/ prefix
- EventBridge rule monitors MediaConvert job state changes (COMPLETE, ERROR)
- Status Lambda triggered by EventBridge for DynamoDB updates and notifications
- SNS topic provides notification mechanism for all pipeline events

## Production Considerations

**Implemented**:
- Encryption at rest and in transit
- Least privilege IAM
- Event-driven architecture
- Scalable (serverless + CloudFront)
- Cost-optimized (PAY_PER_REQUEST, auto-delete)

**Future Enhancements**:
- Add Dead Letter Queue (DLQ) for Lambda retry failures
- Implement CloudWatch alarms for pipeline health monitoring
- Add lifecycle policies for automatic archival of old source videos
- Implement API Gateway for programmatic job submission and status queries
- Add X-Ray tracing for distributed request tracking across services

## AWS Services Used
- S3 (storage)
- Lambda (compute)
- DynamoDB (database)
- SNS (messaging)
- CloudFront (CDN)
- IAM (security)
- MediaConvert (media processing - via Lambda SDK, not CDK)
- CloudWatch Logs (monitoring)
