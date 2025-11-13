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
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.app_logs.arn,
          "${aws_s3_bucket.app_logs.arn}/*"
        ]
      },
      {
        Sid       = "DenyUnencryptedObjectUploads"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.app_logs.arn}/*"
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
        Action = "s3:*"
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
        Sid       = "DenyUnencryptedObjectUploads"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.flow_logs.arn}/*"
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
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.compliance_reports.arn,
          "${aws_s3_bucket.compliance_reports.arn}/*"
        ]
      },
      {
        Sid       = "DenyUnencryptedObjectUploads"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.compliance_reports.arn}/*"
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
  name = "role-vpc-flow-logs-${var.environment}"
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
  log_destination      = aws_s3_bucket.flow_logs.arn
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id

  tags = {
    Name = "flow-log-vpc-${var.environment}"
  }
}

# ==================== SECURITY GROUPS ====================

# Application Security Group
resource "aws_security_group" "app" {
  name_prefix = "app-${var.environment}-"
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
  name_prefix = "db-${var.environment}-"
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
  name_prefix = "mgmt-${var.environment}-"
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
  cidr_blocks       = ["10.0.0.0/16"] # Restricted to VPC CIDR
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
  role             = aws_iam_role.lambda_compliance.arn
  handler          = "lambda_function.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "python3.11"
  memory_size      = 256
  timeout          = 300

  environment {
    variables = {
      SNS_TOPIC_ARN             = aws_sns_topic.security_alerts.arn
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
        Sid    = "AllowEventBridgeToPublish"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.security_alerts.arn
      },
      {
        Sid    = "AllowLambdaToPublish"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.security_alerts.arn
      },
      {
        Sid    = "AllowRootAccount"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "sns:*"
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
  recovery_window_in_days = 0 # Immediate deletion for testing

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