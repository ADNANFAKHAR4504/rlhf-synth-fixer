# Model Failures and Common Issues

This document outlines potential failures, edge cases, and common issues that may occur when working with this Terraform single-file stack configuration.

## Configuration Failures

### 1. Provider Configuration Issues

**ERROR: Provider Block in main.tf**
```hcl
# WRONG - Do not include provider blocks in main.tf
provider "aws" {
  region = var.aws_region
}
```
**SOLUTION:** Provider blocks should only exist in `provider.tf`. The `main.tf` file should only declare the `aws_region` variable.

**ERROR: Missing Required Providers**
```hcl
# WRONG - Missing archive provider in provider.tf
required_providers {
  aws = {
    source  = "hashicorp/aws"
    version = ">= 5.0"
  }
  # Missing: random and archive providers
}
```
**SOLUTION:** Ensure `provider.tf` includes all required providers: `aws`, `random`, and `archive`.

### 2. Variable Declaration Errors

**ERROR: Hardcoded Secrets**
```hcl
# WRONG - Never hardcode sensitive values
variable "db_master_password" {
  default = "mypassword123"
}
```
**SOLUTION:** Mark sensitive variables as `sensitive = true` and provide empty defaults.

**ERROR: Missing Required Variables**
```hcl
# WRONG - Missing critical variables
# Missing: aws_region, project, environment, etc.
```
**SOLUTION:** Declare all required variables listed in the IDEAL_RESPONSE.md.

### 3. Resource Naming Conflicts

**ERROR: Static Resource Names**
```hcl
# WRONG - Static names cause conflicts in CI
resource "aws_s3_bucket" "static" {
  bucket = "my-static-bucket"  # Will conflict in CI
}
```
**SOLUTION:** Use account ID and random suffix for globally unique names:
```hcl
bucket = "prodapp-static-${local.account_id}-${local.suffix_hex}"
```

## Security Failures

### 4. IAM Permission Issues

**ERROR: Overly Broad IAM Policies**
```hcl
# WRONG - Wildcard resources and actions
statement {
  actions   = ["s3:*"]
  resources = ["*"]
}
```
**SOLUTION:** Use least privilege with specific resource ARNs:
```hcl
statement {
  actions = ["s3:GetObject", "s3:ListBucket"]
  resources = [
    aws_s3_bucket.static.arn,
    "${aws_s3_bucket.static.arn}/*"
  ]
}
```

**ERROR: Missing VPC Permissions for Lambda**
```hcl
# WRONG - Lambda in VPC without proper permissions
# Missing EC2 VPC permissions for ENI management
```
**SOLUTION:** Include VPC-related permissions for Lambda:
```hcl
statement {
  actions = [
    "ec2:CreateNetworkInterface",
    "ec2:DescribeNetworkInterfaces", 
    "ec2:DeleteNetworkInterface"
  ]
  resources = ["*"]  # Required for VPC permissions
}
```

### 5. S3 Security Misconfigurations

**ERROR: Deprecated ACL Usage**
```hcl
# WRONG - Deprecated inline ACL
resource "aws_s3_bucket" "static" {
  bucket = local.s3_names.static
  acl    = "private"  # Deprecated
}
```
**SOLUTION:** Use separate ACL resources with ownership controls:
```hcl
resource "aws_s3_bucket_acl" "static" {
  bucket     = aws_s3_bucket.static.id
  acl        = "private"
  depends_on = [aws_s3_bucket_ownership_controls.static]
}
```

**ERROR: Missing Public Access Block**
```hcl
# WRONG - S3 bucket without public access restrictions
resource "aws_s3_bucket" "static" {
  bucket = local.s3_names.static
  # Missing: public access block
}
```
**SOLUTION:** Always include public access block for security.

### 6. Network Security Issues

