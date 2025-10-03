```tf
module "networking" {
  source = "./modules/networking"

  vpc_cidr_block       = var.vpc_cidr_block
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  # Other parameters
}

module "compute" {
  source = "./modules/compute"

  vpc_id              = module.networking.vpc_id
  public_subnet_ids   = module.networking.public_subnet_ids
  private_subnet_ids  = module.networking.private_subnet_ids
  instance_type       = var.instance_type
  min_size            = var.asg_min_size
  max_size            = var.asg_max_size
  desired_capacity    = var.asg_desired_capacity
  # Other parameters
}

module "content_delivery" {
  source = "./modules/content_delivery"

  alb_dns_name       = module.compute.alb_dns_name
  s3_bucket_domain   = module.storage.s3_domain_name
  domain_name        = var.domain_name
  geo_restrictions   = var.geo_restrictions
  ttl_settings       = var.ttl_settings
  # Other parameters
}

module "storage" {
  source = "./modules/storage"

  bucket_name        = var.s3_bucket_name
  # Other parameters
}

module "media_processing" {
  source = "./modules/media_processing"

  # Parameters for MediaConvert
}

module "security" {
  source = "./modules/security"

  vpc_id             = module.networking.vpc_id
  alb_arn            = module.compute.alb_arn
  cloudfront_distribution_id = module.content_delivery.distribution_id
  waf_rate_limits    = var.waf_rate_limits
  # Other parameters
}

module "monitoring" {
  source = "./modules/monitoring"

  vpc_id             = module.networking.vpc_id
  alb_arn            = module.compute.alb_arn
  asg_name           = module.compute.asg_name
  cloudfront_distribution_id = module.content_delivery.distribution_id
  # Other parameters
}
```

```tf
# outputs.tf
output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.networking.vpc_id
}

output "alb_dns_name" {
  description = "The DNS name of the Application Load Balancer"
  value       = module.compute.alb_dns_name
}

output "cloudfront_distribution_id" {
  description = "The ID of the CloudFront distribution"
  value       = module.content_delivery.distribution_id
}

output "cloudfront_domain_name" {
  description = "The domain name of the CloudFront distribution"
  value       = module.content_delivery.domain_name
}

output "s3_bucket_name" {
  description = "The name of the S3 bucket for video storage"
  value       = module.storage.bucket_name
}

output "media_convert_queue_arn" {
  description = "The ARN of the MediaConvert queue"
  value       = module.media_processing.queue_arn
}

output "waf_web_acl_id" {
  description = "The ID of the WAF Web ACL"
  value       = module.security.web_acl_id
}

output "sns_topic_arn" {
  description = "The ARN of the SNS topic for alerts"
  value       = module.monitoring.sns_topic_arn
}
```

```tf
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

  default_tags {
    tags = var.default_tags
  }
}
```

```tf
# variables.tf
# variables.tf

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "default_tags" {
  description = "Default tags for all resources"
  type        = map(string)
  default = {
    Environment = "Production"
    Project     = "MediaStreamingPlatform"
    ManagedBy   = "Terraform"
  }
}

variable "vpc_cidr_block" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.11.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones to use"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for the public subnets"
  type        = list(string)
  default     = ["10.11.0.0/24", "10.11.1.0/24", "10.11.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for the private subnets"
  type        = list(string)
  default     = ["10.11.10.0/24", "10.11.11.0/24", "10.11.12.0/24"]
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "m5.large"
}

variable "asg_min_size" {
  description = "Minimum size of the Auto Scaling Group"
  type        = number
  default     = 2
}

variable "asg_max_size" {
  description = "Maximum size of the Auto Scaling Group"
  type        = number
  default     = 10
}

variable "asg_desired_capacity" {
  description = "Desired capacity of the Auto Scaling Group"
  type        = number
  default     = 4
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
}

variable "geo_restrictions" {
  description = "Geo restriction settings for CloudFront"
  type = object({
    restriction_type = string
    locations        = list(string)
  })
  default = {
    restriction_type = "whitelist"
    locations        = ["US", "CA", "GB", "DE"]
  }
}

variable "ttl_settings" {
  description = "TTL settings for CloudFront cache behaviors"
  type = object({
    min_ttl     = number
    default_ttl = number
    max_ttl     = number
  })
  default = {
    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }
}

variable "s3_bucket_name" {
  description = "Name for the S3 bucket for video storage"
  type        = string
}

variable "waf_rate_limits" {
  description = "Rate limiting rules for WAF"
  type = list(object({
    name        = string
    priority    = number
    limit       = number
    metric_name = string
  }))
  default = [
    {
      name        = "AverageRateLimit"
      priority    = 1
      limit       = 2000
      metric_name = "AverageRateLimit"
    }
  ]
}

variable "regions" {
  description = "List of AWS regions for latency-based routing"
  type        = list(string)
  default     = ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"]
}
```

