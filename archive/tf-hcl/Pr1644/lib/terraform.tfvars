# Terraform variable values for non-interactive runs
# Adjust as needed per environment

org_prefix         = "turing"
environment        = "dev"
environment_suffix = "dev"

vpc_cidr_primary   = "10.0.0.0/16"
vpc_cidr_secondary = "10.1.0.0/16"

# Organization-approved ingress CIDR blocks
allowed_ingress_cidrs = [
  "10.0.0.0/8",
]

# Restrict to approved ports
allowed_ports = [22, 443]

# CloudWatch Logs retention for VPC Flow Logs (days)
flow_logs_retention_days = 90

# Common tags
tags = {
  Owner      = "devops"
  CostCenter = "core"
}
