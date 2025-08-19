I'll help you build a solid multi-region AWS foundation for Nova. Let me create both files with best practices, proper security, and clean organization.

## `provider.tf`

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

# Regional providers with aliases
provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
}

provider "aws" {
  alias  = "us-west-2"
  region = "us-west-2"
}
```

## `main.tf`

```hcl
# Variables
variable "your_name" {
  description = "Your name for resource tagging"
  type        = string
  default     = "Nova-Admin"
}

variable "aws_regions" {
  description = "List of AWS regions to deploy to"
  type        = list(string)
  default     = ["us-east-1", "us-west-2"]
}

# Data sources
data "aws_caller_identity" "current" {}

# Local values for consistent tagging and configuration
locals {
  account_id = data.aws_caller_identity.current.account_id

  common_tags = {
    Owner   = var.your_name
    Purpose = "Nova Multi-Region Foundation"
    Project = "Nova"
  }

  # Map regions to provider aliases for cleaner resource creation
  region_providers = {
    "us-east-1" = aws.us-east-1
    "us-west-2" = aws.us-west-2
  }
}

# Find latest Amazon Linux 2 AMI in each region
data "aws_ami" "amazon_linux" {
  for_each = toset(var.aws_regions)

  provider    = local.region_providers[each.value]
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

# KMS Keys for regional encryption
resource "aws_kms_key" "nova_key" {
  for_each = toset(var.aws_regions)

  provider                = local.region_providers[each.value]
  description             = "Nova application encryption key for ${each.value}"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name   = "nova-app-key-${each.value}"
    Region = each.value
  })
}

resource "aws_kms_alias" "nova_key_alias" {
  for_each = toset(var.aws_regions)

  provider      = local.region_providers[each.value]
  name          = "alias/nova-app-key"
  target_key_id = aws_kms_key.nova_key[each.value].key_id
}

# S3 Buckets with encryption and public access blocking
resource "aws_s3_bucket" "nova_data" {
  for_each = toset(var.aws_regions)

  provider = local.region_providers[each.value]
  bucket   = "nova-data-bucket-${local.account_id}-${each.value}"

  tags = merge(local.common_tags, {
    Name   = "nova-data-bucket-${each.value}"
    Region = each.value
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "nova_data_encryption" {
  for_each = toset(var.aws_regions)

  provider = local.region_providers[each.value]
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

  provider = local.region_providers[each.value]
  bucket   = aws_s3_bucket.nova_data[each.value].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "nova_data_versioning" {
  for_each = toset(var.aws_regions)

  provider = local.region_providers[each.value]
  bucket   = aws_s3_bucket.nova_data[each.value].id

  versioning_configuration {
    status = "Enabled"
  }
}

# IAM Role for EC2 instances (global resource)
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

# IAM Policy for S3 read access and CloudWatch Logs
resource "aws_iam_role_policy" "nova_ec2_policy" {
  name = "nova-ec2-policy"
  role = aws_iam_role.nova_ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          for region in var.aws_regions : [
            aws_s3_bucket.nova_data[region].arn,
            "${aws_s3_bucket.nova_data[region].arn}/*"
          ]
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
        Resource = "arn:aws:logs:*:${local.account_id}:*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "nova_ec2_profile" {
  name = "nova-ec2-profile"
  role = aws_iam_role.nova_ec2_role.name

  tags = local.common_tags
}

# EC2 Instances in each region
resource "aws_instance" "nova_instance" {
  for_each = toset(var.aws_regions)

  provider                    = local.region_providers[each.value]
  ami                        = data.aws_ami.amazon_linux[each.value].id
  instance_type              = "t3.micro"
  iam_instance_profile       = aws_iam_instance_profile.nova_ec2_profile.name
  associate_public_ip_address = true

  root_block_device {
    volume_type = "gp3"
    volume_size = 8
    encrypted   = true
    kms_key_id  = aws_kms_key.nova_key[each.value].arn
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y awscli

    # Install CloudWatch agent
    yum install -y amazon-cloudwatch-agent

    # Create a simple log file
    echo "Nova instance started in ${each.value} at $(date)" >> /var/log/nova.log

    # Set up CloudWatch agent config
    cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOL'
    {
      "logs": {
        "logs_collected": {
          "files": {
            "collect_list": [
              {
                "file_path": "/var/log/nova.log",
                "log_group_name": "/aws/ec2/nova",
                "log_stream_name": "{instance_id}-${each.value}"
              }
            ]
          }
        }
      }
    }
    EOL

    # Start CloudWatch agent
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
      -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
  EOF
  )

  tags = merge(local.common_tags, {
    Name   = "nova-instance-${each.value}"
    Region = each.value
  })
}

# AWS Config Configuration Recorder (required for Config Rules)
resource "aws_config_configuration_recorder" "nova_recorder" {
  for_each = toset(var.aws_regions)

  provider = local.region_providers[each.value]
  name     = "nova-config-recorder"
  role_arn = aws_iam_role.nova_config_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = each.value == "us-east-1" ? true : false
  }

  depends_on = [aws_config_delivery_channel.nova_delivery_channel]
}

# AWS Config Delivery Channel
resource "aws_config_delivery_channel" "nova_delivery_channel" {
  for_each = toset(var.aws_regions)

  provider       = local.region_providers[each.value]
  name           = "nova-delivery-channel"
  s3_bucket_name = aws_s3_bucket.nova_config[each.value].bucket
}

# S3 bucket for AWS Config
resource "aws_s3_bucket" "nova_config" {
  for_each = toset(var.aws_regions)

  provider      = local.region_providers[each.value]
  bucket        = "nova-config-bucket-${local.account_id}-${each.value}"
  force_destroy = true

  tags = merge(local.common_tags, {
    Name   = "nova-config-bucket-${each.value}"
    Region = each.value
  })
}

resource "aws_s3_bucket_policy" "nova_config_bucket_policy" {
  for_each = toset(var.aws_regions)

  provider = local.region_providers[each.value]
  bucket   = aws_s3_bucket.nova_config[each.value].id

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
        Resource = aws_s3_bucket.nova_config[each.value].arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = local.account_id
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
        Resource = aws_s3_bucket.nova_config[each.value].arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = local.account_id
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
        Resource = "${aws_s3_bucket.nova_config[each.value].arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
            "AWS:SourceAccount" = local.account_id
          }
        }
      }
    ]
  })
}

