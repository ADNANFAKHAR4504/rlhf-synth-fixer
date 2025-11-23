### Reasoning Trace
---

This is a comprehensive request for implementing a zero-trust security architecture for payment processing. I need to create:

1. **lib/provider.tf** - Provider configuration, variables, and default tags
2. **lib/main.tf** - All infrastructure resources
3. **lib/lambda_function.py** - Lambda compliance checker code

Let me break down the requirements:

### Key Components:
1. **KMS Keys**: 3 keys (app data, S3 storage, CloudWatch/VPC Flow Logs)
2. **S3 Buckets**: 3 buckets (app logs, VPC flow logs, compliance reports)
3. **VPC**: 1 VPC with 9 subnets across 3 tiers and 3 AZs
4. **Security Groups**: 3 security groups (app, database, management)
5. **NACLs**: Custom NACLs for each tier
6. **IAM Roles**: Lambda role and VPC Flow Logs role
7. **CloudWatch**: Log groups, metric filters, and alarms
8. **Lambda**: Compliance checker function
9. **EventBridge**: 2 rules (daily scan and security group changes)
10. **SNS**: Topic for notifications
11. **Secrets Manager**: Database credentials
12. **GuardDuty**: Threat detection

### Important Notes:
- Use deterministic naming: `{resource-type}-{purpose}-{environment}`
- S3 buckets need account ID for uniqueness
- Set cleanup flags (force_destroy, deletion windows)
- No email subscriptions for SNS
- No random_string in naming
- Use data sources only for account ID, region, AZs, and Lambda packaging
- All resources created fresh

Let me create the three files:
### Answer 
---

I'll create a comprehensive zero-trust security architecture for your payment processing application with all the specified security controls and compliance requirements. This implementation follows security best practices while maintaining PCI DSS compliance.

## lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.5"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  region = "us-east-1"
  
  default_tags {
    tags = {
      Environment        = var.environment
      DataClassification = "FinancialData"
      Compliance        = "PCI-DSS"
      Owner             = "SecurityTeam"
      ManagedBy         = "Terraform"
    }
  }
}

variable "environment" {
  description = "Environment name for resource naming"
  type        = string
  default     = "dev"
}
```

## lib/main.tf

```hcl
# Data Sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}

# Lambda Function Archive
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda_function.py"
  output_path = "${path.module}/lambda_function.zip"
}

# Random Password for Database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# ==================== KMS KEYS ====================

# Application Data Encryption Key
resource "aws_kms_key" "app_encryption" {
  description             = "KMS key for application data encryption"
  enable_key_rotation     = true
  deletion_window_in_days = 7
}

resource "aws_kms_alias" "app_encryption" {
  name          = "alias/app-encryption-${var.environment}"
  target_key_id = aws_kms_key.app_encryption.key_id
}

resource "aws_kms_key_policy" "app_encryption" {
  key_id = aws_kms_key.app_encryption.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = [
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
          ]
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow services to use the key"
        Effect = "Allow"
        Principal = {
          Service = ["s3.amazonaws.com", "logs.amazonaws.com"]
        }
        Action = [
          "kms:GenerateDataKey",
          "kms:Decrypt"
        ]
        Resource = "*"
      }
    ]
  })
}

# S3 Storage Encryption Key
resource "aws_kms_key" "s3_encryption" {
  description             = "KMS key for S3 bucket encryption"
  enable_key_rotation     = true
  deletion_window_in_days = 7
}

resource "aws_kms_alias" "s3_encryption" {
  name          = "alias/s3-encryption-${var.environment}"
  target_key_id = aws_kms_key.s3_encryption.key_id
}

resource "aws_kms_key_policy" "s3_encryption" {
  key_id = aws_kms_key.s3_encryption.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = [
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
          ]
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow S3 to use the key"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey",
          "kms:Decrypt"
        ]
        Resource = "*"
      }
    ]
  })
}

# CloudWatch/VPC Flow Logs Encryption Key
resource "aws_kms_key" "logs_encryption" {
  description             = "KMS key for CloudWatch and VPC Flow Logs encryption"
  enable_key_rotation     = true
  deletion_window_in_days = 7
}

resource "aws_kms_alias" "logs_encryption" {
  name          = "alias/logs-encryption-${var.environment}"
  target_key_id = aws_kms_key.logs_encryption.key_id
}

resource "aws_kms_key_policy" "logs_encryption" {
  key_id = aws_kms_key.logs_encryption.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = [
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
          ]
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs to use the key"
        Effect = "Allow"
        Principal = {
          Service = "logs.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
          }
        }
      },
      {
        Sid    = "Allow VPC Flow Logs to use the key"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
}

# ==================== S3 BUCKETS ====================

# Application Logs Bucket
resource "aws_s3_bucket" "app_logs" {
  bucket        = "s3-app-logs-${var.environment}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
}

resource "aws_s3_bucket_versioning" "app_logs" {
  bucket = aws_s3_bucket.app_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_logs" {
  bucket = aws_s3_bucket.app_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_encryption.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "app_logs" {
  bucket = aws_s3_bucket.app_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "app_logs" {
  bucket = aws_s3_bucket.app_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowRootAndDeploymentUser"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "s3:*"
        Resource = [
          aws_s3_bucket.app_logs.arn,
          "${aws_s3_bucket.app_logs.arn}/*"
        ]
      },
      {
        Sid    = "DenyUnencryptedObjectUploads"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:PutObject"
        Resource = "${aws_s3_bucket.app_logs.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      }
    ]
  })
}

# VPC Flow Logs Bucket
resource "aws_s3_bucket" "flow_logs" {
  bucket        = "s3-flow-logs-${var.environment}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
}

