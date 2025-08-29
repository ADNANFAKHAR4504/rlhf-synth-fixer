## Root Configuration Files

### `provider.tf`
```hcl
# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}

# Optional: Provider alias for cross-region deployments
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region

}
```

### `main.tf`
```hcl
# KMS
module "kms" {
  source      = "./modules/kms"
  project     = var.project
  environment = var.environment
  region      = var.aws_region
}

# VPC
module "vpc" {
  source              = "./modules/vpc"
  project             = var.project
  environment         = var.environment
  vpc_cidr            = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

module "sg" {
    source              = "./modules/sg"
    project             = var.project
    environment         = var.environment
    allowed_ssh_cidr    = var.allowed_ssh_cidr
    vpc_id              = module.vpc.vpc_id
}

# S3_secure_bucket
module "s3_secure_bucket" {
  source      = "./modules/s3"
  project     = var.project
  kms_key_id = module.kms.kms_key_arn
  bucket_name = "secconfig-secure-bucket-pr2219"
  bucket_policy = data.aws_iam_policy_document.secure_bucket.json
}

# S3_cloudtrail
module "s3_cloudtrail_bucket" {
  source      = "./modules/s3"
  project     = var.project
  kms_key_id = module.kms.kms_key_arn
  bucket_name = "secconfig-cloudtrail-bucket-pr2219"
  bucket_policy = data.aws_iam_policy_document.cloudtrail_s3.json
}

# S3_cloudtrail
module "s3_config_bucket" {
  source      = "./modules/s3"
  project     = var.project
  kms_key_id = module.kms.kms_key_arn
  bucket_name = "secconfig-config-bucket-pr2219"
  bucket_policy = data.aws_iam_policy_document.config_s3.json
}

# SNS
module "sns" {
  source      = "./modules/sns"
  topic_name = "SecConfig-Security-Alerts-Pr2219"
  kms_key_id= module.kms.kms_key_arn
}

# CloudWatch
module "cloudwatch_security" {
  source      = "./modules/cloudwatch"
  log_group_name = "/aws/secconfig/security-logs-pr2219"
  retention_in_days = 90
  sns_topic = module.sns.sns_topic_arn
}

# CloudWatch
module "cloudwatch_cloudtrail" {
  source      = "./modules/cloudwatch"
  log_group_name = "/aws/cloudtrail/cloudtrail-logs-pr2219"
  retention_in_days = 90
  sns_topic = module.sns.sns_topic_arn
}

## CloudTrail
#module "cloudtrail" {
#  source          = "./modules/cloudtrail"
#  project         = var.project
#  environment     = var.environment
#  s3_bucket_name  = module.s3_cloudtrail_bucket.s3_bucket_id
#  kms_key_id = module.kms.kms_key_arn
#  cw_logs_role_arn = module.iam_cloudtrail.role_arn
#  cw_logs_group_arn = module.cloudwatch_cloudtrail.log_group_arn
#}

## GuardDuty
#module "guardduty" {
#  source  = "./modules/guardduty"
#}

module "iam_cloudtrail" {
  source = "./modules/iam"
  role_name= "${var.project}-cloudtrail-cw-role"
  policy_name = "${var.project}-cloudtrail-cw-policy"
  assume_policy = data.aws_iam_policy_document.cloudtrail_assume.json
  iam_policy = data.aws_iam_policy_document.cloudtrail_cw_policy.json
  policy_arn = ""
}

module "iam_config" {
  source = "./modules/iam"
  role_name= "${var.project}-config-role"
  policy_name = "${var.project}-config-policy"
  assume_policy = data.aws_iam_policy_document.config_assume.json
  iam_policy = data.aws_iam_policy_document.config_policy.json
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

module "iam_mfa_role" {
  source = "./modules/iam"
  role_name= "${var.project}-MFA-Required-Role"
  policy_name = "${var.project}-mfa-required-policy"
  assume_policy = data.aws_iam_policy_document.mfa_role_assume.json
  iam_policy = data.aws_iam_policy_document.s3_readonly.json
  policy_arn = ""
}

module "config" {
  source = "./modules/config"
  config_bucket = module.s3_config_bucket.s3_bucket_id
  config_role_arn = module.iam_config.role_arn
}
```

