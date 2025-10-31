variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to prevent conflicts"
  type        = string
}

variable "migration_phase" {
  description = "Current phase of migration (planning, transition, completed)"
  type        = string
  default     = "transition"
}

variable "vpc_id" {
  description = "ID of existing VPC (will be fetched via data source)"
  type        = string
  default     = "vpc-0a1b2c3d4e5f"
}

variable "subnet_ids" {
  description = "List of subnet IDs for multi-AZ deployment"
  type        = list(string)
  default     = ["subnet-1a2b3c4d", "subnet-5e6f7g8h"]
}

variable "availability_zones" {
  description = "Availability zones for resource deployment"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.large"
}

variable "ebs_volume_size" {
  description = "Size of EBS volumes in GB"
  type        = number
  default     = 100
}

variable "on_premises_nfs_server" {
  description = "IP address of on-premises NFS server for DataSync"
  type        = string
  default     = "10.0.0.100"
}

variable "nfs_mount_path" {
  description = "Mount path for NFS share"
  type        = string
  default     = "/data/legacy-app"
}
