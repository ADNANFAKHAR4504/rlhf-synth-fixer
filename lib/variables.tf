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

variable "ssh_cidr_blocks" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = ["0.0.0.0/0"]  # Should be restricted in production
}

variable "ssh_public_key" {
  description = "SSH public key for EC2 instance access"
  type        = string
  default     = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDGQ4oe8Nc8FQKW+2X9l8J5K3l9V4Q5N7q8N9e8Q7Y3Z9I8O7U6I5R4E2W1Q9O8P7L6K5J4H3G2F1D0S9A8L7K6J5H4G3F2E1D0C9B8A7Z6Y5X4W3V2U1T0S9R8Q7P6O5N4M3L2K1J0I9H8G7F6E5D4C3B2A1Z0Y9X8W7V6U5T4S3R2Q1P0O9N8M7L6K5J4I3H2G1F0E9D8C7B6A5Z4Y3X2W1V0U9T8S7R6Q5P4O3N2M1L0K9J8I7H6G5F4E3D2C1B0A9Z8Y7X6W5V4U3T2S1R0Q9P8O7N6M5L4K3J2I1H0G9F8E7D6C5B4A3Z2Y1X0W9V8U7T6S5R4Q3P2O1N0M9L8K7J6I5H4G3F2E1D0C9B8A7Z6Y5X4W3V2U1T0S9 terraform-default"
}