### `variables.tf`
```hcl
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "secondary_region" {
  description = "Secondary AWS region for cross-region deployments"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
  default     = "203.0.113.0/32"  # Replace with your actual IP
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "SecurityConfiguration"
}

variable "enable_guardduty" {
  description = "Enable GuardDuty detector (set to false if already exists)"
  type        = bool
  default     = false
}

variable "project" {
  description = "Name of the project"
  type        = string
  default     = "security_config_pr2219"
}

variable "environment" {
  description = "Name of the project"
  type        = string
  default     = "dev"
}

variable "public_subnet_cidrs" {
  description = "List of CIDR blocks for public subnets"
  type        = list(string)
  default     = [
    "10.0.1.0/24", # Public subnet in AZ1
    "10.0.2.0/24"  # Public subnet in AZ2
  ]
}

variable "private_subnet_cidrs" {
  description = "List of CIDR blocks for private subnets"
  type        = list(string)
  default     = [
    "10.0.3.0/24", # Private subnet in AZ1
    "10.0.4.0/24"  # Private subnet in AZ2
  ]
}
```
### `outputs.tf`
```hcl
output "vpc_id" {
  value = module.vpc.vpc_id
}

output "public_subnet_ids" {
  value = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  value = module.vpc.private_subnet_ids
}


output "kms_key_arn" {
  value = module.kms.kms_key_arn
}

output "sns_topic_arn" {
  value = module.sns.sns_topic_arn
}

output "cloudwatch_log_group_name" {
  value = module.cloudwatch_security.log_group_arn
}

output "cloudtrail_log_group_name" {
  value = module.cloudwatch_cloudtrail.log_group_arn
}

output "role_arn_cloudtrail" {
  value = module.iam_cloudtrail.role_arn
}

output "role_arn_config" {
  value = module.iam_config.role_arn
}

output "role_arn_mfa" {
  value = module.iam_mfa_role.role_arn
}

output "s3_secure_bucket" {
  value = module.s3_secure_bucket.s3_bucket_id
}

output "s3_cloudtrail_bucket" {
  value = module.s3_cloudtrail_bucket.s3_bucket_id
}

output "s3_config_bucket" {
  value = module.s3_config_bucket.s3_bucket_id
}

output "scurity_group_id_bastion" {
  description = "ID of the bastion security group"
  value       = module.sg.bastion_sg_id
}

output "security_group_id_private_instance" {
  description = "ID of the private instance security group"
  value       = module.sg.private_sg_id
}

output "config_delivery_channel" {
  description = "Config delivery channel name"
  value       = module.config.config_delivery_channel
}
```