## Module Files

### Networking Module

```hcl
# modules/networking/main.tf
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr_block
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = {
    Name = "media-streaming-vpc"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = {
    Name = "media-streaming-igw"
  }
}

resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "public-subnet-${var.availability_zones[count.index]}"
  }
}

resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]
  
  tags = {
    Name = "private-subnet-${var.availability_zones[count.index]}"
  }
}

resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"
  
  tags = {
    Name = "nat-eip-${var.availability_zones[count.index]}"
  }
}

resource "aws_nat_gateway" "main" {
  count         = length(var.availability_zones)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = {
    Name = "nat-gateway-${var.availability_zones[count.index]}"
  }
  
  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = {
    Name = "public-route-table"
  }
}

resource "aws_route_table" "private" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = {
    Name = "private-route-table-${var.availability_zones[count.index]}"
  }
}

resource "aws_route_table_association" "public" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

```hcl
# modules/networking/variables.tf
variable "vpc_cidr_block" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones to use"
  type        = list(string)
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for the public subnets"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for the private subnets"
  type        = list(string)
}
```

```hcl
# modules/networking/outputs.tf
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}
```

### Compute Module

```hcl
# modules/compute/main.tf
resource "aws_security_group" "alb" {
  name        = "alb-security-group"
  description = "Security group for the Application Load Balancer"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
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
}

resource "aws_security_group" "instance" {
  name        = "instance-security-group"
  description = "Security group for the EC2 instances"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_lb" "main" {
  name               = "media-streaming-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids
  
  enable_deletion_protection = true
  
  tags = {
    Name = "media-streaming-alb"
  }
}

resource "aws_lb_target_group" "main" {
  name     = "media-streaming-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id
  
  health_check {
    path                = "/health"
    port                = "traffic-port"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"
  
  default_action {
    type = "redirect"
    
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = var.certificate_arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

resource "aws_launch_template" "main" {
  name_prefix   = "media-streaming-lt-"
  image_id      = var.ami_id
  instance_type = var.instance_type
  
  vpc_security_group_ids = [aws_security_group.instance.id]
  
  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    ssm_parameter_path = var.ssm_parameter_path
  }))
  
  iam_instance_profile {
    name = aws_iam_instance_profile.main.name
  }
  
  block_device_mappings {
    device_name = "/dev/sda1"
    
    ebs {
      volume_size = 20
      volume_type = "gp3"
      encrypted   = true
    }
  }
  
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_iam_role" "instance" {
  name = "ec2-instance-role"
  
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
}

resource "aws_iam_instance_profile" "main" {
  name = "ec2-instance-profile"
  role = aws_iam_role.instance.name
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_autoscaling_group" "main" {
  name                = "media-streaming-asg"
  min_size            = var.min_size
  max_size            = var.max_size
  desired_capacity    = var.desired_capacity
  vpc_zone_identifier = var.private_subnet_ids
  
  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }
  
  target_group_arns = [aws_lb_target_group.main.arn]
  
  health_check_type         = "ELB"
  health_check_grace_period = 300
  
  tag {
    key                 = "Name"
    value               = "media-streaming-instance"
    propagate_at_launch = true
  }
  
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_policy" "cpu" {
  name                   = "cpu-tracking-policy"
  policy_type            = "TargetTrackingScaling"
  autoscaling_group_name = aws_autoscaling_group.main.name
  
  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    
    target_value     = 75.0
    disable_scale_in = false
  }
}

