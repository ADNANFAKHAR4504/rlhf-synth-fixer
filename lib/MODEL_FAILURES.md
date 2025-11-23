# MODEL FAILURES - Common Terraform Multi-Region Implementation Issues

This document outlines typical failures, antipatterns, and mistakes when implementing multi-region Terraform infrastructure. Learning from these failures helps identify what NOT to do.

## Critical Architectural Failures

### 1. Provider Configuration Antipatterns

#### ❌ **FAILURE: Using for_each with Providers**
```hcl
# THIS WILL FAIL - Cannot use for_each with providers
resource "aws_vpc" "main" {
  for_each = var.regions
  provider = aws[each.key]  # ERROR: Invalid provider reference
  
  cidr_block = var.vpc_cidrs[each.key]
}
```

**Why it fails:**
- Terraform cannot dynamically select providers using expressions
- Provider references must be static at configuration time
- Results in: `Error: Invalid provider configuration reference`

#### ✅ **CORRECT APPROACH:**
```hcl
# Individual resources per provider
resource "aws_vpc" "us_east_1" {
  provider = aws.us-east-1
  cidr_block = var.vpc_cidrs["us-east-1"]
}

resource "aws_vpc" "eu_west_1" {
  provider = aws.eu-west-1
  cidr_block = var.vpc_cidrs["eu-west-1"]
}

# Then map to locals for for_each usage
locals {
  vpcs = {
    "us-east-1" = aws_vpc.us_east_1
    "eu-west-1" = aws_vpc.eu_west_1
  }
}
```

### 2. Resource Dependency Failures

#### ❌ **FAILURE: Circular Dependencies**
```hcl
# THIS CREATES CIRCULAR DEPENDENCY
resource "aws_route" "peering" {
  for_each = local.peering_routes
  
  route_table_id         = aws_route_table.private[each.key].id
  destination_cidr_block = var.vpc_cidrs[each.value.peer_region]
  vpc_peering_connection_id = aws_vpc_peering_connection.main[each.key].id
}

resource "aws_vpc_peering_connection" "main" {
  for_each = local.region_pairs
  
  # Depends on routes that depend on this resource
  depends_on = [aws_route.peering]  # CIRCULAR!
}
```

**Error symptoms:**
- `Error: Cycle in resource dependencies`
- Terraform plan hangs indefinitely
- Inconsistent apply behavior

#### ✅ **CORRECT APPROACH:**
```hcl
# Clear dependency chain: VPC -> Peering -> Routes
resource "aws_vpc_peering_connection" "main" {
  for_each = local.region_pairs
  # No dependency on routes
}

resource "aws_route" "peering" {
  for_each = local.peering_routes
  
  # Depends on peering connection (correct direction)
  vpc_peering_connection_id = aws_vpc_peering_connection.main[each.key].id
}
```

### 3. State Management Disasters

#### ❌ **FAILURE: No Remote State Backend**
```hcl
# Local state only - DISASTER for teams
terraform {
  # No backend configuration
}
```

**Consequences:**
- State files stored locally only
- No state locking → concurrent modification corruption
- No team collaboration possible
- State lost when developer machine fails
- No state versioning or backup

#### ❌ **FAILURE: Hardcoded State Configuration**
```hcl
terraform {
  backend "s3" {
    bucket = "my-terraform-state"  # Hardcoded - conflicts across accounts
    key    = "terraform.tfstate"   # Same key for all environments
    region = "us-east-1"
    # No DynamoDB locking
  }
}
```

#### ✅ **CORRECT APPROACH:**
```hcl
terraform {
  backend "s3" {
    # Configuration provided via -backend-config flags
    # Separate buckets per account/environment
    # DynamoDB locking enabled
  }
}

# Usage:
# terraform init -backend-config="bucket=myorg-terraform-state-${ACCOUNT}" \
#                -backend-config="key=payment-platform/${WORKSPACE}/terraform.tfstate"
```

### 4. Security Antipatterns

#### ❌ **FAILURE: No Encryption**
```hcl
resource "aws_s3_bucket" "logs" {
  bucket = "transaction-logs"
  # No encryption configuration - SECURITY RISK
}

resource "aws_rds_cluster" "main" {
  cluster_identifier = "payment-db"
  storage_encrypted  = false  # CRITICAL SECURITY FLAW
  # No KMS key specified
}
```

