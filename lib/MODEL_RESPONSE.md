I'll create a comprehensive multi-region Terraform setup for the Nova application that follows AWS best practices for security, scalability, and automation.

## File 1: `provider.tf`

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "aws_region" {
  description = "Default AWS region"
  type        = string
  default     = "us-east-1"
}

# Default provider
provider "aws" {
  region = var.aws_region
}

# Regional provider aliases
provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
}

provider "aws" {
  alias  = "us-west-2"
  region = "us-west-2"
}
```

---

## File 2: `main.tf`

```hcl
# Variables
variable "your_name" {
  description = "Your name for resource tagging"
  type        = string
  default     = "DevOps-Engineer"
}

variable "aws_regions" {
  description = "List of AWS regions to deploy to"
  type        = list(string)
  default     = ["us-east-1", "us-west-2"]
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# Locals for standardized tagging
locals {
  common_tags = {
    Owner   = var.your_name
    Purpose = "Nova Application Infrastructure"
    Project = "Nova"
  }

  # Map regions to provider aliases for easier reference
  region_providers = {
    "us-east-1" = "aws.us-east-1"
    "us-west-2" = "aws.us-west-2"
  }
}

# AMI Discovery - Latest Amazon Linux 2
data "aws_ami" "amazon_linux" {
  for_each = toset(var.aws_regions)

  provider    = aws.us-east-1
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Additional AMI data source for us-west-2
data "aws_ami" "amazon_linux_west" {
  provider    = aws.us-west-2
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# KMS Keys
resource "aws_kms_key" "nova_key" {
  for_each = toset(var.aws_regions)

  provider                = each.value == "us-east-1" ? aws.us-east-1 : aws.us-west-2
  description             = "KMS key for Nova application in ${each.value}"
  deletion_window_in_days = 10

  tags = merge(local.common_tags, {
    Name   = "nova-app-key-${each.value}"
    Region = each.value
  })
}

resource "aws_kms_alias" "nova_key_alias" {
  for_each = toset(var.aws_regions)

  provider      = each.value == "us-east-1" ? aws.us-east-1 : aws.us-west-2
  name          = "alias/nova-app-key"
  target_key_id = aws_kms_key.nova_key[each.value].key_id
}

# S3 Buckets
resource "aws_s3_bucket" "nova_data" {
  for_each = toset(var.aws_regions)

  provider = each.value == "us-east-1" ? aws.us-east-1 : aws.us-west-2
  bucket   = "nova-data-bucket-${data.aws_caller_identity.current.account_id}-${each.value}"

  tags = merge(local.common_tags, {
    Name   = "nova-data-bucket-${each.value}"
    Region = each.value
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "nova_data_encryption" {
  for_each = toset(var.aws_regions)

  provider = each.value == "us-east-1" ? aws.us-east-1 : aws.us-west-2
  bucket   = aws_s3_bucket.nova_data[each.value].id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.nova_key[each.value].arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "nova_data_pab" {
  for_each = toset(var.aws_regions)

  provider = each.value == "us-east-1" ? aws.us-east-1 : aws.us-west-2
  bucket   = aws_s3_bucket.nova_data[each.value].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM Role for EC2
resource "aws_iam_role" "nova_ec2_role" {
  name = "nova-ec2-role"

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

resource "aws_iam_role_policy" "nova_ec2_policy" {
  name = "nova-ec2-policy"
  role = aws_iam_role.nova_ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["s3:GetObject"]
        Resource = [
          for region in var.aws_regions : "${aws_s3_bucket.nova_data[region].arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "nova_ec2_profile" {
  name = "nova-ec2-profile"
  role = aws_iam_role.nova_ec2_role.name

  tags = local.common_tags
}

# EC2 Instances
resource "aws_instance" "nova_app" {
  for_each = toset(var.aws_regions)

  provider              = each.value == "us-east-1" ? aws.us-east-1 : aws.us-west-2
  ami                   = each.value == "us-east-1" ? data.aws_ami.amazon_linux["us-east-1"].id : data.aws_ami.amazon_linux_west.id
  instance_type         = "t3.micro"
  iam_instance_profile  = aws_iam_instance_profile.nova_ec2_profile.name
  associate_public_ip_address = true

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    kms_key_id            = aws_kms_key.nova_key[each.value].arn
    delete_on_termination = true
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y amazon-cloudwatch-agent
    echo "Nova application server in ${each.value}" > /var/log/nova-startup.log
  EOF
  )

  tags = merge(local.common_tags, {
    Name   = "nova-app-${each.value}"
    Region = each.value
  })
}

# AWS Config
resource "aws_config_configuration_recorder" "nova_recorder" {
  for_each = toset(var.aws_regions)

  provider = each.value == "us-east-1" ? aws.us-east-1 : aws.us-west-2
  name     = "nova-config-recorder"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = each.value == "us-east-1" ? true : false
  }
}

resource "aws_config_delivery_channel" "nova_delivery_channel" {
  for_each = toset(var.aws_regions)

  provider       = each.value == "us-east-1" ? aws.us-east-1 : aws.us-west-2
  name           = "nova-delivery-channel"
  s3_bucket_name = aws_s3_bucket.nova_data[each.value].bucket
}

resource "aws_iam_role" "config_role" {
  name = "nova-config-role"

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

resource "aws_iam_role_policy_attachment" "config_role_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

resource "aws_iam_role_policy" "config_s3_policy" {
  name = "nova-config-s3-policy"
  role = aws_iam_role.config_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:GetBucketAcl"]
        Resource = [
          for region in var.aws_regions : [
            aws_s3_bucket.nova_data[region].arn,
            "${aws_s3_bucket.nova_data[region].arn}/*"
          ]
        ]
      }
    ]
  })
}

# Config Rules
resource "aws_config_config_rule" "s3_bucket_server_side_encryption_enabled" {
  for_each = toset(var.aws_regions)

  provider = each.value == "us-east-1" ? aws.us-east-1 : aws.us-west-2
  name     = "s3-bucket-server-side-encryption-enabled"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.nova_recorder]

  tags = merge(local.common_tags, { Region = each.value })
}

resource "aws_config_config_rule" "encrypted_volumes" {
  for_each = toset(var.aws_regions)

  provider = each.value == "us-east-1" ? aws.us-east-1 : aws.us-west-2
  name     = "encrypted-volumes"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder.nova_recorder]

  tags = merge(local.common_tags, { Region = each.value })
}

resource "aws_config_config_rule" "iam_role_managed_policy_check" {
  for_each = toset(var.aws_regions)

  provider = each.value == "us-east-1" ? aws.us-east-1 : aws.us-west-2
  name     = "iam-role-managed-policy-check"

  source {
    owner             = "AWS"
    source_identifier = "IAM_ROLE_MANAGED_POLICY_CHECK"
  }

  input_parameters = jsonencode({
    managedPolicyArns = "arn:aws:iam::aws:policy/service-role/ConfigRole"
  })

  depends_on = [aws_config_configuration_recorder.nova_recorder]

  tags = merge(local.common_tags, { Region = each.value })
}

# Outputs
output "s3_bucket_names" {
  description = "Names of the S3 buckets created in each region"
  value = {
    for region in var.aws_regions : region => aws_s3_bucket.nova_data[region].bucket
  }
}

output "ec2_instance_ids" {
  description = "EC2 instance IDs in each region"
  value = {
    for region in var.aws_regions : region => aws_instance.nova_app[region].id
  }
}

output "kms_key_arns" {
  description = "KMS key ARNs in each region"
  value = {
    for region in var.aws_regions : region => aws_kms_key.nova_key[region].arn
  }
}

output "iam_role_arn" {
  description = "ARN of the IAM role for EC2 instances"
  value       = aws_iam_role.nova_ec2_role.arn
}
```

---

## Key Features & Best Practices

### Security

* Encryption at rest with KMS for EBS and S3
* IAM least privilege (S3 GetObject, CloudWatch logs)
* S3 public access blocked
* Compliance with AWS Config

### Scalability & Automation

* DRY with `for_each`
* Single `terraform apply` for multi-region deploy
* Regional isolation for critical resources
* Consistent tagging

### Operational Excellence

* Always up-to-date Amazon Linux 2 AMIs
* EC2 → CloudWatch logging enabled
* Continuous compliance monitoring
* Clear outputs for reference