### `data.tf`
```hcl
# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Data source for current region
data "aws_region" "current" {}

data "aws_iam_policy_document" "cloudtrail_s3" {
  statement {
    sid = "AWSCloudTrailAclCheck"
    actions   = ["s3:GetBucketAcl"]
    resources = ["arn:aws:s3:::secconfig-cloudtrail-bucket-pr2219"]

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
  }

  statement {
    sid = "AWSCloudTrailWrite"
    actions   = ["s3:PutObject"]
    resources = ["arn:aws:s3:::secconfig-cloudtrail-bucket-pr2219/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}

# Secure bucket policy - allow all IAM roles/users in this account
data "aws_iam_policy_document" "secure_bucket" {
  statement {
    sid     = "AllowAllAccountPrincipals"
    actions = [
      "s3:ListBucket",
      "s3:GetObject",
      "s3:PutObject"
    ]
    resources = [
      "arn:aws:s3:::secconfig-secure-bucket-pr2219",
      "arn:aws:s3:::secconfig-secure-bucket-pr2219/*"
    ]

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }
  }
}


data "aws_iam_policy_document" "config_s3" {
  statement {
    sid = "AWSCloudTrailAclCheck"
    actions   = [
      "s3:GetBucketAcl",
      "s3:ListBucket"
      ]
    resources = ["arn:aws:s3:::secconfig-config-bucket-pr2219"]

    principals {
      type        = "Service"
      identifiers = ["config.amazonaws.com"]
    }
  }

  statement {
    sid = "AWSCloudTrailWrite"
    actions   = ["s3:PutObject"]
    resources = ["arn:aws:s3:::secconfig-config-bucket-pr2219/*"]

    principals {
      type        = "Service"
      identifiers = ["config.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}

data "aws_iam_policy_document" "cloudtrail_assume" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

data "aws_iam_policy_document" "cloudtrail_cw_policy" {
  statement {
    actions   = ["logs:PutLogEvents", "logs:CreateLogStream"]
    resources = ["*"]
  }
}

data "aws_iam_policy_document" "config_assume" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["config.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

data "aws_iam_policy_document" "config_policy" {
  statement {
    actions   = ["logs:PutLogEvents", "logs:CreateLogStream"]
    resources = ["*"]
  }
}

data "aws_iam_policy_document" "mfa_role_assume" {
  statement {
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }

    actions = ["sts:AssumeRole"]

    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["true"]
    }

    condition {
      test     = "NumericLessThan"
      variable = "aws:MultiFactorAuthAge"
      values   = ["3600"]
    }
  }
}

data "aws_iam_policy_document" "s3_readonly" {
  statement {
    effect = "Allow"

    actions = [
      "s3:GetObject",
      "s3:GetObjectVersion",
      "s3:ListBucket",
      "s3:GetBucketLocation"
    ]

    resources = [
      module.s3_secure_bucket.s3_bucket_arn,
      "${module.s3_secure_bucket.s3_bucket_arn}/*"
    ]
  }
}
```



## Module Configurations

### `modules/vpc/vpc.tf`
```hcl
data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project}-${var.environment}-vpc"
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.project}-${var.environment}-igw"
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_eip" "nat_eip" {
  tags = {
    Name        = "${var.project}-${var.environment}-nat-eip"
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name        = "${var.project}-${var.environment}-nat"
    Project     = var.project
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.igw]
}

resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = element(data.aws_availability_zones.available.names, count.index)
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project}-${var.environment}-public-${count.index + 1}"
    Project     = var.project
    Environment = var.environment
    Tier        = "Public"
  }
}

resource "aws_subnet" "private" {
  count                   = length(var.private_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.private_subnet_cidrs[count.index]
  availability_zone       = element(data.aws_availability_zones.available.names, count.index)
  map_public_ip_on_launch = false

  tags = {
    Name        = "${var.project}-${var.environment}-private-${count.index + 1}"
    Project     = var.project
    Environment = var.environment
    Tier        = "Private"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name        = "${var.project}-${var.environment}-public-rt"
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_route_table_association" "public_assoc" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat.id
  }

  tags = {
    Name        = "${var.project}-${var.environment}-private-rt"
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_route_table_association" "private_assoc" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

```


### `modules/vpc/variables.tf`
```hcl
variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "public_subnet_cidrs" {
  description = "List of CIDR blocks for public subnets"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "List of CIDR blocks for private subnets"
  type        = list(string)
}

```


### `modules/vpc/outputs.tf`
```hcl
output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_id" {
  description = "ID of the private route table"
  value       = aws_route_table.private.id
}

```

### `modules/sns/sns.tf`
```hcl
resource "aws_sns_topic" "security_alerts" {
  name = var.topic_name
  kms_master_key_id = var.kms_key_id
    tags = {
        Name    = var.topic_name
  }
}

```

### `modules/sns/variables.tf`
```hcl
variable "topic_name" {
  description = "Name of the SNS topic for security alerts"
  type        = string
}

variable "kms_key_id" {
  description = "KMS Key id"
  type        = string
}
```