# IAM Role for AWS Config
resource "aws_iam_role" "nova_config_role" {
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

resource "aws_iam_role_policy_attachment" "nova_config_role_policy" {
  role       = aws_iam_role.nova_config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

# AWS Config Rules
resource "aws_config_config_rule" "s3_bucket_server_side_encryption_enabled" {
  for_each = toset(var.aws_regions)

  provider = local.region_providers[each.value]
  name     = "s3-bucket-server-side-encryption-enabled"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.nova_recorder]

  tags = merge(local.common_tags, {
    Name   = "s3-encryption-rule-${each.value}"
    Region = each.value
  })
}

resource "aws_config_config_rule" "encrypted_volumes" {
  for_each = toset(var.aws_regions)

  provider = local.region_providers[each.value]
  name     = "encrypted-volumes"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder.nova_recorder]

  tags = merge(local.common_tags, {
    Name   = "encrypted-volumes-rule-${each.value}"
    Region = each.value
  })
}

resource "aws_config_config_rule" "iam_role_managed_policy_check" {
  for_each = toset(var.aws_regions)

  provider = local.region_providers[each.value]
  name     = "iam-role-managed-policy-check"

  source {
    owner             = "AWS"
    source_identifier = "IAM_ROLE_MANAGED_POLICY_CHECK"
  }

  input_parameters = jsonencode({
    managedPolicyArns = "arn:aws:iam::aws:policy/service-role/ConfigRole"
  })

  depends_on = [aws_config_configuration_recorder.nova_recorder]

  tags = merge(local.common_tags, {
    Name   = "iam-policy-rule-${each.value}"
    Region = each.value
  })
}

# Outputs
output "nova_infrastructure" {
  description = "Nova infrastructure details by region"
  value = {
    for region in var.aws_regions : region => {
      s3_bucket_name = aws_s3_bucket.nova_data[region].bucket
      instance_id    = aws_instance.nova_instance[region].id
      kms_key_arn    = aws_kms_key.nova_key[region].arn
      kms_key_alias  = aws_kms_alias.nova_key_alias[region].name
    }
  }
}

output "global_resources" {
  description = "Global Nova resources"
  value = {
    iam_role_arn     = aws_iam_role.nova_ec2_role.arn
    iam_profile_name = aws_iam_instance_profile.nova_ec2_profile.name
    account_id       = local.account_id
  }
}
```

## Key Features & Best Practices Implemented:

### **Security & Compliance:**
- ✅ **Encryption everywhere**: KMS keys for EBS volumes and S3 buckets
- ✅ **S3 security**: Public access blocked, versioning enabled
- ✅ **IAM least privilege**: Minimal permissions for EC2 instances
- ✅ **AWS Config rules**: Monitoring encryption and IAM compliance

### **Multi-Region Architecture:**
- ✅ **DRY principle**: Single `for_each` loop manages all regional resources
- ✅ **Provider aliases**: Clean separation of regional deployments
- ✅ **Dynamic AMI lookup**: Always uses latest Amazon Linux 2

### **Operational Excellence:**
- ✅ **Consistent tagging**: Standardized tags across all resources
- ✅ **CloudWatch integration**: Automated logging setup via user data
- ✅ **Resource naming**: Predictable, globally unique names
- ✅ **Comprehensive outputs**: All essential resource information

### **Cost Optimization:**
- ✅ **Right-sizing**: t3.micro instances for baseline workloads
- ✅ **Storage efficiency**: GP3 volumes with appropriate sizing
- ✅ **KMS key rotation**: Automated security with cost awareness

## Usage:

1. **Initialize Terraform:**
   ```bash
   terraform init
   ```

2. **Plan deployment:**
   ```bash
   terraform plan -var="your_name=YourName"
   ```

3. **Deploy infrastructure:**
   ```bash
   terraform apply -var="your_name=YourName"
   ```

This foundation gives you a secure, compliant, and scalable starting point for Nova that you can build upon as your requirements grow!