resource "aws_s3_bucket_versioning" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_encryption.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id

  rule {
    id     = "transition-and-expire"
    status = "Enabled"

    filter {}

    transition {
      days          = 7
      storage_class = "GLACIER"
    }

    expiration {
      days = 30
    }
  }
}

resource "aws_s3_bucket_policy" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowRootAndDeploymentUser"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "s3:*"
        Resource = [
          aws_s3_bucket.flow_logs.arn,
          "${aws_s3_bucket.flow_logs.arn}/*"
        ]
      },
      {
        Sid    = "AllowVPCFlowLogs"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action = [
          "s3:PutObject",
          "s3:GetBucketAcl",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.flow_logs.arn,
          "${aws_s3_bucket.flow_logs.arn}/*"
        ]
      },
      {
        Sid    = "DenyUnencryptedObjectUploads"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:PutObject"
        Resource = "${aws_s3_bucket.flow_logs.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      }
    ]
  })
}

# Compliance Reports Bucket
resource "aws_s3_bucket" "compliance_reports" {
  bucket        = "s3-compliance-reports-${var.environment}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
}

resource "aws_s3_bucket_versioning" "compliance_reports" {
  bucket = aws_s3_bucket.compliance_reports.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "compliance_reports" {
  bucket = aws_s3_bucket.compliance_reports.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_encryption.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "compliance_reports" {
  bucket = aws_s3_bucket.compliance_reports.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "compliance_reports" {
  bucket = aws_s3_bucket.compliance_reports.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowRootAndDeploymentUser"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "s3:*"
        Resource = [
          aws_s3_bucket.compliance_reports.arn,
          "${aws_s3_bucket.compliance_reports.arn}/*"
        ]
      },
      {
        Sid    = "DenyUnencryptedObjectUploads"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:PutObject"
        Resource = "${aws_s3_bucket.compliance_reports.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      }
    ]
  })
}

# ==================== VPC NETWORKING ====================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-main-${var.environment}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "igw-main-${var.environment}"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "eip-nat-${var.environment}"
  }
}

# NAT Gateway
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.app[0].id

  tags = {
    Name = "nat-main-${var.environment}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Application Tier Subnets
resource "aws_subnet" "app" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "subnet-app-${count.index + 1}-${var.environment}"
    Tier = "Application"
  }
}

# Database Tier Subnets
resource "aws_subnet" "db" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 11}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "subnet-db-${count.index + 1}-${var.environment}"
    Tier = "Database"
  }
}

# Management Tier Subnets
resource "aws_subnet" "mgmt" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 21}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "subnet-mgmt-${count.index + 1}-${var.environment}"
    Tier = "Management"
  }
}

# Route Tables
resource "aws_route_table" "app" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "rt-app-${var.environment}"
  }
}

resource "aws_route_table" "db" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "rt-db-${var.environment}"
  }
}

resource "aws_route_table" "mgmt" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "rt-mgmt-${var.environment}"
  }
}

# Route Table Associations
resource "aws_route_table_association" "app" {
  count          = length(aws_subnet.app)
  subnet_id      = aws_subnet.app[count.index].id
  route_table_id = aws_route_table.app.id
}

resource "aws_route_table_association" "db" {
  count          = length(aws_subnet.db)
  subnet_id      = aws_subnet.db[count.index].id
  route_table_id = aws_route_table.db.id
}

resource "aws_route_table_association" "mgmt" {
  count          = length(aws_subnet.mgmt)
  subnet_id      = aws_subnet.mgmt[count.index].id
  route_table_id = aws_route_table.mgmt.id
}

# VPC Flow Logs IAM Role
resource "aws_iam_role" "flow_logs" {
  name               = "role-vpc-flow-logs-${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "vpc-flow-logs.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_policy" "flow_logs" {
  name        = "policy-vpc-flow-logs-${var.environment}"
  description = "Policy for VPC Flow Logs to write to S3"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetBucketAcl",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.flow_logs.arn,
          "${aws_s3_bucket.flow_logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.s3_encryption.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "flow_logs" {
  role       = aws_iam_role.flow_logs.name
  policy_arn = aws_iam_policy.flow_logs.arn
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  log_destination_type = "s3"
  log_destination_arn  = aws_s3_bucket.flow_logs.arn
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id
  iam_role_arn        = aws_iam_role.flow_logs.arn

  tags = {
    Name = "flow-log-vpc-${var.environment}"
  }

  depends_on = [
    aws_iam_role.flow_logs,
    aws_iam_role_policy_attachment.flow_logs
  ]
}

# ==================== SECURITY GROUPS ====================

# Application Security Group
resource "aws_security_group" "app" {
  name_prefix = "sg-app-${var.environment}-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for application tier"

  tags = {
    Name = "sg-app-${var.environment}"
  }
}

resource "aws_security_group_rule" "app_ingress_https" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["10.0.0.0/8"]
  security_group_id = aws_security_group.app.id
  description       = "Allow HTTPS from internal network"
}

resource "aws_security_group_rule" "app_ingress_ssh" {
  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = [for s in aws_subnet.mgmt : s.cidr_block]
  security_group_id = aws_security_group.app.id
  description       = "Allow SSH from management subnets"
}

resource "aws_security_group_rule" "app_egress_all" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.app.id
  description       = "Allow all outbound traffic"
}

# Database Security Group
resource "aws_security_group" "db" {
  name_prefix = "sg-db-${var.environment}-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for database tier"

  tags = {
    Name = "sg-db-${var.environment}"
  }
}

resource "aws_security_group_rule" "db_ingress_postgres" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.app.id
  security_group_id        = aws_security_group.db.id
  description              = "Allow PostgreSQL from application security group"
}

