ROLE: You are a senior Terraform engineer.

CONTEXT:
Design and implement an automated ML pipeline for a healthcare AI company that processes ~500GB of medical data daily. The system must automate end‑to‑end workflows, ensure data privacy, and expose model performance metrics. Use AWS managed services with Terraform HCL to provision and configure the environment.

SERVICES:
- Amazon SageMaker for model training, model registry, and hosting endpoints
- Amazon S3 for raw, processed, and model artifact storage
- AWS Lambda for data preprocessing and feature engineering
- AWS Step Functions for workflow orchestration
- Amazon DynamoDB for experiment/pipeline metadata
- Amazon EventBridge for pipeline eventing and schedules
- Amazon CloudWatch for logs, metrics, and alarms
- AWS Key Management Service (KMS) for encryption at rest

SECURITY & COMPLIANCE CONSTRAINTS:
- Encrypt all data at rest with KMS CMKs (S3 buckets, DynamoDB, CloudWatch Logs, SageMaker volumes/artifacts)
- Enforce TLS in transit for S3 and endpoints
- Least‑privilege IAM roles for Lambda, SageMaker, Step Functions
- VPC‑only access for SageMaker processing/training/endpoints when VPC networking is enabled
- Server‑side access logs for S3 buckets
- Data retention and lifecycle policies for S3 and logs

OPERATIONAL CONSTRAINTS:
- Handle 500GB/day ingestion and preprocessing
- Parameterize environment (env, region, naming, KMS keys)
- Emit pipeline and model metrics to CloudWatch
- Idempotent applies; safe to re‑run

DELIVERABLES:
1) variables.tf (inputs: regions, names, VPC/VPN toggles, KMS, sizing)
2) kms.tf (customer managed keys and aliases)
3) s3.tf (raw/processed/artifacts buckets with encryption, lifecycle, access logs)
4) dynamodb.tf (metadata table with KMS encryption)
5) iam.tf (IAM roles/policies for Lambda, SageMaker, Step Functions, CloudWatch)
6) lambda.tf (preprocessing Lambda with env vars and logging)
7) sagemaker.tf (training job role, model package, endpoint config, endpoint)
8) stepfunctions.tf (state machine orchestrating preprocessing → training → register → deploy)
9) eventbridge.tf (schedule/rules to trigger the pipeline; targets = Step Functions)
10) cloudwatch.tf (log groups, metric filters, alarms for failures and latency)
11) main.tf (wire modules/resources and outputs)
12) provider.tf already exists

OUTPUT FORMAT (IMPORTANT):
- Provide each file in a separate fenced code block with its filename as the first line in a comment, e.g.:
```hcl
# main.tf
# ... HCL here ...