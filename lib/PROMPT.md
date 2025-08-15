You are an expert Terraform engineer. Generate a brand‑new, multi‑region serverless stack for the project “IaC - AWS Nova Model Breaking”. Deliver exactly two files:

provider.tf

lib/main.tf

No other files or modules.

A) Provider file requirements (provider.tf)

Define the AWS provider with:

A default provider (no alias).

Two region aliases for multi‑region deploys:

aws.use1 → us-east-1

aws.usw2 → us-west-2

Important: Do not declare any variables in provider.tf. The variable aws_region is declared in lib/main.tf and used here.

Use the following shape (adjust to valid Terraform syntax), sourcing region values from variables and/or hardcoded aliases:

Default provider uses var.aws_region

Aliased providers pin to their regions:

provider "aws" { alias = "use1" region = "us-east-1" }

provider "aws" { alias = "usw2" region = "us-west-2" }

Pin the AWS provider version to a recent, stable major (e.g., >= 5.0).

B) Main stack (lib/main.tf) — single file only

You must place everything below into lib/main.tf:

All variable declarations (including aws_region used by provider.tf)

locals

data sources

resources

outputs

Do not put any provider blocks in lib/main.tf. This file must be self‑contained and apply cleanly for a new stack (brand‑new AWS account sections are fine).

Non‑negotiables

Exactly one Terraform logic file: lib/main.tf

No external modules. Build resources directly (this is a new stack).

Implement the full stack for both us-east-1 and us-west-2 by attaching resources to provider aliases:

provider = aws.use1

provider = aws.usw2

Follow least privilege IAM, enable encryption wherever applicable, and enforce consistent tagging.

Output only what CI/tests need; no secrets in outputs.

Technical clarifications

API Gateway is a fully managed service and does not use EC2 instance types. The requirement “using EC2 instance types t3.micro for the API Gateway” is not applicable. Satisfy the intent by:

Deploying API Gateway in both regions and

Enforcing authenticated invocation.

Ensure zero‑downtime Lambda updates via versioning + alias.

C) Functional requirements to implement in lib/main.tf

Variables

Declare:

aws_region (string) — consumed by provider.tf default provider

project_name (default: "iac-aws-nova-model-breaking")

environment (default: "dev")

owner (default: "platform-team")

kms_key_deletion_days (default: 7)

Any additional variables needed for auth configuration

All defaults go in lib/main.tf (no separate *.tfvars).

Locals

Build consistent naming: format("%s-%s-%s", var.project_name, local.component, local.region_suffix)

Region suffix map: { use1 = "use1", usw2 = "usw2" }

Common tags:

Environment

Project

Owner

ManagedBy = "terraform"

KMS for Lambda environment encryption

Create one KMS key per region (alias per region, e.g., alias/<project>-lambda-env-<region>), used for aws_lambda_function kms_key_arn.

CloudWatch logging and alerting

One log group per Lambda (explicit) with retention (e.g., 30 days).

CloudWatch Metric Alarm per region monitoring Errors for the Lambda (e.g., threshold > 0 over 5 minutes), with an SNS topic per region for alerts.

Optionally subscribe email via aws_sns_topic_subscription only if a non-secret, non‑interactive address is provided (skip otherwise).

IAM (least privilege)

Execution role per region for the Lambda:

Trust: lambda.amazonaws.com

Permissions: write to its own CW Logs group, read KMS key for env decryption, invoke permissions as needed.

If using IAM auth for API Gateway, create an invoke policy example and document usage in comments.

Lambda function (Python)

Runtime: python3.12 (or current supported)

Simple handler returning 'Hello, World!'

Package inline using filename + source_code_hash derived from an archive_file data source

Set:

publish = true

kms_key_arn = <regional key>

Environment variables map (sample safe values; no secrets)

Create a Lambda alias (e.g., live) that points to the published version for zero‑downtime updates.

API Gateway (REST API or HTTP API v2) with authentication

Implement authenticated invocation using IAM authorization (simplest, no external IdP) so that only callers with valid AWS credentials and IAM permissions can invoke.

Configure:

API (per region)

Integration to Lambda alias

Route and stage

Access logging to CloudWatch Logs for the API/stage

Add Lambda permission granting apigateway.amazonaws.com invoke rights.

Multi‑region deployment

Duplicate the entire stack in both regions by scoping each resource to its provider alias:

us-east-1 → provider = aws.use1

us-west-2 → provider = aws.usw2

Use distinct names/aliases per region (e.g., suffix with use1 / usw2).

Monitoring and alerts

Create a per‑region SNS topic and CloudWatch Alarm on Lambda Errors.

Optionally add API Gateway 5XXError or Latency alarms.

Tagging

Apply local.tags to all taggable resources (Lambda aliases do not accept tags; tag functions/log groups where allowed).

Outputs

Per region:

API endpoint URL

Lambda alias ARN

CloudWatch Log Group name

SNS Topic ARN for alarms

No secrets.

D) Security and best practices checklist

Least privilege IAM policies; restrict to needed actions.

Encrypt Lambda env vars with KMS.

CloudWatch logging enabled for Lambda and API Gateway stage access logs.

No security group or network exposure required (purely serverless).

No hardcoded secrets in code or outputs.

Deterministic naming for CI tests: follow project-name-component pattern.

E) File content shape (high level)
provider.tf

terraform block with required_providers { aws = { source = "hashicorp/aws", version = ">= 5.0" } }

default provider "aws" { region = var.aws_region }

provider "aws" { alias = "use1" region = "us-east-1" }

provider "aws" { alias = "usw2" region = "us-west-2" }

lib/main.tf

variable blocks (including aws_region)

locals (naming, tags, region suffixes)

Per region (repeat for aws.use1 and aws.usw2):

aws_kms_key + aws_kms_alias

aws_cloudwatch_log_group for Lambda

data "archive_file" to package a tiny Python hello world handler

aws_iam_role + aws_iam_role_policy for Lambda execution (least privilege)

aws_lambda_function with publish = true, kms_key_arn = …

aws_lambda_alias targeting the latest version

API Gateway (choose HTTP API v2 or REST API; either is fine). Enable IAM authorization:

routes, integrations, stage with access logging to a CW log group

aws_lambda_permission for API Gateway to invoke

aws_sns_topic + aws_cloudwatch_metric_alarm on Lambda Errors

output blocks per region for the endpoint URL, lambda alias ARN, log group, and alarms SNS topic.

F) Additional implementation notes

Keep the Hello, World! function minimal:

Handler file content (inline via archive_file) that prints and returns a JSON body {"message": "Hello, World!"}.

Use source_code_hash to force updates on code changes.

Demonstrate IAM‑based auth on API routes (document in comments how callers must sign requests with SigV4).

Ensure zero‑downtime by updating the Lambda version and re‑pointing or using a permanent alias.

G) Final deliverables

Return two code blocks only, in order:

provider.tf

lib/main.tf

They must be complete, syntactically valid Terraform HCL, ready for terraform init && terraform apply in a new environment, and pass automated tests expecting:

A Python Lambda that prints “Hello, World!”

API Gateway in both us-east-1 and us-west-2 that requires authentication (IAM) to invoke the Lambda

CloudWatch logging and alarms wired

Lambda env vars encrypted via KMS

Deterministic tagging and naming

No external modules, and no extra files beyond provider.tf and lib/main.tf
