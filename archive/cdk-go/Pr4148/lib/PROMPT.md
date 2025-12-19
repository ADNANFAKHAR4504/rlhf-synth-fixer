Help write an AWS CDK application in Go that deploys a production-grade AI/ML pipeline for a vision company processing roughly 500,000 images per day. The system must automate model training, support real-time inference, enforce data privacy compliance, and provide robust model performance tracking and operational observability. The design should be scalable, fault tolerant, and cost-conscious where possible.

## High-level architecture

- Use **Amazon SageMaker** for model training, tuning, and hosting (real-time endpoints / multi-model endpoints as appropriate).
- Store raw images, training datasets, and trained model artifacts in **Amazon S3** with lifecycle and encryption policies.
- Implement **AWS Lambda** (Go) for preprocessing tasks (image validation, resizing, normalization) and lightweight orchestration steps.
- Use **AWS Step Functions** to coordinate training workflows, data preparation, model evaluation, and deployment promotion pipelines.
- Use **Amazon Kinesis Data Streams** (or Kinesis Data Firehose where appropriate) to ingest high-throughput image inference events and deliver records to real-time processing.
- Expose inference endpoints through **Amazon API Gateway** which routes requests to SageMaker endpoints or a Lambda-backed adapter.
- Record metadata, run state, and model lineage in **Amazon DynamoDB** for quick lookups and resume/retry logic.
- Use **Amazon EventBridge** to emit and react to lifecycle events (training complete, model promoted, inference errors).
- Configure **Amazon CloudWatch** for logs, metrics, dashboards, and alarms across Lambda, Step Functions, SageMaker, Kinesis, and API Gateway. Integrate with X-Ray tracing where useful.

## Functional requirements

1. End-to-end automated training pipeline that:
   - Ingests dataset partitions from S3, runs preprocessing, submits SageMaker training jobs, evaluates models, and promotes the best model to a staging/production endpoint.
   - Supports hyperparameter tuning jobs and automated model selection based on configurable evaluation metrics.
2. Real-time inference path capable of processing incoming image requests with low latency using SageMaker hosting or a Lambda adapter + Kinesis for burst handling.
3. Metadata and lineage tracking in DynamoDB: dataset version, training run id, model id, evaluation metrics, and deployment history.
4. Instrumentation for model performance monitoring: accuracy/precision/recall, throughput, latency, error rates, data drift signals, and per-model metrics.
5. Data privacy and compliance controls: encryption at rest (S3, DynamoDB, EBS), encryption in transit, optional PII redaction step in preprocessing, and configurable data retention/lifecycle policies.
6. Operational controls: canary or blue/green deploy options for model endpoints, rollback on degraded performance, and alarms for SLA breaches.

## Non-functional requirements

- Must support the stated throughput (≈500k images/day) with autoscaling and partitioning strategies documented.
- Design for fault tolerance, retry/backoff, and idempotency where appropriate.
- Keep cost efficiency in mind: use spot/managed training resources where acceptable, batch or multi-model endpoints if they reduce cost, and S3 lifecycle rules.
- Use least-privilege IAM roles and KMS-managed keys for encryption.
- CDK app must be modular, testable, and well-documented.

## Implementation details and constraints

- Language: **Go** (AWS CDK for Go). Provide idiomatic, well-structured Go CDK code.
- Infrastructure components must be defined in CDK constructs/modules with sensible defaults and overridable context/parameters.
- Provide CloudWatch dashboards for key metrics (inference latency, requests/sec, model accuracy, training job durations, Kinesis throughput).
- Include Step Functions state machines for orchestrating training and deployment flows.
- Include at least one automated validation step (e.g., holdout dataset evaluation) before promoting a model to production.
- Define SNS or EventBridge-driven notifications for critical events (training failure, model promotion, SLA breach).
- Make tracing and logging available for troubleshooting (CloudWatch Logs + X-Ray where applicable).
- Provide mechanisms to detect data drift or input distribution shifts (describe metric collection and alerts).

## Security & compliance

- Encrypt S3 objects with KMS; use encryption for DynamoDB and EBS volumes used by training.
- Ensure network segmentation where needed (VPC for training/hosting if private networking is required).
- Implement IAM roles with least privilege for SageMaker, Lambda, Step Functions, and Kinesis.
- Provide optional PII redaction or tokenization in preprocessing and document how to enable/disable it.
- Document how the design supports relevant data privacy controls (data minimization, retention, audit logs).

## Deliverables

1. A CDK Go codebase organized into modules/constructs for major components (data, training, inference, monitoring).
2. `README.md` with deployment steps, required IAM permissions, configuration variables, and example `cdk.json` or context values.
3. Example configuration (parameters/defaults) for environment-specific values: S3 prefixes, Kinesis shard counts, SageMaker instance types, and retention policies.
4. CloudWatch dashboard definitions (or code snippets) and recommended alarms with thresholds and SNS topics for notifications.
5. A basic smoke-test / validation plan for both training and inference: sample dataset run, endpoint invocation examples, and acceptance criteria.
6. Notes on cost controls and recommended production settings (autoscaling, instance types, spot vs on-demand for training).
7. Inline comments and documentation explaining where to plug in model code and how to extend the pipeline.

## Acceptance criteria

- CDK synth/assembly completes without errors and produces an expected CloudFormation template.
- A staged deployment (training or small-scale run) can be executed with provided instructions.
- SageMaker training and tuning jobs can run and produce evaluation metrics; the best model can be promoted to a hosted endpoint via the Step Functions workflow.
- Real-time inference via API Gateway + SageMaker (or Lambda adapter) succeeds for sample images and returns expected responses.
- CloudWatch contains logs and metrics for training runs and inference; dashboards populate with metrics from test runs.
- Security measures (encryption, IAM roles, VPC settings where used) are present and documented.
- Documentation explains how the solution addresses data privacy compliance and model monitoring.
