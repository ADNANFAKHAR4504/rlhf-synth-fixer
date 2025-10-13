You are an expert Terraform Infrastructure Engineer specializing in secure AWS architectures aligned with CIS, NIST, and AWS Security Best Practices.
Your task is to produce a complete single-file Terraform configuration (main.tf) that securely configures an AWS environment according to the defined requirements.
Output only Terraform code — no explanations, comments, or placeholders.

You are tasked with implementing a secure and compliant AWS infrastructure using Terraform instead of CloudFormation.
The result must be a single-file Terraform configuration (main.tf), deployable directly via terraform apply, following AWS and enterprise security standards.

Problem Context:

Design an AWS infrastructure that meets strict security, encryption, access control, and monitoring standards.
The deployment will occur in us-west-2 and must enforce encryption, compliance auditing, and least-privilege IAM access across all resources.

All infrastructure resources must follow a consistent naming convention beginning with the prefix SecCFN.

Core Implementation Requirements:
1. IAM and Access Control

Create IAM roles and policies for all services (Lambda, RDS, CloudTrail, AWS Config).

Apply the principle of least privilege for each role.

No hardcoded credentials or inline policies — attach managed or inline policies with strict scoping.

Enforce MFA on root or privileged access.

2. Data Encryption

Use AWS KMS (CMK) to encrypt all data at rest (S3, RDS, CloudTrail, Lambda environment variables).

Apply KMS key policies for fine-grained access control.

Ensure data in transit is encrypted (HTTPS/TLS for all endpoints, SSL enforcement for RDS).

3. Storage and Logging

Create S3 buckets for:

Log storage (CloudTrail, Config, Lambda logs).

Ensure buckets block all public access.

Enable versioning and lifecycle policies for archival and cost control.

Deliver CloudTrail and AWS Config logs securely to this bucket.

Enforce server-side encryption (KMS) for all stored data.

4. Compliance Monitoring

Deploy AWS Config with managed rules enforcing:

S3 public access blocked

RDS encryption enabled

CloudTrail enabled

MFA enabled for root

Configure SNS notifications for non-compliant resources.

Integrate with CloudWatch Alarms for alerting.

5. Network and Traffic Control

Create a VPC with public and private subnets.

Configure Internet Gateway, NAT Gateway, and Route Tables.

Use Security Groups and Network ACLs to restrict inbound and outbound traffic to only required ports.

Deny all non-essential traffic by default.

6. Compute and Application Layer

Deploy an example Lambda function using the latest runtime (Python 3.12).

Assign the Lambda function a KMS-enabled IAM role.

Ensure Lambda logs go to CloudWatch with encryption enabled.

7. Database Layer

Deploy an RDS instance (PostgreSQL or MySQL) inside private subnets.

Enable storage encryption, automated backups, and SSL connections only.

Output the RDS endpoint.

 8. Monitoring and Alerts

Enable AWS CloudTrail (multi-region) and deliver logs to the encrypted S3 bucket.

Enable CloudWatch Logs and create CloudWatch Alarms that trigger on:

AWS Config non-compliance

Root account usage

Unauthorized API calls

Create an SNS topic for alerts and subscribe administrator email addresses.

Constraints

All code must be in a single file (main.tf) — do not modularize.

All resources must be deployed in us-west-2.

Prefix all names with SecCFN.

Apply consistent tagging:

Environment = "Production"

Project = "SecCFN"

Owner = "SecurityTeam"

No hardcoded secrets; use variables or data sources where required.

Terraform must pass:

terraform init
terraform validate
terraform plan
terraform apply

Expected Output

Produce a fully functional Terraform file named main.tf containing:

Provider configuration (AWS provider for us-west-2).

KMS key creation and usage.

IAM roles and policies.

S3 bucket(s) for logging and encryption.

AWS Config setup and rules.

CloudTrail with delivery to the S3 bucket.

CloudWatch alarms and SNS notifications.

Lambda function (latest runtime).

RDS database (encrypted and SSL enforced).

Security Groups, Network ACLs, and VPC setup.

Terraform outputs:

kms_key_arn

s3_bucket_name

iam_role_arn

rds_endpoint

sns_topic_arn

Output Format:

# main.tf
<entire Terraform configuration here>

Output Instructions

Produce only Terraform HCL code, no commentary or prose.

The entire configuration must be in a single Terraform file (main.tf).

Code must be deployable and syntactically correct.

Include resource dependencies and encryption attributes everywhere.

Avoid placeholders or <example> values — use realistic defaults.