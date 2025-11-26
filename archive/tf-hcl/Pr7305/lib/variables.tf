# variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "prod"
}

variable "repository" {
  description = "Repository name for tagging"
  type        = string
  default     = "unknown"
}

variable "commit_author" {
  description = "Commit author for tagging"
  type        = string
  default     = "unknown"
}

variable "pr_number" {
  description = "PR number for tagging"
  type        = string
  default     = "unknown"
}

variable "team" {
  description = "Team name for tagging"
  type        = string
  default     = "unknown"
}

variable "spoke_region_1" {
  description = "First spoke region"
  type        = string
  default     = "us-west-2"
}

variable "spoke_region_2" {
  description = "Second spoke region"
  type        = string
  default     = "eu-west-1"
}

variable "availability_zones" {
  description = "List of availability zones to use"
  type        = list(string)
  default     = []
}

variable "vpc_configs" {
  description = "Configuration for VPCs"
  type = map(object({
    cidr_block      = string
    public_subnets  = list(string)
    private_subnets = list(string)
    tgw_subnets     = list(string)
  }))
  default = {
    prod = {
      cidr_block      = "10.0.0.0/16"
      public_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
      private_subnets = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]
      tgw_subnets     = ["10.0.100.0/28", "10.0.100.16/28", "10.0.100.32/28"]
    }
    staging = {
      cidr_block      = "10.1.0.0/16"
      public_subnets  = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
      private_subnets = ["10.1.10.0/24", "10.1.11.0/24", "10.1.12.0/24"]
      tgw_subnets     = ["10.1.100.0/28", "10.1.100.16/28", "10.1.100.32/28"]
    }
    dev = {
      cidr_block      = "10.2.0.0/16"
      public_subnets  = ["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"]
      private_subnets = ["10.2.10.0/24", "10.2.11.0/24", "10.2.12.0/24"]
      tgw_subnets     = ["10.2.100.0/28", "10.2.100.16/28", "10.2.100.32/28"]
    }
  }
}

variable "flow_logs_retention_days" {
  description = "CloudWatch Logs retention period for VPC Flow Logs"
  type        = number
  default     = 7
}

variable "blackhole_routes" {
  description = "RFC1918 ranges to blackhole"
  type        = list(string)
  default     = ["172.16.0.0/12", "192.168.0.0/16"]
}

variable "allowed_ports" {
  description = "Allowed ports for inter-VPC communication"
  type = list(object({
    port        = number
    protocol    = string
    description = string
  }))
  default = [
    { port = 443, protocol = "tcp", description = "HTTPS" },
    { port = 22, protocol = "tcp", description = "SSH" },
    { port = 3389, protocol = "tcp", description = "RDP" }
  ]
}
