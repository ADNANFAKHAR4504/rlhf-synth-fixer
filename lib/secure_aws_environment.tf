locals {
  environment = terraform.workspace
  common_tags = {
    Environment = local.environment
    Project     = "SecureCloudInfra"
    Owner       = "DevOpsTeam"
    ManagedBy   = "Terraform"
    CostCenter  = "IT-Security"
    Compliance  = "SOC2-PCI-DSS"
  }

  # Allowed IP ranges for security groups (replace with your actual ranges)
  allowed_ip_ranges = [
    "10.0.0.0/8",    # Internal network
    "172.16.0.0/12", # Private network
    "203.0.113.0/24" # Example public IP range - replace with actual
  ]

  regions = ["us-west-1", "eu-central-1"]
}