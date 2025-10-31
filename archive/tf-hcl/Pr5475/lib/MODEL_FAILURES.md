# Model Failures - Common Mistakes and Anti-Patterns

This document catalogs common failures, mistakes, and anti-patterns that AI models might produce when generating infrastructure code. Understanding these failures helps improve model training and validation.

## Table of Contents

1. [Security Failures](#security-failures)
2. [Configuration Errors](#configuration-errors)
3. [Structural Issues](#structural-issues)
4. [Compliance Violations](#compliance-violations)
5. [Performance Problems](#performance-problems)
6. [Testing Failures](#testing-failures)

---

## Security Failures

### 1. **Missing Encryption**

❌ **FAILURE**: Not encrypting resources at rest

```hcl
# WRONG - No encryption on S3 bucket
resource "aws_s3_bucket" "logs" {
  bucket = "my-logs-bucket"
  # Missing encryption configuration!
}

# WRONG - RDS without encryption
resource "aws_db_instance" "main" {
  identifier     = "mydb"
  engine         = "mysql"
  storage_encrypted = false  # BAD!
  # ...
}
```

✅ **CORRECT**: Always encrypt data at rest

```hcl
resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
  }
}

resource "aws_db_instance" "main" {
  identifier        = "mydb"
  storage_encrypted = true
  kms_key_id        = aws_kms_key.main.arn
}
```

### 2. **Publicly Accessible RDS**

❌ **FAILURE**: Making database publicly accessible

```hcl
# WRONG - Database exposed to internet
resource "aws_db_instance" "main" {
  identifier          = "mydb"
  publicly_accessible = true  # CRITICAL SECURITY ISSUE!
  # ...
}
```

✅ **CORRECT**: Keep databases in private subnets only

```hcl
resource "aws_db_instance" "main" {
  identifier             = "mydb"
  publicly_accessible    = false
  db_subnet_group_name   = aws_db_subnet_group.private.name
  vpc_security_group_ids = [aws_security_group.rds.id]
}
```

### 3. **Overly Permissive Security Groups**

❌ **FAILURE**: Allowing 0.0.0.0/0 access

```hcl
# WRONG - Open to the entire internet
resource "aws_security_group" "alb" {
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # TOO BROAD!
  }
}
```

✅ **CORRECT**: Restrict to specific IP ranges

```hcl
resource "aws_security_group" "alb" {
  ingress {
    description = "HTTPS from allowed IP range"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["203.0.113.0/24"]  # Specific range
  }
}
```

### 4. **Wildcard IAM Permissions**

❌ **FAILURE**: Using wildcards in IAM policies

```hcl
# WRONG - Overly permissive IAM policy
resource "aws_iam_policy" "bad" {
  policy = jsonencode({
    Statement = [
      {
        Effect   = "Allow"
        Action   = "s3:*"          # TOO BROAD!
        Resource = "*"             # TOO BROAD!
      }
    ]
  })
}
```

✅ **CORRECT**: Use least privilege with specific actions and resources

```hcl
resource "aws_iam_policy" "good" {
  policy = jsonencode({
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.specific.arn}/*"
      }
    ]
  })
}
```

### 5. **Missing KMS Key Rotation**

❌ **FAILURE**: Not enabling key rotation

```hcl
# WRONG - No key rotation
resource "aws_kms_key" "main" {
  description = "KMS key"
  # Missing enable_key_rotation = true
}
```

✅ **CORRECT**: Always enable automatic key rotation

```hcl
resource "aws_kms_key" "main" {
  description             = "KMS key"
  enable_key_rotation     = true
  deletion_window_in_days = 30
}
```

---

## Configuration Errors

### 6. **Missing VPC Configuration**

❌ **FAILURE**: Creating resources without proper VPC setup

```hcl
# WRONG - Creating ALB without VPC context
resource "aws_lb" "main" {
  name               = "my-alb"
  load_balancer_type = "application"
  # Missing VPC and subnet configuration!
}
```

✅ **CORRECT**: Properly configure VPC and subnets

```hcl
resource "aws_lb" "main" {
  name               = "my-alb"
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [for s in aws_subnet.public : s.id]
}
```

### 7. **Incorrect Subnet Placement**

❌ **FAILURE**: Placing RDS in public subnets

```hcl
# WRONG - Database in public subnet
resource "aws_db_subnet_group" "main" {
  subnet_ids = [
    aws_subnet.public_1.id,
    aws_subnet.public_2.id  # WRONG!
  ]
}
```

✅ **CORRECT**: Always use private subnets for databases

```hcl
resource "aws_db_subnet_group" "main" {
  subnet_ids = [
    aws_subnet.private_1.id,
    aws_subnet.private_2.id
  ]
}
```

### 8. **Missing NAT Gateway**

❌ **FAILURE**: Private subnets without internet access

```hcl
# WRONG - Private subnet with no NAT gateway
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  # No route to NAT gateway - instances can't reach internet!
}
```

✅ **CORRECT**: Provide NAT gateway for private subnet internet access

```hcl
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }
}
```

### 9. **Missing Health Checks**

❌ **FAILURE**: ALB target group without health checks

```hcl
# WRONG - No health check configuration
resource "aws_lb_target_group" "main" {
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  # Missing health_check block!
}
```

✅ **CORRECT**: Always configure health checks

```hcl
resource "aws_lb_target_group" "main" {
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }
}
```

---

## Structural Issues

### 10. **Hardcoded Values**

❌ **FAILURE**: Hardcoding values instead of using variables

```hcl
# WRONG - Hardcoded values everywhere
resource "aws_instance" "web" {
  ami           = "ami-12345678"
  instance_type = "t2.micro"
  subnet_id     = "subnet-abcd1234"
  # Not reusable or maintainable!
}
```

✅ **CORRECT**: Use variables and data sources

```hcl
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

data "aws_ami" "latest" {
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.latest.id
  instance_type = var.instance_type
  subnet_id     = aws_subnet.public.id
}
```

### 11. **Missing Tags**

❌ **FAILURE**: Resources without proper tags

```hcl
# WRONG - No tags for identification or billing
resource "aws_instance" "web" {
  ami           = data.aws_ami.latest.id
  instance_type = "t2.micro"
  # Missing tags!
}
```

✅ **CORRECT**: Tag all resources consistently

```hcl
locals {
  common_tags = {
    Environment = "prod"
    Owner       = "DevOps-Team"
    ManagedBy   = "Terraform"
  }
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.latest.id
  instance_type = "t2.micro"
  
  tags = merge(
    local.common_tags,
    {
      Name = "web-server-1"
    }
  )
}
```

### 12. **Inconsistent Naming**

❌ **FAILURE**: No naming convention

```hcl
# WRONG - Inconsistent naming
resource "aws_s3_bucket" "MyBucket" {
  bucket = "some-random-name"
}

resource "aws_s3_bucket" "logs" {
  bucket = "AnotherName123"
}
```

✅ **CORRECT**: Follow consistent naming pattern

```hcl
locals {
  name_prefix = "prod"
}

resource "aws_s3_bucket" "alb_logs" {
  bucket = "${local.name_prefix}-alb-logs-${data.aws_caller_identity.current.account_id}"
  
  tags = {
    Name = "${local.name_prefix}-s3-alb-logs"
  }
}
```

---

## Compliance Violations

### 13. **Missing CloudTrail**

❌ **FAILURE**: No audit logging

```hcl
# WRONG - No CloudTrail for compliance
# Infrastructure without audit trail
```

✅ **CORRECT**: Enable CloudTrail with log validation

```hcl
resource "aws_cloudtrail" "main" {
  name                          = "${local.name_prefix}-cloudtrail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  enable_logging                = true
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.main.arn
}
```

### 14. **Missing AWS Config**

❌ **FAILURE**: No configuration tracking

```hcl
# WRONG - No AWS Config for compliance monitoring
# Can't track resource configuration changes
```

✅ **CORRECT**: Enable AWS Config

```hcl
resource "aws_config_configuration_recorder" "main" {
  name     = "${local.name_prefix}-config-recorder"
  role_arn = aws_iam_role.config.arn
  
  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true
}
```

### 15. **No Backup Strategy**

❌ **FAILURE**: No backup retention policy

```hcl
# WRONG - RDS without backups
resource "aws_db_instance" "main" {
  identifier              = "mydb"
  backup_retention_period = 0  # NO BACKUPS!
}
```

✅ **CORRECT**: Configure automated backups

```hcl
resource "aws_db_instance" "main" {
  identifier                = "mydb"
  backup_retention_period   = 30
  backup_window             = "03:00-04:00"
  skip_final_snapshot       = false
  final_snapshot_identifier = "${local.name_prefix}-final-snapshot"
}
```

### 16. **Unencrypted Logs**

❌ **FAILURE**: CloudWatch logs without encryption

```hcl
# WRONG - Logs without encryption
resource "aws_cloudwatch_log_group" "main" {
  name              = "/aws/app/logs"
  retention_in_days = 7
  # Missing kms_key_id!
}
```

✅ **CORRECT**: Encrypt logs with KMS

```hcl
resource "aws_cloudwatch_log_group" "main" {
  name              = "/aws/app/logs"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn
}
```

---

## Performance Problems

### 17. **Single AZ Deployment**

❌ **FAILURE**: No high availability

```hcl
# WRONG - Single AZ deployment
resource "aws_subnet" "public" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-west-1a"  # Only one AZ!
}
```

✅ **CORRECT**: Multi-AZ deployment

```hcl
locals {
  azs = ["us-west-1a", "us-west-1b"]
}

resource "aws_subnet" "public" {
  for_each = { for idx, az in local.azs : idx => az }
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.public_subnet_cidrs[each.key]
  availability_zone = each.value
}
```

### 18. **Missing Connection Pooling**

❌ **FAILURE**: No RDS proxy for connection management

```hcl
# WRONG - Direct RDS connections without pooling
# Can lead to connection exhaustion
```

✅ **CORRECT**: Consider RDS Proxy for high-traffic apps

```hcl
resource "aws_db_proxy" "main" {
  name                   = "${local.name_prefix}-rds-proxy"
  engine_family          = "MYSQL"
  auth {
    auth_scheme = "SECRETS"
    secret_arn  = aws_secretsmanager_secret.rds_password.arn
  }
  role_arn               = aws_iam_role.rds_proxy.arn
  vpc_subnet_ids         = [for s in aws_subnet.private : s.id]
}
```

### 19. **Inadequate Monitoring**

❌ **FAILURE**: No CloudWatch alarms

```hcl
# WRONG - Infrastructure without monitoring alarms
# Can't detect issues proactively
```

✅ **CORRECT**: Set up comprehensive alarms

```hcl
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${local.name_prefix}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_actions       = [aws_sns_topic.alarms.arn]
}
```

---

## Testing Failures

### 20. **Untestable Code Structure**

❌ **FAILURE**: Code that can't be unit tested

```hcl
# WRONG - Everything in one huge file with no structure
# Thousands of lines with no organization
# No way to test individual components
```

✅ **CORRECT**: Organized, testable structure

```hcl
# Separate concerns:
# - provider.tf
# - variables.tf
# - main.tf (networking)
# - compute.tf
# - database.tf
# - security.tf
# - monitoring.tf
# - outputs.tf
```

### 21. **Missing Resource Dependencies**

❌ **FAILURE**: Resources created in wrong order

```hcl
# WRONG - Using resources before they exist
resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn  # Might not exist yet!
}

resource "aws_lb" "main" {
  # Created after listener tries to reference it
}
```

✅ **CORRECT**: Proper dependency management

```hcl
resource "aws_lb" "main" {
  name = "my-alb"
  # ...
}

resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  
  depends_on = [aws_lb.main]  # Explicit if needed
}
```

---

## Critical Anti-Patterns Summary

### Top 10 Most Common Failures

1. ❌ **Public RDS instances** - Never make databases publicly accessible
2. ❌ **Missing encryption** - Always encrypt data at rest and in transit
3. ❌ **Overly broad security groups** - Restrict to specific IP ranges
4. ❌ **Wildcard IAM permissions** - Use least privilege principle
5. ❌ **No CloudTrail/Config** - Required for compliance and auditing
6. ❌ **Missing tags** - Essential for organization and billing
7. ❌ **Single AZ deployment** - Always use multi-AZ for production
8. ❌ **No backup strategy** - Configure automated backups and retention
9. ❌ **Hardcoded values** - Use variables and data sources
10. ❌ **No monitoring/alarms** - Set up proactive alerting

---

## How to Avoid These Failures

### Best Practices Checklist

- ✅ Review AWS Security Best Practices
- ✅ Use automated testing (unit + integration tests)
- ✅ Run `terraform validate` and `terraform plan` before apply
- ✅ Use linters like `tflint` and `checkov`
- ✅ Implement code review process
- ✅ Follow principle of least privilege
- ✅ Enable all relevant AWS security services
- ✅ Tag all resources consistently
- ✅ Document your infrastructure
- ✅ Use modules for reusability
- ✅ Version control all infrastructure code
- ✅ Test in non-production environment first

### Validation Tools

```bash
# Validate Terraform syntax
terraform validate

# Check for security issues
checkov -d .

# Lint Terraform code
tflint

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration
```

---

## Conclusion

Understanding these common failures helps:
- **Model Developers**: Improve training data and validation
- **Infrastructure Engineers**: Avoid common pitfalls
- **Reviewers**: Know what to look for in code reviews
- **Testers**: Create better test cases

Always remember: **Security First, Compliance Always, Testing Mandatory**