# Serverless App Infrastructure — Single‑File Terraform (`tap_stack.tf`)

## What We’re Building
A clean, production‑ready **serverless + minimal EC2** stack in a single Terraform file. The stack must be region‑agnostic (discover the active region via data sources) and easy to tear down. CI will inject providers and the backend—**do not add any `provider` or backend blocks**. Keep everything in **one file named `tap_stack.tf`**.

The stack includes:
- **KMS (CMK)** for encryption (used by S3, DynamoDB, CloudWatch Logs).
- **S3**: one **logs** bucket and one **content** bucket (private, versioned, SSE‑KMS, PAB enabled). Content bucket sends **ObjectCreated** events to Lambda.
- **DynamoDB**: single table with **PROVISIONED** capacity, **SSE with KMS**, and **PITR**.
- **Lambda**: Python runtime that handles S3 events and simple API requests, writing proof rows to DynamoDB.
- **API Gateway (REST)**: `POST /process` proxy integration to the Lambda function with access logs to CloudWatch Logs.
- **EC2 (default VPC)**: one t3.micro instance with SSM Core and a hardened user‑data script that writes a proof object to S3 (SSE‑KMS) and proof items to DynamoDB.
- **CloudWatch Logs**: log groups for Lambda and API Gateway (encrypted with KMS).

## Guardrails (must follow)
- **Single file**: `tap_stack.tf`. No modules, no extra files.
- **No provider/backend blocks**: CI injects them. Use `data` sources to get region/account; rely on default or injected provider.
- **Secure by default**: S3 public access blocked, HTTPS only where applicable, least‑privilege IAM, IMDSv2 (if you add EC2 metadata usage), KMS everywhere practical.
- **Destroy‑friendly**: Do not use `prevent_destroy`. Prefer `force_destroy = true` on buckets for testability.
- **Consistent tagging** via `locals.base_tags` (include at least `Environment`, `Project`).

## What to Provision (checklist)

### Data & Locals
- `data.aws_caller_identity.current`
- `data.aws_region.current`
- `locals.base_tags` including `Environment`, `Project`
- Deterministic bucket names (content + logs) that include `account_id`

### KMS
- One CMK with policy that:
  - Allows the **account root** full access
  - Grants **CloudWatch Logs service** in the active region encrypt/decrypt permissions
  - Grants the **Lambda service** `Encrypt/Decrypt/GenerateDataKey/DescribeKey` and `CreateGrant` (with `kms:ViaService=lambda.<region>.amazonaws.com` and `kms:GrantIsForAWSResource=true`)
- A KMS **alias** targeting that key

### S3
- **Logs bucket** (private, PAB enabled, SSE AES256 is fine here). Bucket policy grants **only** the S3 **logging service** permission to write with `bucket-owner-full-control`. Add a short lifecycle to expire old logs.
- **Content bucket** (private, PAB enabled, **versioned**, SSE‑KMS using the CMK, bucket key enabled). **Server access logging** to the logs bucket with `access-logs/` prefix.

### DynamoDB
- Table name derived from `ProjectName` and `Environment`
- Billing mode **PROVISIONED** (e.g., 5/5)
- Hash key `id` (type `S`)
- **server_side_encryption** with the CMK
- **point_in_time_recovery** enabled

### Lambda
- Execution role that trusts `lambda.amazonaws.com`
- Attach **AWSLambdaBasicExecutionRole**
- Inline policies granting least‑privilege access to:
  - S3 (list, get, put on the content bucket)
  - DynamoDB (CRUD on the table)
  - KMS (Encrypt/Decrypt/DataKey/Describe on the CMK)
  - S3 Get/Put **bucket notification** (optional: separate policy resource)
- Inline **Python** handler packaged with `data.archive_file`
- Environment variables: `DYNAMODB_TABLE`, `S3_BUCKET`, `KMS_KEY_ID`
- A dedicated **CloudWatch Logs** group for the function, encrypted with CMK
- **`aws_lambda_permission`** allowing **S3** to invoke the function
- **`aws_s3_bucket_notification`** wiring **ObjectCreated** → **Lambda**

