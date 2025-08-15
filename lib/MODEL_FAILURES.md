# Model Failures - Terraform Cloud Environment Setup

## Common Failure Patterns

```markdown
### 1. State Locking Implementation Failures

**Failure Pattern**: Models often fail to properly implement state locking or implement it incorrectly.

**Common Mistakes**:
- Using local state instead of remote state with S3 backend
- Missing DynamoDB table for state locking
- Incorrect backend configuration syntax
- Not configuring proper locking timeout values
- Forgetting to enable state locking in the backend configuration

**Example Failure**:
```hcl
# WRONG - No state locking
terraform {
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "terraform.tfstate"
  }
}

# CORRECT - With state locking
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}
```

### 2. Module Organization Failures

**Failure Pattern**: Models create monolithic configurations instead of proper modular structure.

**Common Mistakes**:
- Putting all resources in a single main.tf file
- Not creating separate module directories
- Missing module input/output variables
- Not using data sources for module communication
- Creating modules that are too tightly coupled

**Example Failure**:
```hcl
# WRONG - Monolithic approach
resource "aws_vpc" "main" {
  # VPC configuration
}

resource "aws_subnet" "public" {
  # Subnet configuration
}

resource "aws_rds_instance" "database" {
  # RDS configuration
}

# CORRECT - Modular approach
# modules/vpc/main.tf
resource "aws_vpc" "main" {
  # VPC configuration
}

# modules/rds/main.tf
resource "aws_rds_instance" "database" {
  # RDS configuration using VPC module outputs
}
```

### 3. Multi-Region Configuration Failures

**Failure Pattern**: Models hardcode regions or create region-specific configurations instead of making them variable-driven.

**Common Mistakes**:
- Hardcoding region values in resource definitions
- Creating separate configurations for each region
- Not using variables for region specification
- Missing provider aliases for multi-region deployments
- Not considering region-specific resource availability

**Example Failure**:
```hcl
# WRONG - Hardcoded region
provider "aws" {
  region = "us-east-1"
}

resource "aws_rds_instance" "database" {
  instance_class = "db.t3.micro"  # May not be available in all regions
}

# CORRECT - Variable-driven
variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

provider "aws" {
  region = var.aws_region
}

resource "aws_rds_instance" "database" {
  instance_class = var.rds_instance_class
}
```

### 4. Environment Separation Failures

**Failure Pattern**: Models fail to properly separate test and production environments.

**Common Mistakes**:
- Using the same state file for different environments
- Not using workspace separation or separate state files
- Sharing sensitive variables between environments
- Not implementing proper tagging strategies
- Missing environment-specific configurations

**Example Failure**:
```hcl
# WRONG - Same configuration for all environments
resource "aws_rds_instance" "database" {
  instance_class = "db.t3.micro"
  allocated_storage = 20
}

# CORRECT - Environment-specific configuration
resource "aws_rds_instance" "database" {
  instance_class    = var.environment == "production" ? "db.r5.large" : "db.t3.micro"
  allocated_storage = var.environment == "production" ? 100 : 20
  
  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}
```

### 5. Naming Convention Failures

**Failure Pattern**: Models don't follow the specified naming convention or create inconsistent naming patterns.

**Common Mistakes**:
- Not using the `<project>-<env>-<resource>` format
- Inconsistent naming across resources
- Missing environment prefixes
- Not using variables for project names
- Creating names that are too long or don't follow AWS naming best practices

**Example Failure**:
```hcl
# WRONG - Inconsistent naming
resource "aws_vpc" "vpc" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "subnet1" {
  # subnet configuration
}

# CORRECT - Consistent naming convention
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  
  tags = {
    Name = "${var.project_name}-${var.environment}-vpc"
  }
}

resource "aws_subnet" "public" {
  # subnet configuration
  
  tags = {
    Name = "${var.project_name}-${var.environment}-public-subnet"
  }
}
```

### 6. Backend Configuration Failures

**Failure Pattern**: Models fail to properly configure remote state backends or don't handle backend initialization.

**Common Mistakes**:
- Not configuring backend at all
- Missing required backend configuration parameters
- Not handling backend initialization in scripts
- Incorrect bucket naming or permissions
- Not enabling encryption for state files

**Example Failure**:
```hcl
# WRONG - Missing backend configuration
terraform {
  required_version = ">= 1.0"
}

# CORRECT - Complete backend configuration
terraform {
  required_version = ">= 1.0"
  
  backend "s3" {
    bucket         = "iac-aws-nova-terraform-state"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
```

### 7. Variable and Output Management Failures

**Failure Pattern**: Models don't properly structure variables and outputs for modular configurations.

**Common Mistakes**:
- Not defining input variables for modules
- Missing output values for module communication
- Not using data sources to reference other module outputs
- Creating circular dependencies between modules
- Not validating variable inputs

**Example Failure**:
```hcl
# WRONG - No proper variable/output structure
module "vpc" {
  source = "./modules/vpc"
}

module "rds" {
  source = "./modules/rds"
  # No reference to VPC module outputs
}

# CORRECT - Proper variable/output usage
module "vpc" {
  source = "./modules/vpc"
  
  vpc_cidr = var.vpc_cidr
  environment = var.environment
}

module "rds" {
  source = "./modules/rds"
  
  vpc_id = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids
  environment = var.environment
}
```

### 8. Security and Best Practice Failures

**Failure Pattern**: Models ignore security best practices and AWS recommendations.

**Common Mistakes**:
- Not enabling encryption for sensitive resources
- Missing proper IAM roles and policies
- Not implementing least privilege access
- Missing security group configurations
- Not using private subnets for databases
- Not implementing proper backup strategies

**Example Failure**:
```hcl
# WRONG - Insecure configuration
resource "aws_rds_instance" "database" {
  instance_class = "db.t3.micro"
  publicly_accessible = true  # Security risk
  skip_final_snapshot = true  # No backup strategy
}

# CORRECT - Secure configuration
resource "aws_rds_instance" "database" {
  instance_class = "db.t3.micro"
  publicly_accessible = false
  skip_final_snapshot = false
  final_snapshot_identifier = "${var.project_name}-${var.environment}-final-snapshot"
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name = aws_db_subnet_group.main.name
  
  storage_encrypted = true
  kms_key_id = aws_kms_key.rds.arn
}
```

## Prevention Strategies

1. **Always use remote state with proper locking**
2. **Create modular, reusable configurations**
3. **Use variables for all configurable values**
4. **Implement proper environment separation**
5. **Follow consistent naming conventions**
6. **Validate all variable inputs**
7. **Test configurations in multiple regions**
8. **Implement security best practices from the start**
```
