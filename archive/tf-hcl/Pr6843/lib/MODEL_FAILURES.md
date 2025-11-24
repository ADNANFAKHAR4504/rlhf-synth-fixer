# MODEL FAILURES - Common Infrastructure Configuration Issues

This document captures common failure patterns and mistakes that AI models make when generating Terraform AWS infrastructure configurations, along with their impacts and solutions.

## Critical Security Failures

### 1. Missing Encryption Configuration
**Failure Pattern:**
- Creating S3 buckets without server-side encryption
- RDS instances without storage encryption
- Lambda functions without environment variable encryption
- EBS volumes without encryption by default

**Impact:** 
- Data at rest exposed in plaintext
- Compliance violations (SOX, HIPAA, PCI-DSS)
- Regulatory penalties and audit failures

**Example of Failure:**
```terraform
resource "aws_s3_bucket" "data" {
  bucket = "my-data-bucket"
  # Missing encryption configuration
}

resource "aws_db_instance" "main" {
  engine = "mysql"
  # storage_encrypted = true  <- MISSING
}
```

**Correct Implementation:**
```terraform
resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
  }
}
```

### 2. Public Access Not Blocked
**Failure Pattern:**
- S3 buckets created without public access block
- Security groups with 0.0.0.0/0 inbound rules
- RDS instances in public subnets

**Impact:**
- Data breaches and unauthorized access
- Accidental exposure of sensitive information
- Attack vectors for malicious actors

**Example of Failure:**
```terraform
resource "aws_security_group" "web" {
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # DANGEROUS - SSH from anywhere
  }
}
```

### 3. Missing IAM Least Privilege
**Failure Pattern:**
- IAM policies with wildcard (*) permissions
- Overly broad resource access
- Missing MFA enforcement
- Root access keys not restricted

**Impact:**
- Privilege escalation attacks
- Unauthorized resource access
- Compliance violations

**Example of Failure:**
```terraform
resource "aws_iam_policy" "bad_policy" {
  policy = jsonencode({
    Statement = [{
      Effect = "Allow"
      Action = "*"          # TOO BROAD
      Resource = "*"        # TOO BROAD
    }]
  })
}
```

## Infrastructure Design Failures

### 4. Single Point of Failure
**Failure Pattern:**
- Single AZ deployments
- No redundancy for critical components
- Missing backup configurations
- Single NAT Gateway for multiple AZs

**Impact:**
- Service outages during AZ failures
- Data loss without backups
- Poor disaster recovery capability

**Example of Failure:**
```terraform
resource "aws_subnet" "private" {
  # Only one subnet - no redundancy
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"
}
```

### 5. Incorrect Network Configuration
**Failure Pattern:**
- Overlapping CIDR blocks
- Missing route table associations
- Internet Gateway attached to private subnets
- No NAT Gateway for private subnet internet access

**Impact:**
- Network connectivity issues
- Routing loops and unreachable resources
- Security vulnerabilities

**Example of Failure:**
```terraform
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id  # WRONG - Should use NAT Gateway
  }
}
```

## Monitoring and Compliance Failures

### 6. Missing Audit Logging
**Failure Pattern:**
- No CloudTrail configuration
- VPC Flow Logs not enabled
- CloudWatch logging disabled
- No monitoring for security events

**Impact:**
- Lack of audit trail for compliance
- Unable to detect security incidents
- No visibility into infrastructure changes

**Example of Failure:**
```terraform
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  # Missing VPC Flow Logs configuration
}
# Missing CloudTrail entirely
```

### 7. No Compliance Monitoring
**Failure Pattern:**
- AWS Config not configured
- No Config rules for compliance
- Missing GuardDuty setup
- No automated remediation

**Impact:**
- Manual compliance checking
- Delayed detection of misconfigurations
- Audit failures

## Resource Management Failures

### 8. Hardcoded Values
**Failure Pattern:**
- Hardcoded passwords in Terraform code
- Fixed resource names without uniqueness
- Hardcoded IP addresses and regions
- No parameterization

**Impact:**
- Security vulnerabilities
- Deployment failures in different environments
- Maintenance difficulties

**Example of Failure:**
```terraform
resource "aws_db_instance" "main" {
  password = "hardcoded123!"  # SECURITY RISK
  username = "admin"
}
```

