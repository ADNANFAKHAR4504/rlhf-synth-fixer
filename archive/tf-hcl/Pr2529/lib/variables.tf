variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "ami_id" {
  description = "AMI ID for EC2 instances"
  type        = string
  default     = "ami-0bbc328167dee8f3c"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "s3_bucket_name" {
  description = "S3 bucket name for read-only access"
  type        = string
  default     = "my-production-bucket"
}

variable "route53_zone_name" {
  description = "Route 53 hosted zone name"
  type        = string
  default     = "example.com"
}

variable "create_route53_records" {
  description = "Whether to create Route 53 DNS records"
  type        = bool
  default     = false
}

variable "key_pair_name" {
  description = "EC2 Key Pair name"
  type        = string
  default     = ""
} 

variable "environment" {
  description = "Environment name (used as suffix for resources)"
  type        = string
  default     = "prod"
}

# Common tags
variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "Production"
    Department  = "IT"
  }
}

variable "rds_master_password" {
  description = "Master password for RDS instance"
  type        = string
  sensitive   = true
  default     = "ValidPass123"
}

