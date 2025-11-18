# Main infrastructure configuration with all 8 mandatory requirements implemented

# Requirement 1 & 4: Consolidated EC2 module with for_each
module "ec2_east" {
  for_each = local.ec2_instances
  source   = "./modules/ec2"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  region_name        = "us-east-1"
  tier_name          = split("-", each.key)[0]

  vpc_id     = aws_vpc.east.id
  subnet_ids = each.value.subnet_type == "public" ? local.east_public_subnet_ids : local.east_private_subnet_ids

  ami_id               = each.value.ami_east
  instance_type        = each.value.instance_type
  iam_instance_profile = aws_iam_instance_profile.ec2[each.key].name
  user_data = templatefile("${path.module}/user_data/${each.value.user_data_template}.sh", {
    environment        = var.environment
    environment_suffix = var.environment_suffix
    region             = "us-east-1"
  })

  ingress_rules = local.security_group_rules[each.value.security_groups[0]]

  target_group_arns = lookup(local.target_group_mapping, each.key, [])

  min_size         = var.asg_configurations[split("-", each.key)[0]].min_size
  max_size         = var.asg_configurations[split("-", each.key)[0]].max_size
  desired_capacity = var.asg_configurations[split("-", each.key)[0]].desired_capacity

  tags = local.common_tags

  # Requirement 3: Dynamic provider (default provider for us-east-1)
  providers = {
    aws = aws
  }
}

module "ec2_west" {
  for_each = local.ec2_instances
  source   = "./modules/ec2"

  environment        = var.environment
  environment_suffix = var.environment_suffix
  region_name        = "us-west-2"
  tier_name          = split("-", each.key)[0]

  vpc_id     = aws_vpc.west.id
  subnet_ids = each.value.subnet_type == "public" ? local.west_public_subnet_ids : local.west_private_subnet_ids

  ami_id               = each.value.ami_west
  instance_type        = each.value.instance_type
  iam_instance_profile = aws_iam_instance_profile.ec2[each.key].name
  user_data = templatefile("${path.module}/user_data/${each.value.user_data_template}.sh", {
    environment        = var.environment
    environment_suffix = var.environment_suffix
    region             = "us-west-2"
  })

  ingress_rules = local.security_group_rules[each.value.security_groups[0]]

  target_group_arns = lookup(local.target_group_mapping_west, each.key, [])

  min_size         = var.asg_configurations[split("-", each.key)[0]].min_size
  max_size         = var.asg_configurations[split("-", each.key)[0]].max_size
  desired_capacity = var.asg_configurations[split("-", each.key)[0]].desired_capacity

  tags = local.common_tags

  # Requirement 3: Dynamic provider alias for us-west-2
  providers = {
    aws = aws.west
  }
}

# Requirement 2 & 4: Parameterized RDS module with for_each
# Split into separate blocks per region to support provider aliases
module "rds_east" {
  for_each = { for k, v in local.rds_clusters : k => v if v.region_key == "east" }
  source   = "./modules/rds"

  depends_on = [
    module.ec2_east,
    module.ec2_west
  ]

  environment        = var.environment
  environment_suffix = var.environment_suffix
  region_name        = local.regions["east"].name
  cluster_name       = each.key

  vpc_id     = aws_vpc.east.id
  subnet_ids = local.east_private_subnet_ids

  engine          = each.value.engine
  engine_version  = each.value.engine_version
  instance_class  = each.value.instance_class
  instance_count  = each.value.instance_count
  database_name   = each.value.database_name
  master_username = var.db_master_username
  master_password = var.enable_ssm_secrets ? data.aws_ssm_parameter.db_password[each.key].value : var.db_master_password

  allowed_security_groups = [
    module.ec2_east["app-primary"].security_group_id,
    module.ec2_west["app-primary"].security_group_id
  ]

  backup_retention_period = 7
  skip_final_snapshot     = false

  enabled_cloudwatch_logs_exports = each.value.engine == "aurora-mysql" ? ["audit", "error", "general", "slowquery"] : ["postgresql"]

  tags = local.common_tags

  # Requirement 3: Dynamic provider for us-east-1
  providers = {
    aws = aws
  }
}

module "rds_west" {
  for_each = { for k, v in local.rds_clusters : k => v if v.region_key == "west" }
  source   = "./modules/rds"

  depends_on = [
    module.ec2_east,
    module.ec2_west
  ]

  environment        = var.environment
  environment_suffix = var.environment_suffix
  region_name        = local.regions["west"].name
  cluster_name       = each.key

  vpc_id     = aws_vpc.west.id
  subnet_ids = local.west_private_subnet_ids

