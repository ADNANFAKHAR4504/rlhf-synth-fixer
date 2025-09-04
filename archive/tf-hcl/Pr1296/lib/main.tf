# main.tf - Secure AWS Infrastructure Implementation for trainr859

########################
# Local Values
########################

locals {
  # Merge common tags with required security tags
  common_tags = merge(
    var.common_tags,
    {
      Environment = var.environment
      Owner       = var.owner
      Project     = var.project_name
      ManagedBy   = "terraform"
      Purpose     = "security-compliance"
    }
  )

  availability_zones = data.aws_availability_zones.available.names
}

########################
# Data Sources
########################

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

########################
# VPC and Networking - Requirement 9: VPC Flow Logs
########################

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-vpc"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-igw"
  })
}

resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = local.availability_zones[count.index]
  map_public_ip_on_launch = false # Requirement 7: No public access by default

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-subnet-${count.index + 1}"
    Type = "public"
  })
}

resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = local.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-subnet-${count.index + 1}"
    Type = "private"
  })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-rt"
  })
}

resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_nat_gateway" "main" {
  count = length(aws_subnet.public)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-nat-gw-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_eip" "nat" {
  count = length(aws_subnet.public)

  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-nat-eip-${count.index + 1}"
  })
}

resource "aws_route_table" "private" {
  count = length(aws_subnet.private)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-rt-${count.index + 1}"
  })
}

resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Requirement 9: Enable VPC Flow Logs for network traffic analysis
resource "aws_flow_log" "vpc_flow_log" {
  iam_role_arn    = aws_iam_role.flow_log.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-vpc-flow-log"
  })
}

resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  name              = "/aws/vpc/flowlogs/${var.project_name}"
  retention_in_days = var.cloudwatch_log_retention_days

  tags = local.common_tags
}

########################
# VPC Endpoints for Systems Manager Session Manager
########################

# Security group for VPC endpoints
resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "${var.project_name}-vpc-endpoints-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
    description = "HTTPS from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-vpc-endpoints-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# VPC Endpoint for SSM
resource "aws_vpc_endpoint" "ssm" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.ssm"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action = [
          "ssm:CreateControlChannel",
          "ssm:CreateDataChannel",
          "ssm:DescribeInstanceAssociationsStatus",
          "ssm:DescribeInstanceInformation",
          "ssm:GetConnectionStatus"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:PrincipalVpc" = aws_vpc.main.id
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-ssm-vpc-endpoint"
  })
}

# VPC Endpoint for SSM Messages
resource "aws_vpc_endpoint" "ssmmessages" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.ssmmessages"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action = [
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:PrincipalVpc" = aws_vpc.main.id
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-ssmmessages-vpc-endpoint"
  })
}

# VPC Endpoint for EC2 Messages
resource "aws_vpc_endpoint" "ec2messages" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.ec2messages"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action = [
          "ec2messages:AcknowledgeMessage",
          "ec2messages:DeleteMessage",
          "ec2messages:FailMessage",
          "ec2messages:GetEndpoint",
          "ec2messages:GetMessages",
          "ec2messages:SendReply"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:PrincipalVpc" = aws_vpc.main.id
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-ec2messages-vpc-endpoint"
  })
}

########################
# Security Groups - Requirement 5: Limit SSH access (Enhanced with Session Manager)
########################

