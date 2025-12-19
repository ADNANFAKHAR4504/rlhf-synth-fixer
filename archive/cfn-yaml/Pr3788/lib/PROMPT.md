## Title

Refined Problem Statement — Scalable Media Processing Pipeline (S3 + MediaConvert)

## Summary

A video platform must ingest and process **~5,000 daily video uploads**, generate multiple output formats (HLS, DASH, MP4 variants), and deliver processed assets with multi‑AZ reliability. The pipeline must scale automatically, track processing progress for each asset, secure media at rest and in transit, and keep operational costs reasonable. The implementation will use AWS managed services and be deployed via **CloudFormation**.

Core services: **S3** (originals + outputs), **AWS Elemental MediaConvert** (transcoding), **AWS Lambda** (orchestration & helpers), **DynamoDB** (metadata & job status), **EventBridge** (event routing), **SQS** (processing queue/backpressure), **CloudWatch** (metrics & logs), **KMS** (encryption), and **IAM** (least-privilege).


## Functional Requirements

1. Ingest uploaded videos into a versioned S3 bucket (`uploads/`) encrypted with a KMS key.
2. Push an event for each upload into EventBridge (or S3 Event -> EventBridge) which enqueues a message into SQS for processing.
3. Orchestrate transcoding jobs via Lambda that submits jobs to MediaConvert for required outputs (HLS, DASH, multiple bitrates/resolutions, MP4 previews).
4. Persist metadata and processing status per asset in DynamoDB: `assetId`, `uploaderId`, `s3Key`, `status`, `formats[]`, `createdAt`, `updatedAt`, `jobIds[]`, `errors[]`.
5. Track job progress and update DynamoDB as MediaConvert job events arrive (via EventBridge or SNS).
6. Store transcoded outputs in a separate S3 bucket (with appropriate folder structure), encrypted and with lifecycle rules.
7. Provide retries and backoff for transient failures; dead-letter queue (DLQ) for failed processing.
8. Emit CloudWatch metrics (daily processed count, per-format success/failure, queue depth, job latency) and logs for troubleshooting.

## Non-Functional Requirements

* Scale to 5,000 uploads/day with peaks; support burst concurrency without manual intervention.
* Multi-AZ reliability—use managed services and regional services that provide HA.
* Secure: encryption at rest (KMS), in transit (HTTPS), and S3 bucket policies to restrict access.
* Cost-conscious: efficient MediaConvert job profiles, use of SQS to smooth spikes, lifecycle rules to move older assets to cheaper storage classes.
* Simplicity & observability for operations team to adopt quickly.

## Constraints & Assumptions

* MediaConvert endpoints and service limits are considered and adjusted (or account-level quotas increased) as needed.
* Source videos are uploaded by authenticated clients (auth out-of-scope).
* Transcoding profiles are predefined but must be configurable via parameters or a configuration file stored in SSM/Parameter Store.


## High-level Flow

1. **Client** uploads video -> **S3 Upload Bucket (uploads/)** (KMS encrypted).
2. S3 generates an event -> forwarded to **EventBridge** -> **SQS** queue for processing (buffering & backpressure).
3. **Lambda (orchestrator)** polls SQS (via event source mapping) and: validates input, writes initial record to **DynamoDB**, and submits a **MediaConvert** job for each required output format.
4. MediaConvert processes and emits job status events to **EventBridge** (or SNS). A **Lambda (job-status-processor)** consumes these events and updates DynamoDB and moves/sets output object metadata.
5. On final success, outputs are stored in **S3 Output Bucket** (encrypted), and optionally an EventBridge notification or SNS alert is emitted for downstream services (CDN invalidation, playback indexing).
6. **CloudWatch** collects metrics and logs. **Alarms** notify via SNS (e.g., high failure rate, queue depth growth).

## Components

* **S3**

  * `uploads-bucket` (versioned, KMS-encrypted)
  * `outputs-bucket` (KMS-encrypted, lifecycle rules)
* **SQS** `media-processing-queue` + DLQ
* **EventBridge** rules to route S3 events and MediaConvert job events
* **Lambda Functions**

  * `ingest-orchestrator` (SQS event source) — submit MediaConvert jobs, write initial DynamoDB record
  * `job-status-processor` (EventBridge) — update DynamoDB, emit metrics
  * `utility` Lambdas (optional) for manifest generation, thumbnail extraction
* **MediaConvert** job templates / presets
* **DynamoDB** table `MediaAssets` with indexes for status and uploader
* **CloudWatch** dashboard and alarms
* **KMS** CMK for S3 encryption
* **IAM** roles/policies with least privilege for Lambda, MediaConvert, EventBridge, S3, and DynamoDB


## Template Structure

* **Parameters**

  * `Environment` (dev/test/prod)
  * `UploadsBucketName`, `OutputsBucketName` (or let CFN generate names)
  * `MediaConvertRoleArn` (optional) or create in template
  * `KmsKeyAlias` (optional)
  * `ProcessingConcurrency` (tuning parameter)
