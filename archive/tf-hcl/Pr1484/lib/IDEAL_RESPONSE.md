# Infrastructure as Code Solution

## Terraform Configuration Files


### provider.tf

```hcl
# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
provider "aws" {
  alias  = "us_east_2"
  region = "us-east-2"
}

provider "aws" {
  alias  = "us_west_1"
  region = "us-west-1"
}
```


### tap_stack.tf

```hcl
# tap_stack.tf - Complete Infrastructure Stack for Multi-Region Deployment
# ==========================================================
# = VARIABLES =
variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}
variable "aws_region" {
  description = "Default AWS region for primary resources"
  type        = string
  default     = "us-east-2"
}
variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-2"
}
variable "secondary_region" {
  description = "Secondary AWS region"
  type        = string
  default     = "us-west-1"
}
variable "primary_vpc_cidr" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}
variable "secondary_vpc_cidr" {
  description = "CIDR block for secondary VPC"
  type        = string
  default     = "10.1.0.0/16"
}
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}
variable "domain_name" {
  description = "Domain name for Route53 failover"
  type        = string
  default     = "example1484.com"
}
variable "subdomain" {
  description = "Subdomain for failover record"
  type        = string
  default     = "app"
}

# = LOCALS =
locals {
  common_tags = {
    Environment = var.environment
    Project     = "tap-stack"
    ManagedBy   = "terraform"
  }
  primary_azs            = ["${var.primary_region}a", "${var.primary_region}b"]
  secondary_azs          = ["${var.secondary_region}a", "${var.secondary_region}c"]
  primary_public_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  primary_private_subnets= ["10.0.10.0/24", "10.0.11.0/24"]
  secondary_public_subnets = ["10.1.1.0/24", "10.1.2.0/24"]
  secondary_private_subnets= ["10.1.10.0/24", "10.1.11.0/24"]
}

# = DATA SOURCES =
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}
data "aws_ami" "amazon_linux_secondary" {
  provider    = aws.us_west_1
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# = RANDOM RESOURCES =
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# = PRIMARY REGION RESOURCES =
resource "aws_vpc" "primary" {
  provider             = aws.us_east_2
  cidr_block           = var.primary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = merge(local.common_tags, {
    Name   = "${var.environment}-primary-vpc"
    Region = var.primary_region
  })
}
resource "aws_internet_gateway" "primary" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.primary.id
  tags = merge(local.common_tags, {
    Name = "${var.environment}-primary-igw"
  })
}
resource "aws_subnet" "primary_public" {
  provider          = aws.us_east_2
  count             = 2
  vpc_id            = aws_vpc.primary.id
  cidr_block        = local.primary_public_subnets[count.index]
  availability_zone = local.primary_azs[count.index]
  map_public_ip_on_launch = true
  tags = merge(local.common_tags, {
    Name = "${var.environment}-primary-public-${count.index + 1}"
    Type = "public"
  })
}
resource "aws_subnet" "primary_private" {
  provider          = aws.us_east_2
  count             = 2
  vpc_id            = aws_vpc.primary.id
  cidr_block        = local.primary_private_subnets[count.index]
  availability_zone = local.primary_azs[count.index]
  tags = merge(local.common_tags, {
    Name = "${var.environment}-primary-private-${count.index + 1}"
    Type = "private"
  })
}
resource "aws_eip" "primary_nat" {
  provider = aws.us_east_2
  count  = 2
  domain = "vpc"
  tags = merge(local.common_tags, {
    Name = "${var.environment}-primary-nat-eip-${count.index + 1}"
  })
}
resource "aws_nat_gateway" "primary" {
  provider      = aws.us_east_2
  count         = 2
  allocation_id = aws_eip.primary_nat[count.index].id
  subnet_id     = aws_subnet.primary_public[count.index].id
  tags = merge(local.common_tags, {
    Name = "${var.environment}-primary-nat-${count.index + 1}"
  })
  depends_on = [aws_internet_gateway.primary]
}
resource "aws_route_table" "primary_public" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.primary.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }
  tags = merge(local.common_tags, {
    Name = "${var.environment}-primary-public-rt"
  })
}
resource "aws_route_table" "primary_private" {
  provider = aws.us_east_2
  count    = 2
  vpc_id   = aws_vpc.primary.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary[count.index].id
  }
  tags = merge(local.common_tags, {
    Name = "${var.environment}-primary-private-rt-${count.index + 1}"
  })
}
resource "aws_route_table_association" "primary_public" {
  provider        = aws.us_east_2
  count           = 2
  subnet_id       = aws_subnet.primary_public[count.index].id
  route_table_id  = aws_route_table.primary_public.id
}
resource "aws_route_table_association" "primary_private" {
  provider        = aws.us_east_2
  count           = 2
  subnet_id       = aws_subnet.primary_private[count.index].id
  route_table_id  = aws_route_table.primary_private[count.index].id
}

# = SECONDARY REGION RESOURCES =
resource "aws_vpc" "secondary" {
  provider             = aws.us_west_1
  cidr_block           = var.secondary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = merge(local.common_tags, {
    Name   = "${var.environment}-secondary-vpc"
    Region = var.secondary_region
  })
}
resource "aws_internet_gateway" "secondary" {
  provider = aws.us_west_1
  vpc_id   = aws_vpc.secondary.id
  tags = merge(local.common_tags, {
    Name = "${var.environment}-secondary-igw"
  })
}
resource "aws_subnet" "secondary_public" {
  provider          = aws.us_west_1
  count             = 2
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = local.secondary_public_subnets[count.index]
  availability_zone = local.secondary_azs[count.index]
  map_public_ip_on_launch = true
  tags = merge(local.common_tags, {
    Name = "${var.environment}-secondary-public-${count.index + 1}"
    Type = "public"
  })
}
resource "aws_subnet" "secondary_private" {
  provider          = aws.us_west_1
  count             = 2
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = local.secondary_private_subnets[count.index]
  availability_zone = local.secondary_azs[count.index]
  tags = merge(local.common_tags, {
    Name = "${var.environment}-secondary-private-${count.index + 1}"
    Type = "private"
  })
}
resource "aws_eip" "secondary_nat" {
  provider = aws.us_west_1
  count    = 2
  domain   = "vpc"
  tags = merge(local.common_tags, {
    Name = "${var.environment}-secondary-nat-eip-${count.index + 1}"
  })
}
resource "aws_nat_gateway" "secondary" {
  provider      = aws.us_west_1
  count         = 2
  allocation_id = aws_eip.secondary_nat[count.index].id
  subnet_id     = aws_subnet.secondary_public[count.index].id
  tags = merge(local.common_tags, {
    Name = "${var.environment}-secondary-nat-${count.index + 1}"
  })
  depends_on = [aws_internet_gateway.secondary]
}
resource "aws_route_table" "secondary_public" {
  provider = aws.us_west_1
  vpc_id   = aws_vpc.secondary.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }
  tags = merge(local.common_tags, {
    Name = "${var.environment}-secondary-public-rt"
  })
}
resource "aws_route_table" "secondary_private" {
  provider = aws.us_west_1
  count    = 2
  vpc_id   = aws_vpc.secondary.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary[count.index].id
  }
  tags = merge(local.common_tags, {
    Name = "${var.environment}-secondary-private-rt-${count.index + 1}"
  })
}
resource "aws_route_table_association" "secondary_public" {
  provider       = aws.us_west_1
  count          = 2
  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}
resource "aws_route_table_association" "secondary_private" {
  provider       = aws.us_west_1
  count          = 2
  subnet_id      = aws_subnet.secondary_private[count.index].id
  route_table_id = aws_route_table.secondary_private[count.index].id
}

# = VPC PEERING =
resource "aws_vpc_peering_connection" "primary_to_secondary" {
  provider        = aws.us_east_2
  vpc_id          = aws_vpc.primary.id
  peer_vpc_id     = aws_vpc.secondary.id
  peer_region     = var.secondary_region
  auto_accept     = false
  tags = merge(local.common_tags, {
    Name = "${var.environment}-vpc-peering"
  })
}
resource "aws_vpc_peering_connection_accepter" "secondary" {
  provider                   = aws.us_west_1
  vpc_peering_connection_id  = aws_vpc_peering_connection.primary_to_secondary.id
  auto_accept               = true
  tags = merge(local.common_tags, {
    Name = "${var.environment}-vpc-peering-accepter"
  })
}
resource "aws_route" "primary_public_to_secondary" {
  provider                  = aws.us_east_2
  route_table_id            = aws_route_table.primary_public.id
  destination_cidr_block    = var.secondary_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
}
resource "aws_route" "primary_private_to_secondary" {
  provider                  = aws.us_east_2
  count                     = 2
  route_table_id            = aws_route_table.primary_private[count.index].id
  destination_cidr_block    = var.secondary_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
}
resource "aws_route" "secondary_public_to_primary" {
  provider                  = aws.us_west_1
  route_table_id            = aws_route_table.secondary_public.id
  destination_cidr_block    = var.primary_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
}
resource "aws_route" "secondary_private_to_primary" {
  provider                  = aws.us_west_1
  count                     = 2
  route_table_id            = aws_route_table.secondary_private[count.index].id
  destination_cidr_block    = var.primary_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
}

# = SECURITY GROUPS =
resource "aws_security_group" "primary_ec2" {
  provider    = aws.us_east_2
  name_prefix = "${var.environment}-primary-ec2-"
  vpc_id      = aws_vpc.primary.id
  description = "Security group for primary EC2 instances"
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.primary_vpc_cidr, var.secondary_vpc_cidr]
  }
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.primary_vpc_cidr, var.secondary_vpc_cidr]
  }
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.primary_vpc_cidr, var.secondary_vpc_cidr]
  }
  ingress {
    from_port   = -1
    to_port     = -1
    protocol    = "icmp"
    cidr_blocks = [var.primary_vpc_cidr, var.secondary_vpc_cidr]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = merge(local.common_tags, {
    Name = "${var.environment}-primary-ec2-sg"
  })
}
resource "aws_security_group" "secondary_ec2" {
  provider    = aws.us_west_1
  name_prefix = "${var.environment}-secondary-ec2-"
  vpc_id      = aws_vpc.secondary.id
  description = "Security group for secondary EC2 instances"
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.primary_vpc_cidr, var.secondary_vpc_cidr]
  }
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.primary_vpc_cidr, var.secondary_vpc_cidr]
  }
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.primary_vpc_cidr, var.secondary_vpc_cidr]
  }
  ingress {
    from_port   = -1
    to_port     = -1
    protocol    = "icmp"
    cidr_blocks = [var.primary_vpc_cidr, var.secondary_vpc_cidr]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = merge(local.common_tags, {
    Name = "${var.environment}-secondary-ec2-sg"
  })
}

# = IAM ROLES AND POLICIES =
resource "aws_iam_role" "ec2_role" {
  name = "${var.environment}-ec2-role-1484"
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
resource "aws_iam_policy" "ec2_cloudwatch_policy" {
  name        = "${var.environment}-ec2-cloudwatch-policy"
  description = "Policy for EC2 CloudWatch monitoring"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = [
        "cloudwatch:PutMetricData",
        "ec2:DescribeVolumes",
        "ec2:DescribeTags",
        "logs:PutLogEvents",
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:DescribeLogStreams",
        "logs:DescribeLogGroups"
      ]
      Resource = "*"
    }]
  })
  tags = local.common_tags
}
resource "aws_iam_role_policy_attachment" "ec2_cloudwatch_attach" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_cloudwatch_policy.arn
}
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.environment}-ec2-profile-1484"
  role = aws_iam_role.ec2_role.name
  tags = local.common_tags
}

# = KMS KEYS FOR ENCRYPTION =
resource "aws_kms_key" "primary" {
  provider                = aws.us_east_2
  description             = "KMS key for primary region encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  tags = merge(local.common_tags, {
    Name = "${var.environment}-primary-kms-key"
  })
}
resource "aws_kms_alias" "primary" {
  provider      = aws.us_east_2
  name          = "alias/${var.environment}-primary-key"
  target_key_id = aws_kms_key.primary.key_id
}
resource "aws_kms_key" "secondary" {
  provider                = aws.us_west_1
  description             = "KMS key for secondary region encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  tags = merge(local.common_tags, {
    Name = "${var.environment}-secondary-kms-key"
  })
}
resource "aws_kms_alias" "secondary" {
  provider      = aws.us_west_1
  name          = "alias/${var.environment}-secondary-key"
  target_key_id = aws_kms_key.secondary.key_id
}

# = S3 BUCKET WITH CROSS-REGION REPLICATION =
resource "aws_s3_bucket" "primary" {
  provider = aws.us_east_2
  bucket   = "${var.environment}-tap-stack-primary-${random_string.bucket_suffix.result}"
  tags = merge(local.common_tags, {
    Name = "${var.environment}-primary-bucket"
  })
}
resource "aws_s3_bucket" "secondary" {
  provider = aws.us_west_1
  bucket   = "${var.environment}-tap-stack-secondary-${random_string.bucket_suffix.result}"
  tags     = merge(local.common_tags, {
    Name = "${var.environment}-secondary-bucket"
  })
}
resource "aws_s3_bucket_versioning" "primary" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.primary.id
  versioning_configuration {
    status = "Enabled"
  }
}
resource "aws_s3_bucket_versioning" "secondary" {
  provider = aws.us_west_1
  bucket   = aws_s3_bucket.secondary.id
  versioning_configuration {
    status = "Enabled"
  }
}
resource "aws_s3_bucket_server_side_encryption_configuration" "primary" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.primary.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.primary.arn
      sse_algorithm     = "aws:kms"
    }
  }
}
resource "aws_s3_bucket_server_side_encryption_configuration" "secondary" {
  provider = aws.us_west_1
  bucket   = aws_s3_bucket.secondary.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.secondary.arn
      sse_algorithm     = "aws:kms"
    }
  }
}
resource "aws_s3_bucket_public_access_block" "primary" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.primary.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
resource "aws_s3_bucket_public_access_block" "secondary" {
  provider = aws.us_west_1
  bucket   = aws_s3_bucket.secondary.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
resource "aws_iam_role" "s3_replication" {
  name = "${var.environment}-s3-replication-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "s3.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
  tags = local.common_tags
}
resource "aws_iam_policy" "s3_replication" {
  name        = "${var.environment}-s3-replication-policy"
  description = "Policy for S3 cross-region replication"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = "${aws_s3_bucket.primary.arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = aws_s3_bucket.primary.arn
      },
      {
        Effect   = "Allow"
        Action   = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = "${aws_s3_bucket.secondary.arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.primary.arn,
          aws_kms_key.secondary.arn
        ]
      }
    ]
  })
  tags = local.common_tags
}
resource "aws_iam_role_policy_attachment" "s3_replication_attach" {
  role       = aws_iam_role.s3_replication.name
  policy_arn = aws_iam_policy.s3_replication.arn
}
resource "aws_s3_bucket_replication_configuration" "primary" {
  provider = aws.us_east_2
  role     = aws_iam_role.s3_replication.arn
  bucket   = aws_s3_bucket.primary.id
  rule {
    id     = "ReplicateToSecondary"
    status = "Enabled"
    destination {
      bucket         = aws_s3_bucket.secondary.arn
      storage_class  = "STANDARD"
      encryption_configuration {
        replica_kms_key_id = aws_kms_key.secondary.arn
      }
    }
    source_selection_criteria {
      sse_kms_encrypted_objects {
        status = "Enabled"
      }
    }
  }
  depends_on = [aws_s3_bucket_versioning.primary]
}

# = EC2 INSTANCES =
resource "aws_instance" "primary" {
  provider               = aws.us_east_2
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.primary_private[0].id
  vpc_security_group_ids = [aws_security_group.primary_ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    kms_key_id            = aws_kms_key.primary.arn
    delete_on_termination = true
  }
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y amazon-cloudwatch-agent
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Primary Region Server - ${var.primary_region}</h1>" > /var/www/html/index.html
    echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
    echo "<p>Region: ${var.primary_region}</p>" >> /var/www/html/index.html
    cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOL'
    {
      "metrics": {
        "namespace": "CWAgent",
        "metrics_collected": {
          "cpu": {
            "measurement": [
              "cpu_usage_idle",
              "cpu_usage_iowait",
              "cpu_usage_user",
              "cpu_usage_system"
            ],
            "metrics_collection_interval": 60
          },
          "disk": {
            "measurement": [
              "used_percent"
            ],
            "metrics_collection_interval": 60,
            "resources": ["*"]
          },
          "mem": {
            "measurement": [
              "mem_used_percent"
            ],
            "metrics_collection_interval": 60
          }
        }
      }
    }
    EOL
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
  EOF
  )
  tags = merge(local.common_tags, {
    Name   = "${var.environment}-primary-ec2"
    Region = var.primary_region
  })
}
resource "aws_instance" "secondary" {
  provider               = aws.us_west_1
  ami                    = data.aws_ami.amazon_linux_secondary.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.secondary_private[0].id
  vpc_security_group_ids = [aws_security_group.secondary_ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    kms_key_id            = aws_kms_key.secondary.arn
    delete_on_termination = true
  }
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y amazon-cloudwatch-agent
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Secondary Region Server - ${var.secondary_region}</h1>" > /var/www/html/index.html
    echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
    echo "<p>Region: ${var.secondary_region}</p>" >> /var/www/html/index.html
    cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOL'
    {
      "metrics": {
        "namespace": "CWAgent",
        "metrics_collected": {
          "cpu": {
            "measurement": [
              "cpu_usage_idle",
              "cpu_usage_iowait",
              "cpu_usage_user",
              "cpu_usage_system"
            ],
            "metrics_collection_interval": 60
          },
          "disk": {
            "measurement": [
              "used_percent"
            ],
            "metrics_collection_interval": 60,
            "resources": ["*"]
          },
          "mem": {
            "measurement": [
              "mem_used_percent"
            ],
            "metrics_collection_interval": 60
          }
        }
      }
    }
    EOL
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
  EOF
  )
  tags = merge(local.common_tags, {
    Name   = "${var.environment}-secondary-ec2"
    Region = var.secondary_region
  })
}

# = ELASTIC IPS FOR EC2 INSTANCES =
resource "aws_eip" "primary_ec2" {
  provider = aws.us_east_2
  instance = aws_instance.primary.id
  tags = merge(local.common_tags, {
    Name = "${var.environment}-primary-ec2-eip"
  })
}
resource "aws_eip" "secondary_ec2" {
  provider = aws.us_west_1
  instance = aws_instance.secondary.id
  tags = merge(local.common_tags, {
    Name = "${var.environment}-secondary-ec2-eip"
  })
}

# = ROUTE 53 HOSTED ZONE CREATION =
resource "aws_route53_zone" "primary" {
  name    = var.domain_name
  comment = "Primary public hosted zone"
  tags    = local.common_tags
}
resource "aws_route53_zone" "secondary" {
  name    = "secondary.${var.domain_name}"
  comment = "Secondary public hosted zone or subdomain"
  tags    = local.common_tags
}

# = ROUTE 53 FAILOVER DNS CONFIGURATION =
resource "aws_route53_health_check" "primary_ec2" {
  type                            = "HTTP"
  resource_path                   = "/"
  ip_address                      = aws_eip.primary_ec2.public_ip
  port                            = 80
  request_interval                = 30
  failure_threshold               = 3
  tags = merge(local.common_tags, {
    Name = "${var.environment}-primary-health-check"
  })
}

resource "aws_route53_record" "primary_failover" {
  zone_id         = aws_route53_zone.primary.zone_id
  name            = "${var.subdomain}.${var.domain_name}"
  type            = "A"
  set_identifier  = "primary"
  failover_routing_policy {
    type = "PRIMARY"
  }
  health_check_id = aws_route53_health_check.primary_ec2.id
  records         = [aws_eip.primary_ec2.public_ip]
  ttl             = 60
}

resource "aws_route53_record" "secondary_failover" {
  zone_id         = aws_route53_zone.primary.zone_id
  name            = "${var.subdomain}.${var.domain_name}"
  type            = "A"
  set_identifier  = "secondary"
  failover_routing_policy {
    type = "SECONDARY"
  }
  records         = [aws_eip.secondary_ec2.public_ip]
  ttl             = 60
}

# = OUTPUTS =
output "primary_vpc_id" {
  value       = aws_vpc.primary.id
  description = "Primary VPC ID"
}
output "secondary_vpc_id" {
  value       = aws_vpc.secondary.id
  description = "Secondary VPC ID"
}
output "primary_subnet_ids" {
  value       = concat(aws_subnet.primary_public[*].id, aws_subnet.primary_private[*].id)
  description = "List of primary subnet IDs"
}
output "secondary_subnet_ids" {
  value       = concat(aws_subnet.secondary_public[*].id, aws_subnet.secondary_private[*].id)
  description = "List of secondary subnet IDs"
}
output "primary_ec2_instance" {
  value = {
    id         = aws_instance.primary.id
    private_ip = aws_instance.primary.private_ip
    public_ip  = aws_eip.primary_ec2.public_ip
    eip_id     = aws_eip.primary_ec2.id
  }
  description = "Primary EC2 Instance details with EIP"
}
output "secondary_ec2_instance" {
  value = {
    id         = aws_instance.secondary.id
    private_ip = aws_instance.secondary.private_ip
    public_ip  = aws_eip.secondary_ec2.public_ip
    eip_id     = aws_eip.secondary_ec2.id
  }
  description = "Secondary EC2 Instance details with EIP"
}
output "vpc_peering_id" {
  value       = aws_vpc_peering_connection.primary_to_secondary.id
  description = "VPC Peering Connection ID"
}
output "primary_route53_zone_id" {
  value       = aws_route53_zone.primary.zone_id
  description = "Primary Route53 Hosted Zone ID"
}
output "secondary_route53_zone_id" {
  value       = aws_route53_zone.secondary.zone_id
  description = "Secondary Route53 Hosted Zone ID"
}
output "route53_record" {
  value       = "${var.subdomain}.${var.domain_name}"
  description = "Route53 DNS Failover Record"
}

output "primary_internet_gateway_id" {
  value       = aws_internet_gateway.primary.id
  description = "Primary region Internet Gateway ID"
}
output "secondary_internet_gateway_id" {
  value       = aws_internet_gateway.secondary.id
  description = "Secondary region Internet Gateway ID"
}
output "primary_nat_gateway_ids" {
  value       = aws_nat_gateway.primary[*].id
  description = "List of NAT Gateway IDs in primary region"
}
output "secondary_nat_gateway_ids" {
  value       = aws_nat_gateway.secondary[*].id
  description = "List of NAT Gateway IDs in secondary region"
}
output "primary_public_route_table_id" {
  value       = aws_route_table.primary_public.id
  description = "Primary region public route table ID"
}
output "primary_private_route_table_ids" {
  value       = aws_route_table.primary_private[*].id
  description = "Primary region private route table IDs"
}
output "secondary_public_route_table_id" {
  value       = aws_route_table.secondary_public.id
  description = "Secondary region public route table ID"
}
output "secondary_private_route_table_ids" {
  value       = aws_route_table.secondary_private[*].id
  description = "Secondary region private route table IDs"
}
output "primary_to_secondary_peering_routes" {
  value = [
    aws_route.primary_public_to_secondary.id,
    aws_route.primary_private_to_secondary[*].id
  ]
  description = "Route IDs in primary region pointing to secondary via peering"
}
output "secondary_to_primary_peering_routes" {
  value = [
    aws_route.secondary_public_to_primary.id,
    aws_route.secondary_private_to_primary[*].id
  ]
  description = "Route IDs in secondary region pointing to primary via peering"
}

# Security: Security group IDs and rule counts for primary and secondary regions
output "primary_ec2_security_group_id" {
  value       = aws_security_group.primary_ec2.id
  description = "Primary region EC2 Security Group ID"
}
output "primary_ec2_security_group_rule_count" {
  value       = length(aws_security_group.primary_ec2.ingress) + length(aws_security_group.primary_ec2.egress)
  description = "Number of ingress/egress rules in primary EC2 SG"
}
output "secondary_ec2_security_group_id" {
  value       = aws_security_group.secondary_ec2.id
  description = "Secondary region EC2 Security Group ID"
}
output "secondary_ec2_security_group_rule_count" {
  value       = length(aws_security_group.secondary_ec2.ingress) + length(aws_security_group.secondary_ec2.egress)
  description = "Number of ingress/egress rules in secondary EC2 SG"
}
output "vpc_cidr_overlap_warning" {
  value       = var.primary_vpc_cidr == var.secondary_vpc_cidr ? "Warning: VPC CIDRs overlap!" : "No CIDR overlap detected"
  description = "Basic check for overlapping VPC CIDRs"
}

# S3 replication/KMS: Buckets, versioning, replication role ARN, and KMS keys ARNs
output "primary_s3_bucket_name" {
  value       = aws_s3_bucket.primary.bucket
  description = "Primary S3 bucket name"
}
output "secondary_s3_bucket_name" {
  value       = aws_s3_bucket.secondary.bucket
  description = "Secondary S3 bucket name"
}
output "s3_replication_role_arn" {
  value       = aws_iam_role.s3_replication.arn
  description = "IAM Role ARN used for S3 cross-region replication"
}
output "primary_kms_key_arn" {
  value       = aws_kms_key.primary.arn
  description = "Primary region KMS key ARN"
}
output "secondary_kms_key_arn" {
  value       = aws_kms_key.secondary.arn
  description = "Secondary region KMS key ARN"
}

# IAM wiring: Instance profile and role names attached to EC2 instances
output "ec2_iam_instance_profile_name" {
  value       = aws_iam_instance_profile.ec2_profile.name
  description = "IAM instance profile name attached to EC2 instances"
}
output "ec2_iam_role_name" {
  value       = aws_iam_role.ec2_role.name
  description = "IAM role name attached to EC2 instances"
}

# Public vs Private subnets: Validate per VPC counts
output "primary_public_subnet_count" {
  value       = length(aws_subnet.primary_public)
  description = "Number of public subnets in primary VPC"
}
output "primary_private_subnet_count" {
  value       = length(aws_subnet.primary_private)
  description = "Number of private subnets in primary VPC"
}
output "secondary_public_subnet_count" {
  value       = length(aws_subnet.secondary_public)
  description = "Number of public subnets in secondary VPC"
}
output "secondary_private_subnet_count" {
  value       = length(aws_subnet.secondary_private)
  description = "Number of private subnets in secondary VPC"
}
```
