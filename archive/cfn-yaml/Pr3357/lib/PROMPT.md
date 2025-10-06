# AWS Documen## Architecture (must implement)

### S3 (Raw & Processed)

- **RawBucket** for uploads (versioning enabled, SSE-S3 or SSE-KMS)
- **ProcessedBucket** for normalized/derived artifacts (versioning enabled to support "versioning for processed documents")
- S3 Event Notifications → SQS (buffer) on ObjectCreated:\*
- Bucket policies least-privilege; block public access

### SQS (Ingest & DLQs)

- **IngestQueue** buffers S3 events (visibility timeout > max Lambda/Textract time)
- **DLQs** for Ingest, Textract, StateMachine failures
- Rate limiting: set maxReceiveCount and Lambda concurrency to keep Textract below throttle limits (document throttle-aware settings)ne - IaC Task

## Role

You are an expert AWS Solutions Architect and CloudFormation/Terraform/YAML specialist.

## Goal

Generate a single production-ready YAML template that deploys a document processing pipeline in us-east-1 handling 20,000 file uploads/day with OCR, entity extraction, indexing, and search.

## Deliverable

- One self-contained YAML IaC template (CloudFormation preferred; if using CDK/TF, still emit final YAML)
- Include Parameters, Mappings (if helpful), Outputs, and stack Tags
- Comment the template for clarity

Architecture (must implement)

S3 (Raw & Processed)

RawBucket for uploads (versioning enabled, SSE-S3 or SSE-KMS).

ProcessedBucket for normalized/derived artifacts (versioning enabled to support “versioning for processed documents”).

S3 Event Notifications → SQS (buffer) on ObjectCreated:\*.

Bucket policies least-privilege; block public access.

SQS (Ingest & DLQs)

IngestQueue buffers S3 events (visibility timeout > max Lambda/Textract time).

DLQs for Ingest, Textract, StateMachine failures.

Rate limiting: set maxReceiveCount and Lambda concurrency to keep Textract below throttle limits (document throttle-aware settings).

### Lambda (Python 3.11)

- **PreprocessFunction** (Python 3.11) for lightweight preprocessing/validation, S3 object sanity checks, content-type routing, and Step Functions start
- **PostprocessFunction** (Python 3.11) to enrich/transform Textract/Comprehend output, build OpenSearch docs, write DynamoDB metadata
- Package with minimal dependencies; enable ARM64 if desired. Use reserved concurrency to control throughput to Textract
- Logging to CloudWatch; structured JSON logs

### AWS Step Functions (Orchestration)

- Express or Standard (justify choice; default Standard)

**Workflow:**

1. ReceiveEvent → Preprocess (Lambda)
2. → Textract (sync for small, async job for large PDFs with periodic GetJobStatus)
3. → Comprehend entities/key phrases/PII (compliance option flag)
4. → Postprocess (Lambda)
5. → IndexToOpenSearch
6. → WriteMetadataDDB
7. → NotifySNS

**Error handling:**

- Per-state retries with backoff/jitter
- On max attempts → Send to DLQ (SQS) and emit CloudWatch metric & alarm
- Input/output path filtering to keep payloads small

### Amazon Textract

- Use StartDocumentTextDetection/Analysis for async large files; DetectDocumentText for small ones
- KMS encryption where supported; IAM policies least-privilege
- Throttle protection via SQS + Lambda concurrency + Step Functions rate controls

### Amazon Comprehend

- DetectEntities (language configurable), optionally PII redaction flag
- Limit permissions to only required APIs; KMS for data at rest where applicable

### Amazon OpenSearch Service (Managed)

**Dedicated domain with:**

- Encryption at rest (KMS), node-to-node encryption, fine-grained access control (master user via Secrets Manager)
- Minimum 3-AZ, GP3/Provisioned IOPS where appropriate; auto-tune disabled/enabled per best practice
- Index template for documents (id, version, title, entities, key phrases, ocr text, s3 keys, timestamps)
- VPC access only; security groups least-privilege

### Amazon DynamoDB (Metadata)

**Table: Documents**