resource "aws_security_group_rule" "db_egress_all" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.db.id
  description       = "Allow all outbound traffic"
}

# Management Security Group
resource "aws_security_group" "mgmt" {
  name_prefix = "sg-mgmt-${var.environment}-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for management tier"

  tags = {
    Name = "sg-mgmt-${var.environment}"
  }
}

resource "aws_security_group_rule" "mgmt_ingress_ssh" {
  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = ["10.0.0.0/16"]  # Restricted to VPC CIDR
  security_group_id = aws_security_group.mgmt.id
  description       = "Allow SSH from restricted CIDR"
}

resource "aws_security_group_rule" "mgmt_egress_all" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.mgmt.id
  description       = "Allow all outbound traffic"
}

# ==================== NETWORK ACLs ====================

# Application Tier NACL
resource "aws_network_acl" "app" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "nacl-app-${var.environment}"
  }
}

resource "aws_network_acl_rule" "app_deny_test_net_1_ingress" {
  network_acl_id = aws_network_acl.app.id
  rule_number    = 10
  egress         = false
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "192.0.2.0/24"
}

resource "aws_network_acl_rule" "app_deny_test_net_2_ingress" {
  network_acl_id = aws_network_acl.app.id
  rule_number    = 20
  egress         = false
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "198.51.100.0/24"
}

resource "aws_network_acl_rule" "app_deny_test_net_3_ingress" {
  network_acl_id = aws_network_acl.app.id
  rule_number    = 30
  egress         = false
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "203.0.113.0/24"
}

resource "aws_network_acl_rule" "app_allow_https_ingress" {
  network_acl_id = aws_network_acl.app.id
  rule_number    = 100
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "10.0.0.0/8"
  from_port      = 443
  to_port        = 443
}

resource "aws_network_acl_rule" "app_allow_ssh_ingress" {
  network_acl_id = aws_network_acl.app.id
  rule_number    = 110
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "10.0.0.0/16"
  from_port      = 22
  to_port        = 22
}

resource "aws_network_acl_rule" "app_allow_ephemeral_ingress" {
  network_acl_id = aws_network_acl.app.id
  rule_number    = 120
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

resource "aws_network_acl_rule" "app_allow_all_egress" {
  network_acl_id = aws_network_acl.app.id
  rule_number    = 100
  egress         = true
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
}

resource "aws_network_acl_association" "app" {
  count          = length(aws_subnet.app)
  subnet_id      = aws_subnet.app[count.index].id
  network_acl_id = aws_network_acl.app.id
}

# Database Tier NACL
resource "aws_network_acl" "db" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "nacl-db-${var.environment}"
  }
}

resource "aws_network_acl_rule" "db_deny_test_net_1_ingress" {
  network_acl_id = aws_network_acl.db.id
  rule_number    = 10
  egress         = false
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "192.0.2.0/24"
}

resource "aws_network_acl_rule" "db_deny_test_net_2_ingress" {
  network_acl_id = aws_network_acl.db.id
  rule_number    = 20
  egress         = false
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "198.51.100.0/24"
}

resource "aws_network_acl_rule" "db_deny_test_net_3_ingress" {
  network_acl_id = aws_network_acl.db.id
  rule_number    = 30
  egress         = false
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "203.0.113.0/24"
}

resource "aws_network_acl_rule" "db_allow_postgres_ingress" {
  network_acl_id = aws_network_acl.db.id
  rule_number    = 100
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "10.0.0.0/16"
  from_port      = 5432
  to_port        = 5432
}

resource "aws_network_acl_rule" "db_allow_ephemeral_ingress" {
  network_acl_id = aws_network_acl.db.id
  rule_number    = 110
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

resource "aws_network_acl_rule" "db_allow_all_egress" {
  network_acl_id = aws_network_acl.db.id
  rule_number    = 100
  egress         = true
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
}

resource "aws_network_acl_association" "db" {
  count          = length(aws_subnet.db)
  subnet_id      = aws_subnet.db[count.index].id
  network_acl_id = aws_network_acl.db.id
}

# Management Tier NACL
resource "aws_network_acl" "mgmt" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "nacl-mgmt-${var.environment}"
  }
}

resource "aws_network_acl_rule" "mgmt_deny_test_net_1_ingress" {
  network_acl_id = aws_network_acl.mgmt.id
  rule_number    = 10
  egress         = false
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "192.0.2.0/24"
}

resource "aws_network_acl_rule" "mgmt_deny_test_net_2_ingress" {
  network_acl_id = aws_network_acl.mgmt.id
  rule_number    = 20
  egress         = false
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "198.51.100.0/24"
}

resource "aws_network_acl_rule" "mgmt_deny_test_net_3_ingress" {
  network_acl_id = aws_network_acl.mgmt.id
  rule_number    = 30
  egress         = false
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "203.0.113.0/24"
}

resource "aws_network_acl_rule" "mgmt_allow_ssh_ingress" {
  network_acl_id = aws_network_acl.mgmt.id
  rule_number    = 100
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "10.0.0.0/16"
  from_port      = 22
  to_port        = 22
}