**ERROR: Open Security Groups**
```hcl
# WRONG - Overly permissive security group
ingress {
  from_port   = 0
  to_port     = 65535
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
}
```
**SOLUTION:** Restrict access to specific ports and sources:
```hcl
ingress {
  from_port       = 5432
  to_port         = 5432
  protocol        = "tcp"
  security_groups = [aws_security_group.lambda_sg.id]
}
```

## API Gateway Failures

### 7. API Gateway Configuration Issues

**ERROR: Incorrect Stage Configuration**
```hcl
# WRONG - stage_name as attribute of deployment
resource "aws_api_gateway_deployment" "deployment" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  stage_name  = "prod"  # This attribute doesn't exist
}
```
**SOLUTION:** Use separate stage resource:
```hcl
resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.deployment.id
  rest_api_id   = aws_api_gateway_rest_api.api.id
  stage_name    = "prod"
}
```

**ERROR: Missing Deployment Triggers**
```hcl
# WRONG - Deployment without triggers may not redeploy
resource "aws_api_gateway_deployment" "deployment" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  # Missing: triggers for redeployment
}
```
**SOLUTION:** Include deployment triggers to ensure updates.

## Lambda Function Failures

### 8. Lambda Code Packaging Issues

**ERROR: Missing Lambda Code File**
```hcl
# WRONG - References non-existent zip file
resource "aws_lambda_function" "app" {
  filename = "path/to/nonexistent/lambda.zip"
}
```
**SOLUTION:** Use inline code with archive data source:
```hcl
data "archive_file" "lambda_zip" {
  type = "zip"
  source {
    content  = "def handler(event, context): ..."
    filename = "app.py"
  }
}
```

**ERROR: Incorrect Handler Configuration**
```hcl
# WRONG - Handler doesn't match code structure
resource "aws_lambda_function" "app" {
  handler = "index.handler"  # But code is in app.py
}
```
**SOLUTION:** Ensure handler matches filename: `app.handler` for `app.py`.

### 9. Lambda VPC Configuration Issues

**ERROR: Lambda Without VPC Access to RDS**
```hcl
# WRONG - Lambda needs VPC config to reach RDS
resource "aws_lambda_function" "app" {
  # Missing: vpc_config block
}
```
**SOLUTION:** Configure Lambda VPC access when using RDS.

## RDS Configuration Failures

### 10. Database Configuration Issues

**ERROR: Deprecated Database Name Attribute**
```hcl
# WRONG - 'name' attribute is deprecated
resource "aws_db_instance" "db" {
  name     = "mydb"  # Deprecated
}
```
**SOLUTION:** Use `db_name` instead:
```hcl
resource "aws_db_instance" "db" {
  db_name = "${var.project}_db"
}
```

**ERROR: Public Database Access**
```hcl
# WRONG - RDS publicly accessible
resource "aws_db_instance" "db" {
  publicly_accessible = true  # Security risk
}
```
**SOLUTION:** Always set `publicly_accessible = false` for security.

**ERROR: Missing Storage Encryption**
```hcl
# WRONG - Unencrypted RDS storage
resource "aws_db_instance" "db" {
  # Missing: storage_encrypted = true
}
```
**SOLUTION:** Always enable storage encryption.

## Data Source Issues

### 11. Deprecated Data Sources

**ERROR: Using Deprecated aws_subnet_ids**
```hcl
# WRONG - aws_subnet_ids is deprecated
data "aws_subnet_ids" "default_vpc" {
  vpc_id = data.aws_vpc.default.id
}
```
**SOLUTION:** Use `aws_subnets` instead (though current code still works).

## Output Configuration Failures

### 12. Incorrect Output Structure

**ERROR: Sensitive Outputs**
```hcl
# WRONG - Outputting sensitive information
output "database_password" {
  value = aws_db_instance.db.password
}
```
**SOLUTION:** Never output sensitive values. Mark as `sensitive = false` explicitly for non-sensitive outputs.

