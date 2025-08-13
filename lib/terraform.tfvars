# AWS region for deployment
aws_region = "us-east-1"

# VPC ID where the security group will be created
vpc_id = "vpc-abc12345"  # Replace with your actual VPC ID

# List of allowed IPv4 CIDRs for HTTP/HTTPS inbound traffic
allowed_ipv4_cidrs = [
  "203.0.113.0/24",       # Example CIDR block
  "198.51.100.0/24"       # Add more if needed
]

# List of allowed IPv6 CIDRs for HTTP/HTTPS inbound traffic
allowed_ipv6_cidrs = [
  # "::/0"               # Uncomment to allow all IPv6 traffic
]

# Whether to allow all outbound traffic
allow_all_outbound = true

# Name of the security group
security_group_name = "app-http-https-sg"

# Description of the security group
security_group_description = "Security group allowing only HTTP/HTTPS inbound traffic from specified CIDRs"

# Tags to apply to the security group
tags = {
  Owner       = "devops"
  Environment = "dev"
  Project     = "iac-test-automations"
  ManagedBy   = "Terraform"
}

