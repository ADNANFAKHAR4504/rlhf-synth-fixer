###################
# General Configuration
###################
environment = "dev"
active_color = "blue"
owner = "DevOps Team"
cost_center = "Engineering"

###################
# Network Configuration
###################
vpc_config = {
  "us-east-1" = {
    cidr = "10.0.0.0/16"
    azs  = ["us-east-1a", "us-east-1b", "us-east-1c"]
  }
  "eu-central-1" = {
    cidr = "10.1.0.0/16"
    azs  = ["eu-central-1a", "eu-central-1b", "eu-central-1c"]
  }
}

regions = ["us-east-1", "eu-central-1"]

###################
# Application Configuration
###################
app_port = 8080
health_check_path = "/health"
instance_type = "t3.medium"
min_size = 2
max_size = 10
desired_capacity = 3

###################
# Security Configuration
###################
kms_deletion_window = 7
kms_config = {
  deletion_window_in_days = 7
  enable_key_rotation    = true
}

###################
# Monitoring Configuration
###################
log_retention_days = 30
enable_detailed_monitoring = true

###################
# Auto Scaling Configuration
###################
scale_up_threshold = 70
scale_down_threshold = 30
scale_up_cooldown = 300
scale_down_cooldown = 300

###################
# CloudFront Configuration
###################
cloudfront_price_class = "PriceClass_100"
cloudfront_allowed_methods = ["GET", "HEAD", "OPTIONS"]
cloudfront_cached_methods = ["GET", "HEAD"]

###################
# Blue-Green Deployment Configuration
###################
blue_green_deployment = {
  enabled = true
  active_color = "blue"
  weights = {
    blue  = 100
    green = 0
  }
}

###################
# DNS Configuration
###################
domain_name = "tap-dev.example.com"
create_zone = false
key_pair_name = "tap-key-pair"

###################
# Network Access Configuration
###################
allowed_ingress_cidrs = [
  "10.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16"
]

security_group_rules = {
  https_ingress = "HTTPS from allowed CIDRs"
  http_ingress  = "HTTP from allowed CIDRs"
}

###################
# Common Tags
###################
common_tags = {
  Environment = "dev"
  Project     = "iac-test-automations"
  Owner       = "DevOps Team"
  ManagedBy   = "terraform"
  CostCenter  = "Engineering"
  Purpose     = "testing"
}
