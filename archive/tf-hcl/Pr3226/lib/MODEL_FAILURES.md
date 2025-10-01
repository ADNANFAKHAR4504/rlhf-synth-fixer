# Common Model Failures for PCI-DSS Terraform Infrastructure

## Syntax Issues

### 1.1 Inline Variables vs Separate Variables Block

**Issue**: Models often create a separate `variables.tf` file when all variables are defined inline in `main.tf` (lines 1-35).
**Fix**: Define all variables inline at the top of `main.tf` without creating a separate `variables.tf` file.

### 1.2 Incorrect CIDR Reference in Locals

**Issue**: Models reference `var.vpc_cidr` in locals instead of using the defined variable directly (line 46).
**Fix**: Use `var.vpc_cidr` consistently in locals: `vpc_cidr = var.vpc_cidr`.

### 1.3 Missing `jsonencode()` for IAM Policies

**Issue**: Models forget to wrap `assume_role_policy` with `jsonencode()` function (lines 634, 658).
**Fix**: Always use `jsonencode()` for inline JSON policies in Terraform.

### 1.4 Incorrect Count vs Length Usage

**Issue**: Models use hardcoded `count = 2` instead of dynamic `length(local.azs)` (lines 181, 189, etc.).
**Fix**: Use `count = length(local.azs)` or `count = 2` consistently based on requirements.

## Configuration Issues

### 2.1 Missing KMS Key Alias

**Issue**: Models create KMS keys without corresponding `aws_kms_alias` resource (line 111).
**Fix**: Always create a KMS alias for easier key identification: `aws_kms_alias.main`.

### 2.2 Incomplete S3 Bucket Configuration

**Issue**: Models create S3 buckets without all required PCI-DSS configurations:

- Missing `aws_s3_bucket_versioning` (line 392)
- Missing `aws_s3_bucket_server_side_encryption_configuration` (line 398)
- Missing `aws_s3_bucket_public_access_block` (line 410)
  **Fix**: Create all four resources: bucket, versioning, encryption, and public access block.

### 2.3 Incorrect Security Group Rule Structure

**Issue**: Models use `ingress` blocks inside `aws_security_group` instead of separate `aws_security_group_rule` resources.
**Fix**: Use inline `ingress`/`egress` blocks for security groups (lines 296-371).

### 2.4 Missing VPC Flow Logs

**Issue**: Models forget to enable VPC Flow Logs for audit compliance (line 158).
**Fix**: Create `aws_flow_log` resource with CloudWatch Logs destination.

## Deployment-Time Issues

### 3.1 Hardcoded Availability Zones

**Issue**: Models hardcode AZ names like `["us-east-1a", "us-east-1b"]` instead of using data source.
**Fix**: Use `data "aws_availability_zones"` with state filter (line 45).

### 3.2 Missing DB Subnet Group

**Issue**: Models create RDS without `db_subnet_group_name` parameter.
**Fix**: Create `aws_db_subnet_group` and reference it in RDS instance (lines 738-745, 781).

### 3.3 Incorrect IAM Role ARN Reference

**Issue**: Models reference `aws_iam_instance_profile.ec2.arn` instead of `.name` in launch template (line 703).
**Fix**: Use `iam_instance_profile { name = aws_iam_instance_profile.ec2.name }`.

### 3.4 WAF Association Missing

**Issue**: Models create WAF ACL but forget to associate it with ALB.
**Fix**: Create `aws_wafv2_web_acl_association` resource (lines 541-545).

### 3.5 Invalid RDS Multi-AZ Configuration

**Issue**: Models use `availability_zone` parameter with `multi_az = true`, causing conflict.
**Fix**: Remove `availability_zone` when `multi_az = true` (line 776).

## Security & Compliance Issues

### 4.1 Missing Encryption at Rest

**Issue**: Models forget to enable `storage_encrypted = true` for RDS (line 777).
**Fix**: Always enable encryption for PCI-DSS compliance.

### 4.2 Missing KMS Key for RDS

**Issue**: Models enable encryption without specifying `kms_key_id` (line 778).
**Fix**: Reference the KMS key: `kms_key_id = aws_kms_key.main.arn`.

### 4.3 Public Subnet Auto-Assign Public IP

**Issue**: Models forget to set `map_public_ip_on_launch = true` for public subnets (line 186).
**Fix**: Enable auto-assign public IP for public subnets.

### 4.4 Missing Deletion Protection

**Issue**: Models omit `deletion_protection = true` for RDS instances (line 780).
**Fix**: Enable deletion protection for production databases.

### 4.5 Inadequate Backup Retention

**Issue**: Models use default 7-day backup retention instead of PCI-DSS recommended 30+ days (line 782).
**Fix**: Set `backup_retention_period` to at least 30 days.

