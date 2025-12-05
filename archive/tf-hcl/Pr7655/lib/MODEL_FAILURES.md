# Model Failures and Corrections

This document details potential issues an LLM might encounter when generating this multi-environment Terraform infrastructure and the corrections applied.

## Issue 1: Missing environmentSuffix in Resource Names

**Potential Failure**: LLM might generate static resource names without environmentSuffix variable

**Example of Incorrect Code**:
```hcl
resource "aws_vpc" "main" {
  tags = {
    Name = "fintech-payment-vpc"  # Missing environmentSuffix and environment
  }
}
```

**Correction Applied**:
```hcl
resource "aws_vpc" "main" {
  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-vpc-${var.environment_suffix}"
    }
  )
}
```

**Why This Matters**: Without environmentSuffix, parallel deployments in CI/CD will have resource name collisions. The environmentSuffix is required for uniqueness across multiple test runs.

---

## Issue 2: Hardcoded Environment Configuration in Variables

**Potential Failure**: LLM might put environment-specific values in variables.tf instead of using workspace-based locals

**Example of Incorrect Code**:
```hcl
variable "vpc_cidr" {
  default = "10.0.0.0/16"  # Hardcoded, same for all environments
}
```

**Correction Applied**:
```hcl
locals {
  env_config = {
    dev = {
      vpc_cidr = "10.0.0.0/16"
    }
    staging = {
      vpc_cidr = "10.1.0.0/16"
    }
    prod = {
      vpc_cidr = "10.2.0.0/16"
    }
  }
  current_env = local.env_config[terraform.workspace]
}
```

**Why This Matters**: Workspace-based configuration allows deploying different CIDR blocks per environment from the same codebase, preventing VPC overlap.

---

## Issue 3: Missing Conditional Logic for Production Features

**Potential Failure**: LLM might enable Multi-AZ or deletion protection for all environments or use separate variable files

**Example of Incorrect Code**:
```hcl
resource "aws_db_instance" "main" {
  multi_az = var.enable_multi_az  # Requires manual configuration per environment
  deletion_protection = var.enable_deletion_protection
}
```

**Correction Applied**:
```hcl
resource "aws_db_instance" "main" {
  multi_az = local.current_env.multi_az  # false for dev/staging, true for prod
  deletion_protection = local.current_env.deletion_protection  # false for dev/staging, true for prod
}
```

**Why This Matters**: Conditional logic based on workspace ensures production gets Multi-AZ and deletion protection automatically while dev/staging remain cost-effective and destroyable.

---

## Issue 4: Incorrect State Backend Configuration

**Potential Failure**: LLM might not include workspace_key_prefix, causing all workspaces to share the same state file

**Example of Incorrect Code**:
```hcl
backend "s3" {
  bucket = "fintech-terraform-state"
  key    = "terraform.tfstate"  # Same key for all workspaces!
  region = "us-east-1"
}
```

**Correction Applied**:
```hcl
backend "s3" {
  bucket         = "fintech-terraform-state"
  key            = "payment-platform/terraform.tfstate"
  region         = "us-east-1"
  workspace_key_prefix = "workspaces"  # Creates separate paths per workspace
}
```

**Why This Matters**: Without workspace_key_prefix, all environments would share the same state file, causing conflicts. With it, dev/staging/prod each get separate state files at `workspaces/dev/...`, `workspaces/staging/...`, `workspaces/prod/...`.

---

## Issue 5: Security Groups with Static Names

**Potential Failure**: LLM might use `name` instead of `name_prefix` for security groups

**Example of Incorrect Code**:
```hcl
resource "aws_security_group" "alb" {
  name = "fintech-payment-alb-sg"  # Static name causes issues on recreation
  vpc_id = var.vpc_id
}
```

**Correction Applied**:
```hcl
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-${var.environment}-alb-sg-"
  vpc_id      = var.vpc_id

  lifecycle {
    create_before_destroy = true
  }
}
```

**Why This Matters**: Security groups with static names cannot be recreated if they need to be replaced. Using `name_prefix` allows Terraform to generate unique names automatically.

