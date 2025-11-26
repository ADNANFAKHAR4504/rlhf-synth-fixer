locals {
  use_existing_vpc             = var.vpc_id != null && trimspace(var.vpc_id) != ""
  use_existing_public_subnet   = var.public_subnet_id != null && trimspace(var.public_subnet_id) != ""
  use_existing_private_subnets = var.private_subnet_ids != null && length(var.private_subnet_ids) > 0
}

##################
# Core Networking#
##################

resource "aws_vpc" "emr" {
  count                = local.use_existing_vpc ? 0 : 1
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.bucket_prefix}-vpc"
  })
}

resource "aws_internet_gateway" "emr" {
  count  = local.use_existing_vpc ? 0 : 1
  vpc_id = local.use_existing_vpc ? null : aws_vpc.emr[0].id

  tags = merge(local.common_tags, {
    Name = "${local.bucket_prefix}-igw"
  })
}

resource "aws_subnet" "public" {
  count                   = local.use_existing_public_subnet ? 0 : 1
  vpc_id                  = local.use_existing_vpc ? var.vpc_id : aws_vpc.emr[0].id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = var.availability_zones[0]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.bucket_prefix}-public-subnet"
  })
}

resource "aws_subnet" "private" {
  count             = local.use_existing_private_subnets ? 0 : length(var.private_subnet_cidrs)
  vpc_id            = local.use_existing_vpc ? var.vpc_id : aws_vpc.emr[0].id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index % length(var.availability_zones)]

  tags = merge(local.common_tags, {
    Name = "${local.bucket_prefix}-private-subnet-${count.index + 1}"
  })
}

resource "aws_eip" "nat" {
  count      = local.use_existing_vpc ? 0 : 1
  domain     = "vpc"
  depends_on = [aws_internet_gateway.emr]

  tags = merge(local.common_tags, {
    Name = "${local.bucket_prefix}-nat-eip"
  })
}

resource "aws_nat_gateway" "emr" {
  count         = local.use_existing_vpc ? 0 : 1
  subnet_id     = local.use_existing_public_subnet ? null : aws_subnet.public[0].id
  allocation_id = local.use_existing_vpc ? null : aws_eip.nat[0].id

  depends_on = [aws_internet_gateway.emr]

  tags = merge(local.common_tags, {
    Name = "${local.bucket_prefix}-nat"
  })
}

resource "aws_route_table" "public" {
  count  = local.use_existing_vpc ? 0 : 1
  vpc_id = local.use_existing_vpc ? var.vpc_id : aws_vpc.emr[0].id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.emr[0].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.bucket_prefix}-public-rt"
  })
}

resource "aws_route_table_association" "public" {
  count          = local.use_existing_public_subnet ? 0 : 1
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public[count.index].id
}

resource "aws_route_table" "private" {
  count  = local.use_existing_private_subnets ? 0 : 1
  vpc_id = local.use_existing_vpc ? var.vpc_id : aws_vpc.emr[0].id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.emr[0].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.bucket_prefix}-private-rt"
  })
}

resource "aws_route_table_association" "private" {
  count          = local.use_existing_private_subnets ? 0 : length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[0].id
}

##############################
# Encryption and Data Stores #
##############################

resource "aws_s3_bucket" "raw" {
  bucket        = local.raw_bucket_name
  force_destroy = false

  tags = merge(local.common_tags, {
    DataClassification = "raw"
  })
}

resource "aws_s3_bucket_public_access_block" "raw" {
  bucket = aws_s3_bucket.raw.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "raw" {
  bucket = aws_s3_bucket.raw.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "raw" {
  bucket = aws_s3_bucket.raw.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket" "curated" {
  bucket        = local.curated_bucket_name
  force_destroy = false

  tags = merge(local.common_tags, {
    DataClassification = "curated"
  })
}

resource "aws_s3_bucket_public_access_block" "curated" {
  bucket = aws_s3_bucket.curated.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "curated" {
  bucket = aws_s3_bucket.curated.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "curated" {
  bucket = aws_s3_bucket.curated.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket" "logs" {
  bucket        = local.logs_bucket_name
  force_destroy = false

  tags = merge(local.common_tags, {
    Purpose = "emr-logs"
  })
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_policy" "logs_https_only" {
  bucket = aws_s3_bucket.logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.logs.arn,
          "${aws_s3_bucket.logs.arn}/*"
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

####################
# Network Security #
####################

resource "aws_security_group" "emr_master" {
  name_prefix = "${local.bucket_prefix}-master-"
  description = "Security group for EMR master node"
  vpc_id      = local.emr_vpc_id

  ingress {
    description = "SSH from corporate network"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.corporate_cidr]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.bucket_prefix}-emr-master-sg"
  })
}

resource "aws_security_group" "emr_core_task" {
  name_prefix = "${local.bucket_prefix}-core-task-"
  description = "Security group for EMR core and task nodes"
  vpc_id      = local.emr_vpc_id

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.bucket_prefix}-emr-core-task-sg"
  })
}

