# Environment
environment = "dev"

# Domain Configuration
domain_name   = "turing-tap.cloud" # Replace with your actual domain
create_zone   = true               # Creates a new Route53 zone
key_pair_name = "tap-key-pair"     # Replace with your EC2 key pair name

# Regions
regions = ["us-east-1", "eu-central-1"]

# Blue-Green Deployment
blue_green_deployment = {
  enabled      = true
  active_color = "blue"
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

# Infrastructure Configuration
instance_type    = "t3.micro"
min_size         = 2
max_size         = 4
desired_capacity = 2

# CloudFront Configuration
cloudfront_price_class     = "PriceClass_100"
cloudfront_allowed_methods = ["GET", "HEAD", "OPTIONS"]
cloudfront_cached_methods  = ["GET", "HEAD"]

# KMS Configuration
kms_deletion_window = 7

# Monitoring
log_retention_days         = 30
enable_detailed_monitoring = true
