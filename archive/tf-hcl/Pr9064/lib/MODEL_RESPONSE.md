# Model Response - Terraform Cloud Environment Setup

## Expected Response Structure

```markdown
The model should generate a comprehensive Terraform configuration that addresses the resilient AWS cloud environment setup requirements. The response should follow this structure:

### 1. File Organization
```
lib/
├── tap_stack.tf          # Main Terraform configuration (single file)
├── provider.tf           # AWS provider and backend configuration
└── PROMPT.md            # Problem statement and requirements
```

### 2. Core Terraform Configuration (`tap_stack.tf`)

#### Variables Section
- **aws_region**: String with validation for non-empty value
- **project_name**: String with validation for non-empty value  
- **environment**: String with validation for "test" or "production"
- **vpc_cidr**: String with CIDR validation
- **public_subnet_cidrs**: List of 2 strings with CIDR validation
- **private_subnet_cidrs**: List of 2 strings with CIDR validation
- **instance_type**: String for EC2 instance type
- **db_instance_class**: String for RDS instance class
- **db_allocated_storage**: Number for RDS storage
- **db_username**: String for RDS username
- **db_password**: String with sensitive flag for RDS password

#### Data Sources
- **aws_availability_zones**: Available AZs in region
- **aws_caller_identity**: Current AWS account info
- **aws_ami**: Amazon Linux 2023 AMI for EC2 instances

#### Locals
- **name_prefix**: Consistent naming pattern (`${project_name}-${environment}`)
- **is_production**: Boolean flag based on environment
- **azs**: List of 2 availability zones
- **common_tags**: Standard tagging structure

#### Networking Resources
- **aws_vpc**: Main VPC with DNS support enabled
- **aws_subnet**: 2 public subnets across 2 AZs
- **aws_subnet**: 2 private subnets across 2 AZs
- **aws_internet_gateway**: Internet connectivity
- **aws_eip**: Elastic IP for NAT Gateway (production only)
- **aws_nat_gateway**: NAT Gateway (production only)
- **aws_route_table**: Public route table with IGW route
- **aws_route_table**: Private route tables with NAT route (production only)
- **aws_route_table_association**: Subnet to route table associations

#### Security Groups
- **aws_security_group**: ALB security group (HTTP/HTTPS ingress)
- **aws_security_group**: Application security group (HTTP from ALB, SSH ingress)
- **aws_security_group**: RDS security group (PostgreSQL from app instances)

#### Database Resources
- **aws_db_subnet_group**: RDS subnet group in private subnets
- **aws_db_instance**: PostgreSQL RDS instance with encryption

#### Load Balancer Resources
- **aws_lb**: Application Load Balancer in public subnets
- **aws_lb_target_group**: Target group for EC2 instances
- **aws_lb_listener**: HTTP listener on port 80

#### Compute Resources
- **aws_launch_template**: Launch template with user data
- **aws_autoscaling_group**: Auto Scaling Group with health checks

#### Monitoring Resources
- **aws_cloudwatch_dashboard**: Dashboard with key metrics
- **aws_cloudwatch_metric_alarm**: CPU utilization alarm
- **aws_cloudwatch_metric_alarm**: Memory utilization alarm

#### Outputs
- **vpc_id**: VPC identifier
- **public_subnet_ids**: List of public subnet IDs
- **private_subnet_ids**: List of private subnet IDs
- **alb_dns_name**: ALB DNS name
- **alb_zone_id**: ALB zone ID
- **rds_endpoint**: RDS endpoint
- **rds_port**: RDS port
- **asg_name**: Auto Scaling Group name
- **cloudwatch_dashboard_url**: Dashboard URL
- **nat_gateway_id**: NAT Gateway ID (empty in test)
- **environment_info**: Environment configuration summary

### 3. Key Implementation Requirements

#### State Locking
- S3 backend configuration in `provider.tf`
- DynamoDB table for state locking
- Encryption enabled for state storage

#### Environment Separation
- Conditional resource creation based on environment
- Feature toggles for NAT Gateway, detailed monitoring, etc.
- Environment-specific configurations

#### Multi-Region Support
- Region-agnostic configuration
- Variable-driven region selection
- Consistent resource naming across regions

#### Security Best Practices
- Least privilege security group rules
- Encryption at rest for RDS
- No sensitive data in outputs
- Consistent tagging strategy

#### Naming Conventions
- Pattern: `<project>-<env>-<resource>`
- Consistent across all resources
- DNS-compatible naming

### 4. Validation Criteria

#### Unit Test Requirements
- Static analysis without Terraform runtime
- Variable validation checks
- Resource structure validation
- Naming convention compliance
- Security best practices validation

#### Integration Test Requirements
- Outputs file structure validation
- Resource ID format validation
- Environment-specific configuration validation
- Naming convention validation
- No sensitive data exposure

### 5. Expected Test Coverage

#### Unit Tests (20 tests)
- File structure and readability
- Variable declarations and validations
- Data source presence
- Resource creation and configuration
- Output declarations
- Naming conventions
- Security practices
- Environment-specific logic

#### Integration Tests (18 tests)
- Outputs file existence and structure
- Resource ID format validation
- Environment configuration consistency
- Feature flag validation
- Naming convention compliance
- Security validation

### 6. Success Criteria

The model response is considered successful if:

1. **All tests pass**: 38 total tests (20 unit + 18 integration)
2. **Linting passes**: No ESLint errors
3. **Single file structure**: All Terraform resources in `tap_stack.tf`
4. **Provider separation**: AWS provider config in `provider.tf`
5. **Environment support**: Test and production configurations
6. **Security compliance**: No sensitive data exposure
7. **Naming consistency**: Follows established patterns
8. **State locking**: Proper S3 backend with DynamoDB locking

### 7. Common Response Patterns

#### Successful Response
- Comprehensive single-file Terraform configuration
- Proper variable validation and type checking
- Environment-specific conditional logic
- Complete resource coverage (VPC, subnets, security groups, RDS, ALB, ASG, CloudWatch)
- Consistent naming and tagging
- Secure configuration with encryption and least privilege

#### Failed Response Patterns
- Missing required resources
- Incorrect variable validation
- No environment separation logic
- Inconsistent naming conventions
- Security group misconfigurations
- Missing state locking configuration
- Sensitive data in outputs
- External module dependencies (should be single file)

### 8. Example Response Structure

```terraform
############################################################
# tap_stack.tf — Single-file AWS Infrastructure Stack
# Comprehensive cloud environment setup with state locking
# Supports multi-region deployment and environment separation
############################################################

########################
# Variables
########################

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
  validation {
    condition     = length(trimspace(var.aws_region)) > 0
    error_message = "aws_region must be a non-empty string."
  }
}

# ... additional variables with validations

########################
# Data Sources
########################

data "aws_availability_zones" "available" {
  state = "available"
}

# ... additional data sources

########################
# Locals
########################

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  is_production = var.environment == "production"
  # ... additional locals
}

########################
# Resources
########################

# Networking, Security, Database, Load Balancer, Compute, Monitoring resources
# ... comprehensive resource definitions

########################
# Outputs
########################

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

# ... additional outputs
```
