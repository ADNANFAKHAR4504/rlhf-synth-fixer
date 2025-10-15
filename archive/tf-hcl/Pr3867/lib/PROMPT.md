You are an expert Terraform engineer. Produce a single standalone Terraform file (main.tf) that implements the full AWS infrastructure described below using HCL (no modules, no external files). Respond only with the complete contents of that single Terraform file and nothing else (no explanations or extra text). The file must be ready to save as main.tf and used with terraform init / terraform validate / terraform apply.

High-level requirements (must be implemented exactly):

Provider: AWS, region us-west-2 (hard-coded). Include a required_providers block and required_version (choose a modern Terraform version >= 1.4.0).

VPC: CIDR 10.0.0.0/16. Create exactly 2 public subnets and 2 private subnets across two availability zones in us-west-2 — explicitly use us-west-2a and us-west-2b (do not fetch AZs dynamically). Assign deterministic subnet CIDRs (e.g., 10.0.1.0/24, 10.0.2.0/24 for public; 10.0.101.0/24, 10.0.102.0/24 for private).

Internet Gateway attached to the VPC. Public subnets must route to the Internet Gateway.

NAT Gateway: Create one NAT Gateway per AZ (2 NATs total). Allocate aws_eip for each NAT. Each private subnet must route via the NAT Gateway located in the same AZ.

S3 + KMS:

Create an S3 bucket with server-side encryption using a customer-managed KMS key (aws_kms_key).

Enable versioning.

Block public access (all four block settings).

Use the KMS key for bucket_encryption (kms_master_key_id or server_side_encryption_configuration as appropriate).

IAM:

Create an IAM role and instance profile for EC2 instances.

Attach an inline policy (or aws_iam_policy) that grants:

Scoped read/write access to the created S3 bucket (least privilege; limit to the bucket ARN and its objects).

Permissions required to push CloudWatch Logs (CreateLogStream, PutLogEvents, CreateLogGroup, PutMetricData as needed).

Ensure IAM role is attachable via aws_iam_instance_profile.

EC2:

Launch EC2 instance(s) only inside private subnets (create at least 1, allow configurable instance_count).

Instances must have outbound Internet access via the NAT Gateways.

Attach the IAM instance profile created above.

Provide user_data that installs/configures the CloudWatch Logs agent (simple bootstrapping script is fine).

Expose variables for instance_type and instance_count with sensible defaults.

RDS (PostgreSQL):

Provision an aws_db_instance for PostgreSQL inside the private subnets.

Create an aws_db_subnet_group referencing the private subnets.

Ensure publicly_accessible = false.

Enable automated backups by setting backup_retention_period to a non-zero value (e.g., 7).

Set multi_az = true (for higher availability).

DB credentials: db_username and db_password variables (mark db_password as sensitive = true).

Security: only allow DB access from the EC2 security group.

Security Groups:

Create an EC2 Security Group that:

Allows inbound SSH (port 22) only from a variable var.allowed_ssh_cidr (default should be a safe value such as 0.0.0.0/0 only if user explicitly overrides — but include a visible default like your office CIDR or 0.0.0.0/0 per sample guidance; mark in a short comment).

Allows outbound traffic required for NAT, S3, CloudWatch, and RDS.

Create an RDS Security Group that allows inbound DB traffic only from the EC2 SG.

All SGs should be restrictive by default.

CloudWatch:

Create an SNS topic and an email subscription using variable var.alert_email (provide a default placeholder).

For each EC2 instance create a aws_cloudwatch_metric_alarm that triggers when CPU Utilization > 70% for 2 evaluation periods of 5 minutes each.

Configure the alarm to publish to the SNS topic.

Tagging:

Create local.common_tags and include Project, Environment, and Owner (use variables for these with defaults).

Apply local.common_tags to all tag-capable resources (VPC, subnets, IGW, NAT, EIP, route tables, EC2, RDS, S3, KMS key, IAM roles where supported, SNS, CloudWatch alarms where supported).

Outputs:

Export (Terraform outputs) the following:

vpc_id

public_subnet_ids (list)

private_subnet_ids (list)

s3_bucket_name

rds_endpoint (or address)

ec2_instance_ids

Make outputs clear and consumable by other stacks.

Variables & Defaults:

Declare variables in the same file for:

project (default "my-project")

environment (default "dev")

owner (default "owner@example.com")

allowed_ssh_cidr (default "203.0.113.0/32" or a safe example CIDR)

instance_type (default "t3.micro")

instance_count (default 1)

db_username (default "dbadmin")

db_password (sensitive = true, default a placeholder)

alert_email (default placeholder)

Provide reasonable defaults so the file is runnable immediately, but ensure db_password is sensitive.

Single-file constraint & style:

Everything must be in one file: providers, variables, locals, resources, outputs, etc.

No modules or external files.

Use explicit AZ names us-west-2a and us-west-2b (do not call data.aws_availability_zones).

Include concise inline comments describing major blocks.

Ensure HCL syntax is correct and intended to pass terraform validate.

Extras (convenience):

At bottom include an optional null_resource with a local-exec that echoes commands to validate the configuration (e.g., terraform validate and terraform plan) — do not perform destructive remote changes.

Security posture:

S3: block public access and use KMS.

RDS: not publicly accessible, only allowed from application SG.

EC2: SSH restricted to var.allowed_ssh_cidr.

IAM: scope S3 access to the created bucket.

Deliverable:

A single Terraform HCL file content (main.tf) that implements the above exactly and is syntactically correct.

The file should be ready to save and run.

Respond only with the file contents (no markdown fences, no explanation, no extra text).