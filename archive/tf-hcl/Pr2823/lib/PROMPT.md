ROLE
You are a senior Terraform engineer. Produce production-ready, valid HCL that passes terraform validateand plans cleanly.

OBJECTIVE
Create a secure, multi-account AWS infrastructure using Terraform 0.14+ for three environments: dev, test, prod. Each environment is isolated in its own AWS account. Follow least-privilege, encryption-first, and HTTPS-only principles. Output exactly two files: provider.tfand tap_stack.tf.

ENVIRONMENT INPUTS

Region: us-east-1 (supplied via var.aws_region)
Environments: dev, test, prod (set via var.environment)
Accounts: one AWS account per environment (assumed via var.assume_role_arn)
Naming: <env>-<service>-<resource>Approved CIDRs for SGs: provided via variables
Optional: vpc_id(for Flow Logs), cdn_domainand route53_zone_idfor CloudFront + ACM
Tags required on all resources: Environment, Owner, Purpose
REQUIREMENTS

1. Provider & syntax

Terraform required\_version >= 0.14
AWS provider only
Configure a single default provider that assumes role from var.assume_role_arnand uses var.aws_region   Apply default_tagsfor Environment, Owner, Purpose
2. KMS encryption

Create a KMS CMK per deployment and reference it from all encryptable services:

S3 buckets (server access logs, data buckets)
CloudTrail
RDS storage (see below)
CloudWatch Logs where supported

3. RDS encryption

All RDS instances must set storage_encrypted = trueand kms_key_idto the CMK
No publicly accessible RDS; SGs locked to approved CIDRs

4. CloudFront HTTPS-only

CloudFront distribution forces HTTPS (viewer_protocol_policy = redirect-to-https)
Prefer an AWS-managed ACM certificate in us-east-1 for var.cdn_domain   If cdn_domain/route53_zone_idnot provided, fall back to CloudFront default certificate but keep HTTPS-only

5. IAM least privilege

Roles and policies must be minimum necessary; avoid “\” in Action/Resource unless strictly unavoidable and commented
Separate roles for admin vs app access
Trust policies scoped to needed principals only

6. Security groups

Allow inbound only from approved CIDRs passed via variables
Restrict SSH/RDP specifically; no 0.0.0.0/0on sensitive ports

7. S3 hardening

Buckets private by default; Block Public Access enabled
Mandatory SSE at rest (SSE-KMS with CMK or SSE-S3 per bucket)
Bucket policies enforce:

aws:SecureTransport = true(deny non-TLS)
Required SSE on PutObject   Enable S3 server access logging to a dedicated logs bucket

8. Logging & audit

Multi-region CloudTrail with management (and relevant data) events
CloudTrail to encrypted S3; CloudWatch Logs integration enabled
Enable VPC Flow Logs for var.vpc_id   Enable CloudFront standard logs to S3 and ALB/ELB access logs if used
RDS enhanced monitoring / logs to CloudWatch where supported

9. IAM policy change alarms

Create a CloudWatch Logs metric filter on CloudTrail for failed IAM policy modification attempts:

eventSource = "iam.amazonaws.com"     errorCodestarts with AccessDenied     eventNamematches Policy  CloudWatch Alarm (5-minute period, ≥1) with SNS notification; topic + optional subscription address via variables

10. Tagging & naming

Every resource tagged with Environment, Owner, PurposeResource names follow <env>-<service>-<resource>; centralize prefixing in locals
CONSTRAINTS (HARD)

Only two files: provider.tfand tap_stack.tf(no modules, no extra files)
No external/proprietary modules
Avoid hardcoded ARNs; build from resource attributes or variables and the resource should be unique no duplication
Code must be environment-selectable via var.environment(deploy one env per run)
Use jsonencodeand/or aws_iam_policy_documentfor policies
No deprecated arguments; least-privilege throughout


FILES TO PRODUCE (STRICT FORMAT)

1. provider.tf

terraformblock with required_version >= 0.14and AWS in required_providers   variable "aws_region"with default us-east-1   variable "environment"with validation: one of dev, test, prod   variable "assume_role_arn"for the target account
variable "owner", variable "purpose"   provider "aws"using region = var.aws_regionand assume_role { role_arn = var.assume_role_arn }   default_tagsapplying Environment = var.environment, Owner = var.owner, Purpose = var.purpose
2. tap\_stack.tf

Variables:

vpc_id(optional, for Flow Logs)
approved_cidrs(list)
cdn_domain, route53_zone_id(optional)
alarm_email(optional)
Locals:

Name prefix based on <env>-<service>     Common tags map
KMS:

CMK with key policy permitting CloudTrail, CloudWatch Logs, S3 usage (principals limited)
S3:

Logs bucket (encrypted, BPA on, access logging disabled on itself)
App/data bucket(s) (encrypted, versioning, BPA on)
dont point out the existing s3 buckets.
Bucket policies enforcing TLS and SSE; deny changing/removing encryption
Server access logging from buckets and CloudFront to logs bucket
CloudTrail:

Multi-region trail writing to logs bucket, KMS-encrypted, CloudWatch Logs integration
CloudFront:

Distribution with HTTPS-only; ACM cert in us-east-1 if cdn_domainprovided, else default certificate
Logging to logs bucket
RDS (representative instance for pattern):

Encrypted at rest with CMK; SG tightly scoped to approved_cidrs   Security Groups:

SSH/RDP/HTTP/HTTPS rules restricted to approved_cidrs; no broad exposure
IAM roles/policies:

Least-privilege roles for admin/app duties; no wildcards unless justified
CloudWatch IAM policy change alarm:

Metric filter on CloudTrail log group for failed Policycalls with AccessDenied     Alarm with SNS topic (create topic; subscription optional via alarm_email)
Outputs:

KMS key ARN, logs bucket name/ARN
CloudTrail trail name
CloudFront distribution ID/DomainName
RDS instance ID
Security Group IDs
IAM policy JSONs (rendered) and any critical ARNs (for compliance tests)

QUALITY & STYLE

Clear, concise comments for every security-critical choice
Deterministic names (avoid random suffixes)
Use data sources and locals to avoid duplication

VALIDATION CHECKLIST (SELF-VERIFY)

terraform validatepasses
Default tags applied everywhere
CMK created and referenced by S3, CloudTrail, RDS, CW Logs
RDS storage encrypted; SGs restricted to approved CIDRs
CloudFront enforces HTTPS; uses ACM if domain provided
S3 private + BPA; TLS and SSE enforced via policy; access logging enabled
CloudTrail multi-region, KMS-encrypted, CW Logs integrated
Metric filter + alarm for failed IAM policy modifications with SNS
Outputs include required identifiers and policy JSONs
No external modules; only provider.tfand tap_stack.tf
DELIVER NOW
Output exactly TWO fenced HCL code blocks labeled with filenames:

1. provider.tf2. tap_stack.tf   No prose, no explanations—just the two files.