**ERROR: Missing Required Outputs**
```hcl
# WRONG - Missing outputs required by integration tests
# Missing: api_gateway_url, rds_instance_identifier, etc.
```
**SOLUTION:** Include all outputs specified in requirements.

**ERROR: Incorrect Output Naming**
```hcl
# WRONG - Output name doesn't match expected format
output "api_gateway_invoke_url" {  # Should be "api_gateway_url"
  value = "https://..."
}
```
**SOLUTION:** Use exact output names expected by integration tests.

## Tagging and Compliance Failures

### 13. Inconsistent Tagging

**ERROR: Missing Common Tags**
```hcl
# WRONG - Resources without consistent tags
resource "aws_s3_bucket" "static" {
  bucket = local.s3_names.static
  # Missing: tags = local.common_tags
}
```
**SOLUTION:** Apply common tags to all taggable resources.

**ERROR: Missing Required Tag Fields**
```hcl
# WRONG - Incomplete common_tags
locals {
  common_tags = {
    Environment = var.environment
    # Missing: Owner, Project, ManagedBy
  }
}
```
**SOLUTION:** Include all required tag fields.

## Testing and CI/CD Failures

### 14. Test Incompatible Configurations

**ERROR: Non-Conditional RDS Outputs**
```hcl
# WRONG - Output fails when RDS is disabled
output "rds_instance_identifier" {
  value = aws_db_instance.db.id  # Fails when count = 0
}
```
**SOLUTION:** Use conditional output:
```hcl
output "rds_instance_identifier" {
  value = var.create_rds ? aws_db_instance.db[0].id : ""
}
```

**ERROR: Hardcoded Account Dependencies**
```hcl
# WRONG - Hardcoded account ID
resource "aws_s3_bucket" "static" {
  bucket = "prodapp-static-123456789012-abc123"
}
```
**SOLUTION:** Use dynamic account ID from data source.

## Deployment Environment Issues

### 15. Environment-Specific Failures

**ERROR: Missing Backend Configuration**
```hcl
# WRONG - Backend configuration in main.tf
terraform {
  backend "s3" {
    bucket = "my-terraform-state"
  }
}
```
**SOLUTION:** Backend configuration should be in `provider.tf` or injected at runtime.

**ERROR: Region Hardcoding**
```hcl
# WRONG - Hardcoded region
resource "aws_s3_bucket" "static" {
  # References us-east-1 specific resources
}
```
**SOLUTION:** Use `var.aws_region` and dynamic data sources.

## Performance and Cost Issues

### 16. Resource Sizing Problems

**ERROR: Oversized Resources**
```hcl
# WRONG - Expensive instance types for development
variable "db_instance_class" {
  default = "db.r5.2xlarge"  # Too large for dev/test
}
```
**SOLUTION:** Use cost-effective defaults like `db.t3.micro`.

**ERROR: Missing Lifecycle Policies**
```hcl
# WRONG - S3 without lifecycle management
resource "aws_s3_bucket" "static" {
  # Missing: lifecycle configuration
}
```
**SOLUTION:** Include lifecycle policies for cost optimization.

## Common Error Messages and Solutions

### Terraform Validation Errors
- `Error: Argument "stage_name" is not expected here` → Use separate stage resource
- `Error: "name" is deprecated for aws_db_instance` → Use `db_name` instead  
- `Error: provider "archive" is required` → Add to `provider.tf`

### AWS API Errors
- `BucketAlreadyExists` → Ensure unique bucket names with suffix
- `InvalidParameterValue: VPC configuration is required` → Add VPC config to Lambda
- `AccessDenied: Missing permissions` → Review IAM policies for least privilege

### Integration Test Failures
- `OutputNotFound` → Ensure all required outputs are defined
- `ResourceNotFound` → Check conditional resource creation logic
- `InvalidURL` → Verify API Gateway URL construction

This document should be updated as new failure patterns are discovered during development and deployment.