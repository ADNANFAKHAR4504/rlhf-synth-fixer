variable "resource_suffix" {
  description = "A suffix to append to all resource names for uniqueness"
  type        = string
  default     = "dev"
}

variable "ssh_cidr_blocks" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = [] # Must be explicitly configured - no default access
}

variable "ssh_public_key" {
  description = "Public key for SSH access to EC2 instances"
  type        = string
  default     = "" # Must be provided at runtime
}

variable "db_username" {
  description = "Username for the RDS database"
  type        = string
  sensitive   = true
  default     = "admin"
}

variable "db_name" {
  description = "Name of the database to create"
  type        = string
  default     = "mydb"
}

variable "db_instance_class" {
  description = "RDS instance type"
  type        = string
  default     = "db.t3.micro"
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}