  engine          = each.value.engine
  engine_version  = each.value.engine_version
  instance_class  = each.value.instance_class
  instance_count  = each.value.instance_count
  database_name   = each.value.database_name
  master_username = var.db_master_username
  master_password = var.enable_ssm_secrets ? data.aws_ssm_parameter.db_password[each.key].value : var.db_master_password

  allowed_security_groups = [
    module.ec2_east["app-primary"].security_group_id,
    module.ec2_west["app-primary"].security_group_id
  ]

  backup_retention_period = 7
  skip_final_snapshot     = false

  enabled_cloudwatch_logs_exports = each.value.engine == "aurora-mysql" ? ["audit", "error", "general", "slowquery"] : ["postgresql"]

  tags = local.common_tags

  # Requirement 3: Dynamic provider alias for us-west-2
  providers = {
    aws = aws.west
  }
}

# IAM Instance Profiles for EC2
resource "aws_iam_role" "ec2" {
  for_each = local.ec2_instances

  name = "${var.environment}-${each.key}-role-${var.environment_suffix}"

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

resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  for_each = local.ec2_instances

  role       = aws_iam_role.ec2[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "ec2_cloudwatch" {
  for_each = local.ec2_instances

  role       = aws_iam_role.ec2[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "ec2" {
  for_each = local.ec2_instances

  name = "${var.environment}-${each.key}-profile-${var.environment_suffix}"
  role = aws_iam_role.ec2[each.key].name

  tags = local.common_tags
}

# Security group rules definitions
locals {
  security_group_rules = {
    web = [
      {
        from_port   = 80
        to_port     = 80
        protocol    = "tcp"
        cidr_blocks = ["0.0.0.0/0"]
        description = "HTTP from internet"
      },
      {
        from_port   = 443
        to_port     = 443
        protocol    = "tcp"
        cidr_blocks = ["0.0.0.0/0"]
        description = "HTTPS from internet"
      }
    ]
    app = [
      {
        from_port   = 8080
        to_port     = 8080
        protocol    = "tcp"
        cidr_blocks = [aws_vpc.east.cidr_block, aws_vpc.west.cidr_block]
        description = "Application port from VPC"
      }
    ]
  }

  # Target group mappings - empty if Load Balancers don't exist
  # Load Balancers should be created separately or provided via variables
  target_group_mapping = {
    # "web-primary" = []  # Add Load Balancer ARN here if available
  }

  target_group_mapping_west = {
    # "web-primary" = []  # Add Load Balancer ARN here if available
  }
}

# OPTIONAL: DynamoDB table for state locking
resource "aws_dynamodb_table" "terraform_locks" {
  count = var.enable_state_locking ? 1 : 0

  name         = "${var.environment_suffix}-terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.environment_suffix}-terraform-locks"
    }
  )
}

# OPTIONAL: SSM Parameter Store for secrets
resource "aws_ssm_parameter" "db_passwords" {
  for_each = var.enable_ssm_secrets ? local.rds_clusters : {}

  name        = "/${var.environment}/${each.key}/db_password"
  description = "Master password for ${each.key} RDS cluster"
  type        = "SecureString"
  value       = var.db_master_password

  tags = local.common_tags
}

data "aws_ssm_parameter" "db_password" {
  for_each = var.enable_ssm_secrets ? local.rds_clusters : {}

  name       = aws_ssm_parameter.db_passwords[each.key].name
  depends_on = [aws_ssm_parameter.db_passwords]
}

# OPTIONAL: CloudFront distribution for static assets
resource "aws_s3_bucket" "static_assets" {
  count = var.enable_cloudfront ? 1 : 0

  bucket = "${var.environment}-static-assets-${var.environment_suffix}"

  tags = local.common_tags
}

resource "aws_s3_bucket_versioning" "static_assets" {
  count = var.enable_cloudfront ? 1 : 0

  bucket = aws_s3_bucket.static_assets[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "static_assets" {
  count = var.enable_cloudfront ? 1 : 0

  bucket = aws_s3_bucket.static_assets[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_cloudfront_origin_access_control" "static_assets" {
  count = var.enable_cloudfront ? 1 : 0

  name                              = "${var.environment}-static-assets-${var.environment_suffix}"
  description                       = "OAC for static assets S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "static_assets" {
  count = var.enable_cloudfront ? 1 : 0

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront distribution for ${var.environment} static assets"
  default_root_object = "index.html"
  price_class         = var.cloudfront_price_class

  origin {
    domain_name              = aws_s3_bucket.static_assets[0].bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.static_assets[0].id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.static_assets[0].id
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.static_assets[0].id}"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = local.common_tags
}