resource "aws_security_group" "emr_service" {
  name_prefix = "${local.bucket_prefix}-service-"
  description = "Service access security group for EMR control plane"
  vpc_id      = local.emr_vpc_id

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.bucket_prefix}-emr-service-sg"
  })
}

resource "aws_security_group_rule" "core_task_from_master" {
  type                     = "ingress"
  from_port                = 0
  to_port                  = 65535
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.emr_master.id
  security_group_id        = aws_security_group.emr_core_task.id
  description              = "Allow traffic from master nodes to core/task nodes"
}

resource "aws_security_group_rule" "master_from_core_task" {
  type                     = "ingress"
  from_port                = 0
  to_port                  = 65535
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.emr_core_task.id
  security_group_id        = aws_security_group.emr_master.id
  description              = "Allow traffic from core/task nodes to master"
}

resource "aws_security_group_rule" "core_task_self" {
  type                     = "ingress"
  from_port                = 0
  to_port                  = 65535
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.emr_core_task.id
  security_group_id        = aws_security_group.emr_core_task.id
  description              = "Allow intra-node communication between core/task nodes"
}

resource "aws_security_group_rule" "service_from_master" {
  type                     = "ingress"
  from_port                = 0
  to_port                  = 65535
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.emr_master.id
  security_group_id        = aws_security_group.emr_service.id
  description              = "Allow EMR control plane traffic from master"
}

############################
# Security Configuration  #
############################

resource "random_id" "security_config_suffix" {
  byte_length = 4
  keepers = {
    bucket_prefix = local.bucket_prefix
    account_id    = data.aws_caller_identity.current.account_id
    region        = data.aws_region.current.id
    enable_tls    = var.enable_in_transit_encryption
  }
}

resource "aws_emr_security_configuration" "main" {
  name = "${local.bucket_prefix}-security-config-${random_id.security_config_suffix.hex}"

  configuration = jsonencode({
    EncryptionConfiguration = merge({
      EnableInTransitEncryption = var.enable_in_transit_encryption
      EnableAtRestEncryption    = false
      }, var.enable_in_transit_encryption ? {
      InTransitEncryptionConfiguration = {
        TLSCertificateConfiguration = {
          CertificateProviderType = "PEM"
          S3Object                = "s3://${aws_s3_bucket.logs.bucket}/${aws_s3_object.emr_tls_zip[0].key}"
        }
      }
    } : {})
  })
}

####################
# Bootstrap Script #
####################

resource "aws_s3_object" "bootstrap_script" {
  bucket = aws_s3_bucket.logs.id
  key    = "bootstrap/install-analytics-libs.sh"
  source = "${path.module}/bootstrap.sh"
  etag   = filemd5("${path.module}/bootstrap.sh")
}

# Upload TLS certificate bundle for EMR in-transit encryption (only if enabled)
resource "aws_s3_object" "emr_tls_zip" {
  count        = var.enable_in_transit_encryption ? 1 : 0
  bucket       = aws_s3_bucket.logs.id
  key          = "security/emr-tls.zip"
  source       = "${path.module}/security/emr-tls.zip"
  content_type = "application/zip"
  etag         = filemd5("${path.module}/security/emr-tls.zip")
}


locals {
  emr_vpc_id             = local.use_existing_vpc ? var.vpc_id : aws_vpc.emr[0].id
  emr_public_subnet_id   = local.use_existing_public_subnet ? var.public_subnet_id : aws_subnet.public[0].id
  emr_private_subnet_ids = local.use_existing_private_subnets ? var.private_subnet_ids : [for subnet in aws_subnet.private : subnet.id]
}

