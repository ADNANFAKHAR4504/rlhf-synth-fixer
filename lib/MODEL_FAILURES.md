# Common Model Failures in Terraform Infrastructure Implementation

This document outlines the typical mistakes and failures that occur when implementing the highly available AWS infrastructure requirements using Terraform.

## Infrastructure Naming and Resource Conflicts

### Failure: Resource Name Collisions
**Problem**: Using static names without randomization leads to conflicts during repeated deployments.

**Example Failure**:
```hcl
# BAD - Will fail on second deployment
resource "aws_autoscaling_group" "main" {
  name = "webapp-asg"  # Static name causes conflicts
}
```

**Root Cause**: AWS resources require unique names, and static naming doesn't account for multiple deployments or parallel testing.

**Impact**: Deployment fails with "AlreadyExists" errors, blocking CI/CD pipelines.

### Failure: Name Length Exceeded
**Problem**: Resource names exceed AWS character limits.

**Example Failure**:
```hcl
# BAD - Name too long for AWS limits
resource "aws_iam_role" "ec2_role" {
  name_prefix = "very-long-project-name-production-environment-ec2-role-"
  # Results in names > 64 characters
}
```

**Root Cause**: Not considering AWS naming constraints (IAM roles: 64 chars, ASG names: 255 chars, etc.).

## Security Configuration Failures

### Failure: Overly Permissive Security Groups
**Problem**: Security groups allow unnecessary access, violating security requirements.

**Example Failure**:
```hcl
# BAD - Too permissive
resource "aws_security_group" "ec2" {
  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Allows all traffic
  }
}
```

**Root Cause**: Not following least privilege principle, allowing broad access instead of specific requirements.

### Failure: Missing Encryption Configuration
**Problem**: Resources deployed without required encryption.

**Example Failure**:
```hcl
# BAD - No encryption specified
resource "aws_db_instance" "main" {
  storage_encrypted = false  # Missing encryption
  # ... other config
}
```

**Root Cause**: Forgetting to enable encryption for data at rest, violating security requirements.

## Networking Architecture Failures

### Failure: Incorrect Subnet Placement
**Problem**: Resources deployed in wrong subnet types.

**Example Failure**:
```hcl
# BAD - ALB in private subnets
resource "aws_lb" "main" {
  subnets = aws_subnet.private[*].id  # Should be public
}
```

**Root Cause**: Misunderstanding of public vs private subnet purposes and routing.

### Failure: Missing NAT Gateway Configuration
**Problem**: Private subnets can't access internet for updates.

**Example Failure**:
```hcl
# BAD - No NAT Gateway for private subnets
resource "aws_route_table" "private" {
  # Missing route to NAT Gateway
  # Instances can't reach internet for yum updates
}
```

**Root Cause**: Not understanding that private subnets need NAT Gateway for outbound internet access.

## Auto Scaling Group Failures

### Failure: Health Check Configuration Issues
**Problem**: ASG instances fail health checks and never become healthy.

**Example Failure**:
```hcl
# BAD - Health check too aggressive
resource "aws_lb_target_group" "main" {
  health_check {
    interval            = 5    # Too frequent
    timeout             = 2    # Too short
    unhealthy_threshold = 1    # Too strict
  }
}
```

**Root Cause**: Health checks don't account for instance startup time, causing premature failures.

### Failure: Launch Template User Data Issues
**Problem**: User data script fails, preventing instances from starting properly.

**Example Failure**:
```hcl
# BAD - User data with potential failures
user_data = base64encode(<<-EOF
  #!/bin/bash
  yum update -y  # Can timeout or fail
  yum install -y httpd
  systemctl start httpd
  # No error handling
EOF
)
```

**Root Cause**: No error handling in user data scripts, causing silent failures.

## Database Configuration Failures

### Failure: RDS Password Validation Errors
**Problem**: Database passwords contain invalid characters.

**Example Failure**:
```hcl
# BAD - Password with special characters
resource "random_password" "db_password" {
  length  = 16
  special = true  # Can generate invalid chars for RDS
}
```

