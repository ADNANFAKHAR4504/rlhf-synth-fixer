variable "resource_suffix" {
  description = "A suffix to append to all resource names for uniqueness"
  type        = string
  default     = "dev"
}

variable "db_username" {
  description = "Username for the RDS database"
  type        = string
  sensitive   = true
  default     = "admin"
}

variable "db_password" {
  description = "Password for the RDS database"
  type        = string
  sensitive   = true
  default     = "TempPassword123!"
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