### `modules/sns/outputs.tf`
```hcl
output "sns_topic_arn" {
  description = "ARN of the SNS security alerts topic"
  value       = aws_sns_topic.security_alerts.arn
}

```

### `modules/sg/sg.tf`
```hcl
resource "aws_security_group" "bastion" {
  name        = "${var.project}-${var.environment}-bastion-sg"
  description = "Security group for bastion host"
  vpc_id      = var.vpc_id

  ingress {
    description = "Allow SSH from allowed CIDR"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_security_group" "private_instance" {
  name        = "${var.project}-${var.environment}-private-sg"
  description = "Security group for private instances"
  vpc_id      = var.vpc_id

  ingress {
    description = "Allow SSH from bastion host"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    security_groups = [aws_security_group.bastion.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Project     = var.project
    Environment = var.environment
  }
}

```

### `modules/sg/variables.tf`
```hcl
variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where the security groups will be created"
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed to SSH into bastion"
  type        = string
}

```

### `modules/sg/outputs.tf`
```hcl
output "bastion_sg_id" {
  description = "ID of the bastion security group"
  value       = aws_security_group.bastion.id
}

output "private_sg_id" {
  description = "ID of the private instance security group"
  value       = aws_security_group.private_instance.id
}

```

### `modules/s3/s3.tf`
```hcl
resource "aws_s3_bucket" "this_bucket" {
  bucket        = var.bucket_name
  force_destroy = true
  tags = {
    Name    = var.bucket_name
    Project = var.project
  }
}

# Server-side encryption configuration
resource "aws_s3_bucket_server_side_encryption_configuration" "this_bucket_sse" {
  bucket = aws_s3_bucket.this_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = var.kms_key_id
    }
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "this_bucket_block" {
  bucket                  = aws_s3_bucket.this_bucket.id
  block_public_acls        = true
  block_public_policy      = true
  ignore_public_acls       = true
  restrict_public_buckets  = true
}

# Enable versioning if required
resource "aws_s3_bucket_versioning" "this_bucket_versioning" {
  bucket = aws_s3_bucket.this_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Policy
resource "aws_s3_bucket_policy" "cloudtrail_logs_policy" {
  bucket = aws_s3_bucket.this_bucket.id
  policy = var.bucket_policy
}
```


### `modules/s3/variables.tf`
```hcl
variable "project" {
  description = "Project name"
  type        = string
}

variable "kms_key_id" {
  description = "KMS Key id"
  type        = string
}

variable "bucket_name" {
  description = "bucket Name"
  type        = string
}

variable "bucket_policy" {
  description = "S3 bucket policy"
  type = string
}
```

### `modules/s3/outputs.tf`
```hcl
output "s3_bucket_id" {
  description = "The ID of the CloudTrail log bucket"
  value       = aws_s3_bucket.this_bucket.id
}

output "s3_bucket_arn" {
  description = "The ARN of the CloudTrail log bucket"
  value       = aws_s3_bucket.this_bucket.arn
}

```

### `modules/kms/kms.tf`
```hcl
resource "aws_kms_key" "secure_key" {
  description             = "KMS key for encrypting CloudTrail and other services"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  policy = data.aws_iam_policy_document.kms_key_policy.json

  tags = {
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_kms_alias" "secure_key_alias" {
  name          = "alias/${var.project}-${var.environment}-kms-key"
  target_key_id = aws_kms_key.secure_key.key_id
}

data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "kms_key_policy" {
  statement {
    sid    = "AllowRootAccountFullAccess"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = [data.aws_caller_identity.current.account_id]
    }

    actions   = ["kms:*"]
    resources = ["*"]
  }

  statement {
    sid    = "AllowCloudTrailUse"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = [
        "cloudtrail.amazonaws.com",
        "logs.${var.region}.amazonaws.com"
      ]
    }

    actions = [
      "kms:GenerateDataKey*",
      "kms:Decrypt",
      "kms:Encrypt",
      "kms:DescribeKey"
    ]

    resources = ["*"]
  }
}
```

### `modules/kms/variables.tf`
```hcl
variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region where the resources are deployed"
  type        = string
}

```