### 4.6 Missing CloudWatch Logs Exports

**Issue**: Models forget to enable `enabled_cloudwatch_logs_exports` for RDS (line 787).
**Fix**: Export logs: `["postgresql", "upgrade"]`.

## Best Practice Violations

### 5.1 Inconsistent Naming Convention

**Issue**: Models use inconsistent resource naming (some with prefix, some without).
**Fix**: Use `local.name_prefix` consistently across all resources (line 40).

### 5.2 Missing Common Tags

**Issue**: Models create resources without consistent tagging strategy.
**Fix**: Apply `local.common_tags` to all resources using `tags = merge(local.common_tags, {...})` (lines 41-44).

### 5.3 Hardcoded Region in Provider

**Issue**: Models hardcode `region = "us-east-1"` instead of using variable.
**Fix**: Use `region = var.aws_region` in provider configuration.

### 5.4 Missing Description Fields

**Issue**: Models omit `description` fields for security groups, KMS keys, etc.
**Fix**: Always add descriptive text for better documentation (line 112, 295, etc.).

### 5.5 No Route Table Associations

**Issue**: Models create route tables without subnet associations.
**Fix**: Create `aws_route_table_association` for each subnet (lines 232, 242, 252, etc.).

### 5.6 Launch Template Without Latest Version

**Issue**: Models reference launch templates without `$Latest` or specific version.
**Fix**: Use `version = "$Latest"` or track latest version in outputs (line 729).

## Networking Issues

### 6.1 Missing NAT Gateway EIP

**Issue**: Models create NAT Gateways without first creating Elastic IPs.
**Fix**: Create `aws_eip` resources before NAT Gateways (lines 176-179, 197-203).

### 6.2 Incorrect Route Target References

**Issue**: Models use wrong target types in routes (e.g., `gateway_id` for NAT instead of `nat_gateway_id`).
**Fix**: Use correct route target attributes (lines 216, 246).

### 6.3 Missing Internet Gateway Attachment

**Issue**: Models create Internet Gateway without VPC attachment.
**Fix**: IGW automatically attaches when `vpc_id` is specified (line 166).

### 6.4 Private Subnets with IGW Routes

**Issue**: Models accidentally route private DB subnets through Internet Gateway.
**Fix**: Private DB subnets should have no default route or local-only routes (line 256).

## Output Issues

### 7.1 Missing Critical Outputs

**Issue**: Models provide minimal outputs, missing key resource IDs needed for integration.
**Fix**: Export comprehensive outputs including IDs, ARNs, endpoints (lines 797-1244).

### 7.2 Incorrect Output Value References

**Issue**: Models output `aws_db_instance.main.address` instead of `endpoint` (line 989).
**Fix**: Use correct attribute names for outputs.

### 7.3 Non-Descriptive Output Names

**Issue**: Models use generic names like `db_endpoint` instead of `rds_endpoint`.
**Fix**: Use specific, descriptive output names.

## Resource Dependencies

### 8.1 Missing Explicit Dependencies

**Issue**: Models don't specify `depends_on` where implicit dependencies aren't sufficient.
**Fix**: Add `depends_on` for IAM role policy attachments, VPC endpoints, etc.

### 8.2 Parallel Resource Creation Conflicts

**Issue**: Models create multiple resources simultaneously that have ordering requirements.
**Fix**: Use `depends_on` to enforce creation order (e.g., VPC Flow Logs needs IAM role first).

### 8.3 Circular Dependencies

**Issue**: Models create circular references between resources.
**Fix**: Restructure resource relationships to eliminate cycles.

## Testing & Validation Issues

### 9.1 Untestable Infrastructure

**Issue**: Models create infrastructure that can't be validated with unit tests.
**Fix**: Ensure all critical configurations are exposed via outputs for testing.

### 9.2 Missing Validation Constraints

**Issue**: Models don't use variable validation blocks to catch invalid inputs.
**Fix**: Add `validation` blocks for critical variables (lines 8-12, 19-23).

### 9.3 Production-Only Configuration

**Issue**: Models hardcode production settings making testing difficult.
**Fix**: Use variables for environment-specific configurations (line 30).

## Documentation Issues

### 10.1 Missing Variable Descriptions

**Issue**: Models create variables without descriptions.
**Fix**: Add descriptive `description` fields for all variables (lines 2, 6, 14, etc.).

### 10.2 Unclear Output Purposes

**Issue**: Models provide outputs without explaining their use.
**Fix**: Add `description` fields to all outputs explaining their purpose.

### 10.3 No Architecture Comments

**Issue**: Models lack inline comments explaining design decisions.
**Fix**: Add comments for complex logic, especially in locals and conditionals.
