variable "trusted_account_id" {
  description = "AWS Account ID that is allowed to assume the cross-account role"
  type        = string
  default     = "718240086340" # Replace with actual trusted account ID
}

variable "allowed_cidr_blocks" {
  description = "List of CIDR blocks allowed to access HTTP/HTTPS ports"
  type        = list(string)
  default = [
    "10.0.0.0/8",    # Private network range
    "172.16.0.0/12", # Private network range
    "192.168.0.0/16" # Private network range
  ]
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "key_pair_name" {
  description = "Name of the EC2 Key Pair for instance access (optional)"
  type        = string
  default     = null # No key pair by default for automated deployments
}

variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
  default     = ""
}
