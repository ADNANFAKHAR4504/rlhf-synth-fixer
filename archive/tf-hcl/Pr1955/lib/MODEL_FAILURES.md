## 1. RDS CloudWatch Logs Export Configuration

### Failure

```terraform
enabled_cloudwatch_logs_exports = ["error", "general", "slow_query"]
```

**Error Message:**

```
Error: expected enabled_cloudwatch_logs_exports.2 to be one of ["agent" "alert" "audit" "diag.log" "error" "general" "iam-db-auth-error" "listener" "notify.log" "oemagent" "postgresql" "slowquery" "trace" "upgrade"], got slow_query
```

### Root Cause

The AWS RDS MySQL engine expects `slowquery` (without underscore) instead of `slow_query` for CloudWatch logs export configuration.

### Fix Applied

```terraform
enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]
```

---

## 2. Missing Random Provider Declaration

### Failure

Initial infrastructure configuration failed validation because RDS module used `random_password` resource without declaring the random provider.

**Error Context:**

- RDS module referenced `random_password.db_password`
- No random provider was declared in `provider.tf`
- Terraform couldn't resolve the random provider dependency

### Root Cause

The random provider was missing from the required_providers block, causing Terraform to be unable to generate secure passwords for RDS instances.

### Fix Applied

```terraform
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.4"
    }
  }
}

# Random provider for generating secure passwords
provider "random" {}
```

---

## 3. Module Structure and Dependency Issues

### Failure

Initial module implementations lacked proper variable declarations and outputs, causing validation failures during terraform planning.

**Symptoms:**

- Missing variable definitions in modules
- Undefined output references
- Module dependency resolution failures

### Root Cause

Incomplete module scaffolding with missing:

- `variables.tf` files in each module
- `outputs.tf` files in each module
- Proper variable type definitions

### Fix Applied

Created complete module structure for all 6 modules (VPC, IAM, S3, CloudTrail, EC2, RDS):

**Each module now includes:**

- `tap_stack.tf` - Resource definitions
- `variables.tf` - Input variable declarations with types and descriptions
- `outputs.tf` - Output value definitions with descriptions

---

## 4. Security Group and Network ACL Configurations

### Challenge

Ensuring security groups follow least privilege principles while maintaining functionality for multi-tier architecture.

### Solution Implemented

- **Web tier:** HTTP/HTTPS inbound from internet, outbound to app tier
- **App tier:** Custom port inbound from web tier only, outbound to database tier
- **Database tier:** MySQL/Aurora port inbound from app tier only, no internet access

---