**Security violations:**
- Data at rest not encrypted
- Compliance failures (PCI DSS, SOX, HIPAA)
- Audit findings and regulatory penalties

#### ❌ **FAILURE: Overprivileged IAM**
```hcl
resource "aws_iam_role_policy" "lambda" {
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "*"        # MASSIVE SECURITY HOLE
      Resource = "*"        # NO RESTRICTIONS
    }]
  })
}
```

### 5. Network Architecture Failures

#### ❌ **FAILURE: CIDR Block Overlaps**
```hcl
variable "vpc_cidrs" {
  default = {
    us-east-1 = "10.0.0.0/16"
    eu-west-1 = "10.0.0.0/16"  # OVERLAP! VPC peering will fail
  }
}
```

**Failure symptoms:**
- VPC peering connections fail to establish
- `InvalidVpcPeeringConnectionId.NotFound` errors
- Routing conflicts and unreachable resources

#### ❌ **FAILURE: No High Availability**
```hcl
# Single AZ deployment - SPOF
resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"  # Only one AZ - not HA
}

resource "aws_rds_cluster_instance" "main" {
  count = 1  # Single instance - SPOF
}
```

### 6. Resource Naming Collisions

#### ❌ **FAILURE: Non-unique Resource Names**
```hcl
resource "aws_s3_bucket" "main" {
  for_each = toset(var.regions)
  bucket   = "payment-logs"  # Same name across regions - COLLISION
}
```

**Error:**
- `BucketAlreadyExists` - S3 bucket names must be globally unique
- Resource creation fails in all but first region

#### ❌ **FAILURE: No Environment Separation**
```hcl
resource "aws_rds_cluster" "main" {
  cluster_identifier = "payment-cluster"  # Same for dev/staging/prod
}
```

### 7. Variable and Local Failures

#### ❌ **FAILURE: Missing Variable Validation**
```hcl
variable "vpc_cidrs" {
  type = map(string)
  # No validation - allows invalid CIDR blocks
}

variable "rds_instance_class" {
  # No type specified
  # No validation for valid instance types
}
```

#### ❌ **FAILURE: Complex Expressions in Resources**
```hcl
resource "aws_subnet" "private" {
  for_each = {
    # Complex nested expression - hard to debug
    for subnet in flatten([
      for region in var.regions : [
        for az in data.aws_availability_zones.all[region].names : {
          key = "${region}-${az}"
          # ... more complex logic
        } if can(regex("^${region}[a-z]$", az))  # Complex condition
      ]
    ]) : subnet.key => subnet
  }
}
```

### 8. Output and Data Source Issues

#### ❌ **FAILURE: Missing Sensitive Outputs**
```hcl
output "database_password" {
  value = aws_rds_cluster.main.master_password
  # Missing: sensitive = true - PASSWORD LEAKED IN LOGS
}

output "rds_endpoints" {
  value = {
    for k, v in aws_rds_cluster.main : k => v.endpoint
  }
  # Should be sensitive = true for database endpoints
}
```

#### ❌ **FAILURE: Incorrect Data Source Usage**
```hcl
data "aws_availability_zones" "available" {
  # No provider specified - uses default provider only
  state = "available"
}

# Using data source for wrong region
resource "aws_subnet" "eu_west_1" {
  provider = aws.eu-west-1
  availability_zone = data.aws_availability_zones.available.names[0]  # Wrong region!
}
```

## Testing and Validation Failures

### 9. No Terraform Validation

#### ❌ **FAILURE: Skipping Basic Validation**
```bash
# Deploying without validation - DANGEROUS
terraform apply -auto-approve  # No plan review, no validation
```

**Missing steps:**
- `terraform fmt -check` - Code formatting
- `terraform validate` - Configuration validation  
- `terraform plan` - Resource planning and review
- Static analysis with tools like `tflint`
- Security scanning with `tfsec` or `checkov`

### 10. Environment Management Failures

#### ❌ **FAILURE: No Workspace Strategy**
```hcl
# Same configuration for all environments
resource "aws_rds_cluster_instance" "main" {
  instance_class = "db.r5.xlarge"  # Production size for dev - EXPENSIVE
}

variable "environment" {
  default = "prod"  # Hardcoded - dangerous for dev/staging
}
```

