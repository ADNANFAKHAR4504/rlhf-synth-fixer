# Infrastructure Code Issues and Fixes

## Critical Issues Fixed

### 1. **Missing Random Provider Declaration**
**Issue**: The infrastructure code used `random_password` resource but the `provider.tf` file didn't declare the random provider in the required_providers block.

**Fix**: Added the random provider to `provider.tf`:
```hcl
random = {
  source  = "hashicorp/random"
  version = ">= 3.1"
}
```

### 2. **Duplicate Launch Template Resources**
**Issue**: The code contained two launch template resources (`aws_launch_template.app` and `aws_launch_template.app_updated`) which is incorrect and causes resource conflicts.

**Fix**: Removed the duplicate `aws_launch_template.app_updated` resource and consolidated all functionality into a single `aws_launch_template.app` resource with inline user data.

### 3. **User Data Script Reference Error**
**Issue**: The first launch template tried to reference a non-existent external file `user_data.sh` using `templatefile()` function, which violates the single-file requirement.

**Fix**: Replaced the external file reference with inline user data using heredoc syntax:
```hcl
user_data = base64encode(<<-EOF
#!/bin/bash
# Script content here
EOF
)
```

### 4. **RDS Deletion Protection Enabled**
**Issue**: The RDS instance had `deletion_protection = true`, which violates the requirement that all resources must be destroyable.

**Fix**: Changed to `deletion_protection = false` and `skip_final_snapshot = true` to ensure the RDS instance can be destroyed without manual intervention.

### 5. **Missing Environment Suffix Variable**
**Issue**: The infrastructure lacked an `environment_suffix` variable needed for unique resource naming across multiple deployments to prevent conflicts.

**Fix**: Added the `environment_suffix` variable and incorporated it into the `name_prefix` local:
```hcl
variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
  default     = "dev"
}

locals {
  name_prefix = "${var.project}-${var.environment}-${var.environment_suffix}"
}
```

### 6. **Incorrect ASG Launch Template Reference**
**Issue**: The Auto Scaling Group was referencing the wrong launch template (`aws_launch_template.app_updated.id` instead of `aws_launch_template.app.id`).

**Fix**: Updated the ASG to reference the correct launch template:
```hcl
launch_template {
  id      = aws_launch_template.app.id
  version = "$Latest"
}
```

## Minor Improvements

### 1. **Enhanced Tagging**
Added the `suffix` tag to `common_tags` to better track deployments with different environment suffixes.

### 2. **User Data Script Enhancement**
Added the environment suffix display to the nginx index page to help identify which deployment instance is being accessed.

### 3. **Code Formatting**
Applied Terraform formatting standards using `terraform fmt` to ensure consistent code style throughout the file.

## Compliance with Requirements

All fixes ensure the infrastructure code:
- Can be deployed multiple times without resource naming conflicts (via environment_suffix)
- All resources are destroyable (no retention policies or deletion protection)
- Follows the single-file requirement (no external file references)
- Properly declares all required providers
- Has no duplicate resource definitions
- Maintains proper resource references and dependencies