### API Gateway (REST)
- REST API + resource `/process` + `POST` method
- **AWS_PROXY** integration to Lambda
- Account‑level role for API GW → CloudWatch Logs (attach `AmazonAPIGatewayPushToCloudWatchLogs`)
- **Stage** named as the environment (`dev`/`staging`/`prod`) with **access logs** to a CMK‑encrypted log group
- **`aws_lambda_permission`** allowing **apigateway.amazonaws.com** to invoke Lambda for this API + stage

### EC2 (default VPC)
- Instance role + **instance profile**:
  - Attach **AmazonSSMManagedInstanceCore**
  - Inline least‑privilege policy: S3 `PutObject` (and `ListBucket`) on content bucket, DDB `PutItem` on table, KMS `Encrypt/GenerateDataKey/DescribeKey` on CMK
- Security group with **egress only** (no open ingress required for the proof)
- **AMI**: use SSM public parameter for Amazon Linux 2023
- User‑data script that:
  - Waits for network and AWS CLI
  - Writes a text proof to **S3** (`aws s3 cp` fallback to `s3api put-object` with SSE‑KMS if needed)
  - Writes two proof rows to **DynamoDB**
  - Uses small retry helpers to handle eventual consistency

## Variables
Define at least:
- `variable "ProjectName"`: string, default `serverless-app`, regex‑validated for `^[a-z0-9-]+$`
- `variable "Environment"`: string, default `prod`, must be one of `dev`, `staging`, `prod`

## Security Defaults
- **S3**: block public access on both buckets; enforce default encryption (SSE‑KMS on content bucket)
- **DynamoDB**: SSE with CMK + PITR
- **IAM**: narrow, explicit permissions for Lambda & EC2; attach SSM Core to EC2 role
- **CloudWatch Logs**: encrypt log groups with CMK
- **KMS**: key policy explicitly grants CloudWatch Logs and Lambda service access
- **Networking**: EC2 SG egress‑only; no open SSH; prefer SSM Session Manager

## Naming Convention (examples)
- `${var.ProjectName}-${var.Environment}-kms-key`
- `${var.ProjectName}-${var.Environment}-content-<account_id>`
- `${var.ProjectName}-${var.Environment}-logs-<account_id>`
- `${var.ProjectName}-${var.Environment}-table`
- `${var.ProjectName}-${var.Environment}-processor` (Lambda)
- `${var.ProjectName}-${var.Environment}-api` (API GW)
- `${var.ProjectName}-${var.Environment}-ec2` (instance / sg / role / profile)

## Required Outputs
Expose these (at minimum) for validation/integration tests:
- `Environment`
- `StackName`
- `S3BucketName`, `S3BucketArn`
- `DynamoDBTableName`, `DynamoDBTableArn`
- `LambdaFunctionName`, `LambdaFunctionArn`
- `ApiGatewayUrl`, `ApiGatewayId`
- `KMSKeyId`, `KMSKeyArn`
- `EC2InstanceId`, `EC2PublicIp`

## What Success Looks Like
- **Static checks pass**:
  - `ProjectName` / `Environment` variables have expected defaults & validation
  - CMK policy includes permissions for **CloudWatch Logs** service (regional) and **Lambda** service (with `kms:ViaService` + `GrantIsForAWSResource`)
  - S3 **content** bucket: versioned, SSE‑KMS with CMK, PAB enabled, logging to the **logs** bucket (prefix `access-logs/`)
  - **Logs** bucket policy grants **only** S3 logging service the required access
  - DynamoDB: **PROVISIONED**, SSE‑KMS, **PITR** enabled
  - IAM roles/policies exist for Lambda & EC2 with least privilege
  - Lambda function & CMK‑encrypted log group exist; API Gateway is wired with logs
  - S3 → Lambda **notification** configured with **lambda:InvokeFunction** permission
- **Integration checks pass**:
  - Uploads to S3 trigger Lambda (event recorded in DynamoDB)
  - `POST` to API GW invokes Lambda (row recorded in DynamoDB)
  - EC2 user‑data successfully writes to S3 (SSE‑KMS) and to DynamoDB
  - All required outputs are present and non‑empty

---

**Delivery format**: a single file named **`tap_stack.tf`** that implements the entire stack exactly as described above, with secure defaults and clear tagging. No other files or providers/backends are required; the CI harness will inject them.
