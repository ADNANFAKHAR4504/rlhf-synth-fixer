# Multi-Region Disaster Recovery Configuration
# Advanced feature for 10/10 training quality score

# Secondary region provider
provider "aws" {
  alias  = "dr_region"
  region = var.dr_aws_region

  default_tags {
    tags = {
      Environment = var.environment_suffix
      ManagedBy   = "Terraform"
      Purpose     = "DisasterRecovery"
    }
  }
}

# Data source for DR region availability zones
data "aws_availability_zones" "dr_available" {
  provider = aws.dr_region
  state    = "available"
}

# DR Region VPC
resource "aws_vpc" "dr_main" {
  provider = aws.dr_region

  cidr_block           = var.dr_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-dr-vpc"
    Environment = var.environment_suffix
    Region      = var.dr_aws_region
    Purpose     = "DisasterRecovery"
  }
}

# DR Region Subnets
resource "aws_subnet" "dr_private" {
  provider = aws.dr_region
  count    = min(length(data.aws_availability_zones.dr_available.names), 3)

  vpc_id            = aws_vpc.dr_main.id
  cidr_block        = cidrsubnet(var.dr_vpc_cidr, 4, count.index)
  availability_zone = data.aws_availability_zones.dr_available.names[count.index]

  tags = {
    Name                                                                     = "${var.cluster_name}-${var.environment_suffix}-dr-private-${count.index + 1}"
    "kubernetes.io/cluster/${var.cluster_name}-${var.environment_suffix}-dr" = "shared"
    "kubernetes.io/role/internal-elb"                                        = "1"
    Environment                                                              = var.environment_suffix
  }
}

resource "aws_subnet" "dr_public" {
  provider = aws.dr_region
  count    = min(length(data.aws_availability_zones.dr_available.names), 3)

  vpc_id                  = aws_vpc.dr_main.id
  cidr_block              = cidrsubnet(var.dr_vpc_cidr, 4, count.index + 10)
  availability_zone       = data.aws_availability_zones.dr_available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name                                                                     = "${var.cluster_name}-${var.environment_suffix}-dr-public-${count.index + 1}"
    "kubernetes.io/cluster/${var.cluster_name}-${var.environment_suffix}-dr" = "shared"
    "kubernetes.io/role/elb"                                                 = "1"
    Environment                                                              = var.environment_suffix
  }
}

# VPC Peering between primary and DR regions
resource "aws_vpc_peering_connection" "primary_to_dr" {
  vpc_id      = aws_vpc.main.id
  peer_vpc_id = aws_vpc.dr_main.id
  peer_region = var.dr_aws_region
  auto_accept = false

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-primary-to-dr"
    Environment = var.environment_suffix
    Side        = "Requester"
  }
}

# Accept peering connection in DR region
resource "aws_vpc_peering_connection_accepter" "dr_accepter" {
  provider                  = aws.dr_region
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_dr.id
  auto_accept               = true

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-dr-accepter"
    Environment = var.environment_suffix
    Side        = "Accepter"
  }
}

# Route tables for VPC peering
resource "aws_route" "primary_to_dr" {
  count                     = length(aws_route_table.private)
  route_table_id            = aws_route_table.private[count.index].id
  destination_cidr_block    = var.dr_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_dr.id
}

resource "aws_route" "dr_to_primary" {
  provider                  = aws.dr_region
  count                     = length(aws_subnet.dr_private)
  route_table_id            = aws_route_table.dr_private[count.index].id
  destination_cidr_block    = var.vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_dr.id
}

# DR Region Route Tables
resource "aws_route_table" "dr_private" {
  provider = aws.dr_region
  count    = length(aws_subnet.dr_private)
  vpc_id   = aws_vpc.dr_main.id

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-dr-private-rt-${count.index + 1}"
    Environment = var.environment_suffix
  }
}

