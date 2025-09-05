# Fixing Your Terraform Security Framework - Complete Solution

You're absolutely right - there are several critical issues in that code! Let me help you fix all of these problems and provide you with a complete, deployable solution.

## Issue Analysis & Solutions

### 1. **Completing the Network Security Module**

Let's finish that incomplete `aws_route_table` resource and add all the missing components:

```hcl
# modules/network-security/main.tf - COMPLETE VERSION

# VPC with DNS support
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "${var.environment}-security-vpc"
  }
}

# VPC Flow Logs for security monitoring
resource "aws_flow_log" "vpc_flow_log" {
  iam_role_arn    = aws_iam_role.flow_log.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id
}

resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  name              = "/aws/vpc/flowlogs-${var.environment}"
  retention_in_days = 30
  kms_key_id        = var.kms_key_arn
}

resource "aws_iam_role" "flow_log" {
  name = "${var.environment}-vpc-flow-log-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "flow_log" {
  name = "${var.environment}-vpc-flow-log-policy"
  role = aws_iam_role.flow_log.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = {
    Name = "${var.environment}-security-igw"
  }
}

# Subnets
resource "aws_subnet" "public" {
  count = length(var.availability_zones)
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = false
  
  tags = {
    Name = "${var.environment}-public-subnet-${count.index + 1}"
    Type = "Public"
  }
}

resource "aws_subnet" "private" {
  count = length(var.availability_zones)
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]
  
  tags = {
    Name = "${var.environment}-private-subnet-${count.index + 1}"
    Type = "Private"
  }
}

resource "aws_subnet" "database" {
  count = length(var.availability_zones)
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 20)
  availability_zone = var.availability_zones[count.index]
  
  tags = {
    Name = "${var.environment}-database-subnet-${count.index + 1}"
    Type = "Database"
  }
}

# NAT Gateways
resource "aws_eip" "nat" {
  count = length(var.availability_zones)
  
  domain     = "vpc"
  depends_on = [aws_internet_gateway.main]
  
  tags = {
    Name = "${var.environment}-nat-eip-${count.index + 1}"
  }
}

resource "aws_nat_gateway" "main" {
  count = length(var.availability_zones)
  
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = {
    Name = "${var.environment}-nat-gateway-${count.index + 1}"
  }
  
  depends_on = [aws_internet_gateway.main]
}

# Route Tables - COMPLETED
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = {
    Name = "${var.environment}-public-rt"
  }
}

resource "aws_route_table" "private" {
  count = length(var.availability_zones)
  
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = {
    Name = "${var.environment}-private-rt-${count.index + 1}"
  }
}

# THIS WAS THE INCOMPLETE RESOURCE - NOW FIXED
resource "aws_route_table" "database" {
  vpc_id = aws_vpc.main.id
  
  # Database subnets have no internet access for security
  tags = {
    Name = "${var.environment}-database-rt"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)
  
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)
  
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "database" {
  count = length(aws_subnet.database)
  
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database.id
}

# Security Groups
resource "aws_security_group" "web_tier" {
  name_prefix = "${var.environment}-web-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for web tier - ALB only"

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from anywhere (redirect to HTTPS)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-web-tier-sg"
  }
}

resource "aws_security_group" "app_tier" {
  name_prefix = "${var.environment}-app-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for application tier"

  ingress {
    description     = "HTTP from web tier"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.web_tier.id]
  }

  ingress {
    description     = "HTTPS from web tier"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.web_tier.id]
  }

  ingress {
    description     = "Custom app port from web tier"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.web_tier.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-app-tier-sg"
  }
}

resource "aws_security_group" "database_tier" {
  name_prefix = "${var.environment}-db-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for database tier"

  ingress {
    description     = "MySQL/Aurora from app tier"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app_tier.id]
  }

  ingress {
    description     = "PostgreSQL from app tier"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_tier.id]
  }

  # No egress rules - databases don't need internet access

  tags = {
    Name = "${var.environment}-database-tier-sg"
  }
}

# Network ACLs for additional security layer
resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.public[*].id

  # Allow inbound HTTPS
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  # Allow inbound HTTP
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }

  # Allow return traffic
  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Allow all outbound
  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name = "${var.environment}-public-nacl"
  }
}

resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id

  # Allow inbound from VPC
  ingress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 0
    to_port    = 0
  }

  # Allow return traffic
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Allow all outbound
  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name = "${var.environment}-private-nacl"
  }
}

resource "aws_network_acl" "database" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.database[*].id

  # Only allow inbound from private subnets
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = cidrsubnet(var.vpc_cidr, 4, 1) # Private subnet range
    from_port  = 3306
    to_port    = 3306
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = cidrsubnet(var.vpc_cidr, 4, 1) # Private subnet range
    from_port  = 5432
    to_port    = 5432
  }

  # Allow return traffic to private subnets only
  egress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = cidrsubnet(var.vpc_cidr, 4, 1) # Private subnet range
    from_port  = 1024
    to_port    = 65535
  }

  tags = {
    Name = "${var.environment}-database-nacl"
  }
}

# WAF v2 Configuration
resource "aws_wafv2_web_acl" "main" {
  count = var.enable_waf ? 1 : 0
  
  name  = "${var.environment}-security-waf"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 1

    override_action {
      none {}
    }

    statement {
      rate_based_statement {
        limit              = var.waf_rate_limit
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }

    action {
      block {}
    }
  }

  # AWS Managed Rules - Core Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 10

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules - Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 20

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "KnownBadInputsRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # Geo-blocking rule
  dynamic "rule" {
    for_each = length(var.allowed_countries) > 0 ? [1] : []
    
    content {
      name     = "GeoBlockingRule"
      priority = 30

      action {
        block {}
      }

      statement {
        not_statement {
          statement {
            geo_match_statement {
              country_codes = var.allowed_countries
            }
          }
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "GeoBlockingRule"
        sampled_requests_enabled   = true
      }
    }
  }

  # IP blocking rule
  dynamic "rule" {
    for_each = length(var.blocked_ips) > 0 ? [1] : []
    
    content {
      name     = "IPBlockingRule"
      priority = 40

      action {
        block {}
      }

      statement {
        ip_set_reference_statement {
          arn = aws_wafv2_ip_set.blocked_ips[0].arn
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "IPBlockingRule"
        sampled_requests_enabled   = true
      }
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.environment}SecurityWAF"
    sampled_requests_enabled   = true
  }

  tags = {
    Name = "${var.environment}-security-waf"
  }
}

# IP Set for blocked IPs
resource "aws_wafv2_ip_set" "blocked_ips" {
  count = length(var.blocked_ips) > 0 ? 1 : 0
  
  name               = "${var.environment}-blocked-ips"
  scope              = "REGIONAL"
  ip_address_version = "IPV4"
  addresses          = var.blocked_ips

  tags = {
    Name = "${var.environment}-blocked-ips"
  }
}

# WAF Logging Configuration
resource "aws_wafv2_web_acl_logging_configuration" "main" {
  count = var.enable_waf ? 1 : 0
  
  resource_arn            = aws_wafv2_web_acl.main[0].arn
  log_destination_configs = [aws_cloudwatch_log_group.waf[0].arn]

  redacted_fields {
    single_header {
      name = "authorization"
    }
  }

  redacted_fields {
    single_header {
      name = "cookie"
    }
  }
}

resource "aws_cloudwatch_log_group" "waf" {
  count = var.enable_waf ? 1 : 0
  
  name              = "/aws/wafv2/${var.environment}-security-waf"
  retention_in_days = 30
  kms_key_id        = var.kms_key_arn
}
```