---

## Issue 6: Missing skip_final_snapshot Configuration

**Potential Failure**: LLM might set skip_final_snapshot = false for all environments, blocking destruction

**Example of Incorrect Code**:
```hcl
resource "aws_db_instance" "main" {
  skip_final_snapshot = false  # Blocks destruction for all environments
}
```

**Correction Applied**:
```hcl
resource "aws_db_instance" "main" {
  skip_final_snapshot = !local.current_env.deletion_protection
  # true for dev/staging (allows quick destruction)
  # false for prod (creates snapshot on destruction)
}
```

**Why This Matters**: Development and staging environments need to be quickly destroyable for testing. Production should create snapshots, but this is conditional.

---

## Issue 7: Incorrect Module Source Paths

**Potential Failure**: LLM might use remote module sources or incorrect relative paths

**Example of Incorrect Code**:
```hcl
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"  # Remote module, not customizable
  # OR
  source = "../modules/vpc"  # Wrong path from lib/
}
```

**Correction Applied**:
```hcl
module "vpc" {
  source = "./modules/vpc"  # Correct relative path from lib/
}
```

**Why This Matters**: Local modules at ./modules/ are relative to the root configuration directory. Using correct paths ensures Terraform can find the modules.

---

## Issue 8: Missing IMDSv2 Enforcement

**Potential Failure**: LLM might not enforce IMDSv2 for EC2 instances, leaving security vulnerability

**Example of Incorrect Code**:
```hcl
resource "aws_launch_template" "app" {
  image_id      = var.ami_id
  instance_type = var.instance_type
  # Missing metadata_options
}
```

**Correction Applied**:
```hcl
resource "aws_launch_template" "app" {
  image_id      = var.ami_id
  instance_type = var.instance_type

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"  # Enforces IMDSv2
    http_put_response_hop_limit = 1
  }
}
```

**Why This Matters**: IMDSv2 is a security best practice that prevents certain types of attacks on EC2 metadata service.

---

## Issue 9: Incorrect User Data Escaping

**Potential Failure**: LLM might not properly escape the user data script within Terraform

**Example of Incorrect Code**:
```hcl
user_data = <<-EOF
  #!/bin/bash
  cat > /opt/app/health-check.sh << 'NESTED'
  #!/bin/bash
  echo "OK"
  NESTED
EOF
```

**Correction Applied**:
```hcl
user_data = base64encode(templatefile("${path.module}/user_data.sh", {
  db_endpoint = var.db_endpoint
  environment = var.environment
}))
```

**Why This Matters**: Using templatefile() and base64encode() avoids heredoc nesting issues and allows proper variable interpolation.

---

## Issue 10: Missing Workspace Check in Conditional Logic

**Potential Failure**: LLM might use var.environment instead of terraform.workspace

**Example of Incorrect Code**:
```hcl
locals {
  environment = var.environment  # Requires manual variable setting
}
```

**Correction Applied**:
```hcl
locals {
  environment = terraform.workspace  # Automatically set by Terraform
}
```

**Why This Matters**: terraform.workspace is automatically set based on the selected workspace. Using it eliminates the need for manual environment variable configuration.

---

## Summary of Key Corrections

1. **Resource Naming**: All resources include environmentSuffix via string interpolation
2. **Workspace-Based Configuration**: Environment-specific values in locals, not variables
3. **Conditional Logic**: Production features (Multi-AZ, deletion protection) based on workspace
4. **State Isolation**: workspace_key_prefix in backend configuration
5. **Security Groups**: Use name_prefix with create_before_destroy lifecycle
6. **Destroyability**: skip_final_snapshot conditional on environment
7. **Module Paths**: Correct relative paths (./modules/) for local modules
8. **Security Best Practices**: IMDSv2 enforcement in launch templates
9. **Script Management**: templatefile() for user data instead of heredocs
10. **Workspace Detection**: terraform.workspace for automatic environment selection

These corrections ensure the infrastructure is deployable, maintainable, and follows Terraform and AWS best practices.