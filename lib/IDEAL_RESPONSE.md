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