resource "aws_network_acl_rule" "mgmt_allow_ephemeral_ingress" {
  network_acl_id = aws_network_acl.mgmt.id
  rule_number    = 110
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

resource "aws_network_acl_rule" "mgmt_allow_all_egress" {
  network_acl_id = aws_network_acl.mgmt.id
  rule_number    = 100
  egress         = true
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
}

resource "aws_network_acl_association" "mgmt" {
  count          = length(aws_subnet.mgmt)
  subnet_id      = aws_subnet.mgmt[count.index].id
  network_acl_id = aws_network_acl.mgmt.id
}

# ==================== IAM ROLES AND POLICIES ====================

# Lambda IAM Role
data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "lambda_compliance" {
  name                 = "role-lambda-compliance-${var.environment}"
  assume_role_policy   = data.aws_iam_policy_document.lambda_assume_role.json
  max_session_duration = 3600
}

data "aws_iam_policy_document" "lambda_compliance" {
  statement {
    effect = "Allow"
    actions = [
      "ec2:DescribeInstances",
      "ec2:DescribeVolumes",
      "ec2:DescribeSecurityGroups",
      "ec2:DescribeSecurityGroupRules",
      "ec2:DescribeVpcs",
      "ec2:DescribeFlowLogs"
    ]
    resources = ["*"]
  }
  
  statement {
    effect = "Allow"
    actions = [
      "s3:ListBucket",
      "s3:GetBucketEncryption",
      "s3:GetBucketPublicAccessBlock",
      "s3:GetBucketVersioning",
      "s3:ListAllMyBuckets"
    ]
    resources = ["*"]
  }
  
  statement {
    effect = "Allow"
    actions = [
      "s3:PutObject"
    ]
    resources = ["${aws_s3_bucket.compliance_reports.arn}/*"]
  }
  
  statement {
    effect = "Allow"
    actions = [
      "sns:Publish"
    ]
    resources = [aws_sns_topic.security_alerts.arn]
  }
  
  statement {
    effect = "Allow"
    actions = [
      "kms:Decrypt",
      "kms:GenerateDataKey"
    ]
    resources = [
      aws_kms_key.app_encryption.arn,
      aws_kms_key.s3_encryption.arn
    ]
  }
  
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups"
    ]
    resources = ["arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"]
  }
}

resource "aws_iam_policy" "lambda_compliance" {
  name        = "policy-lambda-compliance-${var.environment}"
  description = "Policy for Lambda compliance checker"
  policy      = data.aws_iam_policy_document.lambda_compliance.json
}

resource "aws_iam_role_policy_attachment" "lambda_compliance" {
  role       = aws_iam_role.lambda_compliance.name
  policy_arn = aws_iam_policy.lambda_compliance.arn
}

# ==================== CLOUDWATCH ====================

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/aws/application/${var.environment}"
  retention_in_days = 1
  kms_key_id        = aws_kms_key.logs_encryption.arn

  tags = {
    Name = "log-group-app-${var.environment}"
  }
}

resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/lambda-compliance-checker-${var.environment}"
  retention_in_days = 1
  kms_key_id        = aws_kms_key.logs_encryption.arn

  tags = {
    Name = "log-group-lambda-${var.environment}"
  }
}

resource "aws_cloudwatch_log_group" "flow_logs" {
  name              = "/aws/vpc/flowlogs/${var.environment}"
  retention_in_days = 1
  kms_key_id        = aws_kms_key.logs_encryption.arn

  tags = {
    Name = "log-group-flow-logs-${var.environment}"
  }
}

# Metric Filter for Authentication Failures
resource "aws_cloudwatch_log_metric_filter" "auth_failures" {
  name           = "metric-filter-auth-failures-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.app_logs.name
  pattern        = "[time, request_id, event_type = AUTH_FAILURE, ...]"

  metric_transformation {
    name      = "AuthenticationFailures"
    namespace = "Security/${var.environment}"
    value     = "1"
  }
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "auth_failures" {
  alarm_name          = "alarm-auth-failures-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "AuthenticationFailures"
  namespace           = "Security/${var.environment}"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "Triggers when authentication failures exceed 5 in 5 minutes"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "nat_packet_drops" {
  alarm_name          = "alarm-nat-packet-drops-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "PacketDropCount"
  namespace           = "AWS/NATGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "100"
  alarm_description   = "Triggers when NAT Gateway drops packets"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  dimensions = {
    NatGatewayId = aws_nat_gateway.main.id
  }
}

resource "aws_cloudwatch_metric_alarm" "flow_logs_rejects" {
  alarm_name          = "alarm-flow-logs-rejects-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "RejectedConnectionsCount"
  namespace           = "VPC/FlowLogs"
  period              = "300"
  statistic           = "Sum"
  threshold           = "50"
  alarm_description   = "Triggers when VPC Flow Logs show high reject rate"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "alarm-lambda-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "60"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Triggers when Lambda function encounters errors"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.compliance_checker.function_name
  }
}

# ==================== LAMBDA ====================

resource "aws_lambda_function" "compliance_checker" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "lambda-compliance-checker-${var.environment}"
  role            = aws_iam_role.lambda_compliance.arn
  handler         = "lambda_function.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.11"
  memory_size     = 256
  timeout         = 300

  environment {
    variables = {
      SNS_TOPIC_ARN            = aws_sns_topic.security_alerts.arn
      COMPLIANCE_REPORTS_BUCKET = aws_s3_bucket.compliance_reports.id
    }
  }

  tags = {
    Name = "lambda-compliance-checker-${var.environment}"
  }

  depends_on = [
    aws_iam_role.lambda_compliance,
    aws_iam_role_policy_attachment.lambda_compliance
  ]
}

# ==================== EVENTBRIDGE ====================

# Daily Compliance Scan Rule
resource "aws_cloudwatch_event_rule" "daily_compliance_scan" {
  name                = "rule-daily-compliance-scan-${var.environment}"
  description         = "Trigger compliance scan daily at 2 AM UTC"
  schedule_expression = "cron(0 2 * * ? *)"
}

resource "aws_cloudwatch_event_target" "daily_compliance_scan" {
  rule      = aws_cloudwatch_event_rule.daily_compliance_scan.name
  target_id = "ComplianceLambdaTarget"
  arn       = aws_lambda_function.compliance_checker.arn
}