#### ❌ **FAILURE: No Resource Sizing Strategy**
```hcl
# One size fits all - wasteful and inappropriate
variable "lambda_memory_size" {
  default = 3008  # Maximum for all environments - EXPENSIVE
}

variable "rds_instance_class" {
  default = "db.r5.24xlarge"  # Massive for dev - COST EXPLOSION
}
```

## Monitoring and Observability Failures

### 11. No Monitoring Setup

#### ❌ **FAILURE: No CloudWatch Integration**
```hcl
resource "aws_rds_cluster" "main" {
  enabled_cloudwatch_logs_exports = []  # No log exports - NO VISIBILITY
}

resource "aws_lambda_function" "main" {
  # No CloudWatch log group
  # No metrics or alarms
  # No distributed tracing
}
```

#### ❌ **FAILURE: No Cost Monitoring**
```hcl
# Resources with no cost controls
resource "aws_nat_gateway" "main" {
  count = 12  # 4 regions × 3 AZs - EXPENSIVE without justification
}

resource "aws_rds_cluster_instance" "main" {
  count = 6  # All production-sized instances in dev - COST DISASTER
  instance_class = "db.r5.24xlarge"
}
```

## Error Patterns and Symptoms

### 12. Common Error Messages

#### Provider Configuration Errors
```
Error: Invalid provider configuration reference
Cannot use for_each with providers
Provider configuration not present
```

#### Resource Dependency Errors  
```
Error: Cycle in resource dependencies
Resource depends on resource that cannot be determined until apply
Error: Reference to undeclared resource
```

#### State Management Errors
```
Error: Backend configuration changed
Error: Error acquiring the state lock
Error: Failed to load state: AccessDenied
```

#### Network Configuration Errors
```
InvalidVpcPeeringConnectionId.NotFound
InvalidParameterValue: CIDR block overlaps
RouteAlreadyExists
```

#### Resource Creation Errors
```
BucketAlreadyExists: The requested bucket name is not available
InvalidDBClusterStateFault
AccessDenied: User is not authorized to perform
```

## Cost Optimization Failures

### 13. Resource Over-provisioning

#### ❌ **FAILURE: No Environment-Specific Sizing**
```hcl
# Same massive resources for all environments
locals {
  lambda_memory = 3008  # Max memory for dev environment
  rds_instance  = "db.r5.24xlarge"  # Production size in dev
  nat_gateways  = 9     # 3 per region even in dev - expensive
}
```

**Cost impact:**
- Dev environment costs same as production
- Monthly costs can exceed $10K+ for unused dev resources
- No cost optimization based on usage patterns

## Recovery and Disaster Response Failures

### 14. No Disaster Recovery Plan

#### ❌ **FAILURE: Single Region Dependency**
```hcl
# All resources in single region despite multi-region setup
resource "aws_s3_bucket" "terraform_state" {
  provider = aws.us-east-1
  bucket   = "terraform-state"
  
  # No cross-region replication
  # No disaster recovery plan
}
```

#### ❌ **FAILURE: No Backup Strategy**
```hcl
resource "aws_rds_cluster" "main" {
  backup_retention_period = 0    # No backups - DATA LOSS RISK
  skip_final_snapshot    = true  # No final backup
  deletion_protection    = false # Can be accidentally deleted
}
```

## Learning from Failures

### Key Takeaways

1. **Provider Limitations**: Understand Terraform's static provider requirements
2. **Dependency Management**: Plan resource dependencies carefully
3. **Security First**: Never compromise on encryption and access controls  
4. **Environment Separation**: Use workspaces and environment-specific configurations
5. **Cost Awareness**: Right-size resources for each environment
6. **Monitoring Essential**: Include observability from day one
7. **Validation Always**: Never skip `fmt`, `validate`, and `plan` steps
8. **State Management**: Use remote state with locking from the start
9. **Network Planning**: Design CIDR blocks and routing carefully
10. **Documentation**: Document patterns and anti-patterns for the team

### Prevention Strategies

- **Code Reviews**: Mandatory reviews for all Terraform changes
- **Automated Testing**: CI/CD pipelines with validation steps
- **Security Scanning**: Automated security policy enforcement
- **Cost Monitoring**: Budget alerts and resource usage tracking
- **Documentation**: Maintain runbooks and architecture diagrams
- **Training**: Regular team training on Terraform best practices

The failures documented here represent real-world issues that can cost organizations significant time, money, and security exposure. By understanding these anti-patterns, teams can build more robust, secure, and cost-effective infrastructure.