################
# EMR Cluster #
################

resource "aws_emr_cluster" "main" {
  name          = "${local.bucket_prefix}-emr-cluster"
  release_label = var.emr_release_label
  applications  = ["Spark", "Hadoop", "Hive"]

  termination_protection            = false
  keep_job_flow_alive_when_no_steps = true
  step_concurrency_level            = var.step_concurrency_level
  visible_to_all_users              = true

  ec2_attributes {
    subnet_id        = local.emr_public_subnet_id
    instance_profile = aws_iam_instance_profile.emr_ec2_instance_profile.arn
    key_name         = var.ec2_key_pair_name
  }

  master_instance_group {
    instance_type  = var.master_instance_type
    instance_count = 1

    ebs_config {
      size                 = 100
      type                 = "gp2"
      volumes_per_instance = 1
    }
  }

  core_instance_group {
    instance_type  = var.core_instance_type
    instance_count = var.core_instance_count

    ebs_config {
      size                 = 100
      type                 = "gp2"
      volumes_per_instance = 1
    }
  }

  service_role     = aws_iam_role.emr_service_role.arn
  autoscaling_role = aws_iam_role.emr_autoscaling_role.arn

  security_configuration = aws_emr_security_configuration.main.name

  configurations_json = jsonencode([
    {
      Classification = "spark"
      Properties = {
        "maximizeResourceAllocation" = "true"
      }
    },
    {
      Classification = "spark-defaults"
      Properties = {
        "spark.dynamicAllocation.enabled"               = "true"
        "spark.shuffle.service.enabled"                 = "true"
        "spark.serializer"                              = "org.apache.spark.serializer.KryoSerializer"
        "spark.sql.adaptive.enabled"                    = "true"
        "spark.sql.adaptive.coalescePartitions.enabled" = "true"
        "spark.sql.adaptive.localShuffleReader.enabled" = "true"
      }
    },
    {
      Classification = "yarn-site"
      Properties = {
        "yarn.nodemanager.vmem-check-enabled" = "false"
      }
    },
    {
      Classification = "capacity-scheduler"
      Properties = {
        "yarn.scheduler.capacity.resource-calculator" = "org.apache.hadoop.yarn.util.resource.DominantResourceCalculator"
      }
    },
    {
      Classification = "spark-hive-site"
      Properties = {
        "hive.metastore.client.factory.class" = "com.amazonaws.glue.catalog.metastore.AWSGlueDataCatalogHiveClientFactory"
      }
    }
  ])

  bootstrap_action {
    name = "install_analytics_libraries"
    path = "s3://${aws_s3_bucket.logs.bucket}/bootstrap/install-analytics-libs.sh"
  }

  log_uri = "s3://${aws_s3_bucket.logs.bucket}/emr-logs/"

  auto_termination_policy {
    idle_timeout = var.idle_timeout_seconds
  }

  tags = merge(local.common_tags, {
    Name = "${local.bucket_prefix}-emr-cluster"
  })

  depends_on = [
    aws_s3_bucket.logs,
    aws_s3_bucket.curated,
    aws_s3_bucket.raw,
    aws_s3_object.bootstrap_script,
    aws_iam_role_policy.emr_service_ec2_permissions,
    aws_iam_role_policy.emr_service_s3_permissions,
    aws_iam_role_policy_attachment.emr_service_role,
    aws_emr_security_configuration.main
  ]
}