resource "aws_lambda_permission" "allow_eventbridge_daily" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.compliance_checker.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_compliance_scan.arn
}

# Security Group Changes Rule
resource "aws_cloudwatch_event_rule" "security_group_changes" {
  name        = "rule-security-group-changes-${var.environment}"
  description = "Monitor security group changes"

  event_pattern = jsonencode({
    source      = ["aws.ec2"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["ec2.amazonaws.com"]
      eventName = [
        "AuthorizeSecurityGroupIngress",
        "AuthorizeSecurityGroupEgress",
        "RevokeSecurityGroupIngress",
        "RevokeSecurityGroupEgress"
      ]
    }
  })
}

resource "aws_cloudwatch_event_target" "security_group_changes" {
  rule      = aws_cloudwatch_event_rule.security_group_changes.name
  target_id = "SNSTarget"
  arn       = aws_sns_topic.security_alerts.arn
}

# ==================== SNS ====================

resource "aws_sns_topic" "security_alerts" {
  name              = "sns-security-alerts-${var.environment}"
  kms_master_key_id = aws_kms_key.app_encryption.id

  tags = {
    Name = "sns-security-alerts-${var.environment}"
  }
}

resource "aws_sns_topic_policy" "security_alerts" {
  arn = aws_sns_topic.security_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = [
            "events.amazonaws.com",
            "lambda.amazonaws.com"
          ]
        }
        Action = "SNS:Publish"
        Resource = aws_sns_topic.security_alerts.arn
      },
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = "SNS:*"
        Resource = aws_sns_topic.security_alerts.arn
      }
    ]
  })
}

# ==================== SECRETS MANAGER ====================

resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "secret-db-credentials-${var.environment}"
  description             = "Database credentials for payment processing application"
  kms_key_id              = aws_kms_key.app_encryption.id
  recovery_window_in_days = 0  # Immediate deletion for testing

  # Production would use automatic rotation
  # rotation_rules {
  #   automatically_after_days = 30
  # }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  
  secret_string = jsonencode({
    username = "dbadmin"
    password = random_password.db_password.result
  })
}

# ==================== GUARDDUTY ====================

resource "aws_guardduty_detector" "main" {
  enable                       = true
  finding_publishing_frequency = "FIFTEEN_MINUTES"

  datasources {
    s3_logs {
      enable = true
    }
  }

  tags = {
    Name = "guardduty-detector-${var.environment}"
  }
}

# ==================== OUTPUTS ====================

# KMS Key Outputs
output "kms_app_encryption_id" {
  value = aws_kms_key.app_encryption.id
}

output "kms_app_encryption_arn" {
  value = aws_kms_key.app_encryption.arn
}

output "kms_s3_encryption_id" {
  value = aws_kms_key.s3_encryption.id
}

output "kms_s3_encryption_arn" {
  value = aws_kms_key.s3_encryption.arn
}

output "kms_logs_encryption_id" {
  value = aws_kms_key.logs_encryption.id
}

output "kms_logs_encryption_arn" {
  value = aws_kms_key.logs_encryption.arn
}

# S3 Bucket Outputs
output "s3_app_logs_name" {
  value = aws_s3_bucket.app_logs.id
}

output "s3_app_logs_arn" {
  value = aws_s3_bucket.app_logs.arn
}

output "s3_app_logs_versioning" {
  value = aws_s3_bucket_versioning.app_logs.versioning_configuration[0].status
}

output "s3_flow_logs_name" {
  value = aws_s3_bucket.flow_logs.id
}

output "s3_flow_logs_arn" {
  value = aws_s3_bucket.flow_logs.arn
}

output "s3_flow_logs_versioning" {
  value = aws_s3_bucket_versioning.flow_logs.versioning_configuration[0].status
}

output "s3_compliance_reports_name" {
  value = aws_s3_bucket.compliance_reports.id
}

output "s3_compliance_reports_arn" {
  value = aws_s3_bucket.compliance_reports.arn
}

output "s3_compliance_reports_versioning" {
  value = aws_s3_bucket_versioning.compliance_reports.versioning_configuration[0].status
}

# VPC and Subnet Outputs
output "vpc_id" {
  value = aws_vpc.main.id
}

output "subnet_app_ids" {
  value = aws_subnet.app[*].id
}

output "subnet_db_ids" {
  value = aws_subnet.db[*].id
}

output "subnet_mgmt_ids" {
  value = aws_subnet.mgmt[*].id
}

output "nat_gateway_id" {
  value = aws_nat_gateway.main.id
}

output "internet_gateway_id" {
  value = aws_internet_gateway.main.id
}

output "route_table_app_id" {
  value = aws_route_table.app.id
}

output "route_table_db_id" {
  value = aws_route_table.db.id
}

output "route_table_mgmt_id" {
  value = aws_route_table.mgmt.id
}

output "flow_log_id" {
  value = aws_flow_log.main.id
}

# Security Group and NACL Outputs
output "security_group_app_id" {
  value = aws_security_group.app.id
}

output "security_group_db_id" {
  value = aws_security_group.db.id
}

output "security_group_mgmt_id" {
  value = aws_security_group.mgmt.id
}

output "nacl_app_id" {
  value = aws_network_acl.app.id
}

output "nacl_db_id" {
  value = aws_network_acl.db.id
}

output "nacl_mgmt_id" {
  value = aws_network_acl.mgmt.id
}

output "nacl_associations_count" {
  value = length(aws_network_acl_association.app) + length(aws_network_acl_association.db) + length(aws_network_acl_association.mgmt)
}

