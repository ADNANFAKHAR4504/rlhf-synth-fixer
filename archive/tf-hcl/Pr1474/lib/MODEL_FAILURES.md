# Model Failures Documentation

## Overview
This document identifies common failure patterns and potential issues that models might encounter when implementing the AWS web application infrastructure specified in `PROMPT.md`.

## Critical Security Failures

### 1. Default Database Passwords
**Issue**: Models often provide hardcoded default passwords for RDS instances.
```hcl
# ❌ CRITICAL FAILURE
resource "aws_db_instance" "main" {
  password = "defaultpassword123"  # Hardcoded password
}
```
**Impact**: Exposes database to unauthorized access
**Correct Approach**: Use variables with validation requiring external input

### 2. Public Database Access
**Issue**: RDS instances placed in public subnets or with publicly accessible flag
```hcl
# ❌ CRITICAL FAILURE
resource "aws_db_instance" "main" {
  publicly_accessible = true  # Database exposed to internet
}
```
**Impact**: Database accessible from internet
**Correct Approach**: Database subnets with no public access

### 3. Overly Permissive Security Groups
**Issue**: Security groups allowing unnecessary broad access
```hcl
# ❌ SECURITY FAILURE
resource "aws_security_group" "web" {
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # SSH open to world
  }
}
```
**Impact**: Unnecessary attack surface
**Correct Approach**: Reference-based security group rules

## Architectural Failures

### 4. Single Availability Zone Deployment
**Issue**: Resources deployed in single AZ, violating HA requirements
```hcl
# ❌ AVAILABILITY FAILURE
resource "aws_subnet" "public" {
  availability_zone = "us-east-1a"  # Single AZ only
}
```
**Impact**: No high availability or fault tolerance
**Correct Approach**: Multi-AZ deployment with dynamic AZ selection

### 5. Missing Load Balancer Health Checks
**Issue**: Load balancer without proper health check configuration
```hcl
# ❌ RELIABILITY FAILURE
resource "aws_lb_target_group" "main" {
  # Missing health_check block
}
```
**Impact**: Traffic routed to unhealthy instances
**Correct Approach**: Comprehensive health check configuration

### 6. Incorrect Subnet Placement
**Issue**: EC2 instances in public subnets instead of private
```hcl
# ❌ ARCHITECTURAL FAILURE
resource "aws_autoscaling_group" "main" {
  vpc_zone_identifier = aws_subnet.public[*].id  # Should be private
}
```
**Impact**: Exposes application servers to direct internet access
**Correct Approach**: Private subnets for application tier

## Configuration Management Failures

### 7. Missing Infrastructure Encryption
**Issue**: S3 buckets or RDS without encryption
```hcl
# ❌ COMPLIANCE FAILURE
resource "aws_s3_bucket" "logs" {
  # Missing encryption configuration
}
```
**Impact**: Data stored unencrypted
**Correct Approach**: KMS encryption for all storage

### 8. Inadequate IAM Permissions
**Issue**: IAM roles with excessive permissions
```hcl
# ❌ SECURITY FAILURE
{
  "Effect": "Allow",
  "Action": "*",  # Full administrative access
  "Resource": "*"
}
```
**Impact**: Violates least privilege principle
**Correct Approach**: Minimal required permissions

### 9. Missing Resource Tagging
**Issue**: Inconsistent or missing resource tags
```hcl
# ❌ OPERATIONAL FAILURE
resource "aws_vpc" "main" {
  # Missing tags for cost tracking and management
}
```
**Impact**: Poor resource governance and cost tracking
**Correct Approach**: Consistent tagging strategy

## Implementation Pattern Failures

### 10. External File Dependencies
**Issue**: User data scripts referencing external files
```hcl
# ❌ STRUCTURE FAILURE
user_data = file("../scripts/user_data.sh")  # External dependency
```
**Impact**: Violates single-file requirement
**Correct Approach**: Inline scripts or templates in same directory

### 11. Provider Configuration in Main File
**Issue**: Provider blocks in main.tf instead of provider.tf
```hcl
# ❌ STRUCTURE FAILURE - in main.tf
provider "aws" {
  region = var.aws_region
}
```
**Impact**: Violates file organization requirements
**Correct Approach**: Provider configuration in separate provider.tf

### 12. Missing Output Values
**Issue**: Incomplete or missing output definitions
```hcl
# ❌ INTEGRATION FAILURE
# Missing critical outputs like VPC ID, DNS names, etc.
```
**Impact**: Prevents infrastructure integration
**Correct Approach**: Comprehensive output definitions

## Monitoring and Observability Failures

### 13. Missing CloudWatch Alarms
**Issue**: Infrastructure without monitoring and alerting
```hcl
# ❌ OPERATIONAL FAILURE
# No CloudWatch alarms for CPU, response time, etc.
```
**Impact**: No visibility into infrastructure health
**Correct Approach**: Comprehensive monitoring strategy

### 14. Inadequate Backup Configuration
**Issue**: RDS without proper backup settings
```hcl
# ❌ DATA PROTECTION FAILURE
resource "aws_db_instance" "main" {
  backup_retention_period = 0  # No backups
}
```
**Impact**: Risk of data loss
**Correct Approach**: Automated backups with appropriate retention

## Testing and Validation Failures

### 15. Missing Test Coverage
**Issue**: Infrastructure code without comprehensive tests
**Impact**: Unvalidated infrastructure changes
**Correct Approach**: Unit and integration test suites

### 16. Inadequate Input Validation
**Issue**: Variables without validation rules
```hcl
# ❌ VALIDATION FAILURE
variable "db_password" {
  type = string
  # Missing validation for password complexity
}
```
**Impact**: Weak password acceptance
**Correct Approach**: Variable validation rules

## Performance and Cost Failures

### 17. Suboptimal Instance Types
**Issue**: Over-provisioned or inappropriate instance types
```hcl
# ❌ COST FAILURE
instance_type = "m5.2xlarge"  # Oversized for basic web app
```
**Impact**: Unnecessary costs
**Correct Approach**: Right-sized instances with scaling

### 18. Missing Cost Controls
**Issue**: No billing alarms or cost monitoring
**Impact**: Uncontrolled spending
**Correct Approach**: Billing alarms and cost optimization

## Prevention Strategies

1. **Security Reviews**: Mandatory security review checklist
2. **Automated Validation**: Pre-commit hooks and CI/CD validation
3. **Testing Requirements**: Comprehensive test coverage mandates
4. **Documentation Standards**: Required documentation for all components
5. **Peer Review**: Code review process for infrastructure changes

## Common Anti-Patterns to Avoid

- Hardcoded credentials or sensitive values
- Single points of failure in architecture
- Overly permissive access controls
- Missing encryption at rest and in transit
- Inadequate monitoring and alerting
- Poor resource organization and naming
- Insufficient documentation and testing

This document serves as a reference for identifying and preventing common implementation failures in AWS infrastructure code.