# Disable termination protection before destroying the cluster
# This resource's triggers reference the cluster, so it will be created after the cluster
# During destroy, Terraform destroys in reverse creation order, so this will be destroyed first
resource "null_resource" "disable_termination_protection" {
  # Store cluster ID in triggers so it can be accessed via self.triggers in destroy provisioner
  # The trigger creates an implicit dependency: cluster is created first, then this resource
  triggers = {
    cluster_id = aws_emr_cluster.main.id
  }

  # This runs when this null_resource is being destroyed (before cluster destroy)
  provisioner "local-exec" {
    when    = destroy
    command = <<-EOT
      # Use Terraform's AWS provider credentials to disable termination protection
      # This uses the same credentials Terraform uses, no AWS CLI needed
      # Python3 and boto3 are required (usually available in CI/CD environments)
      python3 <<'PYTHON'
import boto3
import sys
import os

# Get AWS credentials from environment (same as Terraform uses)
# Terraform sets these automatically from provider configuration
session = boto3.Session(
    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
    aws_session_token=os.environ.get('AWS_SESSION_TOKEN'),
    region_name=os.environ.get('AWS_REGION', 'us-east-1')
)

emr = session.client('emr')
cluster_id = '${self.triggers.cluster_id}'

try:
    emr.set_termination_protection(
        JobFlowIds=[cluster_id],
        TerminationProtected=False
    )
    print(f"Successfully disabled termination protection for cluster {cluster_id}")
except Exception as e:
    # If cluster is already terminated or protection already disabled, that's fine
    error_msg = str(e).lower()
    if 'not found' in error_msg or 'terminated' in error_msg or 'does not exist' in error_msg:
        print(f"Cluster {cluster_id} already terminated or protection already disabled")
    else:
        print(f"Warning: Could not disable termination protection: {e}", file=sys.stderr)
        # Don't fail destroy if this fails - cluster might already be terminated
    sys.exit(0)
PYTHON
    EOT
  }
}

resource "aws_emr_instance_group" "task" {
  cluster_id     = aws_emr_cluster.main.id
  instance_type  = var.task_instance_type
  instance_count = max(1, var.task_instance_min)
  name           = "Task Instance Group"
  bid_price      = var.task_spot_bid_price

  ebs_config {
    size                 = 100
    type                 = "gp2"
    volumes_per_instance = 1
  }

  autoscaling_policy = jsonencode({
    Constraints = {
      MinCapacity = var.task_instance_min
      MaxCapacity = var.task_instance_max
    }
    Rules = [
      {
        Name        = "ScaleOutOnYarnMemory"
        Description = "Increase task nodes when available YARN memory falls below threshold"
        Action = {
          SimpleScalingPolicyConfiguration = {
            AdjustmentType    = "CHANGE_IN_CAPACITY"
            ScalingAdjustment = 1
            CoolDown          = 300
          }
        }
        Trigger = {
          CloudWatchAlarmDefinition = {
            ComparisonOperator = "LESS_THAN"
            EvaluationPeriods  = 2
            MetricName         = "YARNMemoryAvailablePercentage"
            Namespace          = "AWS/ElasticMapReduce"
            Period             = 300
            Statistic          = "AVERAGE"
            Threshold          = var.yarn_memory_scale_out_threshold
            Unit               = "PERCENT"
            Dimensions = [
              {
                Key   = "JobFlowId"
                Value = aws_emr_cluster.main.id
              }
            ]
          }
        }
      },
      {
        Name        = "ScaleInOnYarnMemory"
        Description = "Reduce task nodes when the cluster has ample YARN memory available"
        Action = {
          SimpleScalingPolicyConfiguration = {
            AdjustmentType    = "CHANGE_IN_CAPACITY"
            ScalingAdjustment = -1
            CoolDown          = 300
          }
        }
        Trigger = {
          CloudWatchAlarmDefinition = {
            ComparisonOperator = "GREATER_THAN"
            EvaluationPeriods  = 2
            MetricName         = "YARNMemoryAvailablePercentage"
            Namespace          = "AWS/ElasticMapReduce"
            Period             = 300
            Statistic          = "AVERAGE"
            Threshold          = var.yarn_memory_scale_in_threshold
            Unit               = "PERCENT"
            Dimensions = [
              {
                Key   = "JobFlowId"
                Value = aws_emr_cluster.main.id
              }
            ]
          }
        }
      }
    ]
  })

  lifecycle {
    create_before_destroy = true
  }

  configurations_json = jsonencode([
    {
      Classification = "spark"
      Properties = {
        "maximizeResourceAllocation" = "true"
      }
    }
  ])
}

######################
# CloudWatch Logging #
######################

resource "aws_cloudwatch_log_group" "emr_cluster_logs" {
  name              = "/aws/emr/${local.bucket_prefix}"
  retention_in_days = 30
  tags              = local.common_tags
}