Model_Failures.md

This document outlines common failures and issues encountered when implementing the AWS infrastructure requirements, along with their solutions.

Common Terraform Errors

1. Dependency Cycle Errors

Error: Error: Cycle: aws_iam_instance_profile.ec2_profile (destroy), aws_iam_role.ec2_role (destroy), aws_iam_role.ec2_role, aws_iam_instance_profile.ec2_profile (expand)

Cause: Circular dependencies between IAM resources, often involving launch templates or instance profiles.

Solution:

Use depends_on to explicitly manage dependencies
Reorder resources to ensure proper creation sequence
Remove any references to non-existent resources in state

resource "aws_iam_instance_profile" "ec2_profile" {
name = "${local.name_prefix}-ec2-instance-profile"
role = aws_iam_role.ec2_role.name
depends_on = [aws_iam_role_policy_attachment.ec2_ssm_core]
}

2. Region Deprecation Warnings

Error: Warning: Deprecated attribute on line X: The attribute "name" is deprecated. Refer to the provider documentation for details.

Cause: Using deprecated data.aws_region.current.name instead of data.aws_region.current.id.

Solution: Replace all occurrences:

Before (deprecated)
region = data.aws_region.current.name

After (current)
region = data.aws_region.current.id

3. Backend Configuration Issues

Error: Error: Backend initialization required, please run "terraform init"

Cause: Backend configuration changes or missing backend setup.

Solution:

terraform init -reconfigure

4. S3 Bucket Naming Conflicts

Error: Error: error creating S3 bucket: BucketAlreadyExists

Cause: S3 bucket names must be globally unique.

Solution: Use random suffixes:

resource "random_id" "bucket_suffix" {
byte_length = 4
}

resource "aws_s3_bucket" "example" {
bucket = "${local.name_prefix}-example-${random_id.bucket_suffix.hex}"
}

Security Configuration Issues

1. KMS Key Policy Errors

Error: Error: error creating KMS key: InvalidArnException

Cause: Incorrect ARN format in KMS key policies.

Solution: Use data sources for dynamic ARNs:

data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}
data "aws_region" "current" {}

Use in policy
"arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"

2. S3 Bucket Policy Syntax Errors

Error: Error: error putting S3 bucket policy: MalformedPolicy

Cause: Incorrect JSON syntax or invalid policy structure.

Solution: Validate JSON syntax and ensure proper policy structure:

resource "aws*s3_bucket_policy" "example" {
bucket = aws_s3_bucket.example.id
policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Sid = "DenyInsecureConnections"
Effect = "Deny"
Principal = "*"
Action = "s3:\_"
Resource = [
aws_s3_bucket.example.arn,
"${aws_s3_bucket.example.arn}/*"
]
Condition = {
Bool = {
"aws:SecureTransport" = "false"
}
}
}
]
})
}

3. IAM Role Trust Policy Issues

Error: Error: error creating IAM role: MalformedPolicyDocument

Cause: Incorrect assume role policy format.

Solution: Ensure proper JSON structure:

resource "aws_iam_role" "example" {
name = "example-role"
assume_role_policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Action = "sts:AssumeRole"
Effect = "Allow"
Principal = {
Service = "ec2.amazonaws.com"
}
}
]
})
}

Resource Configuration Issues

1. VPC Flow Logs Configuration

Error: Error: error creating Flow Log: InvalidParameterValue

Cause: Incorrect log format or destination configuration.

Solution: Use correct log format and ensure IAM role has proper permissions:

resource "aws_flow_log" "vpc" {
iam_role_arn = aws_iam_role.vpc_flow_logs.arn
log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
traffic_type = "ALL"
vpc_id = var.vpc_id

log_format = "$${version} $${account-id} $${interface-id} $${srcaddr} $${dstaddr} $${srcport} $${dstport} $${protocol} $${packets} $${bytes} $${windowstart} $${windowend} $${action} $${flowlogstatus}"
}

2. CloudTrail Configuration

Error: Error: error creating CloudTrail: InvalidS3BucketNameException

Cause: S3 bucket doesn't exist or incorrect bucket name.

Solution: Ensure S3 bucket exists before creating CloudTrail:

resource "aws_cloudtrail" "main" {
name = "${local.name_prefix}-cloudtrail"
s3_bucket_name = aws_s3_bucket.cloudtrail.bucket
other configuration
}

3. RDS Configuration

Error: Error: error creating RDS instance: InvalidParameterValue

Cause: Invalid engine version or instance class.

Solution: Use supported combinations:

resource "aws_db_instance" "main" {
engine = "postgres"
engine_version = "15.4"
instance_class = "db.t3.micro"
other configuration
}

Testing and Validation Issues

1. Terraform Validate Errors

Error: Error: Invalid value for "variable"

Cause: Variable type mismatches or validation failures.

Solution: Check variable definitions and ensure proper types:

variable "allowed_ingress_cidrs" {
description = "List of CIDR blocks allowed for ingress"
type = list(string)
default = ["10.0.0.0/8", "172.16.0.0/12"]
}

2. Plan Failures

Error: Error: Provider produced inconsistent final plan

Cause: Resource dependencies or configuration conflicts.

Solution:

Run terraform plan -refresh-only to refresh state
Check for circular dependencies
Ensure all required variables are provided

Best Practices to Avoid Issues

1. Use Data Sources: Always use data sources for dynamic values like account ID, region, and partition.

2. Validate JSON: Use jsonencode() for complex JSON structures to ensure proper syntax.

3. Test Incrementally: Deploy resources in stages to identify issues early.

4. Use Workspaces: Use Terraform workspaces for different environments.

5. Document Dependencies: Use depends_on explicitly when needed.

6. Validate Early: Run terraform validate and terraform plan frequently.

Troubleshooting Commands

Validate configuration
terraform validate

Plan deployment
terraform plan

Refresh state
terraform refresh

Show current state
terraform show

List resources in state
terraform state list

Remove problematic resources from state
terraform state rm aws_resource.name

Reconfigure backend
terraform init -reconfigure

Common State Management Issues

1. State Lock Issues

Error: Error acquiring the state lock

Solution:

Force unlock (use with caution)
terraform force-unlock <lock-id>

2. State Inconsistencies

Error: Error: Resource not found

Solution:

Refresh state
terraform refresh

Or remove and re-import
terraform state rm aws_resource.name
terraform import aws_resource.name resource-id

This document should be updated as new issues are encountered and resolved.