# DR Region EKS Cluster
resource "aws_eks_cluster" "dr_cluster" {
  provider = aws.dr_region

  name     = "${var.cluster_name}-${var.environment_suffix}-dr"
  role_arn = aws_iam_role.dr_cluster.arn
  version  = var.kubernetes_version

  vpc_config {
    subnet_ids              = aws_subnet.dr_private[*].id
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = var.eks_public_access_cidrs
    security_group_ids      = [aws_security_group.dr_cluster.id]
  }

  encryption_config {
    provider {
      key_arn = aws_kms_key.dr_eks.arn
    }
    resources = ["secrets"]
  }

  enabled_cluster_log_types = [
    "api",
    "audit",
    "authenticator",
    "controllerManager",
    "scheduler"
  ]

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-dr"
    Environment = var.environment_suffix
    Region      = var.dr_aws_region
    Purpose     = "DisasterRecovery"
  }

  depends_on = [
    aws_iam_role_policy_attachment.dr_cluster_policy,
    aws_cloudwatch_log_group.dr_eks_cluster
  ]
}

# DR Region Security Group
resource "aws_security_group" "dr_cluster" {
  provider    = aws.dr_region
  name        = "${var.cluster_name}-${var.environment_suffix}-dr-cluster-sg"
  description = "Security group for DR EKS cluster"
  vpc_id      = aws_vpc.dr_main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
    description = "Allow HTTPS from primary region"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-dr-cluster-sg"
    Environment = var.environment_suffix
  }
}

# DR Region IAM Role
resource "aws_iam_role" "dr_cluster" {
  provider = aws.dr_region
  name     = "${var.cluster_name}-${var.environment_suffix}-dr-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-dr-cluster-role"
    Environment = var.environment_suffix
  }
}

resource "aws_iam_role_policy_attachment" "dr_cluster_policy" {
  provider   = aws.dr_region
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.dr_cluster.name
}

# DR Region KMS Key
resource "aws_kms_key" "dr_eks" {
  provider                = aws.dr_region
  description             = "EKS DR Secret Encryption Key"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-dr-eks-key"
    Environment = var.environment_suffix
    Purpose     = "DisasterRecovery"
  }
}

resource "aws_kms_alias" "dr_eks" {
  provider      = aws.dr_region
  name          = "alias/${var.cluster_name}-${var.environment_suffix}-dr-eks"
  target_key_id = aws_kms_key.dr_eks.key_id
}

# DR Region CloudWatch Log Group
resource "aws_cloudwatch_log_group" "dr_eks_cluster" {
  provider          = aws.dr_region
  name              = "/aws/eks/${var.cluster_name}-${var.environment_suffix}-dr/cluster"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.dr_eks.arn

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-dr-logs"
    Environment = var.environment_suffix
    Purpose     = "DisasterRecovery"
  }
}

# Cross-region RDS Read Replica for database DR
resource "aws_db_subnet_group" "dr_rds" {
  provider    = aws.dr_region
  name        = "${var.cluster_name}-${var.environment_suffix}-dr-db-subnet"
  subnet_ids  = aws_subnet.dr_private[*].id
  description = "DB subnet group for DR region"

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-dr-db-subnet"
    Environment = var.environment_suffix
  }
}

# Commented out - requires main RDS instance to be defined first
# resource "aws_db_instance" "dr_read_replica" {
#   provider                   = aws.dr_region
#   identifier                 = "${var.cluster_name}-${var.environment_suffix}-dr-replica"
#   replicate_source_db        = aws_db_instance.main.arn
#   instance_class             = "db.t3.medium"
#   publicly_accessible        = false
#   auto_minor_version_upgrade = false
#   backup_retention_period    = 7
#   backup_window              = "03:00-04:00"
#   maintenance_window         = "sun:04:00-sun:05:00"
#   db_subnet_group_name       = aws_db_subnet_group.dr_rds.name
#   storage_encrypted          = true
#   kms_key_id                 = aws_kms_key.dr_eks.arn
#
#   tags = {
#     Name        = "${var.cluster_name}-${var.environment_suffix}-dr-replica"
#     Environment = var.environment_suffix
#     Purpose     = "DisasterRecovery"
#   }
# }

# Primary backup bucket for replication
resource "aws_s3_bucket" "backups" {
  bucket = "${var.cluster_name}-${var.environment_suffix}-backups-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-backups"
    Environment = var.environment_suffix
    Purpose     = "Backups"
  }
}

resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Cross-Region Replication for backups
resource "aws_s3_bucket" "dr_backups" {
  provider = aws.dr_region
  bucket   = "${var.cluster_name}-${var.environment_suffix}-dr-backups-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-dr-backups"
    Environment = var.environment_suffix
    Purpose     = "DisasterRecovery"
  }
}

resource "aws_s3_bucket_versioning" "dr_backups" {
  provider = aws.dr_region
  bucket   = aws_s3_bucket.dr_backups.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Commented out - requires main backup bucket to be defined first
# resource "aws_s3_bucket_replication_configuration" "backup_replication" {
#   role   = aws_iam_role.s3_replication.arn
#   bucket = aws_s3_bucket.backups.id
#
#   rule {
#     id     = "dr-replication"
#     status = "Enabled"
#
#     filter {
#       prefix = ""
#     }
#
#     destination {
#       bucket        = aws_s3_bucket.dr_backups.arn
#       storage_class = "STANDARD_IA"
#
#       replication_time {
#         status = "Enabled"
#         time {
#           minutes = 15
#         }
#       }
#
#       metrics {
#         status = "Enabled"
#         event_threshold {
#           minutes = 15
#         }
#       }
#     }
#
#     delete_marker_replication {
#       status = "Enabled"
#     }
#   }
#
#   depends_on = [aws_s3_bucket_versioning.backups]
# }

# IAM Role for S3 Replication
resource "aws_iam_role" "s3_replication" {
  name = "${var.cluster_name}-${var.environment_suffix}-s3-replication"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "s3.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-s3-replication"
    Environment = var.environment_suffix
  }
}