**Correct Implementation:**
```terraform
resource "random_password" "db_password" {
  length  = 16
  special = true
}

resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "prod/rds/credentials"
  kms_key_id              = aws_kms_key.main.arn
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.db_password.result
  })
}

resource "aws_db_instance" "main" {
  username = "admin"
  manage_master_user_password = true
  master_user_secret_kms_key_id = aws_kms_key.main.arn
}
```

### 9. Missing Resource Dependencies
**Failure Pattern:**
- Resources created in wrong order
- Missing `depends_on` declarations
- Implicit dependencies not handled
- Race conditions during deployment

**Impact:**
- Terraform apply failures
- Inconsistent deployments
- Resource creation errors

**Example of Failure:**
```terraform
resource "aws_instance" "web" {
  subnet_id = aws_subnet.public.id
  # Missing dependency on internet gateway and route table
}
```

## Cost Optimization Failures

### 10. Oversized Resources
**Failure Pattern:**
- Using large instance types for development
- No auto-scaling configuration
- Always-on resources for batch workloads
- No lifecycle policies for S3

**Impact:**
- Excessive AWS costs
- Resource waste
- Poor cost optimization

### 11. Missing Resource Cleanup
**Failure Pattern:**
- No deletion protection where needed
- Resources without proper lifecycle management
- No automated cleanup policies
- Orphaned resources after stack deletion

**Impact:**
- Unexpected costs from orphaned resources
- Data loss from accidental deletion
- Resource management complexity

## Testing and Validation Failures

### 12. No Validation Logic
**Failure Pattern:**
- No input validation for variables
- Missing resource constraints
- No policy validation
- No drift detection

**Impact:**
- Invalid configurations deployed
- Runtime errors
- Security policy violations

### 13. Inadequate Testing
**Failure Pattern:**
- No unit tests for Terraform modules
- Missing integration tests
- No validation of deployed resources
- No compliance testing

**Impact:**
- Configuration errors in production
- Failed deployments
- Security vulnerabilities

## Documentation and Maintenance Failures

### 14. Poor Documentation
**Failure Pattern:**
- Missing resource descriptions
- No architecture diagrams
- Unclear variable documentation
- No operational runbooks

**Impact:**
- Difficult maintenance and updates
- Knowledge transfer issues
- Increased troubleshooting time

### 15. No Version Control Strategy
**Failure Pattern:**
- No semantic versioning
- Missing change logs
- No branching strategy
- No rollback procedures

**Impact:**
- Difficult to track changes
- No rollback capability
- Configuration drift

## Common Terraform-Specific Failures

### 16. State Management Issues
**Failure Pattern:**
- Local state files
- No state locking
- Missing state backup
- No state encryption

### 17. Provider Version Issues
**Failure Pattern:**
- No provider version constraints
- Using deprecated resources
- Incompatible provider versions
- Missing required providers

### 18. Resource Naming Conflicts
**Failure Pattern:**
- Duplicate resource names
- Non-unique global resource names
- Poor naming conventions
- Missing environment prefixes

## Lessons Learned

1. **Security First**: Always implement encryption, least privilege, and monitoring
2. **Design for Failure**: Build redundancy and fault tolerance from the start
3. **Automate Compliance**: Use AWS Config and automated remediation
4. **Test Everything**: Implement comprehensive testing strategies
5. **Document Thoroughly**: Maintain clear documentation and operational procedures
6. **Monitor Continuously**: Implement comprehensive logging and alerting
7. **Follow Best Practices**: Adhere to AWS Well-Architected Framework principles
8. **Version Control**: Maintain proper versioning and change management
9. **Cost Awareness**: Implement cost optimization from day one
10. **Regular Reviews**: Conduct periodic security and architecture reviews

## Prevention Strategies

- **Code Reviews**: Mandatory peer review for all infrastructure changes
- **Automated Testing**: Implement CI/CD pipelines with comprehensive testing
- **Security Scanning**: Use tools like Checkov, tfsec, or Terrascan
- **Compliance Automation**: Implement AWS Config rules and remediation
- **Training**: Regular team training on security and best practices
- **Templates**: Use approved, tested Terraform modules and templates