### 2. **Network Security Module Variables** (`modules/network-security/variables.tf`)

```hcl
# modules/network-security/variables.tf

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
}

variable "enable_waf" {
  description = "Enable WAF protection"
  type        = bool
  default     = true
}

variable "waf_rate_limit" {
  description = "WAF rate limit per 5 minutes"
  type        = number
  default     = 2000
}

variable "allowed_countries" {
  description = "List of allowed country codes for WAF geo-blocking"
  type        = list(string)
  default     = []
}

variable "blocked_ips" {
  description = "List of IP addresses to block"
  type        = list(string)
  default     = []
}
```

### 3. **Network Security Module Outputs** (`modules/network-security/outputs.tf`)

```hcl
# modules/network-security/outputs.tf

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of the database subnets"
  value       = aws_subnet.database[*].id
}

output "web_security_group_id" {
  description = "ID of the web tier security group"
  value       = aws_security_group.web_tier.id
}

output "app_security_group_id" {
  description = "ID of the app tier security group"
  value       = aws_security_group.app_tier.id
}

output "database_security_group_id" {
  description = "ID of the database tier security group"
  value       = aws_security_group.database_tier.id
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = var.enable_waf ? aws_wafv2_web_acl.main[0].arn : null
}

output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = var.enable_waf ? aws_wafv2_web_acl.main[0].id : null
}
```