### `modules/kms/outputs.tf`
```hcl
output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.secure_key.arn
}

output "kms_key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.secure_key.key_id
}

```
### `modules/iam/iam.tf`
```hcl
# IAM Role for CloudTrail -> CloudWatch
resource "aws_iam_role" "cloudtrail_cw" {
  name               = var.role_name
  assume_role_policy = var.assume_policy
}

resource "aws_iam_role_policy" "cloudtrail_cw_policy" {
  name   = var.policy_name
  role   = aws_iam_role.cloudtrail_cw.id
  policy = var.iam_policy
}

# Optional AWS Config role policy attachment
resource "aws_iam_role_policy_attachment" "config_role_policy" {
  for_each   = var.policy_arn != "" ? { attach = var.policy_arn } : {}
  role       = aws_iam_role.cloudtrail_cw.name
  policy_arn = each.value
}
```

### `modules/iam/variables.tf`
```hcl
variable "role_name" {
  description = "iam role name"
  type = string
}

variable "policy_name" {
  description = "IAM policy name"
  type = string
}

variable "assume_policy" {
  description = "IAM assume policy"
  type = string
}

variable "iam_policy" {
  description = "IAM policy document"
  type = string
}

variable "policy_arn" {
  description = "IAM policy arn"
  type = string
}
```

### `modules/iam/outputs.tf`
```hcl
output "role_arn" {
  value = aws_iam_role.cloudtrail_cw.arn
}
```

### `modules/guardduty/guardduty.tf`
```hcl
# Create GuardDuty Detector
resource "aws_guardduty_detector" "this" {
  enable = var.enable_guardduty
}

# Optional: Invite Member Accounts (if any provided)
resource "aws_guardduty_member" "members" {
  for_each = var.member_accounts

  account_id               = each.key
  detector_id               = aws_guardduty_detector.this.id
  email                     = each.value.email
  invitation_message        = each.value.invitation_message
  disable_email_notification = false
}

# Optional: Publish findings to SNS topic
resource "aws_guardduty_publishing_destination" "this" {
  count         = var.findings_export_bucket_arn != "" ? 1 : 0
  detector_id   = aws_guardduty_detector.this.id
  destination_arn = var.findings_export_bucket_arn
  kms_key_arn     = var.kms_key_arn
}

```

### `modules/guardduty/variables.tf`
```hcl
variable "enable_guardduty" {
  description = "Whether to enable GuardDuty"
  type        = bool
  default     = true
}

variable "member_accounts" {
  description = <<EOT
Map of member accounts to invite to GuardDuty.
Format:
{
  "account_id" = {
    email              = "member@example.com"
    invitation_message = "Optional message"
  }
}
EOT
  type    = map(object({
    email              = string
    invitation_message = string
  }))
  default = {}
}

variable "findings_export_bucket_arn" {
  description = "S3 bucket ARN to export GuardDuty findings (optional)"
  type        = string
  default     = ""
}

variable "kms_key_arn" {
  description = "KMS key ARN for encrypting exported findings"
  type        = string
  default     = ""
}

```
### `modules/guardduty/outputs.tf`
```hcl
output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = aws_guardduty_detector.this.id
}


```
### `modules/config/config.tf`
```hcl
# Config Delivery Channel
resource "aws_config_delivery_channel" "main" {
  name           = "SecConfig-Delivery-Channel"
  s3_bucket_name = var.config_bucket
  s3_key_prefix  = "config"
  
  depends_on = [aws_config_configuration_recorder.main]
}

# Config Configuration Recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "SecConfig-Recorder"
  role_arn = var.config_role_arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

# Start the configuration recorder
resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true
  depends_on = [aws_config_delivery_channel.main]
}

# Config Rules
resource "aws_config_config_rule" "s3_bucket_public_read_prohibited" {
  name = "s3-bucket-public-read-prohibited"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = {
    Name    = "SecConfig-S3-Public-Read-Rule"
    Project = "SecurityConfiguration"
  }
}

resource "aws_config_config_rule" "encrypted_volumes" {
  name = "encrypted-volumes"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = {
    Name    = "SecConfig-Encrypted-Volumes-Rule"
    Project = "SecurityConfiguration"
  }
}
```

