# Model Failures and Fixes

## Issue 1 — Invalid PostgreSQL Version

**Error:**

```
InvalidParameterCombination: Cannot find version 15.4 for postgres
```

**Root Cause:** PostgreSQL 15.4 is not available in the selected region (us-east-1). AWS RDS only supports specific minor versions of PostgreSQL.

**Fix:** Updated `engine_version` in `modules/database/main.tf` from **15.4** to **15.14**, which is a supported version in the AWS region.

**File Changed:** `modules/database/main.tf`
**Line:** 64
**Change:**
```terraform
# Before
engine_version = "15.4"

# After
engine_version = "15.14"
```

---

## Issue 2 — S3 Lifecycle Configuration Missing Filter

**Error:**

```
Warning: Invalid Attribute Combination
  with module.storage.aws_s3_bucket_lifecycle_configuration.transaction_logs,
  on modules/storage/main.tf line 55, in resource "aws_s3_bucket_lifecycle_configuration" "transaction_logs":
  55: resource "aws_s3_bucket_lifecycle_configuration" "transaction_logs" {

No attribute specified when one (and only one) of [rule[0].filter,rule[0].prefix] is required
```

**Root Cause:** AWS S3 lifecycle configuration rules require either a `filter` or `prefix` attribute. The rule was missing both.

**Fix:** Added an empty `filter {}` block to the lifecycle rule in `modules/storage/main.tf`.

**File Changed:** `modules/storage/main.tf`
**Line:** 59
**Change:**
```terraform
# Before
rule {
  id     = "transition-and-expire"
  status = "Enabled"
  
  transition {
    ...

# After
rule {
  id     = "transition-and-expire"
  status = "Enabled"
  
  filter {}
  
  transition {
    ...
```

---

## Issue 3 — Invalid ALB Listener Configuration

**Error:**

```
Error: Insufficient target_group blocks
  on modules/compute/main.tf line 213, in resource "aws_lb_listener" "http":
  213:       content {

At least 1 "target_group" blocks are required.

Error: Unsupported argument
  on modules/compute/main.tf line 214, in resource "aws_lb_listener" "http":
  214:         target_group_arn = aws_lb_target_group.main.arn

An argument named "target_group_arn" is not expected here.
```

**Root Cause:** The ALB listener's `default_action` block was using an invalid `dynamic "forward"` block. The `forward` action type does not support a dynamic block with nested `target_group_arn`. When the action type is "forward", the `target_group_arn` should be directly specified in the `default_action` block.

**Fix:** Simplified the listener configuration to directly use `target_group_arn` in the `default_action` block when certificate is not provided.

**File Changed:** `modules/compute/main.tf`
**Lines:** 198-219
**Change:**
```terraform
# Before
default_action {
  type = var.certificate_arn != "" ? "redirect" : "forward"
  
  dynamic "redirect" {
    for_each = var.certificate_arn != "" ? [1] : []
    content {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
  
  dynamic "forward" {
    for_each = var.certificate_arn == "" ? [1] : []
    content {
      target_group_arn = aws_lb_target_group.main.arn
    }
  }
}

# After
default_action {
  type             = var.certificate_arn != "" ? "redirect" : "forward"
  target_group_arn = var.certificate_arn == "" ? aws_lb_target_group.main.arn : null
  
  dynamic "redirect" {
    for_each = var.certificate_arn != "" ? [1] : []
    content {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}
```

---

## Enhancement 1 — Added PR Number to All Resources

**Requirement:** Add `pr_number` variable to all resources for better identification and isolation.

**Implementation:**

1. **Added `pr_number` variable** to root `variables.tf`:
```terraform
variable "pr_number" {
  description = "PR number for resource identification and naming"
  type        = string
}
```

2. **Updated all `.tfvars` files**:
```terraform
# dev.tfvars
pr_number = "pr7072dev"

# staging.tfvars
pr_number = "pr7072staging"

# prod.tfvars
pr_number = "pr7072prod"
```

3. **Updated resource naming** in `main.tf`:
```terraform
# Before
resource_prefix = "${var.project_name}-${local.environment}"

# After
resource_prefix = "${var.project_name}-${var.pr_number}"
```

4. **Added `pr_number` to all module variables** and updated all resource names to use it.

5. **Added `PRNumber` to common tags**:
```terraform
common_tags = {
  Environment = local.environment
  Project     = var.project_name
  ManagedBy   = "Terraform"
  Workspace   = terraform.workspace
  PRNumber    = var.pr_number
}
```

**Result:** All resources now include the PR number in their names (e.g., `payment-processing-pr7072dev-vpc`, `payment-processing-pr7072dev-cluster`).

---

## Enhancement 2 — Implemented Shared KMS Key for Encryption

**Requirement:** Create a single KMS key with proper policies for EBS, RDS, and S3 encryption.

**Implementation:**

1. **Created new KMS module** at `modules/kms/`:
   - `main.tf` - KMS key resource with comprehensive policy
   - `variables.tf` - Module inputs
   - `outputs.tf` - KMS key ID and ARN outputs

2. **KMS Key Policy** includes permissions for:
   - Root account (full permissions)
   - ECS task execution role
   - RDS service
   - S3 service
   - CloudWatch Logs service
   - Grant creation for AWS services

3. **Removed individual KMS keys** from:
   - `modules/database/main.tf` - Removed RDS-specific KMS key
   - `modules/storage/main.tf` - Removed S3-specific KMS key

