variable "region" {
  default = "us-east-1"
}

variable "vpc_cidr" {
  default = "10.35.0.0/16"
}

variable "environment" {
  default = "production"
}

variable "environment_suffix" {
  type        = string
  description = "Environment suffix for resource naming to ensure uniqueness across deployments"
  default     = "production"
}

variable "allowed_ips" {
  type    = list(string)
  default = ["10.0.0.0/8"]
}

variable "notification_email" {
  type    = string
  default = "security-alerts@company.com"
}

variable "cloudhsm_cluster_id" {
  type        = string
  description = "CloudHSM cluster ID for KMS integration"
  default     = "cluster-placeholder"
}