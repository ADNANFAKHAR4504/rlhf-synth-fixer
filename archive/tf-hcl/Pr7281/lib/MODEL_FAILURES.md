# MODEL_FAILURES.md - Common Infrastructure Generation Failures

## Overview
This document catalogs common failures and issues that AI models encounter when generating Terraform infrastructure code, particularly for AWS multi-tier architecture. These failures represent areas where models typically struggle with real-world infrastructure requirements.

## Critical Infrastructure Failures

### 1. AWS Resource Naming Constraints
**Common Failure**: Ignoring AWS resource naming limitations and constraints

**Examples**:
- ALB name_prefix exceeding 6-character limit: `substr(lower(var.project_name), 0, 6)` fails when project name is "corpap" (6 chars + dash = 7)
- Target Group name_prefix violating same constraint
- RDS identifier containing invalid characters or exceeding length limits
- S3 bucket names not following DNS-compliant naming rules

**Impact**: Deployment failures with cryptic AWS error messages
```
Error: name_prefix cannot be longer than 6 characters: 'corpap-'
```

**Root Cause**: Models don't account for AWS service-specific naming rules and character limits including separators

### 2. Region Hardcoding Issues  
**Common Failure**: Hardcoding region values instead of using variables

**Examples**:
- CloudWatch dashboard hardcoded to "us-east-1": `region = "us-east-1"`
- AMI data sources locked to specific regions
- Availability zone references not region-agnostic
- KMS key ARNs with hardcoded regions

**Impact**: Infrastructure not portable across AWS regions, fails in multi-region deployments

**Root Cause**: Models assume single-region deployment and don't consider multi-region architecture needs

### 3. Security Group Rule Inconsistencies
**Common Failure**: Creating overly permissive or conflicting security group rules

**Examples**:
- RDS security groups allowing outbound traffic when none needed
- EC2 security groups missing required ALB ingress rules
- Circular security group dependencies
- Missing egress rules for EC2 instances needing internet access

**Impact**: Security vulnerabilities or connection failures between resources

### 4. IAM Permission Mismatches
**Common Failure**: IAM roles with insufficient or excessive permissions

**Examples**:
- EC2 roles missing CloudWatch permissions but CloudWatch agent configured
- RDS monitoring roles with wrong service principals
- S3 bucket policies not matching IAM role permissions
- Missing Secrets Manager access for RDS password retrieval

**Impact**: Services fail to function due to permission errors

### 5. Resource Dependencies and Ordering
**Common Failure**: Incorrect or missing resource dependencies

**Examples**:
- Creating target groups before load balancers
- NAT gateways without proper Internet Gateway dependencies
- Launch templates referencing security groups not yet created
- KMS key policies missing before resource encryption setup

**Impact**: Terraform apply failures with dependency errors

### 6. Multi-AZ Configuration Errors
**Common Failure**: Inconsistent multi-AZ implementations

**Examples**:
- RDS Multi-AZ enabled but subnets only in single AZ
- Load balancer subnets not distributed across AZs
- Auto Scaling Group not configured for multi-AZ placement
- Route tables not properly associated with private subnets

**Impact**: Reduces high availability and fault tolerance

### 7. Encryption Configuration Gaps
**Common Failure**: Incomplete encryption implementation

**Examples**:
- EBS volumes encrypted but launch template missing KMS key reference
- RDS encryption enabled but performance insights not encrypted
- S3 buckets with default encryption but no bucket key optimization
- CloudWatch logs without KMS encryption

**Impact**: Security compliance violations and potential data exposure

### 8. Variable Validation Omissions
**Common Failure**: Missing variable validation and type constraints

**Examples**:
- Instance types not validated against valid AWS values
- CIDR blocks not validated for proper formatting
- Environment suffixes without proper naming constraints
- Numeric variables missing min/max constraints

**Impact**: Runtime errors with invalid configurations

### 9. Output Sensitivity Mishandling
**Common Failure**: Marking non-sensitive data as sensitive or vice versa

**Examples**:
- Public DNS names marked as sensitive
- RDS passwords output without sensitive flag
- ARNs inappropriately marked as sensitive
- Database endpoints exposed in plain text

**Impact**: Security issues or inability to use outputs in other modules

### 10. Resource Tagging Inconsistencies
**Common Failure**: Inconsistent or missing resource tagging

**Examples**:
- Some resources missing common tags
- Tag propagation not configured for Auto Scaling Groups
- Inconsistent tag naming conventions
- Missing cost allocation tags for billing

**Impact**: Poor resource management, cost tracking difficulties

## Advanced Failure Patterns

### 11. Data Source Configuration Errors
**Common Failure**: Improper data source configuration

**Examples**:
- AMI data sources without proper filters
- Availability zone data sources not filtered for state
- Account ID retrieval missing for KMS policies
- VPC data sources in cross-account scenarios

### 12. Lifecycle Rule Misconfigurations
**Common Failure**: Inappropriate lifecycle configurations

**Examples**:
- S3 lifecycle rules with incorrect transition timing
- Resource lifecycle rules preventing necessary updates
- Auto Scaling Group lifecycle hooks missing
- Database lifecycle protection not matching requirements

### 13. Monitoring and Alerting Gaps
**Common Failure**: Incomplete monitoring implementation

**Examples**:
- CloudWatch alarms without proper dimensions
- SNS topics without proper subscription confirmation
- Dashboard widgets with incorrect metric configurations
- Log groups without proper retention policies

### 14. Network Architecture Flaws
**Common Failure**: Network design inconsistencies

**Examples**:
- CIDR block overlaps in subnet calculations
- Route table associations missing for private subnets
- NAT gateway redundancy not matching subnet distribution
- Security group rules not accounting for load balancer health checks

### 15. Performance Configuration Issues
**Common Failure**: Suboptimal performance configurations

**Examples**:
- GP2 volumes instead of GP3 for better performance
- RDS without performance insights enabled
- Auto Scaling policies with poor scaling metrics
- Load balancer without proper health check configurations

## Common Root Causes

1. **Insufficient AWS Knowledge**: Models lack deep understanding of AWS service constraints and best practices
2. **Template-Based Thinking**: Over-reliance on basic examples without production considerations
3. **Single-Region Assumptions**: Not considering multi-region or cross-account scenarios  
4. **Security Afterthought**: Adding security features as add-ons rather than foundational design
5. **Copy-Paste Anti-Pattern**: Reusing configurations without understanding context-specific requirements

## Prevention Strategies

1. **Comprehensive Validation**: Always validate AWS service limits and naming constraints
2. **Security-First Design**: Build security considerations into initial architecture
3. **Multi-Region Planning**: Design for portability from the start
4. **Dependency Mapping**: Explicitly define and test resource dependencies
5. **Production Readiness**: Consider monitoring, backup, and disaster recovery in initial design

## Testing Recommendations

1. **Terraform Plan Review**: Always review terraform plan output for unexpected changes
2. **Multi-Environment Testing**: Test infrastructure across different environments and regions
3. **Security Scanning**: Use tools like checkov or tfsec for security validation
4. **Cost Analysis**: Review cost implications of architectural decisions
5. **Compliance Validation**: Ensure configurations meet organizational compliance requirements

These failures represent the gap between basic Terraform examples and production-ready infrastructure that can reliably support enterprise workloads.