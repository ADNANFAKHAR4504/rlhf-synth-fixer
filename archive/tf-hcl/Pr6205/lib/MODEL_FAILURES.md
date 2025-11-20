# Overview

This document tracks all errors encountered during the deployment of the Secure Financial Data Processing Infrastructure with PCI-DSS Compliance. Each error includes root cause analysis, impact assessment, applied fixes, and prevention strategies.

---

## Critical Errors

### None identified

All errors were configuration or syntax-related and were resolved without compromising security or functionality.

***

## Configuration Errors

### Error 1: VPC Flow Log Argument Name Mismatch

**Title:** Unsupported argument `log_destination_arn` in aws_flow_log resource

**Description:**
Terraform plan failed with error indicating that the argument `log_destination_arn` is not recognized by the `aws_flow_log` resource in AWS Provider version 5.x.

**Error Message:**
```
Error: Unsupported argument
  on main.tf line 64, in resource "aws_flow_log" "vpc":
  64:   log_destination_arn = aws_cloudwatch_log_group.vpc_flow_logs.arn
An argument named "log_destination_arn" is not expected here.
```

**Root Cause:**
AWS Provider version 5.x changed the argument name from `log_destination_arn` to `log_destination` and requires an additional argument `log_destination_type` to specify the destination type (cloud-watch-logs or s3).

**Impact:**
- **Operational:** Deployment blocked, VPC flow logs cannot be created for audit trail
- **Compliance:** Without flow logs, network traffic monitoring requirement for PCI-DSS is not met
- **Security:** Lack of network visibility reduces ability to detect anomalous traffic patterns

**Fix Applied:**

```hcl
resource "aws_flow_log" "vpc" {
  vpc_id               = aws_vpc.secure_processing.id
  traffic_type         = "ALL"
  log_destination      = aws_cloudwatch_log_group.vpc_flow_logs.arn
  log_destination_type = "cloud-watch-logs"
  iam_role_arn         = aws_iam_role.flow_logs.arn

  tags = {
    Name = "flow-logs-${var.environment}"
  }
}
```

**Prevention Strategy:**
- Reference AWS Provider documentation for version-specific argument names
- Use `terraform providers schema` command to verify supported arguments
- Maintain provider version compatibility matrix in project documentation
- Test against target provider version before deployment

***

### Error 2: Invalid Reference to Undeclared Resources

**Title:** Reference to undeclared VPC and IAM role resources in aws_flow_log

**Description:**
Terraform plan failed with errors indicating references to `aws_vpc.main` and `aws_iam_role.vpc_flow_log` which do not exist in the configuration. The actual resource names in the configuration are `aws_vpc.secure_processing` and `aws_iam_role.flow_logs`.

**Error Message:**
```
Error: Reference to undeclared resource
  on main.tf line 63, in resource "aws_flow_log" "vpc":
  63:   vpc_id = aws_vpc.main.id
A managed resource "aws_vpc" "main" has not been declared in the root module.

Error: Reference to undeclared resource
  on main.tf line 67, in resource "aws_flow_log" "vpc":
  67:   iam_role_arn = aws_iam_role.vpc_flow_log.arn
A managed resource "aws_iam_role" "vpc_flow_log" has not been declared in the root module.
```

**Root Cause:**
Inconsistent resource naming between VPC flow log configuration and actual resource declarations. The flow log resource referenced `aws_vpc.main` instead of `aws_vpc.secure_processing` and `aws_iam_role.vpc_flow_log` instead of `aws_iam_role.flow_logs`.

**Impact:**
- **Operational:** Complete deployment failure, no resources created
- **Development:** Delayed deployment timeline due to debugging incorrect references
- **Configuration Management:** Indicates lack of naming convention consistency

**Fix Applied:**

```hcl
resource "aws_flow_log" "vpc" {
  vpc_id               = aws_vpc.secure_processing.id
  traffic_type         = "ALL"
  log_destination      = aws_cloudwatch_log_group.vpc_flow_logs.arn
  log_destination_type = "cloud-watch-logs"
  iam_role_arn         = aws_iam_role.flow_logs.arn

  tags = {
    Name = "flow-logs-${var.environment}"
  }
}
```

**Prevention Strategy:**
- Establish and document resource naming conventions before development
- Use consistent naming patterns across related resources (e.g., all VPC-related resources use `secure_processing` suffix)
- Implement pre-commit hooks that validate resource reference consistency
- Use IDE plugins with Terraform language server for real-time validation
- Create resource naming standards document with examples for each AWS service

***

## Syntax Errors

### Error 3: Security Group Name Constraint Violation

**Title:** Invalid security group name starting with reserved prefix "sg-"

**Description:**
Terraform plan failed when attempting to create security groups with names beginning with "sg-". AWS reserves the "sg-" prefix for system-generated security group IDs and does not allow user-defined names to start with this prefix.

**Error Message:**
```
Error: invalid value for name (cannot begin with sg-)
  with aws_security_group.lambda,
  on main.tf line 133, in resource "aws_security_group" "lambda":
  133:   name = "sg-lambda-${var.environment}"

Error: invalid value for name (cannot begin with sg-)
  with aws_security_group.vpc_endpoint,
  on main.tf line 155, in resource "aws_security_group" "vpc_endpoint":
  155:   name = "sg-vpc-endpoint-${var.environment}"
```

**Root Cause:**
AWS API validation rule prohibits security group names from starting with "sg-" to avoid conflict with auto-generated security group IDs. The naming pattern used ("sg-lambda-dev") violated this constraint.

**Impact:**
- **Operational:** Security groups cannot be created, blocking Lambda and VPC endpoint deployment
- **Network Security:** Without security groups, Lambda functions and VPC endpoints cannot enforce traffic restrictions
- **Compliance:** Network segmentation requirement cannot be met

**Fix Applied:**

```hcl
resource "aws_security_group" "lambda" {
  name        = "lambda-sg-${var.environment}"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.secure_processing.id

  tags = {
    Name = "sg-lambda-${var.environment}"
  }
}

resource "aws_security_group" "vpc_endpoint" {
  name        = "vpc-endpoint-sg-${var.environment}"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.secure_processing.id

  tags = {
    Name = "sg-vpc-endpoint-${var.environment}"
  }
}
```

**Prevention Strategy:**
- Document AWS naming constraints for all resource types in project standards
- Place prefix at end of name instead of beginning (e.g., `lambda-sg` instead of `sg-lambda`)
- Use tags for user-friendly names when resource name has constraints
- Implement validation in CI/CD pipeline that checks naming patterns against AWS restrictions
- Create naming convention template with approved patterns for each resource type
- Add pre-deployment validation script that tests resource names against AWS API constraints

***

## Logic Errors

### None identified

All errors were related to configuration syntax and AWS API constraints rather than logical flaws in infrastructure design.

***