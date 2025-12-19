# Example variable values for the VPC infrastructure
# Replace placeholder values with your actual configuration

environment  = "prod"
project_name = "example-corp"
cost_center  = "engineering-infrastructure"

# Regions to deploy VPCs
regions = [
  "us-east-1",
  "us-west-2",
  "eu-central-1"
]

# Only deploy NAT Gateways in primary regions (cost optimization)
# Other regions will route through VPC peering for egress
nat_gateway_regions = [
  "us-east-1" # Primary region for Americas
  # "eu-central-1"  # Uncomment if EU needs direct egress
]

# Base CIDR for all VPCs - will be automatically subnetted
base_cidr_block = "10.0.0.0/8"

# State management configuration
state_bucket   = "example-corp-terraform-state"
state_region   = "us-east-1"
dynamodb_table = "terraform-state-lock"

# Enable VPC Flow Logs for compliance
enable_flow_logs = true