resource "aws_autoscaling_policy" "custom_metric" {
  name                   = "custom-metric-tracking-policy"
  policy_type            = "TargetTrackingScaling"
  autoscaling_group_name = aws_autoscaling_group.main.name
  
  target_tracking_configuration {
    customized_metric_specification {
      metric_dimension {
        name  = "AutoScalingGroupName"
        value = aws_autoscaling_group.main.name
      }
      metric_name = "ConcurrentViewers"
      namespace   = "AWS/MediaStreaming"
      statistic   = "Average"
    }
    
    target_value     = 500
    disable_scale_in = false
  }
}```

```hcl
variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "public_subnet_ids" {
  description = "IDs of the public subnets"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "IDs of the private subnets"
  type        = list(string)
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "min_size" {
  description = "Minimum size of the Auto Scaling Group"
  type        = number
}

variable "max_size" {
  description = "Maximum size of the Auto Scaling Group"
  type        = number
}

variable "desired_capacity" {
  description = "Desired capacity of the Auto Scaling Group"
  type        = number
}

variable "ami_id" {
  description = "AMI ID for EC2 instances"
  type        = string
  default     = "ami-0c55b159cbfafe1f0" # Amazon Linux 2 in us-east-1
}

variable "certificate_arn" {
  description = "ARN of the SSL certificate for HTTPS listener"
  type        = string
  default     = ""
}

variable "ssm_parameter_path" {
  description = "SSM parameter path for configuration"
  type        = string
  default     = "/media-streaming/config"
}
```

```hcl
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "asg_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.main.name
}
```

### Storage Module

```hcl
# modules/storage/main.tf
resource "aws_s3_bucket" "video_storage" {
  bucket = var.bucket_name
  
  tags = {
    Name = "media-streaming-video-storage"
  }
}

