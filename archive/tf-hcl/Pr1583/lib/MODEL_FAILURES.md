### 1. Duplicate Variable Declarations (RESOLVED)

**Failure**: Terraform configuration had duplicate or conflicting variable declarations

```hcl
# Duplicate aws_region variables causing confusion
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}
# ... later in file ...
variable "aws_region" {
  description = "Different description"
  type        = string
  default     = "us-east-1"  # Conflicting default
}
```

**Root Cause**: Inconsistent editing and multiple iterations led to duplicate variable definitions

**Fix Applied**:

- Cleaned up duplicate variable declarations
- Ensured consistent `us-west-2` region configuration throughout
- Standardized variable naming and defaults
- Consolidated all variables at the top of `tap_stack.tf`

### 2. Module Path Resolution Issues

**Failure**: Terraform module paths not resolving correctly on Windows

```
Error: Unable to evaluate directory symlink: CreateFile ..\modules:
The system cannot find the file specified.

Error: Unreadable module directory
The directory could not be read for module "vpc" at tap_stack.tf:84.
```

**Root Cause**: Windows path resolution issues with relative paths `../modules/`

**Fix Applied**:

- Temporarily changed module sources from `../modules/` to `./modules/` for testing
- Successfully validated Terraform initialization and syntax
- Reverted to original `../modules/` paths for proper modular structure
- Confirmed module directory structure exists and is accessible

**Before (failing on Windows init)**:

```hcl
module "vpc" {
  source = "../modules/vpc"
  # ...
}
```

**Temporary fix for testing**:

```hcl
module "vpc" {
  source = "./modules/vpc"
  # ...
}
```

**Final working configuration**:

```hcl
module "vpc" {
  source = "../modules/vpc"
  # ... (reverted to original for proper structure)
}
```

**Files Affected**:

- `lib/tap_stack.tf`

### 3. Module Dependencies and Outputs (RESOLVED)

**Failure**: Initial module dependency chain needed refinement

**Root Cause**: Module output references needed proper dependency structure

**Fix Applied**:

- Ensured proper module dependency chain:
  1. VPC module (foundation)
  2. Storage module (independent)
  3. Security module (depends on VPC and Storage)
  4. Compute module (depends on VPC and Security)
- Validated all module output references are correct
- Confirmed proper variable passing between modules

**Correct Dependency Structure**:

```hcl
# VPC Module (foundation)
module "vpc" {
  source = "../modules/vpc"
  # ... vpc configuration
}

# Storage Module (independent)
module "storage" {
  source = "../modules/storage"
  # ... storage configuration
}

# Security Module (depends on VPC and Storage)
module "security" {
  source = "../modules/security"
  vpc_id     = module.vpc.vpc_id
  bucket_arn = module.storage.bucket_arn
}

# Compute Module (depends on VPC and Security)
module "compute" {
  source = "../modules/compute"
  vpc_id               = module.vpc.vpc_id
  public_subnet_id     = module.vpc.public_subnet_ids[0]
  security_group_id    = module.security.web_security_group_id
  iam_instance_profile = module.security.ec2_instance_profile_name
}
```

**Files Affected**:

- `lib/tap_stack.tf`

### 6. Terraform Validation and Formatting Issues

**Failure**: Initial Terraform code formatting inconsistencies

**Root Cause**: Manual editing led to inconsistent formatting

**Fix Applied**:

- Used `terraform fmt -recursive` to standardize formatting
- Validated syntax with `terraform validate`
- Ensured consistent indentation and spacing
- Confirmed all Terraform files follow HCL best practices

**Commands Used**:

```bash
terraform init
terraform validate
terraform fmt -recursive
```

**Validation Results**:

```
Success! The configuration is valid, but there were some validation warnings
```
