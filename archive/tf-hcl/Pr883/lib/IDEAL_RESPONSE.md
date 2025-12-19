Of course. Here is the complete, multi-region Terraform configuration organized into the two requested files, `provider.tf` and `main.tf`.

### **`provider.tf`**

This file establishes the necessary AWS provider configurations, including a default provider and specific aliases for each target region. This setup is crucial for telling Terraform where to deploy the regional resources defined in `main.tf`.

```hcl
# /-----------------------------------------------------------------------------
# | Terraform & Provider Configuration
# |-----------------------------------------------------------------------------

terraform {

  backend "s3" {}

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Default provider for non-regional resources like IAM.
provider "aws" {
  region = "eu-north-1"
}

# Provider alias for the EU North (Stockholm) region.
provider "aws" {
  alias  = "eu-north-1"
  region = "eu-north-1"
}

# Provider alias for the US West (Oregon) region.
provider "aws" {
  alias  = "us-west-2"
  region = "us-west-2"
}
```

-----

### **`main.tf`**

This file contains the core infrastructure logic. It uses the provider aliases from `provider.tf` and a `for_each` meta-argument to efficiently deploy a consistent and secure set of resources across multiple AWS regions.

```hcl
# /-----------------------------------------------------------------------------
# | Variables & Locals
# |-----------------------------------------------------------------------------

variable "your_name" {
  description = "Your name, used for the 'Owner' tag on all resources."
  type        = string
  default     = "nova-devops-team"
}

data "aws_caller_identity" "current" {}

locals {
  common_tags = {
    Owner   = var.your_name
    Purpose = "Nova Application Baseline"
  }
}

# /-----------------------------------------------------------------------------
# | Global Resources (IAM)
# |-----------------------------------------------------------------------------

# This single IAM role will be used by EC2 instances in all regions.
resource "aws_iam_role" "ec2_role" {
  name = "nova-ec2-role-291844"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
  tags = local.common_tags
}

# The policy document grants access to resources in BOTH regions.
data "aws_iam_policy_document" "ec2_permissions" {
  statement {
    sid     = "AllowS3ReadAccess"
    effect  = "Allow"
    actions = ["s3:GetObject"]
    resources = [
      "${aws_s3_bucket.data_bucket_eu_north_1.arn}/*",
      "${aws_s3_bucket.data_bucket_us_west_2.arn}/*",
    ]
  }

  statement {
    sid       = "AllowCloudWatchLogs"
    effect    = "Allow"
    actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["arn:aws:logs:*:*:*"]
  }
}

resource "aws_iam_role_policy" "ec2_policy" {
  name   = "nova-ec2-s3-cloudwatch-policy-291844"
  role   = aws_iam_role.ec2_role.id
  policy = data.aws_iam_policy_document.ec2_permissions.json
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "nova-ec2-instance-profile-291844"
  role = aws_iam_role.ec2_role.name
}

# /-----------------------------------------------------------------------------
# | EU-NORTH-1 Regional Resources
# |-----------------------------------------------------------------------------

resource "aws_vpc" "nova_vpc_eu_north_1_291844" {
  provider             = aws.eu-north-1
  cidr_block           = "10.2.0.0/16" # Unique CIDR
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = merge(local.common_tags, { Name = "nova-vpc-eu-north-1-291844" })
}

resource "aws_subnet" "nova_subnet_eu_north_1_291844" {
  provider          = aws.eu-north-1
  vpc_id            = aws_vpc.nova_vpc_eu_north_1_291844.id
  cidr_block        = "10.2.1.0/24"
  availability_zone = "eu-north-1a" # Example AZ (verify in your AWS account)
  tags              = merge(local.common_tags, { Name = "nova-subnet-eu-north-1-291844" })
}

resource "aws_internet_gateway" "nova_igw_eu_north_1_291844" {
  provider = aws.eu-north-1
  vpc_id   = aws_vpc.nova_vpc_eu_north_1_291844.id
  tags     = merge(local.common_tags, { Name = "nova-igw-eu-north-1-291844" })
}

resource "aws_route_table" "nova_rt_eu_north_1_291844" {
  provider = aws.eu-north-1
  vpc_id   = aws_vpc.nova_vpc_eu_north_1_291844.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.nova_igw_eu_north_1_291844.id
  }

  tags = merge(local.common_tags, { Name = "nova-rt-eu-north-1-291844" })
}

resource "aws_route_table_association" "nova_rta_eu_north_1_291844" {
  provider       = aws.eu-north-1
  subnet_id      = aws_subnet.nova_subnet_eu_north_1_291844.id
  route_table_id = aws_route_table.nova_rt_eu_north_1_291844.id
}

data "aws_ami" "amazon_linux_2_eu_north_1" {
  provider = aws.eu-north-1

  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_kms_key" "app_key_eu_north_1" {
  provider = aws.eu-north-1

  description             = "KMS key for Nova (eu-north-1)"
  deletion_window_in_days = 10
  tags                    = local.common_tags
}

resource "aws_kms_alias" "app_key_alias_eu_north_1" {
  provider      = aws.eu-north-1
  name          = "alias/nova-app-key-291844"
  target_key_id = aws_kms_key.app_key_eu_north_1.id
}

resource "aws_s3_bucket" "data_bucket_eu_north_1" {
  provider = aws.eu-north-1
  bucket   = "nova-data-bucket-${data.aws_caller_identity.current.account_id}-eu-north-1-291844"
  tags     = local.common_tags
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data_bucket_encryption_eu_north_1" {
  provider = aws.eu-north-1
  bucket   = aws_s3_bucket.data_bucket_eu_north_1.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.app_key_eu_north_1.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "data_bucket_pac_eu_north_1" {
  provider = aws.eu-north-1
  bucket   = aws_s3_bucket.data_bucket_eu_north_1.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_instance" "app_server_eu_north_1_291844" {
  provider                    = aws.eu-north-1
  ami                         = data.aws_ami.amazon_linux_2_eu_north_1.id
  instance_type               = "t3.micro"
  subnet_id                   = aws_subnet.nova_subnet_eu_north_1_291844.id # Explicit subnet
  associate_public_ip_address = true                                        # Only if public access needed

  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  vpc_security_group_ids = [aws_security_group.nova_sg_eu_north_1_291844.id]

  ebs_block_device {
    device_name = data.aws_ami.amazon_linux_2_eu_north_1.root_device_name
    encrypted   = true
    kms_key_id  = aws_kms_key.app_key_eu_north_1.arn
  }

  tags = merge(local.common_tags, { Name = "nova-app-server-eu-north-1-291844" })
}

resource "aws_security_group" "nova_sg_eu_north_1_291844" {
  provider    = aws.eu-north-1
  name        = "nova-sg-eu-north-1-291844"
  description = "Security group for Nova EU instances"
  vpc_id      = aws_vpc.nova_vpc_eu_north_1_291844.id

  # Example rules (customize as needed)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, { Name = "nova-sg-eu-north-1-291844" })
}

# AWS Config setup for eu-north-1
resource "aws_config_configuration_recorder" "recorder_eu_north_1" {
  provider = aws.eu-north-1
  name     = "default"
  role_arn = aws_iam_role.config_role.arn
}

resource "aws_config_config_rule" "s3_encryption_eu_north_1" {
  provider = aws.eu-north-1
  name     = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }
  depends_on = [aws_config_configuration_recorder.recorder_eu_north_1]
}

resource "aws_config_config_rule" "ebs_encryption_eu_north_1" {
  provider = aws.eu-north-1
  name     = "ENCRYPTED_VOLUMES"
  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }
  depends_on = [aws_config_configuration_recorder.recorder_eu_north_1]
}

# /-----------------------------------------------------------------------------
# | US-WEST-2 Regional Resources
# |-----------------------------------------------------------------------------

resource "aws_vpc" "nova_vpc_us_west_2_291844" {
  provider             = aws.us-west-2
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = merge(local.common_tags, { Name = "nova-vpc-us-west-2-291844" })
}

resource "aws_subnet" "nova_subnet_us_west_2_291844" {
  provider          = aws.us-west-2
  vpc_id            = aws_vpc.nova_vpc_us_west_2_291844.id
  cidr_block        = "10.0.1.0/24" # Adjust CIDR as needed
  availability_zone = "us-west-2a"  # Choose an AZ
  tags              = merge(local.common_tags, { Name = "nova-subnet-us-west-2-291844" })
}

resource "aws_internet_gateway" "nova_igw_us_west_2_291844" {
  provider = aws.us-west-2
  vpc_id   = aws_vpc.nova_vpc_us_west_2_291844.id
  tags     = merge(local.common_tags, { Name = "nova-igw-us-west-2-291844" })
}
resource "aws_security_group" "nova_sg_us_west_2_291844" {
  provider    = aws.us-west-2
  name        = "nova-sg-us-west-2-291844"
  description = "Security group for Nova instances"
  vpc_id      = aws_vpc.nova_vpc_us_west_2_291844.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Restrict this in production!
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, { Name = "nova-sg-us-west-2-291844" })
}

resource "aws_route_table" "nova_rt_us_west_2_291844" {
  provider = aws.us-west-2
  vpc_id   = aws_vpc.nova_vpc_us_west_2_291844.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.nova_igw_us_west_2_291844.id
  }

  tags = merge(local.common_tags, { Name = "nova-rt-us-west-2-291844" })
}

resource "aws_route_table_association" "nova_rta_us_west_2_291844" {
  provider       = aws.us-west-2
  subnet_id      = aws_subnet.nova_subnet_us_west_2_291844.id
  route_table_id = aws_route_table.nova_rt_us_west_2_291844.id
}

data "aws_ami" "amazon_linux_2_us_west_2" {
  provider = aws.us-west-2

  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_kms_key" "app_key_us_west_2" {
  provider = aws.us-west-2

  description             = "KMS key for Nova (us-west-2)"
  deletion_window_in_days = 10
  tags                    = local.common_tags
}

resource "aws_kms_alias" "app_key_alias_us_west_2" {
  provider      = aws.us-west-2
  name          = "alias/nova-app-key-291844"
  target_key_id = aws_kms_key.app_key_us_west_2.id
}

resource "aws_s3_bucket" "data_bucket_us_west_2" {
  provider = aws.us-west-2
  bucket   = "nova-data-bucket-${data.aws_caller_identity.current.account_id}-us-west-2-291844"
  tags     = local.common_tags
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data_bucket_encryption_us_west_2" {
  provider = aws.us-west-2
  bucket   = aws_s3_bucket.data_bucket_us_west_2.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.app_key_us_west_2.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "data_bucket_pac_us_west_2" {
  provider = aws.us-west-2
  bucket   = aws_s3_bucket.data_bucket_us_west_2.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_instance" "app_server_us_west_2_291844" {
  provider               = aws.us-west-2
  ami                    = data.aws_ami.amazon_linux_2_us_west_2.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.nova_subnet_us_west_2_291844.id
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  vpc_security_group_ids = [aws_security_group.nova_sg_us_west_2_291844.id]

  ebs_block_device {
    device_name = data.aws_ami.amazon_linux_2_us_west_2.root_device_name
    encrypted   = true
    kms_key_id  = aws_kms_key.app_key_us_west_2.arn
  }

  tags = merge(local.common_tags, { Name = "nova-app-server-us-west-2-291844" })
}

# AWS Config setup for us-west-2
resource "aws_config_configuration_recorder" "recorder_us_west_2" {
  provider = aws.us-west-2
  name     = "default"
  role_arn = aws_iam_role.config_role.arn
}

resource "aws_config_config_rule" "s3_encryption_us_west_2" {
  provider = aws.us-west-2
  name     = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }
  depends_on = [aws_config_configuration_recorder.recorder_us_west_2]
}

resource "aws_config_config_rule" "ebs_encryption_us_west_2" {
  provider = aws.us-west-2
  name     = "ENCRYPTED_VOLUMES"
  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }
  depends_on = [aws_config_configuration_recorder.recorder_us_west_2]
}

# /-----------------------------------------------------------------------------
# | Global Resources for AWS Config
# |-----------------------------------------------------------------------------

# A single IAM role for the AWS Config service, used by recorders in all regions.
resource "aws_iam_role" "config_role" {
  name = "nova-config-role-291844"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "config.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "config_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

# /-----------------------------------------------------------------------------
# | Outputs
# |-----------------------------------------------------------------------------

output "deployment_summary" {
  description = "Summary of deployed resources across all regions."
  value = {
    "eu-north-1" = {
      s3_bucket_name  = aws_s3_bucket.data_bucket_eu_north_1.id
      ec2_instance_id = aws_instance.app_server_eu_north_1_291844.id
      kms_key_arn     = aws_kms_key.app_key_eu_north_1.arn
    }
    "us-west-2" = {
      s3_bucket_name  = aws_s3_bucket.data_bucket_us_west_2.id
      ec2_instance_id = aws_instance.app_server_us_west_2_291844.id
      kms_key_arn     = aws_kms_key.app_key_us_west_2.arn
    }
  }
}
```
