# AWS Configuration
aws_region  = "us-east-1"
environment = "dev"

# API Configuration
api_throttle_burst_limit = 100
api_throttle_rate_limit  = 50

# Monitoring
log_retention_days  = 400
enable_xray_tracing = true
alert_email         = "platform-team@example.com"

# DynamoDB Configuration
dynamodb_billing_mode = "PAY_PER_REQUEST"

# WAF Configuration - Example blocked IPs (empty by default)
waf_block_ip_list = []