resource "aws_security_group" "web" {
  name_prefix = "${var.project_name}-web-"
  vpc_id      = aws_vpc.main.id

  # HTTPS only - Requirement 11: Disable HTTP
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from internet"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-web-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Security group for Session Manager access (replaces direct SSH)
# Note: Traditional SSH access has been replaced with AWS Systems Manager Session Manager
# for enhanced security and auditability
resource "aws_security_group" "session_manager" {
  name_prefix = "${var.project_name}-session-manager-"
  vpc_id      = aws_vpc.main.id

  # No ingress rules needed - Session Manager uses VPC endpoints
  # All traffic goes through AWS Systems Manager service

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic for Session Manager"
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-session-manager-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Legacy SSH security group (deprecated - kept for backward compatibility)
# Note: SSH access should be avoided in favor of Session Manager
resource "aws_security_group" "ssh_legacy" {
  name_prefix = "${var.project_name}-ssh-legacy-"
  vpc_id      = aws_vpc.main.id

  # Requirement 5: Configure security groups to limit SSH access to specific IP addresses
  # WARNING: This is deprecated in favor of Session Manager
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidr_blocks
    description = "SSH from specific IP ranges only (DEPRECATED)"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name        = "${var.project_name}-ssh-legacy-sg"
    Status      = "deprecated"
    Replacement = "session-manager"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "database" {
  name_prefix = "${var.project_name}-db-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
    description     = "MySQL from web servers only"
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-db-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

########################
# S3 Buckets - Requirements 4, 7, 11: Versioning, No Public Access, HTTPS only
########################

resource "aws_s3_bucket" "main" {
  count = length(var.s3_bucket_names)

  bucket        = "${var.s3_bucket_names[count.index]}-${random_string.bucket_suffix.result}"
  force_destroy = var.s3_force_destroy

  tags = merge(local.common_tags, {
    Name = var.s3_bucket_names[count.index]
  })
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Requirement 7: Prohibit public accessibility for all resources by default
resource "aws_s3_bucket_public_access_block" "main" {
  count = length(aws_s3_bucket.main)

  bucket = aws_s3_bucket.main[count.index].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Requirement 4: Ensure all S3 buckets have versioning enabled
resource "aws_s3_bucket_versioning" "main" {
  count = length(aws_s3_bucket.main)

  bucket = aws_s3_bucket.main[count.index].id

  versioning_configuration {
    status = "Enabled"
  }
}

# Requirement 11: Ensure secured S3 bucket access by disabling HTTP
resource "aws_s3_bucket_policy" "ssl_only" {
  count = length(aws_s3_bucket.main)

  bucket = aws_s3_bucket.main[count.index].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.main[count.index].arn,
          "${aws_s3_bucket.main[count.index].arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  count = length(aws_s3_bucket.main)

  bucket = aws_s3_bucket.main[count.index].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_logging" "main" {
  count = length(aws_s3_bucket.main)

  bucket = aws_s3_bucket.main[count.index].id

  target_bucket = aws_s3_bucket.cloudtrail.id
  target_prefix = "s3-access-logs/${var.s3_bucket_names[count.index]}/"
}

########################
# CloudTrail - Requirement 3: Enable CloudTrail logging in all regions
########################

resource "aws_s3_bucket" "cloudtrail" {
  bucket        = "${var.cloudtrail_bucket_name}-${random_string.bucket_suffix.result}"
  force_destroy = var.s3_force_destroy

  tags = merge(local.common_tags, {
    Name = "CloudTrail Logs"
  })
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.cloudtrail.arn,
          "${aws_s3_bucket.cloudtrail.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# Requirement 3: Enable CloudTrail logging in all AWS regions
resource "aws_cloudtrail" "main" {
  name                          = "${var.project_name}-cloudtrail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.bucket
  s3_key_prefix                 = "cloudtrail-logs"
  include_global_service_events = var.cloudtrail_include_global_service_events
  is_multi_region_trail         = var.cloudtrail_is_multi_region_trail
  enable_logging                = true

  event_selector {
    read_write_type                  = "All"
    include_management_events        = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.cloudtrail.arn}/*"]
    }
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-cloudtrail"
  })

  depends_on = [aws_s3_bucket_policy.cloudtrail]
}

########################
# IAM Roles and Policies - Requirement 1: Least Privilege & Requirement 10: MFA
########################

# Flow log IAM role
resource "aws_iam_role" "flow_log" {
  name = "${var.project_name}-vpc-flow-log-role"

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

  tags = local.common_tags
}

resource "aws_iam_role_policy" "flow_log" {
  name = "${var.project_name}-vpc-flow-log-policy"
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
        Resource = "${aws_cloudwatch_log_group.vpc_flow_log.arn}:*"
      }
    ]
  })
}

# AWS Config IAM role
resource "aws_iam_role" "config" {
  name = "${var.project_name}-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

resource "aws_iam_role_policy" "config_s3" {
  count = var.use_existing_config_resources ? 0 : 1
  name  = "${var.project_name}-config-s3-policy"
  role  = aws_iam_role.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.config[0].arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.config[0].arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# Requirement 10: IAM password policy with MFA requirement
resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = var.password_policy_minimum_length
  require_lowercase_characters   = true
  require_numbers                = true
  require_uppercase_characters   = true
  require_symbols                = true
  allow_users_to_change_password = true
  max_password_age               = var.password_policy_max_age
  password_reuse_prevention      = 5
}

# Example IAM user with MFA requirement
resource "aws_iam_user" "example" {
  name = "${var.project_name}-example-user"
  path = "/"

  tags = local.common_tags
}

resource "aws_iam_user_policy" "mfa_required" {
  name = "MFARequired"
  user = aws_iam_user.example.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowViewAccountInfo"
        Effect = "Allow"
        Action = [
          "iam:GetAccountPasswordPolicy",
          "iam:GetAccountSummary",
          "iam:ListVirtualMFADevices"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowManageOwnPasswords"
        Effect = "Allow"
        Action = [
          "iam:ChangePassword",
          "iam:GetUser"
        ]
        Resource = "arn:aws:iam::*:user/$${aws:username}"
      },
      {
        Sid    = "AllowManageOwnMFA"
        Effect = "Allow"
        Action = [
          "iam:CreateVirtualMFADevice",
          "iam:DeleteVirtualMFADevice",
          "iam:ListMFADevices",
          "iam:EnableMFADevice",
          "iam:ResyncMFADevice"
        ]
        Resource = [
          "arn:aws:iam::*:mfa/$${aws:username}",
          "arn:aws:iam::*:user/$${aws:username}"
        ]
      },
      {
        Sid    = "DenyAllExceptUnlessSignedInWithMFA"
        Effect = "Deny"
        NotAction = [
          "iam:CreateVirtualMFADevice",
          "iam:EnableMFADevice",
          "iam:GetUser",
          "iam:ListMFADevices",
          "iam:ListVirtualMFADevices",
          "iam:ResyncMFADevice",
          "sts:GetSessionToken"
        ]
        Resource = "*"
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
          NumericLessThan = {
            "aws:MultiFactorAuthAge" = var.mfa_age
          }
        }
      }
    ]
  })
}

# Session Manager IAM role for EC2 instances
resource "aws_iam_role" "session_manager" {
  name = "${var.project_name}-session-manager-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# Attach AWS managed policy for Session Manager
resource "aws_iam_role_policy_attachment" "session_manager" {
  role       = aws_iam_role.session_manager.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Custom policy for enhanced Session Manager capabilities
resource "aws_iam_role_policy" "session_manager_enhanced" {
  name = "${var.project_name}-session-manager-enhanced-policy"
  role = aws_iam_role.session_manager.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameters",
          "ssm:GetParameter",
          "ssm:GetParametersByPath",
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/*",
          "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:${var.project_name}/*",
          "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/ssm/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = "arn:aws:kms:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:key/*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = [
              "secretsmanager.${data.aws_region.current.name}.amazonaws.com",
              "ssm.${data.aws_region.current.name}.amazonaws.com"
            ]
          }
        }
      }
    ]
  })
}

# Instance profile for EC2 instances
resource "aws_iam_instance_profile" "session_manager" {
  name = "${var.project_name}-session-manager-profile"
  role = aws_iam_role.session_manager.name

  tags = local.common_tags
}

# IAM policy for users to access Session Manager
resource "aws_iam_policy" "session_manager_user_access" {
  name        = "${var.project_name}-session-manager-user-access"
  description = "Allow users to start Session Manager sessions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:StartSession"
        ]
        Resource = [
          "arn:aws:ec2:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:instance/*"
        ]
        Condition = {
          StringLike = {
            "ssm:resourceTag/Project" = var.project_name
          }
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "true"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:DescribeInstanceInformation",
          "ssm:DescribeSessions",
          "ssm:GetConnectionStatus"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:TerminateSession"
        ]
        Resource = "arn:aws:ssm:*:*:session/$${aws:username}-*"
      }
    ]
  })

  tags = local.common_tags
}

# Attach the Session Manager policy to the example user
resource "aws_iam_user_policy_attachment" "session_manager_user_access" {
  user       = aws_iam_user.example.name
  policy_arn = aws_iam_policy.session_manager_user_access.arn
}

########################
# RDS - Requirement 6: Enable encryption with AWS managed keys
########################

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-db-subnet-group"
  })
}

resource "aws_db_parameter_group" "main" {
  name   = "${var.project_name}-db-params"
  family = "mysql8.0"

  parameter {
    name  = "slow_query_log"
    value = "1"
  }

  tags = local.common_tags
}

# Generate random password for RDS (will be stored in Secrets Manager)
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# Requirement 6: Enable encryption for RDS instances using AWS managed keys
resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-database"

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_allocated_storage * 2
  storage_type          = "gp2"
  storage_encrypted     = true # AWS managed encryption

  engine         = "mysql"
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  db_name  = "appdb"
  username = "admin"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name

  backup_retention_period = var.db_backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  # Requirement 7: No public access
  publicly_accessible = false

  deletion_protection       = var.enable_deletion_protection
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.project_name}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  copy_tags_to_snapshot = true
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-database"
  })
}

########################
# AWS Config - Requirement 8: Monitor resource compliance
########################

# Note: AWS doesn't provide data sources for Config resources
# We handle existing resources by making creation conditional

resource "aws_s3_bucket" "config" {
  count         = var.use_existing_config_resources ? 0 : 1
  bucket        = "${var.project_name}-config-${random_string.bucket_suffix.result}"
  force_destroy = var.s3_force_destroy

  tags = merge(local.common_tags, {
    Name = "AWS Config"
  })
}

resource "aws_s3_bucket_public_access_block" "config" {
  count  = var.use_existing_config_resources ? 0 : 1
  bucket = aws_s3_bucket.config[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "config" {
  count  = var.use_existing_config_resources ? 0 : 1
  bucket = aws_s3_bucket.config[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config" {
  count  = var.use_existing_config_resources ? 0 : 1
  bucket = aws_s3_bucket.config[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_policy" "config" {
  count  = var.use_existing_config_resources ? 0 : 1
  bucket = aws_s3_bucket.config[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config[0].arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config[0].arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config[0].arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"      = "bucket-owner-full-control"
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.config[0].arn,
          "${aws_s3_bucket.config[0].arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# Requirement 8: Monitor resource compliance with AWS Config
# Only create new AWS Config resources if not using existing ones
resource "aws_config_delivery_channel" "main" {
  count          = var.use_existing_config_resources ? 0 : 1
  name           = "${var.project_name}-config-delivery-channel"
  s3_bucket_name = aws_s3_bucket.config[0].bucket

  snapshot_delivery_properties {
    delivery_frequency = var.config_delivery_frequency
  }
}

resource "aws_config_configuration_recorder" "main" {
  count    = var.use_existing_config_resources ? 0 : 1
  name     = "${var.project_name}-config-recorder"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported = true
  }
}

resource "aws_config_configuration_recorder_status" "main" {
  count      = var.use_existing_config_resources ? 0 : 1
  name       = aws_config_configuration_recorder.main[0].name
  is_enabled = true
  depends_on = [aws_config_delivery_channel.main]
}

# Local values to reference Config resources (existing or newly created)
locals {
  config_delivery_channel_name = var.use_existing_config_resources ? "default" : (
    length(aws_config_delivery_channel.main) > 0 ? aws_config_delivery_channel.main[0].name : ""
  )
  
  config_configuration_recorder_name = var.use_existing_config_resources ? "default" : (
    length(aws_config_configuration_recorder.main) > 0 ? aws_config_configuration_recorder.main[0].name : ""
  )
}

# Config rules for compliance monitoring
# These rules can be created regardless of whether we use existing Config resources
resource "aws_config_config_rule" "s3_bucket_public_access_prohibited" {
  count = var.enable_config_rules ? 1 : 0
  name  = "${var.project_name}-s3-bucket-public-access-prohibited"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_LEVEL_PUBLIC_ACCESS_PROHIBITED"
  }

  # Config rules require a configuration recorder to exist
  # We can't use conditional depends_on, so we'll rely on the Config service validation
}

resource "aws_config_config_rule" "encrypted_volumes" {
  count = var.enable_config_rules ? 1 : 0
  name  = "${var.project_name}-encrypted-volumes"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  # Config rules require a configuration recorder to exist
  # We can't use conditional depends_on, so we'll rely on the Config service validation
}

resource "aws_config_config_rule" "rds_storage_encrypted" {
  count = var.enable_config_rules ? 1 : 0
  name  = "${var.project_name}-rds-storage-encrypted"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  # Config rules require a configuration recorder to exist
  # We can't use conditional depends_on, so we'll rely on the Config service validation
}

########################
# CloudWatch Alarms - Requirement 13: Set up alarms for critical resources
########################

resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.project_name}-high-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.cpu_alarm_threshold
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "database_connections" {
  alarm_name          = "${var.project_name}-database-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "50"
  alarm_description   = "This metric monitors RDS connection count"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = local.common_tags
}

resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts"

  tags = local.common_tags
}

########################
# Systems Manager Parameter Store - Requirement 12: Manage sensitive data
########################

# AWS Secrets Manager - Enhanced secure storage with rotation capabilities
########################

# Master database credentials secret
resource "aws_secretsmanager_secret" "db_master_credentials" {
  name                    = "${var.project_name}-database-master-credentials"
  description             = "Master database credentials for ${var.project_name}"
  recovery_window_in_days = 7

  tags = local.common_tags
}

# Database credentials secret version
resource "aws_secretsmanager_secret_version" "db_master_credentials" {
  secret_id = aws_secretsmanager_secret.db_master_credentials.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.db_password.result
    engine   = "mysql"
    host     = aws_db_instance.main.endpoint
    port     = 3306
    dbname   = "appdb"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# Application database credentials secret (with automatic rotation)
resource "aws_secretsmanager_secret" "db_app_credentials" {
  name                    = "${var.project_name}-database-app-credentials"
  description             = "Application database credentials for ${var.project_name} with rotation"
  recovery_window_in_days = 7

  tags = local.common_tags
}

# Application credentials secret version
resource "aws_secretsmanager_secret_version" "db_app_credentials" {
  secret_id = aws_secretsmanager_secret.db_app_credentials.id
  secret_string = jsonencode({
    username = "appuser"
    password = random_password.db_password.result
    engine   = "mysql"
    host     = aws_db_instance.main.endpoint
    port     = 3306
    dbname   = "appdb"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# API keys secret for cross-service communication
resource "aws_secretsmanager_secret" "api_keys" {
  name                    = "${var.project_name}-api-keys"
  description             = "API keys for cross-service communication"
  recovery_window_in_days = 7

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "api_keys" {
  secret_id = aws_secretsmanager_secret.api_keys.id
  secret_string = jsonencode({
    external_api_key = "placeholder-key-will-be-rotated"
    internal_api_key = "placeholder-internal-key"
    jwt_secret       = "placeholder-jwt-secret"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# Legacy Parameter Store entries (for backward compatibility)
########################

# Store database password securely (legacy - prefer Secrets Manager)
resource "aws_ssm_parameter" "db_password_legacy" {
  name        = "/${var.project_name}/database/password-legacy"
  description = "Database password for ${var.project_name} (LEGACY - use Secrets Manager)"
  type        = "SecureString"
  value       = "use-secrets-manager-instead"

  tags = merge(local.common_tags, {
    Status      = "deprecated"
    Replacement = "secrets-manager"
  })
}

# Store database connection string
resource "aws_ssm_parameter" "db_endpoint" {
  name        = "/${var.project_name}/database/endpoint"
  description = "Database endpoint for ${var.project_name}"
  type        = "String"
  value       = aws_db_instance.main.endpoint

  tags = local.common_tags
}

# Store VPC ID for reference
resource "aws_ssm_parameter" "vpc_id" {
  name        = "/${var.project_name}/vpc/id"
  description = "VPC ID for ${var.project_name}"
  type        = "String"
  value       = aws_vpc.main.id

  tags = local.common_tags
}

########################
# Lambda Function for Custom Secret Rotation
########################

# IAM role for Lambda function
resource "aws_iam_role" "secrets_rotation_lambda" {
  name = "${var.project_name}-secrets-rotation-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# Lambda execution policy
resource "aws_iam_role_policy_attachment" "secrets_rotation_lambda_basic" {
  role       = aws_iam_role.secrets_rotation_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Custom policy for Secrets Manager rotation
resource "aws_iam_role_policy" "secrets_rotation_lambda_custom" {
  name = "${var.project_name}-secrets-rotation-lambda-policy"
  role = aws_iam_role.secrets_rotation_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue",
          "secretsmanager:UpdateSecretVersionStage"
        ]
        Resource = [
          aws_secretsmanager_secret.db_app_credentials.arn,
          aws_secretsmanager_secret.api_keys.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "rds:ModifyDBInstance",
          "rds:DescribeDBInstances"
        ]
        Resource = aws_db_instance.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project_name}-*"
      }
    ]
  })
}

# Lambda function for secret rotation
resource "aws_lambda_function" "secrets_rotation" {
  filename      = "secrets_rotation.zip"
  function_name = "${var.project_name}-secrets-rotation"
  role          = aws_iam_role.secrets_rotation_lambda.arn
  handler       = "index.handler"
  runtime       = "python3.9"
  timeout       = 60

  # Create a simple Python script for rotation
  depends_on = [data.archive_file.secrets_rotation_zip]

  environment {
    variables = {
      PROJECT_NAME = var.project_name
    }
  }

  tags = local.common_tags
}

# Create the Lambda deployment package
data "archive_file" "secrets_rotation_zip" {
  type        = "zip"
  output_path = "secrets_rotation.zip"
  source {
    content  = <<EOF
import json
import boto3
import logging
import random
import string
import os

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    """
    Lambda function to handle custom secret rotation for API keys and credentials.
    """
    try:
        secrets_manager = boto3.client('secretsmanager')
        
        # Get secret details from event
        secret_arn = event.get('Step1', {}).get('SecretId', '')
        token = event.get('Step1', {}).get('ClientRequestToken', '')
        step = event.get('Step1', {}).get('Step', 'createSecret')
        
        logger.info(f"Starting rotation step: {step} for secret: {secret_arn}")
        
        if step == 'createSecret':
            create_secret(secrets_manager, secret_arn, token)
        elif step == 'setSecret':
            set_secret(secrets_manager, secret_arn, token)
        elif step == 'testSecret':
            test_secret(secrets_manager, secret_arn, token)
        elif step == 'finishSecret':
            finish_secret(secrets_manager, secret_arn, token)
        
        return {'statusCode': 200, 'body': json.dumps('Success')}
        
    except Exception as e:
        logger.error(f"Error during rotation: {str(e)}")
        return {'statusCode': 500, 'body': json.dumps(f'Error: {str(e)}')}

def create_secret(secrets_manager, secret_arn, token):
    """Create a new version of the secret with new credentials."""
    try:
        current_secret = secrets_manager.get_secret_value(SecretArn=secret_arn, VersionStage='AWSCURRENT')
        current_data = json.loads(current_secret['SecretString'])
        
        # Generate new credentials
        new_data = current_data.copy()
        if 'external_api_key' in new_data:
            new_data['external_api_key'] = generate_api_key()
        if 'internal_api_key' in new_data:
            new_data['internal_api_key'] = generate_api_key()
        if 'jwt_secret' in new_data:
            new_data['jwt_secret'] = generate_jwt_secret()
            
        secrets_manager.put_secret_value(
            SecretArn=secret_arn,
            ClientRequestToken=token,
            SecretString=json.dumps(new_data),
            VersionStage='AWSPENDING'
        )
        logger.info("Created new secret version")
        
    except Exception as e:
        logger.error(f"Error creating secret: {str(e)}")
        raise

def set_secret(secrets_manager, secret_arn, token):
    """Configure the service to use the new secret."""
    logger.info("Setting secret in service (placeholder implementation)")
    # Placeholder for actual service configuration
    pass

def test_secret(secrets_manager, secret_arn, token):
    """Test the new secret to ensure it works."""
    logger.info("Testing new secret (placeholder implementation)")
    # Placeholder for actual secret testing
    pass

def finish_secret(secrets_manager, secret_arn, token):
    """Finalize the rotation by updating version stages."""
    try:
        secrets_manager.update_secret_version_stage(
            SecretArn=secret_arn,
            VersionStage='AWSCURRENT',
            MoveToVersionId=token,
            RemoveFromVersionId=secrets_manager.describe_secret(SecretArn=secret_arn)['VersionIdsToStages']['AWSCURRENT'][0]
        )
        logger.info("Finished secret rotation")
        
    except Exception as e:
        logger.error(f"Error finishing secret: {str(e)}")
        raise

def generate_api_key(length=32):
    """Generate a secure API key."""
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

def generate_jwt_secret(length=64):
    """Generate a secure JWT secret."""
    characters = string.ascii_letters + string.digits + '!@#$%^&*'
    return ''.join(random.choice(characters) for _ in range(length))
EOF
    filename = "index.py"
  }
}

# CloudWatch log group for Lambda
resource "aws_cloudwatch_log_group" "secrets_rotation_lambda" {
  name              = "/aws/lambda/${var.project_name}-secrets-rotation"
  retention_in_days = var.cloudwatch_log_retention_days

  tags = local.common_tags
}

# Lambda permission for Secrets Manager to invoke the function
resource "aws_lambda_permission" "secrets_rotation" {
  statement_id  = "AllowExecutionFromSecretsManager"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.secrets_rotation.function_name
  principal     = "secretsmanager.amazonaws.com"
}

########################
# Secrets Manager Automatic Rotation Configuration
########################

# Configure automatic rotation for application credentials
resource "aws_secretsmanager_secret_rotation" "db_app_credentials" {
  secret_id           = aws_secretsmanager_secret.db_app_credentials.id
  rotation_lambda_arn = aws_lambda_function.secrets_rotation.arn

  rotation_rules {
    automatically_after_days = var.secrets_rotation_days
  }

  depends_on = [aws_lambda_permission.secrets_rotation]
}

# Configure automatic rotation for API keys
resource "aws_secretsmanager_secret_rotation" "api_keys" {
  secret_id           = aws_secretsmanager_secret.api_keys.id
  rotation_lambda_arn = aws_lambda_function.secrets_rotation.arn

  rotation_rules {
    automatically_after_days = var.secrets_rotation_days
  }

  depends_on = [aws_lambda_permission.secrets_rotation]
}

# VPC endpoint for Secrets Manager (for Lambda in private subnet access)
resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
          "secretsmanager:PutSecretValue",
          "secretsmanager:UpdateSecretVersionStage"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:PrincipalVpc" = aws_vpc.main.id
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-secretsmanager-vpc-endpoint"
  })
}

########################
# CloudFront Distribution - Requirement 14: AWS Shield DDoS protection
########################

resource "aws_s3_bucket" "cloudfront_logs" {
  bucket        = "${var.project_name}-cloudfront-logs-${random_string.bucket_suffix.result}"
  force_destroy = var.s3_force_destroy

  tags = merge(local.common_tags, {
    Name = "CloudFront Access Logs"
  })
}

resource "aws_s3_bucket_public_access_block" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Enable ACLs for CloudFront logs bucket
resource "aws_s3_bucket_ownership_controls" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id
  acl    = "private"

  depends_on = [aws_s3_bucket_ownership_controls.cloudfront_logs]
}

data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

# Requirement 14: Implement AWS Shield for DDoS protection on CloudFront distributions
resource "aws_cloudfront_distribution" "main" {
  origin {
    domain_name = aws_s3_bucket.main[0].bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.main[0].id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  # AWS Shield Standard is enabled by default for CloudFront distributions
  # AWS Shield Advanced would require additional configuration and subscription

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.cloudfront_logs.bucket_domain_name
    prefix          = "cloudfront-logs"
  }

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.main[0].id}"
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_optimized.id
    compress               = true
    viewer_protocol_policy = "redirect-to-https" # Requirement 11: Force HTTPS
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  web_acl_id = aws_wafv2_web_acl.main.arn

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-cloudfront"
  })
}

resource "aws_cloudfront_origin_access_identity" "main" {
  comment = "Origin Access Identity for ${var.project_name}"
}

# Update S3 bucket policy to allow CloudFront access
resource "aws_s3_bucket_policy" "cloudfront_access" {
  bucket = aws_s3_bucket.main[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.main.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.main[0].arn}/*"
      },
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.main[0].arn,
          "${aws_s3_bucket.main[0].arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.main]
}

########################
# WAF for additional DDoS protection
########################

resource "aws_wafv2_web_acl" "main" {
  name  = "${var.project_name}-web-acl"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
    priority = 1

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

  rule {
    name     = "AWS-AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2

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

  rule {
    name     = "AWS-AWSManagedRulesAmazonIpReputationList"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "IpReputationListMetric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}WebAcl"
    sampled_requests_enabled   = true
  }

  tags = local.common_tags
}
