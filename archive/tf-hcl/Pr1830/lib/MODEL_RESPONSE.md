```hcl
# main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  backend "remote" {
    organization = "<REPLACE_WITH_TFC_ORG>"
    workspaces {
      prefix = "myapp-"
    }
  }
}

provider "aws" {
  alias  = "staging"
  region = var.staging_region
  default_tags {
    tags = {
      environment = "staging"
      project     = "IaC - AWS Nova Model Breaking"
    }
  }
}

provider "aws" {
  alias  = "production"
  region = var.production_region
  default_tags {
    tags = {
      environment = "production"
      project     = "IaC - AWS Nova Model Breaking"
    }
  }
}

locals {
  env = replace(terraform.workspace, "myapp-", "")
}

module "storage" {
  source   = "./modules/storage"
  providers = { aws = local.env == "staging" ? aws.staging : aws.production }
  environment = local.env
}

module "network" {
  source   = "./modules/network"
  providers = { aws = local.env == "staging" ? aws.staging : aws.production }
  environment = local.env
}

module "iam_role" {
  source   = "./modules/iam_role"
  providers = { aws = local.env == "staging" ? aws.staging : aws.production }
  environment = local.env
  bucket_arn  = module.storage.bucket_arn
}
```

```hcl
# variables.tf
variable "staging_region" {
  description = "AWS region for staging"
  default     = "ap-south-1"
}

variable "production_region" {
  description = "AWS region for production"
  default     = "us-east-1"
}
```

```hcl
# outputs.tf
output "bucket_names" {
  value = {
    staging    = module.storage.bucket_name
    production = module.storage.bucket_name
  }
}

output "security_group_ids" {
  value = {
    staging    = module.network.security_group_id
    production = module.network.security_group_id
  }
}

output "iam_role_arns" {
  value = {
    staging    = module.iam_role.role_arn
    production = module.iam_role.role_arn
  }
}
```

```hcl
# modules/storage/main.tf
resource "random_id" "bucket_suffix" {
  keepers = {
    environment = var.environment
  }
  byte_length = 4
}

resource "aws_s3_bucket" "main" {
  bucket = "myapp-${var.environment}-${random_id.bucket_suffix.hex}"

  versioning {
    enabled = true
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  tags = {
    Name        = "myapp-${var.environment}-bucket"
    Environment = var.environment
  }
}

output "bucket_name" {
  value = aws_s3_bucket.main.bucket
}

output "bucket_arn" {
  value = aws_s3_bucket.main.arn
}
```

```hcl
# modules/network/main.tf
resource "aws_security_group" "main" {
  name_prefix = "myapp-${var.environment}-sg-"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "myapp-${var.environment}-sg"
    Environment = var.environment
  }
}

data "aws_vpc" "default" {
  default = true
}

output "security_group_id" {
  value = aws_security_group.main.id
}
```

```hcl
# modules/iam_role/main.tf
resource "aws_iam_role" "main" {
  name_prefix = "myapp-${var.environment}-role-"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_policy" "s3_access" {
  name_prefix = "myapp-${var.environment}-policy-"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = [
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ]
      Effect   = "Allow"
      Resource = [var.bucket_arn, "${var.bucket_arn}/*"]
    }]
  })
}

resource "aws_iam_role_policy_attachment" "attach" {
  role       = aws_iam_role.main.name
  policy_arn = aws_iam_policy.s3_access.arn
}

output "role_arn" {
  value = aws_iam_role.main.arn
}
```