# IAM Outputs
output "iam_role_lambda_arn" {
  value = aws_iam_role.lambda_compliance.arn
}

output "iam_role_flow_logs_arn" {
  value = aws_iam_role.flow_logs.arn
}

output "iam_policy_lambda_arn" {
  value = aws_iam_policy.lambda_compliance.arn
}

output "iam_policy_flow_logs_arn" {
  value = aws_iam_policy.flow_logs.arn
}

# CloudWatch Outputs
output "log_group_app_name" {
  value = aws_cloudwatch_log_group.app_logs.name
}

output "log_group_lambda_name" {
  value = aws_cloudwatch_log_group.lambda_logs.name
}

output "log_group_flow_logs_name" {
  value = aws_cloudwatch_log_group.flow_logs.name
}

output "alarm_auth_failures_name" {
  value = aws_cloudwatch_metric_alarm.auth_failures.alarm_name
}

output "alarm_nat_packet_drops_name" {
  value = aws_cloudwatch_metric_alarm.nat_packet_drops.alarm_name
}

output "alarm_lambda_errors_name" {
  value = aws_cloudwatch_metric_alarm.lambda_errors.alarm_name
}

# Lambda Outputs
output "lambda_function_name" {
  value = aws_lambda_function.compliance_checker.function_name
}

output "lambda_function_arn" {
  value = aws_lambda_function.compliance_checker.arn
}

output "lambda_role_arn" {
  value = aws_lambda_function.compliance_checker.role
}

# EventBridge Outputs
output "eventbridge_daily_scan_arn" {
  value = aws_cloudwatch_event_rule.daily_compliance_scan.arn
}

output "eventbridge_sg_changes_arn" {
  value = aws_cloudwatch_event_rule.security_group_changes.arn
}

# SNS Output
output "sns_topic_arn" {
  value = aws_sns_topic.security_alerts.arn
}

# Secrets Manager Outputs
output "secrets_manager_secret_arn" {
  value     = aws_secretsmanager_secret.db_credentials.arn
  sensitive = true
}

output "secrets_manager_secret_name" {
  value     = aws_secretsmanager_secret.db_credentials.name
  sensitive = true
}

# GuardDuty Output
output "guardduty_detector_id" {
  value = aws_guardduty_detector.main.id
}

# Metadata Outputs
output "environment" {
  value = var.environment
}

output "region" {
  value = data.aws_region.current.name
}

output "account_id" {
  value = data.aws_caller_identity.current.account_id
}
```

## lib/lambda_function.py

```python
import json
import boto3
import os
from datetime import datetime
from typing import Dict, List, Any

# Initialize AWS clients
ec2 = boto3.client('ec2')
s3 = boto3.client('s3')
sns = boto3.client('sns')
logs = boto3.client('logs')

# Environment variables
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')
COMPLIANCE_REPORTS_BUCKET = os.environ.get('COMPLIANCE_REPORTS_BUCKET')

# Severity levels
SEVERITY_CRITICAL = 'CRITICAL'
SEVERITY_HIGH = 'HIGH'
SEVERITY_MEDIUM = 'MEDIUM'
SEVERITY_LOW = 'LOW'

def handler(event, context):
    """
    Main Lambda handler for compliance checking
    """
    print(f"Starting compliance check at {datetime.utcnow()}")
    
    findings = []
    
    # Check for unencrypted S3 buckets
    findings.extend(check_s3_encryption())
    
    # Check for unencrypted EBS volumes
    findings.extend(check_ebs_encryption())
    
    # Check for overly permissive security groups
    findings.extend(check_security_groups())
    
    # Check for missing VPC Flow Logs
    findings.extend(check_vpc_flow_logs())
    
    # Check CloudWatch log groups for KMS encryption
    findings.extend(check_cloudwatch_encryption())
    
    # Generate report
    report = generate_compliance_report(findings)
    
    # Publish to SNS
    if findings:
        publish_to_sns(report)
    
    # Store report in S3
    store_report_in_s3(report)
    
    print(f"Compliance check completed. Found {len(findings)} findings")
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Compliance check completed',
            'findings_count': len(findings),
            'critical_count': len([f for f in findings if f['severity'] == SEVERITY_CRITICAL]),
            'high_count': len([f for f in findings if f['severity'] == SEVERITY_HIGH])
        })
    }

def check_s3_encryption() -> List[Dict[str, Any]]:
    """Check for unencrypted S3 buckets"""
    findings = []
    
    try:
        response = s3.list_buckets()
        
        for bucket in response.get('Buckets', []):
            bucket_name = bucket['Name']
            
            try:
                # Check encryption configuration
                encryption = s3.get_bucket_encryption(Bucket=bucket_name)
                
                # Check if default encryption is enabled
                rules = encryption.get('ServerSideEncryptionConfiguration', {}).get('Rules', [])
                if not rules:
                    findings.append({
                        'type': 'S3_BUCKET_UNENCRYPTED',
                        'severity': SEVERITY_HIGH,
                        'resource': bucket_name,
                        'message': f'S3 bucket {bucket_name} does not have default encryption enabled',
                        'recommendation': 'Enable default server-side encryption for the bucket'
                    })
                    
            except s3.exceptions.ServerSideEncryptionConfigurationNotFoundError:
                findings.append({
                    'type': 'S3_BUCKET_UNENCRYPTED',
                    'severity': SEVERITY_HIGH,
                    'resource': bucket_name,
                    'message': f'S3 bucket {bucket_name} does not have encryption configured',
                    'recommendation': 'Configure server-side encryption for the bucket'
                })
            except Exception as e:
                print(f"Error checking bucket {bucket_name}: {str(e)}")
                
            # Check public access block
            try:
                public_access = s3.get_public_access_block(Bucket=bucket_name)
                config = public_access.get('PublicAccessBlockConfiguration', {})
                
                if not all([
                    config.get('BlockPublicAcls', False),
                    config.get('BlockPublicPolicy', False),
                    config.get('IgnorePublicAcls', False),
                    config.get('RestrictPublicBuckets', False)
                ]):
                    findings.append({
                        'type': 'S3_BUCKET_PUBLIC_ACCESS',
                        'severity': SEVERITY_CRITICAL,
                        'resource': bucket_name,
                        'message': f'S3 bucket {bucket_name} does not have all public access blocks enabled',
                        'recommendation': 'Enable all public access block settings'
                    })
            except s3.exceptions.NoSuchPublicAccessBlockConfiguration:
                findings.append({
                    'type': 'S3_BUCKET_PUBLIC_ACCESS',
                    'severity': SEVERITY_CRITICAL,
                    'resource': bucket_name,
                    'message': f'S3 bucket {bucket_name} has no public access block configuration',
                    'recommendation': 'Configure public access block settings'
                })
            except Exception as e:
                print(f"Error checking public access for bucket {bucket_name}: {str(e)}")
                
    except Exception as e:
        print(f"Error listing S3 buckets: {str(e)}")
        
    return findings