4. **Updated modules to use shared KMS**:
```terraform
# Database module
kms_key_id = var.kms_key_arn  # Instead of aws_kms_key.rds.arn

# Storage module
kms_master_key_id = var.kms_key_arn  # Instead of aws_kms_key.s3.arn
```

5. **Added KMS module to main.tf**:
```terraform
module "kms" {
  source = "./modules/kms"
  
  environment    = local.environment
  project_name   = var.project_name
  pr_number      = var.pr_number
  aws_region     = var.aws_region
  tags           = local.common_tags
  
  ecs_task_execution_role_arn = ""
}
```

**Benefits:**
- Single key for all encryption needs
- Simplified key management
- Consistent encryption policy
- Automatic key rotation enabled
- Environment-specific deletion windows (30 days for prod, 7 days for dev/staging)

---

## Enhancement 3 — Implemented WAF for ALB Protection

**Requirement:** Add AWS WAF to protect the Application Load Balancer.

**Implementation:**

1. **Created WAF module** at `modules/waf/`:
   - Web ACL with multiple managed rule groups
   - Rate limiting (2000 req/5min for dev, 5000 for prod)
   - CloudWatch logging
   - Optional geo-blocking

2. **WAF Rules implemented**:
   - **Rate Limiting** - Prevents DDoS attacks
   - **AWS Managed Common Rule Set** - Protects against common vulnerabilities
   - **Known Bad Inputs** - Blocks malicious patterns
   - **SQL Injection Protection** - Prevents SQLi attacks
   - **Geo-blocking** (optional) - Can block specific countries

3. **WAF Logging Configuration**:
   - CloudWatch log group for WAF logs
   - Sensitive fields redacted (authorization, cookie headers)
   - Environment-specific retention (7/30/90 days)

4. **Integration with ALB**:
```terraform
resource "aws_wafv2_web_acl_association" "alb" {
  resource_arn = var.alb_arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}
```

**Security Features:**
- Real-time traffic monitoring
- Automated threat blocking
- Detailed logging for analysis
- CloudWatch metrics integration
- Sampled request inspection

---

## Enhancement 4 — Auto-Generated Database Passwords with Secrets Manager

**Requirement:** Remove hardcoded passwords and auto-generate secure passwords stored in AWS Secrets Manager.

**Implementation:**

1. **Added Random Provider** to `providers.tf`:
```terraform
random = {
  source  = "hashicorp/random"
  version = "~> 3.6"
}
```

2. **Auto-generate password** in `modules/database/main.tf`:
```terraform
resource "random_password" "db_password" {
  count   = var.db_password == "" ? 1 : 0
  length  = 32
  special = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}
```

3. **Store in AWS Secrets Manager**:
```terraform
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "${local.name_prefix}-db-password"
  recovery_window_in_days = var.environment == "prod" ? 30 : 7
  
  tags = merge(var.tags, {
    Name = "${local.name_prefix}-db-password"
  })
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password != "" ? var.db_password : random_password.db_password[0].result
    engine   = "postgres"
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    dbname   = local.db_name
  })
}
```

4. **ECS Integration** - Updated `modules/compute/main.tf`:
   - Removed SSM Parameter Store usage
   - Added Secrets Manager integration
   - Updated IAM policy for secret access
```terraform
secrets = [
  {
    name      = "DB_PASSWORD"
    valueFrom = "${var.db_secret_arn}:password::"
  }
]
```

5. **Updated all `.tfvars` files** to remove hardcoded passwords:
```terraform
# Before
db_password = "DevPassword123!"

# After
# db_password is auto-generated and stored in AWS Secrets Manager
```

6. **Made db_password optional** in `variables.tf`:
```terraform
variable "db_password" {
  description = "Master password for RDS (leave empty to auto-generate)"
  type        = string
  sensitive   = true
  default     = ""
}
```

**Security Improvements:**
- No hardcoded credentials in code
- 32-character random passwords
- Secure storage in Secrets Manager
- Automatic rotation capability
- KMS encryption at rest
- IAM-based access control
- Environment-specific recovery windows

---

## Enhancement 5 — Additional Environment Variables for ECS Tasks

**Implementation:** Added comprehensive environment variables to ECS task definition for better application configuration:

```terraform
environment = [
  { name = "ENVIRONMENT", value = var.environment },
  { name = "DB_HOST", value = split(":", var.db_endpoint)[0] },
  { name = "DB_NAME", value = var.db_name },
  { name = "DB_USER", value = var.db_username },
  { name = "S3_BUCKET", value = var.s3_bucket_name },
  { name = "AWS_REGION", value = data.aws_region.current.name },
  { name = "APP_NAME", value = "payment-processing" },
  { name = "APP_VERSION", value = "1.0.0" }
]
```

**Benefits:**
- Application can easily access all required resources
- Environment-aware configuration
- Facilitates integration testing
- No hardcoded values in application code

---

## Enhancement 6 — Added Comprehensive Outputs

**New Outputs Added:**

```terraform
output "db_secret_name" {
  description = "Name of the Secrets Manager secret containing DB credentials"
  value       = module.database.db_secret_name
}

output "db_secret_arn" {
  description = "ARN of the Secrets Manager secret containing DB credentials"
  value       = module.database.db_secret_arn
  sensitive   = true
}

output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = module.waf.web_acl_id
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = module.waf.web_acl_arn
}

output "kms_key_id" {
  description = "ID of the shared KMS key"
  value       = module.kms.kms_key_id
}
```
