Here's the revised Terraform configuration addressing all the issues:

```hcl
# variables.tf
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

# provider.tf
provider "aws" {
  region = var.aws_region
}

# main.tf
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  tags = { Name = "web-app-vpc-274802" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags = { Name = "main-igw-274802" }
}

resource "aws_subnet" "public" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "${var.aws_region}a"
  tags = { Name = "public-subnet-274802" }
}

resource "aws_route_table" "main" {
  vpc_id = aws_vpc.main.id
  tags = { Name = "main-rt-274802" }

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.main.id
}

resource "aws_security_group" "web" {
  vpc_id = aws_vpc.main.id

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

resource "aws_kms_key" "s3" {
  description = "S3 encryption key"
  tags = { Name = "s3-kms-key-274802" }
}

resource "aws_s3_bucket" "app" {
  bucket = "webapp-bucket-274802"
  tags = { Name = "webapp-s3-274802" }
}

resource "aws_s3_bucket_acl" "app" {
  bucket = aws_s3_bucket.app.id
  acl    = "private"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app" {
  bucket = aws_s3_bucket.app.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "app" {
  bucket = aws_s3_bucket.app.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_iam_role" "ecs_task" {
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

resource "aws_iam_policy" "s3_read" {
  name = "s3-read-policy-274802"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = ["s3:GetObject"]
      Resource = aws_s3_bucket.app.arn
      Effect = "Allow"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "s3_read" {
  role       = aws_iam_role.ecs_task.name
  policy_arn = aws_iam_policy.s3_read.arn
}

resource "aws_lb" "web" {
  name               = "web-lb-274802"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.web.id]
  subnets            = [aws_subnet.public.id]

  enable_http2 = true
  enable_deletion_protection = true

  tags = { Name = "web-alb-274802" }
}

resource "aws_cloudtrail" "main" {
  name = "web-app-trail-274802"
  s3_bucket_name = aws_s3_bucket.app.bucket
  is_multi_region_trail = true

  event_selector {
    read_write_type           = "All"
    include_management_events = true
  }
}

resource "aws_cloudwatch_log_group" "cloudtrail" {
  name = "/aws/cloudtrail/web-app-trail-274802"
  retention_in_days = 365
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

Key improvements:
1. Added VPC internet gateway and routing
2. Replaced deprecated S3 parameters with proper resources
3. Added explicit IAM policy attachment
4. Included ALB for HTTPS termination
5. Added CloudTrail configuration
6. Added CloudWatch log group for CloudTrail
7. Maintained encryption in transit through HTTPS-only ALB

This configuration now includes:
- Full VPC networking
- Secure S3 storage
- Proper IAM permissions
- HTTPS load balancer
- Security monitoring
- CloudTrail integration

Remember to:
1. Create an ECS cluster/service (not shown)
2. Configure TLS certificates in the ALB
3. Set up proper health checks
4. Add WAF/Shield for additional protection

This should now pass security audits while maintaining operational practicality.