**Root Cause**: RDS has specific password requirements that random generators might violate.

### Failure: Missing Multi-AZ Configuration
**Problem**: RDS deployed in single AZ, violating high availability requirements.

**Example Failure**:
```hcl
# BAD - Single AZ deployment
resource "aws_db_instance" "main" {
  multi_az = false  # Violates HA requirements
}
```

**Root Cause**: Not implementing required high availability features.

## IAM and Access Control Failures

### Failure: Overly Broad IAM Permissions
**Problem**: EC2 instances get unnecessary permissions.

**Example Failure**:
```hcl
# BAD - Too broad permissions
resource "aws_iam_policy" "ec2_policy" {
  policy = jsonencode({
    Statement = [{
      Effect = "Allow"
      Action = ["*"]  # Allows everything
      Resource = "*"
    }]
  })
}
```

**Root Cause**: Not following principle of least privilege, granting excessive permissions.

### Failure: Missing IAM Role Attachment
**Problem**: EC2 instances can't access required AWS services.

**Example Failure**:
```hcl
# BAD - No IAM role attached
resource "aws_launch_template" "main" {
  # Missing iam_instance_profile configuration
}
```

**Root Cause**: Forgetting to attach IAM roles to EC2 instances for S3 access.

## Resource Dependencies and Ordering Failures

### Failure: Missing Dependencies
**Problem**: Resources created before dependencies are ready.

**Example Failure**:
```hcl
# BAD - No explicit dependencies
resource "aws_autoscaling_group" "main" {
  vpc_zone_identifier = aws_subnet.private[*].id
  # No depends_on for VPC/subnet readiness
}
```

**Root Cause**: Not understanding Terraform's dependency resolution and resource creation order.

### Failure: Circular Dependencies
**Problem**: Resources reference each other creating circular dependencies.

**Example Failure**:
```hcl
# BAD - Circular reference
resource "aws_security_group" "alb" {
  # References EC2 security group
}

resource "aws_security_group" "ec2" {
  # References ALB security group
}
```

**Root Cause**: Poor security group design creating circular references.

## Cost and Performance Failures

### Failure: Inappropriate Instance Types
**Problem**: Using wrong instance types for workload requirements.

**Example Failure**:
```hcl
# BAD - Wrong instance type
resource "aws_launch_template" "main" {
  instance_type = "t2.nano"  # Too small for production
}
```

**Root Cause**: Not considering performance requirements and cost optimization.

### Failure: Missing Resource Tagging
**Problem**: Resources not properly tagged for cost tracking.

**Example Failure**:
```hcl
# BAD - No tags
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  # Missing tags for cost allocation
}
```

**Root Cause**: Not implementing proper resource tagging strategy.

## Validation and Testing Failures

### Failure: No Terraform Validation
**Problem**: Configuration errors not caught before deployment.

**Example Failure**:
```bash
# BAD - Skipping validation
terraform apply  # Without terraform validate first
```

**Root Cause**: Not running validation checks before deployment.

### Failure: Missing Output Values
**Problem**: No way to verify deployment success or access resources.

**Example Failure**:
```hcl
# BAD - No outputs defined
# No way to get ALB DNS name or other important values
```

**Root Cause**: Not providing necessary output values for verification and access.

## Best Practices to Avoid Failures

1. **Always use random suffixes** for resource names
2. **Validate Terraform configuration** before applying
3. **Test in non-production environments** first
4. **Use explicit dependencies** with `depends_on`
5. **Implement proper error handling** in user data scripts
6. **Follow security best practices** from the start
7. **Monitor resource costs** and performance
8. **Document all configuration decisions** and trade-offs

## Common Error Messages and Solutions

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "AlreadyExists" | Resource name conflict | Use random suffixes |
| "InvalidParameterValue" | Password contains invalid chars | Use appropriate random generator |
| "ValidationError" | Resource configuration invalid | Check AWS documentation |
| "InsufficientCapacity" | AZ doesn't have capacity | Try different AZ or instance type |
| "UnauthorizedOperation" | IAM permissions insufficient | Review and update IAM policies |