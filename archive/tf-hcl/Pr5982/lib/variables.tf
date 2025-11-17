variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "migration"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for multi-AZ deployment"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "onprem_cidr" {
  description = "On-premises CIDR for Direct Connect routing"
  type        = string
  default     = "192.168.0.0/16"
}

variable "db_master_username" {
  description = "Master username for Aurora cluster"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_master_password" {
  description = "Master password for Aurora cluster"
  type        = string
  sensitive   = true
}

variable "onprem_db_endpoint" {
  description = "On-premises database endpoint for DMS"
  type        = string
  default     = "onprem-db.example.com"
}

variable "onprem_db_username" {
  description = "On-premises database username"
  type        = string
  sensitive   = true
}

variable "onprem_db_password" {
  description = "On-premises database password"
  type        = string
  sensitive   = true
}

variable "payment_app_image" {
  description = "Docker image for payment application"
  type        = string
  default     = "payment-app:latest"
}

variable "payment_app_port" {
  description = "Port for payment application"
  type        = number
  default     = 8080
}

variable "onprem_syslog_endpoint" {
  description = "On-premises syslog endpoint for log forwarding"
  type        = string
  default     = "syslog.onprem.example.com"
}

variable "blue_target_weight" {
  description = "Weight for blue target group (0-100)"
  type        = number
  default     = 100
}

variable "green_target_weight" {
  description = "Weight for green target group (0-100)"
  type        = number
  default     = 0
}

variable "cost_center" {
  description = "Cost center for tagging"
  type        = string
  default     = "FinTech-Payments"
}

variable "migration_phase" {
  description = "Current migration phase"
  type        = string
  default     = "preparation"
}

variable "direct_connect_gateway_id" {
  description = "Direct Connect Gateway ID for hybrid connectivity"
  type        = string
  default     = ""
}

variable "direct_connect_vif_id" {
  description = "Direct Connect Virtual Interface ID"
  type        = string
  default     = ""
}