### `modules/config/variables.tf`
```hcl
variable "config_bucket" {
  description = "Config bucket name"
  type = string
}

variable "config_role_arn" {
  description = "Config role arn"
  type = string
}
```

### `modules/config/outputs.tf`
```hcl
output "config_delivery_channel" {
  description = "Config delivery channel name"
  value       = aws_config_delivery_channel.main.id
}

```
### `modules/cloudwatch/cloudwatch.tf`
```hcl
# CloudWatch Log Group for failed login attempts (without KMS for now)
resource "aws_cloudwatch_log_group" "security_logs" {
  name              = var.log_group_name
  retention_in_days = var.retention_in_days

  tags = {
    Name    = "SecConfig-Security-Logs"
    Project = "SecurityConfiguration"
  }
}

# CloudWatch Log Metric Filter for failed logins
resource "aws_cloudwatch_log_metric_filter" "failed_logins" {
  name           = "SecConfig-Failed-Console-Logins"
  log_group_name = aws_cloudwatch_log_group.security_logs.name

  # Use JSON matching instead of dot notation
  pattern = "{ ($.eventName = \"ConsoleLogin\") && ($.responseElements.ConsoleLogin = \"Failure\") }"

  metric_transformation {
    name      = "ConsoleLoginFailures"
    namespace = "SecConfig/Security"
    value     = "1"
  }
}


# CloudWatch Alarm for failed login attempts
resource "aws_cloudwatch_metric_alarm" "failed_logins" {
  alarm_name          = "SecConfig-Failed-Logins"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ConsoleLoginFailures"
  namespace           = "SecConfig/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors failed console login attempts"
  alarm_actions       = [var.sns_topic]

  tags = {
    Name    = "SecConfig-Failed-Logins-Alarm"
    Project = "SecurityConfiguration"
  }
}
```

### `modules/cloudwatch/variables.tf`
```hcl
variable "log_group_name" {
  description = "Name of the CloudWatch log group for CloudTrail"
  type        = string
}

variable "retention_in_days" {
  description = "Number of days to retain log events"
  type        = number
}

variable "sns_topic" {
  description = "Sns topc arn"
  type = string
}

```

### `modules/cloudwatch/outputs.tf`
```hcl
output "log_group_arn" {
  description = "ARN of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.security_logs.arn
}
```
### `modules/cloudtrail/cloudtrail.tf`
```hcl
# CloudTrail
resource "aws_cloudtrail" "this" {
  name                          = "SecConfig-CloudTrail"
  s3_bucket_name                = var.s3_bucket_name
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                 = true
  cloud_watch_logs_group_arn    = "${var.cw_logs_group_arn}:*"
  cloud_watch_logs_role_arn     = var.cw_logs_role_arn
  kms_key_id                    = var.kms_key_id
}
```

### `modules/cloudtrail/variables.tf`
```hcl
variable "cloudtrail_log_retention" {
  description = "Retention period for CloudTrail CloudWatch logs in days"
  type        = number
  default     = 90
}

variable "kms_key_id" {
  description = "KMS Key ID for encrypting CloudTrail logs"
  type        = string
}

variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g. dev, prod)"
  type        = string
}

variable "tags" {
  description = "Additional tags to apply"
  type        = map(string)
  default     = {}
}

variable "s3_bucket_name" {
  description = "S3 Bucket name"
  type = string
}

variable "cw_logs_role_arn" {
  description = "CloudWatch logs role arn"
  type = string
}

variable "cw_logs_group_arn" {
  description = "CloudWatch logs group arn"
  type = string
}
```

### `modules/cloudtrail/outputs.tf`
```hcl
output "cloudtrail_id" {
  description = "ID of the CloudTrail"
  value       = aws_cloudtrail.this.id
}
```