def check_ebs_encryption() -> List[Dict[str, Any]]:
    """Check for unencrypted EBS volumes"""
    findings = []
    
    try:
        response = ec2.describe_volumes()
        
        for volume in response.get('Volumes', []):
            volume_id = volume['VolumeId']
            
            if not volume.get('Encrypted', False):
                findings.append({
                    'type': 'EBS_VOLUME_UNENCRYPTED',
                    'severity': SEVERITY_HIGH,
                    'resource': volume_id,
                    'message': f'EBS volume {volume_id} is not encrypted',
                    'recommendation': 'Create an encrypted snapshot and restore to a new encrypted volume'
                })
                
    except Exception as e:
        print(f"Error checking EBS volumes: {str(e)}")
        
    return findings

def check_security_groups() -> List[Dict[str, Any]]:
    """Check for overly permissive security groups"""
    findings = []
    
    try:
        response = ec2.describe_security_groups()
        
        for sg in response.get('SecurityGroups', []):
            sg_id = sg['GroupId']
            sg_name = sg.get('GroupName', 'Unknown')
            
            # Check for overly permissive ingress rules
            for rule in sg.get('IpPermissions', []):
                # Check for 0.0.0.0/0 or ::/0
                for ip_range in rule.get('IpRanges', []):
                    if ip_range.get('CidrIp') == '0.0.0.0/0':
                        from_port = rule.get('FromPort', 'All')
                        to_port = rule.get('ToPort', 'All')
                        protocol = rule.get('IpProtocol', 'All')
                        
                        # Critical for sensitive ports
                        if from_port in [22, 3389, 3306, 5432, 1433, 27017, 6379]:
                            findings.append({
                                'type': 'SECURITY_GROUP_OVERLY_PERMISSIVE',
                                'severity': SEVERITY_CRITICAL,
                                'resource': f'{sg_id} ({sg_name})',
                                'message': f'Security group allows unrestricted access from 0.0.0.0/0 to port {from_port}',
                                'recommendation': 'Restrict access to specific IP addresses or CIDR blocks'
                            })
                        elif protocol == '-1':  # All traffic
                            findings.append({
                                'type': 'SECURITY_GROUP_OVERLY_PERMISSIVE',
                                'severity': SEVERITY_CRITICAL,
                                'resource': f'{sg_id} ({sg_name})',
                                'message': 'Security group allows all traffic from 0.0.0.0/0',
                                'recommendation': 'Restrict to specific ports and protocols'
                            })
                        else:
                            findings.append({
                                'type': 'SECURITY_GROUP_OVERLY_PERMISSIVE',
                                'severity': SEVERITY_MEDIUM,
                                'resource': f'{sg_id} ({sg_name})',
                                'message': f'Security group allows access from 0.0.0.0/0 to ports {from_port}-{to_port}',
                                'recommendation': 'Consider restricting access to specific IP ranges'
                            })
                            
    except Exception as e:
        print(f"Error checking security groups: {str(e)}")
        
    return findings

def check_vpc_flow_logs() -> List[Dict[str, Any]]:
    """Check for missing VPC Flow Logs"""
    findings = []
    
    try:
        # Get all VPCs
        vpcs_response = ec2.describe_vpcs()
        vpc_ids = [vpc['VpcId'] for vpc in vpcs_response.get('Vpcs', [])]
        
        # Get all flow logs
        flow_logs_response = ec2.describe_flow_logs()
        flow_log_vpc_ids = set()
        
        for flow_log in flow_logs_response.get('FlowLogs', []):
            resource_id = flow_log.get('ResourceId')
            if resource_id and resource_id.startswith('vpc-'):
                flow_log_vpc_ids.add(resource_id)
                
        # Check for VPCs without flow logs
        for vpc_id in vpc_ids:
            if vpc_id not in flow_log_vpc_ids:
                findings.append({
                    'type': 'VPC_MISSING_FLOW_LOGS',
                    'severity': SEVERITY_HIGH,
                    'resource': vpc_id,
                    'message': f'VPC {vpc_id} does not have Flow Logs enabled',
                    'recommendation': 'Enable VPC Flow Logs to capture network traffic metadata'
                })
                
    except Exception as e:
        print(f"Error checking VPC Flow Logs: {str(e)}")
        
    return findings

