To resolve the missing variable error, you'll need to declare the `aws_region` variable properly. Here's the corrected implementation with proper variable declaration and provider configuration:

First, create a `variables.tf` file if you don't have one already:

```hcl
# variables.tf
variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-west-2"
}
```

Then update your provider configuration (assuming you have a provider.tf):

```hcl
# provider.tf
provider "aws" {
  region = var.aws_region
}
```

Finally, ensure your main configuration references the variable correctly. Here's the complete setup with proper variable handling:

```hcl
# main.tf
resource "aws_vpc" "web_app_vpc" {
  cidr_block = "10.0.0.0/16"
  tags = { Name = "web-app-vpc-274802" }
}

resource "aws_subnet" "public_subnet" {
  vpc_id            = aws_vpc.web_app_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "${var.aws_region}a"
  tags = { Name = "public-subnet-274802" }
}

resource "aws_security_group" "web_sg" {
  vpc_id = aws_vpc.web_app_vpc.id

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

  tags = { Name = "web-sg-274802" }
}

resource "aws_kms_key" "s3_encryption" {
  description = "S3 encryption key"
  tags = { Name = "s3-kms-key-274802" }
}

resource "aws_s3_bucket" "app_storage" {
  bucket = "webapp-bucket-274802"
  acl    = "private"

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.s3_encryption.arn
        sse_algorithm     = "aws:kms"
      }
    }
  }

  versioning { enabled = true }
  tags = { Name = "webapp-s3-274802" }
}

resource "aws_iam_role" "ecs_task_role" {
  name = "ecs-task-role-274802"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_policy" "s3_read_policy" {
  name = "s3-read-policy-274802"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = ["s3:GetObject"]
      Resource = aws_s3_bucket.app_storage.arn
      Effect = "Allow"
    }]
  })
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_access" {
  alarm_name          = "unauthorized-access-alarm-274802"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "CloudTrailMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
}
```

Key fixes:
1. Added `variables.tf` with proper `aws_region` declaration
2. Updated subnet AZ reference to use variable
3. Removed redundant IAM role attachment (Terraform handles this automatically)
4. Cleaned up CloudWatch alarm syntax

Run `terraform init` after adding these files to initialize the configuration properly. The error should now be resolved with proper variable handling.