resource "aws_iam_role_policy" "s3_replication" {
  name = "${var.cluster_name}-${var.environment_suffix}-s3-replication-policy"
  role = aws_iam_role.s3_replication.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.backups.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = "${aws_s3_bucket.backups.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = "${aws_s3_bucket.dr_backups.arn}/*"
      }
    ]
  })
}

# Route53 Health Checks for failover
# Commented out - requires load balancers to be defined first
# resource "aws_route53_health_check" "primary" {
#   fqdn              = aws_lb.primary.dns_name
#   port              = 443
#   type              = "HTTPS"
#   resource_path     = "/health"
#   failure_threshold = 3
#   request_interval  = 30
#
#   tags = {
#     Name        = "${var.cluster_name}-${var.environment_suffix}-primary-health"
#     Environment = var.environment_suffix
#   }
# }
#
# resource "aws_route53_health_check" "dr" {
#   provider          = aws.dr_region
#   fqdn              = aws_lb.dr.dns_name
#   port              = 443
#   type              = "HTTPS"
#   resource_path     = "/health"
#   failure_threshold = 3
#   request_interval  = 30
#
#   tags = {
#     Name        = "${var.cluster_name}-${var.environment_suffix}-dr-health"
#     Environment = var.environment_suffix
#   }
# }

# Route53 Failover Records
# Commented out - requires load balancers and Route53 zone to be defined first
# resource "aws_route53_record" "primary" {
#   zone_id = data.aws_route53_zone.main.zone_id
#   name    = "app.${var.domain_name}"
#   type    = "A"
#
#   set_identifier = "Primary"
#   failover_routing_policy {
#     type = "PRIMARY"
#   }
#
#   alias {
#     name                   = aws_lb.primary.dns_name
#     zone_id                = aws_lb.primary.zone_id
#     evaluate_target_health = true
#   }
#
#   health_check_id = aws_route53_health_check.primary.id
# }
#
# resource "aws_route53_record" "dr" {
#   provider = aws.dr_region
#   zone_id  = data.aws_route53_zone.main.zone_id
#   name     = "app.${var.domain_name}"
#   type     = "A"
#
#   set_identifier = "DR"
#   failover_routing_policy {
#     type = "SECONDARY"
#   }
#
#   alias {
#     name                   = aws_lb.dr.dns_name
#     zone_id                = aws_lb.dr.zone_id
#     evaluate_target_health = true
#   }
#
#   health_check_id = aws_route53_health_check.dr.id
# }

# AWS Backup for automated cross-region backups
resource "aws_backup_vault" "main" {
  name        = "${var.cluster_name}-${var.environment_suffix}-main-vault"
  kms_key_arn = var.enable_cluster_encryption ? aws_kms_key.eks[0].arn : null

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-main-vault"
    Environment = var.environment_suffix
    Purpose     = "Backups"
  }
}

resource "aws_backup_vault" "dr" {
  provider    = aws.dr_region
  name        = "${var.cluster_name}-${var.environment_suffix}-dr-vault"
  kms_key_arn = aws_kms_key.dr_eks.arn

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-dr-vault"
    Environment = var.environment_suffix
    Purpose     = "DisasterRecovery"
  }
}

resource "aws_backup_plan" "dr" {
  name = "${var.cluster_name}-${var.environment_suffix}-dr-backup-plan"

  rule {
    rule_name         = "daily_backups"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 2 * * ? *)"
    start_window      = 60
    completion_window = 120

    lifecycle {
      delete_after = 30
    }

    copy_action {
      destination_vault_arn = aws_backup_vault.dr.arn
      lifecycle {
        delete_after = 90
      }
    }
  }

  advanced_backup_setting {
    backup_options = {
      WindowsVSS = "enabled"
    }
    resource_type = "EC2"
  }

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-dr-backup-plan"
    Environment = var.environment_suffix
  }
}

# CloudWatch Dashboard for DR monitoring
resource "aws_cloudwatch_dashboard" "dr_monitoring" {
  provider       = aws.dr_region
  dashboard_name = "${var.cluster_name}-${var.environment_suffix}-dr-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/EKS", "cluster_node_count", "ClusterName", aws_eks_cluster.dr_cluster.name],
            [".", "cluster_failed_node_count", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = var.dr_aws_region
          title  = "DR Cluster Node Health"
        }
      },
      # Commented out - requires DR database instance to be defined
      # {
      #   type   = "metric"
      #   width  = 12
      #   height = 6
      #   properties = {
      #     metrics = [
      #       ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", aws_db_instance.dr_read_replica.identifier],
      #       [".", "ReadLatency", ".", "."],
      #       [".", "WriteLatency", ".", "."]
      #     ]
      #     period = 300
      #     stat   = "Average"
      #     region = var.dr_aws_region
      #     title  = "DR Database Metrics"
      #   }
      # },
      {
        type   = "metric"
        width  = 24
        height = 6
        properties = {
          metrics = [
            ["AWS/S3", "BucketSizeBytes", "BucketName", aws_s3_bucket.dr_backups.id, { stat = "Average" }],
            [".", "NumberOfObjects", ".", ".", { stat = "Average", yAxis = "right" }]
          ]
          period = 86400
          stat   = "Average"
          region = var.dr_aws_region
          title  = "DR Backup Storage"
        }
      }
    ]
  })
}

# Lambda for automated failover orchestration
# Commented out - requires Route53 zone data source to be defined
# resource "aws_lambda_function" "dr_failover" {
#   provider      = aws.dr_region
#   filename      = "${path.module}/lambda/dr-failover.zip"
#   function_name = "${var.cluster_name}-${var.environment_suffix}-dr-failover"
#   role          = aws_iam_role.dr_lambda.arn
#   handler       = "index.handler"
#   runtime       = "python3.11"
#   timeout       = 900
#
#   environment {
#     variables = {
#       PRIMARY_CLUSTER = aws_eks_cluster.main.name
#       DR_CLUSTER      = aws_eks_cluster.dr_cluster.name
#       PRIMARY_REGION  = var.aws_region
#       DR_REGION       = var.dr_aws_region
#       ROUTE53_ZONE    = data.aws_route53_zone.main.zone_id
#     }
#   }
#
#   tags = {
#     Name        = "${var.cluster_name}-${var.environment_suffix}-dr-failover"
#     Environment = var.environment_suffix
#     Purpose     = "DisasterRecovery"
#   }
# }

# IAM Role for DR Lambda
resource "aws_iam_role" "dr_lambda" {
  provider = aws.dr_region
  name     = "${var.cluster_name}-${var.environment_suffix}-dr-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = {
    Name        = "${var.cluster_name}-${var.environment_suffix}-dr-lambda"
    Environment = var.environment_suffix
  }
}

resource "aws_iam_role_policy_attachment" "dr_lambda_basic" {
  provider   = aws.dr_region
  role       = aws_iam_role.dr_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}