def check_cloudwatch_encryption() -> List[Dict[str, Any]]:
    """Check CloudWatch log groups for KMS encryption"""
    findings = []
    
    try:
        response = logs.describe_log_groups()
        
        for log_group in response.get('logGroups', []):
            log_group_name = log_group['logGroupName']
            
            if 'kmsKeyId' not in log_group:
                findings.append({
                    'type': 'CLOUDWATCH_LOGS_UNENCRYPTED',
                    'severity': SEVERITY_MEDIUM,
                    'resource': log_group_name,
                    'message': f'CloudWatch log group {log_group_name} is not encrypted with KMS',
                    'recommendation': 'Enable KMS encryption for the log group'
                })
                
            # Check retention policy
            if 'retentionInDays' not in log_group:
                findings.append({
                    'type': 'CLOUDWATCH_LOGS_NO_RETENTION',
                    'severity': SEVERITY_LOW,
                    'resource': log_group_name,
                    'message': f'CloudWatch log group {log_group_name} has no retention policy',
                    'recommendation': 'Set an appropriate retention policy to control costs and comply with data policies'
                })
                
    except Exception as e:
        print(f"Error checking CloudWatch log groups: {str(e)}")
        
    return findings

def generate_compliance_report(findings: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate a compliance report from findings"""
    
    timestamp = datetime.utcnow().isoformat()
    
    # Group findings by severity
    findings_by_severity = {
        SEVERITY_CRITICAL: [],
        SEVERITY_HIGH: [],
        SEVERITY_MEDIUM: [],
        SEVERITY_LOW: []
    }
    
    for finding in findings:
        severity = finding.get('severity', SEVERITY_LOW)
        findings_by_severity[severity].append(finding)
        
    report = {
        'timestamp': timestamp,
        'report_type': 'security_compliance',
        'summary': {
            'total_findings': len(findings),
            'critical': len(findings_by_severity[SEVERITY_CRITICAL]),
            'high': len(findings_by_severity[SEVERITY_HIGH]),
            'medium': len(findings_by_severity[SEVERITY_MEDIUM]),
            'low': len(findings_by_severity[SEVERITY_LOW])
        },
        'findings': findings,
        'findings_by_severity': findings_by_severity
    }
    
    return report

def publish_to_sns(report: Dict[str, Any]):
    """Publish compliance report summary to SNS"""
    
    if not SNS_TOPIC_ARN:
        print("SNS_TOPIC_ARN not configured, skipping notification")
        return
        
    try:
        summary = report['summary']
        
        # Create message
        subject = f"Security Compliance Report - {summary['total_findings']} findings"
        
        message = f"""
Security Compliance Report
Generated: {report['timestamp']}

Summary:
- Total Findings: {summary['total_findings']}
- Critical: {summary['critical']}
- High: {summary['high']}
- Medium: {summary['medium']}
- Low: {summary['low']}

Critical Findings:
"""
        
        # Add critical findings to message
        for finding in report['findings_by_severity'][SEVERITY_CRITICAL][:5]:
            message += f"\n- {finding['type']}: {finding['resource']}"
            message += f"\n  {finding['message']}\n"
            
        if summary['critical'] > 5:
            message += f"\n... and {summary['critical'] - 5} more critical findings\n"
            
        message += "\nFull report has been saved to S3."
        
        # Publish to SNS
        response = sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=message
        )
        
        print(f"Published to SNS: {response['MessageId']}")
        
    except Exception as e:
        print(f"Error publishing to SNS: {str(e)}")

def store_report_in_s3(report: Dict[str, Any]):
    """Store the full compliance report in S3"""
    
    if not COMPLIANCE_REPORTS_BUCKET:
        print("COMPLIANCE_REPORTS_BUCKET not configured, skipping S3 storage")
        return
        
    try:
        timestamp = datetime.utcnow()
        
        # Create S3 key with timestamp
        s3_key = f"compliance-reports/{timestamp.year}/{timestamp.month:02d}/{timestamp.day:02d}/report-{timestamp.strftime('%Y%m%d-%H%M%S')}.json"
        
        # Upload to S3
        response = s3.put_object(
            Bucket=COMPLIANCE_REPORTS_BUCKET,
            Key=s3_key,
            Body=json.dumps(report, indent=2),
            ContentType='application/json',
            ServerSideEncryption='aws:kms'
        )
        
        print(f"Stored report in S3: s3://{COMPLIANCE_REPORTS_BUCKET}/{s3_key}")
        
    except Exception as e:
        print(f"Error storing report in S3: {str(e)}")
```

## Implementation Details

### Security Architecture Features

1. **Zero-Trust Network Segmentation**:
   - Three isolated network tiers (application, database, management)
   - Custom NACLs blocking malicious IP ranges
   - Security groups with least-privilege access

2. **End-to-End Encryption**:
   - Three KMS keys for different data types
   - Mandatory S3 bucket encryption
   - Encrypted CloudWatch logs and VPC Flow Logs

3. **Comprehensive Monitoring**:
   - VPC Flow Logs capturing all traffic
   - CloudWatch alarms for security events
   - Lambda-based compliance scanning

4. **Automated Compliance**:
   - Daily compliance scans via EventBridge
   - Real-time security group change monitoring
   - Findings stored in S3 with SNS notifications

5. **PCI DSS Compliance**:
   - Network segmentation
   - Encryption at rest and in transit
   - Audit trails and monitoring
   - Secrets management for credentials

### Deployment Notes

- All resources are tagged according to the specified strategy
- Cleanup configurations enable easy testing and teardown
- The Lambda function performs comprehensive security checks
- GuardDuty provides additional threat detection capabilities
- No manual verification required (no email subscriptions)

The architecture implements defense-in-depth with multiple security layers while maintaining operational efficiency for payment processing workloads.