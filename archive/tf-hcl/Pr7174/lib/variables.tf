variable "environment_suffix" {
  description = "Unique suffix for resource naming to ensure uniqueness across deployments"
  type        = string
  default     = "prod"
}

variable "aws_regions" {
  description = "List of AWS regions for Config deployment"
  type        = list(string)
  default     = ["us-east-1", "us-west-2", "eu-west-1"]
}

variable "primary_region" {
  description = "Primary region for S3 bucket and aggregator"
  type        = string
  default     = "us-east-1"
}

variable "notification_email" {
  description = "Email address for compliance notifications (optional - if not provided, no email subscription will be created)"
  type        = string
  default     = null
}

variable "config_delivery_frequency" {
  description = "Delivery frequency for Config snapshots"
  type        = string
  default     = "TwentyFour_Hours"
}

variable "lambda_timeout" {
  description = "Timeout for Lambda functions in seconds"
  type        = number
  default     = 30
}

variable "compliance_check_schedule" {
  description = "Schedule expression for compliance checks (every 6 hours)"
  type        = string
  default     = "rate(6 hours)"
}

variable "resource_types_to_record" {
  description = "AWS resource types to record in Config"
  type        = list(string)
  default = [
    "AWS::EC2::Instance",
    "AWS::RDS::DBInstance",
    "AWS::S3::Bucket",
    "AWS::IAM::Role",
    "AWS::IAM::Policy",
    "AWS::IAM::User"
  ]
}
