You are an expert Terraform engineer. Generate a brand-new multi-region serverless stack for the
project “IaC - AWS Nova Model Breaking”. Deliver exactly two files only:
- provider.tf
- lib/tap_stack.tf
No other files or modules.
Provider (provider.tf)
- Pin AWS provider >= 5.0.
- Default provider uses var.aws_region.
- Aliases:
- aws.use1 → us-east-1
- aws.usw2 → us-west-2
- No variables in this file (they go into lib/tap_stack.tf).
Main Stack (lib/tap_stack.tf)
- Contains everything else: variables, locals, data sources, resources, outputs.
- No providers here; self-contained stack for new AWS account.
- No external modules; build resources directly.
- Implement stack in both us-east-1 and us-west-2 with provider aliases.
- Apply least privilege IAM, KMS encryption, and tagging.
- Outputs: API endpoint URL, Lambda alias ARN, CloudWatch Log Group name, SNS Topic ARN
(no secrets).
Variables:
- aws_region (string)
- project_name (default: "iac-aws-nova-model-breaking")
- environment (default: "dev")
- owner (default: "platform-team")
- kms_key_deletion_days (default: 7)
Resources per region:
- KMS key + alias (Lambda env encryption).
- CloudWatch log group per Lambda (30-day retention).
- IAM role + policy for Lambda execution (logs + decrypt).
- Lambda function (Python 3.12, Hello World, archive_file packaged, alias "live").
- API Gateway (HTTP API v2) with IAM auth, integrated with Lambda alias, logging enabled.
- CloudWatch Alarm on Lambda Errors + SNS topic per region.
Security Best Practices
- IAM = least privilege only.
- Encrypt Lambda env vars with KMS.
- CloudWatch logs enabled for Lambda + API Gateway.
- No SGs or VPC exposure (serverless).
- No hardcoded secrets.
- Deterministic naming for CI tests.
Deliverables
Return two code blocks only, in order:
1. provider.tf
2. lib/tap_stack.tf
Both must be valid HCL, runnable with:
terraform init && terraform apply
They must provision multi-region API Gateway (IAM-auth) + Lambda (“Hello, World!”), encrypted
Lambda env vars, CloudWatch logging + alarms, and deterministic tags/names.