* **Resources**

  * `S3UploadBucket`, `S3OutputBucket` with encryption and lifecycle rules
  * `KMSKey` (if not provided)
  * `SQSMediaProcessingQueue` + `SQSDeadLetterQueue`
  * `EventBridgeRuleS3ToQueue` (or S3 Event Notification -> EventBridge -> SQS)
  * `LambdaIngestOrchestrator` with EventSourceMapping to SQS
  * `LambdaJobStatusProcessor` triggered by EventBridge rule for MediaConvert events
  * `DynamoDBMediaAssets` (table + GSIs)
  * `MediaConvertJobTemplate` (optional) or instructions to create
  * `CloudWatchDashboard` and `CloudWatchAlarms`
  * `IAM Roles` for Lambda (least-privilege) and MediaConvert
* **Outputs**

  * S3 bucket names, SQS queue URL, DynamoDB table name, Lambda ARNs, EventBridge rule ARNs

## Implementation Notes

* Use SQS to smooth spikes and protect downstream (MediaConvert job submission rate limits).
* Use DynamoDB conditional writes to ensure idempotency (`attribute_not_exists(assetId)`).
* Prefer MediaConvert job templates stored as CloudFormation resources or created post-deploy with documented CLI/API steps.
* Include Lambda DLQ or destinations to capture failed orchestrations.
* Parameterize transcoding profiles via SSM Parameter Store or a JSON config in S3.


## Cost Optimization

* Tune MediaConvert presets to balance quality vs cost (choose appropriate codecs, resolutions, and segment sizes).
* Use S3 Intelligent-Tiering or lifecycle rules for older assets.
* Use reserved MediaConvert resources or pricing plans if predictable high volume.

## Monitoring & Alerts

* CloudWatch metrics to track: `DailyProcessedCount`, `QueueDepth`, `MediaConvertJobFailures`, `JobLatency`, `ThumbnailsGenerated`.
* Alarms: queue depth rising above threshold, job failure rate above threshold, Lambda error spike.
* Enable S3 access logs and MediaConvert job logs for forensic analysis.

## Reliability & Scalability

* Use managed services (S3, MediaConvert, EventBridge, SQS) for multi-AZ durability.
* Tune Lambda concurrency and SQS batch size to handle throughput.
* Plan for regional limits for MediaConvert; consider cross-region fallback if required.

## Security

* Encrypt buckets with KMS and restrict access via bucket policies and IAM conditions.
* Use IAM roles for MediaConvert with `aws:SourceArn` conditions where possible.
* Protect EventBridge and SQS with resource policies.


1. The pipeline successfully ingests and processes 5,000 uploads in a 24-hour window without manual scaling.
2. Each asset has a DynamoDB record that moves through statuses: `PENDING` → `PROCESSING` → `SUCCEEDED`/`FAILED` with jobIds and timestamps.
3. MediaConvert job events update the asset records and CloudWatch metrics reflect processing health.
4. Failed jobs are retried with exponential backoff; permanently failed items appear in DLQ.
5. Outputs are stored encrypted in the outputs S3 bucket and lifecycle rules move older assets to cheaper storage.
6. The whole stack deploys via CloudFormation and outputs the relevant resource ARNs/URLs.


## Prompt: Generate CloudFormation + Lambda code

```
You are an AWS media infrastructure engineer. Produce a CloudFormation YAML template and minimal Lambda code stubs to deploy a scalable media processing pipeline. Requirements:
- S3 upload bucket (KMS-encrypted, versioned) and outputs bucket (KMS-encrypted, lifecycle rules).
- EventBridge rule (or S3 Event) routed into an SQS queue for processing with DLQ.
- Lambda `ingest-orchestrator` (Python or Node.js) triggered by SQS to: validate event, write initial DynamoDB record, submit MediaConvert jobs for configured presets, and record jobIds.
- Lambda `job-status-processor` triggered by EventBridge for MediaConvert job state changes to update DynamoDB and emit CloudWatch metrics.
- DynamoDB table `MediaAssets` with partition key `assetId` and GSI for `status` and `uploaderId`.
- MediaConvert job template(s) created or instructions included to create them; parameterize output formats (HLS/DASH/MP4) via SSM or CloudFormation parameters.
- SQS queue for backpressure and DLQ.
- KMS key (managed or provided) for S3 encryption.
- CloudWatch dashboard and alarms for queue depth, job failures and processing latency.
- IAM roles with least-privilege for Lambdas and MediaConvert.
- Idempotency checks for duplicate uploads (DynamoDB conditional writes).

Return: CloudFormation YAML and two Lambda handler stubs (ingest-orchestrator and job-status-processor) with inline comments explaining logic, plus a small README describing deployment steps and how to add MediaConvert presets.
```

* Confirm preferred language for Lambda handlers (Python or Node.js).
* Provide MediaConvert presets or let me create reasonable defaults.
* Then I will generate the CloudFormation YAML and Lambda code bundle for deployment.