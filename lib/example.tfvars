# Environment
environment = "dev"

# Domain Configuration
domain_name = "example.com"
create_zone = false  # Set to true if you want to create a new Route53 zone

# Blue-Green Deployment
active_color = "blue"
blue_green_deployment = {
  enabled = true
  weights = {
    blue  = 100
    green = 0
  }
}

# Common Tags
common_tags = {
  Owner       = "platform-team"
  Purpose     = "multi-region-web-app"
  Environment = "dev"
  CostCenter  = "engineering"
  Project     = "tap-stack"
  ManagedBy   = "terraform"
}

# Security
allowed_ingress_cidrs = [
  "10.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16"
]

# WAF Configuration
waf_rate_limit = 2000