### 4. **Fixed IAM Module** (`modules/iam/main.tf`)

```hcl
# modules/iam/main.tf - FIXED VERSION

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Password Policy
resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = var.password_policy_requirements.minimum_password_length
  require_lowercase_characters   = var.password_policy_requirements.require_lowercase_characters
  require_uppercase_characters   = var.password_policy_requirements.require_uppercase_characters
  require_numbers               = var.password_policy_requirements.require_numbers
  require_symbols               = var.password_policy_requirements.require_symbols
  allow_users_to_change_password = var.password_policy_requirements.allow_users_to_change_password
  max_password_age              = var.password_policy_requirements.max_password_age
  password_reuse_prevention     = var.password_policy_requirements.password_reuse_prevention
}

# FIXED: MFA Condition Logic using dynamic blocks
resource "aws_iam_role" "security_admin" {
  name = "${var.organization_name}-security-admin-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      merge(
        {
          Action = "sts:AssumeRole"
          Effect = "Allow"
          Principal = {
            AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
          }
        },
        var.enforce_mfa ? {
          Condition = {
            Bool = {
              "aws:MultiFactorAuthPresent" = "true"
            }
            NumericLessThan = {
              "aws:MultiFactorAuthAge" = "3600"
            }
          }
        } : {}
      )
    ]
  })
  
  max_session_duration = var.session_duration_hours * 3600
  
  tags = {
    Name = "SecurityAdminRole"
    Purpose = "Security administration with MFA enforcement"
  }
}

# Security Admin Policy - Enhanced
resource "aws_iam_policy" "security_admin" {
  name        = "${var.organization_name}-security-admin-policy-${var.environment}"
  description = "Comprehensive security administration policy"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          # Security services
          "guardduty:*",
          "securityhub:*",
          "config:*",
          "cloudtrail:*",
          "inspector2:*",
          "macie2:*",
          "access-analyzer:*",
          
          # IAM (with restrictions)
          "iam:Get*",
          "iam:List*",
          "iam:CreateRole",
          "iam:CreatePolicy",
          "iam:AttachRolePolicy",
          "iam:DetachRolePolicy",
          "iam:PutRolePolicy",
          "iam:DeleteRolePolicy",
          "iam:UpdateRole",
          "iam:UpdateRoleDescription",
          "iam:TagRole",
          "iam:UntagRole",
          
          # KMS
          "kms:*",
          
          # CloudWatch and logging
          "logs:*",
          "cloudwatch:*",
          "events:*",
          
          # Systems Manager
          "ssm:*",
          
          # WAF
          "wafv2:*",
          "waf:*",
          "waf-regional:*",
          
          # VPC Security
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:AuthorizeSecurityGroupEgress",
          "ec2:RevokeSecurityGroupIngress",
          "ec2:RevokeSecurityGroupEgress",
          "ec2:CreateSecurityGroup",
          "ec2:DeleteSecurityGroup",
          "ec2:DescribeSecurityGroups",
          "ec2:CreateNetworkAcl*",
          "ec2:DeleteNetworkAcl*",
          "ec2:ReplaceNetworkAcl*",
          "ec2:DescribeNetworkAcls",
          "ec2:CreateFlowLogs",
          "ec2:DeleteFlowLogs",
          "ec2:DescribeFlowLogs",
          
          # S3 Security
          "s3:GetBucketPolicy",
          "s3:PutBucketPolicy",
          "s3:GetBucketAcl",
          "s3:PutBucketAcl",
          "s3:GetBucketEncryption",
          "s3:PutBucketEncryption",
          "s3:GetBucketVersioning",
          "s3:PutBucketVersioning",
          "s3:GetBucketPublicAccessBlock",
          "s3:PutBucketPublicAccessBlock",
          
          # Shield Advanced
          "shield:*",
          
          # Organizations (for multi-account security)
          "organizations:Describe*",
          "organizations:List*"
        ]
        Resource = "*"
      },
      {
        Effect = "Deny"
        Action = [
          # Prevent privilege escalation
          "iam:CreateUser",
          "iam:DeleteUser",
          "iam:CreateAccessKey",
          "iam:DeleteAccessKey",
          "iam:AttachUserPolicy",
          "iam:DetachUserPolicy",
          "iam:PutUserPolicy",
          "iam:DeleteUserPolicy",
          "iam:CreateGroup",
          "iam:DeleteGroup",
          "iam:AddUserToGroup",
          "iam:RemoveUserFromGroup",
          
          # Prevent disabling security services
          "guardduty:DeleteDetector",
          "securityhub:DisableSecurityHub",
          "config:DeleteConfigurationRecorder",
          "config:DeleteDeliveryChannel",
          "config:StopConfigurationRecorder",
          "cloudtrail:StopLogging",
          "cloudtrail:DeleteTrail",
          "cloudtrail:PutEventSelectors"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "security_admin" {
  role       = aws_iam_role.security_admin.name
  policy_arn = aws_iam_policy.security_admin.arn
}

# Developer Role - FIXED MFA condition
resource "aws_iam_role" "developer" {
  name = "${var.organization_name}-developer-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      merge(
        {
          Action = "sts:AssumeRole"
          Effect = "Allow"
          Principal = {
            AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
          }
        },
        var.enforce_mfa ? {
          Condition = {
            Bool = {
              "aws:MultiFactorAuthPresent" = "true"
            }
          }
        } : {}
      )
    ]
  })
  
  max_session_duration = var.session_duration_hours * 3600
}

# Developer Policy - Enhanced with proper restrictions
resource "aws_iam_policy" "developer" {
  name        = "${var.organization_name}-developer-policy-${var.environment}"
  description = "Developer policy with security restrictions"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          # EC2 (limited)
          "ec2:Describe*",
          "ec2:RunInstances",
          "ec2:TerminateInstances",
          "ec2:StartInstances",
          "ec2:StopInstances",
          "ec2:RebootInstances",
          "ec2:CreateTags",
          "ec2:DeleteTags",
          
          # S3 (application buckets only - will be restricted by resource ARN)
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
          "s3:GetObjectVersion",
          
          # Lambda
          "lambda:*",
          
          # API Gateway
          "apigateway:*",
          
          # CloudFormation (for application stacks)
          "cloudformation:*",
          
          # CloudWatch (read-only + custom metrics)
          "cloudwatch:Describe*",
          "cloudwatch:Get*",
          "cloudwatch:List*",
          "cloudwatch:PutMetricData",
          "logs:Describe*",
          "logs:Get*",
          "logs:FilterLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          
          # Systems Manager (parameter access)
          "ssm:DescribeParameters",
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath",
          "ssm:PutParameter",
          
          # Secrets Manager (application secrets)
          "secretsmanager:GetSecretValue",