resource "aws_s3_bucket_ownership_controls" "video_storage" {
  bucket = aws_s3_bucket.video_storage.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "video_storage" {
  depends_on = [aws_s3_bucket_ownership_controls.video_storage]
  bucket     = aws_s3_bucket.video_storage.id
  acl        = "private"
}

resource "aws_s3_bucket_versioning" "video_storage" {
  bucket = aws_s3_bucket.video_storage.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "video_storage" {
  bucket = aws_s3_bucket.video_storage.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_intelligent_tiering_configuration" "video_storage" {
  bucket = aws_s3_bucket.video_storage.id
  name   = "EntireBucket"
  
  tiering {
    access_tier = "DEEP_ARCHIVE_ACCESS"
    days        = 180
  }
  
  tiering {
    access_tier = "ARCHIVE_ACCESS"
    days        = 90
  }
}

resource "aws_s3_bucket_accelerate_configuration" "video_storage" {
  bucket = aws_s3_bucket.video_storage.id
  status = "Enabled"
}

resource "aws_s3_bucket_cors_configuration" "video_storage" {
  bucket = aws_s3_bucket.video_storage.id
  
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "video_storage" {
  bucket = aws_s3_bucket.video_storage.id
  
  rule {
    id     = "transition-to-intelligent-tiering"
    status = "Enabled"
    
    filter {
      prefix = "videos/"
    }
    
    transition {
      days          = 30
      storage_class = "INTELLIGENT_TIERING"
    }
  }
}

resource "aws_s3_bucket_policy" "video_storage" {
  count  = var.cloudfront_oai_iam_arn != "" ? 1 : 0
  bucket = aws_s3_bucket.video_storage.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = "s3:GetObject"
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.video_storage.arn}/*"
        Principal = {
          AWS = var.cloudfront_oai_iam_arn
        }
      }
    ]
  })
}```

```hcl
variable "bucket_name" {
  description = "Name for the S3 bucket for video storage"
  type        = string
}

variable "cloudfront_oai_iam_arn" {
  description = "IAM ARN of the CloudFront Origin Access Identity"
  type        = string
  default     = ""
}
```

```hcl
output "s3_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.video_storage.bucket_regional_domain_name
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.video_storage.arn
}

output "bucket_id" {
  description = "ID of the S3 bucket"
  value       = aws_s3_bucket.video_storage.id
}

output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.video_storage.bucket
}
```

### Content Delivery Module

```hcl
# modules/content_delivery/main.tf
resource "aws_cloudfront_origin_access_identity" "main" {
  comment = "OAI for media streaming platform"
}

resource "aws_cloudfront_distribution" "main" {
  origin {
    domain_name = var.alb_dns_name
    origin_id   = "ALB"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  
  origin {
    domain_name = var.s3_bucket_domain
    origin_id   = "S3"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }
  
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront distribution for media streaming platform"
  default_root_object = "index.html"
  
  # Price class determines the locations where content will be served from
  price_class = "PriceClass_All"
  
  # Geo-restriction
  restrictions {
    geo_restriction {
      restriction_type = var.geo_restrictions.restriction_type
      locations        = var.geo_restrictions.locations
    }
  }
  
  # Default cache behavior (S3 origin)
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3"
    
    forwarded_values {
      query_string = false
      
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = var.ttl_settings.min_ttl
    default_ttl            = var.ttl_settings.default_ttl
    max_ttl                = var.ttl_settings.max_ttl
    compress               = true
    
    lambda_function_association {
      event_type   = "viewer-request"
      lambda_arn   = aws_lambda_function.edge_request.qualified_arn
      include_body = false
    }
  }
  
  # Additional cache behavior for API requests (ALB origin)
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALB"
    
    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]
      
      cookies {
        forward = "all"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }
  
  # Cache behavior for video content
  ordered_cache_behavior {
    path_pattern     = "/videos/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3"
    
    forwarded_values {
      query_string = true
      headers      = ["Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]
      
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = var.ttl_settings.min_ttl
    default_ttl            = var.ttl_settings.default_ttl
    max_ttl                = var.ttl_settings.max_ttl
    compress               = true
  }
  
  viewer_certificate {
    acm_certificate_arn      = var.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
  
  tags = {
    Name = "media-streaming-cdn"
  }
}

# Lambda@Edge for request routing and A/B testing
resource "aws_iam_role" "lambda_edge" {
  name = "lambda-edge-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = ["lambda.amazonaws.com", "edgelambda.amazonaws.com"]
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_edge" {
  name = "lambda-edge-policy"
  role = aws_iam_role.lambda_edge.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# Lambda@Edge function for request routing
data "archive_file" "edge_request" {
  type        = "zip"
  output_path = "${path.module}/lambda_edge_request.zip"
  source {
    content  = templatefile("${path.module}/edge_request.js", {})
    filename = "index.js"
  }
}

resource "aws_lambda_function" "edge_request" {
  filename      = data.archive_file.edge_request.output_path
  function_name = "edge-request-router"
  role          = aws_iam_role.lambda_edge.arn
  handler       = "index.handler"
  runtime       = "nodejs14.x"
  publish       = true
  
  lifecycle {
    ignore_changes = [filename]
  }
}

# Route53 configuration removed - no domain available for this deployment
# To enable Route53:
# 1. Register a domain or use an existing hosted zone
# 2. Uncomment the resources below and provide hosted_zone_id variable
# 3. Update content_delivery module call in main.tf with hosted_zone_id parameter

# resource "aws_route53_record" "main" {
#   zone_id = var.hosted_zone_id
#   name    = var.domain_name
#   type    = "A"
#   
#   alias {
#     name                   = aws_cloudfront_distribution.main.domain_name
#     zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
#     evaluate_target_health = false
#   }
# }

# resource "aws_route53_record" "regional" {
#   for_each = toset(var.regions)
#   
#   zone_id        = var.hosted_zone_id
#   name           = "regional-${each.key}.${var.domain_name}"
#   type           = "A"
#   set_identifier = each.key
#   
#   alias {
#     name                   = aws_cloudfront_distribution.main.domain_name
#     zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
#     evaluate_target_health = true
#   }
#   
#   latency_routing_policy {
#     region = each.key
#   }
# }```

```hcl
variable "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  type        = string
}

variable "s3_bucket_domain" {
  description = "Domain name of the S3 bucket"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
}

variable "geo_restrictions" {
  description = "Geo restriction settings for CloudFront"
  type = object({
    restriction_type = string
    locations        = list(string)
  })
}

variable "ttl_settings" {
  description = "TTL settings for CloudFront cache behaviors"
  type = object({
    min_ttl     = number
    default_ttl = number
    max_ttl     = number
  })
}

variable "certificate_arn" {
  description = "ARN of the SSL certificate for CloudFront"
  type        = string
  default     = ""
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID"
  type        = string
  default     = ""
}

variable "regions" {
  description = "List of AWS regions for latency-based routing"
  type        = list(string)
}
```

```hcl
output "distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.id
}

output "distribution_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "cloudfront_oai_iam_arn" {
  description = "IAM ARN of the CloudFront Origin Access Identity"
  value       = aws_cloudfront_origin_access_identity.main.iam_arn
}
```

### Media Processing Module

```hcl
# modules/media_processing/main.tf
resource "aws_iam_role" "media_convert" {
  name = "media-convert-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "mediaconvert.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "media_convert" {
  name = "media-convert-policy"
  role = aws_iam_role.media_convert.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Effect   = "Allow"
        Resource = [
          var.source_bucket_arn,
          "${var.source_bucket_arn}/*",
          var.destination_bucket_arn,
          "${var.destination_bucket_arn}/*"
        ]
      }
    ]
  })
}

resource "aws_media_convert_queue" "main" {
  name = "media-streaming-queue"
  
  tags = {
    Name = "media-streaming-queue"
  }
}

# Create a MediaConvert job template for standard video transcoding
resource "aws_cloudformation_stack" "job_template" {
  name = "media-convert-job-template"
  
  template_body = templatefile("${path.module}/job_template.json", {
    role_arn = aws_iam_role.media_convert.arn
    queue_arn = aws_media_convert_queue.main.arn
  })
  
  capabilities = ["CAPABILITY_NAMED_IAM"]
}

# Lambda function to trigger MediaConvert jobs when new videos are uploaded to S3
resource "aws_iam_role" "lambda_media_convert_trigger" {
  name = "lambda-media-convert-trigger-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_media_convert_trigger" {
  name = "lambda-media-convert-trigger-policy"
  role = aws_iam_role.lambda_media_convert_trigger.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Action = [
          "s3:GetObject"
        ]
        Effect   = "Allow"
        Resource = "${var.source_bucket_arn}/*"
      },
      {
        Action = [
          "mediaconvert:CreateJob",
          "mediaconvert:GetJobTemplate"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action = [
          "iam:PassRole"
        ]
        Effect   = "Allow"
        Resource = aws_iam_role.media_convert.arn
      }
    ]
  })
}

data "archive_file" "media_convert_trigger" {
  type        = "zip"
  output_path = "${path.module}/lambda_media_convert_trigger.zip"
  source {
    content  = templatefile("${path.module}/media_convert_trigger.js", {
      job_template_name = aws_cloudformation_stack.job_template.outputs.JobTemplateName
      role_arn = aws_iam_role.media_convert.arn
      destination_bucket = var.destination_bucket
      mediaconvert_endpoint = var.mediaconvert_endpoint
    })
    filename = "index.js"
  }
}

resource "aws_lambda_function" "media_convert_trigger" {
  filename      = data.archive_file.media_convert_trigger.output_path
  function_name = "media-convert-trigger"
  role          = aws_iam_role.lambda_media_convert_trigger.arn
  handler       = "index.handler"
  runtime       = "nodejs14.x"
  
  environment {
    variables = {
      JOB_TEMPLATE_NAME   = aws_cloudformation_stack.job_template.outputs.JobTemplateName
      ROLE_ARN            = aws_iam_role.media_convert.arn
      DESTINATION_BUCKET  = var.destination_bucket
      MEDIACONVERT_ENDPOINT = var.mediaconvert_endpoint
    }
  }
  
  lifecycle {
    ignore_changes = [filename]
  }
}

resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowExecutionFromS3"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.media_convert_trigger.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = var.source_bucket_arn
}

resource "aws_s3_bucket_notification" "bucket_notification" {
  bucket = var.source_bucket_id
  
  lambda_function {
    lambda_function_arn = aws_lambda_function.media_convert_trigger.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploads/"
    filter_suffix       = ".mp4"
  }
}```

```hcl
variable "source_bucket_arn" {
  description = "ARN of the source S3 bucket"
  type        = string
  default     = ""
}

variable "source_bucket_id" {
  description = "ID of the source S3 bucket"
  type        = string
  default     = ""
}

variable "destination_bucket_arn" {
  description = "ARN of the destination S3 bucket"
  type        = string
  default     = ""
}

variable "destination_bucket" {
  description = "Name of the destination S3 bucket"
  type        = string
  default     = ""
}

variable "mediaconvert_endpoint" {
  description = "MediaConvert endpoint URL"
  type        = string
  default     = ""
}
```

```hcl
output "media_convert_queue_arn" {
  description = "ARN of the MediaConvert queue"
  value       = aws_media_convert_queue.main.arn
}

output "media_convert_role_arn" {
  description = "ARN of the MediaConvert IAM role"
  value       = aws_iam_role.media_convert.arn
}
```

### Security Module

```hcl
# modules/security/main.tf
# WAF setup with rate limiting
resource "aws_wafv2_web_acl" "main" {
  name        = "media-streaming-waf"
  description = "WAF for media streaming platform"
  scope       = "CLOUDFRONT"
  
  default_action {
    allow {}
  }
  
  # AWS managed rule sets
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 0
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesCommonRuleSet"
      sampled_requests_enabled   = true
    }
  }
  
  # SQL Injection protection
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 1
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesSQLiRuleSet"
      sampled_requests_enabled   = true
    }
  }
  
  # Custom rate limiting rule
  dynamic "rule" {
    for_each = var.waf_rate_limits
    
    content {
      name     = rule.value.name
      priority = rule.value.priority
      
      action {
        block {}
      }
      
      statement {
        rate_based_statement {
          limit              = rule.value.limit
          aggregate_key_type = "IP"
        }
      }
      
      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = rule.value.metric_name
        sampled_requests_enabled   = true
      }
    }
  }
  
  # Geo-blocking rule
  rule {
    name     = "GeoBlockRule"
    priority = length(var.waf_rate_limits) + 2
    
    action {
      block {}
    }
    
    statement {
      geo_match_statement {
        country_codes = var.blocked_countries
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "GeoBlockRule"
      sampled_requests_enabled   = true
    }
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "media-streaming-waf"
    sampled_requests_enabled   = true
  }
}

# AWS Shield Standard is enabled by default for CloudFront distributions
# We'll associate the WAF ACL with CloudFront
resource "aws_wafv2_web_acl_association" "cloudfront" {
  resource_arn = var.cloudfront_distribution_arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

# Security Groups
resource "aws_security_group" "bastion" {
  name        = "bastion-security-group"
  description = "Security group for the bastion host"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.bastion_allowed_cidr
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Network ACLs
resource "aws_network_acl" "public" {
  vpc_id     = var.vpc_id
  subnet_ids = var.public_subnet_ids
  
  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }
  
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }
  
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }
  
  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = var.bastion_allowed_cidr[0]
    from_port  = 22
    to_port    = 22
  }
  
  ingress {
    protocol   = "tcp"
    rule_no    = 130
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }
}

resource "aws_network_acl" "private" {
  vpc_id     = var.vpc_id
  subnet_ids = var.private_subnet_ids
  
  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }
  
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = var.vpc_cidr_block
    from_port  = 0
    to_port    = 65535
  }
  
  ingress {
    protocol   = "udp"
    rule_no    = 110
    action     = "allow"
    cidr_block = var.vpc_cidr_block
    from_port  = 0
    to_port    = 65535
  }
  
  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }
}```

```hcl
variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "alb_arn" {
  description = "ARN of the Application Load Balancer"
  type        = string
}

variable "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  type        = string
}

variable "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  type        = string
  default     = ""
}

variable "waf_rate_limits" {
  description = "Rate limiting rules for WAF"
  type = list(object({
    name        = string
    priority    = number
    limit       = number
    metric_name = string
  }))
}

variable "blocked_countries" {
  description = "List of country codes to block"
  type        = list(string)
  default     = []
}

variable "bastion_allowed_cidr" {
  description = "CIDR blocks allowed to access bastion host"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "public_subnet_ids" {
  description = "IDs of the public subnets"
  type        = list(string)
  default     = []
}

variable "private_subnet_ids" {
  description = "IDs of the private subnets"
  type        = list(string)
  default     = []
}

variable "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  type        = string
  default     = ""
}
```

```hcl
output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.id
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.arn
}
```

### Monitoring Module

```hcl
# modules/monitoring/main.tf
# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "high-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "60"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    AutoScalingGroupName = var.asg_name
  }
}

resource "aws_cloudwatch_metric_alarm" "high_memory" {
  alarm_name          = "high-memory-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "CWAgent"
  period              = "60"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 memory utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    AutoScalingGroupName = var.asg_name
  }
}

resource "aws_cloudwatch_metric_alarm" "error_rate" {
  alarm_name          = "high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors ALB 5XX error count"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    LoadBalancer = var.alb_name
  }
}

resource "aws_cloudwatch_metric_alarm" "high_latency" {
  alarm_name          = "high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors ALB target response time"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    LoadBalancer = var.alb_name
    TargetGroup  = var.target_group_arn
  }
}

# Custom CloudWatch dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "MediaStreamingPlatform"
  
  dashboard_body = templatefile("${path.module}/dashboard.json", {
    region = var.aws_region
    asg_name = var.asg_name
    alb_name = var.alb_name
    target_group_arn = var.target_group_arn
    cloudfront_distribution_id = var.cloudfront_distribution_id
  })
}

# CloudWatch Logs
resource "aws_cloudwatch_log_group" "app" {
  name              = "/media-streaming/application"
  retention_in_days = 30
  
  tags = {
    Name = "media-streaming-app-logs"
  }
}

resource "aws_cloudwatch_log_group" "alb" {
  name              = "/aws/alb/media-streaming-alb/access"
  retention_in_days = 30
  
  tags = {
    Name = "media-streaming-alb-logs"
  }
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "media-streaming-alerts"
}

# Custom metrics
resource "aws_cloudwatch_log_metric_filter" "concurrent_viewers" {
  name           = "ConcurrentViewers"
  pattern        = "{ $.event = \"session_start\" }"
  log_group_name = aws_cloudwatch_log_group.app.name
  
  metric_transformation {
    name      = "ConcurrentViewers"
    namespace = "AWS/MediaStreaming"
    value     = "1"
    default_value = "0"
  }
}

# AWS Systems Manager Parameter Store
resource "aws_ssm_parameter" "app_config" {
  name        = "/media-streaming/config"
  description = "Media Streaming Platform Configuration"
  type        = "SecureString"
  value       = jsonencode(var.app_config)
  
  tags = {
    Name = "media-streaming-app-config"
  }
}

# CloudWatch Events for monitoring
resource "aws_cloudwatch_event_rule" "asg_changes" {
  name        = "asg-changes"
  description = "Capture Auto Scaling Group changes"
  
  event_pattern = jsonencode({
    source      = ["aws.autoscaling"]
    detail_type = ["EC2 Instance Launch Successful", "EC2 Instance Terminate Successful"]
    detail      = {
      AutoScalingGroupName = [var.asg_name]
    }
  })
}

resource "aws_cloudwatch_event_target" "sns" {
  rule      = aws_cloudwatch_event_rule.asg_changes.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.alerts.arn
}```

```hcl
variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "alb_arn" {
  description = "ARN of the Application Load Balancer"
  type        = string
}

variable "alb_name" {
  description = "Name of the Application Load Balancer"
  type        = string
  default     = ""
}

variable "target_group_arn" {
  description = "ARN of the target group"
  type        = string
  default     = ""
}

variable "asg_name" {
  description = "Name of the Auto Scaling Group"
  type        = string
}

variable "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  type        = string
}

variable "app_config" {
  description = "Application configuration"
  type        = map(string)
  default     = {}
}
```

```hcl
output "dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:"
}
```