- **PK:** DocumentId (S3 key hash/UUID), **SK:** Version (number or timestamp)
- **GSIs** for OwnerId, UploadDate, and Status
- On-demand capacity with auto scaling alarms; TTL for transient states

### API Gateway (Search API) + Lambda

**REST or HTTP API exposing:**

- `GET /search?q=&entity=&from=&size=` (queries OpenSearch)
- `GET /documents/{id}` (reads DDB + OpenSearch)
- WAF (optional), usage plans, API keys or Cognito authorizer; access logs enabled

### SNS (Notifications)

- **Topic:** DocumentProcessingCompleted with optional email/HTTP subscriptions
- Publish on success and on DLQ events (separate topic) for operator awareness

### CloudWatch (Monitoring & Alarms)

**Dashboards & alarms for:**

- SQS age of oldest message, DLQ depth
- Step Functions ExecutionsFailed
- Lambda errors/throttles/duration
- Textract/Comprehend API errors (via embedded metrics logs)
- OpenSearch cluster health (red/yellow), CPU, JVMMemPressure, free storage
- Log retention (e.g., 30–90 days) and metric filters

### IAM (Least Privilege)

- Separate roles for each service (Lambda, Step Functions, Textract/Comprehend access, OpenSearch access via FGAC, DDB CRUD, S3 read/write)
- Scope by resource ARN (buckets/prefixes, DDB table/index ARNs, OpenSearch domain ARN)
- Deny decrypt if KMS key condition not met; VPC endpoints as needed

### Networking & Security

- Private subnets for Lambdas and OpenSearch (VPC integration)
- VPC endpoints for S3, SQS, SNS, DDB, Textract, Comprehend, OpenSearch
- KMS CMKs for S3, OpenSearch, DynamoDB (if using server-side enc with CMK), and Secrets Manager

## Cost & Scale

- Target throughput: ~20k docs/day (~0.23 docs/sec avg, burst tolerant)
- Concurrency & batch sizes tuned to stay below Textract throttle
- Parameters to adjust shard/replica count, instance types, concurrency limits

## Functional Requirements

- Ingest from S3 via event → SQS; Step Functions manages the complex workflow
- DLQs for all async components; failures are alarmed and published to SNS
- OpenSearch encryption at rest and node-to-node required
- Rate limiting: SQS + Lambda concurrency + Step Functions service integration to avoid Textract throttling
- Versioning: store multiple processed versions per document in ProcessedBucket and in DynamoDB (Version attribute)
- Search API queries OpenSearch; detail endpoint reads DDB/OpenSearch

## Template Requirements

### Parameters (examples):

- Environment (default prod), KmsKeyArn, OpenSearchInstanceType, OpenSearchShardCount, LambdaReservedConcurrency, ComprehendLanguageCode, ApiAuthType, AlarmEmail, VpcId, PrivateSubnetIds, S3RawBucketName, S3ProcessedBucketName

### Outputs:

- ApiEndpoint, OpenSearchDomainEndpoint, S3RawBucketArn, S3ProcessedBucketArn, DocumentsTableName, StateMachineArn, NotificationTopicArn

### Additional Requirements:

- **Tags** on all resources: Environment=prod, Owner, CostCenter, DataClassification
- **Policies:** Explicit, least privilege JSON in YAML
- **OpenSearch:** domain config with FGAC master user in Secrets Manager; VPC SGs
- **API Gateway:** access logging, metrics, usage plans, throttling
- **S3 Event → SQS** mapping configured in YAML
- **Step Functions Definition:** provide full ASL JSON embedded in YAML, including Retry, Catch, and DLQ handoff
- **Dead-letter configs** on Lambdas; onFailure SNS/SQS where applicable
- **CloudWatch Dashboard** JSON embedded with key widgets

## Validation & Testing

- Include a minimal integration test plan as comments (e.g., upload sample PDF, observe state transitions, verify OpenSearch index, DDB row, SNS message)
- Add example OpenSearch index mapping (as a template resource or AWS::OpenSearchServerless::Collection alt if justified)

## Non-Goals

- No public S3 access
- No inline secrets—use Secrets Manager and KMS

## Output Format

Return only the final YAML template (no prose), fully lint-able and deployable, with comments where helpful.
