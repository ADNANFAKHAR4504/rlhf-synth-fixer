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
